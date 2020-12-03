import { GPU, IKernelRunShortcut } from 'gpu.js';

import { kernelInit } from './kernel';
import { BlazemapOptions, ColorGradient, Point, Points } from './types';
import { DEFAULT_OPTIONS, EOP, genColorScale, validateOptions } from './utils';

/**
 * Initiate the Blazemap.
 * @param canvas
 * @param options
 * @param maxPoints
 */
export const blazemap = (
  canvas: HTMLCanvasElement,
  options: Readonly<
    Partial<Pick<BlazemapOptions, 'radius' | 'blur' | 'colors'>>
  > = {},
  maxPoints = 1000
) => {
  let opts = validateOptions(DEFAULT_OPTIONS(canvas), options);
  let colorScale = genColorScale(opts.colors);
  let pts: Point[] = [];
  let maxWeight = 0;
  let currentKernel: IKernelRunShortcut | undefined;

  const context = canvas.getContext('webgl2', { premultipliedAlpha: false });
  if (context === null) throw new Error('Canvas context returned null.');

  const gpu = new GPU({ canvas, context });

  const createKernel = () => {
    currentKernel?.destroy();
    const k = gpu.createKernel(kernelInit, {
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
    });
    k.setLoopMaxIterations(maxPoints);

    currentKernel = k;
  };

  createKernel();

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

  /****************************************************************************
   * PUBLIC FUNCTIONS
   */

  const setHeatmap = (radius: number, blur: number, colors: ColorGradient) => {
    opts = validateOptions(opts, { radius, blur, colors });
    colorScale = genColorScale(opts.colors);
    findMaxCluster();
  };

  const resize = (width: number, height: number) => {
    opts = validateOptions(opts, { width, height });
    canvas.width = opts.width;
    canvas.height = opts.height;
    findMaxCluster();
    createKernel();
  };

  const setPoints = (points: Points) => {
    pts = points.slice(0);
    findMaxCluster();
  };

  const addPoint = (...point: Points) => {
    setPoints(point.concat(pts));
  };

  const modifyPoints = (fn: (ps: Points) => Points) =>
    setPoints(fn(pts.slice(0)));

  const clearPoints = () => setPoints([]);

  const render = () => {
    // console.time();
    currentKernel?.(
      (pts.concat([EOP]) as unknown) as number[][],
      opts.radius,
      opts.blur,
      (colorScale as unknown) as number[][],
      maxWeight
    );
    // console.timeEnd();
  };

  const destroy = () => gpu.destroy();

  return {
    render,
    resize,
    setHeatmap,
    setPoints,
    addPoint,
    modifyPoints,
    clearPoints,
    destroy,
  };
};
