import { createCheckDestroyed } from '../utils.mjs';
import { BaseMediaAdapter } from './index.mjs';
import { isValidObj } from '../../basics/objChecker.mjs';

/**
 * @typedef {import('../../basics/mediaContent.mjs').PictureDataType} PictureDataType
 * @typedef {import('../../basics/mediaContent.mjs').MediaContent<PictureDataType>} MediaContent
 * @typedef {import('./index.mjs').ContentData} ContentData
 * @typedef {import('./index.mjs').ContentTimeData} ContentTimeData
 */

const checkDestroy = createCheckDestroyed('MockMediaAdapter');
const createdAt = new Date().toISOString();

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

  /**
   * @returns {boolean}
   */
  get destroyed() {
    return this.#destroyed;
  }

  /**
   * @returns {boolean}
   */
  get isPlaying() {
    checkDestroy(this.#destroyed);
    return this.#isPlaying;
  }

  /**
   * @returns {string|null}
   */
  get currentContentId() {
    checkDestroy(this.#destroyed);
    return this.#currentContentId;
  }

  /**
   * @returns {number}
   */
  get volume() {
    checkDestroy(this.#destroyed);
    return this.#currentVolume;
  }

  /**
   * @param {number} value - O volume de 0.0 a 1.0.
   * @throws {RangeError} Se o valor estiver fora do intervalo.
   */
  set volume(value) {
    checkDestroy(this.#destroyed);
    if (typeof value !== 'number' || value < 0 || value > 1) {
      throw new RangeError('Volume must be a number between 0.0 and 1.0.');
    }
    this.#currentVolume = value;
    this.emit('volumeChange', value);
  }

  constructor() {
    super();
  }

  /**
   * Checks whether the media adapter is fully initialized and ready.
   * @returns {boolean} True if the adapter is ready, false otherwise.
   */
  isReady() {
    checkDestroy(this.#destroyed);
    return this.#isReady;
  }

  /**
   * Checks whether the media adapter is paused.
   * @returns {boolean} True if the adapter is ready, false otherwise.
   */
  isPaused() {
    checkDestroy(this.#destroyed);
    return this.#isPaused;
  }

  /**
   * Checks whether the media adapter is ended.
   * @returns {boolean} True if the adapter is ready, false otherwise.
   */
  isEnded() {
    checkDestroy(this.#destroyed);
    return this.#isEnded;
  }

  /**
   * Asynchronously waits until the content media adapter is fully initialized and ready.
   * @returns {Promise<void>} A promise that resolves once the adapter is ready.
   */
  async waitIsReady() {
    checkDestroy(this.#destroyed);
    return Promise.resolve();
  }

  /**
   * Retrieves a consolidated object containing all time-related metrics for the current media content.
   * @returns {ContentTimeData} An object containing total, current, remaining time, and playback percentage.
   */
  getTimeData() {
    checkDestroy(this.#destroyed);
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
    checkDestroy(this.#destroyed);
    return MockMediaAdapter.canHandle(content);
  }

  /**
   * Starts or resumes playback of the provided content.
   * @param {MediaContent} content - The media content to play.
   * @returns {Promise<void>}
   */
  async play(content) {
    checkDestroy(this.#destroyed);
    if (!isValidObj(content)) {
      throw new TypeError('Invalid media content provided to play().');
    }
    this.#currentContentId = typeof content.url === 'string' ? content.url : 'mock';
    this.#isPaused = false;
    this.#isEnded = false;
    this.#isPlaying = true;

    // Simulate a small delay for loading
    await new Promise((resolve) => setTimeout(resolve, 10));

    this.emit('play');
  }

  /**
   * Pauses the current playback.
   * @returns {Promise<void>}
   */
  async pause() {
    checkDestroy(this.#destroyed);
    this.#isPaused = true;
    this.#isEnded = false;
    this.#isPlaying = false;
    this.emit('pause');
  }

  /**
   * Stops the playback completely and resets the internal platform state.
   * @returns {Promise<void>}
   */
  async stop() {
    checkDestroy(this.#destroyed);
    this.#isPaused = false;
    this.#isEnded = true;
    this.#isPlaying = false;
    this.#currentTime = 0;
    this.emit('ended');
  }

  /**
   * Seeks to a specific time in the media timeline.
   * @param {number} timeMs - The target time in milliseconds.
   * @returns {Promise<void>}
   */
  async seek(timeMs) {
    checkDestroy(this.#destroyed);
    if (typeof timeMs !== 'number') {
      throw new TypeError('Seek time must be a number.');
    }
    this.#currentTime = timeMs;
    this.emit('seek', this.#currentTime);
  }

  /**
   * Checks whether the player is currently muted.
   * @returns {boolean|null} True if muted, false otherwise.
   */
  isMuted() {
    checkDestroy(this.#destroyed);
    return this.#isMuted;
  }

  /**
   * Mutes the current playback.
   * @returns {Promise<void>}
   */
  async mute() {
    checkDestroy(this.#destroyed);
    this.#isMuted = true;
  }

  /**
   * Unmutes the current playback.
   * @returns {Promise<void>}
   */
  async unMute() {
    checkDestroy(this.#destroyed);
    this.#isMuted = false;
  }

  /**
   * Retrieves the current playback time from the underlying API.
   * @returns {number} The current time in milliseconds.
   */
  getCurrentTime() {
    checkDestroy(this.#destroyed);
    return this.#currentTime;
  }

  /**
   * Gets the total duration of the content.
   * @returns {number} The total duration in milliseconds.
   */
  getTotalDuration() {
    checkDestroy(this.#destroyed);
    return this.#totalDuration;
  }

  /**
   * Gets the remaining time until the content ends.
   * @returns {number} The remaining time in milliseconds.
   */
  getRemainingTime() {
    checkDestroy(this.#destroyed);
    const total = this.getTotalDuration();
    const current = this.getCurrentTime();
    return total > 0 ? total - current : 0;
  }

  /**
   * Gets the percentage of the content that has been played.
   * @returns {number} The percentage from 0 to 100.
   */
  getPlaybackPercentage() {
    checkDestroy(this.#destroyed);
    const total = this.getTotalDuration();
    const current = this.getCurrentTime();
    return total > 0 ? (current / total) * 100 : 0;
  }

  /**
   * Sets the playback volume for the underlying API.
   * @param {number} volume - The volume level from 0.0 to 1.0.
   * @returns {void}
   */
  setVolume(volume) {
    checkDestroy(this.#destroyed);
    this.volume = volume;
  }

  /**
   * Gets the playback volume for the underlying API.
   * @returns {number} - The volume level from 0.0 to 1.0.
   */
  getVolume() {
    checkDestroy(this.#destroyed);
    return this.volume;
  }

  /**
   * Retrieves the metadata of the currently loaded content, returning a structured
   * object containing details such as the content ID, title, author, and duration.
   * @returns {Promise<ContentData>}
   */
  async getContentData() {
    checkDestroy(this.#destroyed);
    return {
      id: this.#currentContentId ?? 'mock',
      createdAt,
      artistId: 'mock-artist',
      artistName: 'Mock Artist',
      description: 'Mock description',
      title: 'Mock Title',
      duration: this.#totalDuration,
      avatar: '',
      url: '',
    };
  }

  /**
   * Cleans up the instance.
   * @returns {void}
   */
  destroy() {
    if (this.#destroyed) return;
    this.#destroyed = true;
    super.destroy();
  }
}

export { MockMediaAdapter };
