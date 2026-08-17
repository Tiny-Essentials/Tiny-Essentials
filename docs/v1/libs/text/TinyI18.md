# TinyI18 Documentation 📚✨

## Class: `TinyI18` 🏷️

Professional and flexible i18n manager with dual mode (local/file), regex-based keys, and function-based entries for advanced rendering.

* **Mode `"local"`**: in-memory resources (Node + Browser).
* **Mode `"file"`**: JSON files on disk via fs/path (Node only).
* Keeps only default + selected locale in memory.
* Selected locale overrides default; fallback resolves to default.
* Supports string entries, regex pattern entries, and function-backed entries.
* Safe: no dynamic code eval from files; functions in file mode are referenced by name (`$fn`).

---

### Static Methods ⚡

#### `mergeLocaleFiles({ files, output, spaces = 0 })` 🔗

Merges multiple JSON locale files into a single file for TinyI18 usage (file mode only).

**Parameters:**

| Name     | Type       | Description                                                                  |
| -------- | ---------- | ---------------------------------------------------------------------------- |
| `files`  | `string[]` | List of JSON file paths to merge.                                            |
| `output` | `string`   | Path where the merged JSON file will be written.                             |
| `spaces` | `number`   | Optional. Number of spaces for indentation in the output JSON (default `0`). |

**Throws:**

* `TypeError` → if arguments are invalid.
* `Error` → if file reading or writing fails.

**Example Usage:**

```js
await TinyI18.mergeLocaleFiles({
  files: ['./en.json', './pt.json'],
  output: './merged.json',
  spaces: 2,
});
```

---

### Properties 🛠️

#### `currentLocale` 🔹

The currently selected locale, or `null` if only the default locale is active.

* **Type:** `LocaleCode | null`

---

#### `defaultLocale` 🔹

The default locale code chosen at construction. Always kept in memory as a fallback.

* **Type:** `LocaleCode`

---

#### `mode` 🔹

The current operating mode of this instance:

* `"local"` → all translations managed in memory.

* `"file"` → translations loaded from JSON files.

* **Type:** `ModeTypes`

---

#### `strict` 🔹

Whether strict mode is enabled.

* `true` → Missing keys, invalid regex, or helper errors throw exceptions.

* `false` → Failures are ignored silently, returning fallback values.

* **Type:** `boolean`

---

#### `basePath` 🔹

Base directory path used in `"file"` mode to locate locale JSON files.

* `"local"` mode → always `null`

* `"file"` mode → root folder passed to the constructor

* **Type:** `string | null`

---

#### `stats` 📊

Returns basic stats for debugging/memory insights.

* **Type:** `StatLocale[]`
* **Example:**

```js
console.log(i18.stats);
// [
//   { locale: 'en', strings: 12, patterns: 2, isDefault: true, isCurrent: false },
//   { locale: 'pt', strings: 10, patterns: 1, isDefault: false, isCurrent: true },
// ]
```

---

#### `stringTables` 🔹

Deep-cloned view of string tables (Map → Object). Preserves strings, `$fn` objects, and functions.

* **Type:** `Record<string, Dict>`

---

#### `patternTables` 🔹

Deep-cloned view of regex pattern tables (Map → Object). Recreates `RegExp` objects to avoid mutation.

* **Type:** `Record<string, PatternEntry[]>`

---

#### `helpers` 🔹

Deep-cloned view of registered helper functions (Map → Object). Functions are referenced (cannot deep-clone functions).

* **Type:** `Record<string, HelperCallback>`

---

#### `regexCache` 🔹

Deep-cloned view of compiled regex cache (Map → Object). Recreates `RegExp` objects to avoid mutation.

* **Type:** `Record<string, RegExp>`

---

✅ **Note:** All private internal maps are accessible via these getters as **read-only snapshots** to safely inspect memory without affecting runtime behavior.

---

## Internal Utilities & Resolution 🔧

### `#deepClone(value)` 🌀

Deep clones a value for internal use.

* Strings, numbers, and functions → returned as-is
* Objects/arrays → recursively cloned
* `RegExp` → cloned

**Parameters:**

| Name    | Type  | Description         |
| ------- | ----- | ------------------- |
| `value` | `any` | Value to deep clone |

