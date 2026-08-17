# 🎨 Color Safe Stringify

Color Safe Stringify is a lightweight JavaScript class for transforming boring JSON strings into colorful, readable terminal output using ANSI escape codes. Whether you're debugging, logging, or just want your JSONs to sparkle a bit more, this tool is here to help ✨

---

## 🚀 Features

- 🎯 **Syntax-aware highlighting**: Keys, strings, numbers, booleans, nulls, functions, URLs, and special values each get their own color.
- 🎨 **Customizable presets**: Built-in themes like `default`, `solarized`, and `monokai` — and you can even define your own!
- 🔧 **Dynamic updates**: Change only the parts of the color scheme you want.
- 🧠 **Smart detection**: Differentiates between strings that *look* like booleans/numbers/URLs and real primitives.
- 🔁 **Safe formatting**: No circular structure errors — you can prepare your JSON ahead and color it afterward.

---

## 📦 Installation

This library is designed to work in any Node.js environment:

```bash
npm install safe-stable-stringify
```

Then import both the stable stringifier and `ColorSafeStringify`:

```js
import stringify from 'safe-stable-stringify';
import ColorSafeStringify from 'tiny-essentials/libs/color/ColorSafeStringify';
```

---

## 🧪 Usage Example

```js
const colorizer = new ColorSafeStringify();

const jsonObject = {
  name: "Yasmin",
  age: 27,
  website: "https://equestria.social/@jasmindreasond",
  active: true,
  notes: null,
  big: BigInt(1234567890),
  greet: () => "Hi!",
  nested: {
    color: "rainbow 🌈",
  },
};

// Stringify safely first
const jsonStr = stringify(jsonObject, null, 2);

// Apply beautiful colors
console.log(colorizer.colorize(jsonStr));
```

---

## 🎨 Built-in Presets

- `default` - a balanced palette with good terminal compatibility
- `solarized` - warm, low-contrast colors inspired by Solarized theme
- `monokai` - a bright and modern syntax-style theme

Use them like so:

```js
colorizer.loadColorPreset("monokai");
```

---

## 🧁 Create Your Own Preset

You can save your own custom preset:

```js
colorizer.saveColorPreset('candy', {
  reset: '\x1b[0m',
  key: '\x1b[95m',
  string: '\x1b[91m',
  string_url: '\x1b[35m',
  string_bool: '\x1b[95m',
  string_number: '\x1b[91m',
  number: '\x1b[91m',
  boolean: '\x1b[95m',
  null: '\x1b[90m',
  special: '\x1b[31m',
  func: '\x1b[35m',
});

colorizer.loadColorPreset('candy');
```

---

## 🔧 API

### `new ColorSafeStringify([defaultColors])`

Creates a new colorizer with optional color overrides.

### `.colorize(jsonString, [customColors])`

Returns a colorized string using current or temporary color settings.

### `.getColors()`

Returns the current color scheme.

### `.updateColors(partialColors)`

Updates only specific color keys in the active scheme.

### `.resetColors()`

Resets to the default preset.

### `.loadColorPreset(name)`

Loads a preset by name. Throws an error if it doesn't exist.

### `.saveColorPreset(name, colors)`

Saves a new custom preset.

### `.getAvailablePresets()`

Returns an array of all available preset names.

---

## 🤖 Best Practices

- Use `safe-stable-stringify` or equivalent to avoid issues with functions, circular references, and BigInt.
- Always apply coloring *after* serialization.
- For advanced highlighting, use proper typing for values (avoid turning everything into strings!).

---

## 🧚 Why?

Plain JSON is fine… but colored JSON? That’s ✨ **magical** ✨ — and way easier on the eyes when you're reading logs, inspecting complex structures, or debugging live servers.
