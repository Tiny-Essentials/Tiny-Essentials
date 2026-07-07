# 📻 TinyRadioFm Documentation

`TinyRadioFm` is a powerful, deterministic, and seed-based radio management system. It is designed to handle complex playback sequences, including music and voice playlists, scheduled timeline mutations, and custom content injections, all while maintaining absolute reproducibility through a mathematical seed. 🎯

> **Beta Status:** This engine is currently in beta.

---

## ✨ Key Features

* **🎯 Deterministic Playback:** Uses a `Mulberry32` PRNG to ensure that the same seed always produces the exact same radio sequence.
* **🎵 Dual-Stream Logic:** Manages separate playlists for `music` and `voice`, with configurable interaction rules (e.g., playing voices after music).
* **📅 Scheduled Mutations:** Schedule tasks to `add`, `remove`, or `move` items in the playlist at specific future timestamps.
* **⚡ Custom Injections:** Inject "Custom Positions" into the timeline that interrupt the standard cycle.
* **🧠 Smart Queuing:** Intelligent logic to prevent audio overlaps by automatically adjusting timestamps to the end of currently playing content.
* **💾 State Persistence:** Full export/import capabilities, including automatic conversion of Blob URLs to Base64 for easy storage.
* **🧹 Memory Management:** Proactive cleanup of Blob URLs and event listeners to prevent memory leaks.

---

## ⚙️ Configuration

The behavior of the engine is controlled via the `RadioConfig` object.

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `mode` | `'playlist' \| 'random'` | `'playlist'` | Sequence logic for the music playlist. |
| `voiceMode` | `'playlist' \| 'random'` | `'playlist'` | Sequence logic for the voice playlist. |
| `silenceDuration` | `number` | `0` | Gap in milliseconds between tracks. |
| `queryLimit` | `number` | `100000` | Safety lock for maximum items processed during queries. |
| `voiceAfterMusic` | `boolean` | `true` | If `true`, voice messages play after music tracks. |
| `voiceMin` | `number` | `0` | Minimum number of voice messages to play in a cycle. |
| `voiceMax` | `number` | `1` | Maximum number of voice messages to play in a cycle. |
| `musicMaxConsecutive`| `number` | `0` | Max consecutive music repeats (`-1` = unlimited, `0` = no repeats). |
| `voiceMaxConsecutive`| `number` | `0` | Max consecutive voice repeats (`-1` = unlimited, `0` = no repeats). |

---

## 🛠️ Core API Reference

### 🏗️ Static Methods

#### `static parseContent(source, defaultMetadata, metadata, parseFile, callbacks)`
Prepares a `MediaContent` object by extracting metadata from an audio source.
* **Parameters:**
    * `source`: A URL string or an existing `HTMLMediaElement`.
    * `defaultMetadata`: Optional base metadata.
    * `metadata`: Optional manual overrides.
    * `parseFile`: Internal helper for file parsing.
    * `callbacks`: Object containing `onProgress` and `onError` handlers.
* **Returns:** `Promise<MediaContent>`
* **Throws:** `MediaLoadingError`

---

### 📥 Content Management

#### `add(type, data, smartQueue = true)`
Adds new content to the engine immediately.
* **Parameters:**
    * `type`: `'music' | 'voice' | 'custom'`.
    * `data`: The `MediaContent` object (must include `id` and `duration`).
    * `smartQueue`: If `true`, delays insertion until the current content ends (primarily for `custom`).
* **Emits:** `contentAdded`

#### `remove(id)`
Instantly removes content by its unique ID across all lists, custom positions, and pending tasks. It also revokes associated Blob URLs.
* **Parameters:** `id` (string)
* **Emits:** `contentRemoved`

---

### 📅 Task & Config Management

#### `scheduleTask(timestamp, action, type, payload, smartQueue = true)`
Schedules a modification to the playlists at a specific point in time.
* **Parameters:**
    * `timestamp`: Target epoch timestamp (ms).
    * `action`: `'add' | 'remove' | 'move'`.
    * `type`: `'music' | 'voice'`.
    * `payload`: Data required for the action (`MediaContent` for add, `string` for remove, or `ScheduledMovePayload` for move).
    * `smartQueue`: If `true`, aligns the task to the end of the current event.
* **Emits:** `taskScheduled`

#### `setConfig(config)`
Performs a partial or full update of the engine configuration.
* **Parameters:** `config` (Partial or full `RadioConfig` object).
* **Emits:** `configChanged`

---

### 🔍 Timeline & Querying

#### `getCurrentEvent()`
Retrieves the exact event currently playing at the system's current time.
* **Returns:** `RadioEvent | null`

#### `queryTimeline(targetDate, limit = 10)`
Predicts upcoming events from a specific date forward using a virtual sandbox to prevent state mutation.
* **Parameters:**
    * `targetDate`: Starting epoch timestamp.
    * `limit`: Maximum number of events to return.
* **Returns:** `RadioEvent[]`
* **Throws:** `TypeError` or `RangeError` if limit is invalid.

---

### 💾 Persistence & Lifecycle

#### `async exportState()`
Exports the entire radio state (playlists, tasks, seed, config) as a JSON string. Automatically converts all image Blob URLs to **Base64** for portability.
* **Returns:** `Promise<string>`

#### `importState(json)`
Hydrates the engine with a previously exported state.
* **Parameters:** `json` (A JSON string or a state object).
* **Emits:** `stateImported`

#### `destroy(destroyThumbs = true)`
Performs a complete cleanup. It wipes all lists, clears the cache, removes all listeners, and revokes all Blob URLs to free up system memory.
* **Parameters:** `destroyThumbs` (boolean) - Whether to revoke image Blob URLs.
* **Emits:** `destroyed`

---

## 📊 Data Models (Summary)

### `RadioEvent` 📡
The standardized object returned when querying the timeline.
* `id`, `title`, `artist`, `url`, `duration`
* `absoluteStart`, `absoluteEnd`
* `elapsedTime`, `remainingTime`
* `progress` (0 to 1)
* `isCustom` (boolean)

### `ScheduledTask` 📝
An instruction to change the radio state.
* `timestamp`: Execution time.
* `action`: `'add' | 'remove' | 'move'`.
* `type`: `'music' | 'voice'`.
* `payload`: Action-specific data.
