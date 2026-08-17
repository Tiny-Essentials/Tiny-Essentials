# 🎨 `TinyColorConverter`

A JavaScript class for **color conversion and manipulation** between Hex, RGB(A), HSL(A), and integer formats. It also supports generation of color gradients and random color generation.

---

## 📦 Features

* Convert between Hex, RGB, RGBA, HSL, HSLA, and integers
* Parse various color input formats
* Generate pastel or full-spectrum rainbow gradients 🌈
* Return colors in multiple formats (strings, arrays, objects)
* Get random colors easily!

---

## 🧱 Types

### `RgbColor`

```ts
[number, number, number]
```

* Red, Green, Blue — integers from `0` to `255`

### `RgbaColor`

```ts
[number, number, number, number]
```

* Red, Green, Blue, Alpha — all from `0` to `255`

### `HslColor`

```ts
[number, number, number]
```

* Hue `0–360`, Saturation and Lightness `0–100`

### `HslaColor`

```ts
[number, number, number, number]
```

* Like `HslColor`, but with alpha (0–255)

### `HexColor`

```ts
string
```

* Hex string, like `#ff33aa`

### `ColorTypes`

```ts
HexColor | number | RgbColor | RgbaColor
```

---

## 🧪 Result Object Types

### `RgbResult`

```ts
{ r: number, g: number, b: number }
```

### `RgbaResult`

```ts
{ r: number, g: number, b: number, a: number }
```

### `HexResult`

```ts
{ hex: string }
```

### `HslResult`

```ts
{ h: number, s: number, l: number }
```

---

## 🎲 Random Color

### `TinyColorConverter.randomColor()`

Returns a completely random hex color.

```ts
const hex = TinyColorConverter.randomColor(); // #a4f23b
```

---

## 🌈 Rainbow Gradient Generator

All three gradient methods use sine wave patterns to generate smooth, eye-pleasing color palettes.

### `TinyColorConverter.rcaRgb(len = 24, pastel = false)`

Returns an array of `RgbResult` colors.

### `TinyColorConverter.rcaHex(len = 24, pastel = false)`

Returns an array of `HexResult` colors.

### `TinyColorConverter.rcaHsl(len = 24, pastel = false)`

Returns an array of `HslResult` colors.

> 📌 Set `pastel: true` for lighter, more desaturated tones.

---

## 🛠️ Color Conversion Methods

### Hex <=> Int

* `hexToInt(hex): number`
* `intToHex(int): HexColor`

### Hex <=> RGBA

* `hexToRgba(hex): RgbaColor`
* `hexToRgb(hex): RgbColor`
* `rgbToHex(r, g, b): HexColor`

### Hex <=> HSL(A)

* `hexToHsl(hex): HslColor`
* `hexToHsla(hex): HslaColor`
* `hslToHex(h, s, l): HexColor`

### HSL <=> RGB(A)

* `hslToRgba(h, s, l, a?): RgbaColor`
* `hslToRgb(h, s, l, a?): RgbColor`
* `rgbaToHsl(r, g, b, a?): HslColor`
* `rgbaToHsla(r, g, b, a?): HslaColor`

### Int <=> RGBA

* `intToRgba(int): RgbaColor`
* `rgbToInt(r, g, b): number`

---

## 🔄 Parsing & String Formats

* `parseInput(input: ColorTypes, isHsl: boolean): RgbaColor`
* `rgbStringToRgbaArray("rgba(...)"): RgbaColor`
* `hslStringToRgbaArray("hsl(...)"): RgbaColor`

---

## 🧪 Instance API

```ts
const color = new TinyColorConverter('#ff66cc');
```

### `.setColor(input: ColorTypes)`

Sets a new color and parses it internally.

### `.getOriginal(): ColorTypes`

Returns the original color input.

### `.toRgbaArray(): RgbaColor`

Returns the RGBA array.

### `.toHex(): HexColor`

Returns the color as hex string.

### `.toInt(): number`

Returns the color as a single 24-bit integer.

### `.toRgbString(): string`

Returns `'rgb(r, g, b)'` format.

### `.toRgbaString(): string`

Returns `'rgba(r, g, b, a)'` format.

### `.toHslString(): string`

Returns `'hsl(h, s%, l%)'` format.

### `.toHslaString(): string`

Returns `'hsla(h, s%, l%, a)'` format.

### `.toHslaArray(): HslaColor`

Returns an array: `[h, s, l, a]`

---

## 🔒 Internal State (Private)

* `#original` → stores the input color
* `#rgba` → RGBA representation
* `#checkIsHsl` → checks if array input should be interpreted as HSL
