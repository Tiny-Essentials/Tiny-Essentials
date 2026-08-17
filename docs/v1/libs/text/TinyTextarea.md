# ✨ `TinyTextarea`

A lightweight JavaScript utility for automatically resizing `<textarea>` elements as users type — without ugly scrollbars!

---

## 📦 Features

* 🔁 **Auto-resizing**: Grows or shrinks with the content
* 🚫 **No scrollbars** (until limit): Prevents `overflow-y` unless needed
* 🔧 **Configurable**: Set `maxRows`, `extraHeight`, and hooks
* 📡 **Live events**: Hooks for `onInput` and `onResize`
* 🧼 **Clean lifecycle**: Includes `.refresh()` and `.destroy()`

---

## 🚀 Usage

```js
import TinyTextarea from 'tiny-essentials/libs/text/TinyTextarea';

const textarea = document.querySelector('textarea');

const autoResize = new TinyTextarea(textarea, {
  maxRows: 8,
  extraHeight: 0,
  onResize: (info) => console.log('Resized:', info),
  onInput: (info) => console.log('Input event:', info),
});
```

To stop behavior and clean up:

```js
autoResize.destroy();
```

---

## 🔧 Constructor

```js
new TinyTextarea(textarea, options?);
```

### Parameters

| Name                  | Type                          | Description                                           |
| --------------------- | ----------------------------- | ----------------------------------------------------- |
| `textarea`            | `HTMLTextAreaElement`         | The `<textarea>` element to be managed.               |
| `options`             | `Object` *(optional)*         | Configuration options.                                |
| `options.maxRows`     | `number`                      | Max number of visible rows before scrollbars appear.  |
| `options.extraHeight` | `number`                      | Extra height (in px) to add on top of computed value. |
| `options.onResize`    | `(info: OnInputInfo) => void` | Called when number of visible rows changes.           |
| `options.onInput`     | `(info: OnInputInfo) => void` | Called on every `input` event.                        |

---

## 📚 API

### `.getData() → { height, rows }`

Returns the last known height and number of visible rows.

```js
const { height, rows } = autoResize.getData();
```

---

### `.refresh()`

Forces a manual recalculation and resize of the `<textarea>`.

```js
autoResize.refresh();
```

---

### `.destroy()`

Cleans up listeners and disables resizing behavior. Use this if you remove the element or want to stop automatic behavior.

```js
autoResize.destroy();
```

---

### 🔍 Getters

TinyTextarea exposes several readonly properties to let you inspect the current configuration and state of the managed `<textarea>`.

#### 📏 `lineHeight: number`

Returns the height in pixels of a single line of text in the textarea, computed from its current CSS styles.
Useful for calculating exact space usage or aligning UI elements.

---

#### 📐 `maxRows: number`

Returns the maximum number of visible text rows allowed before the textarea begins to scroll.
This value reflects the limit set via `options.maxRows`.

---

#### ➕ `extraHeight: number`

Returns the number of extra pixels added to the calculated height of the textarea.
This is useful for custom padding or visual adjustments.

---

#### 📏 `currentHeight: number`

Returns the most recently applied height (in pixels) that was set on the `<textarea>` after resizing.

---

#### 📊 `currentRows: number`

Returns the most recent number of visible text rows that the textarea is currently using.
This value is calculated dynamically and may change as the user types.

---

#### 🧩 `textarea: HTMLTextAreaElement`

Returns the original `<textarea>` DOM element that was enhanced by this instance.
You can use this for direct styling, value changes, or other DOM-level operations.

---

## 📤 Event Payload: `OnInputInfo`

Whenever `onResize` or `onInput` is triggered, the following object is passed:

```ts
{
  breakLines: number;    // Total number of '\n' in the textarea
  height: number;        // Final computed height (px)
  scrollHeight: number;  // Natural scrollHeight of textarea
  maxHeight: number;     // Max height before scrollbars show
  lineHeight: number;    // Height of one line of text
  maxRows: number;       // Maximum number of visible rows allowed
  rows: number;          // Final calculated number of rows used
}
```

---

## 🧪 Beta Notice

> 🧪 This library is currently marked as `@beta`. The API is stable but may be adjusted slightly during updates.
