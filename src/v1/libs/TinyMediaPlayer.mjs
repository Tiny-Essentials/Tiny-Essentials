import '../basics/mediaContent.mjs';

/**
 * @typedef {import('../basics/mediaContent.mjs').MediaContent} MediaContent
 */

/**
 * @typedef {'NONE' | 'TRACK' | 'PLAYLIST'} LoopModeType
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
}

/**
 * A universal media player manager capable of orchestrating multiple API adapters.
 */
class TinyMediaPlayer {
  static BaseMediaAdapter = BaseMediaAdapter;

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
    this.#playlist = value;
  }

  /** @returns {number} The current active index in the playlist. */
  get currentIndex() {
    return this.#currentIndex;
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
   * @throws {TypeError} If content is invalid or missing required base properties.
   */
  addTrack(content) {
    if (!content || typeof content !== 'object' || typeof content.url !== 'string') {
      throw new TypeError('Track content must be a valid MediaContent object containing a URL.');
    }
    this.#playlist.push(content);
    if (this.#currentIndex === -1) {
      this.#currentIndex = 0;
    }
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
          this.#currentIndex = -1;
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
          prevIndex = 0;
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
