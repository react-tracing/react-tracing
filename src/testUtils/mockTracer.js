export default class MockTracer {
  finish: () => void;
  constructor({ finish }) {
    this.finish = finish;
  }

  startSpan(spanName) {
    return { name: spanName, finish: this.finish, log: jest.fn() };
  }
  inject(span, _, headers) {
    headers["X-B3-TraceId"] = "traceId";
    headers["X-B3-SpanId"] = "spanId";
  }
}
