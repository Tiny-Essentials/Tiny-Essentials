# 📋 TinyClipboard Documentation

A lightweight utility class for clipboard interactions with support for modern Clipboard API, custom overrides, and legacy fallback methods like `execCommand`.

## 📑 Table of Contents

- [🚀 Features](#-features)
- [🏗️ Class: `TinyClipboard`](#-class-tinyclipboard)
  - [🔧 Constructor](#-constructor)
- [✍️ Copy Methods](#-copy-methods)
  - [📄 `copyText(text: string): Promise<void>`](#-copytexttext-string-promisevoid)
  - [🧩 `copyBlob(blob: Blob): Promise<void>`](#-copyblobblob-blob-promisevoid)
- [🧠 Override Methods](#-override-methods)
  - [🛠️ `setCopyText(callback: (text: string) => Promise<void>)`](#-setcopytextcallback-text-string--promisevoid)
  - [🛠️ `setCopyBlob(callback: (blob: Blob) => Promise<void>)`](#-setcopyblobcallback-blob-blob--promisevoid)
- [📥 Read Methods](#-read-methods)
  - [🧾 `readText(index?: number = 0): Promise<string|null>`](#-readtextindex-number--0-promisestringnull)
  - [🖼️ `readCustom(mimeFormat?: string, fixValue?: boolean, index?: number): Promise<Blob|null>`](#-readcustommimeformat-string-fixvalue-boolean-index-number-promiseblobnull)
  - [📚 `readAllTexts(): Promise<string[]>`](#-readalltexts-promisestring)
  - [🧳 `readAllCustom(mimeFormat?: string, fixValue?: boolean): Promise<Blob[]>`](#-readallcustommimeformat-string-fixvalue-boolean-promiseblob)
  - [🔎 `readAllData(type?: 'text' | 'custom', mimeFormat?: string): Promise<Array<string | Blob>>`](#-readalldatatype-text--custom-mimeformat-string-promisearraystring--blob)
  - [🔢 `readIndex(index: number): Promise<ClipboardItem|null>`](#-readindexindex-number-promiseclipboarditemnull)
  - [🗃️ `readAll(): Promise<ClipboardItem[]>`](#-readall-promiseclipboarditem)
- [🧪 Internal (Private) Helpers](#-internal-private-helpers)
- [✅ Getters](#-getters)
  - [📎 `isExecCommandAvailable(): boolean`](#-isexeccommandavailable-boolean)
  - [📎 `isNavigatorClipboardAvailable(): boolean`](#-isnavigatorclipboardavailable-boolean)
  - [🧪 `getCopyTextFunc(): ((text: string) => Promise<void>) | null`](#-getcopytextfunc-text-string--promisevoid--null)
  - [🧪 `getCopyBlobFunc(): ((blob: Blob) => Promise<void>) | null`](#-getcopyblobfunc-blob-blob--promisevoid--null)
- [🧠 Usage Example](#-usage-example)
- [🔒 Notes](#-notes)

---

## 🚀 Features

* ✅ Supports copying and reading **plain text**
* ✅ Supports copying and reading **binary data (Blob)**
* ✅ Automatically detects support for modern Clipboard API
* ✅ Fallback for legacy `document.execCommand()`
* ✅ Allows **custom clipboard handler overrides** for Electron, Capacitor, etc.

---

## 🏗️ Class: `TinyClipboard`

### 🔧 Constructor

```ts
new TinyClipboard()
```

Initializes the clipboard utility and detects available clipboard APIs.

---

## ✍️ Copy Methods

### 📄 `copyText(text: string): Promise<void>`

Copies a plain text string to the clipboard.

#### Parameters:

* `text` – The string to copy.

#### Throws:

* `TypeError` if the input is not a string.
* `Error` if no clipboard method is available.

---

### 🧩 `copyBlob(blob: Blob): Promise<void>`

Copies binary data (e.g., images, files) to the clipboard.

#### Parameters:

* `blob` – The Blob object to copy.

#### Throws:

* `TypeError` if the input is not a Blob.
* `Error` if clipboard API is unavailable.

---

## 🧠 Override Methods

### 🛠️ `setCopyText(callback: (text: string) => Promise<void>)`

Overrides the default text copy handler (e.g., for Electron or Capacitor).

#### Throws:

* `TypeError` if the callback is not a function.

---

### 🛠️ `setCopyBlob(callback: (blob: Blob) => Promise<void>)`

Overrides the default Blob copy handler.

#### Throws:

* `TypeError` if the callback is not a function.

---

## 📥 Read Methods

### 🧾 `readText(index?: number = 0): Promise<string|null>`

Reads plain text from a specific clipboard index.

#### Throws:

* `Error` if the result is not a string.

---

### 🖼️ `readCustom(mimeFormat?: string, fixValue?: boolean, index?: number): Promise<Blob|null>`

Reads a custom MIME-type item from the clipboard.

#### Parameters:

* `mimeFormat` – MIME type or prefix (e.g., `"image/"`)
* `fixValue` – Whether to match the MIME type exactly
* `index` – The clipboard item index

#### Throws:

* `Error` if the result is not a Blob.

---

### 📚 `readAllTexts(): Promise<string[]>`

Reads all plain text entries from the clipboard.

#### Throws:

* `Error` if any entry is not a string.

---

### 🧳 `readAllCustom(mimeFormat?: string, fixValue?: boolean): Promise<Blob[]>`

Reads all custom MIME-type items from the clipboard.

#### Throws:

* `Error` if any entry is not a Blob.

---

### 🔎 `readAllData(type?: 'text' | 'custom', mimeFormat?: string): Promise<Array<string | Blob>>`

Reads all clipboard content filtered by type or MIME.

#### Returns:

* An array of strings or Blobs.

---

### 🔢 `readIndex(index: number): Promise<ClipboardItem|null>`

Reads a single clipboard item by index.

---

### 🗃️ `readAll(): Promise<ClipboardItem[]>`

Reads all clipboard items.

#### Throws:

* `Error` if the returned items are not all valid `ClipboardItem` instances.

---

## 🧪 Internal (Private) Helpers

> These methods are not intended for external use.

* `_handleBlob(type: string, item: ClipboardItem): Promise<Blob>`
* `_handleText(type: string, item: ClipboardItem): Promise<string>`
* `_read(index: number|null): Promise<ClipboardItem|ClipboardItem[]>`
* `_readData(...)`: Internal filter mechanism used by public `read*` methods.

---

## ✅ Getters

### 📎 `isExecCommandAvailable(): boolean`

Returns `true` if legacy `document.execCommand()` is available.

---

### 📎 `isNavigatorClipboardAvailable(): boolean`

Returns `true` if modern `navigator.clipboard` is available.

---

### 🧪 `getCopyTextFunc(): ((text: string) => Promise<void>) | null`

Gets the current function used for copying text.

---

### 🧪 `getCopyBlobFunc(): ((blob: Blob) => Promise<void>) | null`

Gets the current function used for copying blobs.

---

## 🧠 Usage Example

```ts
import TinyClipboard from 'tiny-essentials/libs/text/TinyClipboard';

const clipboard = new TinyClipboard();

// Copy text
await clipboard.copyText("Hello world!");

// Read text
const value = await clipboard.readText();
console.log(value);
```

---

## 🔒 Notes

* Browser permission is required to access the clipboard.
* Clipboard access may be restricted to user interactions (e.g., click events).
* This utility is designed for use in environments with **Clipboard API** support or suitable **fallbacks**.
