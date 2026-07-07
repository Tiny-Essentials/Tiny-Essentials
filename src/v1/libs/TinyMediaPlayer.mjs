import {
  getMediaContentBase,
  getMediaContentMetadata,
  parseMediaMetadata,
  valMediaContentMetadata,
} from '../basics/mediaContent.mjs';

/**
 * @typedef {import('../basics/mediaContent.mjs').MediaContent} MediaContent
 * @typedef {import('../basics/mediaContent.mjs').MediaContentBase} MediaContentBase
 * @typedef {import('../basics/mediaContent.mjs').MediaContentMetadata} MediaContentMetadata
 * @typedef {import('../basics/mediaContent.mjs').ParseMediaContentMetadata} ParseMediaContentMetadata
 * @typedef {import('../basics/mediaContent.mjs').LoadingMediaProgress} LoadingMediaProgress
 * @typedef {import('../basics/mediaContent.mjs').MediaLoadingErrorData} MediaLoadingErrorData
 * @typedef {import('../basics/mediaContent.mjs').UnknownArtistGetter} UnknownArtistGetter
 */

/**
 * @typedef {'NONE' | 'TRACK' | 'PLAYLIST'} LoopModeType
 */

/**
 * Configuration options for initializing the UniversalMediaPlayer.
 * @typedef {Object} TinyMediaPlayerOptions
 * @property {boolean} [persistVolume=false] - Whether to automatically save the volume in localStorage.
 * @property {string} [volumeStorageKey='universal_media_player_volume'] - The specific key name used for localStorage cache.
 */

/**
 * Interface definition for a Media Provider Adapter.
 * All specific API wrappers must extend and implement this class.
 * @abstract
 */
class BaseMediaAdapter {
  constructor() {
    if (new.target === BaseMediaAdapter) {
      throw new Error('BaseMediaAdapter is an abstract class and cannot be instantiated directly.');
    }
  }

  /**
   * Determines if this adapter can play the provided content.
   * @param {MediaContent} content - The media content to evaluate.
   * @returns {boolean} True if the adapter can handle the content, false otherwise.
   */
  canHandle(content) {
    throw new Error('Method "canHandle" must be implemented by the subclass.');
  }

  /**
   * Starts or resumes playback of the provided content.
   * @param {MediaContent} content - The media content to play.
   * @returns {Promise<void>}
   */
  async play(content) {
    throw new Error('Method "play" must be implemented by the subclass.');
  }

  /**
   * Pauses the current playback.
   * @returns {Promise<void>}
   */
  async pause() {
    throw new Error('Method "pause" must be implemented by the subclass.');
  }

  /**
   * Stops the playback completely and resets the internal platform state.
   * @returns {Promise<void>}
   */
  async stop() {
    throw new Error('Method "stop" must be implemented by the subclass.');
  }

  /**
   * Seeks to a specific time in the media timeline.
   * @param {number} timeMs - The target time in milliseconds.
   * @returns {Promise<void>}
   */
  async seek(timeMs) {
    throw new Error('Method "seek" must be implemented by the subclass.');
  }

  /**
   * Retrieves the current playback time from the underlying API.
   * @returns {number} The current time in milliseconds.
   */
  getCurrentTime() {
    throw new Error('Method "getCurrentTime" must be implemented by the subclass.');
  }

  /**
   * Sets the playback volume for the underlying API.
   * @param {number} volume - The volume level from 0.0 to 1.0.
   * @returns {void}
   */
  setVolume(volume) {
    throw new Error('Method "setVolume" must be implemented by the subclass.');
  }
}

/**
 * Represents a search match containing the media object and its exact playlist index.
 * @typedef {Object} SearchResult
 * @property {MediaContent} track - The matched media content.
 * @property {number} index - The current index of the track in the playlist.
 */

/**
 * A universal media player manager capable of orchestrating multiple API adapters.
 */
class TinyMediaPlayer {
  static BaseMediaAdapter = BaseMediaAdapter;

