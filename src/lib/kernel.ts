import { IKernelFunctionThis } from 'gpu.js';

import { HexU8, Proportion } from './types';

export function kernel(
  this: IKernelFunctionThis<{ pointCount: number }>,
  points: [x: number, y: number, p: Proportion][],
  radius: number,
  blur: number,
  colorScale: [r: HexU8, g: HexU8, b: HexU8, a: HexU8][]
) {
  // console.log('colorScale', JSON.stringify(colorScale));
  const x = this.thread.x;
  const y = this.thread.y;

  let weight = 0;

  for (let i = 0; i < this.constants.pointCount; i++) {
    const d = Math.sqrt(
      Math.pow(points[i][0] - x, 2) + Math.pow(points[i][1] - y, 2)
    );
    // console.log('d', d);
    let w = 0;
    if (d < radius) w += 200;
    else if (d < radius + blur * 0.5) w += 100;
    weight += points[i][2] * w;
  }

  const wc = Math.round(Math.max(Math.min(weight, 256), 0));
  // console.log('wc', wc, weight);
  this.color(
    colorScale[wc][0],
    colorScale[wc][1],
    colorScale[wc][2],
    (colorScale[wc][3] - 0) / (255 - 0)
  );
}
