# 🚀 TinyServiceWorkerEngine Documentation

Welcome to the official documentation for the **TinyServiceWorkerEngine**. This engine is a professional-grade tool designed to manage the complexities of a Service Worker, specifically focusing on **Fetch Interception**, **Messaging Communication**, and **Lifecycle Management**.

Instead of writing hundreds of lines of repetitive `addEventListener` logic, this engine provides a structured, plugin-based architecture to handle network requests and cross-context communication.

---

## 🧠 Core Concepts (The Mental Model)

To use this engine effectively, you must understand its three primary "layers":

1.  **The Interception Layer (Fetch):** The engine sits between the browser and the network. It can watch every request, match it against patterns (URLs or Regex), and decide: *"Should I let this go to the internet, or should I provide a custom response (like a cached file or an error page)?"*
2.  **The Communication Layer (Messaging):** The Service Worker lives in a separate thread from your web page. This engine provides a "bridge" to send structured messages back and forth using `postMessage`, including helper methods to reply specifically to the sender.
3.  **The Routing Layer (Router):** When a fetch fails (e.g., a 404 or 500 error), the engine can automatically route the user to a specific "Error Page" (like `404.html`) without you writing manual logic every time.

---

## 🛠️ Getting Started

### 1. The Constructor

To start the engine, you must instantiate the `TinyServiceWorkerEngine` class and call the `.init()` method.

When you instantiate the engine, you can provide two configuration objects.

#### `new TinyServiceWorkerEngine(config, lgConfig)`

**Parameter: `config` (Object) — `ServiceWorkerSettings`**
Defines the operational behavior of the engine.
* `spaMode` (boolean): If `true`, the engine uses the `spaPath` (default: `/index.html`) when handling routing errors. If `false`, it uses the original requested path.
* `fetch` (Object):
  * `enabled` (boolean): Activates/deactivates fetch interception.
  * `router` (Object):
      * `enabled` (boolean): Activates/deactivates the automatic error routing.
      * `codes` (Map<number, RouterCodeConfig>): A Map where keys are HTTP status codes and values are custom response handlers.
* `push` (Object) — `PushOptions`: Configuration for push notification interception.
  * `enabled` (boolean): Activates/deactivates push event interception.
* `messaging` (Object):
  * `enabled` (boolean): Activates/deactivates the `message` event listener.

**Parameter: `lgConfig` (Object) — `LoggerOptions`**
Defines how the engine logs its internal operations.
*   `debugMode` (boolean): If `true`, enables verbose internal logging.
*   `useLogColors` (boolean): If `true`, adds terminal/console colors to logs.
*   `logger` (Object): A custom logger (defaults to `console`).

**Why this structure?**
By separating `config` from `lgConfig`, we separate **business logic** (how the SW behaves) from **developer tools** (how the SW reports its status).

```javascript
import TinyServiceWorkerEngine from 'tiny-essentials/libs/sw/service/TinyServiceWorkerEngine';

const engine = new TinyServiceWorkerEngine({
  spaMode: true, // Set to true if you are building a Single Page Application
  fetch: {
    enabled: true,
    router: {
      enabled: true,
      codes: new Map() // You can add custom status code handlers here
    }
  },
  messaging: {
    enabled: true
  }
}, {
  debugMode: true,
  useLogColors: true
});

// This is a mandatory step to start listening to events
engine.init();
```

**Why `init()`?**
The constructor sets up the internal state, but the `.init()` method actually attaches the listeners to the `self` (Service Worker) global scope. Without it, the engine remains idle.

---

## 🌐 Feature 1: Fetch Interception

The engine allows you to intercept requests using three different levels of granularity. All listeners receive a `fetchObj` and `result` as the arguments.

**Callback Signature:**
`async (fetchObj: FetchObj, result: FetchCheckerResult) => Promise<void> | void`

### 📦 The `fetchObj` Argument Reference
When a match is found, the callback is executed with this object:

| Property | Type | Description |
| :--- | :--- | :--- |
| `event` | `FetchEvent` | The original browser FetchEvent. |
| `request` | `Request` | The original Request object being intercepted. |
| `url` | `URL` | The parsed URL object of the request. |
| `params` | `Record<string, string>` | Key-value pairs extracted from dynamic paths (e.g., `/:id`). |
| `isSameOrigin` | `boolean` | `true` if the request is from the same origin as the SW. |
| `replyTo` | `Function` | Helper to reply to the specific client that triggered the fetch. |
| `replyToAll` | `Function` | Helper to broadcast a message to all open browser tabs. |
| `replyTemplate` | `Function` | Utility to format a message object before sending. |
| `error` | `Error` (Optional) | Contains error details if the plugin execution failed. |

