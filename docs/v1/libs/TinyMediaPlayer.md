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
When initializing `new TinyMediaPlayer(options)`, you can pass the following `TinyMediaPlayerOptions`:

* **`persistVolume`** (`boolean`): If `true`, the volume level is automatically saved to and loaded from `localStorage`. (Default: `false`).
* **`volumeStorageKey`** (`string`): The key name used in `localStorage` to store the volume. (Default: `'tiny_media_player_volume'`).
* **`repeatCurrentOnPrev`** (`boolean`): If `true`, clicking 'previous' repeats the current track on the first click. (Default: `false`).
* **`smoothPlayPauseVolume`** (`boolean`): If `true`, volume fades smoothly during play/pause transitions. (Default: `false`).
* **`smoothStopVolume`** (`boolean`): If `true`, volume fades smoothly to zero when stopping. (Default: `false`).

---

### 🏗️ Static Members

#### Properties
* **`unknownArtist`**: A global setting for when an artist's name is unavailable.
    * **Type**: `string` | `function` (returns a string).
    * **Getter/Setter**: Allows you to define a custom string or a logic-based function.

#### Methods
* **`parseContent(source, defaultMetadata, metadata, parseFile, callbacks)`**: 
    * A static factory method to prepare a `MediaContent` object by extracting metadata from a URL or HTMLMediaElement.
    * **Returns**: `Promise<MediaContent>`.

---

### 📊 Instance Properties (Getters & Setters)

#### 🔄 State & Playback
| Property | Type | Description |
| :--- | :--- | :--- |
| `playlist` | `MediaContent[]` | Returns a shallow copy of the current playlist. |
| `currentIndex` | `number` | The index of the currently playing track. |
| `loopMode` | `'NONE' \| 'TRACK' \| 'PLAYLIST'` | Defines how the player behaves at the end of a track. |
| `isRandom` | `boolean` | Enables or disables shuffle mode. |
| `isPlaying` | `boolean` | Indicates if media is currently playing. |
| `volume` | `number` | The current volume level (strictly between `0.0` and `1.0`). |

#### 🎨 UX & Customization
| Property | Type | Description |
| :--- | :--- | :--- |
| `repeatCurrentOnPrev` | `boolean` | Whether clicking 'previous' repeats the current track on first click. |
| `smoothPlayPauseVolume`| `boolean` | Enables smooth volume fading during play/pause. |
| `smoothStopVolume` | `boolean` | Enables smooth volume fading when stopping. |
| `fadeVolumeSpeed` | `number` | The duration (ms) of the volume fade transition. |
| `prevClickTimeoutDuration`| `number` | The duration (ms) before the "repeat on prev" state resets. |
| `persistVolume` | `boolean` | Enables/disables volume saving to `localStorage`. |
| `volumeStorageKey` | `string` | The key used for volume persistence. |

#### 🛠️ Utility & Lifecycle
| Property | Type | Description |
| :--- | :--- | :--- |
| `destroyed` | `boolean` | Indicates if the instance has been destroyed. |
| `adapters` | `BaseMediaAdapter[]` | Returns an array of all registered adapters. |
| `adaptersSize` | `number` | The number of currently registered adapters. |

---

### 🕹️ Methods

#### 🔌 Adapter Management
* **`registerAdapter(adapter)`**: Registers a new provider.
    * `adapter`: An instance of a class extending `BaseMediaAdapter`.
* **`removeAdapter(adapter)`**: Removes a specific registered adapter.
* **`destroyAdapter(adapter)`**: Destroys and removes a specific adapter.
* **`hasAdapter(adapter)`**: Checks if a specific adapter is registered.
* **`clearAdapters()`**: Clears the list of adapters (does not call `destroy` on them).
* **`destroyAllAdapters()`**: Destroys and removes all registered media adapters.
* **`getMediaAdapter(content)`**: Finds the compatible adapter for the provided content.

#### 📋 Playlist Management
* **`addTrack(content)`**: Adds a new `MediaContent` object to the end of the playlist.
* **`existsTrack(index)`**: Returns `true` if the track exists at the given index.
* **`getTrack(index)`**: Retrieves the track at the specified index.
* **`removeTrack(index)`**: **(Async)** Removes a track and adjusts the current index/playback accordingly.
* **`searchTrack(query)`**: Searches the playlist.
    * `query`: A `string` (searches title, artist, or album) or a `function` (custom logic).
    * **Returns**: `SearchResult[]` (array of objects containing the track and its index).
* **`clearPlaylist()`**: **(Async)** Stops playback and empties the entire playlist.

#### ⏯️ Playback Controls
* **`play()`**: **(Async)** Starts playback of the current track.
* **`pause()`**: **(Async)** Pauses the current track.
* **`stop()`**: **(Async)** Stops the current track completely.
* **`next()`**: **(Async)** Advances to the next track (respects `loopMode` and `isRandom`).
* **`prev()`**: **(Async)** Returns to the previous track (respects `loopMode` and `isRandom`).
* **`seek(timeMs)`**: **(Async)** Jumps to a specific millisecond in the current track.
* **`step(stepMs)`**: **(Async)** Moves the timeline forward (positive) or backward (negative) by a specified amount.

#### ♻️ Lifecycle
* **`destroy()`**: **(Async)** Safely stops playback, clears state, removes adapters, and detaches all listeners to prevent memory leaks.

---

## ⚠️ Error Handling

The class uses strict validation. The following errors may be thrown:
* **`TypeError`**: Thrown when an argument is of the wrong type (e.g., invalid index type, non-boolean options, invalid adapter instance).
* **`RangeError`**: Thrown when a number is out of allowed bounds (e.g., negative time, volume outside `0.0`-`1.0`, or index out of playlist bounds).
* **`Error`**: Thrown if no compatible adapter is found for the current content.
