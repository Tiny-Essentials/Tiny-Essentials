# 🦋 BlueSky (AT Protocol) URI Toolkit

> A dependency-free toolkit for parsing and rebuilding BlueSky URIs — handles,
> DIDs, AT URIs, `bsky.app` permalinks and hashtags — with strict runtime
> validation.

---

## 📖 Table of Contents

1. [Overview](#-overview)
2. [Installation](#-installation)
3. [Core Concepts](#-core-concepts)
4. [Parsers](#-parsers)
   - [Handle](#-handle)
   - [DID](#-did)
   - [AT URI](#-at-uri)
   - [Web URL](#-web-url)
   - [Hashtag](#-hashtag)
5. [Combined registry](#-combined-registry)

---

## 🎯 Overview

This module plugs BlueSky into the generic `TinyUriParser` engine. It exports
five ready-to-use `ParserPair`s plus a pre-sorted `BlueSkyProtocolParsers`
array:

| Export | `type` | Example |
| --- | --- | --- |
| `BlueSkyHandleParser` | `handle` | `@alice.bsky.social` |
| `BlueSkyDidParser` | `did` | `did:plc:abc123` |
| `BlueSkyAtUriParser` | `at_uri` | `at://did:plc:abc/app.bsky.feed.post/1` |
| `BlueSkyWebUrlParser` | `web_url` | `https://bsky.app/profile/alice.bsky.social` |
| `BlueSkyHashtagParser` | `hashtag` | `#javascript` |

Every parser validates its own output and throws `TypeError` (wrong shape) or
`SyntaxError` (wrong grammar). `parse()` never returns a partially populated
object.

---

## 📦 Installation

```js
import TinyUriParser from 'tiny-essentials/libs/tools/TinyUriParser';
import { BlueSkyProtocolParsers } from 'tiny-essentials/libs/tools/TinyUriParser/BlueSky';

const parser = new TinyUriParser(...BlueSkyProtocolParsers);
```

---

## 🧩 Core Concepts

Every parser follows the `ParserPair` contract from `TinyUriParser`:

```js
[type, checker, parser, stringify]
```

`parser.parse(uri)` returns `{ type, data }`, and `parser.stringify(parsed)`
rebuilds the canonical string.

---

## 🔧 Parsers

### 🏷️ Handle

Parses `@alice.bsky.social` (the `@` is optional) and decomposes the DNS name.

```js
parser.parse('@alice.bsky.social');
// {
//   type: 'handle',
//   data: {
//     dataType: 'handle',
//     handle: 'alice.bsky.social',
//     labels: ['alice', 'bsky', 'social'],
//     labelCount: 3,
//     tld: 'social',
//     domain: 'bsky.social',
//     subdomain: 'alice',
//     isBskyHosted: true,
//     isCustomDomain: false
//   }
// }
```

| Field | Type | Description |
| --- | --- | --- |
| `handle` | `string` | Normalized (lowercase) handle, without `@`. |
| `labels` | `string[]` | DNS labels, in order. |
| `labelCount` | `number` | Number of DNS labels. |
| `tld` | `string` | The last label. |
| `domain` | `string` | Best-effort registrable domain (last two labels). |
| `subdomain` | `string \| null` | Everything before the registrable domain. |
| `isBskyHosted` | `boolean` | Whether the handle ends with `bsky.social`. |
| `isCustomDomain` | `boolean` | The logical inverse of `isBskyHosted`. |

---

### 🆔 DID

Parses `did:plc:…` and `did:web:…`.

```js
parser.parse('did:plc:abc123');
// {
//   type: 'did',
//   data: {
//     dataType: 'did',
//     method: 'plc',
//     identifier: 'abc123',
//     domain: null,
//     port: null,
//     pathSegments: []
//   }
// }
```

For `did:web`, the identifier is decoded into `domain`, `port` and
`pathSegments`:

```js
parser.parse('did:web:example.com%3A3000:user:alice');
// data.domain === 'example.com'
// data.port === 3000
// data.pathSegments === ['user', 'alice']
```

---

### 🔗 AT URI

Parses `at://<authority>/<collection>/<rkey>`.

```js
parser.parse('at://did:plc:abc/app.bsky.feed.post/3jkl');
// {
//   type: 'at_uri',
//   data: {
//     dataType: 'at_uri',
//     authority: 'did:plc:abc',
//     authorityType: 'did',
//     collection: 'app.bsky.feed.post',
//     collectionParts: ['app', 'bsky', 'feed', 'post'],
//     rkey: '3jkl'
//   }
// }
```

`authorityType` is `'did'` when the authority starts with `did:`, and
`'handle'` otherwise.

---

### 🌐 Web URL

Parses `https://bsky.app/profile/...` permalinks and resolves the actor and the
equivalent AT URI.

```js
parser.parse('https://bsky.app/profile/alice.bsky.social/post/3jkl');
// {
//   type: 'web_url',
//   data: {
//     dataType: 'web_url',
//     kind: 'post',
//     rkey: '3jkl',
//     actorType: 'handle',
//     actor: { /* BlueSkyHandleData */ },
//     atUri: { /* BlueSkyAtUriData */ }
//   }
// }
```

| `kind` | URL shape |
| --- | --- |
| `''` | `/profile/<actor>` (profile) |
| `'post'` | `/profile/<actor>/post/<rkey>` |
| `'feed'` | `/profile/<actor>/feed/<rkey>` |
| `'lists'` | `/profile/<actor>/lists/<rkey>` |

`atUri` is `null` for a profile URL and a parsed AT URI otherwise.

---

### #️⃣ Hashtag

Parses `#javascript`. The first character must be a letter, followed by letters,
digits or underscores.

```js
parser.parse('#javascript');
// { type: 'hashtag', data: { dataType: 'hashtag', tag: 'javascript' } }
```

---

## 📦 Combined registry

`BlueSkyProtocolParsers` is a frozen array ordered from the most specific parser
to the most permissive:

```js
import { BlueSkyProtocolParsers } from 'tiny-essentials/libs/tools/TinyUriParser/BlueSky';

const parser = new TinyUriParser(...BlueSkyProtocolParsers);

const parsed = parser.parse('https://bsky.app/profile/alice.bsky.social');
parser.stringify(parsed); // 'https://bsky.app/profile/alice.bsky.social'
```

> ⚠️ **Order matters.** Always spread `BlueSkyProtocolParsers` as-is. A more
> permissive parser placed first would swallow input that belongs to a more
> specific one.
