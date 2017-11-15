// @flow
import OpentracingZipkin from "zipkin-javascript-opentracing";
import zipkin from "zipkin";
import { HttpLogger } from "zipkin-transport-http";
import Stack from "./stack";

const defaultGetSpanName = ({ url, method, body }) => `${url}-${method}`;

interface Span {
  log({ [string]: string }): void;
  finish(): void;
}

interface TracerType {
  startSpan(spanName: string): Span;
}

type FetchImplementationType = (
  endpoint: string,
  args: Object
) => Promise<Object>;
type ExplicitTracerDeclaration = {
  tracer: TracerType
};

type ImplicitTracerDeclaration = {
  tracer: null,
  serviceName: string,
  endpoint: string
};

type spanNameArguments = {
  url: string,
  method: string,
  body: string
};

type TracerOptions = ExplicitTracerDeclaration | ImplicitTracerDeclaration;
type FetchOptions = {
  fetch: FetchImplementationType,
  getSpanName?: spanNameArguments => string
};

class Tracing {
  stack: Stack<Span>;
  tracer: TracerType;

  constructor(options: TracerOptions) {
    this.tracer =
      options.tracer ||
      OpentracingZipkin({
        serviceName: options.serviceName,
        recorder: new zipkin.BatchRecorder({
          logger: new HttpLogger({
            endpoint: options.endpoint
          })
        }),
        kind: "client"
      });

    this.stack = new Stack();
  }

  // TODO: default to global one
  fetch({
    fetch: fetchImplementation,
    getSpanName
  }: FetchOptions): FetchImplementationType {
    const getName = getSpanName || defaultGetSpanName;
    const reactTracingFetch = (...args) => {
      const [url, options = {}] = args;
      const { method = "GET", body = "" } = options;
      const spanName = getName({ url, method, body });

      this.startSpan(spanName);
      return fetchImplementation(...args).then(
        result => {
          this.finishSpan();
          return result;
        },
        err => {
          this.finishSpan();
          throw err;
        }
      );
    };

    return reactTracingFetch;
  }

  startSpan(name: string): void {
    const span = this.tracer.startSpan(name);
    this.stack.push(span);
  }

  log(options: { [string]: string }): void {
    const span = this.stack.peek();
    span.log(options);
  }

  finishSpan(): void {
    const span: Span = this.stack.pop();
    span.finish();
  }
}

module.exports = Tracing;
