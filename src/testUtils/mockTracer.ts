import { Span } from "../index";

export default class MockTracer {
	finish: () => void;
	constructor({ finish }: { finish: () => void }) {
		this.finish = finish;
	}

	startSpan(spanName: string, { childOf }: { childOf?: Span } = {}) {
		return {
			name: spanName,
			finish: this.finish,
			log: jest.fn(),
			childOf
		};
	}
	inject(span: Span, _: any, headers: { [key: string]: string }) {
		headers["X-B3-TraceId"] = "traceId";
		headers["X-B3-SpanId"] = "spanId";
	}
}
