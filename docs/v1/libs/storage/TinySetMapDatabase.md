# 🗃️ TinySetMapDatabase

> Persistent `Set` and `Map` collections backed by **IndexedDB** — with a tiny, promise-based API.

`TinySetMapDatabase` gives you two familiar data structures (`Set` and `Map`) that survive page reloads, service-worker restarts, and browser sessions. You get the ergonomics of the standard collections, plus a migration system that keeps your schema under control.

---

## 📖 Table of Contents

1. [✨ Why TinySetMapDatabase?](#-why-tinysetmapdatabase)
2. [📦 Requirements](#-requirements)
3. [🚀 Quick Start](#-quick-start)
4. [🧠 Core Concepts](#-core-concepts)
5. [🏗️ API Reference](#️-api-reference)
   - [`TinySetMapDatabase`](#tinysetmapdatabase)
   - [`TinySetDb`](#tinysetdb)
   - [`TinyMapDb](#tinymapdb)
   - [`TinyTableDb` (base class)](#tinytabledb-base-class)
6. [🧩 Migrations](#-migrations)
7. [✅ Validators](#-validators)
8. [🍳 Recipes](#-recipes)
9. [🛠️ Service Worker Notes](#️-service-worker-notes)
10. [🐛 Error Reference](#-error-reference)
11. [❓ FAQ](#-faq)

---

## ✨ Why TinySetMapDatabase?

- 🔒 **Persistent** — Data lives in IndexedDB, so it survives reloads and restarts.
- 🧩 **Familiar API** — `add`, `get`, `set`, `delete`, `has`, `forEach`, `for await...of`.
- ⚡ **Synchronous reads, async writes** — An in-memory cache makes reads instant.
- 🧱 **Schema migrations built in** — Version your database with a plain array.
- 🧵 **Serialized writes** — Every write goes through a queue, so you never corrupt your store.

---

## 📦 Requirements

- A runtime with **IndexedDB** (browsers, Web Workers, Service Workers).
- **ES2022+** (private class fields, `??=`, async generators).

---

## 🚀 Quick Start

```js
import { TinySetMapDatabase } from 'tiny-essentials/libs/storage/TinySetMapDatabase';

// 1. Describe your schema as a list of migrations.
const migrations = [
  {
    create: [
      'visited-pages', // shorthand: a Set of strings
      { name: 'settings', type: 'map' }, // a Map of string -> any
    ],
  },
];

// 2. Open the database.
const db = new TinySetMapDatabase('my-app', migrations);

// 3. Wait until every table is hydrated.
await db.ready;

// 4. Use your tables.
const pages = db.tableSet('visited-pages');
await pages.add('/home');
await pages.add('/about');

const settings = db.tableMap('settings');
await settings.set('theme', 'dark');

console.log(await pages.toArray()); // ['/home', '/about']
console.log(await settings.get('theme')); // 'dark'
```

---

## 🧠 Core Concepts

| Concept | What it means |
| --- | --- |
| **Table** | A single IndexedDB object store. It is either a `Set` or a `Map`. |
| **Migration** | One entry in the migrations array. Its position defines its version (1-based). |
| **Hydration** | The one-time process of loading every persisted record into memory. |
| **Cache** | An in-memory `Set` or `Map` that mirrors the store for fast reads. |
| **Write queue** | A `TinyPromiseQueue` that serializes all writes to the object store. |
| **Action queue** | A `TinyPromiseQueue` that serializes all cache mutations. |

> 💡 **Rule of thumb:** reads hit the cache, writes go through the queue and reach IndexedDB.

---

## 🏗️ API Reference

### `TinySetMapDatabase`

The entry point. It owns the IndexedDB connection and every table.

#### `new TinySetMapDatabase(name, migrations)`

| Parameter | Type | Description |
| --- | --- | --- |
| `name` | `string` | Name of the IndexedDB database. |
| `migrations` | `TinyDatabaseMigration[]` | Ordered schema history. Length = database version. |

**Throws**

- `TypeError` — if `name` is not a non-empty string.
- `TypeError` — if `migrations` is not a non-empty array.
- `TypeError` — if a migration is invalid.
- `Error` — if a table is created twice without being dropped in between.

---

#### `db.name` → `string`

The database name.

#### `db.version` → `number`

The current schema version (equal to `migrations.length`).

#### `db.tableNames` → `string[]`

Every table name declared by the migrations.

#### `db.ready` → `Promise<void>`

Resolves once the connection is open **and** every table is hydrated.

```js
await db.ready;
```

#### `db.tableSet(name)` → `TinySetDb`

Returns a `Set`-like table.

- **Throws** `TypeError` if `name` is not a non-empty string.
- **Throws** `RangeError` if the table was not declared.
- **Throws** `Error` if the table is not a Set.

#### `db.tableMap(name)` → `TinyMapDb`

Returns a `Map`-like table.

- **Throws** `TypeError` if `name` is not a non-empty string.
- **Throws** `RangeError` if the table was not declared.
- **Throws** `Error` if the table is not a Map.

#### `db.has(name)` → `boolean`

Returns `true` when the table exists.

#### `await db.close()`

Closes the underlying IndexedDB connection.

---

### `TinySetDb`

A persistent `Set<Value>`. Every value must be a non-empty string (an `IDBValidKey`).

#### `new TinySetDb({ storeName, openDatabase, validate? })`

| Option | Type | Description |
| --- | --- | --- |
| `storeName` | `string` | Name of the object store. |
| `openDatabase` | `() => Promise<IDBDatabase>` | Resolves with the shared connection. |
| `validate` | `(value) => boolean \| null` | Optional predicate. Return `false` to reject. |

#### `set.size` → `number`

Number of values in the in-memory cache.

#### `await set.has(value)` → `boolean`

Checks whether `value` is stored.

#### `await set.add(value)` → `boolean`

Adds a value. Returns `true` when it was added, `false` when it already existed.

#### `await set.delete(value)` → `boolean`

Removes a value. Returns `true` when it existed.

#### `await set.clear()` → `void`

Removes every value from both the cache and the store.

#### `await set.toArray()` → `Value[]`

Returns a snapshot array.

#### `await set.toJSON()` → `Value[]`

Serialization hook used by `JSON.stringify`.

#### `set.values()` / `set.keys()` → `AsyncGenerator<Value>`

Iterates over every value.

#### `set.entries()` → `AsyncGenerator<[Value, Value]>`

Iterates over `[value, value]` pairs (mirrors `Set.prototype.entries`).

#### `set[Symbol.asyncIterator]()`

Alias for `values()`, so you can use `for await...of`.

#### `await set.forEach(callbackFn, thisArg?)`

Runs `callbackFn(value, value, set)` for every value.

#### Set algebra

All of these return a **new native `Set`** and accept a `TinySetDb`, a native `Set`, or an array.

| Method | Description |
| --- | --- |
| `union(...sources)` | Values in this set **or** in any source. |
| `intersection(other)` | Values in both. |
| `difference(other)` | Values in this set but not in `other`. |
| `symmetricDifference(other)` | Values in exactly one of the two. |
| `isSubsetOf(other)` | `true` when every value here exists in `other`. |
| `isSupersetOf(other)` | `true` when every value of `other` exists here. |
| `isDisjointFrom(other)` | `true` when they share no values. |

```js
const a = new Set(['apple', 'banana']);
const b = new Set(['banana', 'cherry']);

await set.union(a, b);              // Set { 'apple', 'banana', 'cherry' }
await set.intersection(a);          // Set { 'banana' }
await set.difference(a);            // Set { 'cherry' }
await set.symmetricDifference(a);   // Set { 'apple', 'cherry' }
await set.isSubsetOf(a);            // false
await set.isDisjointFrom(a);        // false
```

---

### `TinyMapDb`

A persistent `Map<Key, Value>`. Keys must be non-empty strings.

#### `new TinyMapDb({ storeName, openDatabase, validate? })`

Same options as `TinySetDb`, but `validate` receives `(key, value)`.

#### `map.size` → `number`

Number of entries in the in-memory cache.

#### `await map.has(key)` → `boolean`

#### `await map.get(key)` → `Value | undefined`

#### `await map.set(key, value)` → `this`

Binds a value to a key. Returns the map, so you can chain.

#### `await map.delete(key)` → `boolean`

#### `await map.clear()` → `void`

#### `await map.toArray()` → `Array<[Key, Value]>`

#### `await map.toJSON()` → `Array<[Key, Value]>`

#### `map.keys()` / `map.values()` / `map.entries()`

Async generators.

#### `map[Symbol.asyncIterator]()`

Alias for `entries()`.

#### `await map.forEach(callbackFn, thisArg?)`

Runs `callbackFn(value, key, map)` for every entry.

---

### `TinyTableDb` (base class)

You normally do **not** instantiate this class directly. It is the shared plumbing for `TinySetDb` and `TinyMapDb`.

If you want to build your own table type, extend it and implement `_load(records)`.

| Member | Description |
| --- | --- |
| `get storeName()` | Name of the object store. |
| `get isReady()` | `true` after hydration. |
| `hydrate()` | Loads the cache once. Safe to call many times. |
| `_action(operation)` | Runs an operation with exclusive access to the cache. |
| `_write(operation)` | Runs an operation with exclusive access to the store. |
| `_persist(record)` | Persists a single record. |
| `_remove(key)` | Deletes a single record. |
| `_clear()` | Deletes every record. |
| `_load(records)` | **Abstract.** Must be implemented by subclasses. |

---

## 🧩 Migrations

A migration is a plain object:

```ts
type TinyDatabaseMigration = {
  create?: (string | {
    name: string;
    type: 'set' | 'map';
    validate?: (key: any, value?: any) => boolean;
  })[];
  delete?: string[];
};
```

- The **version** of a migration is its **1-based index** in the array.
- The **database version** is `migrations.length`.
- To change a table's key path, `delete` it and `create` it again in the same migration.

### Example: adding a table in v2

```js
const migrations = [
  // v1
  { create: ['visited-pages'] },

  // v2 — add a settings map
  {
    create: [{ name: 'settings', type: 'map' }],
  },

  // v3 — drop a table and recreate it as a map
  {
    delete: ['visited-pages'],
    create: [{ name: 'visited-pages', type: 'map' }],
  },
];
```

> ⚠️ **Never reorder or remove migrations.** Their position *is* the version number. Appending is the only safe operation.

---

## ✅ Validators

A validator is a predicate that runs **before** a write reaches the store. Return a falsy value to reject the write with a `TypeError`.

```js
const migrations = [
  {
    create: [
      {
        name: 'emails',
        type: 'set',
        validate: (value) => value.includes('@'),
      },
      {
        name: 'users',
        type: 'map',
        validate: (key, value) => typeof value === 'object' && value !== null,
      },
    ],
  },
];

const db = new TinySetMapDatabase('app', migrations);
const emails = db.tableSet('emails');

await emails.add('not-an-email'); // ❌ TypeError
await emails.add('me@example.com'); // ✅
```

> 💡 The validator that wins is the one from the **latest migration that creates the table**.

---

## 🍳 Recipes

### 🔁 Iterate over a set

```js
for await (const page of db.tableSet('visited-pages')) {
  console.log(page);
}
```

### 📦 Serialize a table

```js
const json = JSON.stringify(await db.tableMap('settings'));
```

### 🧹 Wipe a table

```js
await db.tableSet('visited-pages').clear();
```

### 🔍 Check before writing

```js
const pages = db.tableSet('visited-pages');
if (!(await pages.has('/home'))) {
  await pages.add('/home');
}
```

### 🧮 Set algebra across tables

```js
const a = db.tableSet('a');
const b = db.tableSet('b');

const common = await a.intersection(b);
console.log(`Shared values: ${[...common].join(', ')}`);
```

---

## 🛠️ Service Worker Notes

`TinySetMapDatabase` is designed to be created **once** per service worker lifetime:

```js
let database;

self.addEventListener('install', () => {
  database = new TinySetMapDatabase('my-app', migrations);
});

self.addEventListener('activate', (event) => {
  event.waitUntil(database.ready);
});
```

- The connection is opened lazily and reused.
- `onversionchange` closes the connection automatically, so a new tab can upgrade the schema.
- Every write is queued, so concurrent `add`/`set` calls are safe.

---

## 🐛 Error Reference

| Error | When it happens |
| --- | --- |
| `TypeError` | A string argument is empty, a validator rejects a value, or an option has the wrong type. |
| `RangeError` | You asked for a table that was never declared. |
| `ReferenceError` | `indexedDB` is not available in the current environment. |
| `Error` | A table is created twice, or a table has the wrong type. |

---

## ❓ FAQ

**Does it work outside the browser?**
Only where `indexedDB` exists. In Node.js, provide a shim such as `fake-indexeddb`.

**Are reads async?**
Yes, all public methods return a `Promise`. The cache makes them fast, not synchronous.

**Can I use non-string keys?**
No. Keys must be non-empty strings, because they are used as the object store key path.

**What happens if I forget to `await db.ready`?**
Every method calls `hydrate()` internally, so it is safe — but awaiting `db.ready` once at startup avoids a small delay on the first call.

**Can I have two databases with the same name?**
Yes, but they will share the same IndexedDB database. Use different names for isolation.

