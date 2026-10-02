# 🧩 Matrix Protocol Regex Templates

> A battle-tested collection of Regular Expression templates for parsing
> [Matrix](https://matrix.org) identifiers: users, rooms, events, groups,
> permalinks, URIs, HTML mentions, and media URIs.

---

## 📖 Table of Contents

- [What is this?](#-what-is-this)
- [Template Catalog](#-template-catalog)
- [Quick Start](#-quick-start)
- [Testing Cheatsheet](#-testing-cheatsheet)
- [References](#-references)

---

## 🎯 What is this?

`MatrixProtocol` is a **pure data module**. It does not export functions.
It exports a single frozen object where every key is a **template** that
describes *one* Matrix identifier shape.

The heavy lifting (turning a template into a `RegExp`) is done by the
sibling module. Think of it like this:

```
tiny-essentials/regexp/Username/templates/MatrixProtocol   →   the recipe   (what a Matrix ID looks like)
tiny-essentials/regexp/Username                            →   the chef     (turns the recipe into a RegExp)
```

**Why split it?** Because a template is data. Data can be serialized,
snapshotted, diffed in code review, and reused across runtimes. A raw
`RegExp` literal cannot.

---

## 📚 Template Catalog

| Key | Matches | Example |
| --- | --- | --- |
| `userName` | User ID | `@alice:matrix.org` |
| `roomName` | Room alias | `#general:matrix.org` |
| `roomId` | Room ID | `!AbCdEf:matrix.org` |
| `eventId` | Event ID (v1–v3+) | `$abc123:matrix.org` |
| `groupId` | Legacy group / space | `+mygroup:matrix.org` |
| `matrixToLink` | `matrix.to` permalink | `https://matrix.to/#/@alice:matrix.org` |
| `matrixUri` | RFC 8922 URI | `matrix:u/alice:matrix.org` |
| `htmlMention` | HTML anchor mention | `<a href="https://matrix.to/#/@alice:matrix.org">Alice</a>` |
| `mxcUri` | Media content URI | `mxc://matrix.org/AbC123` |

---

## 🚀 Quick Start

### 1. Import the template you need

```javascript
import MatrixProtocolRegex from 'tiny-essentials/regexp/Username/templates/MatrixProtocol';
import { isValidUsername, usernameRegex, findUsernameRegex, extractUsernames } from 'tiny-essentials/regexp/Username';
```

### 2. Validate a single identifier

```javascript
import { isValidUsername } from 'tiny-essentials/regexp/Username';
import MatrixProtocolRegex from 'tiny-essentials/regexp/Username/templates/MatrixProtocol';

isValidUsername('@alice:matrix.org', MatrixProtocolRegex.userName);
// => true

isValidUsername('@Alice:matrix.org', MatrixProtocolRegex.userName);
// => false  (Matrix user IDs are lowercase-only)
```

### 3. Extract every Matrix ID from a wall of text

```javascript
import { extractUsernames } from 'tiny-essentials/regexp/Username';
import MatrixProtocolRegex from 'tiny-essentials/regexp/Username/templates/MatrixProtocol';

const message = `
  Hey, ping @alice:matrix.org or join #general:matrix.org
  Docs: https://matrix.to/#/@bob:example.com
`;

extractUsernames(message, [
  MatrixProtocolRegex.userName,
  MatrixProtocolRegex.roomName,
  MatrixProtocolRegex.matrixToLink,
]);
// => [
//   '@alice:matrix.org',
//   '#general:matrix.org',
//   'https://matrix.to/#/@bob:example.com'
// ]
```

---

## 🧪 Testing Cheatsheet

A quick table of inputs and their expected results, ready to be turned
into a test suite.

| Template | Input | Valid? |
| --- | --- | --- |
| `userName` | `@alice:matrix.org` | ✅ |
| `userName` | `@Alice:matrix.org` | ❌ uppercase |
| `userName` | `@alice:localhost` | ❌ no TLD |
| `roomName` | `#General:matrix.org` | ✅ |
| `roomId` | `!AbC-123:matrix.org` | ✅ |
| `eventId` | `$AbC123` | ✅ |
| `eventId` | `$AbC123:matrix.org` | ✅ |
| `groupId` | `+mygroup:matrix.org` | ✅ |
| `matrixToLink` | `https://matrix.to/#/@a:b.org` | ✅ |
| `matrixToLink` | `matrix.to/#/@a:b.org` | ✅ |
| `matrixUri` | `matrix:u/alice:matrix.org` | ✅ |
| `matrixUri` | `matrix:roomid/abc:matrix.org` | ✅ |
| `mxcUri` | `mxc://matrix.org/AbC123` | ✅ |
| `mxcUri` | `mxc://matrix.org/` | ❌ empty media ID |

---

## 🔗 References

- [Matrix Identifier Grammar](https://spec.matrix.org/latest/appendices/#identifier-grammar)
- [Matrix Client-Server API](https://spec.matrix.org/latest/client-server-api/)
- [RFC 8922 — The `matrix:` URI Scheme](https://www.rfc-editor.org/rfc/rfc8922)
- [matrix.to](https://matrix.to) — Permalink resolver
