# 🗄️ TinyFS Core

> A tiny, dependency-free, `node:fs/promises`-compatible file system core written in pure ESM JavaScript.

TinyFS Core is an **abstract base class**. It gives you a complete, promise-based file system
API surface — `readFile`, `writeFile`, `readdir`, `stat`, `chmod`, `rename`, and friends — while
delegating the actual byte storage to a backend you write.

The base class is **not a stub**. It ships with a working in-memory side table for permissions,
ownership and timestamps, so a backend only has to answer one question: *"where do the bytes
live?"*

---

## 📑 Table of Contents

1. [Features](#-features)
2. [Requirements](#-requirements)
3. [Project Layout](#-project-layout)
4. [Quick Start](#-quick-start)
5. [Core Concepts](#-core-concepts)
   - [The Metadata Side Table](#1--the-metadata-side-table)
   - [Protected Hooks](#2--protected-hooks)
   - [Capabilities](#3--capabilities)
   - [Identity and Permissions](#4--identity-and-permissions)
6. [API Reference](#-api-reference)
   - [Constructor](#constructor)
   - [Instance Getters](#instance-getters)
   - [Static Members](#static-members)
   - [File Operations](#-file-operations)
   - [Directory Operations](#-directory-operations)
   - [Metadata Operations](#-metadata-operations)
   - [Path Operations](#-path-operations)
   - [Handles](#-handles)
7. [Building a Backend](#-building-a-backend)
8. [Error Codes](#-error-codes)
9. [Known Divergences and Gotchas](#-known-divergences-and-gotchas)
10. [Cheatsheet](#-cheatsheet)

---

## ✨ Features

| Feature | Status |
| --- | --- |
| 🧩 Zero runtime dependencies | ✅ |
| 📦 Pure ESM (`import` / `export`) | ✅ |
| 🔒 Private class fields with getters | ✅ |
| 🧪 Trivially mockable | ✅ |
| 🪟 Windows-style path handling | ❌ POSIX only |
| 🔗 Symbolic links | ❌ Base class only |
| 🧵 Concurrent write safety | ❌ Backend's responsibility |

---

## 📋 Requirements

- **Node.js** `>= 18.0.0` (native ESM, private class fields, `Object.freeze` on statics).
- A module resolver that understands the `.mjs` extension.

---

## 📁 Project Layout

The core module imports from six sibling modules. Your tree should look like this:

```text
src/
├── index.mjs       # TinyFSCore — the abstract class
├── constants.mjs   # DEFAULT_FILE_MODE, DEFAULT_DIRECTORY_MODE, DEFAULT_UMASK, ROOT_PATH, constants
├── error.mjs       # assertPath, assertInteger, assertMode, assertOptionsObject,
│                   # assertEncoding, createFileSystemError
├── encoding.mjs    # decodeBytes, toUint8Array
├── stats.mjs       # Stats, Dirent
├── handle.mjs      # FileHandle
└── path.mjs        # toSegments
```

---

## 🚀 Quick Start

```javascript
import MemoryFileSystem from './memory-fs.mjs';

const fs = new MemoryFileSystem({ cwd: '/app' });

// Write and read text.
await fs.writeFile('/app/notes.txt', 'hello world', { encoding: 'utf8' });
const text = await fs.readFile('/app/notes.txt', { encoding: 'utf8' });

console.log(text); // "hello world"

// Inspect metadata.
const stats = await fs.stat('/app/notes.txt');
console.log(stats.size);
console.log(stats.mode.toString(8));

// Clean up.
await fs.rm('/app/notes.txt');
```

> 💡 The example above requires a backend. Jump to
> [Building a Backend](#-building-a-backend) for a complete, copy-pasteable implementation.

---

## 🧠 Core Concepts

### 1. 🗂️ The Metadata Side Table

Every `TinyFSCore` instance owns a private `Map`:

```javascript
#metadata = new Map(); // Map<string, FSMetadata>
```

This map stores `mode`, `uid`, `gid`, `atimeMs`, `mtimeMs` and `birthtimeMs` for each path.
**Your backend never touches it directly.** The public methods read and write it for you.

The shape of each record is:

```javascript
/**
 * @typedef {Object} FSMetadata
 * @property {number | null} mode
 * @property {number | null} uid
 * @property {number | null} gid
 * @property {number | null} atimeMs
 * @property {number | null} mtimeMs
 * @property {number | null} birthtimeMs
 */
```

A `null` field means *"not set"*. When `stat()` encounters a `null`, it substitutes a sensible
default based on the entry kind.

---

### 2 🔌 Protected Hooks

Methods prefixed with a single underscore are **hooks**. They are the contract between the core
and your backend. Every hook receives **raw, already-validated values** — no encoding, no
defaults, no metadata merging.

| Hook | Purpose |
| --- | --- |
| `_readFile(path)` | Return the raw bytes of a file. |
| `_writeFile(path, bytes, options)` | Persist bytes. Honour `options.append`. |
| `_readdir(path)` | Return `FSDirectoryEntry[]`. |
| `_mkdir(path, options)` | Create a directory. Honour `options.recursive`. |
| `_rm(path, options)` | Remove an entry. Honour `recursive` and `force`. |
| `_stat(path)` | Return an `FSStatDescriptor`, or `undefined` when missing. |
| `_rename(oldPath, newPath)` | Move an entry. |
| `_copyFile(source, destination, mode)` | Copy a file. |
| `_readMetadata(path)` | Read the side table. **Rarely overridden.** |
| `_writeMetadata(path, metadata)` | Write the side table. **Rarely overridden.** |

Every hook throws `ENOSYS` by default, so an unimplemented operation fails loudly instead of
silently corrupting data.

---

### 3. 🎚️ Capabilities

`capabilities` is a **static getter** that advertises what a backend supports. It is frozen, so
consumers can safely cache it.

```javascript
import TinyFSCore from 'tiny-essentials/libs/fs/TinyFSCore';

console.log(TinyFSCore.capabilities);
// {
//   permissions: false,
//   ownership: false,
//   symlinks: false,
//   timestamps: false,
//   atomicRename: false,
//   seekableHandles: false
// }
```

> ⚠️ Because it is `static`, read it from the **class**, not the instance:
> `MyBackend.capabilities`. Inside an instance method, use `this.constructor.capabilities`.

---

### 4. 🔐 Identity and Permissions

The constructor accepts an `FSIdentity`. The `access()` method uses it to decide which permission
triad applies:

| Condition | Triad | Bit shift |
| --- | --- | --- |
| `uid === identity.uid` | Owner | `>> 6` |
| `gid === identity.gid` or in `identity.groups` | Group | `>> 3` |
| Otherwise | Other | `>> 0` |

```javascript
const fs = new MemoryFileSystem({
  identity: { uid: 1000, gid: 1000, groups: [27, 100] },
});
```

---

## 📚 API Reference

### Constructor

```javascript
new TinyFSCore(options?)
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `options.cwd` | `string` | `ROOT_PATH` | Working directory used to resolve relative paths. |
| `options.umask` | `number` | `DEFAULT_UMASK` | Mask applied to `mode` on creation. |
| `options.identity` | `FSIdentity` | `{ uid: 0, gid: 0, groups: [] }` | Effective identity used by `access()`. |

```javascript
const fs = new MemoryFileSystem({
  cwd: '/srv/app',
  umask: 0o022,
  identity: { uid: 1000, gid: 1000, groups: [] },
});
```

---

### Instance Getters

```javascript
fs.cwd;      // string       — the configured working directory
fs.umask;    // number       — the configured umask
fs.identity; // FSIdentity  — the effective identity
```

---

### Static Members

```javascript
TinyFSCore.capabilities; // Readonly<FSCapabilities>
```

---

### 📄 File Operations

#### `readFile(path, options?)`

Reads the entire contents of a file.

| Parameter | Type | Description |
| --- | --- | --- |
| `path` | `string` | Absolute path of the file. |
| `options.encoding` | `string \| null` | When omitted or `null`, resolves to a `Uint8Array`. |

**Returns:** `Promise<string | Uint8Array>`

```javascript
const buffer = await fs.readFile('/data/blob.bin');         // Uint8Array
const text   = await fs.readFile('/data/notes.txt', { encoding: 'utf8' });
```

---

#### `writeFile(path, data, options?)`

Writes data to a file, replacing it when it already exists.

| Parameter | Type | Description |
| --- | --- | --- |
| `path` | `string` | Absolute path of the file. |
| `data` | `string \| Uint8Array \| ArrayBuffer` | Payload to persist. |
| `options.encoding` | `string \| null` | Used to serialise string input. |
| `options.append` | `boolean` | When `true`, appends instead of replacing. |
| `options.mode` | `number` | Permission bits applied **when the file is created**. |

**Returns:** `Promise<void>`

```javascript
await fs.writeFile('/logs/app.log', 'boot\n', { mode: 0o640 });
```

> ⚠️ Metadata is written **only when the file does not exist yet**. Overwriting an existing file
> preserves its original `mode`, `uid`, `gid` and `birthtimeMs`.

---

#### `appendFile(path, data, options?)`

Convenience wrapper around `writeFile` with `append: true`. Creates the file when missing.

```javascript
await fs.appendFile('/logs/app.log', 'request handled\n');
```

---

#### `copyFile(sourcePath, destinationPath, mode?)`

Copies a file and duplicates its metadata record.

```javascript
await fs.copyFile('/a.txt', '/b.txt');
```

> ⚠️ **Divergence:** the JSDoc advertises `number | TCopyFileOptions`, but the implementation
> only honours the `number` form. Passing an object silently resolves to `0`.

---

#### `truncate(path, length?)`

Resizes a file to `length` bytes. Shorter files are zero-padded; longer files are cut.

```javascript
await fs.truncate('/data.bin', 1024);
await fs.truncate('/data.bin'); // length defaults to 0
```

---

### 📁 Directory Operations

#### `readdir(path, options?)`

Reads directory entries.

| Option | Type | Description |
| --- | --- | --- |
| `options.withFileTypes` | `boolean` | When `true`, resolves to `Dirent[]`. |
| `options.recursive` | `boolean` | When `true`, walks sub-directories depth-first. |

**Returns:** `Promise<Array<string | Dirent>>`

```javascript
const names = await fs.readdir('/src');
const dirents = await fs.readdir('/src', { withFileTypes: true });
const tree = await fs.readdir('/src', { recursive: true });
```

> ⚠️ **Divergence:** in recursive mode, nested entries are always reported with the kind
> `'file'`, even when they are directories.

---

#### `mkdir(path, options?)`

Creates a directory.

| Option | Type | Description |
| --- | --- | --- |
| `options.recursive` | `boolean` | When `true`, missing parents are created. |
| `options.mode` | `number` | Permission bits for the new directory. |

**Returns:** `Promise<string | undefined>` — the created path when `recursive` is `true`.

```javascript
await fs.mkdir('/var/lib/app', { recursive: true, mode: 0o755 });
```

---

#### `rm(path, options?)`

Removes a file, or a directory tree when `recursive` is `true`.

| Option | Type | Description |
| --- | --- | --- |
| `options.recursive` | `boolean` | Removes directories and their contents. |
| `options.force` | `boolean` | When `true`, a missing path is not an error. |

```javascript
await fs.rm('/tmp/cache', { recursive: true, force: true });
```

---

#### `unlink(path)`

Removes a file. Throws `EISDIR` when the path is a directory.

```javascript
await fs.unlink('/tmp/old.log');
```

---

#### `rmdir(path, options?)`

Removes a directory. Forwards to `rm()`.

```javascript
await fs.rmdir('/tmp/empty');
```

---

#### `rename(oldPath, newPath)`

Moves an entry and carries its metadata record across.

```javascript
await fs.rename('/tmp/draft.md', '/docs/final.md');
```

---

### 🏷️ Metadata Operations

#### `stat(path, options?)`

Retrieves a `Stats` snapshot. Throws `ENOENT` when the path is missing.

```javascript
const stats = await fs.stat('/etc/hosts');
console.log(stats.size, stats.mode.toString(8));
```

---

#### `lstat(path, options?)`

Alias of `stat()`. The base class has no symbolic links, so both behave identically.

---

#### `chmod(path, mode)`

Changes the permission bits.

```javascript
await fs.chmod('/usr/local/bin/tool', 0o755);
```

---

#### `chown(path, uid, gid?)`

Changes ownership. `gid` defaults to `uid`.

```javascript
await fs.chown('/var/www', 33, 33);
```

---

#### `utimes(path, atimeMs, mtimeMs?)`

Updates the access and modification times. `mtimeMs` defaults to `atimeMs`.

```javascript
await fs.utimes('/var/log/app.log', Date.now(), Date.now());
```

---

#### `access(path, mode?)`

Checks whether a path is reachable with the requested permission.

| Constant | Meaning |
| --- | --- |
| `constants.F_OK` | Existence only (default). |
| `constants.R_OK` | Read permission. |
| `constants.W_OK` | Write permission. |
| `constants.X_OK` | Execute permission. |

**Throws:** `Error` with `code: 'EACCES'` when the permission is missing.

```javascript
try {
  await fs.access('/etc/shadow', constants.R_OK);
} catch (error) {
  console.error(error.code); // "EACCES"
}
```

> ⚠️ **Divergence:** `chmod`, `chown` and `utimes` do **not** verify that the path exists.
> They will happily create an orphan metadata record. Call `stat()` first if that matters.

---

### 🛣️ Path Operations

#### `realpath(path)`

Resolves the canonical absolute path. Throws `ENOENT` when the path is missing.

```javascript
await fs.realpath('/var/../var/log/./app.log');
// "/var/log/app.log"
```

---

#### `exists(path)`

Reports whether a path exists. Never throws for a missing path.

```javascript
if (await fs.exists('/etc/hosts')) {
  console.log('found');
}
```

---

### 🔓 Handles

#### `open(path, flags?)`

Opens a file and returns a `FileHandle`.

| Flag | Behaviour |
| --- | --- |
| `'r'` (default) | Verifies the file exists. |
| `'w'` | Truncates the file. |
| `'a'` | Opens for appending. |

```javascript
const handle = await fs.open('/data/report.csv', 'w');
```

---

## 🏗️ Building a Backend

A complete, working in-memory backend. This is the smallest useful implementation.

```javascript
import TinyFSCore from 'tiny-essentials/libs/fs/TinyFSCore';
import { createFileSystemError } from 'tiny-essentials/libs/fs/error.mjs';

/**
 * In-memory file system used for tests and local development.
 * @augments TinyFSCore
 */
export class MemoryFileSystem extends TinyFSCore {
  /** @type {Map<string, Uint8Array>} */
  #files = new Map();

  /** @type {Set<string>} */
  #directories = new Set(['/']);

  /**
   * @returns {import('tiny-essentials/libs/fs/TinyFSCore').FSCapabilities} The capabilities of this backend.
   */
  static get capabilities() {
    return Object.freeze({
      permissions: true,
      ownership: true,
      symlinks: false,
      timestamps: true,
      atomicRename: true,
      seekableHandles: false,
    });
  }

  /**
   * @param {string} targetPath Absolute path of the file.
   * @returns {Promise<Uint8Array>} The raw file contents.
   */
  async _readFile(targetPath) {
    const bytes = this.#files.get(targetPath);
    if (bytes === undefined) {
      throw createFileSystemError('ENOENT', 'open', targetPath);
    }
    return bytes;
  }

  /**
   * @param {string} targetPath Absolute path of the file.
   * @param {Uint8Array} bytes Payload to persist.
   * @param {{ append: boolean, mode: number | undefined }} options Write options.
   * @returns {Promise<void>} Resolves once the payload is committed.
   */
  async _writeFile(targetPath, bytes, options) {
    const previous = options.append ? this.#files.get(targetPath) ?? new Uint8Array(0) : new Uint8Array(0);
    const merged = new Uint8Array(previous.length + bytes.length);
    merged.set(previous, 0);
    merged.set(bytes, previous.length);
    this.#files.set(targetPath, merged);
  }

  /**
   * @param {string} targetPath Absolute path of the directory.
   * @returns {Promise<import('tiny-essentials/libs/fs/stats.mjs').FSDirectoryEntry[]>} The directory entries.
   */
  async _readdir(targetPath) {
    const prefix = targetPath.endsWith('/') ? targetPath : `${targetPath}/`;
    const entries = new Map();

    for (const filePath of this.#files.keys()) {
      if (!filePath.startsWith(prefix)) continue;
      const [name, ...rest] = filePath.slice(prefix.length).split('/');
      entries.set(name, { name, kind: rest.length === 0 ? 'file' : 'directory' });
    }

    return [...entries.values()];
  }

  /**
   * @param {string} targetPath Absolute path of the directory.
   * @returns {Promise<void>} Resolves once the directory exists.
   */
  async _mkdir(targetPath) {
    this.#directories.add(targetPath);
  }

  /**
   * @param {string} targetPath Absolute path of the entry.
   * @returns {Promise<void>} Resolves once the entry is gone.
   */
  async _rm(targetPath) {
    this.#files.delete(targetPath);
    this.#directories.delete(targetPath);
  }

  /**
   * @param {string} targetPath Absolute path of the entry.
   * @returns {Promise<import('tiny-essentials/libs/fs/stats.mjs').FSStatDescriptor | undefined>} The descriptor.
   */
  async _stat(targetPath) {
    const bytes = this.#files.get(targetPath);
    if (bytes !== undefined) {
      return { name: targetPath.split('/').pop() ?? '', kind: 'file', size: bytes.length, mtimeMs: Date.now() };
    }
    if (this.#directories.has(targetPath)) {
      return { name: targetPath.split('/').pop() ?? '', kind: 'directory', size: 0, mtimeMs: Date.now() };
    }
    return undefined;
  }

  /**
   * @param {string} oldPath Current absolute path.
   * @param {string} newPath Target absolute path.
   * @returns {Promise<void>} Resolves once the move is complete.
   */
  async _rename(oldPath, newPath) {
    const bytes = this.#files.get(oldPath);
    if (bytes === undefined) {
      throw createFileSystemError('ENOENT', 'rename', oldPath);
    }
    this.#files.set(newPath, bytes);
    this.#files.delete(oldPath);
  }

  /**
   * @param {string} sourcePath Absolute path of the source file.
   * @param {string} destinationPath Absolute path of the destination file.
   * @returns {Promise<void>} Resolves once the copy is complete.
   */
  async _copyFile(sourcePath, destinationPath) {
    const bytes = await this._readFile(sourcePath);
    this.#files.set(destinationPath, Uint8Array.from(bytes));
  }
}
```

### ✅ Backend Checklist

1. Extend `TinyFSCore`.
2. Override `static get capabilities()` and return a frozen object.
3. Implement only the hooks your use case needs. Everything else throws `ENOSYS`.
4. **Never** handle encoding, validation or metadata inside a hook. That is the core's job.
5. Throw `createFileSystemError(code, syscall, path)` instead of a bare `Error`.

---

## 🚨 Error Codes

All errors are created through `createFileSystemError(code, syscall, path, message?)`.

| Code | Thrown by | Meaning |
| --- | --- | --- |
| `ENOENT` | `stat`, `access`, `realpath`, `open` | No such file or directory. |
| `EACCES` | `access` | Permission denied. |
| `EISDIR` | `unlink` | The path is a directory. |
| `ENOSYS` | Any unoverridden hook | The backend does not implement this operation. |

```javascript
try {
  await fs.readFile('/missing.txt');
} catch (error) {
  console.error(error.code);    // "ENOENT"
  console.error(error.syscall); // "open"
  console.error(error.path);    // "/missing.txt"
}
```

---

## ⚠️ Known Divergences and Gotchas

Read this section before you file a bug. These are the behaviours that differ from
`node:fs/promises` or from the JSDoc.

| # | Location | Behaviour |
| --- | --- | --- |
| 1 | `copyFile` | Accepts `TCopyFileOptions` in JSDoc but only honours the `number` form. Passing an object silently resolves to `0`. |
| 2 | `readdir` | In `recursive` mode, every nested entry is reported with the kind `'file'`. |
| 3 | `chmod` / `chown` / `utimes` | Do **not** verify that the path exists. They create orphan metadata records. |
| 4 | `writeFile` | Writes metadata only on creation. Overwriting does **not** refresh `mtimeMs`. |
| 5 | `rm` | Deletes only the exact path from the metadata map. Descendants keep their records. |
| 6 | `lstat` | Alias of `stat`. There is no symlink support in the base class. |
| 7 | `capabilities` | It is `static`. Use `this.constructor.capabilities` inside instance methods. |
| 8 | `__stat` | Public by convention only. It is the internal implementation behind `stat`. |
| 9 | `unlink` | Calls `__stat` first, so a missing file throws `ENOENT` before `rm` runs. |

---

## 🧾 Cheatsheet

```javascript
// ─── Setup ────────────────────────────────────────────────────────────
const fs = new MemoryFileSystem({ cwd: '/app', umask: 0o022 });

// ─── Files ────────────────────────────────────────────────────────────
await fs.writeFile('/a.txt', 'data', { encoding: 'utf8' });
await fs.appendFile('/a.txt', 'more');
const buffer = await fs.readFile('/a.txt');               // Uint8Array
const text = await fs.readFile('/a.txt', { encoding: 'utf8' });
await fs.copyFile('/a.txt', '/b.txt');
await fs.truncate('/a.txt', 2);
await fs.unlink('/a.txt');

// ─── Directories ──────────────────────────────────────────────────────
await fs.mkdir('/nested/dir', { recursive: true, mode: 0o755 });
const names = await fs.readdir('/nested');
const dirents = await fs.readdir('/nested', { withFileTypes: true });
await fs.rmdir('/nested');
await fs.rm('/nested', { recursive: true, force: true });

// ─── Metadata ─────────────────────────────────────────────────────────
const stats = await fs.stat('/a.txt');
await fs.chmod('/a.txt', 0o600);
await fs.chown('/a.txt', 1000, 1000);
await fs.utimes('/a.txt', Date.now(), Date.now());
await fs.access('/a.txt', 0o4);

// ─── Paths ────────────────────────────────────────────────────────────
await fs.rename('/a.txt', '/b.txt');
const absolute = await fs.realpath('/a/../a.txt');
const found = await fs.exists('/a.txt');

// ─── Handles ──────────────────────────────────────────────────────────
const handle = await fs.open('/a.txt', 'w');
```
