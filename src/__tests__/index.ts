// @flow
import MockTracer from "../testUtils/mockTracer";
import { Span } from "../index";

declare var fail: Function;
const Tracing = require("../");

describe("react-tracing", () => {
	describe("opentracing forwarding", () => {
		let tracer: any, finishMock: any;

		beforeEach(() => {
			finishMock = jest.fn();
			tracer = new Tracing({
				tracer: new MockTracer({ finish: finishMock })
			});
		});

		it("should be able to start a span", () => {
			tracer.startSpan("foo");

			expect(tracer.openSpans.map((span: Span) => span.name)).toEqual(
				expect.arrayContaining(["foo"])
			);
		});

		it("should extend the last span given", () => {
			tracer.startSpan("foo");
			expect(tracer.openSpans.map((span: Span) => span.name)).toEqual(
				expect.arrayContaining(["foo"])
			);

			tracer.startSpan("bar");
			expect(tracer.openSpans.map((span: Span) => span.name)).toEqual(
				expect.arrayContaining(["foo", "bar"])
			);

			// $FlowFixMe
			const barSpan = tracer.openSpans.find(
				(span: Span) => span.name === "bar"
			);
			// $FlowFixMe
			expect(barSpan.childOf.name).toBe("foo");
		});

		it("should be able to log a span", () => {
			tracer.startSpan("bar");
			tracer.log({ foo: "3" });

			const barSpan = tracer.openSpans.find(
				(span: Span) => span.name === "bar"
			);
			// $FlowFixMe
			expect(barSpan.log).toHaveBeenCalledWith({ foo: "3" });
		});

		it("should be able to finish", () => {
			tracer.startSpan("baz");
			tracer.finishSpan();

			expect(finishMock).toHaveBeenCalled();
			expect(tracer.openSpans.length).toBe(0);
		});
	});
});
