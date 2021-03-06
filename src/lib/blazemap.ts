import { GPU, IKernelRunShortcut } from 'gpu.js';

import { kernelInit } from './kernel';
import { BlazemapOptions, ColorGradient, HexU8, Point, Points } from './types';
import {
  assertValidNumber,
  DEFAULT_OPTIONS,
  EOP,
  genColorScale,
  validateOptions,
} from './utils';

/**
 * Initialize the Blazemap.
 * @param canvas
 * @param options
 * @param maxPoints
 */
export const blazemap = (
  canvas: HTMLCanvasElement,
  options: Readonly<
    Partial<Pick<BlazemapOptions, 'radius' | 'blur' | 'colors' | 'colorSteps'>>
  > = {},
  maxPoints = 1000
) => {
  assertValidNumber(maxPoints, 1, 100_000);
  let opts = validateOptions(DEFAULT_OPTIONS(canvas), options);
  let colorScale = genColorScale(opts.colors, opts.colorSteps);
  let pts: Point[] = [];
  let maxWeight = 1000;
  let currentKernel: IKernelRunShortcut | undefined;

  const context = canvas.getContext('webgl2', { premultipliedAlpha: false });
  if (context === null) throw new Error('Canvas context returned null.');

  const gpu = new GPU({ canvas, context });

  const createKernel = () => {
    currentKernel?.destroy();
    currentKernel = gpu
      .createKernel(kernelInit, {
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
        constants: { maxPoints },
        output: [opts.width, opts.height],
      })
      .setLoopMaxIterations(maxPoints);
  };

  createKernel();

  const findMaxWeight = () => {
    const diam = opts.radius - opts.blur * 0.5;
    const grid = [1];

    for (let i = 0; i < pts.length; i++) {
      const [x, y, p] = pts[i];
      const index = Math.round((x / diam) * (y / diam));
      grid[index] = (grid[index] ?? 0) + p;
    }

    maxWeight = grid.reduce((max, v) => Math.max(max, v));
  };

  /****************************************************************************
   * PUBLIC FUNCTIONS
   */

  const setHeatmap = (
    radius: number,
    blur: number,
    colors?: ColorGradient,
    colorSteps?: HexU8
  ) => {
    opts = validateOptions(opts, { radius, blur, colors, colorSteps });
    colorScale = genColorScale(opts.colors, opts.colorSteps);
    findMaxWeight();
  };

  const resize = () => {
    opts = validateOptions(opts, {
      width: canvas.width,
      height: canvas.height,
    });
    findMaxWeight();
    createKernel();
  };

  const resizeTo = (width: number, height: number) => {
    opts = validateOptions(opts, { width, height });
    canvas.width = opts.width;
    canvas.height = opts.height;
    findMaxWeight();
    createKernel();
  };

  const setPoints = (points: Points) => {
    pts = points.filter((p) => p[0] > 0 && p[1] > 0);
    findMaxWeight();
  };

  const addPoint = (...point: Points) => {
    setPoints(point.concat(pts));
  };

  const modifyPoints = (fn: (ps: Points) => Points) =>
    setPoints(fn(pts.slice(0)));

  const clearPoints = () => setPoints([]);

  const render = () => {
    currentKernel?.(
      (pts.concat([EOP]) as unknown) as number[][],
      opts.radius,
      opts.blur,
      (colorScale as unknown) as number[][],
      maxWeight
    );
  };

  const destroy = () => gpu.destroy();

  return {
    render,
    resize,
    resizeTo,
    setHeatmap,
    setPoints,
    addPoint,
    modifyPoints,
    clearPoints,
    destroy,
  };
};

export type BlazeMap = ReturnType<typeof blazemap>;
