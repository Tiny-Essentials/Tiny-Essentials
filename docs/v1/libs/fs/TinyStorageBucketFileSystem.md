# 🪣 TinyFS Storage Bucket Backend

> A [`TinyFSCore`](./TinyFS.md) backend that scopes the entire file system to a single
> [Storage Bucket](https://developer.mozilla.org/en-US/docs/Web/API/Storage_Buckets_API).

A storage bucket is an **isolated origin private file system**. This backend reuses every
primitive implemented by [`TinyOPFSFileSystem`](./TinyOPFSFileSystem.md) and only overrides how the root
directory handle is resolved. A bucket behaves exactly like the default origin private file
system — it just lives somewhere else.

Use it when you need **multiple, independent file systems** in the same origin: one per
user account, per workspace, per document, or per test.

---

## 📑 Table of Contents

1. [Why This Exists](#-why-this-exists)
2. [Features](#-features)
3. [Requirements](#-requirements)
4. [Project Layout](#-project-layout)
5. [Quick Start](#-quick-start)
6. [Core Concepts](#-core-concepts)
   - [Bucket Isolation](#1--bucket-isolation)
   - [Lazy Resolution](#2--lazy-resolution)
   - [Inheritance Chain](#3--inheritance-chain)
7. [API Reference](#-api-reference)
   - [Constructor](#constructor)
   - [Static Members](#static-members)
   - [Instance Members](#instance-members)
   - [Inherited Members](#inherited-members)
8. [Compatibility Matrix](#-compatibility-matrix)
9. [Daily Workflow Recipes](#-daily-workflow-recipes)
10. [Error Codes](#-error-codes)
11. [Known Divergences and Gotchas](#-known-divergences-and-gotchas)
12. [Cheatsheet](#-cheatsheet)

---

## 🤔 Why This Exists

The OPFS root is a single, shared namespace. That is fine until you need two of them:

- A **multi-account** app where each account must not see the other's files.
- A **test suite** where every test needs a clean slate.
- A **document editor** where each document owns a scratch directory.
- A **plugin host** where a misbehaving plugin must not read the host's files.

You *could* prefix every path with a directory name. Buckets are better: the browser
enforces the boundary, `listBuckets()` enumerates them, and `deleteBucket()` removes one
atomically.

---

## ✨ Features

| Feature | Status |
| --- | --- |
| 🗂️ Multiple isolated file systems per origin | ✅ |
| 🔒 Browser-enforced isolation | ✅ |
| 🧬 Inherits every OPFS primitive | ✅ |
| 📦 Zero runtime dependencies | ✅ |
| 🎛️ Per-bucket quota and durability | ✅ |
| ⏳ Per-bucket expiration | ✅ |
| 🧪 Trivially mockable | ✅ |
| 🔐 POSIX permissions | 🧠 Emulated in memory |
| 🕐 Timestamps | 🧠 Emulated in memory |
| 🌐 Browser support | ⚠️ Chromium 122+ only |

---

## 📋 Requirements

- A **secure context** (`https://` or `localhost`).
- A browser with the **Storage Buckets API**: Chrome 122+, Edge 122+.
- The `navigator.storageBuckets` object.

> ⚠️ **Firefox and Safari do not implement the Storage Buckets API.** Always check
> `TinyStorageBucketFileSystem.isSupported` before constructing an instance. See
> [Recipe 5](#-recipe-5--graceful-fallback).

---

## 🚀 Quick Start

```javascript
import TinyStorageBucketFileSystem from 'tiny-essentials/libs/fs/plugins/OPFS/StorageBucket';

const fs = new TinyStorageBucketFileSystem({
  bucket: { name: 'workspace-42', durability: 'strict' },
});

await fs.mkdir('/projects', { recursive: true });
await fs.writeFile('/projects/notes.txt', 'hello from a bucket', { encoding: 'utf8' });

const text = await fs.readFile('/projects/notes.txt', { encoding: 'utf8' });
console.log(text); // "hello from a bucket"
```

The same path in a different bucket is a **different file**:

```javascript
const other = new TinyStorageBucketFileSystem({ bucket: { name: 'workspace-99' } });

await other.exists('/projects/notes.txt'); // false
```

---

## 🧠 Core Concepts

### 1. 🔒 Bucket Isolation

A bucket is a completely separate file system. Two instances with different `bucket.name`
values share nothing:

```text
Origin
├── bucket: "workspace-42"
│   └── /projects/notes.txt
└── bucket: "workspace-99"
    └── /projects/notes.txt      ← a different file
```

The isolation is enforced by the **browser**, not by string prefixing. A path traversal
attack cannot escape a bucket.

---

### 2. ⏳ Lazy Resolution

The constructor does **not** touch the Storage Buckets API. The bucket is opened on the
first I/O operation and the resulting handle is cached in a private field.

```javascript
const fs = new TinyStorageBucketFileSystem({ bucket: { name: 'lazy' } });
// navigator.storageBuckets.open() has NOT been called yet.

await fs.readFile('/missing.txt');
// 1. _resolveRoot() runs.
// 2. #assertSupported('open') passes.
// 3. navigator.storageBuckets.open('lazy', {}) is awaited.
// 4. bucket.getDirectory() is awaited.
// 5. The handle is cached in #bucketRoot.
```

**Consequence:** a malformed environment does not throw in the constructor. It throws on the
first `await`.

---

### 3. 🧬 Inheritance Chain

```text
TinyFSCore
    ▲
    │  (implements the metadata side table, permissions, encoding)
    │
TinyOPFSFileSystem
    ▲
    │  (implements every hook against the OPFS API)
    │
TinyStorageBucketFileSystem
       (overrides _resolveRoot only)
```

This backend adds **one** override (`_resolveRoot`) and **three** static members. Everything
else is inherited. Read the [OPFS documentation](./TinyOPFSFileSystem.md) for the full behaviour of every
file operation.

---

## 📚 API Reference

### Constructor

```javascript
new TinyStorageBucketFileSystem(options?)
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `options.bucket` | `StorageBucketDescriptor` | `{ name: 'tiny-fs' }` | Bucket configuration. |
| `options.cwd` | `string` | `ROOT_PATH` | Forwarded to `TinyFSCore`. |
| `options.umask` | `number` | `DEFAULT_UMASK` | Forwarded to `TinyFSCore`. |
| `options.identity` | `FSIdentity` | `{ uid: 0, gid: 0, groups: [] }` | Forwarded to `TinyFSCore`. |

#### `StorageBucketDescriptor`

| Property | Type | Description |
| --- | --- | --- |
| `name` | `string` | Bucket name. Must be a non-empty string. Defaults to `'tiny-fs'`. |
| `durability` | `'strict' \| 'relaxed'` | Persistence guarantee requested from the browser. |
| `persisted` | `boolean` | Whether the bucket should survive eviction. |
| `quota` | `number` | Maximum number of bytes the bucket may use. Must be a non-negative integer. |
| `expires` | `number` | Unix timestamp, in milliseconds, after which the bucket may be cleared. Must be a non-negative integer. |

```javascript
const fs = new TinyStorageBucketFileSystem({
  bucket: {
    name: 'reports',
    durability: 'strict',
    persisted: true,
    quota: 50 * 1024 * 1024,
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
  },
});
```

**Throws:**

- `TypeError` when `bucket` is not a plain object, or a member has the wrong type.
- `RangeError` when `quota` or `expires` is negative.

---

### Static Members

#### `TinyStorageBucketFileSystem.isSupported`

```javascript
TinyStorageBucketFileSystem.isSupported; // boolean
```

Returns `true` when `navigator.storageBuckets` is a non-null object.

> ⚠️ This checks for the **object**, not its methods. A partial polyfill that defines
> `navigator.storageBuckets = {}` passes this check and fails later with a `TypeError`.

---

#### `await TinyStorageBucketFileSystem.listBuckets()`

Lists the names of every storage bucket owned by the origin.

| Returns | Description |
| --- | --- |
| `Promise<string[]>` | The bucket names. |

**Throws:** `Error` with `code: 'ENOSYS'` when the API is unavailable.

```javascript
const names = await TinyStorageBucketFileSystem.listBuckets();
console.log(names); // ["tiny-fs", "workspace-42"]
```

---

#### `await TinyStorageBucketFileSystem.deleteBucket(name)`

Deletes a storage bucket owned by the origin.

| Parameter | Type | Description |
| --- | --- | --- |
| `name` | `string` | Name of the bucket to delete. |

| Returns | Description |
| --- | --- |
| `Promise<boolean>` | `true` when the bucket existed. |

**Throws:**

- `TypeError` when `name` is not a non-empty string.
- `Error` with `code: 'ENOSYS'` when the API is unavailable.

```javascript
await TinyStorageBucketFileSystem.deleteBucket('workspace-42');
```

> ⚠️ **The `name` check runs before the support check.** On an unsupported browser,
> `deleteBucket('')` throws `TypeError`, not `ENOSYS`. See
> [Gotcha #2](#-known-divergences-and-gotchas).

---

### Instance Members

#### `fs.bucketName`

```javascript
fs.bucketName; // string
```

The resolved bucket name. Returns `'tiny-fs'` when no name was provided.

> ⚠️ Read-only. There is no setter. To change buckets, construct a new instance.

---

### Inherited Members

Every method below is inherited from `TinyOPFSFileSystem` and behaves identically:

`readFile` · `writeFile` · `appendFile` · `readdir` · `mkdir` · `rm` · `rmdir` · `unlink` ·
`rename` · `copyFile` · `stat` · `lstat` · `access` · `chmod` · `chown` · `utimes` ·
`truncate` · `realpath` · `open` · `exists`

See the [OPFS documentation](./TinyOPFSFileSystem.md) for the full reference.

---

## 📊 Compatibility Matrix

| `node:fs/promises` method | Status | Notes |
| --- | --- | --- |
| `readFile` | ✅ Native | Scoped to the bucket. |
| `writeFile` | ✅ Native | Scoped to the bucket. |
| `readdir` | ✅ Native | Sorted by name. |
| `mkdir` | ✅ Native | |
| `rm` / `rmdir` / `unlink` | ✅ Native | |
| `copyFile` | ✅ Native | Buffered in memory. |
| `stat` / `lstat` | ✅ Native | Directory mtime is not stable. |
| `rename` | ⚠️ Emulated | Copy + delete, not atomic. |
| `truncate` | ⚠️ Emulated | Read + write. |
| `access` | ⚠️ Emulated | Uses the in-memory identity. |
| `realpath` | ⚠️ Emulated | String normalisation only. |
| `open` | ⚠️ Emulated | Returns a `FileHandle`. |
| `chmod` / `chown` / `utimes` | 🧠 In-memory | Lost on reload. |
| `symlink` / `readlink` | ❌ Unsupported | OPFS has no symlinks. |

---

## 🚨 Error Codes

| Code | Thrown by | Meaning |
| --- | --- | --- |
| `ENOSYS` | `_resolveRoot`, `listBuckets`, `deleteBucket` | The Storage Buckets API is unavailable. |
| `TypeError` | Constructor, `deleteBucket` | A member has the wrong type. |
| `RangeError` | Constructor | `quota` or `expires` is negative. |

Every other error code is inherited from `TinyOPFSFileSystem`. See the
[OPFS error reference](./TinyOPFSFileSystem.md#-error-codes).

---

## ⚠️ Known Divergences and Gotchas

Read this section before you file a bug.

### 🔴 Data integrity

| # | Location | Behaviour |
| --- | --- | --- |
| 1 | `deleteBucket` | **No guard against deleting the bucket in use.** The cached `#bucketRoot` becomes a stale handle. Subsequent reads throw a `DOMException`, not a `FileSystemError`. |
| 2 | `_resolveRoot` | **The bucket is opened once and cached.** Calling `deleteBucket(name)` and then reusing the instance does **not** recreate the bucket. |
| 3 | `_resolveRoot` | **The `root` option is silently ignored.** `TinyOPFSFileSystem` accepts `options.root`, but this class overrides `_resolveRoot` without calling `super._resolveRoot()`. Passing both `root` and `bucket` discards `root`. |

### 🟡 API surface

| # | Location | Behaviour |
| --- | --- | --- |
| 4 | `deleteBucket` | **The `name` check runs before the support check.** On an unsupported browser, `deleteBucket('')` throws `TypeError` instead of `ENOSYS`. |
| 5 | `listBuckets` | **The syscall name is `'keys'`**, not `'listBuckets'`. The error message reads `keys() is not implemented`. |
| 6 | `isSupported` | **Only checks for the object**, not its methods. A partial polyfill passes and fails later. |
| 7 | `bucketName` | **Read-only.** No setter. Construct a new instance to change buckets. |
| 8 | `assertBucketDescriptor` | **Not exported.** It cannot be unit-tested in isolation. |

### 🟠 Validation

| # | Location | Behaviour |
| --- | --- | --- |
| 9 | `assertBucketDescriptor` | **The bucket name is not sanitised.** `'../etc'` and `'a/b'` are accepted. The browser may reject them later. |
| 10 | `assertBucketDescriptor` | **`quota` and `expires` have no upper bound.** `Number.MAX_SAFE_INTEGER` is accepted. |
| 11 | `assertBucketDescriptor` | **`expires: 0` is accepted.** A timestamp of `0` is in the past, so the bucket may be cleared immediately. |
| 12 | `assertBucketDescriptor` | **`undefined` members are forwarded** to `navigator.storageBuckets.open()`. Harmless today, but it relies on the browser ignoring them. |

### 🔵 Inherited

| # | Location | Behaviour |
| --- | --- | --- |
| 13 | Every hook | **All 18 divergences from `TinyOPFSFileSystem` apply.** See the [OPFS documentation](./TinyOPFSFileSystem.md#-known-divergences-and-gotchas). |

---

## 🧾 Cheatsheet

```javascript
import TinyStorageBucketFileSystem from 'tiny-essentials/libs/fs/plugins/OPFS/StorageBucket';

// ─── Support check ────────────────────────────────────────────────────
if (!TinyStorageBucketFileSystem.isSupported) {
  throw new Error('Storage Buckets are not available');
}

// ─── Setup ────────────────────────────────────────────────────────────
const fs = new TinyStorageBucketFileSystem({
  bucket: {
    name: 'workspace-42',
    durability: 'strict',
    persisted: true,
    quota: 50 * 1024 * 1024,
    expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
  },
});

// ─── Files (inherited from TinyOPFSFileSystem) ────────────────────────
await fs.mkdir('/projects', { recursive: true });
await fs.writeFile('/projects/a.txt', 'data', { encoding: 'utf8' });
const text = await fs.readFile('/projects/a.txt', { encoding: 'utf8' });
const names = await fs.readdir('/projects');
await fs.rm('/projects', { recursive: true, force: true });

// ─── Bucket management ────────────────────────────────────────────────
fs.bucketName;                                          // "workspace-42"
await TinyStorageBucketFileSystem.listBuckets();        // ["workspace-42"]
await TinyStorageBucketFileSystem.deleteBucket('old');  // true
```
