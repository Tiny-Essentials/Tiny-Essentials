# 🧲 TinyDragger

TinyDragger enables customizable **drag-and-drop** behavior for HTML elements.  
It supports visual proxies, jail boundaries, collision detection, vibration feedback, drop restrictions, and custom events — all with a lightweight and flexible architecture.

---

## ✨ Features

- 🖱️ Mouse & touch drag support  
- 🔒 Jail constraints to restrict dragging area  
- 💥 Collision detection with other elements  
- 🔄 Auto-revert to original position  
- 🎮 Vibration feedback via `navigator.vibrate()`  
- 👻 Visual clone during drag (proxy)  
- 🎨 Fully configurable class names  
- 📦 Clean destroy method with memory-safe teardown  
- 🔔 Custom drag and drop events  

---

## 📦 Installation

```js
import TinyDragger from 'tiny-essentials/libs/TinyDragger';
```

---

## 🧰 Constructor

```ts
new TinyDragger(targetElement, options?)
```

### Parameters:

| Name            | Type          | Default      | Description                       |
| --------------- | ------------- | ------------ | --------------------------------- |
| `targetElement` | `HTMLElement` | **required** | The element to enable dragging on |
| `options`       | `Object`      | `{}`         | Optional configuration            |

### Options:

| Option                  | Type                           | Default                | Description                                                 |
| ----------------------- | ------------------------------ | ---------------------- | ----------------------------------------------------------- |
| `jail`                  | `HTMLElement`                  | `null`                 | Optional container that restricts movement                  |
| `collisionByMouse`      | `boolean`                      | `false`                | Use mouse position instead of bounding box for collision    |
| `classDragging`         | `string`                       | `'dragging'`           | Class applied to the clone element                          |
| `classBodyDragging`     | `string`                       | `'drag-active'`        | Class applied to the `<body>` during dragging               |
| `classJailDragging`     | `string`                       | `'jail-drag-active'`   | Class applied to jail while dragging                        |
| `classJailDragDisabled` | `string`                       | `'jail-drag-disabled'` | Class applied to jail when dragging is disabled             |
| `classDragCollision`    | `string`                       | `'dragging-collision'` | Class applied to elements when collision is detected        |
| `classHidden`           | `string`                       | `'drag-hidden'`        | Class used to hide the original element while dragging      |
| `lockInsideJail`        | `boolean`                      | `false`                | Prevent drag from exceeding jail bounds                     |
| `dropInJailOnly`        | `boolean`                      | `false`                | Prevent drop outside the jail area                          |
| `multiCollision`        | `boolean`                      | `false`                | Enables returning multiple collided elements                |
| `vibration`             | `VibrationPatterns` or `false` | `false`                | Vibration feedback configuration                            |
| `revertOnDrop`          | `boolean`                      | `false`                | Return to original position after dropping                  |
| `mirrorElem`            | `boolean`                      | `true`                 | Use a visual clone instead of dragging the original element |
| `defaultZIndex`         | `number`                       | `9999`                 | Sets the z-index value applied when dragging starts         |

---

## 📳 Vibration Patterns

```ts
type VibrationPatterns = {
  start: number[] | false,
  end: number[] | false,
  collide: number[] | false,
  move: number[] | false
}
```

---

## 📚 Public Methods

### `enable()`

🔓 Re-enables dragging after being disabled.

---

### `disable()`

🚫 Temporarily disables dragging. Still allows re-enabling later.

---

### `destroy()`

💣 Fully disables the instance, removes event listeners, and clears any DOM state.

---

### `addCollidable(element: HTMLElement)`

➕ Adds an element to the collision tracking list.  
🛑 Throws if the element is not a valid `HTMLElement`.

---

### `removeCollidable(element: HTMLElement)`

➖ Removes an element from the collision list.  
🛑 Throws if the element is not a valid `HTMLElement`.

---

### `setVibrationPattern({ startPattern, endPattern, collidePattern, movePattern })`

