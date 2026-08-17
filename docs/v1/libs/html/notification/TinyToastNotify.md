# 🍞✨ `TinyToastNotify` Class

A lightweight notification system designed to display timed messages inside a container. It supports positioning, duration customization, HTML rendering, click handling, and optional avatar display.

---

## 🔧 Features

* 📍 **Positioning**:
  Customize horizontal (`x`: `left`, `center`, `right`) and vertical (`y`: `top`, `bottom`) alignment.

* ⏳ **Dynamic display time**:
  Automatically adjusts based on message length.

* 📝 **Flexible content**:

  * Optional `title` 🏷️
  * Optional `avatar` 🖼️
  * Optional `onClick` handler 🖱️
  * Optional raw HTML rendering 💡

* 🌙 **Fade-out animation**:
  With customizable duration.

* 🛡️ **Robust validation**:
  Ensures safe and predictable behavior.

---

## ⚙️ Customization Setters

* `setX(position: 'left' | 'center' | 'right')` — Sets horizontal alignment.
* `setY(position: 'top' | 'bottom')` — Sets vertical alignment.
* `setBaseDuration(ms: number)` — Base visible time in milliseconds.
* `setExtraPerChar(ms: number)` — Additional duration per character.
* `setFadeOutDuration(ms: number)` — Duration of fade-out animation.

---

## 🧩 Types

### 🔁 `CloseToastFunc`

```ts
type CloseToastFunc = () => void;
```

A callback function used to manually close a notification.
It’s passed as the **second argument** to `onClick` handlers, allowing programmatic dismissal.

---

### 💬 `NotifyData`

```ts
type NotifyData =
  | string
  | {
      message: string; // The main message to display
      title?: string;  // Optional title above the message
      onClick?: (event: MouseEvent, close: CloseToastFunc) => void; // Optional click handler
      html?: boolean;  // If true, message will be rendered as raw HTML
      avatar?: string; // Optional avatar image URL
    };
```

Represents the input used to display a notification.
It can either be a plain string (used as the message), or a detailed object for richer customization.

---

## 🔧 Constructor: `new TinyToastNotify(...)`

Initializes a new `TinyToastNotify` instance with positioning and timing preferences.

```ts
new TinyToastNotify(
  y?: 'top' | 'bottom',
  x?: 'left' | 'right' | 'center',
  baseDuration?: number,
  extraPerChar?: number,
  fadeOutDuration?: number,
  selector?: string
)
```

### 📝 Parameters

| Parameter         | Type                                | Default               | Description                                           |
| ----------------- | ----------------------------------- | --------------------- | ----------------------------------------------------- |
| `y`               | `'top'` \| `'bottom'`               | `'top'`               | Vertical alignment of the notification container      |
| `x`               | `'left'` \| `'center'` \| `'right'` | `'right'`             | Horizontal alignment of the notification container    |
| `baseDuration`    | `number`                            | `3000`                | Base display time in milliseconds                     |
| `extraPerChar`    | `number`                            | `50`                  | Extra milliseconds added per character in the message |
| `fadeOutDuration` | `number`                            | `300`                 | Time (ms) for fade-out animation                      |
| `selector`        | `string`                            | `'.notify-container'` | CSS selector used to find or create the container     |

### 🧠 Behavior

* Validates all input values strictly to prevent misconfigurations.
* Attempts to locate an existing container via the selector and alignment classes.
* If not found, it creates a new container and appends it to `document.body`.

---

## 📦 Method: `getContainer()`

Returns the `HTMLElement` used to host all notifications.

```ts
getContainer(): HTMLElement
```

### 🔁 Returns

* The current notification container element.

### ⚠️ Throws

* Throws an error if the container is not a valid `HTMLElement`.

---

## ⚙️ Position and Timing Getters & Setters

### 🔝 `getY()`

Returns the current vertical position.

* **Returns:**
  `'top' | 'bottom'` — The vertical alignment of the notification container.

---

### 🔄 `setY(value)`

Sets the vertical position of the notification container and updates its CSS classes.

