# 🚀 TinyWebWorkerEngine Documentation

Welcome to the official documentation for the **TinyWebWorkerEngine**. This engine is a robust, lightweight solution designed to manage complex communication patterns between a **Main Thread** and a **Web Worker**. It provides structured messaging, a request-response API pattern, and a plugin-ready architecture.

---

## 📖 Overview

In a standard Web Worker environment, `postMessage` is "fire and forget." This makes it difficult to know when a specific request has been processed or to handle errors returned from the other side. 

**TinyWebWorkerEngine** solves this by implementing:
1.  **Unidirectional Messaging:** Simple "fire and forget" signals. 📢
2.  **Bidirectional API Calls:** A request-response pattern using `correlationId` to track specific requests. 🔄
3.  **Strict Validation:** Ensures data integrity by validating types and structures before processing. 🛡️
4.  **Namespace Protection:** Uses a `ww:` prefix to prevent user messages from interfering with internal engine signals. 🔒

---

## 🛠 Core Concepts

To use this engine effectively, you must understand the two primary communication patterns it supports.

### 1. Unidirectional Messages (Fire and Forget) 📢
This is used when you want to send information without expecting a reply.
*   **From Worker to Main:** Use `engine.emit('type', data)`.
*   **From Main to Worker:** Use `engine.addMessageListener('type', callback)`.

### 2. The API Pattern (Request-Response) 🔄
This is used when the Worker needs to ask the Main Thread for something (like a database value or a UI state) and **must wait** for the answer.
*   **The Mechanism:** The engine generates a unique `correlationId` (using `crypto.randomUUID()`). This ID travels with the request and returns with the response, allowing the engine to resolve the correct `Promise`.
*   **Timeout Protection:** Every API request has a default timeout (10,000ms) to prevent the Worker from waiting indefinitely if the Main Thread fails to respond.

---

## 🚀 API Reference

### 🛠 Class: `TinyWebWorkerEngine`

#### `constructor(lgConfig)`
Initializes the engine instance.
*   **Parameters:**
    *   `lgConfig` `{Object}`: Configuration object.
    *   `lgConfig.debugMode` `{boolean}`: Enables detailed internal logging.
    *   `lgConfig.logger` `{Console}`: Custom logger (defaults to `console`).

#### `init()`
Starts the engine and begins listening for messages. 
*   **Note:** This must be called **once**. Calling it twice will throw an `Error`.
*   **Internal Signal:** Once initialized, the engine automatically sends a `ww:EngineReady` signal to the main thread.

#### `onApi(type, callback)`
Registers a handler for requests coming **from the Main Thread**.
*   **Parameters:**
    *   `type` `{string}`: The unique identifier for the API call.
    *   `callback` `{ApiHandlerCallback}`: The function to execute. It can be synchronous or return a `Promise`.
*   **Throws:** `TypeError` if the callback is not a function.

#### `addMessageListener(type, callback)`
Registers a listener for simple, unidirectional messages.
*   **Parameters:**
    *   `type` `{string}`: The message type.
    *   `callback` `{MessageCallback}`: The function to execute when the message arrives.

#### `emit(type, data)`
Sends a unidirectional message to the Main Thread.
*   **Parameters:**
    *   `type` `{string}`: The identifier. **Cannot start with `ww:`**.
    *   `data` `{Object|undefined}`: The payload. Must be a non-null object.
*   **Throws:** `TypeError` if the type is reserved or data is invalid.

#### `emitApi(type, data, timeout)`
Sends a request to the Main Thread and returns a `Promise` that resolves when the reply arrives.
*   **Parameters:**
    *   `type` `{string}`: The identifier for the request.
    *   `data` `{Object|undefined}`: The request payload.
    *   `timeout` `{number}`: Max wait time in ms (default `10000`).
*   **Returns:** `Promise<any>`
*   **Throws:** `Error` if the timeout is reached.

---

## 📝 Practical Examples

### 🏗 Example 1: Setting up the Worker
This is how you would implement the engine inside your `worker.js` file.

```javascript
import TinyWebWorkerEngine from 'tiny-essentials/libs/worker/engine/TinyWebWorkerEngine';

const engine = new TinyWebWorkerEngine({ debugMode: true });

// 1. Handle simple messages from the main thread
engine.addMessageListener('GREETING', (msg) => {
  console.log('Received greeting:', msg.data.text);
});

// 2. Handle API requests (Request-Response)
engine.onApi('GET_USER_DATA', async ({ data, correlationId }) => {
  // Simulate an async database fetch
  const user = await fetchUserData(data.userId); 
  
  // Return the result to the main thread
  return user;
});

// 3. Start the engine
engine.init();

// 4. Emit a simple notification to the main thread
engine.emit('STATUS_UPDATE', { status: 'Worker is running smoothly' });
```

### 📡 Example 2: Using the Engine in the Main Thread
(Conceptual logic for the Main Thread side)

```javascript
// When the worker sends a simple message
worker.addEventListener('message', (event) => {
  if (event.data.type === 'STATUS_UPDATE') {
    console.log('Worker status:', event.data.data.status);
  }
});

// When the worker makes an API call to the main thread
engine.onApi('GET_USER_DATA', async ({ data }) => {
  return { id: data.userId, name: 'Yasmin', role: 'Developer' };
});
```

---

## ⚠️ Safety & Best Practices

1.  **Avoid Namespace Collisions:** Never use the `ww:` prefix for your own custom message types. The engine uses this for internal lifecycle management (like `ww:ApiResponse`).
2.  **Error Handling in API:** When writing an `onApi` handler, always wrap your logic in `try/catch` or return a rejected `Promise`. The engine will automatically catch these and send the error back to the main thread.
3.  **Data Integrity:** Always pass objects as `data`. Avoid passing primitives (like just a string) if you plan to expand the data structure later.
4.  **Timeout Management:** When calling `emitApi`, always be prepared to handle a potential timeout error in your `.catch()` block.
