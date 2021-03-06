import { colorsWarm } from './colors';
import {
  BlazemapOptions,
  ColorGradient,
  HexU32,
  HexU8,
  Point,
  RGBa,
} from './types';

export const clamp = (min: number, max: number) => (value: number) =>
  Math.max(Math.min(value, max), min);

export const clampU8 = clamp(0, 0xff);

export const clampU16 = clamp(0, 0xffff);

export const clampU24 = clamp(0, 0xffffff);

export const clampU32 = clamp(0, 0xffffffff);

export const clampProportion = clamp(0, 1);

export const pointEq = (a: Point, b: Point): boolean =>
  a === b || a.every((n, i) => n === b[i]);

export const distance = ([x1, y1]: Point, [x2, y2]: Point) =>
  Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));

export const normalize = (min: number, max: number) => (value: number) =>
  (value - min) / (max - min);

export const toRgba = (hex: HexU32): RGBa => {
  if (hex < 0 || hex > 0xffffffff) throw new Error(`Invalid hex value: ${hex}`);
  return [
    (hex * 2 ** -24) | 0,
    (hex & 0x00ff0000) >> 16,
    (hex & 0x0000ff00) >> 8,
    hex & 0x000000ff,
  ];
};

export const toHex = ([r, g, b, a]: RGBa): HexU32 =>
  (r | 0) * 2 ** 24 + ((g | 0) << 16) + ((b | 0) << 8) + (a | 0);

export const tweenRgbas = (
  from: RGBa,
  to: RGBa,
  steps: number
): ReadonlyArray<RGBa> => {
  if (steps < 1)
    throw new Error('tweenRgbas param steps must be greater than 0.');
  const tweens = new Array(steps).fill(from);
  for (let i = 0; i < steps; i++) {
    const delta = normalize(0, steps - 1)(i);
    tweens[i] = [
      Math.round(from[0] + (to[0] - from[0]) * delta),
      Math.round(from[1] + (to[1] - from[1]) * delta),
      Math.round(from[2] + (to[2] - from[2]) * delta),
      Math.round(from[3] + (to[3] - from[3]) * delta),
    ];
  }
  return tweens;
};

export const genColorScale = (
  gradient: ColorGradient,
  colorSteps: HexU8 = 0
): RGBa[] => {
  const [min, max] = Object.keys(gradient)
    .map((k) => {
      const kn = Number(k);
      if (Number.isNaN(kn))
        throw new Error(`ColorGradient keys must be a number: ${gradient}`);
      return kn;
    })
    .reduce(([m, M], v) => [Math.min(m, v), Math.max(M, v)], [0xffffffff, 0]);

  const [from, to, ...tail] = Object.entries(gradient)
    .map(([k, v]) => [normalize(min, max)(Number(k)), toRgba(v)] as const)
    .sort((a, b) => a[0] - b[0]);

  const ranges: ReadonlyArray<
    readonly [from: readonly [number, RGBa], to: readonly [number, RGBa]]
  > = tail
    .reduce(([[f, t], ...tl], g) => [[t, g] as const, [f, t] as const, ...tl], [
      [from, to] as const,
    ])
    .reverse();

  const scale: RGBa[] = new Array(256).fill(0);
  for (let i = 0; i < ranges.length; i++) {
    const [[mn, f], [mx, t]] = ranges[i];
    const index = Math.round(256 * mn);
    const steps = Math.round(256 * mx - index);
    tweenRgbas(f, t, steps).forEach((r, i) => (scale[i + index] = r));
  }

  if (colorSteps !== 0) {
    for (let i = 254; i > 0; i--) {
      if (i % Math.round(255 / colorSteps) === 0) {
        i--;
      } else {
        scale[i] = scale[i + 1];
      }
    }
  }

  return scale;
};

export const EOP: Point = [0, 0, 10_000];

export const DEFAULT_OPTIONS = (
  canvas: HTMLCanvasElement
): BlazemapOptions => ({
  width: canvas.getBoundingClientRect().width,
  height: canvas.getBoundingClientRect().height,
  radius: 20,
  blur: 16,
  colors: colorsWarm,
  colorSteps: 0,
});

export function assertValidNumber(
  v: unknown,
  min = 1,
  max = 65_535
): asserts v is number {
  if (!(typeof v === 'number' && v >= min && v <= max)) {
    throw new Error(`The value is not a number within ${min} and ${max}: ${v}`);
  }
}

export const validateOptions = (
  { width, height, radius, blur, colors, colorSteps }: BlazemapOptions,
  options: Readonly<Partial<BlazemapOptions>> = {}
): BlazemapOptions => {
  const opts = { width, height, radius, blur, colors, colorSteps };

  if (options.width) {
    assertValidNumber(options.width);
    opts.width = options.width;
  }

  if (options.height) {
    assertValidNumber(options.height);
    opts.height = options.height;
  }

  if (options.radius) {
    assertValidNumber(options.radius, 1, 255);
    opts.radius = options.radius;
  }

  if (options.blur) {
    assertValidNumber(options.blur, 0, 255);
    opts.blur = options.blur;
  }

  if (options.colors) {
    Object.entries(options.colors).forEach(([k, v]) => {
      assertValidNumber(Number(k), 0, 1);
      assertValidNumber(v, 0, 0xffffffff);
    });
    opts.colors = options.colors;
  }

  if (options.colorSteps) {
    assertValidNumber(options.colorSteps, 0, 255);
    opts.colorSteps = options.colorSteps;
  }

  return opts;
};

/**
 * Delays invocation until the next animation frame (or tick).
 */
export const throttle = <Fn extends (...args: any[]) => any>(fn: Fn) => {
  let resp: Promise<ReturnType<Fn>> | null = null;
  return (...args: Parameters<Fn>) => {
    if (resp === null) {
      resp = new Promise((resolve) =>
        (globalThis?.requestAnimationFrame ?? globalThis.setTimeout)(() => {
          resp = null;
          resolve(fn(...args));
        })
      );
    }
    return resp;
  };
};
