# 📦 TinyUploadClicker

A tiny but good JavaScript utility that lets you bind any clickable element (buttons, icons, divs, etc.) to trigger a hidden `<input type="file">`. This allows full control over file upload behavior, visual customization, and events — without ever showing the native file input element.

---

## 🚀 Features

* 🎯 **Use any HTML element** as a file input trigger
* 🎨 **Custom attributes and styles** for the input element
* 🔁 **Multiple file selection** support
* 🧠 **Strong runtime validations** with helpful errors
* 🪝 **Lifecycle hooks** for click and file selection
* 🧹 **Clean `destroy()` method** to remove everything
* 🔐 **No dependencies**, pure JS

---

## ✨ Example

```js
const uploader = new TinyUploadClicker({
  triggers: '#uploadBtn',
  accept: ['.png', '.jpg'],
  multiple: true,
  inputAttributes: { 'data-role': 'upload' },
  inputStyles: { display: 'none' },
  onClick: (el) => console.log('Trigger clicked:', el),
  onFileLoad: (files, el) => console.log('Files selected:', files)
});

// Later, cleanup:
uploader.destroy();
```

---

## 🧱 Constructor

### `new TinyUploadClicker(options)`

Creates a new instance of the upload click manager.

#### 🔐 Throws

* `TypeError` if any part of the config is invalid
* `Error` if a trigger selector resolves to no element

#### 💡 Parameters

| Name      | Type                                      | Required | Description                                 |
| --------- | ----------------------------------------- | -------- | ------------------------------------------- |
| `options` | [`UploaderConfig`](#-uploaderconfig-type) | ✅ Yes    | Configuration object for the upload clicker |

---

## 🧩 `UploaderConfig` Type

```ts
type UploaderConfig = {
  triggers: string | HTMLElement | Array<string | HTMLElement>,
  multiple?: boolean,
  accept?: string | string[],
  inputAttributes?: Record<string, string>,
  inputStyles?: Partial<CSSStyleDeclaration>,
  onClick?: ((triggerElement: HTMLElement) => void) | null,
  onFileLoad?: ((files: FileList, triggerElement: HTMLElement) => void) | null
}
```

| Property          | Type                                                    | Default               | Description                                                           |
| ----------------- | ------------------------------------------------------- | --------------------- | --------------------------------------------------------------------- |
| `triggers`        | `string \| HTMLElement \| Array<string \| HTMLElement>` | —                     | Elements (or selectors) that will trigger file selection when clicked |
| `multiple`        | `boolean`                                               | `false`               | Whether multiple files can be selected                                |
| `accept`          | `string \| string[]`                                    | `""`                  | Accepted file types (e.g., `".png"` or `"image/*"`)                   |
| `inputAttributes` | `Record<string, string>`                                | `{}`                  | Extra attributes to apply to the `<input type="file">`                |
| `inputStyles`     | `Partial<CSSStyleDeclaration>`                          | `{ display: 'none' }` | Custom inline styles for the hidden input                             |
| `onClick`         | `(HTMLElement) => void \| null`                         | `null`                | Hook triggered when a trigger is clicked (before file dialog opens)   |
| `onFileLoad`      | `(FileList, HTMLElement) => void \| null`               | `null`                | Hook triggered after files are selected                               |

---

## 🔧 Methods

### `destroy(): void`

Destroys all internal listeners and DOM elements created by the instance.
Cleans up memory and detaches everything from the DOM.

---

## 🛡️ Runtime Validations

The constructor performs strict type validation and helpful error reporting:

* ❌ Missing or invalid `triggers` throws immediately.
* ❌ Selectors that resolve to `null` will throw.
* ❌ Invalid types for `accept`, `onClick`, `onFileLoad`, `inputStyles`, and `inputAttributes` are rejected.
* ✅ Supports string or array for `accept`.

---

## 🛠️ Internal Design

* Each trigger gets its own file input.
* Inputs are stored in a `WeakMap<HTMLElement, HTMLInputElement>`.
* After a file is selected, the input is reset so the same file can be selected again.
* All inputs are appended to `document.body` and styled invisibly by default.
