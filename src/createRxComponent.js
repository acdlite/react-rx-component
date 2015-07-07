import { Component } from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import { funcSubject } from './';

function unwrapLast(o$) {
  let value;
  o$.subscribe(v => value = v).dispose();
  return value;
}

export default function createRxComponent(mapProps, render) {
  return class extends Component {
    constructor(props, context) {
      super(props, context);

      // Used to receive props and context from owner
      this.receive$ = funcSubject();

      this.props$ = this.receive$.map(x => x[0]).startWith(props);
      this.context$ = this.receive$.map(x => x[1]).startWith(context);

      // Sequence of child props
      this.childProps$ = mapProps(this.props$, this.context$);

      // Get the initial child props so it works on the first render
      // Especially important for server-side rendering
      this.state = unwrapLast(this.childProps$);
    }

    componentDidMount() {
      // Subscribe to child prop changes so we know when to re-render
      // Skip the first set of props, which were already rendered
      this.subscription = this.childProps$.skip(1).subscribe(
        // Use setState to trigger a re-render
        childProps => this.setState(childProps)
      );
    }

    componentWillReceiveProps(nextProps, nextContext) {
      // Receive new props and context from the owner
      this.receive$([ nextProps, nextContext ]);
    }

    shouldComponentUpdate = shouldPureComponentUpdate;

    componentWillUnmount() {
      // Clean-up subscription before un-mounting
      this.subscription.dispose();
    }

    render() {
      const childProps = this.state;
      const { children } = this.props;

      if (typeof render === 'function') {
        return render(childProps);
      }

      if (typeof children === 'function') {
        return children(childProps);
      }
    }
  };
}
