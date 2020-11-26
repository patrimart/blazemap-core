import { GPU } from 'gpu.js';

import { ColorGradient, Point, Points } from './types';
import { clamp, distance, genColorScale, toRgba } from './utils';

export interface BlazemapOptions {
  readonly width: number;
  readonly height: number;
  readonly radius: number;
  readonly blur: number;
  readonly colors: ColorGradient;
}

const validateOptions = (options: Readonly<Partial<BlazemapOptions>> = {}) => ({
  width: options.width ?? 480,
  height: options.height ?? 260,
  radius: options.radius ?? 25,
  blur: options.blur ?? 15,
  colors: options.colors ?? {
    0: 0x0000ff00,
    0.2: 0x0000ff22,
    0.65: 0x00ff0066,
    1: 0xff0000ee,
  },
});

export const blazemap = (canvas: HTMLCanvasElement, options: Readonly<Partial<BlazemapOptions>> = {}) => {
  const opts: BlazemapOptions = validateOptions(options);

  let colorScale = genColorScale(opts.colors);

  const pts: Point[] = [];

  const context = canvas.getContext('2d', { alpha: true });
  if (context === null) throw new Error('Canvas context returned null.');
  // context.globalAlpha = 0.5;

  const gpu = new GPU({
    canvas,
    context,
    mode: 'gpu',
  });

  const krender = gpu
    .createKernel(function (
      points: [x: number, y: number, k: number][],
      radius: number,
      blur: number,
      colorScale: [r: number, g: number, b: number, a: number][]
    ) {
      const [x, y] = [this.thread.x, this.thread.y];

      let weight = 0;

      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const d = distance(point, [x, y, 1]);
        let w = 0;
        if (d < radius) w = 1;
        if (d < radius + blur * 0.5) w = 0.25;
        weight += point[2] * w;
      }

      const color = colorScale[clamp(0, 255)(weight)];

      this.color(...color);
    })
    .setDebug(true)
    .setGraphical(true)
    .setCanvas(canvas);

  const setOptions = (options: Readonly<Partial<BlazemapOptions>>) => {
    Object.assign(validateOptions, options);
    if (options.colors) {
      colorScale = genColorScale(options.colors);
    }
  };

  const setPoints = (points: Points) => {
    while (pts.pop());
    pts.push(...points);
  };

  const addPoint = (point: Point) => {
    pts.push(point);
  };

  const modifyPoints = (fn: (ps: Points) => Points) =>
    setPoints(fn(pts.slice(0)));

  const clearPoints = () => {
    while (pts.pop());
  };

  const render = () => {
    canvas.width = opts.width;
    canvas.height = opts.height;
    krender.setOutput([opts.width, opts.height])(
      (pts as unknown) as number[][],
      opts.radius,
      opts.blur,
      colorScale.map(toRgba)
    );
  };

  return {
    render,
    setOptions,
    setPoints,
    addPoint,
    modifyPoints,
    clearPoints,
  };
};
