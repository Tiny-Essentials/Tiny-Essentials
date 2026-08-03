import { EventEmitter } from 'events';
import { createCheckDestroyed } from '../utils.mjs';

/**
 * @typedef {import('../../basics/mediaContent.mjs').PictureDataType} PictureDataType
 * @typedef {import('../../basics/mediaContent.mjs').MediaContent<PictureDataType>} MediaContent
 */

/**
 * @typedef {Object} ContentTimeData
 * @property {number} total - The total duration of the media in milliseconds.
 * @property {number} current - The current playback position in milliseconds.
 * @property {number} remaining - The remaining time until the media ends in milliseconds.
 * @property {number} playbackPercentage - The percentage of the media that has been played (0 to 100).
 */

/**
 * Represents the data structure for a piece of content.
 * @typedef {Object} ContentData
 * @property {string} id - The unique identifier for the content.
 * @property {string} createdAt - The timestamp indicating when the content was created.
 * @property {string} title - The title of the content.
 * @property {number} duration - The duration of the content.
 * @property {string} artistId - The unique identifier for the artist.
 * @property {string} [artistName] - The name of the artist (optional).
 * @property {string} [description] - A brief description of the content (optional).
 * @property {string} [avatar] - The URL for the artist's avatar image (optional).
 * @property {string} [url] - The URL to access the content (optional).
 */

const checkDestroy = createCheckDestroyed('BaseMediaAdapter');

/**
 * Interface definition for a Media Provider Adapter.
 * All specific API wrappers must extend and implement this class.
 * @abstract
 */
class BaseMediaAdapter extends EventEmitter {
  constructor() {
    if (new.target === BaseMediaAdapter) {
      throw new Error('BaseMediaAdapter is an abstract class and cannot be instantiated directly.');
    }
    super();
  }

  /** @type {boolean} */
  #destroyed = false;

  get destroyed() {
    return this.#destroyed;
  }

  /**
   * Determines if this adapter can play the provided content.
   * @param {MediaContent} content - The media content to evaluate.
   * @returns {boolean} True if the adapter can handle the content, false otherwise.
   */
  static canHandle(content) {
    throw new Error('Method "canHandle" must be implemented by the subclass.');
  }

  /**
   * Synchronously checks whether the media adapter is fully initialized and ready.
   * @returns {boolean} True if the adapter is ready, false otherwise.
   */
  isReady() {
    checkDestroy(this.#destroyed);
    throw new Error('Method "isReady" must be implemented by the subclass.');
  }

  /**
   * Asynchronously waits until the content media adapter is fully initialized and ready.
   * @returns {Promise<void>} A promise that resolves once the adapter is ready.
   */
  async waitIsReady() {
    checkDestroy(this.#destroyed);
    throw new Error('Method "waitIsReady" must be implemented by the subclass.');
  }

  /**
   * Determines if this adapter can play the provided content.
   * @param {MediaContent} content - The media content to evaluate.
   * @returns {boolean} True if the adapter can handle the content, false otherwise.
   */
  canHandle(content) {
    checkDestroy(this.#destroyed);
    return BaseMediaAdapter.canHandle(content);
  }

  /**
   * Starts or resumes playback of the provided content.
   * @param {MediaContent} content - The media content to play.
   * @returns {Promise<void>}
   */
  async play(content) {
    checkDestroy(this.#destroyed);
    throw new Error('Method "play" must be implemented by the subclass.');
  }

  /**
   * Pauses the current playback.
   * @returns {Promise<void>}
   */
  async pause() {
    checkDestroy(this.#destroyed);
    throw new Error('Method "pause" must be implemented by the subclass.');
  }

  /**
   * Stops the playback completely and resets the internal platform state.
   * @returns {Promise<void>}
   */
  async stop() {
    checkDestroy(this.#destroyed);
    throw new Error('Method "stop" must be implemented by the subclass.');
  }

  /**
   * Seeks to a specific time in the media timeline.
   * @param {number} timeMs - The target time in milliseconds.
   * @returns {Promise<void>}
   */
  async seek(timeMs) {
    checkDestroy(this.#destroyed);
    throw new Error('Method "seek" must be implemented by the subclass.');
  }

  /**
   * Checks whether the player is currently muted.
   * @returns {boolean|null} True if muted, false otherwise.
   */
  isMuted() {
    checkDestroy(this.#destroyed);
    throw new Error('Method "isMuted" must be implemented by the subclass.');
  }

  /**
   * Mutes the current playback.
   * @returns {Promise<void>}
   */
  async mute() {
    checkDestroy(this.#destroyed);
    throw new Error('Method "mute" must be implemented by the subclass.');
  }

  /**
   * Unmutes the current playback.
   * @returns {Promise<void>}
   */
  async unmute() {
    checkDestroy(this.#destroyed);
    throw new Error('Method "unmute" must be implemented by the subclass.');
  }

  /**
   * Retrieves the current playback time from the underlying API.
   * @returns {number} The current time in milliseconds.
   */
  getCurrentTime() {
    checkDestroy(this.#destroyed);
    throw new Error('Method "getCurrentTime" must be implemented by the subclass.');
  }

  /**
   * Gets the total duration of the content.
   * @returns {number} The total duration in milliseconds.
   */
  getTotalDuration() {
    checkDestroy(this.#destroyed);
    throw new Error('Method "getTotalDuration" must be implemented by the subclass.');
  }

  /**
   * Gets the remaining time until the content ends.
   * @returns {number} The remaining time in milliseconds.
   */
  getRemainingTime() {
    checkDestroy(this.#destroyed);
    throw new Error('Method "getRemainingTime" must be implemented by the subclass.');
  }

  /**
   * Gets the percentage of the content that has been played.
   * @returns {number} The percentage from 0 to 100.
   */
  getPlaybackPercentage() {
    checkDestroy(this.#destroyed);
    throw new Error('Method "getPlaybackPercentage" must be implemented by the subclass.');
  }

  /**
   * Retrieves a consolidated object containing all time-related metrics for the current media content.
   * @returns {ContentTimeData} An object containing total, current, remaining time, and playback percentage.
   */
  getTimeData() {
    checkDestroy(this.#destroyed);
    throw new Error('Method "getTimeData" must be implemented by the subclass.');
  }

  /**
   * Sets the playback volume for the underlying API.
   * @param {number} volume - The volume level from 0.0 to 1.0.
   * @returns {void}
   */
  setVolume(volume) {
    checkDestroy(this.#destroyed);
    throw new Error('Method "setVolume" must be implemented by the subclass.');
  }

  /**
   * Gets the playback volume for the underlying API.
   * @returns {number} - The volume level from 0.0 to 1.0.
   */
  getVolume() {
    checkDestroy(this.#destroyed);
    throw new Error('Method "getVolume" must be implemented by the subclass.');
  }

  /**
   * Retrieves the metadata of the currently loaded content, returning a structured
   * object containing details such as the content ID, title, author, and duration.
   * @returns {Promise<ContentData>}
   */
  async getContentData() {
    checkDestroy(this.#destroyed);
    throw new Error('Method "getContentData" must be implemented by the subclass.');
  }

  /**
   * Cleans up the instance.
   * @returns {void}
   */
  destroy() {
    if (this.#destroyed) return;
    this.removeAllListeners();
    this.#destroyed = true;
    this.emit('destroyed');
  }
}

export { BaseMediaAdapter };
