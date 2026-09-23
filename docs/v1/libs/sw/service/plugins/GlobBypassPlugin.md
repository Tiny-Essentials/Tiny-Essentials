# 🧩 GlobBypassPlugin

A `TinyServiceWorkerEngine` plugin that skips router validation for requests whose pathname matches a set of glob patterns.

---

## 📖 Table of Contents

- [What is this?](#-what-is-this)
- [Why would I use it?](#-why-would-i-use-it)
- [Quick Start](#-quick-start)
- [How It Works](#-how-it-works)
- [Daily Recipes](#-daily-recipes)
- [Security Notes](#-security-notes)
- [FAQ](#-faq)

---

## 🤔 What is this?

`GlobBypassPlugin` is a plugin for **`TinyServiceWorkerEngine`**.

A service worker engine usually intercepts every `fetch` event and runs a
**router validation** pipeline before letting the request continue. That is
great for your application routes, but it is annoying for static assets,
generated files, or anything that should simply pass through untouched.

This plugin lets you declare **glob patterns**. When an intercepted request
matches one of those patterns, the plugin marks the response as:

```js
response.continueCheck = false; // stop the validation pipeline
response.needValidation = false; // do not require validation
```

In other words: **the request is short-circuited and allowed through.**

---

## 🎯 Why would I use it?

| Scenario | Without this plugin | With this plugin |
| --- | --- | --- |
| Dev server serving `*.css` | Router validates every asset | CSS bypasses the router |
| Source maps in development | 404 noise in the console | Ignored via `exclude` |
| Third-party CDN requests | Validated and rejected | Skipped with `sameOriginOnly` |
| Production safety | Bypass rules leak to prod | Blocked with `devOnly: true` |

---

## 🚀 Quick Start

```js
import TinyServiceWorkerEngine from './engine/TinyServiceWorkerEngine.mjs';
import GlobBypassPlugin from './engine/plugins/glob-bypass/GlobBypassPlugin.mjs';

const engine = new TinyServiceWorkerEngine();

// Register the plugin on the engine.
engine.installPlugin(GlobBypassPlugin, {
  patterns: ['**/*.css', '**/*.js', '**/*.{png,jpg,svg}'],
  exclude: [],
  sameOriginOnly: true,
  devOnly: false,
});
```

That is the whole setup. Every request whose pathname matches `**/*.css`,
`**/*.js`, or one of the image extensions now bypasses router validation.

---

## ⚙️ Options Reference

The second argument of the plugin is the options object.

| Option | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `patterns` | `string[]` | ✅ **Yes** | — | Glob patterns that trigger the bypass. |
| `exclude` | `string[]` | ❌ No | `[]` | Glob patterns that cancel the bypass. |
| `sameOriginOnly` | `boolean` | ❌ No | `true` | When `true`, only same-origin requests are evaluated. |
| `devOnly` | `boolean` | ❌ No | `false` | When `true`, the bypass is only registered. |

### `patterns` — required

An array of glob strings. Each entry is compiled once with `compileGlobRegExp()`
and registered on the engine.

```js
{ patterns: ['**/*.css', '**/*.map'] }
```

### `exclude` — optional

An array of glob strings. Exclusion patterns are compiled **once**, before the
request loop, and tested against `fetchObj.url.pathname`.

```js
{ patterns: ['**/*.js'], exclude: ['**/no.js', '**/nope.js'] }
```

### `sameOriginOnly` — optional, default `true`

When `true`, cross-origin requests are ignored and fall back to the normal
router validation.

```js
{ patterns: ['**/*.css'], sameOriginOnly: false } // also bypass CDN requests
```

### `devOnly` — optional, default `false`

When `true`, the plugin registers nothing. Use it to keep development shortcuts out of production.

```js
{ patterns: ['**/*.map'], devOnly: true }
```

---

## 🔍 How It Works

```text
        fetch event
             │
             ▼
  ┌──────────────────────────┐
  │ Does the pathname match  │
  │   a `patterns` entry?    │──No──▶ normal router validation
  └───────────┬──────────────┘
              │ Yes
              ▼
  ┌──────────────────────────┐
  │ sameOriginOnly is true   │
  │  AND request is cross-   │──Yes─▶ normal router validation
  │        origin?           │
  └───────────┬──────────────┘
              │ No
              ▼
  ┌──────────────────────────┐
  │ Does the pathname match  │
  │   an `exclude` entry?    │──Yes─▶ normal router validation
  └───────────┬──────────────┘
              │ No
              ▼
  ┌──────────────────────────┐
  │  continueCheck  = false  │
  │  needValidation = false  │
  │  code           = 200    │
  └──────────────────────────┘
```

**Step by step:**

1. The plugin validates the engine instance and every option.
2. If `devOnly` is `true` and the environment is not a dev build, it stops here.
3. All `exclude` patterns are compiled into `RegExp` objects **once** (performance).
4. For each entry in `patterns`, the plugin calls
   `engine.addFetchRegExpListener(regex.source, callback)`.
5. Inside the callback, the origin and exclusion checks run per request.
6. If nothing stopped the request, the response is short-circuited.

---

## 🍳 Daily Recipes

### 1. Bypass a single file

```js
{ patterns: ['**/sw.js'] }
```

### 2. Bypass by file extension

```js
{ patterns: ['**/*.{css,scss,less}'] }
```

### 3. Bypass everything except the service worker

```js
{ patterns: ['**'], exclude: ['**/sw.js'] }
```

### 4. Development-only bypass

```js
{ patterns: ['**/*.map'], devOnly: true }
```

### 5. Include cross-origin requests

```js
{ patterns: ['**/api/**'], sameOriginOnly: false }
```

### 6. Multiple independent rules

Register the plugin more than once with different option sets:

```js
engine.use(GlobBypassPlugin, { patterns: ['**/*.css'] });
engine.use(GlobBypassPlugin, { patterns: ['**/*.map'], devOnly: true });
```

---

## 🔐 Security Notes

- **`sameOriginOnly` defaults to `true` on purpose.** Setting it to `false`
  means cross-origin requests can also skip validation. Only do this when you
  fully control the target origins.
- **`devOnly` is your safety net.** Any bypass that exists only to make
  development easier should use `devOnly: true`.
- **`exclude` is evaluated per request, not per pattern.** A typo in an
  exclusion pattern fails silently: the request is bypassed instead of blocked.

---

## ❓ FAQ

**Does this plugin download anything?**
No. It only registers listeners on the engine.

**Can I register it twice?**
Yes. Each call creates an independent rule set.

**What happens if `patterns` is an empty array?**
Nothing is registered. No error is thrown.
