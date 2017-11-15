// @flow
import MockTracer from "../testUtils/mockTracer";

import express from "express";
import nodeFetch from "node-fetch";
declare var fail: Function;
const Tracing = require("../");

describe("requests - fetch", () => {
  let tracer, fetchMock, finishMock, succeedRequest, failRequest;

  beforeEach(() => {
    finishMock = jest.fn();
    tracer = new Tracing({ tracer: new MockTracer({ finish: finishMock }) });
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
  });

  it("tracer should start and finish a span", async () => {
    const instrumentedFetch = tracer.fetch({ fetch: fetchMock });
    const promise = instrumentedFetch("http://google.de");
    expect(tracer.stack.list.length).toBe(1);
    expect(tracer.stack.list[0].name).toBe("http://google.de-GET");

    succeedRequest();
    await promise;

    expect(finishMock).toHaveBeenCalled();
    expect(tracer.stack.list.length).toBe(0);
  });

  it("tracer should start and finish a span if an error is thrown", async () => {
    const instrumentedFetch = tracer.fetch({ fetch: fetchMock });

    const promise = instrumentedFetch("http://google.de");
    expect(tracer.stack.list.length).toBe(1);
    failRequest();

    try {
      await promise;
      fail("Promise should not succeed");
    } catch (e) {}

    expect(finishMock).toHaveBeenCalled();
    expect(tracer.stack.list.length).toBe(0);
  });

  it("should use a different span name if a getSpanName function is provided", async () => {
    const instrumentedFetch = tracer.fetch({
      fetch: fetchMock,
      getSpanName: () => "ponies"
    });
    const promise = instrumentedFetch("http://google.de");
    expect(tracer.stack.list.length).toBe(1);
    expect(tracer.stack.list[0].name).toBe("ponies");

    succeedRequest();
    await promise;

    expect(finishMock).toHaveBeenCalled();
    expect(tracer.stack.list.length).toBe(0);
  });

  describe("Forwarding headers", () => {
    let server, path;
    beforeEach(() => {
      const app = express();
      app.get(
        "/user",
        (req: $Subtype<express$Request>, res: express$Response) =>
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
      const result = await instrumentedFetch(path).then(res => res.json());
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
