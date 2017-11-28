"use strict";
var __assign =
	(this && this.__assign) ||
	Object.assign ||
	function(t) {
		for (var s, i = 1, n = arguments.length; i < n; i++) {
			s = arguments[i];
			for (var p in s)
				if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
		}
		return t;
	};
exports.__esModule = true;
// @flow
var OpentracingZipkin = require("zipkin-javascript-opentracing");
var zipkin = require("zipkin");
var zipkin_transport_http_1 = require("zipkin-transport-http");
var stack_1 = require("./stack");
var defaultGetSpanName = function(_a) {
	var url = _a.url,
		method = _a.method,
		body = _a.body;
	return url + "-" + method;
};
var Tracing = /** @class */ (function() {
	function Tracing(options) {
		this.tracer =
			options.tracer ||
			OpentracingZipkin({
				serviceName: options.serviceName,
				recorder: new zipkin.BatchRecorder({
					logger: new zipkin_transport_http_1.HttpLogger({
						endpoint: options.endpoint
					})
				}),
				kind: "client"
			});
		this.stack = new stack_1["default"]();
	}
	Tracing.prototype.fetch = function(_a) {
		var _this = this;
		var _b = _a === void 0 ? {} : _a,
			externalFetchImplementation = _b.fetch,
			getSpanName = _b.getSpanName;
		var fetchImplementation =
			externalFetchImplementation || (window || global || self).fetch;
		if (typeof fetchImplementation !== "function") {
			throw new Error(
				"fetch implementation is neither supplied nor could it be guessed from window, global or self"
			);
		}
		var getName = getSpanName || defaultGetSpanName;
		var reactTracingFetch = function(url, options) {
			if (options === void 0) {
				options = {};
			}
			var _a = options.method,
				method = _a === void 0 ? "GET" : _a,
				_b = options.body,
				body = _b === void 0 ? "" : _b;
			var spanName = getName({
				url: url,
				method: method,
				body: body
			});
			var span = _this.startSpan(
				spanName,
				_this._tracing_current_span
			);
			var headers = options.headers || {};
			_this.tracer.inject(
				span,
				OpentracingZipkin.FORMAT_HTTP_HEADERS,
				headers
			);
			var success = function(span, result) {
				_this.finishSpan(span);
				// $FlowFixMe
				_this._tracing_current_span = span.childOf;
				return result;
			};
			var failure = function(span, err) {
				_this.finishSpan(span);
				// $FlowFixMe
				_this._tracing_current_span = span.childOf;
				throw err;
			};
			return fetchImplementation(
				url,
				__assign({}, options, { headers: headers })
			).then(success.bind(_this, span), failure.bind(_this, span));
		};
		return reactTracingFetch;
	};
	Tracing.prototype.initGlobalNetworkTracer = function(_a) {
		var getSpanName = (_a === void 0 ? {} : _a).getSpanName;
		var getName = getSpanName || defaultGetSpanName;
		var globalScope = window || global || self;
		if (typeof globalScope.fetch === "function") {
			var originalFetch = globalScope.fetch;
			globalScope.fetch = this.fetch({ fetch: originalFetch });
		}
	};
	Tracing.prototype.startSpan = function(name, parent) {
		var parentSpan = parent;
		if (!parentSpan) {
			try {
				parentSpan = this.stack.peek();
			} catch (e) {
				// Don't use a parent span, be a root span
			}
		}
		var span = this.tracer.startSpan(name, { childOf: parentSpan });
		this.stack.push(span);
		return span;
	};
	Tracing.prototype.log = function(options) {
		var span = this.stack.peek();
		span.log(options);
	};
	Tracing.prototype.finishSpan = function(span) {
		var s;
		if (span) {
			s = span;
			this.stack.remove(span);
		} else {
			s = this.stack.pop();
		}
		if (s) {
			s.finish();
		}
	};
	Object.defineProperty(Tracing.prototype, "openSpans", {
		// Private API
		get: function() {
			return this.stack.list;
		},
		enumerable: true,
		configurable: true
	});
	return Tracing;
})();
module.exports = Tracing;
