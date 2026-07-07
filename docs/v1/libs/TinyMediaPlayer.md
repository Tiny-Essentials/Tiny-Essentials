# 🎧 TinyMediaPlayer Documentation

`TinyMediaPlayer` is a robust, universal media player manager designed to orchestrate playback across multiple different media providers (such as YouTube, Spotify, etc.) using an **Adapter Pattern**.

---

## 🧩 Core Architecture: The Adapter Pattern

To support different media platforms, `TinyMediaPlayer` relies on **Adapters**. You must create a class that extends `BaseMediaAdapter` for every new service you wish to support.

### 🛠️ `BaseMediaAdapter` (Abstract Class)
*This class cannot be instantiated directly. It serves as an interface.*

| Method | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `canHandle` | Checks if the adapter supports a specific content item. | `content: MediaContent` | `boolean` |
| `play` | Starts or resumes playback. | `content: MediaContent` | `Promise<void>` |
| `pause` | Pauses the current playback. | None | `Promise<void>` |
| `stop` | Stops playback and resets the platform state. | None | `Promise<void>` |
| `seek` | Jumps to a specific time. | `timeMs: number` | `Promise<void>` |
| `getCurrentTime` | Gets the current playback position. | None | `number` (ms) |
| `setVolume` | Sets the volume level. | `volume: number` (0.0 to 1.0) | `void` |

---

## 🚀 `TinyMediaPlayer` Class

The main controller for managing playlists, playback state, and adapters.

### ⚙️ Configuration (Constructor Options)
When initializing `new TinyMediaPlayer(options)`, you can pass the following:

*   **`persistVolume`** (`boolean`): If `true`, the volume level is automatically saved to and loaded from `localStorage`. (Default: `false`).
*   **`volumeStorageKey`** (`string`): The key name used in `localStorage` to store the volume. (Default: `'tiny_media_player_volume'`).

---

### 🏗️ Static Members

#### Properties
*   **`unknownArtist`**: A global setting for when an artist's name is unavailable.
    *   **Type**: `string` | `function` (returns a string).
    *   **Getter/Setter**: Allows you to define a custom string or a logic-based function.

#### Methods
*   **`parseContent(source, defaultMetadata, metadata, parseFile, callbacks)`**: 
    *   A static factory method to prepare a `MediaContent` object by extracting metadata from a URL or HTMLMediaElement.
    *   **Returns**: `Promise<MediaContent>`.

---

### 📊 Instance Properties (Getters & Setters)

| Property | Type | Description |
| :--- | :--- | :--- |
| `playlist` | `MediaContent[]` | Returns a shallow copy of the current playlist. |
| `currentIndex` | `number` | The index of the currently playing track. |
| `loopMode` | `'NONE' \| 'TRACK' \| 'PLAYLIST'` | Defines how the player behaves at the end of a track. |
| `isRandom` | `boolean` | Enables or disables shuffle mode. |
| `isPlaying` | `boolean` | Indicates if media is currently playing. |
| `volume` | `number` | The current volume (constrained between `0.0` and `1.0`). |
| `persistVolume` | `boolean` | Enables/disables volume saving to `localStorage`. |
| `volumeStorageKey`| `string` | The key used for volume persistence. |

---

### 🕹️ Methods

#### 🔌 Adapter Management
*   **`registerAdapter(id, adapter)`**: Registers a new provider.
    *   `id`: A unique string (e.g., `'youtube'`).
    *   `adapter`: An instance of a class extending `BaseMediaAdapter`.

#### 📋 Playlist Management
*   **`addTrack(content)`**: Adds a new `MediaContent` object to the end of the playlist.
*   **`existsTrack(index)`**: Returns `true` if a track exists at the given index.
*   **`getTrack(index)`**: Retrieves the track at the specified index.
*   **`removeTrack(index)`**: Removes a track. If the current track is removed, playback stops or adjusts.
*   **`searchTrack(query)`**: Searches the playlist.
    *   `query`: A `string` (searches title, artist, or album) or a `function` (custom logic).
    *   **Returns**: `SearchResult[]` (array of objects containing the track and its index).
*   **`clearPlaylist()`**: Stops playback and empties the playlist.

#### ⏯️ Playback Controls
*   **`play()`**: Starts playback of the current track.
*   **`pause()`**: Pauses the current track.
*   **`stop()`**: Stops the current track completely.
*   **`next()`**: Advances to the next track (respects `loopMode` and `isRandom`).
*   **`prev()`**: Returns to the previous track (respects `loopMode` and `isRandom`).
*   **`seek(timeMs)`**: Jumps to a specific millisecond in the current track.
*   **`step(stepMs)`**: Moves the timeline forward (positive) or backward (negative) by a specific amount.

---

## ⚠️ Error Handling

The class uses strict validation. The following errors may be thrown:
*   **`TypeError`**: Thrown when an argument is of the wrong type (e.g., passing a string to `volume`).
*   **`RangeError`**: Thrown when a number is out of allowed bounds (e.g., an index that doesn't exist or volume > 1.0).
*   **`Error`**: Thrown if no compatible adapter is found for the current content.
