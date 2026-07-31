import { EventEmitter } from 'events';
import { createCheckDestroyed } from '../utils.mjs';

/**
 * @typedef {import('../../basics/mediaContent.mjs').PictureDataType} PictureDataType
 * @typedef {import('../../basics/mediaContent.mjs').MediaContent<PictureDataType>} MediaContent
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
  canHandle(content) {
    checkDestroy(this.#destroyed);
    throw new Error('Method "canHandle" must be implemented by the subclass.');
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
   * Retrieves the current playback time from the underlying API.
   * @returns {number} The current time in milliseconds.
   */
  getCurrentTime() {
    checkDestroy(this.#destroyed);
    throw new Error('Method "getCurrentTime" must be implemented by the subclass.');
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
