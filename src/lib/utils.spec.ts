import test from 'ava';

import * as u from './utils';

test('utilities', (t) => {
  t.is(u.clampU8(300), 255);
  t.is(u.clampU16(300), 300);
  t.is(u.clampU24(300), 300);
  t.is(u.clampU32(300), 300);
  t.is(u.clampProportion(300), 1);

  t.true(u.pointEq([20, 20, 1], [20, 20, 1]));

  t.is(u.distance([20, 20, 1], [20, 21, 1]), 1);

  t.is(u.normalize(-10, 10)(0), 0.5);

  t.is(u.toHex([255, 255, 255, 255]), 0xffffffff);

  t.deepEqual(u.toRgba(0xffffffff), [255, 255, 255, 255]);

  t.deepEqual(u.tweenRgbas([0, 0, 0, 0], [255, 255, 255, 255], 5), [
    [0, 0, 0, 0],
    [64, 64, 64, 64],
    [128, 128, 128, 128],
    [191, 191, 191, 191],
    [255, 255, 255, 255],
  ]);

  t.true(
    u.genColorScale({
      0: 0x0000ff00,
      0.2: 0x0000ff22,
      0.65: 0x00ff0066,
      1: 0xff0000ee,
    }).length === 256
  );
});