  /**
   * @type {UnknownArtistGetter}
   * The default identifier or function used when an artist cannot be determined.
   */
  static #unknownArtist = 'Unknown Artist';

  /**
   * Gets the current value used to represent unknown artists.
   * @returns {UnknownArtistGetter}
   */
  static get unknownArtist() {
    return TinyMediaPlayer.#unknownArtist;
  }

  /**
   * Sets the value used to represent unknown artists.
   * @param {UnknownArtistGetter} value - A string or a function that returns a string.
   * @throws {TypeError} If the value is neither a string nor a function.
   */
  static set unknownArtist(value) {
    if (typeof value !== 'string' && typeof value !== 'function')
      throw new TypeError('unknownArtist must have an string or function.');
    TinyMediaPlayer.#unknownArtist = value;
  }

  /**
   * A Static Factory Method that prepares a MediaContent object by
   * extracting metadata from an audio source.
   *
   * @param {string | HTMLMediaElement} source - A URL string or an existing Audio object.
   * @param {Partial<MediaContentBase & MediaContentMetadata> & { id?: string; weight?: number }} [defaultMetadata={}] - Optional default metadata that overrides automatic extraction.
   * @param {Partial<MediaContentBase & MediaContentMetadata> & { id?: string; weight?: number }} [metadata={}] - Optional manual metadata that overrides automatic extraction.
   * @param {ParseMediaContentMetadata} [parseFile] - Private helper to interface with parseFile.
   * @param {Object} [callbacks={}] - Callbacks for monitoring the loading process.
   * @param {(progress: LoadingMediaProgress) => void} [callbacks.onProgress] - Callback triggered on stage changes.
   * @param {(error: MediaLoadingErrorData) => void} [callbacks.onError] - Callback triggered when a non-fatal or fatal error occurs.
   * @returns {Promise<MediaContent>} A promise that resolves to a valid MediaContent object.
   * @throws {MediaLoadingError} If the preparation process fails at any stage.
   */
  static async parseContent(source, defaultMetadata, metadata, parseFile, callbacks) {
    return parseMediaMetadata(
      source,
      defaultMetadata,
      metadata,
      parseFile,
      callbacks,
      TinyMediaPlayer.#unknownArtist,
    );
  }

  /** @type {Map<string, BaseMediaAdapter>} */
  #adapters = new Map();

  /** @type {MediaContent[]} */
  #playlist = [];

  /** @type {number} */
  #currentIndex = -1;

  /** @type {LoopModeType} */
  #loopMode = 'NONE';

  /** @type {boolean} */
  #isRandom = false;

  /** @type {boolean} */
  #isPlaying = false;

  /** @type {number} */
  #volume = 1.0;

  /** @type {boolean} */
  #persistVolume;

  /** @type {string} */
  #volumeStorageKey;

