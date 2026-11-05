# 🖼️ TinyImageLoader

`TinyImageLoader` is the image implementation of [`TinyMediaLoader`](./TinyMediaLoader.md). On top of the shared lifecycle it adds intrinsic size helpers, streaming, and a complete animation engine capable of decoding and replaying `GIF`, `APNG`, `WebP` and `AVIF` frames by hand.

---

## ✨ Highlights

* **Everything from `TinyMediaLoader`** — cache, progress, mirror, timeout, events.
* **Intrinsic metrics** — `naturalWidth`, `naturalHeight` and `aspectRatio` without touching the DOM.
* **Four animation modes** — from fully native to a manual frame clock.
* **Frame extraction** — every frame becomes an independent blob stored in a dedicated `TinyMediaCache`.
* **Playback API** — `play`, `pause`, `freeze`, `unfreeze` and `playbackRate`.

---

## 🚀 Quick start

```js
import TinyImageLoader from 'tiny-essentials/libs/html/loader/formats/TinyImageLoader';

const loader = new TinyImageLoader({
  src: './assets/nyan-cat.gif',
  animationControl: 'native',
  decoding: 'async',
  crossOrigin: 'anonymous',
});

loader.on('loaded', () => {
  console.log(loader.naturalWidth, loader.naturalHeight, loader.aspectRatio);
  loader.mount(document.querySelector('#stage'));
  loader.play();
});

await loader.load();
```

---

## ⚙️ Options

Inherits every [`TinyMediaLoader`](./TinyMediaLoader.md) option, plus:

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `crossOrigin` | `'anonymous' \| 'use-credentials' \| null` | `null` | The `crossorigin` attribute applied to the image. |
| `decoding` | `'sync' \| 'async' \| 'auto'` | `'async'` | The `decoding` hint passed to the browser. |
| `stream` | `boolean` | `false` | Downloads the image through `fetch` to expose byte level progress. |
| `animationControl` | `'none' \| 'native' \| 'script-only' \| 'controlled'` | `'none'` | How animated images are handled. |

### Animation modes

| Mode | Description |
| :--- | :--- |
| `none` | The browser renders the image as-is. No frame extraction. |
| `native` | Frames are extracted, but the browser still plays the animation. `freeze()` falls back to the first frame. |
| `script-only` | Frames are extracted and available, but the loader never touches playback. |
| `controlled` | The loader owns a frame clock. Use `play`, `pause`, `freeze`, `unfreeze` and `playbackRate`. **Stable on `WebP`, 95% on `PNG` (APNG), unstable on other formats — see the compatibility status below.** |

### ⚠️ Compatibility status (`controlled` mode)

Frame extraction and the manual frame clock are **not equally stable across every container**. Check the table below before relying on `controlled` in production:

| Format | Status | Notes |
| :--- | :--- | :--- |
| `WebP` | ✅ Stable | Fully working. This is the recommended format. |
| `PNG` (APNG) | 🟡 95% | Works in almost every case. Rare edge cases may show a wrong frame delay or drop a frame. |
| `GIF` / `AVIF` | ⚠️ Unstable | Frame extraction may fail, desynchronize or return incomplete data depending on the encoder. |

**Recommendation:** if you need `controlled` mode, convert the asset to `WebP` first. If you cannot convert it, use `animationControl: 'native'` instead — it is 100% tested and stable on every animated format listed above.

---

## 🧩 Properties

| Getter | Type | Description |
| :--- | :--- | :--- |
| `image` | `HTMLImageElement \| null` | The managed `<img>` element. |
| `stream` | `boolean` | Whether the image is downloaded through `fetch`. |
| `naturalWidth` | `number` | The intrinsic width in pixels. |
| `naturalHeight` | `number` | The intrinsic height in pixels. |
| `aspectRatio` | `number` | `naturalWidth / naturalHeight`, or `0` when unknown. |
| `playbackRate` | `number` | Playback speed modifier (controlled mode). |
| `animationScript` | `AnimationScriptStep[]` | A deep copy of the per-frame delays. |

---

## 🛠️ Methods

### `freeze(frameIndex = null)`

Freezes the animation.

* In `native` mode the first frame is displayed.
* In `controlled` mode the clock stops at `frameIndex` (or at the current frame when omitted).

```js
loader.freeze(0); // back to the first frame
```

### `unfreeze()`

Resumes the animation from the frozen state.

### `play()`

Starts (or resumes) the frame clock. Only available in `controlled` mode.

### `pause()`

Stops the frame clock without changing the current frame. Only available in `controlled` mode.

### `playbackRate` (setter)

Changes the playback speed. Values are clamped to a minimum of `0.1`.

```js
loader.playbackRate = 0.5; // half speed
```

### `animationScript` (setter)

Replaces the per-frame delays. Only available in `controlled` mode.

```js
loader.animationScript = loader.animationScript.map(() => ({ delay: 50 }));
```

---

## 📡 Events

Every event from [`TinyMediaLoader`](./TinyMediaLoader.md#-events) is available. The `metadata` event is emitted with `type: 'PROBE_ANIMATION'` once the animation data has been resolved.

```js
loader.on('metadata', (metadata, type) => {
  if (type === 'PROBE_ANIMATION') {
    console.log(metadata.animation); // { frames, loopCount, duration }
  }
});
```
