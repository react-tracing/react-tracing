const OpentracingZipkin = require("zipkin-javascript-opentracing");
const zipkin = require("zipkin");
const { HttpLogger } = require("zipkin-transport-http");

const Stack = require("./stack");

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
