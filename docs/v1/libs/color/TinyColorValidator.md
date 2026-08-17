# 🎨 TinyColorValidator Documentation

## 📐 Angle Units

```ts
/**
 * Represents the allowed angle unit types for CSS color functions.
 *
 * - `deg` → Degrees (0–360).
 * - `grad` → Gradians (0–400).
 * - `rad` → Radians (0–2π).
 * - `turn` → Turns (0–1).
 */
type AngleUnit = 'deg' | 'grad' | 'rad' | 'turn';
```

---

## 🌈 TinyColorValidator Class

The `TinyColorValidator` class provides utilities for validating and parsing **CSS color values** in multiple formats.
It supports **hex, RGB/RGBA, HSL/HSLA, HWB, LAB, LCH, HTML named colors, and special keywords**.

### ✨ Features

* Validate (`isHex`, `isRgb`, `isHsl`, etc.) color formats.
* Parse (`parseRgb`, `parseHsl`, etc.) into numeric components.
* Manage and extend HTML color names and special keywords dynamically.

### 🧩 Example

```js
const validator = new TinyColorValidator("rgb(255, 0, 0)");

console.log(validator.isRgb());    // true ✅
console.log(validator.parseRgb()); // [255, 0, 0]
```

---

## 🎨 Supported Formats

* **Hexadecimal** → `#RGB`, `#RRGGBB`, `#RRGGBBAA`
* **RGB / RGBA** → `rgb(r, g, b)`, `rgba(r, g, b, a)`
* **HSL / HSLA** → `hsl(h, s%, l%)`, `hsla(h, s%, l%, a)`
* **HWB** → `hwb(hue whiteness% blackness%)`
* **LAB** → `lab(L a b)`
* **LCH** → `lch(L C H)`
* **HTML Named Colors** → e.g. `red`, `blue`, `rebeccapurple`
* **Special Keywords** → `transparent`, `currentColor`

---

## 🖌️ HTML Color Names API

```ts
TinyColorValidator.getNames(): string[]
TinyColorValidator.addName(name: string): boolean
TinyColorValidator.removeName(name: string): boolean
TinyColorValidator.hasName(name: string): boolean
```

* **`getNames()`** → Returns all HTML color names as an array.
* **`addName(name)`** → Adds a new HTML color name (case-insensitive).
* **`removeName(name)`** → Removes an existing HTML color name.
* **`hasName(name)`** → Checks if a given name exists.

---

## 🌟 Special Color Names API

```ts
TinyColorValidator.getSpecialNames(): string[]
TinyColorValidator.addSpecialName(name: string): boolean
TinyColorValidator.removeSpecialName(name: string): boolean
TinyColorValidator.hasSpecialName(name: string): boolean
```

* **`getSpecialNames()`** → Returns all special keywords.
* **`addSpecialName(name)`** → Adds a new special keyword.
* **`removeSpecialName(name)`** → Removes an existing keyword.
* **`hasSpecialName(name)`** → Checks if the keyword exists.

---

## 🧱 Instance Properties

```ts
class TinyColorValidator {
  #code: string;

  constructor(code: TinyColorValidatorT);
  get code(): string;
}
```

* **`#code`** → Internal storage for the provided color string.
* **`get code()`** → Retrieves the original input string.
* **`constructor(code)`** → Creates a new validator instance with the given color string.

### 🏷️ Color Type Storage

* **Private property:** `#type`
* **Type:** `ColorTypes | null`
* **Description:** Internal storage for the detected type of the CSS color.

```ts
/**
 * Internal storage for the code type.
 * @type {ColorTypes|null}
 */
#type;
```

* **Getter:** `type`
* **Returns:** `ColorTypes | null`
* **Description:** Returns the currently stored color type.

```ts
/**
 * Gets the current code type.
 * @returns {ColorTypes|null} The stored code type.
 */
get type() {
  return this.#type;
}
```

---

## 🎨 HEX & HEXA Validation

### 🔍 `static isHex(input: string): boolean`

Validates whether a string is a valid HEX color (`#RGB` or `#RRGGBB`).

* ✅ Returns `true` if valid.
* ⚠️ Throws `TypeError` if input is not a string.

---

### 🔍 `isHex(): boolean`

Instance method that validates the stored color code as a HEX color.

* ✅ Returns `true` if valid.
* ⚠️ Throws `TypeError` if input is not a string.

---

### 🔍 `static isHexa(input: string): boolean`

