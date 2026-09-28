# 🗂️ TinyFS OPFS Backend

> An Origin Private File System backend for [`TinyFSCore`](./TinyFS.md), running in the browser.

This backend maps the `TinyFSCore` contract onto the
[Origin Private File System](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system)
(OPFS). It gives you a real, persistent, sandboxed file system inside the browser,
with the same API you already use in Node.js.

It is designed for **browser extensions, PWAs, offline-first editors and Web Workers** that
need more than `localStorage` and less than a server.

---

## 📑 Table of Contents

1. [Why This Exists](#-why-this-exists)
2. [Features](#-features)
3. [Requirements](#-requirements)
4. [Project Layout](#-project-layout)
5. [Quick Start](#-quick-start)
6. [Core Concepts](#-core-concepts)
   - [The Root Handle](#1--the-root-handle)
   - [Path Resolution](#2--path-resolution)
   - [Native vs. Emulated Operations](#3--native-vs-emulated-operations)
7. [API Reference](#-api-reference)
   - [Constructor](#constructor)
   - [Static Members](#static-members)
   - [Protected Hooks](#protected-hooks)
8. [Compatibility Matrix](#-compatibility-matrix)
9. [Daily Workflow Recipes](#-daily-workflow-recipes)
10. [Error Codes](#-error-codes)
11. [Known Divergences and Gotchas](#-known-divergences-and-gotchas)
12. [Cheatsheet](#-cheatsheet)

---

## 🤔 Why This Exists

The browser has three storage primitives, and none of them is a file system:

| Primitive | Size limit | Sync API | Directory tree |
| --- | --- | --- | --- |
| `localStorage` | ~5 MB | ✅ | ❌ |
| IndexedDB | Quota-based | ❌ | ❌ |
| **OPFS** | Quota-based | ❌ | ✅ |

OPFS is the only one that gives you a real hierarchy. But its API is verbose:
every operation needs a `FileSystemDirectoryHandle`, every path has to be walked
manually, and errors are `DOMException` instances with names like `NotFoundError`.

This backend hides all of that behind the `TinyFSCore` interface.

---

## ✨ Features

| Feature | Status |
| --- | --- |
| 🌐 Runs in the main thread and in Workers | ✅ |
| 📁 Nested directory trees | ✅ |
| 🔁 Recursive copy and move | ✅ |
| 📦 Zero runtime dependencies | ✅ |
| 🔒 Symbolic links | ❌ OPFS has none |
| 🔐 POSIX permissions | 🧠 Emulated in memory |
| 🕐 Timestamps | 🧠 Emulated in memory |
| ⚛️ Atomic rename | ❌ Copy + delete |
| 🌊 Streaming reads and writes | ❌ Buffered in memory |

---

## 📋 Requirements

- A **secure context** (`https://` or `localhost`).
- A browser with OPFS support: Chrome 86+, Firefox 111+, Safari 15.2+.

> ⚠️ OPFS is **not available** in a Node.js process without a polyfill. The constructor
> succeeds, but the first operation throws `ENOSYS`.

---

## 🚀 Quick Start

```javascript
import TinyOPFSFileSystem from 'tiny-essentials/libs/fs/plugins/OPFS';

const fs = new TinyOPFSFileSystem();

// Write a file. Parent directories must exist.
await fs.mkdir('/projects', { recursive: true });
await fs.writeFile('/projects/notes.txt', 'hello from OPFS', { encoding: 'utf8' });

// Read it back.
const text = await fs.readFile('/projects/notes.txt', { encoding: 'utf8' });
console.log(text); // "hello from OPFS"

// List the directory.
console.log(await fs.readdir('/projects')); // ["notes.txt"]
```

---

## 🧠 Core Concepts

### 1. 🌱 The Root Handle

Every operation starts from a `FileSystemDirectoryHandle`. By default, the backend calls
`navigator.storage.getDirectory()` on first use and **caches the result** in a private
field.

```javascript
const fs = new TinyOPFSFileSystem();
// Nothing has touched the disk yet.

await fs.readFile('/a.txt');
// 1. #resolveRoot() runs.
// 2. navigator.storage.getDirectory() is called once.
// 3. The handle is cached in #root.
```

You can inject your own root — useful for tests and for scoping a backend to a
sub-directory:

```javascript
const root = await navigator.storage.getDirectory();
const scoped = await root.getDirectoryHandle('my-app', { create: true });

const fs = new TinyOPFSFileSystem({ root: scoped });
```

> 💡 Injecting a root is the recommended way to isolate tests. Each test gets a fresh
> sub-directory and cleans up after itself.

---

### 2. 🧭 Path Resolution

Paths are normalised by `toSegments()` and then walked one segment at a time. There is no
path cache, so a deep path costs one `getDirectoryHandle` call per segment.

```text
"/a/b/c.txt"
   │
   ├─ getDirectoryHandle("a")
   ├─ getDirectoryHandle("b")
   └─ getFileHandle("c.txt")
```

The special path `"/"` resolves to zero segments, which is why `_stat("/")` short-circuits
and returns a synthetic descriptor.

---

### 3. 🔀 Native vs. Emulated Operations

This is the most important concept in this document.

| Layer | Backed by | Survives a reload? |
| --- | --- | --- |
| **File contents** | OPFS | ✅ Yes |
| **Directory structure** | OPFS | ✅ Yes |
| **Permissions (`mode`)** | `Map` in `TinyFSCore` | ❌ No |
| **Ownership (`uid`/`gid`)** | `Map` in `TinyFSCore` | ❌ No |
| **Timestamps** | `Map` in `TinyFSCore` | ❌ No |

The class docstring states this directly:

> OPFS has no symbolic links, no permission bits and no way to set timestamps. Those
> operations are emulated by the base class and stored in memory, so they are lost when
> the tab is closed.

**Practical consequence:** if your application relies on `chmod` to gate access, that gate
disappears on reload. Persist any security-relevant flag inside the file itself.

---

## 📚 API Reference

### Constructor

```javascript
new TinyOPFSFileSystem(options?)
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `options.root` | `FileSystemDirectoryHandle` | `null` | Custom root. Resolved lazily when omitted. |
| `options.cwd` | `string` | `ROOT_PATH` | Forwarded to `TinyFSCore`. |
| `options.umask` | `number` | `DEFAULT_UMASK` | Forwarded to `TinyFSCore`. |
| `options.identity` | `FSIdentity` | `{ uid: 0, gid: 0, groups: [] }` | Forwarded to `TinyFSCore`. |

```javascript
const fs = new TinyOPFSFileSystem({
  root: await navigator.storage.getDirectory(),
  umask: 0o022,
});
```

---

### Static Members

#### `TinyOPFSFileSystem.capabilities`

```javascript
TinyOPFSFileSystem.capabilities;
// {
//   permissions: false,
//   ownership: false,
//   symlinks: false,
//   timestamps: false,
//   atomicRename: false,
//   seekableHandles: false
// }
```

> ⚠️ Every flag is `false`, including `atomicRename`. The `_rename` implementation is a
> recursive copy followed by a delete, so a crash mid-way leaves a partial tree.

---

### Protected Hooks

These are the methods this backend implements. You should not call them directly — use the
public `TinyFSCore` methods instead.

#### `_resolveRoot()`

Resolves and caches the root directory handle.

| Returns | Description |
| --- | --- |
| `Promise<FileSystemDirectoryHandle>` | The OPFS root directory. |

**Throws:** `ENOSYS` when `navigator.storage.getDirectory` is not a function.

**Override this** when your backend stores its tree inside a nested location, such as a
storage bucket:

```javascript
class BucketFileSystem extends TinyOPFSFileSystem {
  async _resolveRoot() {
    const root = await super._resolveRoot();
    return root.getDirectoryHandle('bucket', { create: true });
  }
}
```

---

#### `_readFile(targetPath)`

Reads a file into a `Uint8Array`.

| Parameter | Type | Description |
| --- | --- | --- |
| `targetPath` | `string` | Absolute path of the file. |

**Returns:** `Promise<Uint8Array>`

**Throws:** `EISDIR` when the path is a directory. The fallback code is applied to every
non-`DOMException` failure, so a genuine I/O error is also reported as `EISDIR`.

---

#### `_writeFile(targetPath, bytes, options)`

Writes bytes to a file, creating it when missing.

| Parameter | Type | Description |
| --- | --- | --- |
| `targetPath` | `string` | Absolute path of the file. |
| `bytes` | `Uint8Array` | Payload to persist. |
| `options.append` | `boolean` | When `true`, writes at the current end of file. |

**Returns:** `Promise<void>`

> ⚠️ The parent directory must already exist. `#resolveParent` uses `create: false`, so a
> missing parent throws `ENOENT`.

---

#### `_readdir(targetPath)`

Lists a directory.

**Returns:** `Promise<FSDirectoryEntry[]>` — sorted by `name` using `localeCompare`.

> ⚠️ The sort is locale-dependent. Do not rely on it for a stable wire format.

---

#### `_mkdir(targetPath, options)`

Creates a directory.

| `options.recursive` | Behaviour |
| --- | --- |
| `true` | Creates missing parents. Silently succeeds when the directory exists. |
| `false` | Throws `EEXIST` when the name is taken. |

> ⚠️ The non-recursive path performs a **check-then-create**. It is not atomic.

---

#### `_rm(targetPath, options)`

Removes a file or directory.

| `options.recursive` | `options.force` | Behaviour |
| --- | --- | --- |
| `false` | `false` | Throws `ENOTEMPTY` when the directory is not empty. |
| `true` | `false` | Removes the tree. |
| `*` | `true` | Missing paths are ignored. |

> ⚠️ `force: true` does **not** suppress a missing **parent** directory. `#resolveParent`
> runs before the existence check, so `rm('/missing/child', { force: true })` still throws
> `ENOENT`.

---

#### `_stat(targetPath)`

Returns a descriptor for a file or directory.

**Returns:** `Promise<FSStatDescriptor | undefined>`

| Kind | `size` | `mtimeMs` |
| --- | --- | --- |
| File | `File.size` | `File.lastModified` |
| Directory | `0` | `Date.now()` |
| Root (`/`) | `0` | `Date.now()` |

> ⚠️ Directory `mtimeMs` is **never stable**. It returns the current time on every call.
> Do not use it for cache invalidation.

---

#### `_rename(oldPath, newPath)`

Moves a file or directory.

| Source kind | Implementation |
| --- | --- |
| File | `_readFile` → `_writeFile` → `_rm` |
| Directory | `#copyTree` → `_rm` |

**Returns:** `Promise<void>`

> ⚠️ This is **not atomic**. See [Known Divergences](#-known-divergences-and-gotchas).

---

#### `_copyFile(sourcePath, destinationPath)`

Copies a file by reading it fully into memory.

**Returns:** `Promise<void>`

> ⚠️ The base class passes a third `mode` argument. This override ignores it.

---

## 📊 Compatibility Matrix

| `node:fs/promises` method | Status | Notes |
| --- | --- | --- |
| `readFile` | ✅ Native | |
| `writeFile` | ✅ Native | |
| `appendFile` | ✅ Native | Uses `keepExistingData: true` |
| `readdir` | ✅ Native | Sorted by name |
| `mkdir` | ✅ Native | |
| `rm` / `rmdir` | ✅ Native | |
| `unlink` | ✅ Native | |
| `copyFile` | ✅ Native | Buffered in memory |
| `stat` / `lstat` | ✅ Native | Directory mtime is not stable |
| `rename` | ⚠️ Emulated | Copy + delete, not atomic |
| `truncate` | ⚠️ Emulated | Read + write |
| `access` | ⚠️ Emulated | Uses the in-memory identity |
| `realpath` | ⚠️ Emulated | String normalisation only |
| `open` | ⚠️ Emulated | Returns a `FileHandle` |
| `chmod` / `chown` | 🧠 In-memory | Lost on reload |
| `utimes` | 🧠 In-memory | Lost on reload |
| `symlink` / `readlink` | ❌ Unsupported | OPFS has no symlinks |

---

## 🚨 Error Codes

All errors are created through `createFileSystemError` or mapped by `toFileSystemError`.

| Code | Thrown by | Meaning |
| --- | --- | --- |
| `ENOENT` | `readFile`, `stat`, `rm`, `rename` | No such file or directory. |
| `EISDIR` | `readFile` | The path is a directory. |
| `EEXIST` | `mkdir` | The directory already exists. |
| `ENOTEMPTY` | `rm` | The directory is not empty. |
| `EINVAL` | `rm`, `rename` | The root has no parent. |
| `ENOSYS` | `_resolveRoot` | OPFS is not available. |

```javascript
try {
  await fs.readFile('/missing.txt');
} catch (error) {
  console.error(error.code);    // "ENOENT"
  console.error(error.syscall); // "readFile"
  console.error(error.path);    // "/missing.txt"
}
```

---

## ⚠️ Known Divergences and Gotchas

Read this section before you file a bug. These are the behaviours that differ from
`node:fs/promises` or from the base class contract.

### 🔴 Data integrity

| # | Location | Behaviour |
| --- | --- | --- |
| 1 | `_rename` | **Not atomic.** Copies the tree, then deletes the source. A crash leaves both copies. |
| 2 | `_rename` | **Merges into an existing destination.** `getDirectoryHandle(newPath, { create: true })` does not replace the target. |
| 3 | `_rename` | **Renaming a directory into its own descendant** copies the tree, then deletes the copy. Silent data loss. |
| 4 | `_rm` | `force: true` does **not** suppress a missing parent. `#resolveParent` runs first and throws `ENOENT`. |
| 5 | `_writeFile` | Does **not** create parent directories. `#resolveParent` uses `create: false`. |

### 🟡 Metadata

| # | Location | Behaviour |
| --- | --- | --- |
| 6 | `_stat` | Directory `mtimeMs` is `Date.now()`. Never stable across calls. |
| 7 | `_stat` | The root descriptor uses `name: "/"` instead of a base name. |
| 8 | `_stat` | Every directory reports `size: 0`. |
| 9 | `chmod` / `chown` / `utimes` | Emulated in memory. Lost on reload. |

### 🟠 Performance

| # | Location | Behaviour |
| --- | --- | --- |
| 10 | `_readFile` / `_writeFile` | Buffer the whole file in memory. No streaming. |
| 11 | `_rename` | Reads and rewrites every byte of a directory tree. |
| 12 | `_stat` | Calls `getFile()` for files, which reads the file header. |
| 13 | `_rename` (file) | Calls `getFile()` twice: once in `_stat`, once in `_readFile`. |
| 14 | `_readdir` | Sorts with `localeCompare`, which is locale-dependent. |

### 🔵 API surface

| # | Location | Behaviour |
| --- | --- | --- |
| 15 | `_copyFile` | Ignores the `mode` argument the base class passes. |
| 16 | `_readFile` | Maps every non-`DOMException` failure to `EISDIR`. |
| 17 | `capabilities` | Every flag is `false`, including `atomicRename`. |
| 18 | `_resolveRoot` | Caches the handle. Replacing the OPFS root at runtime has no effect. |

---

## 🧾 Cheatsheet

```javascript
import TinyOPFSFileSystem from 'tiny-essentials/libs/fs/plugins/OPFS';

// ─── Setup ────────────────────────────────────────────────────────────
const fs = new TinyOPFSFileSystem();
const scoped = new TinyOPFSFileSystem({ root: await navigator.storage.getDirectory() });

// ─── Files ────────────────────────────────────────────────────────────
await fs.mkdir('/app', { recursive: true });
await fs.writeFile('/app/a.txt', 'data', { encoding: 'utf8' });
await fs.appendFile('/app/a.txt', 'more');
const text = await fs.readFile('/app/a.txt', { encoding: 'utf8' });
const buffer = await fs.readFile('/app/a.txt'); // Uint8Array
await fs.copyFile('/app/a.txt', '/app/b.txt');
await fs.unlink('/app/a.txt');

// ─── Directories ──────────────────────────────────────────────────────
const names = await fs.readdir('/app');
const dirents = await fs.readdir('/app', { withFileTypes: true });
await fs.rm('/app', { recursive: true, force: true });

// ─── Metadata (in-memory only) ────────────────────────────────────────
const stats = await fs.stat('/app/a.txt');
await fs.chmod('/app/a.txt', 0o600);
await fs.chown('/app/a.txt', 1000, 1000);
await fs.utimes('/app/a.txt', Date.now(), Date.now());

// ─── Paths ────────────────────────────────────────────────────────────
await fs.rename('/app/a.txt', '/app/b.txt');
const absolute = await fs.realpath('/app/../app/a.txt');
const found = await fs.exists('/app/a.txt');

// ─── Storage ──────────────────────────────────────────────────────────
await navigator.storage.persist();
const { usage, quota } = await navigator.storage.estimate();
```
