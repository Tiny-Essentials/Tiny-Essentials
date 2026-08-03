# 🎧 TinyMediaPlayer Documentation

`TinyMediaPlayer` is a robust, universal media player manager designed to orchestrate playback across multiple different media providers (such as YouTube, Spotify, etc.) using an **Adapter Pattern**.

---

## 🧩 Core Architecture: The Adapter Pattern

To support different media platforms, `TinyMediaPlayer` relies on **Adapters**. You must create a class that extends `BaseMediaAdapter` for every new service you wish to support.

### 🛠️ `BaseMediaAdapter` (Abstract Class)
*This class cannot be instantiated directly. It serves as an interface that all specific API wrappers must extend and implement.*

#### Properties
| Property | Type | Description |
| :--- | :--- | :--- |
| `destroyed` | `boolean` | Indicates if the adapter instance has been destroyed. |

#### Methods
| Method | Description | Parameters | Returns |
| :--- | :--- | :--- | :--- |
| `canHandle` | Determines if the adapter can play the provided content. | `content: MediaContent` | `boolean` |
| `isReady` | Synchronously checks if the adapter is ready. | None | `boolean` |
| `waitIsReady` | Asynchronously waits until the adapter is ready. | None | `Promise<void>` |
| `play` | Starts or resumes playback of the provided content. | `content: MediaContent` | `Promise<void>` |
| `pause` | Pauses the current playback. | None | `Promise<void>` |
| `stop` | Stops the playback completely and resets the platform state. | None | `Promise<void>` |
| `seek` | Seeks to a specific time in the media timeline. | `timeMs: number` | `Promise<void>` |
| `isMuted` | Checks whether the player is currently muted. | None | `boolean \| null` |
| `mute` | Mutes the current playback. | None | `Promise<void>` |
| `unmute` | Unmutes the current playback. | None | `Promise<void>` |
| `getCurrentTime` | Retrieves the current playback position. | None | `number` (ms) |
| `getTotalDuration` | Gets the total duration of the content. | None | `number` (ms) |
| `getRemainingTime` | Gets the remaining time until the content ends. | None | `number` (ms) |
| `getPlaybackPercentage` | Gets the percentage of the content that has been played. | None | `number` (0 to 100) |
| `getTimeData` | Retrieves a consolidated object containing all time-related metrics. | None | `ContentTimeData` |
| `setVolume` | Sets the playback volume for the underlying API. | `volume: number` (0.0 to 1.0) | `void` |
| `getVolume` | Gets the current playback volume. | None | `number` (0.0 to 1.0) |
| `getContentData` | Retrieves the metadata of the loaded content. | None | `Promise<ContentData>` |
| `destroy` | Cleans up the instance and marks it as destroyed. | None | `void` |

---

### 🚀 Implementation Guide

You can integrate `TinyMediaPlayer` into your project using two methods: using the ready-to-use adapters provided in the library, or creating your own custom adapters for unique services.

#### 📦 Option 1: Using Pre-built Adapters
The library provides several optimized adapters for common media sources. You can import them and register them directly with your player instance.