Validates whether a string is a valid HEXA color (`#RRGGBBAA`).

* ✅ Returns `true` if valid.
* ⚠️ Throws `TypeError` if input is not a string.

---

### 🔍 `isHexa(): boolean`

Instance method that validates the stored color code as a HEXA color.

* ✅ Returns `true` if valid.
* ⚠️ Throws `TypeError` if input is not a string.

---

## 🎨 RGB & RGBA Validation

### 🔍 `static isRgb(input: string): boolean`

Validates whether a string is a valid RGB color.

* ✅ Returns `true` if valid.
* ⚠️ Throws `TypeError` if input is not a string.

---

### 🔍 `isRgb(): boolean`

Instance method that validates the stored color code as an RGB color.

* ✅ Returns `true` if valid.

---

### 🔍 `static isRgba(input: string): boolean`

Validates whether a string is a valid RGBA color.

* ✅ Returns `true` if valid.
* ⚠️ Throws `TypeError` if input is not a string.

---

### 🔍 `isRgba(): boolean`

Instance method that validates the stored color code as an RGBA color.

* ✅ Returns `true` if valid.

---

## 🎨 HSL & HSLA Validation

### 🔍 `static isHsl(input: string): boolean`

Validates whether a string is a valid HSL color.

* ✅ Returns `true` if valid.
* ⚠️ Throws `TypeError` if input is not a string.

---

### 🔍 `isHsl(): boolean`

Instance method that validates the stored color code as an HSL color.

* ✅ Returns `true` if valid.

---

### 🔍 `static isHsla(input: string): boolean`

Validates whether a string is a valid HSLA color.

* ✅ Returns `true` if valid.
* ⚠️ Throws `TypeError` if input is not a string.

---

### 🔍 `isHsla(): boolean`

Instance method that validates the stored color code as an HSLA color.

* ✅ Returns `true` if valid.

---

## 🎨 HWB, Lab & LCH Validation

### 🔍 `static isHwb(input: string): boolean`

Validates whether a string is a valid HWB color.

* ✅ Returns `true` if valid.
* ⚠️ Throws `TypeError` if input is not a string.

---

### 🔍 `isHwb(): boolean`

Instance method that validates the stored color code as an HWB color.

* ✅ Returns `true` if valid.

---

### 🔍 `static isLab(input: string): boolean`

Validates whether a string is a valid CIELAB (Lab) color.

* ✅ Returns `true` if valid.
* ⚠️ Throws `TypeError` if input is not a string.

---

### 🔍 `isLab(): boolean`

Instance method that validates the stored color code as a Lab color.

* ✅ Returns `true` if valid.

---

### 🔍 `static isLch(input: string): boolean`

Validates whether a string is a valid LCH color.

* ✅ Returns `true` if valid.
* ⚠️ Throws `TypeError` if input is not a string.

---

### 🔍 `isLch(): boolean`

Instance method that validates the stored color code as an LCH color.

* ✅ Returns `true` if valid.

---

## 🎨 Named Colors

### 🔍 `static isName(input: string): boolean`

Validates whether a string matches a **standard HTML color name**.

* ✅ Returns `true` if valid.
* ⚠️ Throws `TypeError` if input is not a string.

---

### 🔍 `isName(): boolean`

Instance method that validates the stored color code as a **standard HTML color name**.

* ✅ Returns `true` if valid.

---

### 🔍 `static isSpecialName(input: string): boolean`

Validates whether a string matches a **special CSS color keyword** (e.g., `currentColor`, `transparent`).

* ✅ Returns `true` if valid.
* ⚠️ Throws `TypeError` if input is not a string.

---

### 🔍 `isSpecialName(): boolean`

Instance method that validates the stored color code as a **special CSS color keyword**.

* ✅ Returns `true` if valid.

---

## 🎨 Universal Color Validation

### 🔍 `static isColor(input: string): string|null`

Checks whether a string is **any valid CSS color**, including:

* HEX / HEXA

* RGB / RGBA

* HSL / HSLA

* HWB

* Lab

* LCH

* HTML color names

* Special CSS keywords

* ✅ Returns `true` if valid.

* ⚠️ Throws `TypeError` if input is not a string.

---

## 🎨 Color Parsing

### 🔍 `parse(): any[] | string | null`

Automatically parses the stored color code based on its detected type (`#type`). 

* 📤 Returns numeric components for functional colors (RGB, HSL, Lab, etc.) or the lowercase string for named/special colors. Returns `null` if the code is invalid.

