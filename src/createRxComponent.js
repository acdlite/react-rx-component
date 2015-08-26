import { Component, createElement } from 'react';
import shouldPureComponentUpdate from 'react-pure-render/function';
import { funcSubject } from './';

function isReactComponent(c) {
  return c && c.prototype && typeof c.prototype.render === 'function';
}

function createRxComponent(mapProps, renderOrComponent) {
  const render = isReactComponent(renderOrComponent)
    ? props => createElement(renderOrComponent, props)
    : renderOrComponent;

  return class extends Component {
    constructor(props, context) {
      super(props, context);

      // Used to receive props and context from owner
      this.receive$ = funcSubject();

      this.props$ = this.receive$.map(x => x[0]).startWith(props);
      this.context$ = this.receive$.map(x => x[1]).startWith(context);

      // Sequence of child props
      this.childProps$ = mapProps(this.props$, this.context$);

      // Keep track of whether the component has mounted
      this.componentHasMounted = false;

      // Subscribe to child prop changes so we know when to re-render
      this.subscription = this.childProps$.subscribe(
        childProps =>
          !this.componentHasMounted
            ? this.state = childProps
            : this.setState(childProps)
      );
    }

    componentDidMount() {
      this.componentHasMounted = true;
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
      return render(childProps);
    }
  };
}

// Stupidly basic curry function
function curry(func) {
  return (a, b) =>
    typeof b === 'undefined'
      ? c => func(a, c)
      : func(a, b);
}

export default curry(createRxComponent);
