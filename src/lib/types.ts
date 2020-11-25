export type Point = readonly [x: number, y: number, k: number];

export type Points = ReadonlyArray<Point>;

export type ColorGradient = Readonly<Record<number, number>>;

export type RGBa = [r: number, g: number, b: number, a: number];
