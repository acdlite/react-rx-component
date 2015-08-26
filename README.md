react-rx-component
==================

[![build status](https://img.shields.io/travis/acdlite/react-rx-component/master.svg?style=flat-square)](https://travis-ci.org/acdlite/react-rx-component)
[![npm version](https://img.shields.io/npm/v/react-rx-component.svg?style=flat-square)](https://www.npmjs.com/package/react-rx-component)

Yet another RxJS library for React :)

Create **smart components** — also known as container components — using RxJS observables.

```
npm install --save react-rx-component rx
```

## Don't `setState()` — transform props

React is all about state management. One of the biggest traps new React developers fall into is an over-reliance on `setState()` to construct big, complicated state machines. Components like that are fragile, error-prone, and fail to take full advantage of React's powerful data flow model. Instead, it's best to minimize local component state and use derived data, in the form of props, wherever possible.

A common strategy is to separate your app into **smart** and **dumb** components. Smart components take care of state management, subscriptions, and other messy stuff, then pass props along to its children. The children are dumb components, which have no state, and merely return elements for given props.

**react-rx-component lets you create "stateful" smart components without ever using `setState()`**.

Using the RxJS library, transform an observable sequence of props received from the owner into a sequence of props to be passed to children. This is the essence of what all smart components do — take some props from the owner, combine it with some local state, and sanitize the result by passing it down as nice, clean props.

To illustrate, let's compare how to create a simple counter the normal way and with react-rx-component.

First, the normal way. We'll follow best practices by separating our counter into smart and dumb components:

```js
class CounterContainer extends React.Component {
  state = { count: 0 }

  handleIncrement = () => {
    this.setState(state => ({
      count: state.count + 1
    }));
  }

  render() {
    return (
      <Counter
        {...this.props}
        count={this.state.count}
        increment={this.handleIncrement} />
    );
  }
}

class Counter extends React.Component {
  render() {
    return (
      <div>
        {props.count}
        <button onClick={increment}>+</button>
      </div>
    );
  }
}
```

And now let's implement this same functionality with react-rx-component. Inline comments show how certain parts correspond to the normal version:

```js
const CounterContainer = createRxComponent(props$ => {
  const increment$ = funcSubject(); // handleIncrement
  const count$ = increment$
    .startWith(0) // state = { count: 0 }
    .scan(count => count + 1); // this.setState((state) => ({ count: count + 1 }))

  return Observable.combineLatest(props$, count$, (props, count) => ({
    ...props,
    increment: increment$,
    count
  }));
}, Counter);

// In a future version of React, pure functions like this are valid components
// https://github.com/facebook/react/pull/3995
function Counter(props) {
  const { count, increment, ...rest } = props;
  return (
    <div {...rest}>
      {props.count}
      <button onClick={increment}>+</button>
    </div>
  );
}
```

*`funcSubject()` is a neat trick borrowed from [rx-react](https://github.com/fdecampredon/rx-react#funcsubject). It creates an observable sequence that can be used like a callback function. The value sent to the function is added to the sequence. Here, we're using it as a click handler.*

As you can see, the entirety of React's state API can be expressed in terms of observable operators.

  - Instead of `setState()`, create a new observable sequence and combine.
  - Instead of `getIntialState()`, use `startWith()`.
  - Instead of `shouldComponentUpdate()`, use `distinctUntilChanged()`.

Other benefits include:

  - Instead of `getDefaultProps()`, use `startWith()`.
  - No distinction between state and props — everything is simply an observable.
  - No need to worry about unsubscribing from event listeners.
  - [Sideways data loading](https://github.com/facebook/react/issues/3398) is trivial.
  - Access to the full ecosystem of RxJS libraries.
  - Free performance optimization – safely implements [`shouldPureComponentUpdate()`](https://github.com/gaearon/react-pure-render#function) from react-pure-render.
  - It's more *fun*.

## API

```js
import { createRxComponent, funcSubject } from 'react-rx-component';
```

### `createRxComponent(mapProps)`
### `createRxComponent(mapProps, render)`
### `createRxComponent(mapProps, Component)`

Creates a React Component or a higher-order component. Use this instead of `React.createClass()` or extending `React.Component`.

`mapProps()` is a function that maps an observable sequence of props to a sequence of child props, like so:

```js
props$ => childProps$
```

**NOTE** `mapProps()` also receives a sequence of contexts as the second parameter.

`createRxComponent()` can be passed a render function or a React component. A render function is a function that maps child props to a React element:

```js
props => vdom
```

Passing a React component is effectively the same as passing a render function that looks like this:

```js
props => <Component {...props} />
```

The resulting component *is* a subclass of `React.Component`, so you can set `propTypes` and `contextTypes` like normal.

Alternatively, you can choose to omit the second parameter. In this case, a higher-order component is returned instead of a normal React component. E.g.

```js
const higherOrderComponent = createRxComponent(mapProps);

class MyComponent extends React.Component {...}

export default higherOrderComponent(MyComponent);
```

You can also use it as a decorator:

```js
@createRxComponent(mapProps)
export default class MyComponent extends React.Component {...}
```

#### Why the extra step? Why not return a sequence of vdom?

You may be wondering why we don't just combine the two steps and map directly from a sequence of props to a sequence of React elements. Internally, the separation allows us to prevent unnecessary renders using `shouldComponentUpdate()`. If the same set of props are broadcast multiple times, there are no extra renders.

### `funcSubject()`

Creates an RxJS Subject that can be used like a callback function. It broadcasts the value of whatever it's called with. This is very handy for creating observable sequences from event handlers, like `onClick()` or `onChange()`. See the counter example above.

The idea for this function is borrowed from [rx-react](https://github.com/fdecampredon/rx-react) by [@fdecampredon](https://github.com/fdecampredon).

## Comparison to other libraries

- [**Cycle**](http://cycle.js.org) — Cycle is a React-like, fully reactive library with a hard dependency on RxJS. I don't have much experience with Cycle, but what I do know is all very positive and exciting. The biggest downside for me is that it's not React :) The goal of this library is to incorporate reactive concepts without breaking compatibility with the larger React ecosystem.
- [**cycle-react**](https://github.com/pH200/cycle-react) — A port of Cycle's API to React.
- [**rx-react**](https://github.com/fdecampredon/rx-react) — A collection of mixins and helpers for working with React and RxJS. Rather than using mixins, react-rx-component focuses on helping you create entire components using only observables and pure functions. As mentioned above, `funcSubject()` is borrowed from this library.
