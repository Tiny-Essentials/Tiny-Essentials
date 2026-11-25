# 🦋 BlueSky Pattern Templates

> A small, frozen catalog of **regular-expression templates** that describe the
> BlueSky / AT Protocol identifiers: handles, DIDs, AT URIs and hashtags.

This module contains **no logic**. It is a frozen, plain-object registry. All the
intelligence lives in the engine (`regexp/Username`); this file only declares
*what* a BlueSky artifact looks like.

---

## 📌 What is this file?

`BlueSky` is a **data-only module**. It exports a single frozen object:

```javascript
import BlueSkyRegex from 'tiny-essentials/regexp/Username/templates/BlueSky';

BlueSkyRegex.handle;
// { prefix: '@', validValues: '[a-zA-Z0-9-]', length: [1, 63], domainPattern: '(?:\\.[a-zA-Z0-9-]+)+' }
```

Each key is a **`UsernameRegexTemplate`** — a plain object that the engine
translates into a `RegExp`. Nothing is compiled until you call the engine.

**Use it when you need to:**

- ✅ Validate that a string is a real BlueSky handle or DID.
- ✅ Extract handles and hashtags from a post before rendering it.
- ✅ Detect AT URIs and `bsky.app` permalinks in user content.
- ✅ Build a syntax highlighter for BlueSky-flavoured text.

**Do not use it for:** authentication or authorization. A regex proves *shape*,
never *identity* — always resolve a DID through the AT Protocol.

---

## 📚 Template Catalog

| Key | Matches | Example |
| --- | --- | --- |
| `handle` | User handle | `@alice.bsky.social` |
| `did` | Decentralized Identifier | `did:plc:1234567890abcdefghi` |
| `atUri` | AT URI pointing to a record | `at://did:plc:abc/app.bsky.feed.post/3jkl` |
| `hashtag` | Hashtag | `#javascript` |

### `handle`

Matches a handle with an optional leading `@`. The domain part accepts any number
of DNS labels, so both `alice.bsky.social` and `alice.example.com` are valid.

### `did`

Matches the `did:` scheme. The `validValues`/`length` pair captures the method
(`plc` or `web`) and the domain pattern captures the method-specific identifier.

### `atUri`

Matches an AT URI. The authority may be a DID or a handle; the domain pattern
captures the collection NSID and the record key.

### `hashtag`

Matches a standard hashtag. The first character must be a letter, followed by
letters, digits or underscores.

---

## 🚀 Quick Start

```javascript
import UsernameRegex from 'tiny-essentials/regexp/Username';
import { BlueSkyRegex } from 'tiny-essentials/regexp/Username';

const handle = UsernameRegex.build(BlueSkyRegex.handle);
handle.test('@alice.bsky.social'); // true
handle.test('alice'); // false
```

---

## 🧪 Testing Cheatsheet

| Input | `handle` | `did` | `atUri` | `hashtag` |
| --- | :---: | :---: | :---: | :---: |
| `@alice.bsky.social` | ✅ | ❌ | ❌ | ❌ |
| `did:plc:abc123` | ❌ | ✅ | ❌ | ❌ |
| `at://did:plc:abc/app.bsky.feed.post/1` | ❌ | ❌ | ✅ | ❌ |
| `#javascript` | ❌ | ❌ | ❌ | ✅ |

---

## 📖 References

- [AT Protocol — Handles](https://atproto.com/specs/handle)
- [AT Protocol — DIDs](https://atproto.com/specs/did)
- [AT Protocol — AT URI](https://atproto.com/specs/at-uri-scheme)
