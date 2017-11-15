const OpentracingZipkin = require("zipkin-javascript-opentracing");
const zipkin = require("zipkin");
const { HttpLogger } = require("zipkin-transport-http");

const Stack = require("./stack");
const defaultGetSpanName = ({ url, method, body }) => `${url}-${method}`;

class Tracing {
  constructor(options) {
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
  fetch({ fetch: fetchImplementation, getSpanName }) {
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

  startSpan(name) {
    const span = this.tracer.startSpan(name);
    this.stack.push(span);
  }

  log(options) {
    const span = this.stack.peek();
    span.log(options);
  }

  finishSpan() {
    const span = this.stack.pop();
    span.finish();
  }
}

module.exports = Tracing;
