import { BaseMediaAdapter } from './index.mjs';

/**
 * @typedef {import('../../basics/mediaContent.mjs').PictureDataType} PictureDataType
 * @typedef {import('../../basics/mediaContent.mjs').MediaContent<PictureDataType>} MediaContent
 * @typedef {import('./index.mjs').ContentData} ContentData
 * @typedef {import('./index.mjs').ContentTimeData} ContentTimeData
 */

/**
 * MOCK VERSION of BaseMediaAdapter
 * 
 * This file simulates the behavior of the Media Adapter for testing purposes.
 */
class MockMediaAdapter extends BaseMediaAdapter {
  get id() {
    return 'mock';
  }

  #isReady = true;
  #currentVolume = 1.0;

  /** @type {string|null} */
  #currentContentId = null;
  #destroyed = false;
  #isPlaying = false;
  #isPaused = false;
  #isEnded = false;
  #isMuted = false;
  #currentTime = 0; // in milliseconds
  #totalDuration = 60000; // 60 seconds in milliseconds

  get isPlaying() {
    return this.#isPlaying;
  }

  constructor() {
    super();
  }

  get volume() {
    return this.#currentVolume;
  }

  set volume(value) {
    if (typeof value !== 'number' || value < 0 || value > 1) {
      throw new RangeError('Volume must be a number between 0.0 and 1.0.');
    }
    this.#currentVolume = value;
    this.emit('volumeChange', this.#currentVolume);
  }

  get destroyed() {
    return this.#destroyed;
  }

  get currentContentId() {
    return this.#currentContentId;
  }

  isReady() {
    return this.#isReady;
  }

   /**
   * Checks whether the media adapter is paused.
   * @returns {boolean} True if the adapter is ready, false otherwise.
   */
  isPaused() {
    return this.#isPaused;
  }

    /**
   * Checks whether the media adapter is ended.
   * @returns {boolean} True if the adapter is ready, false otherwise.
   */
  isEnded() {
    return this.#isEnded;
  }

    /**
   * Asynchronously waits until the content media adapter is fully initialized and ready.
   * @returns {Promise<void>} A promise that resolves once the adapter is ready.
   */
  async waitIsReady() {
    return Promise.resolve();
  }

  /**
   * Retrieves a consolidated object containing all time-related metrics for the current media content.
   * @returns {ContentTimeData} An object containing total, current, remaining time, and playback percentage.
   */
  getTimeData() {
    const total = this.getTotalDuration();
    const current = this.getCurrentTime();
    const remaining = total > 0 ? total - current : 0;
    const playbackPercentage = total > 0 ? (current / total) * 100 : 0;
    return { total, current, remaining, playbackPercentage };
  }

    /**
   * Determines if this adapter can play the provided content.
   * @param {MediaContent} content - The media content to evaluate.
   * @returns {boolean} True if the adapter can handle the content, false otherwise.
   */
  static canHandle(content) {
    return content && typeof content.url === 'string';
  }

      /**
   * Determines if this adapter can play the provided content.
   * @param {MediaContent} content - The media content to evaluate.
   * @returns {boolean} True if the adapter can handle the content, false otherwise.
   */
  canHandle(content) {
    return MockMediaAdapter.canHandle(content);
  }

  /**
   * Starts or resumes playback of the provided content.
   * @param {MediaContent} content - The media content to play.
   * @returns {Promise<void>}
   */
  async play(content) {
    if (!content || !content.url) {
      throw new TypeError('Invalid media content provided to play().');
    }
    this.#currentContentId = 'mock';
    this.#isPaused = false;
    this.#isEnded = false;
    this.#isPlaying = true;
    
    // Simulate a small delay for loading
    await new Promise(resolve => setTimeout(resolve, 10));
    
    return Promise.resolve();
  }

    /**
   * Pauses the current playback.
   * @returns {Promise<void>}
   */
  async pause() {
    this.#isPaused = true;
    this.#isEnded = false;
    this.#isPlaying = false;
  }

  /**
   * Stops the playback completely and resets the internal platform state.
   * @returns {Promise<void>}
   */
  async stop() {
    this.#isPaused = false;
    this.#isEnded = true;
    this.#isPlaying = false;
  }

    /**
   * Seeks to a specific time in the media timeline.
   * @param {number} timeMs - The target time in milliseconds.
   * @returns {Promise<void>}
   */
  async seek(timeMs) {
    if (typeof timeMs !== 'number') throw new TypeError('Time must be a number.');
    this.#currentTime = timeMs;
  }

  /**
   * Checks whether the player is currently muted.
   * @returns {boolean|null} True if muted, false otherwise.
   */
  isMuted() {
    return this.#isMuted;
  }

  /**
   * Mutes the current playback.
   * @returns {Promise<void>}
   */
  async mute() {
    this.#isMuted = true;
  }

  /**
   * Unmutes the current playback.
   * @returns {Promise<void>}
   */
  async unMute() {
    this.#isMuted = false;
  }

  /**
   * Retrieves the current playback time from the underlying API.
   * @returns {number} The current time in milliseconds.
   */
  getCurrentTime() {
    return this.#currentTime;
  }

  /**
   * Gets the total duration of the content.
   * @returns {number} The total duration in milliseconds.
   */
  getTotalDuration() {
    return this.#totalDuration;
  }

  /**
   * Gets the remaining time until the content ends.
   * @returns {number} The remaining time in milliseconds.
   */
  getRemainingTime() {
    return this.#totalDuration;
  }

  /**
   * Gets the percentage of the content that has been played.
   * @returns {number} The percentage from 0 to 100.
   */
  getPlaybackPercentage() {
    return 100;
  }

  /**
   * Sets the playback volume for the underlying API.
   * @param {number} volume - The volume level from 0.0 to 1.0.
   * @returns {void}
   */
  setVolume(volume) {
    this.volume = volume;
  }

  /**
   * Gets the playback volume for the underlying API.
   * @returns {number} - The volume level from 0.0 to 1.0.
   */
  getVolume() {
    return this.volume;
  }

  /**
   * Retrieves the metadata of the currently loaded content, returning a structured
   * object containing details such as the content ID, title, author, and duration.
   * @returns {Promise<ContentData>}
   */
  async getContentData() {
    return {
      id: '',
      createdAt: '',
      artistId: '',
      artistName: '',
      description: '',
      title: '',
      duration: 0,
      avatar: '',
      url: '',
    };
  }

  /**
   * Cleans up the instance.
   * @returns {void}
   */
  destroy() {
    this.#destroyed = true;
    super.destroy();
  }
}

export { MockMediaAdapter };