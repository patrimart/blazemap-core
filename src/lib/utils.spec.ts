import test from 'ava';

import { clamp } from './utils';

test('clamp', (t) => {
  t.is(clamp(-10, 10)(0), 0.5);
});