  /**
   * @param {TinyMediaPlayerOptions} [options={}] - Configuration parameters for the player.
   */
  constructor(options = {}) {
    // Volume configuration
    this.#persistVolume = Boolean(options.persistVolume);
    this.#volumeStorageKey =
      typeof options.volumeStorageKey === 'string'
        ? options.volumeStorageKey
        : 'tiny_media_player_volume';

    if (this.#persistVolume) this.#loadVolumeFromStorage();
  }

  // ==========================================
  // STORAGE HELPERS
  // ==========================================

  /**
   * Attempts to load the volume state from localStorage safely.
   */
  #loadVolumeFromStorage() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedValue = window.localStorage.getItem(this.#volumeStorageKey);
        if (storedValue !== null) {
          const parsedVolume = parseFloat(storedValue);
          if (!isNaN(parsedVolume) && parsedVolume >= 0 && parsedVolume <= 1) {
            this.#volume = parsedVolume;
          }
        }
      }
    } catch (error) {
      console.warn('[TinyMediaPlayer] Failed to read volume from localStorage.', error);
    }
  }

  /**
   * Attempts to save the current volume state to localStorage safely.
   */
  #saveVolumeToStorage() {
    try {
      if (this.#persistVolume && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.#volumeStorageKey, this.#volume.toString());
      }
    } catch (error) {
      console.warn('[TinyMediaPlayer] Failed to save volume to localStorage.', error);
    }
  }

  // ==========================================
  // GETTERS & STRICT SETTERS
  // ==========================================

  /** @returns {MediaContent[]} A shallow copy of the current playlist. */
  get playlist() {
    return [...this.#playlist];
  }

  /**
   * @param {MediaContent[]} value - The new playlist array.
   * @throws {TypeError} If the value is not an array.
   */
  set playlist(value) {
    if (!Array.isArray(value)) {
      throw new TypeError('Playlist must be an array of MediaContent objects.');
    }

    value.forEach((value) => valMediaContentMetadata(value));
    const wasPlaying = this.#isPlaying;
    let oldAdapter = null;

    // Capture the active adapter before making structural changes
    if (this.#currentIndex !== -1 && this.#playlist.length > 0) {
      try {
        oldAdapter = this.#getActiveAdapter();
      } catch (error) {
        // Ignore if no compatible adapter was found for the old content
      }
    }

    this.#playlist = value;

    // Validation to correct currentIndex ensuring it aligns with the new playlist limits
    if (this.#playlist.length === 0) {
      this.#currentIndex = -1;
    } else if (this.#currentIndex >= this.#playlist.length) {
      this.#currentIndex = 0; // Reset to start if out of bounds
    } else if (this.#currentIndex === -1) {
      this.#currentIndex = 0; // Auto-select first item if previously empty
    }

    // Immediately adapt to the new state if it was playing
    if (wasPlaying) {
      (async () => {
        try {
          if (oldAdapter) await oldAdapter.stop();
          if (this.#currentIndex !== -1) await this.play();
        } catch (error) {
          console.warn('[TinyMediaPlayer] Background transition error on playlist update:', error);
        }
      })();
    }
  }

  /** @returns {number} The current active index in the playlist. */
  get currentIndex() {
    return this.#currentIndex;
  }

  /**
   * @param {number} value - The index to set as current.
   * @throws {TypeError} If the value is not a number.
   * @throws {RangeError} If the index is out of the playlist bounds (unless -1 for empty).
   */
  set currentIndex(value) {
    if (typeof value !== 'number') {
      throw new TypeError('Current index must be a number.');
    }
    if (value < -1 || (value >= this.#playlist.length && this.#playlist.length > 0)) {
      throw new RangeError(`Index ${value} is out of bounds for the current playlist.`);
    }

    if (this.#currentIndex === value) return; // Optimization: do nothing if index is the same

    const wasPlaying = this.#isPlaying;
    let oldAdapter = null;

    if (this.#currentIndex !== -1 && this.#playlist.length > 0) {
      try {
        oldAdapter = this.#getActiveAdapter();
      } catch (error) {
        // Ignore
      }
    }

    this.#currentIndex = value;

    // Automatically correct the audio output to match the new current index
    if (wasPlaying) {
      (async () => {
        try {
          if (oldAdapter) await oldAdapter.stop();
          if (this.#currentIndex !== -1) await this.play();
        } catch (error) {
          console.warn('[TinyMediaPlayer] Background transition error on index update:', error);
        }
      })();
    }
  }

  /** @returns {LoopModeType} The current loop configuration. */
  get loopMode() {
    return this.#loopMode;
  }

  /**
   * @param {LoopModeType} value - The desired loop mode.
   * @throws {TypeError} If the value is not a valid LoopModeType.
   */
  set loopMode(value) {
    const validModes = ['NONE', 'TRACK', 'PLAYLIST'];
    if (!validModes.includes(value)) {
      throw new TypeError(`Loop mode must be one of: ${validModes.join(', ')}.`);
    }
    this.#loopMode = value;
  }

  /** @returns {boolean} The current random mode status. */
  get isRandom() {
    return this.#isRandom;
  }

  /**
   * @param {boolean} value - True to enable random playback, false otherwise.
   * @throws {TypeError} If the value is not a boolean.
   */
  set isRandom(value) {
    if (typeof value !== 'boolean') {
      throw new TypeError('Random mode state must be a boolean.');
    }
    this.#isRandom = value;
  }

  /** @returns {boolean} True if media is actively playing. */
  get isPlaying() {
    return this.#isPlaying;
  }

  /** @returns {number} The current volume level (0.0 to 1.0). */
  get volume() {
    return this.#volume;
  }

  /**
   * @param {number} value - The volume level to set.
   * @throws {TypeError} If the value is not a number.
   * @throws {RangeError} If the value is outside the 0.0 to 1.0 range.
   */
  set volume(value) {
    if (typeof value !== 'number') throw new TypeError('Volume must be a number.');
    if (value < 0 || value > 1)
      throw new RangeError('Volume must be tightly constrained between 0.0 and 1.0.');

    this.#volume = value;
    this.#saveVolumeToStorage();

    // Immediately apply the new volume if a track is active
    if (this.#currentIndex !== -1 && this.#playlist.length > 0) {
      try {
        const adapter = this.#getActiveAdapter();
        if (adapter) adapter.setVolume(this.#volume);
      } catch (error) {
        // Fails silently if just adjusting volume on invalid content
      }
    }
  }

  /** @returns {boolean} Whether the volume cache is currently enabled. */
  get persistVolume() {
    return this.#persistVolume;
  }

  /**
   * @param {boolean} value - True to save volume dynamically to localStorage.
   * @throws {TypeError} If the value is not a boolean.
   */
  set persistVolume(value) {
    if (typeof value !== 'boolean') {
      throw new TypeError('Persist volume parameter must be a boolean.');
    }
    this.#persistVolume = value;
    if (value) {
      this.#saveVolumeToStorage();
    }
  }

  /** @returns {string} The localStorage key used for volume caching. */
  get volumeStorageKey() {
    return this.#volumeStorageKey;
  }

  /**
   * @param {string} value - The custom storage key string.
   * @throws {TypeError} If the value is not a string or is empty.
   */
  set volumeStorageKey(value) {
    if (typeof value !== 'string') {
      throw new TypeError('Volume storage key must be a string.');
    }
    if (value.trim() === '') {
      throw new TypeError('Volume storage key cannot be an empty string.');
    }

    const previousKey = this.#volumeStorageKey;
    this.#volumeStorageKey = value;

    // Migrate the cache to the new key if persistence is active
    try {
      if (this.#persistVolume && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(previousKey);
        this.#saveVolumeToStorage();
      }
    } catch (error) {
      console.warn('[TinyMediaPlayer] Failed to migrate volume storage key.', error);
    }
  }

  // ==========================================
  // ADAPTER MANAGEMENT
  // ==========================================

  /**
   * Registers a new media API adapter.
   * @param {string} id - Unique identifier for the platform (e.g., 'youtube', 'spotify').
   * @param {BaseMediaAdapter} adapter - An instance extending BaseMediaAdapter.
   * @throws {TypeError} If id is not a string or adapter is invalid.
   */
  registerAdapter(id, adapter) {
    if (typeof id !== 'string') {
      throw new TypeError('Adapter ID must be a string.');
    }
    if (!(adapter instanceof BaseMediaAdapter)) {
      throw new TypeError('Adapter must be an instance of BaseMediaAdapter.');
    }
    this.#adapters.set(id, adapter);
  }

  /**
   * Internal helper to find the correct API wrapper for the current content.
   * @returns {BaseMediaAdapter | null} The compatible adapter, or null if empty.
   * @throws {Error} If no compatible adapter is found for the content.
   */
  #getActiveAdapter() {
    if (this.#currentIndex === -1 || this.#playlist.length === 0) return null;
    const currentContent = this.#playlist[this.#currentIndex];

    for (const adapter of this.#adapters.values()) {
      if (adapter.canHandle(currentContent)) {
        return adapter;
      }
    }
    throw new Error(`No compatible adapter found for content ID: ${currentContent.id}.`);
  }

  // ==========================================
  // PLAYLIST MANAGEMENT
  // ==========================================

  /**
   * Adds a new item to the end of the playlist.
   * @param {MediaContent} content - The structured media content object.
   * @returns {number} The new length of the playlist.
   * @throws {TypeError} If content is invalid or missing required base properties.
   */
  addTrack(content) {
    if (!content || typeof content !== 'object' || typeof content.url !== 'string')
      throw new TypeError('Track content must be a valid MediaContent object containing a URL.');
    /** @type {MediaContent} */
    const newContent = { ...getMediaContentBase(), ...getMediaContentMetadata(), ...content };
    valMediaContentMetadata(newContent);

    const newLength = this.#playlist.push(newContent);
    if (this.#currentIndex === -1) {
      this.#currentIndex = 0;
    }
    return newLength;
  }

  /**
   * Checks if a track exists at the specified index.
   * @param {number} index - The target index.
   * @returns {boolean} True if the track exists, false otherwise.
   * @throws {TypeError} If the index is not a number.
   */
  existsTrack(index) {
    if (typeof index !== 'number') {
      throw new TypeError('Index must be a number.');
    }
    return index >= 0 && index < this.#playlist.length;
  }

  /**
   * Retrieves the track at the specified index.
   * @param {number} index - The target index.
   * @returns {MediaContent} The media content object.
   * @throws {TypeError} If the index is not a number.
   * @throws {RangeError} If the index is out of bounds.
   */
  getTrack(index) {
    if (typeof index !== 'number') {
      throw new TypeError('Index must be a number.');
    }
    if (!this.existsTrack(index)) {
      throw new RangeError(`Index ${index} is out of bounds for the current playlist.`);
    }
    return this.#playlist[index];
  }

  /**
   * Removes the track at the specified index and manages playback state accordingly.
   * @param {number} index - The index of the track to remove.
   * @returns {Promise<void>}
   * @throws {TypeError} If the index is not a number.
   * @throws {RangeError} If the index is out of bounds.
   */
  async removeTrack(index) {
    if (typeof index !== 'number') {
      throw new TypeError('Index must be a number.');
    }
    if (!this.existsTrack(index)) {
      throw new RangeError(`Index ${index} is out of bounds for the current playlist.`);
    }

    if (index === this.#currentIndex) {
      // Stop the current track if it is the one being removed
      await this.stop();
      this.#playlist.splice(index, 1);

      if (this.#playlist.length === 0) {
        this.#currentIndex = -1;
      } else if (this.#currentIndex >= this.#playlist.length) {
        // If we removed the last item and others exist, reset index safely
        this.#currentIndex = 0;
      }
    } else {
      this.#playlist.splice(index, 1);
      // Correct the current index offset if a track before it was removed
      if (index < this.#currentIndex) {
        this.#currentIndex -= 1;
      }
    }
  }

  /**
   * Searches the playlist for tracks matching a string query or a custom evaluation function.
   * @param {string | function(MediaContent): boolean} query - The search string (checked against title, artist, album) or a callback returning a boolean.
   * @returns {SearchResult[]} An array containing the matched tracks and their corresponding indices.
   * @throws {TypeError} If the query is neither a string nor a function.
   */
  searchTrack(query) {
    if (typeof query !== 'string' && typeof query !== 'function') {
      throw new TypeError('Search query must be a string or a boolean evaluation function.');
    }

    const results = [];

    for (let i = 0; i < this.#playlist.length; i++) {
      const track = this.#playlist[i];
      let isMatch = false;

      if (typeof query === 'function') {
        isMatch = Boolean(query(track));
      } else {
        const lowerQuery = query.toLowerCase();
        const titleMatch = track.title && track.title.toLowerCase().includes(lowerQuery);
        const artistMatch = track.artist && track.artist.toLowerCase().includes(lowerQuery);
        const albumMatch = track.album && track.album.toLowerCase().includes(lowerQuery);

        isMatch = Boolean(titleMatch || artistMatch || albumMatch);
      }

      if (isMatch) {
        results.push({ track, index: i });
      }
    }

    return results;
  }

  /**
   * Clears the entire playlist and stops playback.
   */
  async clearPlaylist() {
    await this.stop();
    this.#playlist = [];
    this.#currentIndex = -1;
  }

  // ==========================================
  // PLAYBACK CONTROLS
  // ==========================================

  /**
   * Starts or resumes playback of the current track.
   * @returns {Promise<void>}
   */
  async play() {
    const adapter = this.#getActiveAdapter();
    if (!adapter) return;

    // Ensure the adapter aligns with the global volume before playing
    adapter.setVolume(this.#volume);

    await adapter.play(this.#playlist[this.#currentIndex]);
    this.#isPlaying = true;
  }

  /**
   * Pauses the current track.
   * @returns {Promise<void>}
   */
  async pause() {
    const adapter = this.#getActiveAdapter();
    if (!adapter) return;

    await adapter.pause();
    this.#isPlaying = false;
  }

  /**
   * Stops playback completely.
   * @returns {Promise<void>}
   */
  async stop() {
    const adapter = this.#getActiveAdapter();
    if (!adapter) return;

    await adapter.stop();
    this.#isPlaying = false;
  }

  /**
   * Advances to the next track based on random and loop modes.
   * @returns {Promise<void>}
   */
  async next() {
    if (this.#playlist.length === 0) return;

    await this.stop();

    if (this.#loopMode === 'TRACK') {
      // Index remains the same
      await this.play();
      return;
    }

    if (this.#isRandom) {
      this.#currentIndex = Math.floor(Math.random() * this.#playlist.length);
    } else {
      let nextIndex = this.#currentIndex + 1;
      if (nextIndex >= this.#playlist.length) {
        if (this.#loopMode === 'PLAYLIST') {
          nextIndex = 0;
        } else {
          // End of playlist, stop playing
          return;
        }
      }
      this.#currentIndex = nextIndex;
    }

    await this.play();
  }

  /**
   * Returns to the previous track.
   * @returns {Promise<void>}
   */
  async prev() {
    if (this.#playlist.length === 0) return;

    await this.stop();

    if (this.#isRandom) {
      this.#currentIndex = Math.floor(Math.random() * this.#playlist.length);
    } else {
      let prevIndex = this.#currentIndex - 1;
      if (prevIndex < 0) {
        if (this.#loopMode === 'PLAYLIST') {
          prevIndex = this.#playlist.length - 1;
        } else {
          // End of playlist, stop playing
          return;
        }
      }
      this.#currentIndex = prevIndex;
    }

    await this.play();
  }

  /**
   * Jumps to a specific absolute time in the timeline.
   * @param {number} timeMs - The target time in milliseconds.
   * @throws {TypeError} If timeMs is not a number.
   * @throws {RangeError} If timeMs is negative.
   * @returns {Promise<void>}
   */
  async seek(timeMs) {
    if (typeof timeMs !== 'number') {
      throw new TypeError('Seek time must be a number in milliseconds.');
    }
    if (timeMs < 0) {
      throw new RangeError('Seek time cannot be negative.');
    }

    const adapter = this.#getActiveAdapter();
    if (adapter) {
      await adapter.seek(timeMs);
    }
  }

  /**
   * Moves the timeline forwards or backwards by a specified step amount.
   * @param {number} stepMs - The amount of milliseconds to step (positive for forward, negative for backward).
   * @throws {TypeError} If stepMs is not a number.
   * @returns {Promise<void>}
   */
  async step(stepMs) {
    if (typeof stepMs !== 'number') {
      throw new TypeError('Step amount must be a number in milliseconds.');
    }

    const adapter = this.#getActiveAdapter();
    if (!adapter) return;

    const currentTime = adapter.getCurrentTime();
    let targetTime = currentTime + stepMs;

    // Prevent stepping below 0
    if (targetTime < 0) targetTime = 0;

    await this.seek(targetTime);
  }
}

export default TinyMediaPlayer;
