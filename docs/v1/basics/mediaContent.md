# 🎵 Media Content Module

Welcome to the documentation for the media content module! This module is the heart of the media processing pipeline, responsible for downloading audio, extracting rich metadata (ID3 tags), managing memory for image blobs, and preparing finalized `MediaContent` objects for the radio system. 🚀

---

## 📦 Data Structures & Types

These definitions ensure type safety and provide a clear blueprint for how media information is structured throughout the application.

### 🎼 Core Metadata Types

| Type | Description |
| :--- | :--- |
| `MediaContent` | **The Final Object.** A combination of `MediaContentBase` and `MediaContentMetadata`. This is what the system uses for playback. |
| `MediaContentBase` | The essential properties: `id`, `title`, `artist`, `duration`, `url`, and `weight`. |
| `MediaContentMetadata` | Rich metadata modeled after `music-metadata`. Includes `album`, `genre`, `year`, `track` info, etc. |
| `MediaNumber` | A structure for indexing: `{ no: number \| null, of: number \| null }`. |

### 🖼️ Image & Picture Types

| Type | Description |
| :--- | :--- |
| `IPicture` | Represents an image attachment (like album art). |
| `IPictureTemplate<T>` | A generic template for pictures, where `T` is the data type (`Uint8Array` or `string`). |

### 🚦 Progress & Error Types

| Type | Description |
| :--- | :--- |
| `LoadingMediaProgress` | Tracks the current state: `status` ('loading' or 'success'), `stage`, and the `url`. |
| `LoadingProgressStage` | Stages: `INITIALIZING` ➡️ `DOWNLOADING` ➡️ `METADATA_LOADED` ➡️ `EXTRACTING_ID3` ➡️ `COMPLETE`. |
| `LoadingErrorStage` | Error stages: `INITIALIZING`, `DOWNLOADING`, `METADATA`, `ID3`, or `UNKNOWN`. |

---

## ❌ Custom Errors

### `MediaLoadingError`
Used to provide specific context when something goes wrong during the media preparation lifecycle.

*   **Properties:**
    *   `message`: Human-readable error description.
    *   `url`: The URL that caused the failure.
    *   `stage`: The `LoadingErrorStage` where the error occurred.

---

## 🛠️ Utility Functions

### `generateSimpleHash`
Generates a deterministic 8-character ID from a string using SHA-1.
*   **Input:** `str: string`
*   **Returns:** `Promise<string>`

### `convertToBlobUrl`
Converts `Uint8Array` or Base64 strings into high-performance Blob URLs. It also tracks usage to prevent memory leaks.
*   **Input:** `data: Uint8Array | string`, `format?: string`
*   **Returns:** `string` (The Blob URL)

### `blobUrlToBase64`
Converts a `blob:` URL back into a Base64 Data URL. Useful for exporting data.
*   **Input:** `url: string`
*   **Returns:** `Promise<string>`

### `revokeContentUrls`
Safely cleans up memory by revoking Blob URLs associated with a `MediaContent` object. **Call this when media is no longer needed!** 🧹
*   **Input:** `content: MediaContent`

---

## 🚀 Main Operations

### `extractMediaId3Tags`
Downloads an audio file and uses a provided parser to extract its internal metadata.

*   **Parameters:**
    *   `url` (string): The full URL of the audio file.
    *   `parseFile` (Function): A callback that accepts a `Blob` and returns a promise with metadata.
*   **Returns:** `Promise<MediaContentMetadata>`
*   **Throws:** `TypeError` for invalid arguments or `Error` for network/parsing failures.

---

### `parseMediaMetadata`
**The Primary Factory Method.** This is the main entry point for turning a URL or an Audio element into a fully prepared `MediaContent` object. It handles the heavy lifting: downloading, metadata extraction, fallback logic, and progress reporting.

#### 📝 Parameters

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `source` | `string \| HTMLMediaElement` | The audio source (URL or Audio object). |
| `metadata` | `Partial<MediaContent>` | Manual overrides for the metadata. |
| `parseFile` | `ParseMediaContentMetadata` | The library function used to parse the file. |
| `callbacks` | `Object` | Contains `onProgress` and `onError` listeners. |
| `unknownArtist` | `UnknownArtistGetter` | Logic to determine the artist if none is found. |

#### 💡 Usage Examples

**1. Using a simple URL:**
```javascript
import { parseMediaMetadata } from './mediaContent.mjs';
import { parseBlob } from 'music-metadata';

const track = await parseMediaMetadata(
  '/assets/song.mp3', 
  { title: 'Manual Override' }, 
  parseBlob
);

console.log(track.title); // "Manual Override"
```

**2. Using an existing Audio object with progress tracking:**
```javascript
const audio = new Audio('/assets/song.mp3');

const track = await parseMediaMetadata(
  audio,
  {},
  parseBlob,
  {
    onProgress: (p) => console.log(`[${p.stage}] ${p.status}`),
    onError: (e) => console.error(`Error at ${e.stage}: ${e.error.message}`)
  }
);
```
