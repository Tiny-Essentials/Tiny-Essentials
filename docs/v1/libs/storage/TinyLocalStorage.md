# 📦 TinyLocalStorage

Tiny wrapper for `localStorage` with full support for complex structures like `Map`, `Set`, `Date`, `RegExp`, `BigInt`, and even custom types. Offers a type-safe interface and a powerful event system.

---

## 🚀 Quick Start

```js
const storage = new TinyLocalStorage();

storage.setString('name', 'Yasmin');
storage.setNumber('age', 25);
storage.setBool('likesCats', true);
storage.setJson('myMap', new Map([['a', 1], ['b', 2]]));
storage.setDate('today', new Date());

console.log(storage.getString('name')); // "Yasmin"
console.log(storage.getJson('myMap')); // Map { 'a' => 1, 'b' => 2 }
console.log(storage.getDate('today') instanceof Date); // true
```

---

## 🧠 Features

* ✅ Store & restore `Map`, `Set`, `Date`, `RegExp`, `BigInt`, `Symbol`, `null`, `undefined`.
* ✅ Custom type encoding and decoding system.
* ✅ Type-safe methods for string, number and boolean.
* ✅ Built-in event system with optional native `storage` listener.
* ✅ Optional fallback when decoding fails.

---

## 🏁 `constructor(dbName?: string)`

Initializes the `TinyLocalStorage` instance and sets up cross-tab synchronization.

### 🔧 Parameters

* `dbName` (optional, `string`) – A unique name for the database. It becomes the base key used internally in `localStorage`.

### 📡 Behavior

* Automatically adds a `storage` event listener to support syncing across browser tabs.

---

## 🔁 `updateStorageVersion(version: number, onUpgrade: (oldVersion: number, newVersion: number) => void)`

Updates the version of the database. If the new version is higher than the current one, it triggers the provided migration callback.

### 🔧 Parameters

* `version` (`number`) – The desired new version of the database. Must be a positive integer.
* `onUpgrade` (`function`) – A callback function executed during upgrade. Receives `oldVersion` and `newVersion` as arguments.

### ⚠️ Throws

* `Error` – If the database key hasn't been initialized via the constructor.
* `TypeError` – If `version` is invalid (not a number, NaN, or < 1).
* `TypeError` – If `onUpgrade` is not a function.
* `TypeError` – If the saved version in `localStorage` is invalid.
* `Error` – If the provided `version` is lower than the stored version (downgrade is not supported).

---

## 🔑 `getDbKey(): string | null`

Returns the current internal database key used in `localStorage`.

### 🔙 Returns

* `string | null` – The full storage key prefix (e.g. `LSDB::yourDbName`), or `null` if uninitialized.

---

## 🧮 `getVersion(): number`

Returns the current active version of the storage system.

### 🔙 Returns

* `number` – The version number currently in use.

---

## 📦 Storage Methods

### `setJson(key, data)`

Stores any supported JSON-like structure, including `Map`, `Set`, `Date`, `RegExp`, `BigInt`, etc.

```ts
setJson(name: string, data: LocalStorageJsonValue): void
```

### `getJson(key, fallback?)`

Retrieves and decodes the previously stored structure. Optional fallback allows recovery on decode failure.

```ts
getJson(
  name: string,
  defaultData?: 'array' | 'obj' | 'map' | 'set' | 'null'
): LocalStorageJsonValue | null
```

---

### `setItem(key, rawString)`

Stores a raw `string` value as-is.

```ts
setItem(name: string, data: string): void
```

### `getItem(key)`

Retrieves a raw `string` value.

```ts
getItem(name: string): string | null
```

---

### `setString(key, string)`

Stores a `string` value.

```ts
setString(name: string, data: string): void
```

### `getString(key)`

Retrieves a `string` value.

```ts
getString(name: string): string | null
```

---

### `setNumber(key, number)`

Stores a `number` value.

```ts
setNumber(name: string, data: number): void
```

### `getNumber(key)`

Retrieves a `number` value.

```ts
getNumber(name: string): number | null
```

---

### `setBool(key, boolean)`

Stores a `boolean` value.

```ts
setBool(name: string, data: boolean): void
```

### `getBool(key)`

Retrieves a `boolean` value.

```ts
getBool(name: string): boolean | null
```

---

### `setDate(key, date)`

Stores a `Date` object.

```ts
setDate(name: string, data: Date): void
```

### `getDate(key)`

Retrieves a `Date` object.

```ts
getDate(name: string): Date | null
```

---

### `setRegExp(key, pattern)`

Stores a `RegExp` object.

```ts
setRegExp(name: string, data: RegExp): void
```

