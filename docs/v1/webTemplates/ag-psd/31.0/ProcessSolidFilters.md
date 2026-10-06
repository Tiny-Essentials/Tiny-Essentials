# 🎨 ProcessSolidFilters

> Extract solid colors from PSD layers, generate separated images per filter, and get pixel statistics — in **Node.js** and the **Browser**, with the exact same API.

[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A518-339933?logo=node.js&logoColor=white)](#-nodejs-usage)
[![Browser](https://img.shields.io/badge/Browser-ESM-4285F4?logo=googlechrome&logoColor=white)](#-browser-usage)
[![ag-psd](https://img.shields.io/badge/built%20on-ag--psd-8A2BE2)](#-how-it-works)

---

## 📖 Table of Contents

1. [What is this?](#-what-is-this)
2. [✨ Features](#-features)
3. [🧠 How It Works](#-how-it-works)
4. [📦 Installation](#-installation)
5. [🚀 Quick Start](#-quick-start)
   - [Node.js Usage](#-nodejs-usage)
   - [Browser Usage](#-browser-usage)
   - [Browser File Input Usage](#-browser-file-input-usage)
6. [🎯 Filter Criteria (Matching Rules)](#-filter-criteria-matching-rules)
7. [🧩 API Reference](#-api-reference)
8. [📊 Understanding the Result](#-understanding-the-result)
9. [🍳 Recipes & Daily Workflow](#-recipes--daily-workflow)
10. [🔒 Validation & Error Handling](#-validation--error-handling)
11. [🐛 Troubleshooting](#-troubleshooting)
12. [🧱 Extending the Library](#-extending-the-library)

---

## 🤔 What is this?

`ProcessSolidFilters` is a **dependency-injected factory** that reads a `.psd` file, walks through every visible layer **from bottom to top**, and paints a "solid color map" where each pixel is colored according to the **filter** that claimed the layer.

Think of it as a **paint-by-numbers engine**:

- 🖌️ Each **filter** you define owns one color.
- 🧱 Layers are processed in **painting order** (bottom → top).
- 🏆 When two layers overlap, the **top one wins**.
- 🗂️ You get back a **full composite**, one **image per filter**, **pixel statistics**, and **vector metadata** for every layer.

---

## ✨ Features

| Feature | Description |
| --- | --- |
| 🌍 **Universal** | One core, three runtimes: Node.js, Browser (URL/Blob), Browser (File Input). |
| 🎨 **Solid Color Extraction** | Every matched layer is flattened into a single solid color. |
| 🧮 **Pixel Statistics** | Know exactly how many pixels each filter claimed. |
| 📐 **Vector Metadata** | Get the bounding box, opacity, and name of every layer. |
| 🧩 **Composable Filters** | Combine `startsWith`, `endsWith`, `contains`, `equals`, `matches`, and custom `test`. |
| 🛡️ **Strict Validation** | Every public function throws `TypeError` or `Error` on invalid input. |

---

## 🧠 How It Works

```
┌────────────────┐     ┌──────────────────┐     ┌────────────────────┐
│  PSD File      │ ──▶ │  Flatten Layers  │ ──▶ │  Match Each Layer  │
│  (ag-psd)      │     │  (bottom → top)  │     │  against filters   │
└────────────────┘     └──────────────────┘     └─────────┬──────────┘
                                                          │
                                                          ▼
┌────────────────┐     ┌──────────────────┐     ┌────────────────────┐
│  Results       │ ◀── │  Paint ownerMap  │ ◀── │  Read Pixel Alpha  │
│  (4 outputs)   │     │  (W × H array)   │     │  (threshold > 1)   │
└────────────────┘     └──────────────────┘     └────────────────────┘
```

1. **Read** the PSD into a raw buffer.
2. **Flatten** the layer tree, keeping only visible layers in painting order.
3. **Match** each layer name against your filters (first match wins).
4. **Paint** the `ownerMap`: each pixel stores the `id` of the filter that owns it.
5. **Export** the composite image, one image per filter, stats, and vector data.

> 💡 **Why a flat `ownerMap`?** It's a single `Array<W * H>` of strings. It's cache-friendly, easy to reason about, and lets us do a single pass at the end to build every output image.

---

## 📦 Installation

```bash
npm install ag-psd
# Node.js only:
npm install canvas
```

> ⚠️ The `canvas` package is a **peer dependency for Node.js only**. Browsers use the native `<canvas>`.

---

## 🚀 Quick Start

### 🟢 Node.js Usage

```javascript
import { processPsdSolidFilters } from 'tiny-essentials/webTemplates/ag-psd/31.0/ProcessSolidFilters';
import { writeFile } from 'fs/promises';

const result = await processPsdSolidFilters(
  './artwork.psd',
  [
    { id: 'artist1', color: '#FF0000', startsWith: 'Artist1_' },
    { id: 'artist2', color: '#00FF00', startsWith: 'Artist2_' },
  ],
  { color: '#0000FF' }, // fallback for everything else
);

// Save the full composite
await writeFile('output/full.png', result.fullImageBuffer);

// Save each separated image
for (const { id, buffer } of result.separatedImages) {
  await writeFile(`output/${id}.png`, buffer);
}

console.log('📊 Stats:', result.stats);
console.log('📐 Layers:', result.vectorData.length);
```

---

### 🌐 Browser Usage

```javascript
import { processPsdSolidFilters } from 'tiny-essentials/webTemplates/ag-psd/31.0/ProcessSolidFilters/Browser';

const result = await processPsdSolidFilters(
  'https://example.com/artwork.psd', // URL or Blob
  [{ id: 'lineart', color: '#000000', contains: 'line' }],
  { color: '#FFFFFF' },
);

// `result.fullImageBuffer` is a Blob in the browser
const url = URL.createObjectURL(result.fullImageBuffer);
document.querySelector('img').src = url;
```

---

### 📁 Browser File Input Usage

Perfect for drag-and-drop or `<input type="file">`:

```html
<input type="file" id="psd-input" accept=".psd" />
```

```javascript
import { processPsdSolidFiltersFromFile } from 'tiny-essentials/webTemplates/ag-psd/31.0/ProcessSolidFilters/FileInput';

const input = document.getElementById('psd-input');

input.addEventListener('change', async () => {
  const result = await processPsdSolidFiltersFromFile(
    input, // pass the HTMLInputElement directly ✨
    [{ id: 'background', color: '#CCCCCC', equals: 'Background' }],
    { color: '#FF00FF' },
  );

  console.log('Done!', result.stats);
});
```

---

## 🎯 Filter Criteria (Matching Rules)

Every filter can combine **multiple criteria**. All criteria inside a single filter are combined with **AND**. Values inside a single criterion are combined with **OR**.

| Property | Type | Description |
| --- | --- | --- |
| `id` | `string` | **Required.** Unique identifier for the filter. |
| `color` | `string` | **Required.** HEX color (e.g., `#FF0000`). |
| `startsWith` | `string \| string[]` | Layer name must start with the value(s). |
| `endsWith` | `string \| string[]` | Layer name must end with the value(s). |
| `contains` | `string \| string[]` | Layer name must contain the value(s). |
| `equals` | `string \| string[]` | Layer name must be exactly equal to the value(s). |
| `matches` | `RegExp \| RegExp[]` | Layer name must match the RegExp(s). |
| `test` | `(name: string) => boolean` | Custom predicate for advanced matching. |

### 🧪 Example: Combining criteria

```javascript
{
  id: 'skin',
  color: '#F5CBA7',
  startsWith: ['Skin_', 'Face_'], // OR
  contains: 'final',              // AND
}
// Matches: "Skin_final", "Face_final", "Skin_final_v2"
// Rejects:  "Skin_draft", "Face", "final"
```

> ⚠️ **Avoid the global flag (`/g`)** in `matches`. RegExp objects with `/g` are **stateful** (they remember `lastIndex`), which causes bugs across multiple layers. Use `/pattern/i` instead of `/pattern/gi`.

---

## 🧩 API Reference

### 🏭 `createProcessPsdSolidFilters(validator, createCanvas, readPsd, exportCanvas)`

The factory. It returns the actual `processPsdSolidFilters` function, wired to a specific environment.

| Parameter | Type | Description |
| --- | --- | --- |
| `validator` | `(input) => Promise<Buffer \| ArrayBuffer>` | Converts the input into a raw buffer. |
| `createCanvas` | `(w, h) => Canvas` | Creates a canvas in the target environment. |
| `readPsd` | `typeof import('ag-psd').readPsd` | The `readPsd` function from `ag-psd`. |
| `exportCanvas` | `(canvas) => Promise<Blob \| Buffer>` | Serializes a canvas to PNG. |

**Returns:** `processPsdSolidFilters(psdInput, filters, defaultConfig)`

---

### 🎛️ `processPsdSolidFilters(psdInput, filters, defaultConfig)`

| Parameter | Type | Description |
| --- | --- | --- |
| `psdInput` | `string \| Blob \| HTMLInputElement` | The PSD source (environment-dependent). |
| `filters` | `FilterConfig[]` | The list of filters to apply. |
| `defaultConfig` | `DefaultConfig` | Fallback color for unmatched layers. |

**Returns:** `Promise<ProcessedPsdResult<Data>>`

---

### 🧾 Type Definitions

#### `FilterConfig`

```typescript
interface FilterConfig {
  id: string;
  color: string;
  startsWith?: string | string[];
  endsWith?: string | string[];
  contains?: string | string[];
  equals?: string | string[];
  matches?: RegExp | RegExp[];
  test?: (layerName: string) => boolean;
}
```

#### `DefaultConfig`

```typescript
interface DefaultConfig {
  color: string; // HEX color for unmatched layers
}
```

#### `ProcessedPsdResult<Data>`

```typescript
interface ProcessedPsdResult<Data> {
  fullImageBuffer: Data;
  separatedImages: Array<{ id: string; buffer: Data }>;
  stats: Record<string, number>;
  vectorData: LayerVectorData[];
}
```

#### `LayerVectorData`

```typescript
interface LayerVectorData {
  name: string;
  filterId: string;
  opacity: number; // 0 to 1
  bounds: VectorBounds;
}
```

#### `VectorBounds`

```typescript
interface VectorBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

---

## 📊 Understanding the Result

Given this input:

```javascript
const result = await processPsdSolidFilters('file.psd', [
  { id: 'a', color: '#FF0000', startsWith: 'A_' },
], { color: '#0000FF' });
```

You get:

```javascript
{
  fullImageBuffer: Blob,          // 🖼️ The complete composite
  separatedImages: [              // 🗂️ One image per filter
    { id: 'unfiltered', buffer: Blob },
    { id: 'a',          buffer: Blob },
  ],
  stats: {                        // 🧮 Pixel counts
    unclaimed: 1024,              //    Pixels with no layer
    unfiltered: 2048,             //    Pixels claimed by the fallback
    a: 51200,                     //    Pixels claimed by filter "a"
  },
  vectorData: [                   // 📐 One entry per processed layer
    {
      name: 'A_background',
      filterId: 'a',
      opacity: 1,
      bounds: { x: 0, y: 0, width: 1920, height: 1080 },
    },
  ],
}
```

> 💡 **`unclaimed`** = pixels where no layer painted anything (transparent in the PSD).
> **`unfiltered`** = pixels claimed by a layer that matched **no** filter (fallback color).

---

## 🍳 Recipes & Daily Workflow

### 🎨 Recipe 1: Assign a color per artist

```javascript
const filters = ['alice', 'bob', 'carol'].map((name, i) => ({
  id: name,
  color: ['#FF0000', '#00FF00', '#0000FF'][i],
  startsWith: `${name}_`,
}));
```

### 🔍 Recipe 2: Debug which layer went where

```javascript
for (const layer of result.vectorData) {
  console.log(`📐 ${layer.name} → ${layer.filterId} (opacity: ${layer.opacity})`);
}
```

### 📉 Recipe 3: Detect empty filters

```javascript
for (const [id, count] of Object.entries(result.stats)) {
  if (count === 0) console.warn(`⚠️ Filter "${id}" matched no pixels!`);
}
```

### 🖼️ Recipe 4: Convert a Blob to a data URL (browser)

```javascript
const toDataURL = (blob) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });

const dataURL = await toDataURL(result.fullImageBuffer);
```

---

## 🔒 Validation & Error Handling

The library is **defensive by design**. Every public entry point validates its arguments and throws a **specific** error.

| Scenario | Error Type |
| --- | --- |
| `filters` is not an array | `TypeError` |
| `defaultConfig.color` is missing | `Error` |
| A filter has no `id` | `TypeError` |
| A filter has no matching criteria | `TypeError` |
| Invalid HEX color | `Error` |
| File not found (Node.js) | `Error` |
| Wrong input type for the environment | `TypeError` |

**Always wrap calls in `try/catch`:**

```javascript
try {
  const result = await processPsdSolidFilters(input, filters, { color: '#FFF' });
} catch (error) {
  if (error instanceof TypeError) {
    console.error('❌ Invalid argument:', error.message);
  } else {
    console.error('💥 Runtime error:', error.message);
  }
}
```

---

## 🐛 Troubleshooting

<details>
<summary><strong>❓ My layers are not being matched</strong></summary>

- Check for **invisible characters** or **trailing spaces** in layer names.
- Remember: `startsWith`, `endsWith`, `contains`, and `equals` are **case-sensitive**.
- Use a `test` predicate to debug:

```javascript
{ id: 'debug', color: '#000', test: (name) => {
  console.log('🔍', JSON.stringify(name));
  return false;
}}
```
</details>

<details>
<summary><strong>❓ The output image is fully transparent</strong></summary>

- The PSD might have all layers hidden (`layer.hidden === true`).
- The document dimensions might be `0 × 0`.
- Check `result.stats.unclaimed` — if it equals `W * H`, no layer painted anything.
</details>

<details>
<summary><strong>❓ Node.js throws "Cannot find module 'canvas'"</strong></summary>

Install the peer dependency:

```bash
npm install canvas
```
</details>

<details>
<summary><strong>❓ My RegExp filter behaves inconsistently</strong></summary>

You are probably using the `/g` flag. Remove it. RegExp objects with `/g` are **stateful** and will alternate between `true` and `false` on the same input.
</details>

---

## 🧱 Extending the Library

Because the core is a **factory**, you can add a new runtime in ~20 lines. Here's a Deno example:

```javascript
import { readPsd } from 'npm:ag-psd';
import { createProcessPsdSolidFilters } from './Template.mjs';

export const processPsdSolidFilters = createProcessPsdSolidFilters(
  async (path) => Deno.readFile(path),
  (w, h) => new OffscreenCanvas(w, h),
  readPsd,
  (canvas) => canvas.convertToBlob({ type: 'image/png' }),
);
```

The only contract is:

1. `validator` returns a `Buffer` or `ArrayBuffer`.
2. `createCanvas(w, h)` returns a canvas-like object.
3. `exportCanvas(canvas)` returns a `Promise<Blob | Buffer>`.
