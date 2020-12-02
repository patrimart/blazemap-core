import { GPU } from 'gpu.js';

import { colorsWarm } from './colors';
import { kernelInit } from './kernel';
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
  radius: options.radius ?? 20,
  blur: options.blur ?? 16,
  colors: options.colors ?? colorsWarm,
});

export const blazemap = (
  canvas: HTMLCanvasElement,
  options: Readonly<Partial<BlazemapOptions>> = {}
) => {
  const opts: BlazemapOptions = validateOptions(options);
  let colorScale = genColorScale(opts.colors);
  let pts: Point[] = [];
  let maxWeight = 0;

  const context = canvas.getContext('webgl2', { premultipliedAlpha: false });
  if (context === null) throw new Error('Canvas context returned null.');

  const gpu = new GPU({ canvas, context });

  const krender = gpu.createKernel(kernelInit, {
    argumentTypes: {
      a: 'Array',
      b: 'Integer',
      c: 'Integer',
      d: 'Array',
      e: 'Integer',
    },
    graphical: true,
    immutable: true,
    dynamicArguments: true,
    dynamicOutput: true,
  });

  const findMaxCluster = () => {
    const diam = opts.radius * 2;
    const grid = new Array(
      Math.ceil((opts.width / diam) * (opts.height / diam))
    );
    grid[0] = 0;
    for (let i = 0; i < pts.length; i++) {
      const [x, y, p] = pts[i];
      const index = Math.round((x / diam) * (y / diam));
      grid[index] = (grid[index] ?? 0) + p;
    }
    maxWeight = grid.reduce((max, v) => Math.max(max, v));
  };

  const setOptions = (options: Readonly<Partial<BlazemapOptions>>) => {
    Object.assign(opts, validateOptions({ ...opts, ...options }));
    if (options.colors) {
      colorScale = genColorScale(options.colors);
    }
    if (options.width || options.height) {
      canvas.width = options.width ?? opts.width;
      canvas.height = options.height ?? opts.height;
      findMaxCluster();
    }
  };

  const setPoints = (points: Points) => {
    pts = points.slice(0);
    findMaxCluster();
  };

  const addPoint = (...point: Points) => {
    setPoints(pts.concat(point));
  };

  const modifyPoints = (fn: (ps: Points) => Points) =>
    setPoints(fn(pts.slice(0)));

  const clearPoints = () => setPoints([]);

  const render = () => {
    krender.setConstants({ pointCount: pts.length });
    krender.setOutput([opts.width, opts.height]);
    krender(
      (pts as unknown) as number[][],
      opts.radius,
      opts.blur,
      (colorScale as unknown) as number[][],
      maxWeight
    );
  };

  const destroy = () => {
    krender.destroy();
    gpu.destroy();
  };

  return {
    render,
    setOptions,
    setPoints,
    addPoint,
    modifyPoints,
    clearPoints,
    destroy,
  };
};