### `getRegExp(key)`

Retrieves a `RegExp` object.

```ts
getRegExp(name: string): RegExp | null
```

---

### `setBigInt(key, value)`

Stores a `BigInt` value.

```ts
setBigInt(name: string, data: bigint): void
```

### `getBigInt(key)`

Retrieves a `BigInt` value.

```ts
getBigInt(name: string): bigint | null
```

---

### `setSymbol(key, value)`

Stores a `Symbol`. Only global symbols (`Symbol.for`) will preserve identity.

```ts
setSymbol(name: string, data: symbol): void
```

### `getSymbol(key)`

Retrieves a `Symbol` value.

```ts
getSymbol(name: string): symbol | null
```

---

### `getValue(key)`

Retrieves any previously stored value, regardless of type.

```ts
getValue(name: string): any | null
```

---

## ❌ Deletion Methods

### `removeItem(key)`

Removes a specific key from `localStorage`.

```ts
removeItem(name: string): void
```

### `clearLocalStorage()`

Clears all keys in the active storage.

---

## 🌐 Storage Configuration

### `setLocalStorage(storage)`

Switch between `localStorage` and `sessionStorage`.

```ts
setLocalStorage(storage: Storage): void
```

### `localStorageExists()`

Returns `true` if the browser supports the configured storage backend.

---

## 🧩 Custom Type Registration

### `registerJsonType(type, encodeFn, decodeFn, freezeType?)`

Registers support for custom types with encoder/decoder logic.

```ts
registerJsonType(
  type: any,
  encodeFn: (value: any, encodeSpecialJson: EncodeFn) => any,
  decodeFn: {
    check: (value: any) => boolean,
    decode: (value: any, decodeSpecialJson: DecodeFn) => any
  },
  freezeType?: boolean // default: false
): void
```

Registers a custom type by associating it with encoder and decoder logic. If `freezeType` is set to `true`, the type becomes immutable and cannot be unregistered or overwritten later.

> ⚠️ Throws an error if trying to register a type that is already frozen.

---

### `deleteJsonType(type)`

Unregisters a previously registered custom type.

```ts
deleteJsonType(type: any): boolean
```

Removes the encoder and decoder associated with the given type. Returns `true` if the type was found and removed, or `false` if it was not registered.

> ❌ Throws an error if the type was marked as frozen via `freezeType`.

---

### `hasJsonType(type)`

Checks whether a type is currently registered for custom encoding/decoding.

```ts
hasJsonType(type: any): boolean
```

Returns `true` if the type has both encoder and decoder registered, otherwise `false`.

---

## 🔥 Events

### Built-in Events

| Event Name     | Triggered When...                           |
| -------------- | ------------------------------------------- |
| `'setJson'`    | `.setJson()` is called                      |
| `'setItem'`    | `.setItem()` is called                      |
| `'setString'`  | `.setString()` is called                    |
| `'setNumber'`  | `.setNumber()` is called                    |
| `'setBool'`    | `.setBool()` is called                      |
| `'setSymbol'`  | `.setSymbol()` is called                    |
| `'setBigInt'`  | `.setBigInt()` is called                    |
| `'setRegExp'`  | `.setRegExp()` is called                    |
| `'setDate'`    | `.setDate()` is called                      |
| `'removeItem'` | `.removeItem()` is called                   |
| `'storage'`    | Browser's native `storage` event (optional) |

All events receive `{ key, value }` or `{ key }` depending on context.

---

## 🧹 Destroying

### `destroy()`

Cleans up listeners and internal event systems.

```ts
destroy(): void
```

---

## 🧪 Type Definition

```ts
type LocalStorageJsonValue =
  | Record<string | number | symbol, any>
  | any[]
  | Map<string | number | symbol, any>
  | Set<any>;
```

---

## 🔐 Internal Helpers

### `encodeSpecialJson(value)`

Recursively encodes supported complex types into serializable JSON-like structures.

### `decodeSpecialJson(value)`

Decodes those JSON-like structures back into `Map`, `Set`, `Date`, etc.

---

## 🧪 Example: Map, Set, Date, RegExp

```js
const map = new Map([['x', 123]]);
const set = new Set(['apple', 'banana']);
const date = new Date();
const regex = /hello/i;

storage.setJson('dataMap', map);
storage.setJson('dataSet', set);
storage.setDate('today', date);
storage.setRegExp('pattern', regex);

console.log(storage.getJson('dataMap') instanceof Map); // true
console.log(storage.getJson('dataSet') instanceof Set); // true
console.log(storage.getDate('today') instanceof Date); // true
console.log(storage.getRegExp('pattern') instanceof RegExp); // true
```
