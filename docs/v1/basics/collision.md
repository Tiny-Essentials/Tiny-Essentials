# 📦 Collision Detection Module

This module provides a complete and flexible system for detecting collisions between rectangles (like DOM elements), extracting direction, depth, and center alignment data.

---

## 📑 Table of Contents

- [📐 Type Definitions](#-type-definitions)
  - [`Dirs`](#dirs)
  - [`CollDirs`](#colldirs)
  - [`NegCollDirs`](#negcolldirs)
  - [`CollData`](#colldata)
  - [`CollCenter`](#collcenter)
  - [`ObjRect`](#objrect)
- [🔍 Collision Checks](#-collision-checks)
  - [Loose Collision (Partial Overlap Only)](#loose-collision-partial-overlap-only)
  - [Perfect Collision (Touch or Overlap)](#perfect-collision-touch-or-overlap)
  - [Collision Direction (Single Side Detection)](#collision-direction-single-side-detection)
- [🔬 Overlap & Direction](#-overlap--direction)
  - [`getElsCollOverlap(rect1, rect2)`](#getelscolloverlaprect1-rect2)
  - [`getElsCollOverlapPos({ overlapLeft, overlapRight, overlapTop, overlapBottom })`](#getelscolloverlappos-overlapleft-overlapright-overlaptop-overlapbottom-)
- [🎯 Center Detection](#-center-detection)
  - [`getRectCenter(rect)`](#getrectcenterrect)
  - [`getElsRelativeCenterOffset(rect1, rect2)`](#getelsrelativecenteroffsetrect1-rect2)
- [🧠 Direction & Depth](#-direction--depth)
  - [`getElsCollDirDepth(rect1, rect2)`](#getelscolldirdepthrect1-rect2)
  - [`getElsCollDetails(rect1, rect2)`](#getelscolldetailsrect1-rect2)
- [🧪 Example Use](#-example-use)

---

## 📐 Type Definitions

### `Dirs`

```ts
'top' | 'bottom' | 'left' | 'right'
```

🔁 A direction relative to a rectangle. Represents one of the four cardinal sides.

---

### `CollDirs`

```ts
{
  in: Dirs | 'center' | null;
  x: Dirs | null;
  y: Dirs | null;
}
```

🚦 Represents all directional aspects of a collision:

* `in`: Dominant entry direction (`null` if no collision, `'center'` if perfectly aligned).
* `x`: Collision bias on X axis.
* `y`: Collision bias on Y axis.

---

### `NegCollDirs`

```ts
{
  x: Dirs | null;
  y: Dirs | null;
}
```

❌ Negative collision flags indicating **gap** instead of overlap.

---

### `CollData`

```ts
{
  top: number;
  bottom: number;
  left: number;
  right: number;
}
```

📏 Collision depth (in pixels) from each side of `rect2` into `rect1`.

* Positive values = overlap
* Negative values = no collision (gap)

---

### `CollCenter`

```ts
{
  x: number;
  y: number;
}
```

🎯 Offset from the center of `rect1` to the center of `rect2`.

---

### `ObjRect`

```ts
{
  height: number;
  width: number;
  top: number;
  bottom: number;
  left: number;
  right: number;
}
```

📦 Generic rectangle object, similar to `DOMRect`.

---

## 🔍 Collision Checks

### Loose Collision (Partial Overlap Only)

| Function                         | Description                             |
| -------------------------------- | --------------------------------------- |
| `areElsCollTop(rect1, rect2)`    | `rect1` is **above** `rect2`            |
| `areElsCollBottom(rect1, rect2)` | `rect1` is **below** `rect2`            |
| `areElsCollLeft(rect1, rect2)`   | `rect1` is **left of** `rect2`          |
| `areElsCollRight(rect1, rect2)`  | `rect1` is **right of** `rect2`         |
| `areElsColliding(rect1, rect2)`  | Returns `true` if **any side overlaps** |

---

### Perfect Collision (Touch or Overlap)

| Function                             | Description                                        |
| ------------------------------------ | -------------------------------------------------- |
| `areElsCollPerfTop(rect1, rect2)`    | `rect1` is **fully above** or touching `rect2`     |
| `areElsCollPerfBottom(rect1, rect2)` | `rect1` is **fully below** or touching `rect2`     |
| `areElsCollPerfLeft(rect1, rect2)`   | `rect1` is **fully left** or touching `rect2`      |
| `areElsCollPerfRight(rect1, rect2)`  | `rect1` is **fully right** or touching `rect2`     |
| `areElsPerfColliding(rect1, rect2)`  | Returns `true` if there's **any overlap or touch** |

---

### Collision Direction (Single Side Detection)

| Function                            | Returns                                            |
| ----------------------------------- | -------------------------------------------------- |
| `getElsColliding(rect1, rect2)`     | `'left'`, `'right'`, `'top'`, `'bottom'` or `null` |
| `getElsPerfColliding(rect1, rect2)` | Same as above, but includes **touch detection**    |

---

## 🔬 Overlap & Direction

### `getElsCollOverlap(rect1, rect2)`

📏 Returns the depth of overlap between two rectangles:

```js
{
  overlapLeft,
  overlapRight,
  overlapTop,
  overlapBottom
}
```

---

### `getElsCollOverlapPos({ overlapLeft, overlapRight, overlapTop, overlapBottom })`

📍 Determines which axis and direction has the strongest collision.

```js
{
  dirX: 'left' | 'right',
  dirY: 'top' | 'bottom'
}
```

---

## 🎯 Center Detection

### `getRectCenter(rect)`

Returns the **center X and Y coordinates** of a rectangle.

---

### `getElsRelativeCenterOffset(rect1, rect2)`

Returns the distance from `rect1`'s center to `rect2`'s center:

```js
{
  x: number,
  y: number
}
```

✅ Values are `0` when centers are aligned.

---

## 🧠 Direction & Depth

### `getElsCollDirDepth(rect1, rect2)`

Detects:

* Which axis has the dominant collision
* Overlap depths

```js
{
  inDir: 'left' | 'right' | 'top' | 'bottom' | null,
  dirX: 'left' | 'right' | null,
  dirY: 'top' | 'bottom' | null,
  depthX: number,
  depthY: number
}
```

---

### `getElsCollDetails(rect1, rect2)`

🔍 Full analysis of the collision:

* Depth of overlap
* Direction of entry
* Negative axis gaps
* Center hit detection

```js
{
  depth: CollData,
  dirs: CollDirs,
  isNeg: NegCollDirs
}
```

---

## 🧪 Example Use

```js
const box = element1.getBoundingClientRect();
const wall = element2.getBoundingClientRect();

const result = getElsCollDetails(box, wall);

console.log(result.depth); // { top, bottom, left, right }
console.log(result.dirs.in); // e.g. 'left'
console.log(result.isNeg); // e.g. { x: 'left', y: null }
```
