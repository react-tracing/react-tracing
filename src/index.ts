// @flow
import * as Tracer from "zipkin-javascript-opentracing";
import * as zipkin from "zipkin";
import { HttpLogger } from "zipkin-transport-http";
import Stack from "./stack";
import { TraceId } from "zipkin";

const defaultGetSpanName = ({
	url,
	method,
	body
}: {
	url: string;
	method: string;
	body: string;
}) => `${url}-${method}`;

export interface Span {
	name?: string;
	log({ [string]: string }): void;
	finish(): void;
	id: TraceId;

	setTag(key: string, value: any): void;
}

type startSpanOptions = {
	childOf?: Span;
};

type FetchImplementationType = (
	endpoint: string,
	args?: object
) => Promise<any>;
type ExplicitTracerDeclaration = {
	tracer: Tracer;
};

type ImplicitTracerDeclaration = {
	tracer: null;
	serviceName: string;
	endpoint: string;
};

type spanNameArguments = {
	url: string;
	method: string;
	body: string;
};

type TracerOptions =
	| ExplicitTracerDeclaration
	| ImplicitTracerDeclaration;
type FetchOptions = {
	fetch?: FetchImplementationType;
	getSpanName?: (spanNameArguments: spanNameArguments) => string;
};

type InitGlobalNetworkTracerOptions = {
	getSpanName?: (spanNameArguments: spanNameArguments) => string;
};

class Tracing {
	stack: Stack<Span>;
	tracer: Tracer;

	private _tracing_current_span?: Span;

	constructor(options: TracerOptions) {
		this.tracer =
			options.tracer ||
			new Tracer({
				serviceName: (options as ImplicitTracerDeclaration)
					.serviceName,
				recorder: new zipkin.BatchRecorder({
					logger: new HttpLogger({
						endpoint: (options as ImplicitTracerDeclaration).endpoint
					})
				}),
				kind: "client"
			});

		this.stack = new Stack();
	}

	fetch(
		{
			fetch: externalFetchImplementation,
			getSpanName
		}: FetchOptions = {}
	): FetchImplementationType {
		const fetchImplementation =
			externalFetchImplementation || (window || global || self).fetch;
		if (typeof fetchImplementation !== "function") {
			throw new Error(
				"fetch implementation is neither supplied nor could it be guessed from window, global or self"
			);
		}

		const getName = getSpanName || defaultGetSpanName;
		const reactTracingFetch = (
			url: string,
			options: {
				method?: string;
				body?: string;
				headers?: object;
			} = {}
		) => {
			const { method = "GET", body = "" } = options;
			const spanName = getName({ url, method, body });

			const span = this.startSpan(
				spanName,
				this._tracing_current_span
			);
			const headers = options.headers || {};
			this.tracer.inject(span, Tracer.FORMAT_HTTP_HEADERS, headers);

			const success = (
				span: startSpanOptions & Span,
				result: any
			) => {
				this.finishSpan(span);
				// $FlowFixMe
				this._tracing_current_span = span.childOf;
				return result;
			};

			const failure = (span: startSpanOptions & Span, err: any) => {
				this.finishSpan(span);
				// $FlowFixMe
				this._tracing_current_span = span.childOf;
				throw err;
			};

			return fetchImplementation(url, { ...options, headers }).then(
				success.bind(this, span),
				failure.bind(this, span)
			);
		};

		return reactTracingFetch;
	}

	initGlobalNetworkTracer(
		{ getSpanName }: InitGlobalNetworkTracerOptions = {}
	) {
		const getName = getSpanName || defaultGetSpanName;
		const globalScope = window || global || self;
		if (typeof globalScope.fetch === "function") {
			const originalFetch = globalScope.fetch;
			globalScope.fetch = this.fetch({ fetch: originalFetch });
		}
	}

	startSpan(name: string, parent?: Span): Span {
		let parentSpan = parent;
		if (!parentSpan) {
			try {
				parentSpan = this.stack.peek();
			} catch (e) {
				// Don't use a parent span, be a root span
			}
		}

		const span = this.tracer.startSpan(name, { childOf: parentSpan });
		this.stack.push(span);
		return span;
	}

	log(options: { [key: string]: string }): void {
		const span = this.stack.peek();
		span.log(options);
	}

	finishSpan(span: Span | undefined): void {
		let s: Span | undefined;
		if (span) {
			s = span;
			this.stack.remove(span);
		} else {
			s = this.stack.pop();
		}

		if (s) {
			s.finish();
		}
	}

	// Private API
	get openSpans(): Array<Span> {
		return this.stack.list;
	}
}

module.exports = Tracing;
