# 🧬 IPFS Hasher

> Generate **IPFS Content Identifiers (CIDs)** locally, in pure JavaScript, without running an IPFS node.

---

## 📖 Table of Contents

- [What Is This?](#-what-is-this)
- [Why Would I Use This?](#-why-would-i-use-this)
- [Core Concepts (Read This First)](#-core-concepts-read-this-first)
- [Quick Start](#-quick-start)
- [API Reference](#-api-reference)
  - [Class: `IPFSHasher`](#class-ipfshasher)
  - [`new IPFSHasher(version)`](#new-ipfshasherversion)
  - [`hasher.generate(data)`](#hashergeneratedata)
  - [Type: `CIDGenerationResult`](#type-cidgenerationresult)
- [Choosing Between v0 and v1](#-choosing-between-v0-and-v1)
- [Error Handling](#-error-handling)
- [Known Limitations](#-known-limitations)
- [Project Structure](#-project-structure)
- [FAQ](#-faq)

---

## 🎯 What Is This?

`IPFSHasher` is a small, dependency-light utility class that turns **raw bytes into an IPFS CID**.

It does **one thing**: it takes a `Uint8Array` and returns a content identifier. That is all.

```text
  ┌──────────────┐      ┌─────────────────┐      ┌──────────────────────────────┐
  │  Your bytes  │ ───▶ │  sha2-256 hash  │ ───▶ │  CID string ("bafkrei..." )  │
  └──────────────┘      └─────────────────┘      └──────────────────────────────┘
```

**What it does NOT do:**

- ❌ It does **not** connect to the IPFS network.
- ❌ It does **not** upload, pin, or store anything.
- ❌ It does **not** require a running daemon.

It is a pure function with a class wrapper. That makes it safe to use in build scripts, CI pipelines, browsers, and serverless functions.

---

## 💡 Why Would I Use This?

| Use case | How this helps |
| --- | --- |
| 🗄️ **Content-addressable cache** | Use the CID as a cache key. Identical bytes always produce an identical key. |
| 📦 **Build artifact verification** | Hash a build output and compare it against a published manifest. |
| 🔍 **Duplicate detection** | Two files with the same CID have identical content. Guaranteed. |
| 🌐 **Pre-upload preparation** | Compute the CID before uploading so you can store the reference in a database first. |
| 🧪 **Testing IPFS integrations** | Assert that your upload code produces the expected CID, without a network. |

---

## 🧠 Core Concepts (Read This First)

If you are new to IPFS, read this section. It will save you hours.

### What is a CID?

A **CID (Content Identifier)** is a self-describing hash. It contains:

```text
  bafkreiabc123...
  │  │    │
  │  │    └── The hash digest itself
  │  └─────── The codec (how to interpret the bytes)
  └────────── The version + encoding prefix
```

Because the metadata is *inside* the string, a CID is portable. Anyone can look at it and know how to verify it.

### The three pieces

| Piece | Meaning | Values used here |
| --- | --- | --- |
| **Version** | The CID format version. | `v0` or `v1` |
| **Codec** | How to interpret the bytes. | `dag-pb` (`0x70`) or `raw` (`0x55`) |
| **Hash** | The digest algorithm. | `sha2-256` |

### The critical rule

> ⚠️ **The same bytes produce different CIDs in v0 and v1.**
>
> This is not a bug. It is by design. v0 is locked to the `dag-pb` codec; v1 lets you choose. Different codec means a different CID.

---

## 🚀 Quick Start

```javascript
import { readFile } from 'node:fs/promises';
import IPFSHasher from 'tiny-essentials/webTemplates/multiformats/14.0/IPFSHasher';

// 1. Read some bytes. A Buffer IS a Uint8Array, so this works directly.
const bytes = await readFile('./hello.txt');

// 2. Create a hasher. Defaults to CIDv1.
const hasher = new IPFSHasher('v1');

// 3. Generate the CID.
const result = await hasher.generate(bytes);

console.log(result.cidString); // "bafkreifz..."
console.log(result.version);   // "v1"
console.log(result.codec);     // 85
```

**Expected output:**

```text
bafkreieq5jui4j25lacwomsqgvn7mq3d3h5c5c5c5c5c5c5c5c5c5c5c5c5
v1
85
```

---

## 📚 API Reference

### Class: `IPFSHasher`

A stateless CID generator. Create one instance per version and reuse it.

> 💡 **Why a class instead of a function?**
> The version is the only piece of state. Storing it in a private field (`#version`) means you cannot accidentally mutate it from the outside. The class is immutable after construction.

---

### `new IPFSHasher(version)`

Creates a new hasher.

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `version` | `'v0' \| 'v1'` | `'v1'` | The CID version to generate. |

**Throws:** `TypeError` if `version` is not `'v0'` or `'v1'`.

```javascript
const v1 = new IPFSHasher();       // Defaults to 'v1'
const v0 = new IPFSHasher('v0');   // Explicit

new IPFSHasher('v2');
// TypeError: Invalid CID version. Use "v0" or "v1".
```

---

### `hasher.generate(data)`

Generates a CID from raw bytes.

| Parameter | Type | Description |
| --- | --- | --- |
| `data` | `Uint8Array` | The raw bytes to hash. |

**Returns:** `Promise<CIDGenerationResult>`

**Throws:** `TypeError` if `data` is not a `Uint8Array`.

```javascript
const hasher = new IPFSHasher('v1');
const result = await hasher.generate(new Uint8Array([1, 2, 3]));
```

> ⚠️ **`Buffer` works, `ArrayBuffer` does not.**
> `Buffer` extends `Uint8Array`, so it passes the check. A raw `ArrayBuffer` does **not**. Wrap it first:
>
> ```javascript
> const bytes = new Uint8Array(arrayBuffer);
> ```

---

### Type: `CIDGenerationResult`

The object resolved by `generate()`.

| Property | Type | Description |
| --- | --- | --- |
| `cidString` | `string` | The string representation of the CID. |
| `version` | `'v0' \| 'v1'` | The CID version that was generated. |
| `hashAlgorithm` | `'sha256'` | The algorithm used for hashing. |
| `codec` | `number` | The multicodec code of the content. |

**Codec reference:**

| Constant | Value | Used by |
| --- | --- | --- |
| `CODEC_DAG_PB` | `0x70` (`112`) | Always used by v0. |
| `CODEC_RAW` | `0x55` (`85`) | Used by v1 in this project. |

---

## ⚖️ Choosing Between v0 and v1

| | **CIDv0** | **CIDv1** |
| --- | --- | --- |
| **Prefix** | `Qm...` | `bafkrei...` |
| **Encoding** | base58btc | base32 (lowercase) |
| **Codec** | `dag-pb` (locked) | `raw` |
| **Case sensitive** | Yes | No |
| **Recommended for new projects** | ❌ No | ✅ **Yes** |

### 👉 Recommendation

**Use `v1` unless you have a specific reason not to.**

Reasons to use `v1`:

- ✅ It is case-insensitive, so it is safe in URLs and file names.
- ✅ It is future-proof. The codec is explicit.
- ✅ It is what `ipfs add --cid-version=1` produces.

Reasons to use `v0`:

- You must match a legacy system that only understands `Qm...` addresses.

---

## 🚨 Error Handling

The class throws exactly one error type. Catch it explicitly.

| Condition | Error | Message |
| --- | --- | --- |
| Invalid version in constructor | `TypeError` | `Invalid CID version. Use "v0" or "v1".` |
| Non-`Uint8Array` in `generate()` | `TypeError` | `Expected Uint8Array, but received <type>.` |

### ✅ Correct pattern

```javascript
import IPFSHasher from 'tiny-essentials/webTemplates/multiformats/14.0/IPFSHasher';

try {
  const hasher = new IPFSHasher('v1');
  const { cidString } = await hasher.generate(new Uint8Array([1, 2, 3]));
  console.log(cidString);
} catch (error) {
  if (error instanceof TypeError) {
    console.error('Invalid input:', error.message);
    process.exit(1);
  }
  throw error;
}
```

### ❌ Anti-pattern

```javascript
// Never do this. You lose the stack trace and the error type.
try {
  await hasher.generate(data);
} catch {
  console.log('Something went wrong');
}
```

---

## ⚠️ Known Limitations

Be aware of these before you file a bug report.

| # | Limitation | Impact |
| --- | --- | --- |
| 1 | Empty input is allowed. | `new Uint8Array(0)` produces a valid CID. Validate upstream if you need to reject empty files. |
| 2 | The error message uses `typeof data`. | When `data` is `null`, the message reads `received object`. Cosmetic only. |
| 3 | Only `sha2-256` is supported. | Hardcoded. Adding `sha2-512` requires a code change. |
| 4 | `ArrayBuffer` is rejected. | Wrap it: `new Uint8Array(buffer)`. |
| 5 | No streaming. | The entire file must fit in memory. For files over ~500 MB, use a chunker. |
| 6 | No network access. | This is intentional. Use `kubo-rpc-client` or `helia` to publish. |

---

## ❓ FAQ

<details>
<summary><strong>Do I need an IPFS node running?</strong></summary>

No. This library is completely offline. It only does math on bytes.

</details>

<details>
<summary><strong>Why does my CID start with <code>bafkrei</code> instead of <code>Qm</code>?</strong></summary>

Because you are generating a CIDv1 with the `raw` codec. `Qm...` addresses are always CIDv0 with the `dag-pb` codec. Pass `'v0'` to the constructor if you need the old format.

</details>

<details>
<summary><strong>Can I hash a file larger than RAM?</strong></summary>

Not with this class. It requires the full `Uint8Array` in memory. For large files, use a chunker such as `ipfs-unixfs-importer`.

</details>

<details>
<summary><strong>Why does <code>generate()</code> return a Promise if there is no I/O?</strong></summary>

Because `sha256.digest()` from `multiformats` is asynchronous. In a browser, it can delegate to `SubtleCrypto`, which is always async. The API stays consistent across environments.

</details>
