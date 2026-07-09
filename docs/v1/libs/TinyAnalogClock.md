# 🕰️ TinyAnalogClock

**TinyAnalogClock** is a dependency-free JavaScript class for rendering fully customizable analog clocks. It supports dynamic resizing, custom skins (background images), flexible coloring, advanced geometry tuning, and rigorous input validation.

## ✨ Features

* **Zero Dependencies:** Pure JavaScript (ESM).
* **Fully Customizable:** Control colors, sizes, layout, and internal geometry.
* **Scalable:** All internal elements (hands, numbers, ticks) scale mathematically based on the `size`.
* **Dynamic API:** Update **any** property (colors, padding, tick thickness, etc.) in real-time using setters.
* **Type Safe:** Built-in validation throws errors if invalid data types are passed.

---

## 🚀 Getting Started

### 1. Import the Class

Import the class into your JavaScript module.

```javascript
import TinyAnalogClock from 'tiny-essentials/libs/TinyAnalogClock';
```

### 2. Basic Usage

Create an instance and append its element to your DOM.

```javascript
// 1. Create the clock instance
const myClock = new TinyAnalogClock({
    size: 400,
    showSeconds: true
});

// 2. Append the generated HTML to your page
document.body.appendChild(myClock.element);

```

---

## ⚙️ Configuration

You can pass an options object to the **constructor**. All properties are optional; defaults will be used if omitted.

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `size` | `number` | `800` | Total width/height of the clock in pixels. |
| `bgColor` | `string` | `'#f0f0f0'` | Background color of the clock face. |
| `borderColor` | `string` | `'#333'` | Color of the outer border. |
| `borderWidth` | `number` | `8` | Thickness of the outer border in pixels. |
| `markColor` | `string` | `'#333'` | Color of the minute/hour tick marks. |
| `textColor` | `string` | `'#000'` | Color of the numbers (1-12). |
| `hourHandColor` | `string` | `'#000'` | Color of the hour hand. |
| `minuteHandColor` | `string` | `'#444'` | Color of the minute hand. |
| `secondHandColor` | `string` | `'#d81c1c'` | Color of the second hand. |
| `skinUrl` | `string|null` | `null` | URL of an image to use as background. |
| `showNumbers` | `boolean` | `true` | Show/Hide numbers on the face. |
| `showSeconds` | `boolean` | `true` | Show/Hide the second hand. |
| `padding` | `number` | `45` | Padding in pixels between the clock edge and the tick marks. |
| `sizeAdjust` | `number` | `0.04` | Scale factor for the numbers font size relative to clock size. |
| `angleDistance` | `number` | `0.95` | Distance multiplier (0-1) for placing numbers relative to the radius. |
| `pwH` | `number` | `0.008` | Hour tick **width** as a percentage of clock size (0.0 - 1.0). |
| `phH` | `number` | `0.08` | Hour tick **height** as a percentage of clock size (0.0 - 1.0). |
| `pwM` | `number` | `0.005` | Minute tick **width** as a percentage of clock size (0.0 - 1.0). |
| `phM` | `number` | `0.03` | Minute tick **height** as a percentage of clock size (0.0 - 1.0). |

---

## 🛠️ API Reference

### Properties & Setters

The class provides strict setters to update **every aspect** of the clock dynamically.
**Note:** Invalid inputs (wrong types or negative numbers where forbidden) will throw an `Error`.

#### Core Properties

##### `element`

* **Returns:** `HTMLElement`
* **Description:** The main container of the clock. Use this to append the clock to your DOM.

##### `size`

* **Type:** `number` (positive)
* **Description:** Updates the dimensions of the clock. Triggers a full re-render.

```javascript
clock.size = 500;
```

##### `skinUrl`

* **Type:** `string | null`
* **Description:** Sets a background image. Set to `null` to use `bgColor`.

```javascript
clock.skinUrl = './assets/wood-texture.jpg';
```

##### `bgColor`

* **Type:** `string`
* **Description:** Updates the background color (visible if no skin is set).

```javascript
clock.bgColor = '#fafafa';
```

#### Border & Colors

##### `borderColor` / `borderWidth`

