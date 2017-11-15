const Tracing = require("../");

class MockTracer {
  constructor({ finish }) {
    this.finish = finish;
  }

  startSpan(spanName) {
    return { name: spanName, finish: this.finish, log: jest.fn() };
  }
}

describe("react-tracing", () => {
  describe("opentracing forwarding", () => {
    let tracer, finishMock;

    beforeEach(() => {
      finishMock = jest.fn();
      tracer = new Tracing({ tracer: new MockTracer({ finish: finishMock }) });
    });

    it("should be able to start a span", () => {
      tracer.startSpan("foo");

      expect(tracer.stack.peek().name).toBe("foo");
    });

    it("should be able to log a span", () => {
      tracer.startSpan("bar");
      tracer.log({ foo: 3 });

      expect(tracer.stack.peek().log).toHaveBeenCalledWith({ foo: 3 });
    });

    it("should be able to finish", () => {
      tracer.startSpan("baz");
      tracer.finishSpan();

      expect(finishMock).toHaveBeenCalled();
      expect(tracer.stack.list.length).toBe(0);
    });
  });

  describe("requests", () => {
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

    describe("fetch", () => {
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
    });
  });
});