---

### 🔎 `static parseHex(input: string): string|null`

Parses a HEX color (`#RGB` or `#RRGGBB`).

* 📥 Input: HEX string.
* 📤 Output: Regex match group or `null` if invalid.

---

### 🔎 `parseHex(): string|null`

Parses the stored color code as a HEX color.

* 📤 Returns match result or `null` if invalid.

---

### 🔎 `static parseHexa(input: string): string|null`

Parses a HEXA color (`#RRGGBBAA`).

* 📥 Input: HEXA string.
* 📤 Output: Regex match group or `null` if invalid.

---

### 🔎 `parseHexa(): string|null`

Parses the stored color code as a HEXA color.

* 📤 Returns match result or `null` if invalid.

---

## 🎨 Parsing RGB & RGBA

### 🔎 `static parseRgb(input: string): [number, number, number]|null`

Parses an RGB color (`rgb(r, g, b)`).

* 📥 Input: RGB string.
* 📤 Output: `[r, g, b]` as numbers, or `null` if invalid.

---

### 🔎 `parseRgb(): [number, number, number]|null`

Parses the stored color code as an RGB color.

* 📤 Returns `[r, g, b]` or `null`.

---

### 🔎 `static parseRgba(input: string): [number, number, number, number]|null`

Parses an RGBA color (`rgba(r, g, b, a)`).

* 📥 Input: RGBA string.
* 📤 Output: `[r, g, b, a]` as numbers, or `null` if invalid.

---

### 🔎 `parseRgba(): [number, number, number, number]|null`

Parses the stored color code as an RGBA color.

* 📤 Returns `[r, g, b, a]` or `null`.

---

## 🎨 Parsing HSL & HSLA

### 🔎 `static parseHsl(input: string): [number, number, number]|null`

Parses an HSL color string (`hsl(h, s%, l%)`).

* 📥 Input: HSL string
* 📤 Output: `[h, s, l]` as numbers, or `null` if invalid
* ⚠️ Throws `TypeError` if input is not a string

---

### 🔎 `parseHsl(): [number, number, number]|null`

Parses the stored color code as an HSL color.

* 📤 Returns `[h, s, l]` or `null`

---

### 🔎 `static parseHsla(input: string): [number, number, number, number]|null`

Parses an HSLA color string (`hsla(h, s%, l%, a)`).

* 📥 Input: HSLA string
* 📤 Output: `[h, s, l, a]` as numbers, or `null` if invalid
* ⚠️ Throws `TypeError` if input is not a string

---

### 🔎 `parseHsla(): [number, number, number, number]|null`

Parses the stored color code as an HSLA color.

* 📤 Returns `[h, s, l, a]` or `null`

---

## 🎨 Parsing HWB

### 🔎 `static parseHwb(input: string): [number, AngleUnit|null, number, number]|null`

Parses an HWB color string (`hwb(hue, whiteness%, blackness%[, alpha])`).

* 📥 Input: HWB string
* 📤 Output: `[hue, angleUnit, whiteness, blackness]` or `null`
* ⚠️ Throws `TypeError` if input is not a string

---

### 🔎 `parseHwb(): [number, AngleUnit|null, number, number]|null`

Parses the stored color code as an HWB color.

* 📤 Returns `[hue, angleUnit, whiteness, blackness]` or `null`

---

## 🎨 Parsing Lab (CIELAB)

### 🔎 `static parseLab(input: string): [number, number, number]|null`

Parses a Lab color string (`lab(L a b[/alpha])`).

* 📥 Input: Lab string
* 📤 Output: `[L, a, b]` as numbers, or `null` if invalid
* ⚠️ Throws `TypeError` if input is not a string

---

### 🔎 `parseLab(): [number, number, number]|null`

Parses the stored color code as a Lab color.

* 📤 Returns `[L, a, b]` or `null`

---

## 🎨 Parsing LCH

### 🔎 `static parseLch(input: string): [number, number, number, AngleUnit|null]|null`

Parses an LCH color string (`lch(L C H[/alpha])`).

* 📥 Input: LCH string
* 📤 Output: `[L, C, H, angleUnit]` or `null`
* ⚠️ Throws `TypeError` if input is not a string

---

### 🔎 `parseLch(): [number, number, number, AngleUnit|null]|null`

Parses the stored color code as an LCH color.

* 📤 Returns `[L, C, H, angleUnit]` or `null`
