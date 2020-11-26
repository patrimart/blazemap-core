export type Proportion = number;

export type HexU8 = number;

export type HexU16 = number;

export type HexU24 = number;

export type HexU32 = number;

export type Point = readonly [x: number, y: number, p: Proportion];

export type Points = ReadonlyArray<Point>;

export type ColorGradient = Readonly<Record<Proportion, HexU32>>;

export type RGBa = readonly [r: HexU8, g: HexU8, b: HexU8, a: HexU8];