**Returns:** `any` – cloned value

---

### `#resolveOrder(forceLocale)` 🔄

Determines the resolution order of locales for key lookup.

**Parameters:**

| Name          | Type     | Description                              |
| ------------- | -------- | ---------------------------------------- |
| `forceLocale` | `string` | Optional locale code to prioritize first |

**Returns:** `string[]` – Ordered list of locale codes to try

---

### `#resolveExact(order, key)` 🎯

Resolves a key exactly in the provided locale order.

**Parameters:**

| Name    | Type       | Description                    |
| ------- | ---------- | ------------------------------ |
| `order` | `string[]` | Array of locale codes to check |
| `key`   | `string`   | Exact key to look up           |

**Returns:** `any` – Found value, or `undefined` if not found

---

### `#resolveByPattern(order, key)` 🔍

Resolves a key by matching regex patterns in locale tables.

**Parameters:**

| Name    | Type       | Description                               |
| ------- | ---------- | ----------------------------------------- |
| `order` | `string[]` | Array of locale codes in resolution order |
| `key`   | `string`   | Key to match against patterns             |

**Returns:** `any` – Value associated with matched pattern, or `undefined`

---

### `#materialize(value, params)` 🏗️

Converts a raw translation entry into a final string for display.

**Value can be:**

* String
* Function `(params, helpers) => any`
* `{ $fn: string, args?: any }` (file mode placeholder)

**Parameters:**

| Name     | Type     | Description                           |                                |                       |
| -------- | -------- | ------------------------------------- | ------------------------------ | --------------------- |
| `value`  | `string` | HelperCallback                        | { \$fn: string; args?: any }\` | Raw translation entry |
| `params` | `Dict`   | Optional parameters for interpolation |                                |                       |

**Returns:** `string` – Materialized result

---

### `#interpolate(template, params)` ✏️

Interpolates `{named}` placeholders in a string using given parameters.

**Parameters:**

| Name       | Type     | Description                       |
| ---------- | -------- | --------------------------------- |
| `template` | `string` | Template string with placeholders |
| `params`   | `Dict`   | Values to interpolate             |

**Returns:** `string` – Interpolated string

---

### `#dotGet(obj, path)` 📌

Safely retrieves a nested property using dot notation.

**Parameters:**

| Name   | Type     | Description                          |
| ------ | -------- | ------------------------------------ |
| `obj`  | `Dict`   | Object to retrieve from              |
| `path` | `string` | Dot-separated path (e.g., `"a.b.c"`) |

**Returns:** `any` – Value at path or `undefined`

---

### `#helpersReadonly()` 🛡️

Provides a read-only facade for safely accessing registered helpers.

**Returns:** `HelpersReadonly<any, any>` – Safe helper access with:

* `has(name)` → check if helper exists
* `call(name, arg, extras)` → invoke helper safely

---

## Internal Locale Ingestion 🌐

### `#ingestLocale(locale, raw)` 📥

Flattens and registers raw locale data into internal string & pattern tables.

**Parameters:**

| Name     | Type     | Description                 |
| -------- | -------- | --------------------------- |
| `locale` | `string` | Locale code                 |
| `raw`    | `Dict`   | Raw locale object to ingest |

---

### `#unloadLocale(locale)` ❌

Removes a previously loaded locale from memory (except default).

**Parameters:**

| Name     | Type     | Description           |
| -------- | -------- | --------------------- |
| `locale` | `string` | Locale code to unload |

---

## File Mode Loading 📂

### `#loadLocaleFromFile(locale)` 📄

Loads a locale JSON file and flattens it into internal maps (file mode only).

**Behavior:**

* Dot-flattens nested keys
* Compiles `$pattern` entries into RegExp
* Preserves `$fn` placeholders for helper resolution

**Parameters:**

| Name     | Type         | Description         |
| -------- | ------------ | ------------------- |
| `locale` | `LocaleCode` | Locale code to load |

**Returns:** `Promise<void>`

---

### `#safeRegExp(src)` 🧵

Returns a cached `RegExp` from source, compiling if needed.
Strict mode → throws on invalid regex; otherwise returns a never-matching regex.

**Parameters:**

