# 📬 TinyPushManager

> A tiny, framework-agnostic, zero-dependency wrapper around the browser **Push API**.
> It owns the full `PushSubscription` lifecycle and keeps your backend in sync.

[![No dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](#-installation)
[![Module](https://img.shields.io/badge/module-ESM-blue)](#-installation)
[![License](https://img.shields.io/badge/license-MIT-black)](#-license)

---

## 📖 Table of Contents

- [What is this?](#-what-is-this)
- [Mental model](#-mental-model)
- [Installation](#-installation)
- [Quick start](#-quick-start)
- [The two files you must not forget](#-the-two-files-you-must-not-forget)
- [API reference](#-api-reference)
  - [Static members](#static-members)
  - [Instance members](#instance-members)
  - [State machine](#-state-machine)
  - [Type definitions](#-type-definitions)
- [Recipes](#-recipes)
  - [Vanilla JS](#recipe-1--vanilla-js)
  - [React hook](#recipe-2--react-hook)
  - [Service worker](#recipe-3--service-worker)
  - [Backend contract](#recipe-4--backend-contract)
- [Security checklist](#-security-checklist)
- [Apache2 reverse proxy](#-apache2-reverse-proxy)
- [Troubleshooting](#-troubleshooting)
- [Testing](#-testing)

---

## ✨ What is this?

`TinyPushManager` is a single class that answers one question:

> *"Is this browser subscribed to push notifications, and how do I keep my
> backend in sync with that answer?"*

It does **not** talk to a push service. It never touches FCM, Mozilla
autopush or APNs. It delegates:

| Responsibility | Delegated to |
| --- | --- |
| Asking the user for permission | `Notification.requestPermission()` |
| Creating / destroying the subscription | `PushManager` |
| Persisting the subscription | **Your** `POST` / `DELETE` endpoints |
| Rendering the notification | **Your** service worker |

That is the whole point: the manager is a thin, testable, observable state
machine on top of a very stateful browser API.

---

## 🧠 Mental model

```
  ┌───────────────┐
  │    Your UI    │
  └───────┬───────┘
          │ 1. subscribe() / unsubscribe()
          ▼
  ┌───────────────────────┐   2. PushManager.subscribe()
  │    TinyPushManager    │──────────────────────────────▶ 🌐 Browser
  │  (page context only)  │◀──────────────────────────────
  └───────┬───────────────┘   3. PushSubscription
          │
          │ 4. POST /api/push   (your backend)
          ▼
  ┌───────────────┐
  │  Your server  │──── 5. web-push / FCM ──▶ 📱 Device
  └───────────────┘
```

**Golden rule:** the browser is the source of truth for the subscription.
Your backend is a *replica*. When they disagree, the browser wins — that is
what `syncWithServer()` is for.

---

## 📦 Installation

The manager is a single ES module with **zero runtime dependencies**.

```text
src/
├── push/
│   ├── tiny-push-manager.mjs   # 👈 the class documented here
│   └── utils.mjs               # exports requestNotificationPermission()
└── utils.mjs                   # exports PUSH_TYPE
```

```js
import TinyPushManager from 'tiny-essentials/libs/sw/browser/TinyPushManager';
```

> 📌 **Assumption:** `PUSH_TYPE` is a project constant
> re-exported as `TinyPushManager.PUSH_TYPE`. It is meant to be shared with the
> service worker so both sides agree on the payload shape.

---

## 🚀 Quick start

```js
import TinyPushManager from 'tiny-essentials/libs/sw/browser/TinyPushManager';

// 1. Fail fast with a friendly message.
if (!TinyPushManager.isSupported()) {
  console.warn('Push notifications are not available in this browser.');
}

// 2. Create one manager per page.
const push = new TinyPushManager({
  registration: await navigator.serviceWorker.ready,
  vapidPublicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
  endpoints: {
    subscribe: '/api/push',
    unsubscribe: '/api/push',
  },
  onChange: (state) => {
    document.body.dataset.pushStatus = state.status;
  },
});

// 3. Subscribe. Must be called from a user gesture on iOS Safari.
document.querySelector('#notify-me').addEventListener('click', async () => {
  try {
    await push.subscribe();
  } catch (error) {
    console.error(error.message);
  }
});
```

---

## 🧩 The two files you must not forgetZ

`TinyPushManager.requestPermission()` is a thin, testable wrapper. Keep the
browser call isolated so it can be mocked:

```js
/**
 * Requests the notification permission from the user.
 *
 * @returns {Promise<NotificationPermission>} The resulting permission.
 */
export async function requestNotificationPermission() {
  return Notification.requestPermission();
}
```

### 2. `sw.js` — the service worker

The manager never renders a notification. If your service worker does not call
`showNotification()`, Chrome will show a generic "This site has been updated in
the background" message and may revoke the subscription.

```js
self.addEventListener('push', (event) => {
  const payload = event.data ? event.data.json() : {};

  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'New message', {
      body: payload.body ?? '',
      icon: '/icons/icon-192.png',
      data: { url: payload.url ?? '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(event.notification.data.url));
});
```

---

## 📚 API reference

### Static members

#### `TinyPushManager.PUSH_TYPE` — `*` *(read-only)*

The push payload discriminator. Use it in the
service worker to ignore messages that are not yours.

```js
if (payload.type !== PUSH_TYPE) return;
```

---

#### `TinyPushManager.isSupported()` → `boolean`

Returns `true` only when **all** of the following are true:

- `navigator.serviceWorker` exists,
- `PushManager` exists on `globalThis`,
- `Notification` exists on `globalThis`.

```js
if (!TinyPushManager.isSupported()) {
  // Hide the "Enable notifications" button entirely.
}
```

---

#### `TinyPushManager.permission` → `NotificationPermission`

A **synchronous** getter for the current permission. Returns `'denied'` when
the Push API is unsupported, so you can always render it safely.

```js
switch (TinyPushManager.permission) {
  case 'granted':
    break;
  case 'denied':
    renderBlockedBanner();
    break;
  default:
    renderOptInButton();
}
```

---

#### `TinyPushManager.requestPermission()` → `Promise<NotificationPermission>`

| | |
| --- | --- |
| **Returns** | The resulting permission. |
| **Throws** | `Error` when the Push API is not supported. |

> ⚠️ On iOS Safari this **must** be called from a user gesture, otherwise the
> promise resolves to `'denied'` and the user never sees a prompt.

---

#### `TinyPushManager.decodeVapidKey(base64)` → `BufferSource`

Decodes a Base64 **URL-safe** VAPID public key into a `Uint8Array`.
The result is **memoized**: calling it twice with the same string returns the
exact same `Uint8Array` instance.

| Parameter | Type | Description |
| --- | --- | --- |
| `base64` | `string` | A non-empty Base64 URL-safe VAPID public key. |

| | |
| --- | --- |
| **Returns** | `BufferSource` — the decoded key. |
| **Throws** | `TypeError` if `base64` is not a non-empty string. |
| **Throws** | `DOMException` (`InvalidCharacterError`) if the key is not valid Base64. |

```js
const key = TinyPushManager.decodeVapidKey(process.env.VAPID_PUBLIC_KEY);
console.log(key instanceof Uint8Array); // true
```

---

### Instance members

#### `new TinyPushManager(options)`

| Option | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `registration` | `ServiceWorkerRegistration` | ✅ | — | The active registration. |
| `vapidPublicKey` | `string` | ✅ | — | Base64 URL-safe VAPID **public** key. |
| `endpoints` | `TinyPushEndpoints` | ❌ | `{}` | Backend routes. |
| `fetch` | `typeof fetch` | ❌ | `globalThis.fetch` | Injectable for tests. |
| `onChange` | `(state: TinyPushState) => void` | ❌ | `null` | State observer. |

**Throws** `TypeError` if `options` is not a plain object, if `registration` is
not an object, if `vapidPublicKey` is not a non-empty string, if
`endpoints.subscribe` / `endpoints.unsubscribe` are not strings, or if
`onChange` is not a function.

```js
const push = new TinyPushManager({
  registration: await navigator.serviceWorker.ready,
  vapidPublicKey: VAPID_PUBLIC_KEY,
  endpoints: { subscribe: '/api/push', unsubscribe: '/api/push' },
  onChange: ({ status, error }) => console.log(status, error),
});
```

---

#### `get state` → `TinyPushState`

A **frozen** snapshot of the current state. Mutating it does nothing.

```js
const { status, subscription, error } = push.state;
```

---

#### `getSubscription()` → `Promise<PushSubscription | null>`

Reads the subscription from the browser. Returns `null` when the Push API is
unsupported. **Does not** hit your backend and **does not** change the state.

```js
const subscription = await push.getSubscription();
if (subscription) {
  console.log(subscription.endpoint);
}
```

---

#### `subscribe(options?)` → `Promise<PushSubscription>`

The main entry point. Performs, in order:

1. Throws if the Push API is unsupported.
2. Sets `status` to `'pending'`.
3. Requests the notification permission.
4. Sets `status` to `'denied'` and throws if not granted.
5. Reuses the existing subscription, or creates a new one.
6. Uploads it to `endpoints.subscribe` (if configured).
7. Sets `status` to `'subscribed'`.

| Parameter | Type | Description |
| --- | --- | --- |
| `options` | `PushSubscriptionOptionsInit` | Merged into `pushManager.subscribe()`. |

> 🔒 `userVisibleOnly: true` and `applicationServerKey` are **always** forced
> by the manager and cannot be overridden.

| | |
| --- | --- |
| **Returns** | The active `PushSubscription`. |
| **Throws** | `Error` if unsupported, denied, or if the upload fails. |

```js
try {
  const subscription = await push.subscribe();
  console.log('Subscribed:', subscription.endpoint);
} catch (error) {
  console.error('Could not subscribe:', error.message);
}
```

---

#### `unsubscribe()` → `Promise<boolean>`

1. Deletes the subscription on the backend (fire-and-forget, errors swallowed).
2. Calls `PushSubscription.unsubscribe()`.
3. Sets `status` to `'unsubscribed'`.

| | |
| --- | --- |
| **Returns** | `true` when a subscription was removed, `false` otherwise. |

> 🧯 Backend errors are **intentionally ignored**. A user must always be able to
> unsubscribe locally, even when the network is down. Reconcile later with a
> cron job that prunes `410 Gone` endpoints.

```js
const removed = await push.unsubscribe();
```

---

#### `syncWithServer()` → `Promise<PushSubscription | null>`

Re-uploads the current subscription. Call it:

- after a `pushsubscriptionchange` event,
- after the user logs in on a new device,
- when your backend lost its database.

| | |
| --- | --- |
| **Returns** | The refreshed subscription, or `null` if there is none. |

```js
await push.syncWithServer();
```

---

### 🔄 State machine

```
                    ┌────────────────┐
                    │  unsubscribed  │◀──────────────┐
                    └───────┬────────┘               │
                            │ subscribe()            │
                            ▼                        │
                    ┌────────────────┐               │
                    │    pending     │               │
                    └───┬────────┬───┘               │
             granted    │        │    denied         │
                        ▼        ▼                   │
              ┌──────────────┐  ┌──────────┐         │
              │  subscribed  │  │  denied  │         │
              └──────┬───────┘  └──────────┘         │
                     │ unsubscribe()                  │
                     └────────────────────────────────┘
```

| From | Call | To | Notes |
| --- | --- | --- | --- |
| `unsubscribed` | `subscribe()` | `pending` → `subscribed` | Happy path. |
| `unsubscribed` | `subscribe()` | `pending` → `denied` | Throws. |
| `subscribed` | `unsubscribe()` | `unsubscribed` | Returns `true`. |
| `unsubscribed` | `unsubscribe()` | `unsubscribed` | Returns `false`. |
| `subscribed` | `syncWithServer()` | `subscribed` | Re-uploads. |
| any | `subscribe()` + upload failure | `pending` | ⚠️ See [gotchas](#-known-gotchas). |

---

### 🧾 Type definitions

#### `TinyPushEndpoints`

| Property | Type | Description |
| --- | --- | --- |
| `subscribe` | `string \| undefined` | `POST` route that persists a subscription. |
| `unsubscribe` | `string \| undefined` | `DELETE` route that removes a subscription. |

#### `TinyPushManagerOptions`

| Property | Type | Description |
| --- | --- | --- |
| `registration` | `ServiceWorkerRegistration` | The active registration. |
| `vapidPublicKey` | `string` | Base64 URL-safe VAPID public key. |
| `endpoints` | `TinyPushEndpoints \| undefined` | Backend routes. |
| `fetch` | `typeof fetch \| undefined` | Injectable for tests. |
| `onChange` | `((state: TinyPushState) => void) \| undefined` | State observer. |

#### `TinyPushState`

| Property | Type | Description |
| --- | --- | --- |
| `status` | `'unsupported' \| 'unsubscribed' \| 'subscribed' \| 'denied' \| 'pending'` | Current status. |
| `subscription` | `PushSubscription \| null` | The active subscription, when any. |
| `error` | `string \| null` | The last error message, when any. |

---

## 🍳 Recipes

### Recipe 1 — Vanilla JS

```js
const push = new TinyPushManager({
  registration: await navigator.serviceWorker.ready,
  vapidPublicKey: VAPID_PUBLIC_KEY,
  endpoints: { subscribe: '/api/push', unsubscribe: '/api/push' },
  onChange: ({ status }) => {
    button.disabled = status === 'pending';
    button.textContent = status === 'subscribed' ? 'Disable' : 'Enable';
  },
});

button.addEventListener('click', async () => {
  const isSubscribed = push.state.status === 'subscribed';
  await (isSubscribed ? push.unsubscribe() : push.subscribe());
});
```

---

### Recipe 2 — React hook

```jsx
import { useCallback, useEffect, useRef, useState } from 'react';
import TinyPushManager from 'tiny-essentials/libs/sw/browser/TinyPushManager';

/**
 * @typedef {Object} UsePushResult
 * @property {import('tiny-essentials/libs/sw/browser/TinyPushManager').TinyPushState} state - The manager state.
 * @property {boolean} isSupported - Whether the Push API is available.
 * @property {() => Promise<void>} toggle - Subscribes or unsubscribes.
 */

/**
 * Binds a `TinyPushManager` instance to a React component.
 *
 * @param {Object} options - The hook options.
 * @param {string} options.vapidPublicKey - The VAPID public key.
 * @param {string} options.endpoint - The backend route for both verbs.
 * @returns {UsePushResult} The current state and the toggle callback.
 */
export function usePush({ vapidPublicKey, endpoint }) {
  const managerRef = useRef(null);
  const [state, setState] = useState({
    status: 'unsubscribed',
    subscription: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    navigator.serviceWorker.ready.then((registration) => {
      if (cancelled) return;

      managerRef.current = new TinyPushManager({
        registration,
        vapidPublicKey,
        endpoints: { subscribe: endpoint, unsubscribe: endpoint },
        onChange: setState,
      });

      setState(managerRef.current.state);
    });

    return () => {
      cancelled = true;
    };
  }, [vapidPublicKey, endpoint]);

  const toggle = useCallback(async () => {
    const manager = managerRef.current;
    if (!manager) return;

    if (manager.state.status === 'subscribed') {
      await manager.unsubscribe();
    } else {
      await manager.subscribe();
    }
  }, []);

  return { state, isSupported: TinyPushManager.isSupported(), toggle };
}
```

---

### Recipe 3 — Service worker

Handle `pushsubscriptionchange` so a rotated endpoint never goes stale:

```js
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      const subscription = await self.registration.pushManager.subscribe(
        event.oldSubscription.options,
      );

      await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription.toJSON()),
      });
    })(),
  );
});
```

---

### Recipe 4 — Backend contract

#### `POST /api/push`

```jsonc
// Request
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/abc123",
  "expirationTime": null,
  "keys": {
    "p256dh": "BNc...",
    "auth": "k9F..."
  }
}
```

| Status | Meaning |
| --- | --- |
| `201` | Subscription stored. |
| `400` | Malformed body. |
| `401` | Not authenticated. |
| `429` | Rate limited. |

#### `DELETE /api/push`

```jsonc
{ "endpoint": "https://fcm.googleapis.com/fcm/send/abc123" }
```

| Status | Meaning |
| --- | --- |
| `204` | Removed (idempotent). |
| `400` | Malformed body. |
| `401` | Not authenticated. |

---

## 🔒 Security checklist

The manager handles the **browser** half. The backend half is on you.

- [ ] **Authenticate both routes.** A session cookie plus a CSRF token, or a
      short-lived Bearer token. An unauthenticated `POST /api/push` is an open
      relay.
- [ ] **Never trust a `userId` in the body.** Derive the owner from the session
      and store `(user_id, endpoint)` with a `UNIQUE` constraint.
- [ ] **Validate the endpoint URL.** Reject anything that is not `https:`:

  ```js
  const url = new URL(req.body.endpoint);
  if (url.protocol !== 'https:') {
    return res.status(400).json({ error: 'Invalid endpoint.' });
  }
  ```

- [ ] **Never `fetch()` a client-supplied endpoint** without an allowlist.
  That is a Server-Side Request Forgery (SSRF) vector.
- [ ] **Rate limit** by session and by IP. Subscribing is cheap; spamming is not.
- [ ] **Keep the VAPID private key server-side only.** Only the public key
      reaches the browser, and it is not a secret.
- [ ] **Prune dead subscriptions.** When a push returns `404` or `410`, delete
      the row.
- [ ] **Serve over HTTPS.** Service workers require a secure context
      (`localhost` is the only exception).
- [ ] **Add a Content-Security-Policy** that allows your API origin:

  ```http
  Content-Security-Policy: default-src 'self'; connect-src 'self' https://api.example.com
  ```

---

## 🪶 Apache2 reverse proxy

Enable the required modules once:

```bash
sudo a2enmod proxy proxy_http headers ssl
sudo systemctl reload apache2
```

```apache
<VirtualHost *:443>
    ServerName app.example.com

    SSLEngine on
    SSLCertificateFile      /etc/letsencrypt/live/app.example.com/fullchain.pem
    SSLCertificateKeyFile   /etc/letsencrypt/live/app.example.com/privkey.pem

    # The service worker must never be served from a stale cache.
    <Files "sw.js">
        Header always set Cache-Control "no-cache, no-store, must-revalidate"
    </Files>

    # The push API must never be cached by an intermediary.
    <Location "/api/push">
        Header always set Cache-Control "no-store"
        Require all granted
    </Location>

    ProxyPreserveHost On
    RequestHeader set X-Forwarded-Proto "https"

    ProxyPass        /api/ http://127.0.0.1:3000/api/
    ProxyPassReverse /api/ http://127.0.0.1:3000/api/

    ProxyPass        /     http://127.0.0.1:5173/
    ProxyPassReverse /     http://127.0.0.1:5173/

    Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains"
    Header always set X-Content-Type-Options "nosniff"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</VirtualHost>
```

---

## 🩺 Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `Push API is not supported in this browser.` | No service worker, no `PushManager`, or an insecure context. | Serve over HTTPS. |
| `Notification permission was not granted: denied.` | The user blocked notifications. | Reset the permission in the site settings. |
| `Failed to upload subscription: 401.` | The session expired between page load and the click. | Re-authenticate, then call `syncWithServer()`. |
| `TypeError: decodeVapidKey: base64 must be a non-empty string.` | The VAPID key is `undefined`. | Check your environment variable at build time. |
| `InvalidCharacterError` from `atob`. | You passed the **private** key, or a PEM file. | Use the Base64 URL-safe **public** key. |
| `AbortError: Registration failed - permission denied`. | `subscribe()` was called without a user gesture. | Wrap it in a `click` handler. |
| The state is stuck on `'pending'`. | `#upload()` threw. | See [gotchas](#-known-gotchas). |
| The notification never appears. | The service worker does not call `showNotification()`. | See [the service worker recipe](#recipe-3--service-worker). |

---

## ⚠️ Known gotchas

### 1. A failed upload leaves the state on `'pending'`

`subscribe()` sets `status: 'pending'` **before** awaiting the backend. If
`#upload()` throws, the error propagates and the state is never advanced.

```js
try {
  await push.subscribe();
} catch (error) {
  // The browser IS subscribed, but the backend does not know yet.
  // Retry the upload without asking for permission again:
  await push.syncWithServer();
}
```

### 2. `isSupported()` throws in Node.js < 21

The guard is `'serviceWorker' in navigator`. In a server-side rendering
environment where `navigator` is not defined at all, this throws a
`ReferenceError` before the check can return `false`.

```js
// Safe guard for SSR:
const canUsePush = typeof window !== 'undefined' && TinyPushManager.isSupported();
```

### 3. `decodeVapidKey()` caches exactly one key

The memoization stores a single `(source, key)` pair. If you rotate keys at
runtime, the first call after the rotation is a cache miss, which is correct —
just be aware that it is not an LRU cache.

### 4. `unsubscribe()` swallows backend errors

This is deliberate. A user must always be able to unsubscribe locally. Schedule
a reconciliation job to delete orphaned rows.

### 5. `syncWithServer()` is a no-op when there is no subscription

It returns `null` and does **not** reset the state. If you need a hard reset,
recreate the manager.

---

## 🧪 Testing

Inject `fetch` to test without a network:

```js
import { describe, expect, it, vi } from 'vitest';
import TinyPushManager from 'tiny-essentials/libs/sw/browser/TinyPushManager';

describe('TinyPushManager', () => {
  it('throws when the VAPID key is missing', () => {
    expect(
      () => new TinyPushManager({ registration: {}, vapidPublicKey: '' }),
    ).toThrow(TypeError);
  });

  it('uploads the subscription on subscribe()', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201 });
    const subscription = { toJSON: () => ({ endpoint: 'https://push.test/1' }) };

    const manager = new TinyPushManager({
      registration: {
        pushManager: { getSubscription: vi.fn().mockResolvedValue(subscription) },
      },
      vapidPublicKey: 'AAAA',
      endpoints: { subscribe: '/api/push' },
      fetch: fetchMock,
    });

    await manager.syncWithServer();

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/push',
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
```