### ⚙️ The Interception Flow Control (`result` object)

When you intercept a request, the engine provides a `result` object as the **second argument** to your callback function. This object is used to communicate back to the engine how the interception should proceed.

#### `FetchCheckerResult` Property Reference

| Property | Type | Description |
| :--- | :--- | :--- |
| `code` | `number` | The HTTP status code associated with the fetch result. This can be used to trigger the Router. |
| `needValidation` | `boolean` | **The Router Trigger.** If `true`, the engine checks the `code` against the Router configuration. If the code is an error (like 404), the engine will serve the configured error page. |
| `isSameOrigin` | `boolean` | Indicates if the request is from the same origin as the Service Worker. |
| `continueCheck` | `boolean` | **The Flow Controller.** If set to `false`, the engine immediately stops searching for other matching plugins and proceeds with the standard network request. |

#### 🛠️ Practical Implementation Examples

**1. Stopping the Search (Flow Control)**
If you have multiple listeners and you want to ensure that once *this* plugin handles the request, no other plugins are even checked, set `continueCheck` to `false`.

```javascript
engine.addFetchUrlListener('/api/secure-data', async (fetchObj, result) => {
  // Perform security logic...
  
  // Stop the engine from looking for more matches for this request
  result.continueCheck = false;
  
  return new Response(JSON.stringify({ data: 'secret' }));
});
```

