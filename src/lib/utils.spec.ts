import test from 'ava';

import { normalize } from './utils';

test('normalize', (t) => {
  t.is(normalize(-10, 10)(0), 0.5);
});