📳 Updates the vibration patterns used during drag events.
Each pattern must be either `false` or an array of numbers.

---

### `disableVibration()`

🔕 Turns off all vibration feedback.

---

### `getOffset(event: MouseEvent | Touch): { x: number, y: number }`

📐 Returns the X and Y offset from the event to the top-left corner of the element.  
🛑 Throws if the event is invalid.

---

### `getCollidedElementByRect(rect: DOMRect): HTMLElement | null`

🎯 Detects if a `DOMRect` collides with any registered collidable elements.  
🛑 Throws if the rect is invalid.

---

### `getAllCollidedElementsByRect(rect: DOMRect): HTMLElement[]`

📌 Returns **all elements** currently intersecting the given rectangle. Useful for detecting multiple overlaps when dragging.
🛑 Throws if `rect` is not a valid `DOMRect` with numeric `left`, `right`, `top`, and `bottom` properties.

---

### `getCollidedElement(x: number, y: number): HTMLElement | null`

📌 Detects if the given screen coordinates collide with any tracked element.  
🛑 Throws if `x` or `y` is not a number.

---

### `getAllCollidedElements(x: number, y: number): HTMLElement[]`

📌 Detects **all elements** currently under the given screen coordinates. Works well when `collisionByMouse` is enabled.
🛑 Throws if `x` or `y` is not a number.

---

### `getDragging(): boolean`

🔄 Returns whether dragging is currently active.

---

### `getLockInsideJail(): boolean`

🔒 Returns whether movement is restricted inside the jail container.

---

### `setLockInsideJail(value: boolean): void`

⚙️ Sets whether movement is restricted inside the jail container.  
🛑 Throws if `value` is not a boolean.

---

### `getRevertOnDrop(): boolean`

↩️ Returns whether the element should revert to its original position on drop.

---

### `setRevertOnDrop(value: boolean): void`

⚙️ Sets whether the element should revert to its original position on drop.  
🛑 Throws if `value` is not a boolean.

---

### `getCollisionByMouse(): boolean`

🖱️ Returns whether collision detection uses mouse position instead of element bounding rectangles.

---

### `setCollisionByMouse(value: boolean): void`

⚙️ Sets whether collision detection uses mouse position instead of element bounding rectangles.  
🛑 Throws if `value` is not a boolean.

---

### `getDropInJailOnly(): boolean`

🚫 Returns whether dropping is restricted inside the jail container.

---

### `setDropInJailOnly(value: boolean): void`

⚙️ Sets whether dropping is restricted inside the jail container.  
🛑 Throws if `value` is not a boolean.

---

### `checkDragCollision(event: MouseEvent | Touch): void`

🎯 Checks for collision between the drag proxy and registered elements.  
💥 Applies or removes the collision class depending on overlap.  
📳 Triggers vibration if configured.

---

### `execCollision(event: MouseEvent | Touch): { inJail: boolean; collidedElement: HTMLElement | null }`

🧩 Executes collision detection logic based on the drag position and mode.  
📍 Uses either the mouse point or the proxy rectangle depending on `collisionByMouse`.  
🔒 Respects `dropInJailOnly` and jail boundaries.  
🛑 Returns `{ inJail: false, collidedElement: null }` if dragging is not active.

---

### `getTarget(): HTMLElement`

🎯 Returns the original element being dragged.

---

### `getJail(): HTMLElement | null`

🚧 Returns the jail container element if one is set.  
Returns `null` if no jail is configured.

---

### `getDragProxy(): HTMLElement | null`

👻 Returns the current proxy (clone) element being dragged.  
Returns `null` if no proxy is active.

---

### `getLastCollision(): HTMLElement | null`

💥 Returns the last collided element (if any).

---

### `getCollidables(): HTMLElement[]`

🧲 Returns the list of elements that are considered for collision detection.

---

### `getDragHiddenClass(): string`

👀 Returns the CSS class used to hide the original element during dragging.

---

### `getClassDragging(): string`

🎬 Returns the CSS class applied to the clone while it is being dragged.

