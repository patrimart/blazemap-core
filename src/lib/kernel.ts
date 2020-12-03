import { IKernelFunctionThis } from 'gpu.js';

import { HexU8, Proportion } from './types';

export type KernelInit = (
  this: IKernelFunctionThis<{ maxPoints: number }>,
  points: [x: number, y: number, p: Proportion][],
  radius: number,
  blur: number,
  colorScale: [r: HexU8, g: HexU8, b: HexU8, a: HexU8][],
  maxWeight: number
) => void;

export function kernel(
  this: IKernelFunctionThis<{ maxPoints: number }>,
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

  for (let i = 0; i < this.constants.maxPoints; i++) {
    if (points[i][2] == 10_000) break;
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

export const kernelInit = (new Function(
  'points',
  'radius',
  'blur',
  'colorScale',
  'maxWeight',
  `{
    function clampit(v) {
      return Math.round(Math.max(Math.min(v, 255), 0));
    }
    function distance(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    }
    function norm(v) {
        return (v - 0) / (255 - 0);
    }
    function easeFade(d, r, b) {
        if (d < r - b * 0.5)
            return 1;
        return (1 -
            Math.min(1, (((r + b * 0.5) / (r + b * 0.5 - (r - b * 0.5))) *
                (d - (r - b * 0.5))) /
                (r + b * 0.5)));
    }
    var x = this.thread.x;
    var y = this.thread.y;
    var weight = 0;
    for (var i = 0; i < this.constants.maxPoints; i++) {
        if (points[i][2] == 10000)
            break;
        var d = distance(points[i][0], points[i][1], x, y);
        var w = easeFade(d, radius, blur);
        weight += points[i][2] * w;
    }
    var wc = clampit((weight / maxWeight) * 255);
    this.color(norm(colorScale[wc][0]), norm(colorScale[wc][1]), norm(colorScale[wc][2]), norm(colorScale[wc][3]));
  }`
) as unknown) as KernelInit;
