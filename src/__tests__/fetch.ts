// @flow
import MockTracer from "../testUtils/mockTracer";

import * as express from "express";
import { Request, Response } from "express";
import nodeFetch from "node-fetch";
import { Server } from "http";
declare var fail: Function;
const Tracing = require("../");

describe("requests - fetch", () => {
	let tracer: any,
		fetchMock: any,
		finishMock: any,
		succeedRequest: any,
		failRequest: any;

	beforeEach(() => {
		finishMock = jest.fn();
		tracer = new Tracing({
			tracer: new MockTracer({ finish: finishMock })
		});
		fetchMock = jest.fn(
			() =>
				new Promise((resolve, reject) => {
					succeedRequest = resolve;
					failRequest = reject;
				})
		);
	});

	it("tracer should expose fetch", () => {
		expect(tracer.fetch).toBeInstanceOf(Function);
	});

	it("should throw if there is no fetch to be found", () => {
		expect(() => {
			tracer.fetch();
		}).toThrowError();
		expect(() => {
			tracer.fetch({});
		}).toThrowError();

		expect(() => {
			tracer.fetch({ fetch: fetchMock });
		}).not.toThrowError();

		const oldGlobal = global;
		global.fetch = fetchMock;
		expect(() => {
			tracer.fetch();
			tracer.fetch({});
		}).not.toThrowError();
		expect(() => {
			tracer.fetch({ fetch: fetchMock });
		}).not.toThrowError();
		global = oldGlobal;
	});

	it("tracer should start and finish a span", async () => {
		const instrumentedFetch = tracer.fetch({ fetch: fetchMock });
		const promise = instrumentedFetch("http://google.de");
		expect(tracer.openSpans.length).toBe(1);
		expect(tracer.openSpans[0].name).toBe("http://google.de-GET");

		succeedRequest();
		await promise;

		expect(finishMock).toHaveBeenCalled();
		expect(tracer.openSpans.length).toBe(0);
	});

	it("tracer should start and finish a span if an error is thrown", async () => {
		const instrumentedFetch = tracer.fetch({ fetch: fetchMock });

		const promise = instrumentedFetch("http://google.de");
		expect(tracer.openSpans.length).toBe(1);
		failRequest();

		try {
			await promise;
			fail("Promise should not succeed");
		} catch (e) {}

		expect(finishMock).toHaveBeenCalled();
		expect(tracer.openSpans.length).toBe(0);
	});

	it("should use a different span name if a getSpanName function is provided", async () => {
		const instrumentedFetch = tracer.fetch({
			fetch: fetchMock,
			getSpanName: () => "ponies"
		});
		const promise = instrumentedFetch("http://google.de");
		expect(tracer.openSpans.length).toBe(1);
		expect(tracer.openSpans[0].name).toBe("ponies");

		succeedRequest();
		await promise;

		expect(finishMock).toHaveBeenCalled();
		expect(tracer.openSpans.length).toBe(0);
	});

	describe("Forwarding headers", () => {
		let server: Server, path: string;
		beforeEach(() => {
			const app = express();
			app.get("/user", (req: Request, res: Response) =>
				res.status(202).json({
					traceId: req.header("X-B3-TraceId") || "?",
					spanId: req.header("X-B3-SpanId") || "?"
				})
			);

			return new Promise(resolve => {
				server = app.listen(0, () => {
					const port = server.address().port;
					path = `http://127.0.0.1:${port}/user`;
					resolve();
				});
			});
		});

		it("should have a path set", () => {
			expect(path).toBeTruthy();
		});

		it("should set the spanId and traceId for requests to external systems", async () => {
			const instrumentedFetch = tracer.fetch({
				fetch: nodeFetch
			});
			const result = await instrumentedFetch(path).then((res: any) =>
				res.json()
			);
			expect(result.traceId).toBeDefined();
			expect(result.traceId).not.toBe("?");

			expect(result.spanId).toBeDefined();
			expect(result.spanId).not.toBe("?");
		});

		afterEach(() => {
			server.close();
		});
	});
});
