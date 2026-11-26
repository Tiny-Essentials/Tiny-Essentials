# 📦 `TinyTextRangeEditor` Documentation

A lightweight but powerful text range utility class for `<input>` and `<textarea>` elements, ideal for building BBCode or other tag-based markup editors.

---

## 📑 Table of Contents

- [🛠 Constructor](#-constructor)
  - [Parameters:](#parameters)
- [🔧 Core Methods](#-core-methods)
  - [`getOpenTag()` → `string`](#getopentag--string)
  - [`getCloseTag()` → `string`](#getclosetag--string)
  - [`setOpenTag(tag: string)`](#setopentagtag-string)
  - [`setCloseTag(tag: string)`](#setclosetagtag-string)
- [🎯 Selection & Focus](#-selection--focus)
  - [`focus()` → `this`](#focus--this)
  - [`ensureFocus()` → `this`](#ensurefocus--this)
  - [`getSelectionRange()` → `{ start: number, end: number }`](#getselectionrange---start-number-end-number-)
  - [`setSelectionRange(start, end, preserveScroll = true)` → `this`](#setselectionrangestart-end-preservescroll--true--this)
- [📜 Value Access](#-value-access)
  - [`getValue()` → `string`](#getvalue--string)
  - [`setValue(value: string)` → `this`](#setvaluevalue-string--this)
  - [`getSelectedText()` → `string`](#getselectedtext--string)
- [✍️ Text Manipulation](#️-text-manipulation)
  - [`insertText(text, options?)` → `this`](#inserttexttext-options--this)
  - [`deleteSelection()` → `this`](#deleteselection--this)
  - [`transformSelection(fn)` → `this`](#transformselectionfn--this)
  - [`surroundSelection(prefix, suffix)` → `this`](#surroundselectionprefix-suffix--this)
- [🪄 Tag Operations](#-tag-operations)
  - [`wrapWithTag(tagName, attributes?)` → `this`](#wrapwithtagtagname-attributes--this)
  - [`insertTag(tagName, content?, attributes?)` → `this`](#inserttagtagname-content-attributes--this)
  - [`insertSelfClosingTag(tagName, attributes?)` → `this`](#insertselfclosingtagtagname-attributes--this)
  - [`toggleTag(tagName, attributes?)` → `this`](#toggletagtagname-attributes--this)
  - [`toggleCode(codeName)` → `this`](#togglecodecodename--this)
- [🧠 Utility](#-utility)
  - [`moveCaret(offset: number)` → `this`](#movecaretoffset-number--this)
  - [`selectAll()` → `this`](#selectall--this)
  - [`expandSelection(before, after)` → `this`](#expandselectionbefore-after--this)
  - [`replaceAll(regex, replacerFn)` → `this`](#replaceallregex-replacerfn--this)
  - [`replaceInSelection(regex, replacerFn)`](#replaceinselectionregex-replacerfn)
- [🧩 Internal Attribute Helper](#-internal-attribute-helper)
  - [`_insertAttr(attributes)` → `string`](#_insertattrattributes--string)
- [🧪 Example Use](#-example-use)
- [📝 Notes](#-notes)

---

## 🛠 Constructor

```js
new TinyTextRangeEditor(element, options?)
```

### Parameters:

* `element` **(HTMLInputElement | HTMLTextAreaElement)** – Target editable element.
* `options` **(Object)** *(optional)* – Customize tag delimiters.

  * `openTag` **(string)** – Default: `'['`
  * `closeTag` **(string)** – Default: `']'`

---

## 🔧 Core Methods

### `getOpenTag()` → `string`

Returns the current **opening tag symbol**.

### `getCloseTag()` → `string`

Returns the current **closing tag symbol**.

### `setOpenTag(tag: string)`

Changes the **opening tag symbol**.

### `setCloseTag(tag: string)`

Changes the **closing tag symbol**.

---

## 🎯 Selection & Focus

### `focus()` → `this`

Focuses the target element.

### `ensureFocus()` → `this`

Focuses the element only if not already focused.

### `getSelectionRange()` → `{ start: number, end: number }`

Returns the current **text selection range**.

### `setSelectionRange(start, end, preserveScroll = true)` → `this`

Sets the selection range.

---

## 📜 Value Access

### `getValue()` → `string`

Returns the entire value of the field.

### `setValue(value: string)` → `this`

Sets the entire content.

### `getSelectedText()` → `string`

Returns the currently selected text.

---

## ✍️ Text Manipulation

### `insertText(text, options?)` → `this`

Inserts (and replaces) text at selection.

#### Options:

* `newCursor`: `"start" | "end" | "preserve"` *(default: `'end'`)*
* `autoSpacing`: *(boolean)* Add space if needed on both sides.
* `autoSpaceLeft` / `autoSpaceRight`: *(boolean)* Fine-grained spacing control.

---

### `deleteSelection()` → `this`

Deletes selected text.

### `transformSelection(fn)` → `this`

Applies a transformation function to the selected text.

### `surroundSelection(prefix, suffix)` → `this`

Wraps selected text with custom strings.

---

## 🪄 Tag Operations

### `wrapWithTag(tagName, attributes?)` → `this`

Wraps the selection in a custom tag.

```js
editor.wrapWithTag("b");
editor.wrapWithTag("color", { value: "red" });
```

### `insertTag(tagName, content?, attributes?)` → `this`

Inserts an opening and closing tag with optional content.

```js
editor.insertTag("quote", "Hello!", { user: "Yasmin" });
```

### `insertSelfClosingTag(tagName, attributes?)` → `this`

Inserts a self-closing tag.

```js
editor.insertSelfClosingTag("br");
editor.insertSelfClosingTag("img", { src: "link.jpg", alt: "image" });
```

### `toggleTag(tagName, attributes?)` → `this`

Wraps or **unwraps** the selection with a tag.

```js
editor.toggleTag("b");
```

### `toggleCode(codeName)` → `this`

Wraps or **unwraps** the selection with a code.

```js
editor.toggleTag("**");
```

---

## 🧠 Utility

### `moveCaret(offset: number)` → `this`

Moves the caret by an offset.

### `selectAll()` → `this`

Selects all the content.

### `expandSelection(before, after)` → `this`

Expands the selection range by the given number of characters.

### `replaceAll(regex, replacerFn)` → `this`

Performs regex replacement over the full text.

---

### `replaceInSelection(regex, replacerFn)`

Replaces all matches of a regular expression **only within the currently selected text** in the editor.

---

## 🧩 Internal Attribute Helper

### `_insertAttr(attributes)` → `string`

Serializes tag attributes to string format. Supports:

* ✅ Object: `{ color: "red" } → color="red"`
* ✅ Array: `["checked", "readonly"] → checked readonly`

---

## 🧪 Example Use

```js
const textarea = document.querySelector('textarea');
const editor = new TinyTextRangeEditor(textarea);

editor.wrapWithTag("b");
editor.insertTag("color", "red text", { color: "red" });
editor.insertSelfClosingTag("br");
```

---

## 📝 Notes

* All methods are **chainable** (`return this`)
* Throws detailed **TypeErrors** if used incorrectly
* Does **not** depend on any external library
* Useful for BBCode editors, markdown-like syntax, or custom in-text macros
