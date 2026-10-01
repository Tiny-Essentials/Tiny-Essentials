# 📬 TinyPushPayload

> A tiny, isomorphic contract for **Web Push** messages. 🚀
> One single source of truth shared between your **Service Worker** and your **page**.

[![Version](https://img.shields.io/badge/schema-v1-blue)](#-versioning)
[![Module](https://img.shields.io/badge/module-ESM-green)](#-installation)
[![License](https://img.shields.io/badge/license-MIT-lightgrey)](#)

---

## 📖 Table of Contents

1. [What is this?](#-what-is-this)
2. [Why it exists](#-why-it-exists)
3. [Installation](#-installation)
4. [Core concepts](#-core-concepts)
5. [API Reference](#-api-reference)
   - [`TinyPushPayload.VERSION`](#-tinypushpayloadversion)
   - [`TinyPushPayload.MAX_TTL`](#-tinypushpayloadmax_ttl)
   - [`TinyPushPayload.PUSH_TYPE`](#-tinypushpayloadpush_type)
   - [`from(raw)`](#-fromraw)
   - [`fromEvent(event)`](#-fromeventevent)
   - [`isExpired(message, now)`](#-isExpiredmessage-now)
   - [`toNotification(message, defaults)`](#-tonotificationmessage-defaults)
6. [Type definitions](#-type-definitions)
8. [Error handling](#-error-handling)
9. [Best practices](#-best-practices)

---

## ✨ What is this?

`TinyPushPayload` is a **stateless utility class** that normalizes, validates and
converts Web Push payloads.

It is **isomorphic on purpose**:

| Environment       | What it does                                                       |
| ----------------- | ------------------------------------------------------------------ |
| 🧑‍💻 **Page**        | Builds and validates the payload *before* it reaches the backend.  |
| ⚙️ **Service Worker** | Parses the incoming `push` event and turns it into a notification. |

Because both sides import the **same file**, the message contract can never
drift out of sync. 🎯

---

## 🧠 Why it exists

Web Push payloads arrive as **untrusted strings** over the network. Anything can
be inside them. This class gives you:

- 🛡️ **Strict validation** — every field is type-checked before use.
- 🧊 **Immutable output** — every returned message is frozen with `Object.freeze`.
- 🔁 **One-shot safe** — reads the `PushMessageData` stream exactly once.
- 🧩 **Zero dependencies** — pure ECMAScript, no runtime libraries.

---

## 📦 Installation

This module is part of the project. Import it with a **relative path** (ESM only):

```javascript
import TinyPushPayload from 'tiny-essentials/libs/sw/service/shared/TinyPushPayload';
```

---

## 🧩 Core concepts

### The message shape

Every message is a plain object that follows the `TinyPushMessage` contract:

```javascript
{
  v: 1,                          // 🔢 schema version
  type: 'order:shipped',        // 🏷️ message type (from PUSH_TYPE)
  id: 'evt_123',                 // 🆔 optional unique id
  topic: 'orders',               // 📁 optional topic
  expiresAt: 1735689600000,      // ⏰ optional expiration (ms)
  ttl: 3600,                     // ⏳ optional TTL (seconds, clamped)
  data: { orderId: 'A1' },       // 📦 optional custom data
  notification: { /* ... */ }    // 🔔 optional notification descriptor
}
```

### The `PUSH_TYPE.UNKNOWN` fallback

If the incoming payload has no valid `type`, the class falls back to
`PUSH_TYPE.UNKNOWN`. This guarantees the `type` field is **never** `undefined`.

---

## 📚 API Reference

### 🔢 `TinyPushPayload.VERSION`

**Type:** `number` — default `1`

The current payload schema version. Used as the fallback for the `v` field.

```javascript
console.log(TinyPushPayload.VERSION); // 1
```

---

### ⏳ `TinyPushPayload.MAX_TTL`

**Type:** `number` — value `2419200` (28 days, in seconds)

The maximum allowed TTL. Any `ttl` above this value is clamped down to it.

```javascript
console.log(TinyPushPayload.MAX_TTL); // 2419200
```

---

### 🏷️ `TinyPushPayload.PUSH_TYPE`

**Type:** `Object` (read-only getter)

A passthrough to the shared `PUSH_TYPE` enum. Handy so consumers do not need a
second import.

```javascript
TinyPushPayload.PUSH_TYPE.UNKNOWN; // 'unknown'
```

---

### 🏗️ `from(raw)`

Normalizes an **untrusted** value into a frozen `TinyPushMessage`.

| Parameter | Type      | Description                       |
| --------- | --------- | --------------------------------- |
| `raw`     | `unknown` | The value received from the wire. |

**Returns:** `TinyPushMessage` — a frozen, normalized message.

**Throws:** `TypeError` if `raw` is not a non-null object or is an array.

```javascript
const message = TinyPushPayload.from({
  type: 'order:shipped',
  ttl: 99999999, // 👈 will be clamped to MAX_TTL
});

console.log(message.ttl); // 2419200
Object.isFrozen(message); // true 🧊
```

**Normalization rules:**

| Field          | Rule                                                       |
| -------------- | ---------------------------------------------------------- |
| `v`            | Kept if `number`, else `VERSION`.                          |
| `type`         | Kept if non-empty string, else `PUSH_TYPE.UNKNOWN`.        |
| `id`           | Kept only if `string`.                                     |
| `topic`        | Kept only if `string`.                                     |
| `expiresAt`    | Kept only if `number`.                                     |
| `ttl`          | Clamped to `[0, MAX_TTL]` and truncated.                   |
| `data`         | Kept only if a non-null, non-array object.                 |
| `notification` | Normalized via the private `#normalizeNotification`.       |

---

### 📥 `fromEvent(event)`

Reads the payload of a `push` event **exactly once**.

> ⚠️ **Why a dedicated method?**
> `PushMessageData` is a **one-shot stream**. Calling `json()` and then `text()`
> throws a `TypeError`. This method reads the body once and parses it manually,
> so you never have to think about it.

| Parameter | Type       | Description             |
| --------- | ---------- | ----------------------- |
| `event`   | `PushEvent`| The native push event.  |

**Returns:** `Promise<TinyPushMessage>` — never `null`.

**Throws:** `TypeError` if `event` is not an object or has no `data` property.

```javascript
self.addEventListener('push', async (event) => {
  const message = await TinyPushPayload.fromEvent(event);
  console.log(message.type);
});
```

**Fallback behavior:**

| Situation                        | Result                                             |
| -------------------------------- | -------------------------------------------------- |
| `event.data` is `null`           | `{ v, type: UNKNOWN }`                             |
| `text()` throws                  | `{ v, type: UNKNOWN }`                             |
| Body is an empty string          | `{ v, type: UNKNOWN }`                             |
| Body is not valid JSON           | `{ v, type: UNKNOWN, notification: { title, body } }` |
| Body is valid JSON               | Parsed via [`from()`](#-fromraw).                  |

---

### ⏰ `isExpired(message, now)`

Checks whether a message is past its expiration time.

| Parameter | Type             | Default      | Description                    |
| --------- | ---------------- | ------------ | ------------------------------ |
| `message` | `TinyPushMessage`| —            | The message to inspect.        |
| `now`     | `number`         | `Date.now()` | Reference time in milliseconds.|

**Returns:** `boolean` — `true` when the message must be discarded.

**Throws:** `TypeError` if `message` is not a non-null object or `now` is not a
finite number.

```javascript
if (TinyPushPayload.isExpired(message)) {
  return; // 🗑️ too late, drop it
}
```

> 💡 A message **without** `expiresAt` is **never** considered expired.

---

### 🔔 `toNotification(message, defaults)`

Converts a message into the `{ title, options }` object expected by
`showNotification`.

| Parameter  | Type                            | Default | Description             |
| ---------- | ------------------------------- | ------- | ----------------------- |
| `message`  | `TinyPushMessage`               | —       | The normalized message. |
| `defaults` | `TinyPushNotificationDefaults`  | `{}`    | Fallback values.        |

**Returns:** `{ title: string, options: NotificationOptions & { data: object } }`

**Throws:** `TypeError` if `message` is not a non-null object.

```javascript
const { title, options } = TinyPushPayload.toNotification(message, {
  defaultIcon: '/icons/default.png',
  defaultUrl: '/',
});

await self.registration.showNotification(title, options);
```

**What lands inside `options.data`:**

| Key        | Source                                             |
| ---------- | -------------------------------------------------- |
| `url`      | `notification.url` → `defaults.defaultUrl` → `'/'` |
| `actions`  | Map of `action → url` built from `notification.actions`. |
| `pushId`   | `message.id`                                       |
| `pushType` | `message.type`                                     |

---

## 🧬 Type definitions

### `TinyPushMessage`

| Property       | Type                     | Required | Description                        |
| -------------- | ------------------------ | -------- | ---------------------------------- |
| `v`            | `number`                 | ✅       | Schema version.                    |
| `type`         | `string`                 | ✅       | Message type.                      |
| `id`           | `string`                 | ❌       | Unique id.                         |
| `topic`        | `string`                 | ❌       | Grouping topic.                    |
| `expiresAt`    | `number`                 | ❌       | Expiration timestamp (ms).         |
| `ttl`          | `number`                 | ❌       | Time-to-live in seconds.           |
| `data`         | `Record<string, unknown>`| ❌       | Custom data.                       |
| `notification` | `TinyPushNotification`   | ❌       | Notification descriptor.           |

### `TinyPushNotificationDefaults`

| Property        | Type     | Description          |
| --------------- | -------- | -------------------- |
| `defaultIcon`   | `string` | Fallback icon.       |
| `defaultBadge`  | `string` | Fallback badge.      |
| `defaultUrl`    | `string` | Fallback click URL.  |

---

## 🚨 Error handling

Every method validates its arguments and throws a **specific** error type:

| Method             | Throws      | When                                          |
| ------------------ | ----------- | --------------------------------------------- |
| `from`             | `TypeError` | `raw` is not a non-null object / is an array. |
| `fromEvent`        | `TypeError` | `event` is not a valid `PushEvent`.          |
| `isExpired`        | `TypeError` | `message` invalid or `now` not finite.        |
| `toNotification`   | `TypeError` | `message` is not a non-null object.           |
| `#normalizeNotification` | `TypeError` | `notification.title` is missing/empty.  |

> 💡 `fromEvent` is the **only** method that never throws for bad payloads — it
> always resolves to a safe `UNKNOWN` message. This is intentional: a malformed
> push must never crash the Service Worker.

---

## ✅ Best practices

- 🧊 **Never mutate** a returned message. It is frozen — use `from()` again.
- 🛡️ **Always validate** on the page *and* on the Service Worker.
- ⏰ **Always check** `isExpired()` before showing a notification.
- 🏷️ **Always handle** `PUSH_TYPE.UNKNOWN` in your `switch` statements.
- 🔢 **Never hardcode** the TTL limit — use `TinyPushPayload.MAX_TTL`.
