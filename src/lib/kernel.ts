import { IKernelFunctionThis } from 'gpu.js';

import { HexU8, Proportion } from './types';

export function kernelInit(
  this: IKernelFunctionThis<{ pointCount: number }>,
  points: [x: number, y: number, p: Proportion][],
  radius: number,
  blur: number,
  colorScale: [r: HexU8, g: HexU8, b: HexU8, a: HexU8][],
  maxWeight: number
) {
  function clampit(v: number) {
    return Math.round(Math.max(Math.min(v, 255), 0));
  }
  function distance(x1: number, y1: number, x2: number, y2: number) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
  }
  function norm(v: number): number {
    return (v - 0) / (255 - 0);
  }
  function easeFade(d: number, r: number, b: number) {
    if (d < r - b * 0.5) return 1;
    return (
      1 -
      Math.min(
        1,
        (((r + b * 0.5) / (r + b * 0.5 - (r - b * 0.5))) *
          (d - (r - b * 0.5))) /
          (r + b * 0.5)
      )
    );
  }

  const x = this.thread.x;
  const y = this.thread.y;

  let weight = 0;

  for (let i = 0; i < this.constants.pointCount; i++) {
    const d = distance(points[i][0], points[i][1], x, y);
    const w = easeFade(d, radius, blur);
    weight += points[i][2] * w;
  }

  const wc = clampit((weight / maxWeight) * 255);

  this.color(
    norm(colorScale[wc][0]),
    norm(colorScale[wc][1]),
    norm(colorScale[wc][2]),
    norm(colorScale[wc][3])
  );
}