* **Description:** Control the outer border style.

```javascript
clock.borderColor = '#ff0055';
clock.borderWidth = 12;
```

##### `markColor` / `textColor`

* **Description:** Colors for the tick marks and the numbers.

```javascript
clock.markColor = '#444';
clock.textColor = '#222';
```

##### `hourHandColor` / `minuteHandColor` / `secondHandColor`

* **Description:** Individual colors for each hand.

```javascript
clock.secondHandColor = 'red';
```

#### Visibility & Layout

##### `showNumbers`

* **Type:** `boolean`
* **Description:** Toggles the numbers 1-12.

```javascript
clock.showNumbers = false;
```

##### `showSeconds`

* **Type:** `boolean`
* **Description:** Toggles the second hand visibility.

```javascript
clock.showSeconds = false;
```

##### `padding`

* **Type:** `number` (non-negative)
* **Description:** Adjusts space between the outer edge and the ticks.

```javascript
clock.padding = 20; // Move ticks closer to edge
```

#### Advanced Geometry (Fine Tuning)

##### `sizeAdjust`

* **Type:** `number` (positive)
* **Description:** Scales the font size of the numbers.

```javascript
clock.sizeAdjust = 0.15; // Make numbers huge
```

##### `angleDistance`

* **Type:** `number` (positive)
* **Description:** Controls how far from the center the numbers are placed (percentage of radius).

```javascript
clock.angleDistance = 0.80; // Move numbers closer to center
```

##### `pwH`, `phH` (Hour Ticks)

* **Type:** `number` (positive)
* **Description:** Width and Height of **Hour** ticks (percentage of clock size).

```javascript
clock.pwH = 0.02; // Thicker hour lines
clock.phH = 0.15; // Longer hour lines
```

##### `pwM`, `phM` (Minute Ticks)

* **Type:** `number` (positive)
* **Description:** Width and Height of **Minute** ticks (percentage of clock size).

```javascript
clock.pwM = 0.01; // Thicker minute lines
```

### Methods

#### `destroy()`

Stops the internal animation loop (`requestAnimationFrame`) and removes the element from the DOM. **Always call this when removing the clock to prevent memory leaks.**

```javascript
// When you are done with the clock
myClock.destroy();
```

---

## 🎨 Advanced Examples

### Example 1: Dark Mode Clock

```javascript
const darkClock = new TinyAnalogClock({
    size: 300,
    bgColor: '#222',
    borderColor: '#444',
    markColor: '#888',
    textColor: '#fff',
    hourHandColor: '#fff',
    minuteHandColor: '#ccc',
    secondHandColor: '#ffcc00'
});

document.getElementById('app').appendChild(darkClock.element);
```

### Example 2: Minimalist Modern

A clock with no numbers, thin lines, and a sleek look.

```javascript
const modernClock = new TinyAnalogClock({
    size: 400,
    showNumbers: false,
    borderWidth: 2,
    borderColor: '#000',
    markColor: '#999',
    hourHandColor: '#000',
    minuteHandColor: '#555',
    secondHandColor: '#d81c1c',
    padding: 10,
    pwH: 0.005, // Very thin hour ticks
    pwM: 0.002  // Ultra thin minute ticks
});

document.body.appendChild(modernClock.element);
```

### Example 3: Chunky & Colorful

A clock with thick borders, large numbers, and custom colors.

```javascript
const chunkyClock = new TinyAnalogClock({
    size: 500,
    bgColor: '#2a2a2a',
    borderColor: '#ffeb3b', // Yellow border
    borderWidth: 20,
    textColor: '#ffeb3b',
    sizeAdjust: 0.12, // Large numbers
    padding: 60,
    hourHandColor: '#fff',
    minuteHandColor: '#ccc',
    secondHandColor: '#ffeb3b'
});

document.body.appendChild(chunkyClock.element);
```

---

### ⚠️ Error Handling

The class ensures data integrity. If you try to set an invalid value, it will fail loudly to help you debug:

```javascript
try {
    clock.size = -100; // ❌ Throws Error: 'size' must be a positive number.
} catch (e) {
    console.error(e.message);
}
```