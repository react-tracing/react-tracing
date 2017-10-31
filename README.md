# 📈 React Tracing [![Build Status](https://travis-ci.org/react-tracing/react-tracing.svg?branch=master)](https://travis-ci.org/react-tracing/react-tracing) [![Coverage Status](https://coveralls.io/repos/github/react-tracing/react-tracing/badge.svg?branch=master)](https://coveralls.io/github/react-tracing/react-tracing?branch=master) [![Greenkeeper badge](https://badges.greenkeeper.io/react-tracing/react-tracing.svg)](https://greenkeeper.io/) [![All Contributors](https://img.shields.io/badge/all_contributors-3-orange.svg?style=flat-square)](#contributors)


## Goal

`react-tracing` enables React and React Native developers to build faster products by making the real-world performance visible. Although it is optimized for React and React Native we also support pure JS.<br>

For this we want to use well-known tooling from the backend world and bring it to the frontend, so that engineering teams might gain a better understanding where a loading time improvement might help the most.<br><br>

Imagine having graphs like this showing real users using your (web-)app when you want to decide which performance issue to tackle next:
    <img src="http://zipkin.io/public/img/web-screenshot.png" />


## Introduction

### Terminology

This section aims to give you a small overview into the language used in [opentracing](http://opentracing.io/documentation/pages/spec)

Term | Description
------------ | -------------
span | a single operation that is traced
child span | like functions calls are nested, spans can be, too

### How we manage your spans

In other tracing solutions you have to define which span is the child of which, but `react-tracing` handles this for you.
Therefore `react-tracing` uses a stack, making use of Javascripts Single-Threadedness, to determine which spans should rely on each other.
This stack is stored in the global scope (it's a bit ugly, do you have a better idea?) under `window.reactTracing.stack` or `global.reactTracing.stack`.



### Supported Tracing Implementations

We can use every [opentracing](http://opentracing.io/) solution in general, but currently there is only one, therefore it is not configurable yet.
As soon as there are other solutions we will add them here.

- [zipkin-javascript-opentracing](https://github.com/DanielMSchmidt/zipkin-javascript-opentracing)

### Working with multiple systems

Every time you send a fetch or xhr request with `react-tracing`'s instrumented versions of them the `X-B3-TraceId`, `X-B3-SpanId` HTTP headers are set, so that your server can pick the span up and extend the tracing context.

## Environment Setup

You need a Zipkin instance running on an accessible server. 
For development puropses you can start one with docker: `docker run -d -p 9411:9411 openzipkin/zipkin`

## Usage


```javascript
import Tracing from "react-tracing";
const tracer = new Tracing({
    serviceName: "Frontend",
    endpoint: "http://localhost:9111",
    kind: "client", // default
});

// TRACKING HTTP REQUESTS
// ======================

// You have two options here depending on your style of usage
// a) You can either use it locally, enabling you to set a different service name per fetch 
const defaultFetch = tracer.fetch();
const tracingXhr = tracer.xhr(XMLHttpRequest); // last param optional, otherwise a global is used

// b) You can choose to let us handle everything for you
// This mutates the global fetch and XHR request
tracer.initGlobalNetworkTracer();

// You can define a span that generates you the span names, this is the default one.
// If you want to use the default and a third param pass anything that is not a function as the second parameter.
const getSpanName = ({ url, method, data }) => `client send ${method} to ${url} with data ${JSON.stringify(data)}`;
const tracedFetch = tracer.fetch(getSpanName, fetch); // last param optional, otherwise a global is used



// TRACKING USER ACTIONS
// =====================

// You can use it in React
const Link = tracer.component("a")

// You can use it in React Native
const Touchable = tracer.component(TouchableHighlight);

// Every onPress / onClick / onLongPress is wrapped with a function like this
// If a promise is returned, the span will end once it resolves or rejects
const clickHandler = function() {
    return fetch("http://foo.de").then(...);
};
const tracedClickHandler = tracer.wrap(clickHandler);

// Usage in the component
const MyTracedComponent = () => (
  <Touchable 
    tracingName="create-new-order" 
    // Either use static additional infos
    tracingInfo={{
      buttonLabel: 'ClickMe',
      userId: 42,
    }}
    // Or use dynamic ones
    tracingInfo={e => ({
      clickPosition: e.targetX,
    })}
    {...usualProps} 
  >
    <Text>ClickMe</Text>
  </Touchable>
);



// ADD YOUR OWN TRACING
// ====================

function myVeryLongFunction() {
  tracing.startSpan("Long Function");
  asyncFunction().then(() => {
     tracing.startSpan("Synchronous Bitcoin Mining");
     try {
      mineBitcoinsAndDonateThem();
     } catch(e) {
       // Something went wrong, let's log the error
       tracing.log({
         miningError: e
       });
     }
     tracing.finishSpan(); 
  }).finally(() => {
    tracing.finishSpan();
  });
}
```

## Contributors

Thanks goes to these wonderful people ([emoji key](https://github.com/kentcdodds/all-contributors#emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
| [<img src="https://avatars2.githubusercontent.com/u/1337046?v=4" width="100px;"/><br /><sub>Daniel Schmidt</sub>](http://danielmschmidt.de/)<br />[💻](https://github.com/react-tracing/react-tracing/commits?author=DanielMSchmidt "Code") [📖](https://github.com/react-tracing/react-tracing/commits?author=DanielMSchmidt "Documentation") [🤔](#ideas-DanielMSchmidt "Ideas, Planning, & Feedback") [⚠️](https://github.com/react-tracing/react-tracing/commits?author=DanielMSchmidt "Tests") [🔧](#tool-DanielMSchmidt "Tools") [💡](#example-DanielMSchmidt "Examples") | [<img src="https://avatars0.githubusercontent.com/u/45985?v=4" width="100px;"/><br /><sub>Daniel Banck</sub>](https://dbanck.de)<br />[📖](https://github.com/react-tracing/react-tracing/commits?author=dbanck "Documentation") [🤔](#ideas-dbanck "Ideas, Planning, & Feedback") | [<img src="https://avatars2.githubusercontent.com/u/111324?v=4" width="100px;"/><br /><sub>Raphael Randschau</sub>](https://www.nicolai86.eu)<br />[🤔](#ideas-nicolai86 "Ideas, Planning, & Feedback") |
| :---: | :---: | :---: |
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/kentcdodds/all-contributors) specification. Contributions of any kind welcome!
