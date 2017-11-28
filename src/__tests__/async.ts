import nodeFetch from "node-fetch";

import MockTracer from "../testUtils/mockTracer";
import generateServer from "../testUtils/server";
import { Span } from "../index";
const Tracing = require("../");

function wait(timeout: number) {
	new Promise(resolve => setTimeout(() => resolve(), timeout));
}

describe("async stacks", () => {
	let tracer: any, finishMock: any;

	beforeEach(() => {
		finishMock = jest.fn();
		tracer = new Tracing({
			tracer: new MockTracer({
				finish: finishMock
			})
		});

		tracer.startSpan("rootSpan");
	});

	afterEach(() => {
		tracer.finishSpan();
	});

	/* ┌──┴───┐
  *  │Fetch1│───────────────┐
  *  └──┬───┘               ▼
  *  ┌──┴───┐               Λ
  *  │Fetch2│──────────┐   ╱ ╲
  *  └──┬───┘       ┌──┼──▕ 1 ▏
  *  ┌──┴──────┐    │  │   ╲ ╱
  *  │Response1│◀───┘  ▼    V
  *  └──┬──────┘       Λ
  *  ┌──┴──────┐      ╱ ╲
  *  │Response2│◀────▕ 2 ▏
  *  └──┬──────┘      ╲ ╱
  *     ▼              V
  */
	it("should trace correcly with spans that return while others are still in progress", async () => {
		let spanId = 0;
		const getSpanName = () => {
			spanId += 1;
			return `span-${spanId}`;
		};

		const instrumentedFetch = tracer.fetch({
			fetch: nodeFetch,
			getSpanName
		});
		const server = await generateServer(100);
		const { port } = server.address();
		const url = `http://127.0.0.1:${port}`;
		expect(tracer.openSpans.length).toBe(1);

		// Fetch1
		const fetch1 = instrumentedFetch(url);
		expect(tracer.openSpans.length).toBe(2);
		expect(tracer.openSpans.map((span: Span) => span.name)).toEqual(
			expect.arrayContaining(["rootSpan", "span-1"])
		);
		await wait(10);

		// Fetch2
		const fetch2 = instrumentedFetch(url);
		expect(tracer.openSpans.length).toBe(3);
		expect(tracer.openSpans.map((span: Span) => span.name)).toEqual(
			expect.arrayContaining(["rootSpan", "span-1", "span-2"])
		);

		// Response1
		await fetch1;
		expect(tracer.openSpans.length).toBe(2);
		expect(tracer.openSpans.map((span: Span) => span.name)).toEqual(
			expect.arrayContaining(["rootSpan", "span-2"])
		);

		// Response2
		await fetch2;
		expect(tracer.openSpans.length).toBe(1);

		expect(finishMock).toHaveBeenCalledTimes(2);
	});

	/* ┌──┴───┐
  *  │Fetch1│──────────────────┐
  *  └──┬───┘     ┌─────▶      ▼
  *  ┌──┴───┐     │      Λ     Λ
  *  │Fetch2│─────┘     ╱ ╲   ╱ ╲
  *  └──┬───┘      ┌───▕ 2 ▏ ▕ 1 ▏
  *  ┌──┴──────┐   │    ╲ ╱   ╲ ╱
  *  │Response2│◀──┘     V     V
  *  └──┬──────┘               │
  *  ┌──┴──────┐               │
  *  │Response1│◀──────────────┘
  *  └──┬──────┘
  *    ▼
  */
	it("should trace correcly with nested spans", async () => {
		let spanId = 0;
		const getSpanName = () => {
			spanId += 1;
			return `span-${spanId}`;
		};

		const instrumentedFetch = tracer.fetch({
			fetch: nodeFetch,
			getSpanName
		});
		const server1 = await generateServer(100);
		const server2 = await generateServer(25);
		expect(tracer.openSpans.length).toBe(1);

		// Fetch1
		const fetch1 = instrumentedFetch(
			`http://127.0.0.1:${server1.address().port}`
		);
		expect(tracer.openSpans.length).toBe(2);
		expect(tracer.openSpans.map((span: Span) => span.name)).toEqual(
			expect.arrayContaining(["rootSpan", "span-1"])
		);
		await wait(10);

		// Fetch2
		const fetch2 = instrumentedFetch(
			`http://127.0.0.1:${server2.address().port}`
		);
		expect(tracer.openSpans.length).toBe(3);
		expect(tracer.openSpans.map((span: Span) => span.name)).toEqual(
			expect.arrayContaining(["rootSpan", "span-1", "span-2"])
		);

		// Response2
		await fetch2;
		expect(tracer.openSpans.length).toBe(2);
		expect(tracer.openSpans.map((span: Span) => span.name)).toEqual(
			expect.arrayContaining(["rootSpan", "span-1"])
		);

		// Response1
		await fetch1;
		expect(tracer.openSpans.length).toBe(1);
		expect(finishMock).toHaveBeenCalledTimes(2);
	});

	/* ┌─┴────┐
   * │Fetch1│────────┐
   * └─┬────┘        ▼
   *   │             Λ
   * ┌─┴───────┐    ╱ ╲
   * │Response1│◀──▕ 1 ▏
   * └─┬───────┘    ╲ ╱
   *   │             V
   * ┌─┴────┐
   * │Fetch2│─────────┐
   * └─┬────┘         ▼
   *   │              Λ
   * ┌─┴───────┐     ╱ ╲
   * │Response2│◀───▕ 2 ▏
   * └─┬───────┘     ╲ ╱
   *   │              V
   *   │
   *   ▼
  */
	it("should trace correcly with two requests after each other", async () => {
		let spanId = 0;
		const getSpanName = () => {
			spanId += 1;
			return `span-${spanId}`;
		};

		const instrumentedFetch = tracer.fetch({
			fetch: nodeFetch,
			getSpanName
		});
		const server = await generateServer(25);
		expect(tracer.openSpans.length).toBe(1);

		// Fetch1
		const fetch1 = instrumentedFetch(
			`http://127.0.0.1:${server.address().port}`
		);
		expect(tracer.openSpans.length).toBe(2);
		expect(tracer.openSpans.map((span: Span) => span.name)).toEqual(
			expect.arrayContaining(["rootSpan", "span-1"])
		);
		await fetch1;
		expect(tracer.openSpans.length).toBe(1);

		// Fetch2
		const fetch2 = instrumentedFetch(
			`http://127.0.0.1:${server.address().port}`
		);
		expect(tracer.openSpans.length).toBe(2);
		expect(tracer.openSpans.map((span: Span) => span.name)).toEqual(
			expect.arrayContaining(["rootSpan", "span-2"])
		);
		await fetch2;
		expect(tracer.openSpans.length).toBe(1);
	});

	/*      │
  *  ┌────┴──────┐
  *  │fetch1     │──────────────────────┐
  *  └────┬──────┘                      │
  *       │                             │
  *  ┌────┴──────┐                      │
  *  │fetch2     │─────┐                │
  *  └────┬──────┘     ▼                ▼
  *       │       .─────────.      .─────────.
  *       │      ╱           ╲    ╱           ╲
  *       │     (   Server    )  (   Server    )
  *       │      `.         ,'    `.         ,'
  *       │        `───────'        `───────'
  *   ┌───┴───────┐    │                │
  *   │response1  │◀───┼────────────────┘
  *   └───┬─────┬─┘    │
  *       │     ├────┐ │
  *       │     │ CB │ │
  *       │     ├────┘ │
  *       │     ▼      │           .─────────.
  *   ┌───┴───────┐    │          ╱           ╲
  *   │fetch1.1   │────┼────────▶(   Server    )
  *   └───┬───────┘    │          `.         ,'
  *       │            │            `───────'
  *   ┌───┴───────┐    │                │
  *   │response2  │◀───┘                │
  *   └───┬───────┘                     │
  *       │                             │
  *   ┌───┴───────┐                     │
  *   │response1.1│◀────────────────────┘
  *   └───────────┘
  */
	it("should set the parents according to the call chain with one callback", async () => {
		let spanId = 0;
		const getSpanName = () => {
			spanId += 1;
			return `span-${spanId}`;
		};

		const instrumentedFetch = tracer.fetch({
			fetch: nodeFetch,
			getSpanName
		});
		const server = await generateServer(100);
		const { port } = server.address();
		const url = `http://127.0.0.1:${port}`;
		expect(tracer.openSpans.length).toBe(1);

		let fetch1_1;
		// Fetch1
		const fetch1 = instrumentedFetch(url);
		fetch1.then(() => {
			// Fetch 1.1
			fetch1_1 = instrumentedFetch(url);
			return fetch1_1;
		});
		expect(tracer.openSpans.length).toBe(2);
		expect(tracer.openSpans.map((span: Span) => span.name)).toEqual(
			expect.arrayContaining(["rootSpan", "span-1"])
		);
		await wait(10);

		// Fetch2
		const fetch2 = instrumentedFetch(url);
		expect(tracer.openSpans.length).toBe(3);
		expect(tracer.openSpans.map((span: Span) => span.name)).toEqual(
			expect.arrayContaining(["rootSpan", "span-1", "span-2"])
		);

		// Response1
		await fetch1;
		await wait(10);
		expect(tracer.openSpans.length).toBe(3);
		expect(tracer.openSpans.map((span: Span) => span.name)).toEqual(
			expect.arrayContaining(["rootSpan", "span-2", "span-3"])
		);

		const span3 = tracer.openSpans.find(
			(span: Span) => span.name === "span-3"
		);
		expect(span3.childOf.name).toEqual("rootSpan");

		// Response2
		await fetch2;
		expect(tracer.openSpans.length).toBe(2);
		expect(tracer.openSpans.map((span: Span) => span.name)).toEqual(
			expect.arrayContaining(["rootSpan", "span-3"])
		);

		// Response1.1
		await fetch1_1;

		expect(finishMock).toHaveBeenCalledTimes(3);
	});

	/*      │
	** ┌────┴──────┐
	** │fetch1     │──────────────────────┐
	** └────┬──────┘                      │
	**      │                             │
	** ┌────┴──────┐                      │
	** │fetch2     │─────┐                │
	** └────┬──────┘     ▼                ▼
	**      │       .─────────.      .─────────.
	**      │      ╱           ╲    ╱           ╲
	**      │     (   Server    )  (   Server    )
	**      │      `.         ,'    `.         ,'
	**      │        `───────'        `───────'
	**  ┌───┴───────┐    │                │
	**  │response1  │◀───┼────────────────┘
	**  └───┬─────┬─┘    │
	**      │     ├────┐ │
	**      │     │ CB │ │
	**      │     ├────┘ │
	**      │     ▼      │           .─────────.
	**  ┌───┴───────┐    │          ╱           ╲
	**  │fetch1.1   │────┼────────▶(   Server    )
	**  └───┬───────┘    │          `.         ,'
	**      │            │            `───────'
	**  ┌───┴───────┐    │                │
	**  │response2  │◀───┘                │
	**  └───┬────┬──┘                     │
	**      │    ├────┐                   │
	**      │    │ CB │                   │
	**      │    ├────┘                   │
	**      │    ▼                        │
	** ┌────┴──────┐                      │
	** │fetch2.1   │──────────┐           │
	** └────┬──────┘          ▼           │
	**      │            .─────────.      │
	**      │           ╱           ╲     │
	**      │          (   Server    )    │
	**      │           `.         ,'     │
	**      │             `───────'       │
	** ┌────┴──────┐          │           │
	** │response1.1│◀─────────┼───────────┘
	** └────┬──────┘          │
	**      │                 │
	** ┌────┴──────┐          │
	** │response2.1│◀─────────┘
	** └────┬──────┘
	**      │
	**      │
	**      │
	**      ▼
	*/
	it(
		"should set the parents according to the call chain with two callbacks"
	);
});
