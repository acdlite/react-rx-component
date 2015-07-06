import { Subject } from 'rx';

export default function funcSubject() {
  function subject(value) {
    subject.onNext(value);
  }

  /* eslint-disable */
  for (let key in Subject.prototype) {
  /* eslint-enable */
    subject[key] = Subject.prototype[key];
  }

  Subject.call(subject);

  return subject;
}
