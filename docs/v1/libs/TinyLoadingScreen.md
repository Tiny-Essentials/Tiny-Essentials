# TinyLoadingScreen 📦✨

A lightweight, fully-configurable **loading overlay component** that can be appended to any HTML element.

It allows you to display a customizable overlay with a spinner and message while your app is loading content.

---

## Constructor 🏗️

```ts
new TinyLoadingScreen(container?: HTMLElement)
```

* `container` — The HTML element where the overlay will be appended. Defaults to `document.body`.
* Throws `TypeError` if the container is not an `HTMLElement`.

---

## Properties 🔑

| Property         | Type                                      | Description                                                    |
| ---------------- | ----------------------------------------- | -------------------------------------------------------------- |
| `overlay`        | `HTMLDivElement \| null`                  | The overlay element if active, otherwise `null`.               |
| `messageElement` | `HTMLDivElement \| null`                  | The element used to render the message, or `null` if inactive. |
| `container`      | `HTMLElement`                             | The container element that holds the overlay.                  |
| `status`         | `'none'\|'fadeIn'\|'active'\|'fadeOut'`    | Current state of the loading screen.                           |
| `defaultMessage` | `string \| HTMLElement`                   | Default message to display when no custom message is provided. |
| `message`        | `string \| HTMLElement \| null`           | Currently displayed message.                                   |
| `allowHtmlText`  | `boolean`                                 | Whether HTML is allowed inside string messages.                |
| `visible`        | `boolean`                                 | `true` if the overlay is currently visible, `false` otherwise. |
| `onChange`       | `(status: LoadingStatus) => void \| null` | Optional callback fired whenever the status changes.           |

---

## Options ⚙️

You can configure the loading screen using the `options` property:

```ts
loader.options = {
  fadeIn: 300,   // milliseconds, null = no animation
  fadeOut: 300,  // milliseconds, null = no animation
  zIndex: 9999   // overlay z-index
};
```

* Throws `TypeError` if invalid values are provided.

---

## Methods 🛠️

### `start(message?: string | HTMLElement) → boolean` ✅

* Starts the loading screen, or updates the message if already active.
* `message` — The message to display. Defaults to `defaultMessage`.
* Returns `true` if overlay was created, `false` if only the message was updated.
* Throws `TypeError` if `message` is not a string or HTMLElement.

---

### `update(message?: string | HTMLElement) → boolean` ✏️

* Updates the loading screen message.
* Returns `true` if the message was updated, `false` if overlay is not active.
* Throws `TypeError` if `message` is not a string or HTMLElement.

---

### `stop() → boolean` ❌

* Stops and removes the loading screen.
* Returns `true` if overlay was removed, `false` if overlay was not active.

---

### Internal / Private Methods 🔒

| Method                    | Description                                                                                           |
| ------------------------- | ----------------------------------------------------------------------------------------------------- |
| `_updateMessage(message)` | Updates the displayed message. Throws errors if invalid types or HTMLElement without `allowHtmlText`. |
| `_removeOldClasses()`     | Removes all status-related CSS classes (`active`, `fadeIn`, `fadeOut`) from the overlay.              |
| `_emitChange()`           | Emits the `onChange` callback with the current `status`.                                              |

> ⚠️ Private methods are for internal use only.

---

## Status States 🟢⚪🔴

The loading screen has four states:

| Status      | Meaning                              |
| ----------- | ------------------------------------ |
| `'none'`    | Not visible                          |
| `'fadeIn'`  | Appearing with fade-in animation     |
| `'active'`  | Fully visible and active             |
| `'fadeOut'` | Disappearing with fade-out animation |

* `onChange` callback is fired whenever the status changes.

---

## Callbacks 🔔

### `onChange: (status: LoadingStatus) => void`

```ts
loader.onChange = (status) => {
  console.log('Loading screen status:', status);
};
```

* Fired on every status change: `fadeIn`, `active`, `fadeOut`, `none`.

---

## Usage Examples 💡

### Basic Example

```js
import TinyLoadingScreen from 'tiny-essentials/libs/TinyLoadingScreen';

const loader = new TinyLoadingScreen();
loader.defaultMessage = 'Loading...';
loader.start();

// Stop after 2 seconds
setTimeout(() => loader.stop(), 2000);
```

---

### Custom Container

```js
const container = document.getElementById('custom-container');
const loader2 = new TinyLoadingScreen(container);
loader2.defaultMessage = 'Loading content...';
loader2.start();

// Update message dynamically
loader2.update('Almost done...');
```

---

### With onChange Callback

```js
loader.onChange = (status) => {
  console.log('Status changed:', status);
};
```

---

### Custom Animations ⏳

```js
loader.options = {
  fadeIn: 500,  // fade-in duration in ms
  fadeOut: 500, // fade-out duration in ms
  zIndex: 10000
};
```

---

### Allow HTML Messages 🖌️

```js
loader.allowHtmlText = true;
loader.start('<b>Loading <i>data</i>...</b>');
```

---

### Notes 📝

* Fade durations can be `null` to disable animations.
* HTML messages require `allowHtmlText = true`.
* `_removeOldClasses()` ensures that multiple animations don't conflict.
* Use `onChange` to hook into status changes for debugging or UI updates.
