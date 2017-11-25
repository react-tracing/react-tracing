// @flow
import OpentracingZipkin from "zipkin-javascript-opentracing";
import zipkin from "zipkin";
import { HttpLogger } from "zipkin-transport-http";
import Stack from "./stack";

const defaultGetSpanName = ({ url, method, body }) =>
	`${url}-${method}`;

interface Span {
	name?: string;
	log({ [string]: string }): void;
	finish(): void;
}

type startSpanOptions = {
	childOf?: ?Span
};

interface TracerType {
	startSpan(spanName: string, options?: ?startSpanOptions): Span;
	inject(span: Span, format: string, headers: Object): void;
}

type FetchImplementationType = (
	endpoint: string,
	args?: Object
) => Promise<any>;
type ExplicitTracerDeclaration = {
	tracer: TracerType
};

type ImplicitTracerDeclaration = {
	tracer: null,
	serviceName: string,
	endpoint: string
};

type spanNameArguments = {
	url: string,
	method: string,
	body: string
};

type TracerOptions =
	| ExplicitTracerDeclaration
	| ImplicitTracerDeclaration;
type FetchOptions = {
	fetch?: FetchImplementationType,
	getSpanName?: spanNameArguments => string
};

type InitGlobalNetworkTracerOptions = {
	getSpanName?: spanNameArguments => string
};

class Tracing {
	stack: Stack<Span>;
	tracer: TracerType;

	constructor(options: TracerOptions) {
		this.tracer =
			options.tracer ||
			OpentracingZipkin({
				serviceName: options.serviceName,
				recorder: new zipkin.BatchRecorder({
					logger: new HttpLogger({
						endpoint: options.endpoint
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
		const reactTracingFetch = (url, options = {}) => {
			const { method = "GET", body = "" } = options;
			const spanName = getName({ url, method, body });

			const span = this.startSpan(spanName);
			const headers = options.headers || {};
			this.tracer.inject(
				span,
				OpentracingZipkin.FORMAT_HTTP_HEADERS,
				headers
			);

			function success(span, result) {
				this.finishSpan(span);
				return result;
			}

			function failure(span, err) {
				this.finishSpan(span);
				throw err;
			}

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

	startSpan(name: string): Span {
		let parentSpan;
		try {
			parentSpan = this.stack.peek();
		} catch (e) {
			// Don't use a parent span, be a root span
		}

		const span = this.tracer.startSpan(name, { childOf: parentSpan });
		this.stack.push(span);
		return span;
	}

	log(options: { [string]: string }): void {
		const span = this.stack.peek();
		span.log(options);
	}

	finishSpan(span: ?Span): void {
		let s;
		if (span) {
			s = span;
			this.stack.remove(span);
		} else {
			s = this.stack.pop();
		}

		s.finish();
	}

	// Private API
	get openSpans(): Array<Span> {
		return this.stack.list;
	}
}

module.exports = Tracing;
