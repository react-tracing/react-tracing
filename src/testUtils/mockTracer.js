export default class MockTracer {
	finish: () => void;
	constructor({ finish }) {
		this.finish = finish;
	}

	startSpan(spanName, { childOf } = {}) {
		return {
			name: spanName,
			finish: this.finish,
			log: jest.fn(),
			childOf
		};
	}
	inject(span, _, headers) {
		headers["X-B3-TraceId"] = "traceId";
		headers["X-B3-SpanId"] = "spanId";
	}
}
