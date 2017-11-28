// @flow
import MockTracer from "../testUtils/mockTracer";

import * as express from "express";
import nodeFetch from "node-fetch";
declare var fail: Function;
const Tracing = require("../");

describe("requests - globalNetworkTracer", () => {
	let tracer: any,
		fetchMock: any,
		finishMock: any,
		succeedRequest: any;

	beforeEach(() => {
		finishMock = jest.fn();
		tracer = new Tracing({
			tracer: new MockTracer({ finish: finishMock })
		});
		fetchMock = jest.fn(
			(...args) =>
				new Promise((resolve, reject) => {
					succeedRequest = () => resolve(args);
				})
		);
		global.fetch = fetchMock;
	});

	it("should use the instrumented version", async () => {
		tracer.initGlobalNetworkTracer();
		const promise = global.fetch("http://reddit.com");
		succeedRequest();
		const [url, options] = await promise;
		expect(url).toBe("http://reddit.com");
		expect(options.headers).toEqual({
			"X-B3-TraceId": "traceId",
			"X-B3-SpanId": "spanId"
		});
	});
});
