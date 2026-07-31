import { EventEmitter } from 'events';

import {
  getMediaContentBase,
  getMediaContentMetadata,
  parseMediaMetadata,
  valMediaContentMetadata,
} from '../basics/mediaContent.mjs';
import { createCheckDestroyed } from './utils.mjs';
import { BaseMediaAdapter } from './TinyMediaPlayer/index.mjs';
import { isValidObj } from '../basics/objChecker.mjs';

const checkDestroy = createCheckDestroyed('TinyMediaPlayer');

/**
 * @typedef {import('../basics/mediaContent.mjs').PictureDataType} PictureDataType
 * @typedef {import('../basics/mediaContent.mjs').MediaContent<PictureDataType>} MediaContent
 * @typedef {import('../basics/mediaContent.mjs').MediaContentBase} MediaContentBase
 * @typedef {import('../basics/mediaContent.mjs').MediaContentMetadata<PictureDataType>} MediaContentMetadata
 * @typedef {import('../basics/mediaContent.mjs').ParseMediaContentMetadata} ParseMediaContentMetadata
 * @typedef {import('../basics/mediaContent.mjs').LoadingMediaProgress} LoadingMediaProgress
 * @typedef {import('../basics/mediaContent.mjs').MediaLoadingErrorData} MediaLoadingErrorData
 * @typedef {import('../basics/mediaContent.mjs').UnknownArtistGetter} UnknownArtistGetter
 */

/**
 * The loop configuration modes.
 * @typedef {'NONE' | 'TRACK' | 'PLAYLIST'} LoopModeType
 */

/**
 * Configuration options for initializing the TinyMediaPlayer.
 * @typedef {Object} TinyMediaPlayerOptions
 * @property {boolean} [persistVolume=false] - Whether to automatically save the volume in localStorage.
 * @property {string} [volumeStorageKey='tiny_media_player_volume'] - The specific key name used for localStorage cache.
 * @property {boolean} [repeatCurrentOnPrev=false] - If true, clicking 'previous' repeats the current track on the first click.
 * @property {boolean} [smoothPlayPauseVolume=false] - If true, volume fades smoothly during play/pause transitions.
 * @property {boolean} [smoothStopVolume=false] - If true, volume fades smoothly to zero when stopping.
 */

/**
 * Represents a search match containing the media object and its exact playlist index.
 * @typedef {Object} SearchResult
 * @property {MediaContent} track - The matched media content.
 * @property {number} index - The current index of the track in the playlist.
 */

/**
 * A universal media player manager capable of orchestrating multiple API adapters.
 */
class TinyMediaPlayer extends EventEmitter {
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
      throw new TypeError('unknownArtist must be a string or a function.');
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

  /** @type {boolean} */
  #destroyed = false;

  get destroyed() {
    return this.#destroyed;
  }

  /** @type {Set<BaseMediaAdapter>} */
  #adapters = new Set();

  /** @type {WeakMap<BaseMediaAdapter, (timeMs: number) => void>} */
  #adapterHandlers = new WeakMap();

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

  /** @type {boolean} */
  #repeatCurrentOnPrev;

  /** @type {boolean} */
  #prevClickedToRepeat = false;

  /** @type {boolean} */
  #smoothPlayPauseVolume;

  /** @type {boolean} */
  #smoothStopVolume;

  /** @type {AbortController | null} */
  #fadeController = null;

  /** @type {ReturnType<typeof setTimeout> | null} */
  #prevClickTimer = null;

  /** @type {number} */
  #fadeVolumeSpeed = 300;

