# 🧩 TinyIframeEvents

A flexible event routing system for structured communication between a **parent window** and its **iframe** using `MessageChannel`.

This module abstracts the complexity of cross-origin communication by establishing a direct, un-interceptable port connection after a secure initial handshake. It allows **modular, bidirectional, and secure communication** across frames, completely bypassing the broadcast vulnerabilities of standard `postMessage`.

---

## ✨ Features

- 🔁 **Bidirectional communication** (`iframe` ⇄ `parent`) via a private `MessagePort`.
- 🎯 **Named event routes** with custom payloads.
- 🧠 **Smart context detection** (no config required inside the iframe).
- ⚙️ **Customizable internals:** Avoid naming collisions by customizing the secret handshake and ready event names.
- ⏳ **Queue management:** Safely emit events before the connection is ready; they will be flushed automatically once established.
- 🔄 **Auto-reconnect:** Automatically handles port resets if the target iframe is reloaded.
- 🧹 **Clean-up support** with `.destroy()`.

---

## 🚀 Usage

### In the parent:

```js
import TinyIframeEvents from './TinyIframeEvents.mjs';

const iframe = document.querySelector('iframe');

const parentEvents = new TinyIframeEvents({
  targetIframe: iframe, // Will use iframe.contentWindow
  targetOrigin: window.location.origin,
  // Optional: customize internal events to prevent collisions
  secretEventName: '__myCustomSecret__', 
});

// You can safely emit before the iframe is ready. 
// It will be queued and sent automatically!
parentEvents.emit('hello:iframe', { text: '👋 From parent!' });

// Wait for the secure channel to be fully established
parentEvents.onReady(() => {
  console.log('✅ Secure connection established with iframe!');
});

parentEvents.on('reply:fromIframe', (data, event) => {
  console.log('📨 Received from iframe:', data, event);
});
```

---

### In the iframe:

```js
import TinyIframeEvents from './TinyIframeEvents.mjs';

const iframeEvents = new TinyIframeEvents({
  // Make sure these match the parent's config if you changed them!
  secretEventName: '__myCustomSecret__',
});

iframeEvents.onReady(() => {
  console.log('✅ Secure connection established with parent!');
  iframeEvents.emit('reply:fromIframe', { text: '🙋‍♀️ Hi parent!' });
});

iframeEvents.on('hello:iframe', (data, event) => {
  console.log('📥 Message from parent:', data);
});
```

---

## 🧠 API Reference

### `new TinyIframeEvents(config?)`

Creates a new instance for communication and automatically begins the handshake process.

#### Parameters:

| Name | Type | Description |
| :--- | :--- | :--- |
| `targetIframe` | `HTMLIFrameElement?` | The iframe element to communicate with (required in the parent only). |
| `targetOrigin` | `string?` | Expected origin for the initial handshake. Defaults to `window.location.origin`. |
| `secretEventName` | `string?` | Internal key used to validate standard routing messages. |
| `handshakeEventName`| `string?` | Internal event name used for the initial `MessageChannel` port transfer. |
| `readyEventName` | `string?` | Internal event name used to trigger `.onReady()` listeners. |

---

### `onReady(handler)`

Executes a callback when the secure `MessageChannel` connection is fully established. If the connection is already ready, it executes immediately.

```js
iframeEvents.onReady(() => {
  // Safe to assume the secure pipeline is open
});
```

---

### `emit(eventName, payload)`

Sends a message to the target frame through the secure port. If the port is not ready yet, the message is queued.

| Param | Type | Description |
| :--- | :--- | :--- |
| `eventName` | `string` | Unique identifier of the event. |
| `payload` | `any` | The data to send (must be a serializable value; DOM nodes and functions cannot be cloned). |

#### Throws:
* `TypeError` if `eventName` is not a string.
* `Error` if the instance has been destroyed.

---

### `on(eventName, handler)`

Registers a listener for a specific event.

```js
iframeEvents.on('my:event', (payload, event) => {
  // Access data via `payload`
});
```

---

### `destroy()`

Removes all listeners, closes the `MessagePort`, and cleans up DOM event bindings to prevent memory leaks. Call this when the instance is no longer needed.

```js
iframeEvents.destroy();
```

---

### `isDestroyed()`

Returns `true` if the instance has been destroyed via `.destroy()`.

```js
if (events.isDestroyed()) {
  console.warn('Event system is no longer active.');
}
```

---

## 🔒 Security Notes

* **Direct Pipeline:** Once the initial handshake passes the `MessagePort`, all communication happens directly between the two contexts. It does not broadcast to `window.addEventListener('message')`, making it immune to interception by other scripts or browser extensions.
* **Internal Validation:** Messages are strictly validated using the `secretEventName` flag and direction checks (`iframe` vs `parent`).

---

## 📚 Internals (for advanced users)

This class internally wraps:
* `MessageChannel` and `MessagePort` for isolated communication.
* A minimal event router: `TinyEvents`.

---

## 📄 Type Definitions

### `@callback handler`

```ts
type handler = (
  payload: any,
  event: MessageEvent<any>
) => void;
```