| Name  | Type     | Description                    |
| ----- | -------- | ------------------------------ |
| `src` | `string` | Regex source string (no flags) |

**Returns:** `RegExp`

---

### `#coerceFileValue(v)` ⚙️

Normalizes a JSON value from file mode into internal representation.

* `string` → returned as-is
* `{ $fn: string, args?: any }` → preserved for helper resolution

**Parameters:**

| Name | Type     | Description |                |
| ---- | -------- | ----------- | -------------- |
| `v`  | \`string | FileValue\` | Raw JSON value |

**Returns:** `string | { $fn: string, args?: any }`

---

## Constructor & External API 🏗️

### `constructor(options)` ⚙️

Creates a new TinyI18 instance for managing localized strings and patterns.

**Modes Supported:**

* `"local"` → loads translations from provided objects
* `"file"` → loads translations from JSON files on demand

**Notes:**

* Ensures default locale is always initialized
* `basePath` is required in `"file"` mode

**Parameters:**

| Name      | Type             | Description          |
| --------- | ---------------- | -------------------- |
| `options` | `TinyI18Options` | Configuration object |

---

### `clearRegexCache()` 🧹

Clears the internal regex cache.

* Avoids recompiling frequently used patterns
* Always managed via API, not direct access

**Returns:** `void`

---

### `registerHelper(name, fn)` 🛠️

Registers a helper function for function-based entries or `$fn` references.

**Parameters:**

| Name   | Type             | Description          |
| ------ | ---------------- | -------------------- |
| `name` | `string`         | Helper function name |
| `fn`   | `HelperCallback` | Callback function    |

---

### `unregisterHelper(name)` ❌

Removes a previously registered helper function.

**Parameters:**

| Name   | Type     | Description              |
| ------ | -------- | ------------------------ |
| `name` | `string` | Name of helper to remove |

**Returns:** `boolean` – `true` if removed, `false` if not found

---

### `loadLocaleLocal(locale, data)` 📦

Loads or updates locale data in-memory (local mode only).

**Parameters:**

| Name     | Type         | Description      |
| -------- | ------------ | ---------------- |
| `locale` | `LocaleCode` | Locale code      |
| `data`   | `Dict`       | Translation data |

---

### `setLocale(locale)` 🌐

Sets the currently selected locale. In file mode, loads from disk.

* Keeps only default + selected locale in memory
* Unloads previous selected locale

**Parameters:**

| Name     | Type         | Description |                                             |
| -------- | ------------ | ----------- | ------------------------------------------- |
| `locale` | \`LocaleCode | null\`      | Locale code, or `null` to keep only default |

**Returns:** `Promise<void>`

---

### `t(key, params, options)` 🎯

Resolves a translation by **exact key**.

**Resolution order:** Current locale → Default locale

**Parameters:**

| Name      | Type             | Description                                      |
| --------- | ---------------- | ------------------------------------------------ |
| `key`     | `string`         | Translation key (dot.notation)                   |
| `params`  | `Dict`           | Optional parameters for interpolation or helpers |
| `options` | `ResolveOptions` | Optional resolution overrides                    |

**Returns:** `any` – Usually `string`, but may be HTMLElement, DocumentFragment, or helper return type

**Alias:** `get(key, params, options)`

---

### `p(key, options)` 🔍

Resolves a translation by **regex pattern match**.

* Returns first matching entry if multiple patterns exist

**Parameters:**

| Name      | Type             | Description                            |
| --------- | ---------------- | -------------------------------------- |
| `key`     | `string`         | Input string to match against patterns |
| `options` | `ResolveOptions` | Optional resolution overrides          |

**Returns:** `any` – Translation value

**Alias:** `resolveByPattern(key, options)`

---

### `resetToDefaultOnly()` 🏠

Clears all loaded locales except the default.

* Selected locale becomes `null`
* In file mode, non-default locales are unloaded

**Returns:** `void`

---

### `getStatsForLocale(locale)` 📊

Returns statistics for a specific locale.

**Parameters:**

| Name     | Type         | Description            |
| -------- | ------------ | ---------------------- |
| `locale` | `LocaleCode` | Locale code to inspect |

**Returns:** `StatLocale` – Locale stats including number of strings, patterns, and flags

**Throws:** Error if locale is not registered
