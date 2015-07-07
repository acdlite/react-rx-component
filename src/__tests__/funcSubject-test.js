import sinon from 'sinon';
import { funcSubject } from '../';

describe('funcSubject()', () => {
  it('creates an observable function that pushes new values when called', () => {
    const v$ = funcSubject();
    const spy = sinon.spy();
    const s = v$.subscribe(spy);

    v$(1);
    v$(2);
    v$(3);

    s.dispose();
    expect(spy.args.map(args => args[0])).to.deep.equal([1, 2, 3]);
  });
});