---

### `getClassBodyDragging(): string`

🧍 Returns the CSS class applied to `<body>` when dragging is active.

---

### `getClassJailDragging(): string`

🏗️ Returns the CSS class applied to the jail element while dragging is active.

---

### `getClassJailDragDisabled(): string`

🚫 Returns the CSS class applied to the jail when dragging is disabled.

---

### `getClassDragCollision(): string`

⚠️ Returns the CSS class applied to elements when a collision is detected.

---

### `getVibrations(): { start: number[] | false, end: number[] | false, collide: number[] | false, move: number[] | false }`

🎵 Returns the full vibration pattern configuration used during dragging.

---

### `getStartVibration(): number[] | false`

📳 Returns the vibration pattern used at the **start** of a drag.

---

### `getEndVibration(): number[] | false`

📴 Returns the vibration pattern used at the **end** of a drag.

---

### `getCollideVibration(): number[] | false`

🎯 Returns the vibration pattern used when **colliding** with another element.

---

### `getMoveVibration(): number[] | false`

🚶 Returns the vibration pattern used during **movement** while dragging.

---

### `isEnabled(): boolean`

✅ Returns whether the drag-and-drop functionality is currently enabled.

---

### `getDefaultZIndex(): number`

🎯 Returns the current default `z-index` used when a draggable item is picked up.

---

### `setDefaultZIndex(newZIndex: number): void`

🛠️ Sets a new default `z-index` to be used during drag operations.

> Throws `TypeError` if `newZIndex` is not a finite number.

---

### `isMirrorEnabled(): boolean`

🎯 Returns whether the draggable element uses a **mirror** (`true`) or the **original element** (`false`) during dragging.

---

### `setMirrorEnabled(useMirror: boolean): void`

🛠️ Defines whether the draggable element should use a **mirror clone** or move the **original element**.

> Throws `TypeError` if `useMirror` is not a boolean.

---

## 🔁 Events

The target element will emit these events:

| Event      | Description                                      |
| ---------- | ------------------------------------------------ |
| `drag`     | Fired at the beginning of a drag                 |
| `dragging` | Continuously fired while dragging                |
| `drop`     | Fired at the end of the drag with collision info |

### Example:

```js
targetEl.addEventListener('drop', (e) => {
  console.log('Dropped on:', e.detail.target);
});
```

---

## 🛡️ Error Handling

* Throws errors if the constructor options are of invalid types.
* Throws if using destroyed instances (`destroy()` has been called).
* Throws on invalid usage of methods like `addCollidable` or `getOffset`.

---

## ✅ Example

```js
const box = document.getElementById('draggableBox');
const jail = document.getElementById('jailContainer');

const dragger = new TinyDragger(box, {
    jail,
    lockInsideJail: false,
    collisionByMouse: false,
    revertOnDrop: false,
    vibration: {
      start: [30],
      move: [5],
      collide: [80],
      end: [20, 10, 20],
    },
});

const dropTarget = document.getElementById('dropArea');
dragger.addCollidable(dropTarget);

box.addEventListener('drop', (e) => {
  if (e.detail.target === dropTarget) {
    alert('Dropped successfully!');
  }
});
```

---

## 🧼 Clean-Up

Call `.destroy()` to completely remove drag behavior and all event listeners:

```js
dragger.destroy();
```

---

## 🧪 Testing & Styling

* 🎨 **Example Stylesheets:**
  You can find optional example styles to get started or test layout integration in:

  ```
  dist/v1/css/TinyDraggerExample.css
  dist/v1/css/TinyDraggerExample.min.css
  ```

* 🧱 **Test Environment:**
  A ready-to-use HTML test page is available at:

  ```
  test/html/TinyDragger
  ```

  This includes practical demos and scenarios to test dragging, collision, jail constraints, and more.

---

## 🧠 Notes

* Touch support uses the first touch point only.
* Make sure your draggable element has `position: relative` or `absolute` if it’s meant to be positioned manually after drop.
