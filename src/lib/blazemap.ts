import { GPU } from 'gpu.js';

import { kernel } from './kernel';
import { ColorGradient, Point, Points } from './types';
import { genColorScale } from './utils';

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
    0: 0x0000cc00,
    0.2: 0x0000cc22,
    0.65: 0x88880066,
    1: 0xee0000dd,
  },
});

export const blazemap = (
  canvas: HTMLCanvasElement,
  options: Readonly<Partial<BlazemapOptions>> = {}
) => {
  const opts: BlazemapOptions = validateOptions(options);
  let colorScale = genColorScale(opts.colors);
  const pts: Point[] = [];

  const context = canvas.getContext('webgl2', { premultipliedAlpha: false });
  if (context === null) throw new Error('Canvas context returned null.');

  const gpu = new GPU({ canvas, context });

  const krender = gpu.createKernel(kernel, {
    argumentTypes: {
      a: 'Array',
      b: 'Integer',
      c: 'Integer',
      d: 'Array',
    },
    graphical: true,
  });

  const setOptions = (options: Readonly<Partial<BlazemapOptions>>) => {
    Object.assign(validateOptions, options);
    if (options.colors) {
      colorScale = genColorScale(options.colors);
    }
    if (options.width || options.height) {
      canvas.width = options.width ?? opts.width;
      canvas.height = options.height ?? opts.height;
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
    krender.setConstants({ pointCount: pts.length });
    krender.setOutput([opts.width, opts.height]);
    krender(
      (pts as unknown) as number[][],
      opts.radius,
      opts.blur,
      (colorScale as unknown) as number[][]
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
