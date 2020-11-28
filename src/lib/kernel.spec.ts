import test from 'ava';

import { kernel } from './kernel';
import { HexU8, Proportion } from './types';
import { genColorScale, toRgba } from './utils';

test('kernel', (t) => {
  const run = () => {
    const points: [x: number, y: number, p: Proportion][] = [[5, 5, 1]];
    const result: number[] = [];

    function color(r: number): void;
    function color(r: number, g: number): void;
    function color(r: number, g: number, b: number): void;
    function color(r: number, g: number, b: number, a: number): void;
    function color(...rgba: number[]) {
      console.log(JSON.stringify(rgba));
    }

    for (let x = 0; x < 10; x++) {
      for (let y = 0; y < 10; y++) {
        kernel.call(
          {
            output: {
              x: 10,
              y: 10,
              z: 0,
            },
            thread: {
              x,
              y,
              z: 0,
            },
            constants: {
              pointCount: points.length,
            },
            color,
          },
          points,
          2,
          1,
          (genColorScale({
            0: 0x0000ff00,
            0.2: 0x0000ff22,
            0.65: 0x00ff0066,
            1: 0xff0000ee,
          }).map(toRgba) as unknown) as [
            r: HexU8,
            g: HexU8,
            b: HexU8,
            a: HexU8
          ][]
        );
      }
    }
    return result;
  };

  t.is(run(), []);
});
