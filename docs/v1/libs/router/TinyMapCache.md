# 📦 TinyMapCache Documentation

`TinyMapCache` is a lightweight, event-driven, in-memory cache manager designed for JavaScript environments. It is optimized for preventing duplicate requests and managing temporary data with automatic expiration.

## 🌟 Key Features

*   🚀 **High Performance:** Uses an in-memory `Map` for near-instantaneous data retrieval.
*   ⏱️ **TTL (Time-To-Live):** Automatically handles data expiration based on a configurable millisecond timer.
*   🔔 **Event-Driven Architecture:** Extends `EventEmitter` to provide hooks for lifecycle changes (`set`, `delete`, `expire`, `purge`, `clear`).
*   🛡️ **Data Integrity:** Uses `structuredClone` to return deep copies of data, preventing accidental mutations of the cached items.
*   🧹 **Cascaded Purging:** Features a unique "Global Purge" capability that can trigger expiration checks across all active cache instances simultaneously.

---

## 🛠️ Getting Started

### Installation
Since this is an ES6 module, ensure your environment supports `import` syntax.

```javascript
import TinyMapCache from 'tiny-essentials/libs/router/TinyMapCache';
```

### Basic Initialization
```javascript
const cache = new TinyMapCache();

// Set a custom TTL (e.g., 10 seconds)
cache.ttl = 10000; 
```

---

## 📖 API Reference

### ⚙️ Configuration & Properties

| Property | Type | Description |
| :--- | :--- | :--- |
| `ttl` | `number` | The Time-To-Live in milliseconds. Default is `300000` (5 minutes). |
| `size` | `number` | Returns the current number of items stored in the cache. |
| `cache` | `Object` | Returns a deep-cloned plain object representation of the entire cache. |

### 🚀 Methods

#### `.set(key, data)`
Stores a value in the cache associated with a specific key.
*   **Key:** `string` (Required)
*   **Data:** `any` (Required)
*   **Note:** Triggers `purgeExpired(true)` before saving.

#### `.get(key)`
Retrieves the data associated with the key.
*   **Key:** `string` (Required)
*   **Returns:** The stored data if valid; `null` if expired or not found.
*   **Note:** Triggers `purgeExpired(true)` before retrieving.

#### `.has(key)`
Checks if a key exists and is valid (not expired).
*   **Key:** `string` (Required)
*   **Returns:** `boolean`
*   **Note:** Triggers `purgeExpired(true)` before checking.

#### `.delete(key)`
Removes a specific item from the cache.
*   **Key:** `string` (Required)
*   **Returns:** `boolean` (True if an element existed and was removed).

#### `.clear()`
Wipes all items from the current cache instance.

#### `.purgeExpired(clearAll = false)`
Manually triggers the expiration logic.
*   **`clearAll = true`**: Triggers a purge across **all** active `TinyMapCache` instances in the application.
*   **`clearAll = false`**: Only purges expired items in the current instance.

---

## 🔔 Event Listeners

The `TinyMapCache` emits several events that you can listen to for advanced logic (like logging or synchronizing databases).

| Event | Payload Type | Description |
| :--- | :--- | :--- |
| `'set'` | `{ key: string, data: T }` | Emitted when a new item is successfully stored. |
| `'delete'` | `{ key: string }` | Emitted when an item is manually removed. |
| `'expire'` | `{ key: string, data: T }` | Emitted when an item is removed due to TTL expiration. |
| `'purge'` | `{ count: number }` | Emitted when multiple items are removed during a purge. |
| `'clear'` | `void` | Emitted when the entire cache is wiped. |

---

## 💡 Practical Implementation Examples

### 1. Basic Usage with TTL
This is the most common way to use the cache to avoid redundant API calls.

```javascript
const userCache = new TinyMapCache();
userCache.ttl = 60000; // 1 minute

async function getUserData(userId) {
  const cachedUser = userCache.get(userId);
  
  if (cachedUser) {
    console.log("📦 Serving from cache");
    return cachedUser;
  }

  console.log("🌐 Fetching from API...");
  const data = await fetchFromDatabase(userId); // Simulated API call
  userCache.set(userId, data);
  return data;
}
```

### 2. Using Events for Monitoring
You can use events to track how much data is expiring in your system.

```javascript
const monitorCache = new TinyMapCache();

monitorCache.on('expire', (payload) => {
  console.warn(`⚠️ Item expired: ${payload.key}`);
});

monitorCache.on('purge', (payload) => {
  console.log(`🧹 Cleanup complete. Removed ${payload.count} items.`);
});
```

### 3. Advanced: Cascaded Purging
If your application creates many cache instances (e.g., one per user session), you can clear them all at once to free up memory.

```javascript
const sessionCache1 = new TinyMapCache();
const sessionCache2 = new TinyMapCache();

sessionCache1.set('session_id', 123);
sessionCache2.set('session_id', 456);

// This will trigger purgeExpired(false) on sessionCache2
sessionCache1.purgeExpired(true); 
```

---

## ⚠️ Important Technical Notes

1.  **Automatic Cleanup:** Most methods (`get`, `set`, `has`, `delete`) automatically call `purgeExpired(true)`. This ensures you are always working with fresh data, but be aware that in very large caches, this adds a small overhead to every call.
2.  **Memory Management:** When a `TinyMapCache` instance becomes empty (size 0), it automatically removes itself from the internal `#instances` set to prevent memory leaks.
3.  **Data Safety:** Because we use `structuredClone`, if you store an object in the cache and later modify that object in your main code, the version inside the cache **will not change**. This is a safety feature to prevent "side-effect" bugs.
