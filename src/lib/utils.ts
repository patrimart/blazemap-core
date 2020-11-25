import { ColorGradient, Point, Points, RGBa } from './types';

export const clamp = (min: number, max: number) => (value: number) =>
  Math.max(Math.min(value, max), min);

export const clampU = clamp(0, Number.MAX_SAFE_INTEGER);

export const clampI = clamp(0, 1);

export const pointEq = (a: Point, b: Point): boolean =>
  a === b || a.every((n, i) => n === b[i]);

export const distance = ([x1, y1]: Point, [x2, y2]: Point) =>
  Math.hypot(x2 - x1, y2 - y1);

export const normalize = (min: number, max: number) => (value: number) =>
  (value - min) / (max - min);

export const toRgba = (hex: number): RGBa => {
  const hexStr = hex.toString(16);
  const rgba: RGBa = [
    Number(`0x${hexStr.slice(0, 2)}`),
    Number(`0x${hexStr.slice(2, 4)}`),
    Number(`0x${hexStr.slice(4, 6)}`),
    Number(`0x${hexStr.slice(6)}`),
  ];
  if (rgba.some((v) => Number.isNaN(v) || v < 0 || v > 255))
    throw new Error(
      `The color was not a valid hex with alpha value (0xrrggbbaa): ${hex.toString(
        16
      )}`
    );
  return rgba;
};

export const toHex = ([r, g, b, a]: RGBa): number =>
  Number(
    `0x${r.toString(16)}${g.toString(16)}${b.toString(16)}${a.toString(16)}`
  );

export const tweenRgbas = (
  from: RGBa,
  to: RGBa,
  steps: number
): ReadonlyArray<RGBa> => {
  if (steps < 1)
    throw new Error('tweenRgbas param steps must be greater than 0.');
  const tweens = new Array(steps).fill(from);
  for (let i = 0; i < steps; i++) {
    const delta = normalize(0, steps)(i);
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
  gradient: ColorGradient
): number[] => {
  const [min, max] = Object.keys(gradient)
    .map((k) => {
      const kn = Number(k);
      if (Number.isNaN(kn))
        throw new Error(`ColorGradient keys must be a number: ${gradient}`);
      return kn;
    })
    .reduce(([m, M], v) => [Math.min(m, v), Math.max(M, v)], [
      Number.MAX_SAFE_INTEGER,
      Number.MIN_SAFE_INTEGER,
    ]);

  const [from, to, ...tail] = Object.entries(gradient)
    .map(([k, v]) => [normalize(min, max)(Number(k)), toRgba(v)] as const)
    .sort((a, b) => a[0] - b[0]);

  const ranges: ReadonlyArray<
    readonly [from: readonly [number, RGBa], to: readonly [number, RGBa]]
  > = tail
    .reduce(([h, ...t], g) => [[h[1], g] as const, ...t], [[from, to] as const])
    .reverse();

  const scale: number[] = new Array(256).fill(0);
  for (let i = 0; i < ranges.length; i++) {
    const [[mn, f], [mx, t]] = ranges[i];
    const index = Math.floor(256 / mn);
    const steps = Math.ceil(256 / mx) - index;
    tweenRgbas(f, t, steps)
      .map(toHex)
      .forEach((r, i) => (scale[i + index] = r));
  }

  return scale;
};

export const flattenPoints = (points: Points) =>
  points.reduce<ReadonlyArray<number>>((ps, [x, y, k]) => [...ps, x, y, k], []);