* **Parameters:**

  * `value: 'top' | 'bottom'` — The new vertical position to set.

* **Throws:**

  * `Error` if the value is invalid.

---

### ↔️ `getX()`

Returns the current horizontal position.

* **Returns:**
  `'left' | 'center' | 'right'` — The horizontal alignment of the notification container.

---

### 🔀 `setX(value)`

Sets the horizontal position of the notification container and updates its CSS classes.

* **Parameters:**

  * `value: 'left' | 'center' | 'right'` — The new horizontal position to set.

* **Throws:**

  * `Error` if the value is invalid.

---

### ⏲️ `getBaseDuration()`

Returns the base display duration for notifications.

* **Returns:**
  `number` — Base time in milliseconds that a notification stays visible.

---

### ⏳ `setBaseDuration(value)`

Sets the base display duration for notifications.

* **Parameters:**

  * `value: number` — Base display time in milliseconds.

* **Throws:**

  * `Error` if `value` is not a valid non-negative finite number.

---

### ➕ `getExtraPerChar()`

Returns extra display time added per character.

* **Returns:**
  `number` — Extra milliseconds added per character in the notification.

---

### ✏️ `setExtraPerChar(value)`

Sets the extra display time added per character.

* **Parameters:**

  * `value: number` — Extra milliseconds per character.

* **Throws:**

  * `Error` if `value` is not a valid non-negative finite number.

---

### 🌙 `getFadeOutDuration()`

Returns the fade-out animation duration.

* **Returns:**
  `number` — Duration in milliseconds of the fade-out effect.

---

### 🎞️ `setFadeOutDuration(value)`

Sets the fade-out animation duration.

* **Parameters:**

  * `value: number` — Fade-out time in milliseconds.

* **Throws:**

  * `Error` if `value` is not a valid non-negative finite number.

---

## 🚀 `show(data)`

Displays a notification with customizable content and duration based on message length.

### 📝 Parameters

* `data: NotifyData` — The notification data, which can be either:

  * A **string** — Used as the message text directly.
  * An **object** with the following optional properties:

    * `message: string` — The main message text (required in object form).
    * `title?: string` — Optional title shown above the message.
    * `onClick?: function(MouseEvent, CloseToastFunc): void` — Optional click handler, receives the click event and a function to programmatically close the toast.
    * `html?: boolean` — Whether the message should be interpreted as raw HTML (default is plain text).
    * `avatar?: string` — Optional URL for an avatar image shown to the left of the notification.

### 🛠️ Behavior

* Creates a notification `<div>` element with class `notify` and adds entrance animation.
* Supports optional avatar image, title, and click handler.
* Shows a close button (`×`) with hover effect.
* Calculates display duration as:
  `baseDuration + (message length × extraPerChar) + fadeOutDuration` milliseconds.
* Automatically fades out and removes the notification after the calculated total time.
* Clicking the close button or calling the programmatic `close` function dismisses the notification.
* If an `onClick` handler is provided, clicking the notification (except on the close button) triggers it.

### ⚠️ Errors

* Throws an error if `data` is neither a string nor a valid object with a string `message` property.
* Throws an error if `onClick` is defined but is not a function.

---

## 🔥 `destroy()`

Destroys the current **TinyToastNotify** instance.
It **removes the notification container from the DOM** and **clears all pending notifications**. This method is useful when the notification system is no longer needed or when changing views in a single-page application.

### Syntax

```js
tinyToastNotify.destroy();
```

### Behavior

* Removes the entire container (`.notify-container`) from the DOM.
* Automatically cancels any pending or visible toasts.
* Cleans up internal references.

---

## 🎨 CSS Files Location

The CSS files for the TinyNotify project build can be found in the following folder:

```
dist/v1/css
```

Inside this folder, you'll find the main stylesheets:

- `TinyNotify.css` — the full, unminified CSS file
- `TinyNotify.min.css` — the minified, optimized CSS file for production 🚀

Use these files to style your notifications!  
Happy coding! ✨