  /** @returns {number} The duration (ms) of the volume fade speed. */
  get fadeVolumeSpeed() {
    checkDestroy(this.#destroyed);
    return this.#fadeVolumeSpeed;
  }

  /**
   * @param {number} value - The new duration in milliseconds.
   * @throws {TypeError} If the value is not a number.
   * @throws {RangeError} If the value is negative.
   */
  set fadeVolumeSpeed(value) {
    checkDestroy(this.#destroyed);
    if (typeof value !== 'number') throw new TypeError('fadeVolumeSpeed must be a number.');
    if (value < 0) throw new RangeError('fadeVolumeSpeed cannot be negative.');
    this.#fadeVolumeSpeed = value;
    this.emit('fadeVolumeSpeedChange', this.#fadeVolumeSpeed);
  }

  /** @type {number} */
  #prevClickTimeoutDuration = 2000;

  /** @returns {number} The duration (ms) before the prev click state resets. */
  get prevClickTimeoutDuration() {
    checkDestroy(this.#destroyed);
    return this.#prevClickTimeoutDuration;
  }

  /**
   * @param {number} value - The new duration in milliseconds.
   * @throws {TypeError} If the value is not a number.
   * @throws {RangeError} If the value is negative.
   */
  set prevClickTimeoutDuration(value) {
    checkDestroy(this.#destroyed);
    if (typeof value !== 'number')
      throw new TypeError('prevClickTimeoutDuration must be a number.');
    if (value < 0) throw new RangeError('prevClickTimeoutDuration cannot be negative.');
    this.#prevClickTimeoutDuration = value;
    this.emit('prevClickTimeoutDurationChange', this.#prevClickTimeoutDuration);
  }

  /** @returns {boolean} True if clicking 'previous' repeats the current track on the first click. */
  get repeatCurrentOnPrev() {
    checkDestroy(this.#destroyed);
    return this.#repeatCurrentOnPrev;
  }

  /**
   * @param {boolean} value - The repeat mode state.
   * @throws {TypeError} If the value is not a boolean.
   */
  set repeatCurrentOnPrev(value) {
    checkDestroy(this.#destroyed);
    if (typeof value !== 'boolean') {
      throw new TypeError('repeatCurrentOnPrev must be a boolean.');
    }
    this.#repeatCurrentOnPrev = value;
    this.emit('repeatCurrentOnPrevChange', this.#repeatCurrentOnPrev);
  }

  /** @returns {boolean} True if volume fades smoothly during play/pause transitions. */
  get smoothPlayPauseVolume() {
    checkDestroy(this.#destroyed);
    return this.#smoothPlayPauseVolume;
  }

  /**
   * @param {boolean} value - The smooth play/pause volume mode.
   * @throws {TypeError} If the value is not a boolean.
   */
  set smoothPlayPauseVolume(value) {
    checkDestroy(this.#destroyed);
    if (typeof value !== 'boolean') {
      throw new TypeError('smoothPlayPauseVolume must be a boolean.');
    }
    this.#smoothPlayPauseVolume = value;
    this.emit('smoothPlayPauseVolumeChange', this.#smoothPlayPauseVolume);
  }

  /** @returns {boolean} True if volume fades smoothly to zero when stopping. */
  get smoothStopVolume() {
    checkDestroy(this.#destroyed);
    return this.#smoothStopVolume;
  }

  /**
   * @param {boolean} value - The smooth stop volume mode.
   * @throws {TypeError} If the value is not a boolean.
   */
  set smoothStopVolume(value) {
    checkDestroy(this.#destroyed);
    if (typeof value !== 'boolean') {
      throw new TypeError('smoothStopVolume must be a boolean.');
    }
    this.#smoothStopVolume = value;
    this.emit('smoothStopVolumeChange', this.#smoothStopVolume);
  }

  /**
   * @param {TinyMediaPlayerOptions} [options={}] - Configuration parameters for the player.
   * @throws {TypeError} If options is not a valid object.
   * @throws {TypeError} If option values do not match their expected types.
   * @throws {RangeError} If numeric options are out of valid ranges.
   */
  constructor(options = {}) {
    super();
    if (!isValidObj(options)) {
      throw new TypeError('Options must be a non-null object.');
    }

    // Volume configuration
    if (options.persistVolume !== undefined) {
      if (typeof options.persistVolume !== 'boolean') {
        throw new TypeError('persistVolume must be a boolean.');
      }
      this.#persistVolume = options.persistVolume;
    } else {
      this.#persistVolume = false;
    }

    if (options.volumeStorageKey !== undefined) {
      if (typeof options.volumeStorageKey !== 'string')
        throw new TypeError('volumeStorageKey must be a string.');
      this.#volumeStorageKey = options.volumeStorageKey;
    } else {
      this.#volumeStorageKey = 'tiny_media_player_volume';
    }

    // UX Options
    if (options.repeatCurrentOnPrev !== undefined) {
      if (typeof options.repeatCurrentOnPrev !== 'boolean') {
        throw new TypeError('repeatCurrentOnPrev must be a boolean.');
      }
      this.#repeatCurrentOnPrev = options.repeatCurrentOnPrev;
    } else {
      this.#repeatCurrentOnPrev = false;
    }

    if (options.smoothPlayPauseVolume !== undefined) {
      if (typeof options.smoothPlayPauseVolume !== 'boolean') {
        throw new TypeError('smoothPlayPauseVolume must be a boolean.');
      }
      this.#smoothPlayPauseVolume = options.smoothPlayPauseVolume;
    } else {
      this.#smoothPlayPauseVolume = false;
    }

    if (options.smoothStopVolume !== undefined) {
      if (typeof options.smoothStopVolume !== 'boolean') {
        throw new TypeError('smoothStopVolume must be a boolean.');
      }
      this.#smoothStopVolume = options.smoothStopVolume;
    } else {
      this.#smoothStopVolume = false;
    }

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
  // INTERNAL HELPERS
  // ==========================================

  /**
   * Calculates a random index based on the weighted probability of each track,
   * strictly excluding the currently active track to prevent immediate repetition.
   * @returns {number} The selected index.
   * @private
   */
  _getWeightedRandomIndex() {
    if (this.#playlist.length === 0) return -1;
    if (this.#playlist.length === 1) return 0;

    let totalWeight = 0;

    // Calculate total sum of all weights, skipping the current track
    for (let i = 0; i < this.#playlist.length; i++) {
      if (i === this.#currentIndex) continue;

      const track = this.#playlist[i];
      const weight = typeof track.weight === 'number' && track.weight > 0 ? track.weight : 1;
      totalWeight += weight;
    }

    // Pick a random number between 0 and totalWeight
    let randomThreshold = Math.random() * totalWeight;

    // Find the track that corresponds to this threshold, skipping the current track
    for (let i = 0; i < this.#playlist.length; i++) {
      if (i === this.#currentIndex) continue;

      const track = this.#playlist[i];
      const weight = typeof track.weight === 'number' && track.weight > 0 ? track.weight : 1;

      if (randomThreshold < weight) {
        return i;
      }
      randomThreshold -= weight;
    }

    // Fallback in case of floating point inaccuracies
    return this.#currentIndex === this.#playlist.length - 1 ? 0 : this.#playlist.length - 1;
  }

  /**
   * Handles smooth volume transitions for the active adapter.
   * @param {number} targetVolume - The volume to transition to.
   * @returns {Promise<void>}
   */
  async #fadeAdapterVolume(targetVolume) {
    if (this.#fadeController) {
      this.#fadeController.abort();
    }

    this.#fadeController = new AbortController();
    const { signal } = this.#fadeController;

    const adapter = this.#getActiveAdapter();
    if (!adapter) return;

    const startVolume = adapter.getVolume();
    const startTime = performance.now();
    const duration = this.#fadeVolumeSpeed;

    return new Promise((resolve) => {
      /** @param {number} currentTime */
      const step = (currentTime) => {
        if (signal.aborted) return resolve();

        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const calculatedVolume = startVolume + (targetVolume - startVolume) * progress;
        const clampedVolume = Math.max(0, Math.min(1, calculatedVolume));
        adapter.setVolume(clampedVolume);

        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          adapter.setVolume(targetVolume);
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  // ==========================================
  // GETTERS & STRICT SETTERS
  // ==========================================

  /** @returns {MediaContent[]} A shallow copy of the current playlist. */
  get playlist() {
    checkDestroy(this.#destroyed);
    return [...this.#playlist];
  }

  /**
   * @param {MediaContent[]} value - The new playlist array.
   * @throws {TypeError} If the value is not an array.
   */
  set playlist(value) {
    checkDestroy(this.#destroyed);
    if (!Array.isArray(value)) {
      throw new TypeError('Playlist must be an array of MediaContent objects.');
    }

    value.forEach((val) => valMediaContentMetadata(val));
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
    this.emit('playlistUpdate', this.playlist);

    // Validation to correct currentIndex ensuring it aligns with the new playlist limits
    if (this.#playlist.length === 0) {
      this.#currentIndex = -1;
    } else if (this.#currentIndex >= this.#playlist.length) {
      this.#currentIndex = 0; // Reset to start if out of bounds
    } else if (this.#currentIndex === -1) {
      this.#currentIndex = 0; // Auto-select first item if previously empty
    }

    this.emit('trackChange', this.#currentIndex);

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
    checkDestroy(this.#destroyed);
    return this.#currentIndex;
  }

  /**
   * @param {number} value - The index to set as current.
   * @throws {TypeError} If the value is not a number.
   * @throws {RangeError} If the index is out of the playlist bounds (unless -1 for empty).
   */
  set currentIndex(value) {
    checkDestroy(this.#destroyed);
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
    this.emit('trackChange', this.#currentIndex);

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
    checkDestroy(this.#destroyed);
    return this.#loopMode;
  }

  /**
   * @param {LoopModeType} value - The desired loop mode.
   * @throws {TypeError} If the value is not a valid LoopModeType.
   */
  set loopMode(value) {
    checkDestroy(this.#destroyed);
    const validModes = ['NONE', 'TRACK', 'PLAYLIST'];
    if (!validModes.includes(value)) {
      throw new TypeError(`Loop mode must be one of: ${validModes.join(', ')}.`);
    }
    this.#loopMode = value;
    this.emit('loopModeChange', this.#loopMode);
  }

  /** @returns {boolean} The current random mode status. */
  get isRandom() {
    checkDestroy(this.#destroyed);
    return this.#isRandom;
  }

  /**
   * @param {boolean} value - True to enable random playback, false otherwise.
   * @throws {TypeError} If the value is not a boolean.
   */
  set isRandom(value) {
    checkDestroy(this.#destroyed);
    if (typeof value !== 'boolean') {
      throw new TypeError('Random mode state must be a boolean.');
    }
    this.#isRandom = value;
    this.emit('randomModeChange', this.#isRandom);
  }

  /** @returns {boolean} True if media is actively playing. */
  get isPlaying() {
    checkDestroy(this.#destroyed);
    return this.#isPlaying;
  }

  /** @returns {number} The current volume level (0.0 to 1.0). */
  get volume() {
    checkDestroy(this.#destroyed);
    return this.#volume;
  }

  /**
   * @param {number} value - The volume level to set.
   * @throws {TypeError} If the value is not a number.
   * @throws {RangeError} If the value is outside the 0.0 to 1.0 range.
   */
  set volume(value) {
    checkDestroy(this.#destroyed);
    if (typeof value !== 'number') throw new TypeError('Volume must be a number.');
    if (value < 0 || value > 1)
      throw new RangeError('Volume must be tightly constrained between 0.0 and 1.0.');

    // Abort any ongoing fade to ensure manual control is immediate
    if (this.#fadeController) this.#fadeController.abort();

    this.#volume = value;
    this.#saveVolumeToStorage();
    this.emit('volumeChange', this.#volume);

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
    checkDestroy(this.#destroyed);
    return this.#persistVolume;
  }

  /**
   * @param {boolean} value - True to save volume dynamically to localStorage.
   * @throws {TypeError} If the value is not a boolean.
   */
  set persistVolume(value) {
    checkDestroy(this.#destroyed);
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
    checkDestroy(this.#destroyed);
    return this.#volumeStorageKey;
  }

  /**
   * @param {string} value - The custom storage key string.
   * @throws {TypeError} If the value is not a string or is empty.
   */
  set volumeStorageKey(value) {
    checkDestroy(this.#destroyed);
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

  get adapters() {
    return Array.from(this.#adapters);
  }

  get adaptersSize() {
    return this.#adapters.size;
  }

  /**
   * Removes the timeupdate on adapter emitter.
   * @param {BaseMediaAdapter} adapter
   */
  #removeHandler(adapter) {
    const handler = this.#adapterHandlers.get(adapter);
    if (handler) {
      adapter.off('timeupdate', handler);
      this.#adapterHandlers.delete(adapter);
    }
  }

  /**
   * Registers a new media API adapter.
   * @param {BaseMediaAdapter} adapter - An instance extending BaseMediaAdapter.
   * @throws {TypeError} If adapter is invalid.
   */
  registerAdapter(adapter) {
    checkDestroy(this.#destroyed);
    if (!(adapter instanceof BaseMediaAdapter)) {
      throw new TypeError('Adapter must be an instance of BaseMediaAdapter.');
    }

    // Bind the timeupdate event from the adapter to the player
    /** @param {number} timeMs */
    const handler = (timeMs) => {
      if (!this.#destroyed) {
        this.emit('timeupdate', timeMs);
      }
    };

    this.#adapterHandlers.set(adapter, handler);
    adapter.on('timeupdate', handler);

    this.#adapters.add(adapter);
  }

  /**
   * Removes a media API adapter.
   * @param {BaseMediaAdapter} adapter - An instance extending BaseMediaAdapter.
   * @throws {TypeError} If adapter is invalid.
   */
  removeAdapter(adapter) {
    checkDestroy(this.#destroyed);
    if (!(adapter instanceof BaseMediaAdapter)) {
      throw new TypeError('Adapter must be an instance of BaseMediaAdapter.');
    }
    this.#removeHandler(adapter);
    return this.#adapters.delete(adapter);
  }

  /**
   * Destroys and removes a media API adapter.
   * @param {BaseMediaAdapter} adapter - An instance extending BaseMediaAdapter.
   * @throws {TypeError} If adapter is invalid.
   */
  destroyAdapter(adapter) {
    checkDestroy(this.#destroyed);
    if (!(adapter instanceof BaseMediaAdapter)) {
      throw new TypeError('Adapter must be an instance of BaseMediaAdapter.');
    }
    this.#removeHandler(adapter);
    const result = this.#adapters.delete(adapter);
    if (result) adapter.destroy();
    return result;
  }

  /**
   * If exists a media API adapter.
   * @param {BaseMediaAdapter} adapter - An instance extending BaseMediaAdapter.
   * @throws {TypeError} If adapter is invalid.
   */
  hasAdapter(adapter) {
    checkDestroy(this.#destroyed);
    if (!(adapter instanceof BaseMediaAdapter)) {
      throw new TypeError('Adapter must be an instance of BaseMediaAdapter.');
    }
    return this.#adapters.has(adapter);
  }

  /**
   * Destroys and removes all registered media adapters.
   */
  destroyAllAdapters() {
    checkDestroy(this.#destroyed);
    this.#adapters.forEach((adapter) => {
      this.#removeHandler(adapter);
      adapter.destroy();
    });
    this.#adapters.clear();
  }

  /**
   * Clears all registered media adapters.
   */
  clearAdapters() {
    checkDestroy(this.#destroyed);
    this.#adapters.forEach((adapter) => this.#removeHandler(adapter));
    this.#adapters.clear();
  }

  /**
   * Helper to find the correct API wrapper for the content.
   * @param {MediaContent} content - The content to check.
   * @returns {BaseMediaAdapter | null} The compatible adapter, or null if empty.
   * @throws {TypeError} If the content is invalid.
   */
  getMediaAdapter(content) {
    if (!isValidObj(content)) {
      throw new TypeError('Content must be a valid object.');
    }
    for (const adapter of this.#adapters.values()) {
      if (adapter.canHandle(content)) {
        return adapter;
      }
    }
    return null;
  }

  /**
   * Internal helper to find the correct API wrapper for the current content.
   * @returns {BaseMediaAdapter | null} The compatible adapter, or null if empty.
   * @throws {Error} If no compatible adapter is found for the content.
   */
  #getActiveAdapter() {
    if (this.#currentIndex === -1 || this.#playlist.length === 0) return null;
    const currentContent = this.#playlist[this.#currentIndex];
    const adapter = this.getMediaAdapter(currentContent);
    if (adapter) return adapter;
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
    checkDestroy(this.#destroyed);
    if (!isValidObj(content) || typeof content.url !== 'string') {
      throw new TypeError('Track content must be a valid MediaContent object containing a URL.');
    }

    /** @type {MediaContent} */
    const newContent = { ...getMediaContentBase(), ...getMediaContentMetadata(), ...content };
    valMediaContentMetadata(newContent);

    const newLength = this.#playlist.push(newContent);
    if (this.#currentIndex === -1) {
      this.#currentIndex = 0;
      this.emit('trackChange', this.#currentIndex);
    }
    this.emit('playlistUpdate', this.playlist);
    return newLength;
  }

  /**
   * Checks if a track exists at the specified index.
   * @param {number} index - The target index.
   * @returns {boolean} True if the track exists at the specified index.
   * @throws {TypeError} If the index is not a number.
   */
  existsTrack(index) {
    checkDestroy(this.#destroyed);
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
   * @throws {RangeError} If the index is out of the playlist bounds.
   */
  getTrack(index) {
    checkDestroy(this.#destroyed);
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
    checkDestroy(this.#destroyed);
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
        this.#currentIndex = 0; // Reset to start if out of bounds
      }
      this.emit('trackChange', this.#currentIndex);
    } else {
      this.#playlist.splice(index, 1);
      // Correct the current index offset if a track before it was removed
      if (index < this.#currentIndex) {
        this.#currentIndex -= 1;
        // Current track didn't change, just its index shifted
        this.emit('trackChange', this.#currentIndex);
      }
    }
    this.emit('playlistUpdate', this.playlist);
  }

  /**
   * Searches the playlist for tracks matching a string query or a custom evaluation function.
   * @param {string | ((content: MediaContent) => boolean)} query - The search string (checked against title, artist, album) or a callback returning a boolean.
   * @returns {SearchResult[]} An array containing the matched tracks and their corresponding indices.
   * @throws {TypeError} If the query is neither a string nor a function.
   */
  searchTrack(query) {
    checkDestroy(this.#destroyed);
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
    checkDestroy(this.#destroyed);
    await this.stop();
    this.#playlist = [];
    this.#currentIndex = -1;
    this.emit('playlistUpdate', this.playlist);
    this.emit('trackChange', this.#currentIndex);
  }

  // ==========================================
  // PLAYBACK CONTROLS
  // ==========================================

  /**
   * Starts or resumes playback of the current track.
   * @returns {Promise<void>}
   */
  async play() {
    checkDestroy(this.#destroyed);
    const adapter = this.#getActiveAdapter();
    if (!adapter) return;

    // Ensure the adapter aligns with the global volume before playing
    if (this.#smoothPlayPauseVolume) {
      await this.#fadeAdapterVolume(this.#volume);
    } else {
      adapter.setVolume(this.#volume);
    }

    await adapter.play(this.#playlist[this.#currentIndex]);
    this.#isPlaying = true;
    this.emit('play', this.#currentIndex);
  }

  /**
   * Pauses the current track.
   * @returns {Promise<void>}
   */
  async pause() {
    checkDestroy(this.#destroyed);
    const adapter = this.#getActiveAdapter();
    if (!adapter) return;

    if (this.#smoothPlayPauseVolume) {
      await this.#fadeAdapterVolume(0);
    }

    await adapter.pause();
    this.#isPlaying = false;
    this.emit('pause', this.#currentIndex);
  }

  /**
   * Stops playback completely.
   * @returns {Promise<void>}
   */
  async stop() {
    checkDestroy(this.#destroyed);
    const adapter = this.#getActiveAdapter();
    if (!adapter) return;

    if (this.#smoothStopVolume) {
      await this.#fadeAdapterVolume(0);
    }

    await adapter.stop();
    this.#isPlaying = false;
    this.emit('stop', this.#currentIndex);
  }

  /**
   * Advances to the next track based on random and loop modes.
   * @returns {Promise<void>}
   */
  async next() {
    checkDestroy(this.#destroyed);
    if (this.#playlist.length === 0) return;

    await this.stop();

    if (this.#loopMode === 'TRACK') {
      // Index remains the same
      await this.play();
      return;
    }

    if (this.#isRandom) {
      this.#currentIndex = this._getWeightedRandomIndex();
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

    this.emit('trackChange', this.#currentIndex);
    await this.play();
  }

  /**
   * Returns to the previous track.
   * @returns {Promise<void>}
   */
  async prev() {
    checkDestroy(this.#destroyed);
    if (this.#playlist.length === 0) return;

    // UX: Repeat current track if "repeat on prev" is enabled and it's the first click
    if (this.#repeatCurrentOnPrev && !this.#prevClickedToRepeat) {
      this.#prevClickedToRepeat = true;

      // Reset the "repeat" state after 2 seconds of inactivity to prevent glitches
      if (this.#prevClickTimer) clearTimeout(this.#prevClickTimer);
      this.#prevClickTimer = setTimeout(() => {
        this.#prevClickedToRepeat = false;
        this.#prevClickTimer = null;
      }, 2000);

      await this.play();
      return;
    }

    // If we reached here, it's either the second click or repeat is disabled
    if (this.#prevClickTimer) {
      clearTimeout(this.#prevClickTimer);
      this.#prevClickTimer = null;
    }
    this.#prevClickedToRepeat = false;

    await this.stop();

    if (this.#isRandom) {
      this.#currentIndex = this._getWeightedRandomIndex();
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

    this.emit('trackChange', this.#currentIndex);
    await this.play();
  }

  /**
   * Jumps to a specific absolute time in the timeline.
   * @param {number} timeMs - The target time in milliseconds.
   * @returns {Promise<void>}
   * @throws {TypeError} If timeMs is not a number.
   * @throws {RangeError} If timeMs is negative.
   */
  async seek(timeMs) {
    checkDestroy(this.#destroyed);
    if (typeof timeMs !== 'number') {
      throw new TypeError('Seek time must be a number in milliseconds.');
    }
    if (timeMs < 0) {
      throw new RangeError('Seek time cannot be negative.');
    }

    const adapter = this.#getActiveAdapter();
    if (adapter) {
      await adapter.seek(timeMs);
      this.emit('seek', timeMs);
    }
  }

  /**
   * Moves the timeline forwards or backwards by a specified step amount.
   * @param {number} stepMs - The amount of milliseconds to step (positive for forward, negative for backward).
   * @throws {TypeError} If stepMs is not a number.
   * @returns {Promise<void>}
   */
  async step(stepMs) {
    checkDestroy(this.#destroyed);
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

  // ==========================================
  // TIME UTILITIES (DELEGATED TO ADAPTERS)
  // ==========================================

  /**
   * Gets the current playback time.
   * @returns {number} The current time in milliseconds.
   */
  getCurrentTime() {
    checkDestroy(this.#destroyed);
    try {
      const adapter = this.#getActiveAdapter();
      return adapter ? adapter.getCurrentTime() : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Gets the total duration of the current track.
   * @returns {number} The total duration in milliseconds.
   */
  getTotalDuration() {
    checkDestroy(this.#destroyed);
    try {
      const adapter = this.#getActiveAdapter();
      return adapter ? adapter.getTotalDuration() : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Gets the remaining time until the current track ends.
   * @returns {number} The remaining time in milliseconds.
   */
  getRemainingTime() {
    checkDestroy(this.#destroyed);
    try {
      const adapter = this.#getActiveAdapter();
      return adapter ? adapter.getRemainingTime() : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Gets the percentage of the current track that has been played.
   * @returns {number} A value between 0 and 100.
   */
  getPlaybackPercentage() {
    checkDestroy(this.#destroyed);
    try {
      const adapter = this.#getActiveAdapter();
      return adapter ? adapter.getPlaybackPercentage() : 0;
    } catch {
      return 0;
    }
  }

  // ==========================================
  // DESTROYER
  // ==========================================

  /**
   * Safely destroys the TinyMediaPlayer instance.
   * This method stops active playback, clears the internal playlist,
   * removes all registered media adapters, and detaches all event listeners
   * to ensure proper garbage collection and prevent memory leaks.
   *
   * @returns {Promise<void>} A promise that resolves when the destruction sequence is complete.
   */
  async destroy() {
    if (this.#destroyed) return;

    // 1. Stop current playback if active to halt media processes
    try {
      if (this.#isPlaying) {
        await this.stop();
      }
    } catch (error) {
      console.warn('[TinyMediaPlayer] Non-fatal error during playback termination:', error);
    }

    if (this.#prevClickTimer) clearTimeout(this.#prevClickTimer);

    // 2. Clear internal state variables
    this.#playlist = [];
    this.#currentIndex = -1;
    this.#isPlaying = false;
    this.#prevClickedToRepeat = false;

    // 3. Clears and destroys all registered API adapters
    this.destroyAllAdapters();

    // 4. Remove all event listeners inherited from EventEmitter
    this.removeAllListeners();
    this.#destroyed = true;
    this.emit('destroyed');
  }
}

export default TinyMediaPlayer;
