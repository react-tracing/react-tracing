declare module "zipkin-javascript-opentracing" {
	import { BatchRecorder, TraceId, option } from "zipkin";

	class Tracing {
		static FORMAT_TEXT_MAP: "FORMAT_TEXT_MAP";
		static FORMAT_HTTP_HEADERS: "FORMAT_HTTP_HEADERS";
		static FORMAT_BINARY: "FORMAT_BINARY";

		static makeOptional<T>(val: T): option.IOption<T>;
		constructor(options: Tracing.TracingOptions);

		// TODO
		startSpan(
			name: string,
			options?: Tracing.SpanOptions
		): Tracing.Span;

		inject(
			span: Tracing.Span,
			format: typeof Tracing.FORMAT_HTTP_HEADERS,
			carrier: object
		): void;

		extract(
			format: typeof Tracing.FORMAT_HTTP_HEADERS,
			carrier: object
		): Tracing.Span;
	}

	namespace Tracing {
		export type TracingOptions = {
			serviceName: string;
			endpoint?: string;
			recorder?: BatchRecorder;
			kind: "local" | "client" | "server";
			sampler?: (traceId: TraceId) => boolean;
		};

		export type Span = {
			id: TraceId;

			log(obj?: object): void;
			setTag(key: string, value: any): void;

			finish(): void;
		};

		export type SpanOptions = {
			traceId?: TraceId;
			childOf?: Span;
		};
	}

	export = Tracing;
}
