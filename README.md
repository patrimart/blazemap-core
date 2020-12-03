# @blazemap/core

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/patrimart/blazemap-core/blob/main/LICENSE)
[![npm version](https://img.shields.io/npm/v/@blazemap/core.svg?style=flat)](https://www.npmjs.com/package/@blazemap/core)

A blazing fast heatmap library. GPU-accelerated by GPU.js. Written in TypeScript.

## Installation

### npm

```bash
npm install @blazemap/core --save
```

### yarn

```bash
yarn add @blazemap/core
```

---

## Other Libraries

- [@blazemap/react](#) - coming soon

- [@blazemap/react-leaflet](#) - coming soon

- [@blazemap/react-google](#) - coming soon

---

## How To Use

Basic Blazemap initialization.

```ts
const blaze = blazemap(canvasElement);

blaze.setPoints([
  [100, 100, 1],
  [145, 130, 1],
]);

blaze.render();
```

Advanced Blazemap initialization.

```ts
import { colorsCold } from '@blazemap/core`;

const options: Partial<BlazemapOptions> = {
  radius: 20,
  blur: 10,
  colors: colorsCold,
};

const maxPoints = 2000;

const blaze = blazemap(canvasElement, options, maxPoints);

blaze.setPoints([
  [100, 100, 1],
  [145, 130, 1],
]);

blaze.render();
```

### Resizing

Resizing the Blazemap canvas is a performance-heavy operation. It is likely to not exceed 60 FPS (`resize()` and `resizeTo(w, h)`). It's advised to debounce calls to these functions.

### Render

The `render()` function must be called after any changes to the Blazemap. A re-render will easily exceed 60 FPS.

### Destroy

Invoke the `destroy()` function when the `<canvas />` is removed.

---

## Interface

The interface is basically the initializer and the returned functions.

```ts
blazemap(canvas: HTMLCanvasElement, options?: BlazemapOptions, maxPoint?: number)
```

#### Parameters

- `canvas: HTMLCanvasElement` - The canvas on which to render the heatmap.

- `options: BlazemapOptions` - (Default: `{ radius: 20, blur: 16, colors: colorsWarm }`) - Initial options to set.

- `maxPoints: number` - (Default: `1000`) Sets the maximum points to display.

#### Returns

- `addPoint(...points: Points)`: Add one or more points to the heatmap.

- `clearPoints()`: Remove all points from the heatmap.

- `destroy()`: Cleans up the Blazemap resources.

- `modifyPoints(fn: (ps: Points) => Points)`: Accepts a "reducer" to modify the points.

- `render()`: Renders the heatmap to the canvas.

- `resize()`: Resizes the heatmap using the canvas size.

- `resizeTo(w: number, h: number)`: Resizes the heatmap and sets the canvas size.

- `setHeatmap(radius: number, blur: number, colors?: ColorGradient)`: Sets the visual paramters fot the heatmap.

- `setPoints(points: Points)`: Replaces the points in the heatmap.

---

## Types

```ts
// Float from 0 to 1
export type Proportion = number;

// Unsinged 32-bit Integer
export type HexU32 = number;

// Defines the color gradient of the heatmap.
export type ColorGradient = Readonly<Record<Proportion, HexU32>>;

// x, y coordinates. The proportional weight of the point 0-1.
export type Point = readonly [x: number, y: number, p: Proportion];

// An array of Points
export type Points = ReadonlyArray<Point>;

// Possible options to set for Blazemap.
export interface BlazemapOptions {
  readonly width: number;
  readonly height: number;
  readonly radius: number;
  readonly blur: number;
  readonly colors: ColorGradient;
}
```

## Pre-defined Color Gradients

Import a color gradient:

```ts
import { colorsHot } from '@blazemap/core';
```

Available color gradients:

- colorsHot
- colorsWarm
- colorsCold
- colorsGrey
- colorsWhite

---

## Performance

Show performance benchmarks here.

---

## MIT License

### Copyright (c) 2020 Patrick Martin

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
