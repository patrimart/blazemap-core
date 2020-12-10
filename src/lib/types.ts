export type Proportion = number;

export type HexU8 = number;

export type HexU16 = number;

export type HexU24 = number;

export type HexU32 = number;

export type Point = readonly [x: number, y: number, p: Proportion];

export type Points = ReadonlyArray<Point>;

export type ColorGradient = Readonly<Record<Proportion, HexU32>>;

export type RGBa = readonly [r: HexU8, g: HexU8, b: HexU8, a: HexU8];

export interface BlazemapOptions {
  readonly width: HexU16;
  readonly height: HexU16;
  readonly radius: HexU8;
  readonly blur: HexU8;
  readonly colors: ColorGradient;
  readonly colorSteps: HexU8;
}
