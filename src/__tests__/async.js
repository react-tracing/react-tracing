import express from "express";
import nodeFetch from "node-fetch";

import MockTracer from "../testUtils/mockTracer";
const Tracing = require("../");

// TODO: move into testUtils
function generateServer(timeout) {
  return new Promise(resolve => {
    const app = express();
    app.all("/", (req, res) => {
      setTimeout(
        () =>
          res.status(202).json({
            done: true
          }),
        timeout
      );
    });

    const server = app.listen(0);
    resolve(server);
  });
}

function wait(timeout) {
  new Promise(resolve => setTimeout(() => resolve(), timeout));
}

describe("async stacks", () => {
  let tracer, finishMock;

  beforeEach(() => {
    finishMock = jest.fn();
    tracer = new Tracing({ tracer: new MockTracer({ finish: finishMock }) });
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

    const instrumentedFetch = tracer.fetch({ fetch: nodeFetch, getSpanName });
    const server = await generateServer(100);
    const { port } = server.address();
    const url = `http://127.0.0.1:${port}`;
    expect(tracer.stack.list.length).toBe(0);

    // Fetch1
    const fetch1 = instrumentedFetch(url);
    expect(tracer.stack.list.length).toBe(1);
    expect(tracer.stack.peek().name).toBe("span-1");
    await wait(10);

    // Fetch2
    const fetch2 = instrumentedFetch(url);
    expect(tracer.stack.list.length).toBe(2);
    expect(tracer.stack.peek().name).toBe("span-2");

    // Response1
    await fetch1;
    expect(tracer.stack.list.length).toBe(1);
    // vvv Wrong Assertion: current behavoiur vvv
    expect(tracer.stack.peek().name).toBe("span-1");

    // vvv Right Assertion: expected behavoiur vvv
    // expect(tracer.stack.peek().name).toBe("span-2");

    // Response2
    await fetch2;
    expect(tracer.stack.list.length).toBe(0);

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
  it("should trace correcly with nested spans");
});