**Available Adapters:**
* `YoutubeMediaAdapter` from `tiny-essentials/libs/TinyMediaPlayer/Youtube` (https://www.youtube.com/watch?v=XXXXXXXXXXX)
* `SoundCloudMediaAdapter` from `tiny-essentials/libs/TinyMediaPlayer/SoundCloud` (https://api.soundcloud.com/tracks/XXXXXXXXX (From SoundCloud Embed))
* `HtmlAudioAdapter` from `tiny-essentials/libs/TinyMediaPlayer/HtmlAudio`
* `HtmlVideoAdapter` from `tiny-essentials/libs/TinyMediaPlayer/HtmlVideo`

**Example Usage:**
```javascript
import TinyMediaPlayer from 'tiny-essentials/libs/TinyMediaPlayer';
import { YoutubeMediaAdapter } from 'tiny-essentials/libs/TinyMediaPlayer/Youtube';
import { HtmlAudioAdapter } from 'tiny-essentials/libs/TinyMediaPlayer/HtmlAudio';

const player = new TinyMediaPlayer({
  persistVolume: true
});

YoutubeMediaAdapter.defaultContainer = YoutubeMediaAdapter.createIframeContainer({
  videoId: 'fzKvGbQ9SgY',
  hidden: true,
  autoplay: false,
});

// Register the ready-made adapters
player.registerAdapter(new YoutubeMediaAdapter());
player.registerAdapter(new HtmlAudioAdapter());

// The player will now automatically select the correct adapter 
// based on the content provided.
```

#### 🛠️ Option 2: Creating Custom Adapters
If you need to support a service not covered by the pre-built adapters, you can create a custom class by extending the `BaseMediaAdapter`.

**Example Implementation:**
```javascript
import { BaseMediaAdapter } from 'tiny-essentials/libs/TinyMediaPlayer/Base';

/**
 * A custom adapter for a hypothetical streaming service.
 * @extends BaseMediaAdapter
 */
class MyCustomServiceAdapter extends BaseMediaAdapter {
  /**
   * Determines if this adapter can play the given content.
   * @param {MediaContent} content - The media content to check.
   * @returns {boolean} - True if the URL matches the service.
   */
  static canHandle(content) {
    return content.url.startsWith('https://example.com/');
  }

  canHandle(content) {
    return MyCustomServiceAdapter.canHandle(content);
  }

  async play(content) {
    console.log(`Starting playback for: ${content.title}`);
  }

  async pause() {}
  async stop() {}
  async seek(timeMs) {}
  getCurrentTime() { return 0; }
  setVolume(volume) {}
  getVolume() { return 1.0; }
  async getContentData() { return {}; }
  async waitIsReady() {}
  isReady() { return true; }
  isMuted() { return false; }
  async mute() {}
  async unmute() {}
  getTotalDuration() { return 0; }
  getRemainingTime() { return 0; }
  getPlaybackPercentage() { return 0; }
  getTimeData() { return {}; }
}

// Registering the custom adapter
const player = new TinyMediaPlayer();
player.registerAdapter(new MyCustomServiceAdapter());
```

---

## 📊 Data Types

### `ContentTimeData`
This object is emitted during the `timeupdate` event and provides real-time playback information.

| Property | Type | Description |
| :--- | :--- | :--- |
| `total` | `number` | The total duration of the media in milliseconds. |
| `current` | `number` | The current playback position in milliseconds. |
| `remaining` | `number` | The remaining time until the media ends in milliseconds. |
| `playbackPercentage` | `number` | The percentage of the media that has been played (0 to 100). |

### `SearchResult`
Returned by the `searchTrack` method.

| Property | Type | Description |
| :--- | :--- | :--- |
| `track` | `MediaContent` | The matched media content object. |
| `index` | `number` | The current index of the track in the playlist. |

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
* **`BaseMediaAdapter`**: A reference to the `BaseMediaAdapter` class (useful for `instanceof` checks).
* **`unknownArtist`**: A global setting for when an artist's name is unavailable.
    * **Type**: `string` | `function` (returns a string).
    * **Getter/Setter**: Allows you to define a custom string or a logic-based function.
* **`defaultAdapterEventNames`**: An array of strings representing the events the player listens to by default on all registered adapters.
    * **Type**: `string[]` (e.g., `['timeupdate', 'ended']`).
    * **Getter/Setter**: Allows customization of the default event subscription list.

#### Methods
* **`parseContent(source, defaultMetadata, metadata, parseFile, callbacks)`**: 
    * A static factory method to prepare a `MediaContent` object by extracting metadata from a URL or HTMLMediaElement.
    * **Parameters**:
        * `source`: `string | HTMLMediaElement`
        * `defaultMetadata`: `Partial<MediaContentBase & MediaContentMetadata>`
        * `metadata`: `Partial<MediaContentBase & MediaContentMetadata>`
        * `parseFile`: `ParseMediaContentMetadata`
        * `callbacks`: `Object` (containing `onProgress` and `onError`)
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
| `isMuted` | `boolean` | Sets the mute state of the player. |

#### 🎨 UX & Customization
| Property | Type | Description |
| :--- | :--- | :--- |
| `repeatCurrentOnPrev` | `boolean` | Whether clicking 'previous' repeats the current track on first click. |
| `smoothPlayPauseVolume`| `boolean` | Enables smooth volume fading during play/pause. |
| `smoothStopVolume` | `boolean` | Enables smooth volume fading when stopping. |
| `fadeVolumeSpeed` | `number` | The duration (ms) of the volume fade transition (must be non-negative). |
| `prevClickTimeoutDuration`| `number` | The duration (ms) before the "repeat on prev" state resets (must be non-negative). |
| `persistVolume` | `boolean` | Enables/disables volume saving to `localStorage`. |
| `volumeStorageKey` | `string` | The key used for volume persistence (cannot be empty). |

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
* **`destroyAdapter(adapter)`**: Destroys and removes a specific registered adapter.
* **`hasAdapter(adapter)`**: Checks if a specific adapter is registered.
* **`clearAdapters()`**: Clears the list of adapters (does not call `destroy` on them).
* **`destroyAllAdapters()`**: Destroys and removes all registered media adapters.
* **`getMediaAdapter(content)`**: Finds the compatible adapter for the provided content.

#### 📡 Event Management (Controlled)
*Use these methods to manage which events from the underlying adapters are proxied to the `TinyMediaPlayer` instance.*

* **`addAdapterEvent(eventName)`**: Subscribes the player to a new event type from all registered adapters.
    * `eventName`: `string`.
* **`removeAdapterEvent(eventName)`**: Unsubscribes the player from a specific event type from all registered adapters.
    * `eventName`: `string`.
* **`resetAdapterEvents()`**: Restores the event listener list to the default state defined by `TinyMediaPlayer.defaultAdapterEventNames`.

#### 📋 Playlist Management
* **`addTrack(content)`**: Adds a new `MediaContent` object to the end of the playlist.
    * **Returns**: `number` (the new length of the playlist).
* **`existsTrack(index)`**: Returns `true` if the track exists at the given index.
* **`getTrack(index)`**: Retrieves the track at the specified index.
* **`removeTrack(index)`**: **(Async)** Removes a track and adjusts the current index/playback accordingly.
* **`searchTrack(query)`**: Searches the playlist.
    * `query`: A `string` (searches title, artist, or album) or a `function` (custom logic).
    * **Returns**: `SearchResult[]` (array of objects containing the track and their corresponding indices).
* **`clearPlaylist()`**: **(Async)** Stops playback and empties the entire playlist.

#### ⏯️ Playback Controls
* **`play()`**: **(Async)** Starts playback of the current track.
* **`pause()`**: **(Async)** Pauses the current track.
* **`stop()`**: **(Async)** Stops the current track completely.
* **`next()`**: **(Async)** Advances to the next track (respects `loopMode` and `isRandom`).
* **`prev()`**: **(Async)** Returns to the previous track (respects `loopMode` and `isRandom`).
* **`seek(timeMs)`**: **(Async)** Jumps to a specific millisecond in the current track.
* **`step(stepMs)`**: **(Async)** Moves the timeline forward (+) or backward (-) by `stepMs`.

#### ⏳ Time Utilities
* **`getCurrentTime()`**: Gets the current playback time in milliseconds.
* **`getTotalDuration()`**: Gets the total duration of the current track in milliseconds.
* **`getRemainingTime()`**: Gets the remaining time until the current track ends in milliseconds.
* **`getPlaybackPercentage()`**: Gets the percentage of the current track that has been played (0-100).
* **`getContentData()`**: Retrieves structured metadata for the current content.
* **`waitIsReady()`**: **(Async)** Waits until the active adapter is fully initialized.

#### ♻️ Lifecycle
* **`destroy()`**: **(Async)** Safely stops playback, clears state, removes adapters, and detaches all listeners to prevent memory leaks.

---

## 📡 Emitted Events

`TinyMediaPlayer` extends `EventEmitter`. You can listen to the following events.

### 🎶 Playback Events
| Event | Data Type | Description |
| :--- | :--- | :--- |
| `play` | `number` | Emitted when playback starts. Returns the `currentIndex`. |
| `pause` | `number` | Emitted when playback is paused. Returns the `currentIndex`. |
| `stop` | `number` | Emitted when playback is stopped. Returns the `currentIndex`. |
| `seek` | `number` | Emitted when the timeline is jumped to a new time (in ms). |
| `timeupdate` | `ContentTimeData` | Emitted by the adapter every time the playback position changes (in ms). |

### 🔄 State & Configuration Events
| Event | Data Type | Description |
| :--- | :--- | :--- |
| `playlistUpdate` | `MediaContent[]` | Emitted when the playlist is modified. |
| `trackChange` | `number` | Emitted when the `currentIndex` changes. |
| `volumeChange` | `number` | Emitted when the volume is updated (0.0 to 1.0). |
| `isRandomChange` | `boolean` | Emitted when the random mode is toggled. |
| `loopModeChange` | `LoopModeType` | Emitted when the loop mode is changed. |
| `repeatCurrentOnPrevChange` | `boolean` | Emitted when the "repeat on prev" setting is toggled. |
| `smoothPlayPauseVolumeChange` | `boolean` | Emitted when the smooth play/pause volume setting is toggled. |
| `smoothStopVolumeChange` | `boolean` | Emitted when the smooth stop volume setting is toggled. |
| `fadeVolumeSpeedChange` | `number` | Emitted when the volume fade speed is updated. |
| `prevClickTimeoutDurationChange` | `number` | Emitted when the "repeat on prev" timeout duration is updated. |
| `muteChange` | `boolean` | Emitted when the mute state is toggled. |

### 💀 Lifecycle Events
| Event | Data Type | Description |
| :--- | :--- | :--- |
| `destroyed` | `void` | Emitted when the `destroy()` method has finished executing. |

---

## ⚠️ Error Handling

The class uses strict validation. The following errors may be thrown:
* **`TypeError`**: Thrown when an argument is of the wrong type (e.g., invalid index type, non-boolean options, invalid adapter instance, or empty storage key).
* **`RangeError`**: Thrown when a number is out of allowed bounds (e.g., negative time, volume outside `0.0`-`1.0`, negative durations, or index out of playlist bounds).
* **`Error`**: Thrown if no compatible adapter is found for the current content.
