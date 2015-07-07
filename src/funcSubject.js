import { Subject } from 'rx';

// Idea and implementation borrowed from
// https://github.com/fdecampredon/rx-react
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
