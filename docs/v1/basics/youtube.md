# 🎬 YouTube Utils Documentation

A tiny, dependency-free toolkit for everything you need to do with a YouTube link: **extract the video id**, **build thumbnail URLs** and **fetch the official oEmbed metadata** — with strict validation at every step. 🚀

```javascript
import {
  extractYouTubeVideoId,
  getYouTubeThumbnailUrl,
  fetchYouTubeOEmbed,
  assertYouTubeOEmbedResponse,
} from 'tiny-essentials/basics/media/youtube';
```

---

## 📋 Table of Contents

1. [Data Types](#-data-types)
2. [extractYouTubeVideoId](#-extractyoutubevideoid)
3. [getYouTubeThumbnailUrl](#-getyoutubethumbnailurl)
4. [fetchYouTubeOEmbed](#-fetchyoutuboeembed)
5. [assertYouTubeOEmbedResponse](#-assertyoutuboeembedresponse)
6. [Error Reference](#-error-reference)

---

## 📋 Data Types

### `YouTubeThumbnailQuality`

```typescript
type YouTubeThumbnailQuality =
  | 'default' // 120x90
  | 'mqdefault' // 320x180
  | 'hqdefault' // 480x360 (default)
  | 'sddefault' // 640x480
  | 'maxresdefault'; // 1280x720
```

### `YouTubeOEmbedResponse`

The validated payload returned by [`fetchYouTubeOEmbed`](#-fetchyoutuboeembed).

| Property           | Type      | Description                             |
| :----------------- | :-------- | :-------------------------------------- |
| `title`            | `string`  | Video title.                            |
| `author_name`      | `string`  | Channel display name.                   |
| `author_url`       | `string`  | Channel URL.                            |
| `type`             | `'video'` | Resource type returned by the provider. |
| `version`          | `string`  | oEmbed version.                         |
| `provider_name`    | `string`  | Always `"YouTube"`.                     |
| `provider_url`     | `string`  | Provider root URL.                      |
| `html`             | `string`  | Ready to use iframe markup.             |
| `width`            | `number`  | Suggested iframe width in pixels.       |
| `height`           | `number`  | Suggested iframe height in pixels.      |
| `thumbnail_url`    | `string`  | Thumbnail URL provided by the provider. |
| `thumbnail_width`  | `number`  | Thumbnail width in pixels.              |
| `thumbnail_height` | `number`  | Thumbnail height in pixels.             |

---

## 🆔 `extractYouTubeVideoId`

Extracts the canonical 11 character video id from a raw id or a full YouTube URL.

```javascript
import { extractYouTubeVideoId } from 'tiny-essentials/basics/media/youtube';

extractYouTubeVideoId('dQw4w9WgXcQ');
// → 'dQw4w9WgXcQ'

extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL123');
// → 'dQw4w9WgXcQ'

extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ?t=42');
// → 'dQw4w9WgXcQ'
```

### Supported inputs

| Input      | Example                                       |
| :--------- | :-------------------------------------------- |
| Raw id     | `dQw4w9WgXcQ`                                 |
| `watch`    | `https://www.youtube.com/watch?v=dQw4w9WgXcQ` |
| Short link | `https://youtu.be/dQw4w9WgXcQ`                |
| `embed`    | `https://www.youtube.com/embed/dQw4w9WgXcQ`   |
| `shorts`   | `https://www.youtube.com/shorts/dQw4w9WgXcQ`  |
| `live`     | `https://www.youtube.com/live/dQw4w9WgXcQ`    |
| `v`        | `https://www.youtube.com/v/dQw4w9WgXcQ`       |

**Allowed hosts:** `youtube.com`, `m.youtube.com`, `music.youtube.com`, `youtube-nocookie.com` and `youtu.be` (the `www.` prefix is optional). Only `http:` and `https:` are accepted.

**Throws:**

- `TypeError` — when the input is not a string.
- `RangeError` — when the input is empty, the protocol is unsupported or the host is not a YouTube host.
- `SyntaxError` — when the input is not a video id, is not a valid URL, or does not contain a video id.

---

## 🖼️ `getYouTubeThumbnailUrl`

Builds the thumbnail URL of a video **without any network request**.

```javascript
import { getYouTubeThumbnailUrl } from 'tiny-essentials/basics/media/youtube';

getYouTubeThumbnailUrl('dQw4w9WgXcQ');
// → 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg'

getYouTubeThumbnailUrl('https://youtu.be/dQw4w9WgXcQ', 'maxresdefault');
// → 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg'
```

| Parameter      | Type                      | Default       | Description                                                                       |
| :------------- | :------------------------ | :------------ | :-------------------------------------------------------------------------------- |
| `videoIdOrUrl` | `string`                  | —             | Raw id or any URL accepted by [`extractYouTubeVideoId`](#-extractyoutubevideoid). |
| `quality`      | `YouTubeThumbnailQuality` | `'hqdefault'` | Thumbnail resolution.                                                             |

**Returns:** `string` — the thumbnail URL.

**Throws:** `TypeError` when `quality` is not a string, `RangeError` when it is not a supported quality, plus anything thrown by `extractYouTubeVideoId`.

---

## 📡 `fetchYouTubeOEmbed`

Fetches the [official oEmbed](https://oembed.com/) metadata of a video and returns a fully validated [`YouTubeOEmbedResponse`](#-data-types).

```javascript
import { fetchYouTubeOEmbed } from 'tiny-essentials/basics/media/youtube';

const video = await fetchYouTubeOEmbed('https://youtu.be/dQw4w9WgXcQ');

console.log(video.title); // 'Never Gonna Give You Up'
console.log(video.author_name); // 'Rick Astley'
```

### Options

| Option      | Type           | Default            | Description                                         |
| :---------- | :------------- | :----------------- | :-------------------------------------------------- |
| `signal`    | `AbortSignal`  | `undefined`        | Forwarded to `fetch` so the request can be aborted. |
| `fetchImpl` | `typeof fetch` | `globalThis.fetch` | Injectable fetch implementation (handy for tests).  |

```javascript
const controller = new AbortController();

const video = await fetchYouTubeOEmbed('dQw4w9WgXcQ', {
  signal: controller.signal,
  fetchImpl: myFetch,
});
```

**Returns:** `Promise<YouTubeOEmbedResponse>`

**Throws:**

- `TypeError` — invalid `options`, `options.signal` or `options.fetchImpl`, or a response that is not a `Response`.
- `Error` — the request failed or returned a non 2xx status.
- `RangeError` — the payload contains an out of range numeric value.

---

## ✅ `assertYouTubeOEmbedResponse`

Deeply validates an oEmbed payload and returns a **brand new** object containing only the known properties.

```javascript
import { assertYouTubeOEmbedResponse } from 'tiny-essentials/basics/media/youtube';

const payload = await fetch('/oembed.json').then((res) => res.json());
const video = assertYouTubeOEmbedResponse(payload);

console.log(video.title);
```

| Parameter | Type      | Default                         | Description                              |
| :-------- | :-------- | :------------------------------ | :--------------------------------------- |
| `payload` | `unknown` | —                               | Raw value returned by `response.json()`. |
| `context` | `string`  | `'assertYouTubeOEmbedResponse'` | Caller name used in the error messages.  |

**Throws:**

- `TypeError` — the payload (or one of its properties) has the wrong type.
- `RangeError` — a numeric property is not a positive integer, or `type` is not `'video'`.

---

## ❌ Error Reference

| Error         | When                                                                                                                               |
| :------------ | :--------------------------------------------------------------------------------------------------------------------------------- |
| `TypeError`   | A value has the wrong type (non-string id, non-function `fetchImpl`, non-`AbortSignal` signal, non-object payload…).               |
| `RangeError`  | A value is syntactically valid but out of range (empty string, unsupported host/protocol, unknown quality, non-positive integer…). |
| `SyntaxError` | The input is neither a video id nor a URL containing one.                                                                          |
| `Error`       | The HTTP request failed or returned a non 2xx status.                                                                              |

---

## 🧪 Testing

- **Browser playground:** `test/html/basics/youtube` (run `npm run test:mjs:web` and open `/basics/youtube/`).
- **Node.js suite:** `npm run test:mjs:youtube`.
