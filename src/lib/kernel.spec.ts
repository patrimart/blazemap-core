import test from 'ava';

import { kernel } from './kernel';
import { HexU8, Proportion } from './types';
import { EOP, genColorScale } from './utils';

test('kernel', (t) => {
  const run = () => {
    const points: [x: number, y: number, p: Proportion][] = [
      [100, 100, 1],
      [145, 130, 1],
      [145, 130, 1],
      [110, 150, 1],
      EOP as never,
    ];
    const result: number[] = [];

    function color(r: number): void;
    function color(r: number, g: number): void;
    function color(r: number, g: number, b: number): void;
    function color(r: number, g: number, b: number, a: number): void;
    function color(...rgba: number[]) {
      // console.log(JSON.stringify(rgba));
      result.push(...rgba);
    }

    for (let x = 0; x < 200; x++) {
      for (let y = 0; y < 200; y++) {
        kernel.call(
          {
            output: {
              x: 200,
              y: 200,
              z: 0,
            },
            thread: {
              x,
              y,
              z: 0,
            },
            constants: {
              maxPoints: 1000,
            },
            color,
          },
          points,
          25,
          15,
          (genColorScale({
            0: 0x0000ff00,
            0.2: 0x0000ff22,
            0.65: 0x00ff0066,
            1: 0xff0000ee,
          }) as unknown) as [r: HexU8, g: HexU8, b: HexU8, a: HexU8][],
          2
        );
      }
    }
    return result;
  };

  t.is(run().length, 160_000);
});
