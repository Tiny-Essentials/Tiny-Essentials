# 🚀 TinyThrottledApi Documentation

`TinyThrottledApi` is a professional-grade utility designed to manage asynchronous operations. It acts as a "gatekeeper" for your API calls, ensuring you do not overwhelm a server by sending too many requests at once (**Concurrency Control**) and helping you stay within rate limits (**Rate Throttling**).

## 📋 Table of Contents
1. [Core Concepts](#-core-concepts)
2. [Getting Started](#-getting-started)
3. [API Reference](#️-api-reference)
    * [Constructor](#constructorconcurrencylimit-api-timeoutinstance)
    * [Methods](#methods)
    * [Getters](#getters)
    * [Setters](#setters)
    * [Events](#events)
4. [Practical Examples](#-practical-examples)

---

## 🧠 Core Concepts

To use this library effectively, you must understand the two problems it solves:

### 🚦 1. Concurrency Control
If you try to fetch 1,000 items from a database simultaneously, your application might crash or the server might block your IP. 
**The Solution:** `TinyThrottledApi` limits the number of active requests. If the limit is 5, and you request 10, only 5 will run immediately; the other 5 will wait in a queue until a slot opens up.

### ⏱️ 2. Rate Throttling
Even if you only run 5 requests at a time, sending them too quickly in "bursts" can trigger security filters.
**The Solution:** By integrating `TinyTimeout`, the API can introduce a dynamic delay between requests. This spreads the load over a longer period, making your traffic pattern look more natural and less aggressive.

---

## 🚀 Getting Started

### Installation Context
This module expects the following dependencies to be present in your project structure:
* `tiny-essentials/libs/utils/TinyPromiseQueue` (For managing the waiting list).
* `tiny-essentials/basics/promiseUtils` (Specifically the `waitForTrue` function).
* `tiny-essentials/libs/math/TinyTimeout` (For regulating execution frequency).

### Basic Initialization
```javascript
import TinyThrottledApi from 'tiny-essentials/libs/utils/TinyThrottledApi';

// A mock API function to simulate a network request
const mockApi = async (id) => {
  console.log(`🚀 Fetching data for ID: ${id}`);
  return new Promise((resolve) => setTimeout(() => resolve(`Data ${id}`), 1000));
};

// Create an instance: Max 3 concurrent requests
const throttledApi = new TinyThrottledApi(3, mockApi);
```

---

## 🛠️ API Reference

### `constructor(concurrencyLimit, api, timeoutInstance)`
Initializes the throttled controller.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `concurrencyLimit` | `number` | Must be a positive integer. Defines max simultaneous tasks. |
| `api` | `Function` | The target asynchronous function to execute. |
| `timeoutInstance` | `TinyTimeout \| null` | (Optional) An instance to control request frequency. |

**Throws:**
* `TypeError`: If `concurrencyLimit` is not a positive number or `api` is not a function.
* `TypeError`: If `timeoutInstance` is provided but is not a `TinyTimeout` instance.

### `exec(...args)`
The primary method to execute your API calls.

* **Returns:** `Promise<ReturnType<API>>`.
* **Behavior:** 
  1. Checks if a slot is available.
  2. If yes, executes immediately.
  3. If no, adds the task to the `TinyPromiseQueue` and waits for a slot to become free.
* **Task Tracking:** Each task is assigned a unique `UUID` used in emitted events for precise tracking.

### Methods
| Method | Description |
| :--- | :--- |
| `exec(...args)` | Executes the API function respecting concurrency and throttling. |
| `destroy()` | Cleans up the instance, removing all listeners and stopping pending tasks. |

### Getters
| Getter | Type | Description |
| :--- | :--- | :--- |
| `api` | `Function` | The original API function provided during initialization. |
| `queue` | `TinyPromiseQueue` | Returns the internal queue instance managing pending tasks. |
| `concurrencyLimit` | `number` | The current maximum number of simultaneous requests. |
| `timeoutInstance` | `TinyTimeout \| null` | The current `TinyTimeout` instance used for rate limiting. |
| `timeoutValue` | `number` | The current base delay multiplier in milliseconds. |
| `timeoutLimit` | `number \| null` | The current maximum delay cap. |
| `activeCount` | `number` | The number of requests currently running. |
| `queuedCount` | `number` | The number of tasks currently waiting in the queue. |
| `isDestroyed` | `boolean` | Indicates whether the instance has been destroyed. |
| `timeoutFirst` | `boolean` | Indicates if the delay is applied *before* the first request in a cycle. |

### Setters
| Setter | Parameter | Description |
| :--- | :--- | :--- |
| `concurrencyLimit` | `number` | Sets a new maximum number of simultaneous requests. |
| `timeoutValue` | `number` | Sets a new base delay multiplier in milliseconds. |
| `timeoutLimit` | `number` | Sets a new maximum delay cap. |
| `timeoutFirst` | `boolean` | If `true`, delay is applied before waiting for a slot. If `false`, delay is applied after. |

### Events
The `TinyThrottledApi` extends `EventEmitter` and emits the following events:

#### Task Lifecycle Events
| Event | Argument | Description |
| :--- | :--- | :--- |
| `ExecTask` | `id` (string) | Emitted when a task begins its execution. |
| `TaskEnded` | `id` (string) | Emitted when a task completes (whether it succeeded or failed). |
| `WaitingTask` | `id` (string) | Emitted when a task is placed into the queue because the limit was reached. |
| `Destroyed` | | Emitted when the instance has been destroyed and can no longer be used. |

#### Configuration Events
| Event | Argument | Description |
| :--- | :--- | :--- |
| `SetConcurrencyLimit` | `value` (number) | Emitted when the `concurrencyLimit` is updated. |
| `SetTimeoutValue` | `value` (number) | Emitted when the `timeoutValue` is updated. |
| `SetTimeoutLimit` | `value` (number) | Emitted when the `timeoutLimit` is updated. |

---

## 💡 Practical Examples

### 🚀 Example 1: Simple Concurrency (The "Batch" Pattern)
Use this when you have a large array of IDs and want to fetch data from a real API without overwhelming the client or the server. We use `JSONPlaceholder` (a free fake API) for this example.

```javascript
import TinyThrottledApi from 'tiny-essentials/libs/utils/TinyThrottledApi';

/**
 * A real-world fetch wrapper.
 * @param {number} id 
 * @returns {Promise<Object>}
 */
const fetchData = async (id) => {
  const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
};

// Limit to 3 simultaneous network requests
const throttledApi = new TinyThrottledApi(3, fetchData);

async function runBatch() {
  const ids = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  console.log("Starting batch fetch...");

  // Map IDs to promises managed by the throttled API
  const tasks = ids.map(id => 
    throttledApi.exec(id)
      .then(data => console.log(`✅ Success [ID ${id}]:`, data.title))
      .catch(err => console.error(`❌ Error [ID ${id}]:`, err.message))
  );

  await Promise.all(tasks);
  console.log("🏁 All batch tasks completed!");
}

runBatch();
```

### ⏱️ Example 2: Advanced Throttling (The "Polite" Pattern)
Use this when the API you are calling has strict rate limits (e.g., "no more than 5 requests per second"). By using `TinyTimeout`, we ensure our requests are spaced out gracefully.

```javascript
import TinyThrottledApi from 'tiny-essentials/libs/utils/TinyThrottledApi';
import TinyTimeout from 'tiny-essentials/libs/math/TinyTimeout';

const fetchData = async (id) => {
  const response = await fetch(`https://jsonplaceholder.typicode.com/posts/${id}`);
  return await response.json();
};

// 1. Initialize the timing controller
const timeout = new TinyTimeout();

// 2. Create the throttled API
// We allow 2 concurrent requests, but we want to space them out
const throttledApi = new TinyThrottledApi(2, fetchData, timeout);

// 3. Configure the "politeness" delay
// Base delay of 1000ms (1 second) between requests
throttledApi.timeoutValue = 1000; 
// Maximum delay cap of 5000ms
throttledApi.timeoutLimit = 5000;
// Apply delay BEFORE the first request in the cycle
throttledApi.timeoutFirst = true; 

async function runPoliteBatch() {
  const ids = [1, 2, 3, 4, 5];

  console.log("Starting polite batch fetch...");

  const tasks = ids.map(id => 
    throttledApi.exec(id).then(data => {
      console.log(`📦 Received ID ${id} at ${new Date().toLocaleTimeString()}`);
      return data;
    })
  );

  await Promise.all(tasks);
  console.log("🏁 Polite batch completed!");
}

runPoliteBatch();
```