**2. Forcing an Error Page (Router Trigger)**
If your plugin detects that a resource is missing (even if the browser hasn't realized it yet), you can force the engine to trigger the Router by setting `needValidation` to `true` and providing a `code`.

```javascript
engine.addFetchUrlListener('/old-api/:version', async (fetchObj, result) => {
  const isLegacy = fetchObj.params.version === 'v1';

  if (isLegacy) {
    // Force the engine to treat this as a 404 error and trigger the Router
    result.code = 404;
    result.needValidation = true;
    return;
  }
});
```

**3. Bypassing the Router for Errors**
Sometimes a request returns a 404, but you want the browser to handle it normally (perhaps to allow a different part of your app to catch the error) instead of showing a custom `404.html` page.

```javascript
engine.addFetchUrlListener('/api/external-service', async (fetchObj, result) => {
  // We don't want the Router to intercept this 404.
  // We want the original 404 response to go straight to the application.
  result.needValidation = false;
});
```

**4. Exact or Parameterized URL Matching**
```javascript
// Intercepting a specific path
engine.addFetchUrlListener('/api/config', async ({ url }) => {
  console.log('Intercepted config request:', url);
  return new Response(JSON.stringify({ status: 'ok' }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

// Intercepting a parameterized path
engine.addFetchUrlListener('/user/:id', async ({ params }) => {
  const { id } = params; // The engine extracts ':id' automatically
  return new Response(`Hello User ${id}`);
});
```

**5. Regular Expression (RegExp) Matching**
Use this for patterns that are too complex for simple URL strings.

```javascript
// Intercepting any image request
engine.addFetchRegExpListener('\\.png$', async ({ url }) => {
  console.log('User requested a PNG:', url.pathname);
  // You could return a placeholder image here
});
```

**6. Global Tracking**
If you want to perform an action (like logging) on **every single request** without changing the response, use the Global listener.

```javascript
engine.addFetchGlobalListener('analytics', async ({ url }) => {
  console.log(`Request made to: ${url.pathname}`);
  // This does not stop the request; it just "watches" it.
});
```

---

## 💬 Feature 2: Messaging System

The messaging system enables bidirectional communication. Listeners receive a `msg` object as their first argument.

### 📦 The `msg` Argument Reference
When a message is received, the callback is executed with this object:

| Property | Type | Description |
| :--- | :--- | :--- |
| `event` | `ExtendableMessageEvent` | The original message event. |
| `clientId` | `string` | The unique ID of the client (tab) that sent the message. |
| `data` | `Object` | The payload sent by the client (`event.data.data`). |
| `reply` | `Function` | A convenience method to reply directly to the sender. |
| `replyTo` | `Function` | Sends a message to a specific `Client`. |
| `replyToAll` | `Function` | Broadcasts a message to all available clients. |
| `replyTemplate` | `Function` | Formats the reply into the required `MessagingData` structure. |

```javascript
engine.addMessageListener('GET_USER_DATA', async ({ data, reply }) => {
  const userId = data.id;
  
  // Perform some logic
  const userData = { id: userId, name: 'Yasmin' };

  // Reply directly to the specific window/client that asked
  reply('USER_DATA_RESPONSE', userData);
});
```

### Sending a Message from the Website (Main Thread)

```javascript
// In your main app.js
navigator.serviceWorker.controller.postMessage({
  type: 'GET_USER_DATA',
  data: { id: 123 }
});

// Listening for the reply
navigator.serviceWorker.addEventListener('message', (event) => {
  if (event.data.type === 'USER_DATA_RESPONSE') {
    console.log('Received data:', event.data.data);
  }
});
```

**Why use `msg.reply()`?**
In a Service Worker, there might be many open tabs. If you use a broadcast, every tab receives the message. `msg.reply()` ensures that **only the tab that requested the data** receives the answer.

---

## 🚦 Feature 3: The HTTP Router

The router automatically handles errors by serving specific HTML files based on the HTTP status code.

### Customizing Error Pages

```javascript
// If a request returns a 404, serve a custom 404.html file
engine.addRouterCode(404, {
  msg: 'Not Found',
  logMsg: 'User tried to access a non-existent route',
  pathGetter: () => '/errors/custom-404.html'
});
```

**Why use this?**
This mimics how professional web servers (like Apache2) work. It ensures that if an API call or a page load fails, the user sees a beautiful, branded error page instead of a generic browser error.

---

## 🔔 Feature 4: Push & Notifications

The engine provides built-in support for the Web Push API and user interaction with browser notifications.

### 📡 Push Events
When a push event is received from the server, the engine automates the following workflow:
1.  **Data Parsing:** It attempts to parse the payload as JSON. If parsing fails, it falls back to a text format.
2.  **Internal Event:** It emits a `push` event, allowing plugins to react to the incoming data.
3.  **Client Broadcast:** It automatically broadcasts a `sw:PushReceived` message to all open browser tabs/clients via `postMessage`. This allows your website's main thread to react to the push event in real-time.

### 🖱️ Notification Interaction
The engine listens for `notificationclick` events. When a user interacts with a notification:
1.  **Event Emission:** The engine emits a `notificationclick` event for internal handling.
2.  **Automatic Cleanup:** The engine automatically calls `event.notification.close()` to dismiss the notification from the user's screen.

### 🛠️ Manual Notifications
You can trigger a native browser notification directly from the Service Worker using the `showNotification` method.

```javascript
// Triggering a manual notification
await engine.showNotification('New Message', 'You have received a new notification!', {
  icon: '/icons/icon-192x192.png',
  badge: '/icons/badge-72x72.png'
});
```
*Note: This method will throw an error if `push.enabled` is set to `false` in the configuration.*

---

## ⚙️ Configuration & Security

### Strict Validation
The engine is designed with "Fail Fast" principles. If you pass an incorrect type (e.g., passing a `string` where a `boolean` is expected in the config), the engine will throw a `TypeError` immediately.

**Why?**
In Service Workers, debugging is notoriously difficult because they run in the background. By throwing errors during initialization, we catch configuration mistakes immediately during development.

### SPA Mode
If `spaMode` is set to `true`, the engine adjusts how paths are calculated. This is essential for frameworks like React, Vue, or Angular where the routing is handled on the client side.

---

## 📝 API Reference Summary

To make navigation easier, the API is divided into three functional modules: **Fetch Management**, **Messaging**, and **Router Management**.

### 🌐 1. Fetch Management
These methods allow you to control how the engine intercepts and tracks network requests.

| Method | Purpose | Arguments | Returns |
| :--- | :--- | :--- | :--- |
| **Registration** | | | |
| `addFetchUrlListener` | Registers an exact or parameterized URL match. | `type (string)`, `callback` | `void` |
| `addFetchRegExpListener` | Registers a pattern match via Regex. | `type (string)`, `callback` | `void` |
| `addFetchGlobalListener` | Registers a listener for every request. | `type (string)`, `callback` | `void` |
| **Retrieval & Check** | | | |
| `getFetchUrlListener` | Retrieves a specific URL listener. | `type (string)` | `callback \| undefined` |
| `getFetchRegExpListener`| Retrieves a specific RegExp listener. | `type (string)` | `callback \| undefined` |
| `getFetchGlobalListener` | Retrieves a specific global listener. | `type (string)` | `callback \| undefined` |
| `hasFetchUrl` | Checks if a URL listener exists. | `type (string)` | `boolean` |
| `hasFetchRegExp` | Checks if a RegExp listener exists. | `type (string)` | `boolean` |
| `hasFetchGlobal` | Checks if a global listener exists. | `type (string)` | `boolean` |
| **Removal & Cleanup** | | | |
| `removeFetchUrlListener` | Removes a specific URL listener. | `type (string)` | `boolean` |
| `removeFetchRegExpListener`| Removes a specific RegExp listener. | `type (string)` | `boolean` |
| `removeFetchGlobalListener`| Removes a specific global listener. | `type (string)` | `boolean` |
| `clearFetchUrls` | Wipes all registered URL listeners. | None | `void` |
| `clearFetchRegExps` | Wipes all registered RegExp listeners. | None | `void` |
| `clearFetchGlobals` | Wipes all registered global listeners. | None | `void` |
| **Metadata** | | | |
| `fetchUrlSize` | Returns the count of URL listeners. | None | `number` |
| `fetchRegExpSize` | Returns the count of RegExp listeners. | None | `number` |
| `fetchGlobalSize` | Returns the count of global listeners. | None | `number` |
| **Registration & Execution** | | | |
| `onApi` | Registers a handler for API calls coming from the browser. | `type (string)`, `callback` | `void` |
| `offApi` | Removes a registered API handler. | `type (string)` | `boolean` |
| `emitApi` | Sends a request to a specific client and waits for a response. | `client (Client)`, `type (string)`, `data (any)`, `timeout (number)` | `Promise<any>` |

### ⚙️ 3. Lifecycle & Utility
| Method | Purpose | Arguments | Returns |
| :--- | :--- | :--- | :--- |
| `init` | Initializes the Service Worker event listeners. | None | `void` |
| `showNotification` | Displays a native notification to the user. | `title (string)`, `body (string)`, `options (Object)` | `Promise<void>` |

### 💬 4. Message Management
These methods manage the communication bridge between the Main Thread and the Service Worker.

| Method | Purpose | Arguments | Returns |
| :--- | :--- | :--- | :--- |
| **Registration** | | | |
| `addMessageListener` | Registers a listener for a message type. | `type (string)`, `callback` | `void` |
| **Retrieval & Check** | | | |
| `getMessageListener` | Retrieves a specific message listener. | `type (string)` | `callback \| undefined` |
| `hasMessageListener` | Checks if a message listener exists. | `type (string)` | `boolean` |
| **Removal & Cleanup** | | | |
| `removeMessageListener` | Removes a specific message listener. | `type (string)` | `boolean` |
| `clearMessageListeners` | Wipes all registered message listeners. | None | `void` |
| **Metadata** | | | |
| `messagesSize` | Returns the count of message listeners. | None | `number` |

### 🚦 5. Router Management
These methods allow you to customize how the engine handles specific HTTP status codes.

| Method | Purpose | Arguments | Returns |
| :--- | :--- | :--- | :--- |
| `addRouterCode` | Adds/updates a custom handler for a code. | `code (number)`, `config` | `void` |
| `removeRouterCode` | Removes a custom code handler. | `code (number)` | `boolean` |
| `getRouterCode` | Retrieves a deep clone of a code config. | `code (number)` | `RouterCodeConfig \| undefined` |

---

## 🔗 Full PWA Integration (Client-Side)

To achieve a complete and seamless Progressive Web App (PWA) experience, it is highly recommended to use the `TinyServiceWorkerEngine` in conjunction with our dedicated client-side module.

While the `TinyServiceWorkerEngine` manages the background logic and network interception within the **Service Worker context**, the **`TinyServiceWorker`** module provides the necessary interface to interact with the engine from your **Main Thread (the browser window)**.

### 📍 Recommended Next Step
To learn how to communicate with the engine from your web application, please refer to the integration guide here:
👉 [TinyServiceWorker](../TinyServiceWorker.md)

**Why integrate both?**
Using both modules allows you to fully leverage the **Messaging System**. This enables your website to:
1.  **Listen** to events triggered by the Service Worker.
2.  **Trigger** updates and lifecycle events.
3.  **Exchange data** between the background process and the user interface in real-time.

---

## 🧩 TinyPlugin Ecosystem Integration

`TinyServiceWorker` is not a standalone utility; it is a first-class citizen of the **[TinyPlugin](../../plugin/TinyPlugin.md)** architecture.
