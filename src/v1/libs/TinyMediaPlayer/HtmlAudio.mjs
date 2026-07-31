/**
 * @typedef {import('../../basics/mediaContent.mjs').PictureDataType} PictureDataType
 * @typedef {import('../../basics/mediaContent.mjs').MediaContent<PictureDataType>} MediaContent
 */

import { isValidObj } from '../../basics/objChecker.mjs';
import { createCheckDestroyed } from '../utils.mjs';
import { BaseMediaAdapter } from './index.mjs';

const checkDestroy = createCheckDestroyed('HtmlAudioAdapter');

/**
 * Concrete implementation of the BaseMediaAdapter using HTML5 Audio.
 * This class wraps the HTMLAudioElement and provides an adapter interface.
 */
class HtmlAudioAdapter extends BaseMediaAdapter {
  /** @type {boolean} */
  #destroyed = false;

  get id() {
    return 'html5Audio';
  }

  /**
   * The internal HTMLAudioElement instance.
   * @type {HTMLAudioElement}
   */
  #audioElement = new Audio();

  /** @type {string|null} */
  #currentContentId = null;

  get currentContentId() {
    return this.#currentContentId;
  }

  /**
   * Gets whether the adapter has been destroyed.
   * @returns {boolean}
   */
  get destroyed() {
    return this.#destroyed;
  }

  /**
   * Exposing the element to easily bind the 'ended' event in testing.
   * @returns {HTMLAudioElement}
   * @throws {Error} If the adapter has been destroyed.
   */
  get audioElement() {
    checkDestroy(this.#destroyed);
    return this.#audioElement;
  }

  /**
   * Initializes a new instance of the HtmlAudioAdapter.
   */
  constructor() {
    super();

    this.#audioElement.addEventListener('play', () => this.emit('play'));
    this.#audioElement.addEventListener('pause', () => this.emit('pause'));
    this.#audioElement.addEventListener('ended', () => this.emit('ended'));
    this.#audioElement.addEventListener('timeupdate', () => {
      this.emit('timeupdate', this.getCurrentTime());
    });
    this.#audioElement.addEventListener('error', (error) => {
      this.emit('error', error);
    });
  }

  /**
   * Determines if the provided content is compatible with this adapter.
   * @param {MediaContent} content - The media content object.
   * @returns {boolean} True if the content is compatible, false otherwise.
   * @throws {TypeError} If content is not a valid object.
   */
  canHandle(content) {
    checkDestroy(this.#destroyed);
    if (!isValidObj(content)) {
      throw new TypeError('Content must be a valid object.');
    }
    return (
      typeof content.url === 'string' &&
      (content.url.startsWith('http') || content.url.startsWith('blob:'))
    );
  }

  /**
   * Plays the audio content provided via the URL.
   * @param {MediaContent} content - The media content object containing the URL.
   * @returns {Promise<void>} A promise that resolves when playback starts.
   * @throws {TypeError} If the content URL is not a string.
   */
  async play(content) {
    checkDestroy(this.#destroyed);
    if (!isValidObj(content)) {
      throw new TypeError('Content must be a valid object.');
    }
    if (typeof content?.url !== 'string') {
      throw new TypeError('Valid media URL required.');
    }

    if (this.#audioElement.src !== content.url) {
      this.#currentContentId = content.url;
      this.#audioElement.src = content.url;
      this.#audioElement.load();
    }
    await this.#audioElement.play();
  }

  /**
   * Pauses the audio playback.
   * @returns {Promise<void>} A promise that resolves when playback is paused.
   */
  async pause() {
    checkDestroy(this.#destroyed);
    this.#audioElement.pause();
  }

  /**
   * Stops the audio playback and resets the current time to zero.
   * @returns {Promise<void>} A promise that resolves when playback is stopped.
   */
  async stop() {
    checkDestroy(this.#destroyed);
    this.#audioElement.pause();
    this.#audioElement.currentTime = 0;
  }

  /**
   * Seeks to a specific time in the audio.
   * @param {number} timeMs - The target time in milliseconds.
   * @returns {Promise<void>} A promise that resolves when the seek operation is complete.
   * @throws {TypeError} If timeMs is not a number.
   */
  async seek(timeMs) {
    checkDestroy(this.#destroyed);
    if (typeof timeMs !== 'number') {
      throw new TypeError('Seek time must be a number.');
    }
    const currentTime = timeMs / 1000;
    this.#audioElement.currentTime = currentTime;
    this.emit('seek', currentTime);
  }

  /**
   * Gets the current playback time.
   * @returns {number} The current time in milliseconds.
   */
  getCurrentTime() {
    checkDestroy(this.#destroyed);
    return Math.floor(this.#audioElement.currentTime * 1000);
  }

  /**
   * Gets the total duration of the audio.
   * @returns {number} The total duration in milliseconds.
   */
  getTotalDuration() {
    checkDestroy(this.#destroyed);
    const duration = this.#audioElement.duration;
    return Number.isFinite(duration) ? Math.floor(duration * 1000) : 0;
  }

  /**
   * Gets the remaining time until the audio ends.
   * @returns {number} The remaining time in milliseconds.
   */
  getRemainingTime() {
    checkDestroy(this.#destroyed);
    const total = this.getTotalDuration();
    const current = this.getCurrentTime();
    return total > 0 ? total - current : 0;
  }

  /**
   * Gets the percentage of the audio that has been played.
   * @returns {number} The percentage from 0 to 100.
   */
  getPlaybackPercentage() {
    checkDestroy(this.#destroyed);
    const total = this.getTotalDuration();
    const current = this.getCurrentTime();
    return total > 0 ? (current / total) * 100 : 0;
  }

  /**
   * Sets the volume level of the audio.
   * @param {number} volume - The volume level from 0.0 to 1.0.
   * @throws {RangeError} If the volume is not between 0.0 and 1.0.
   */
  setVolume(volume) {
    this.volume = volume;
  }

  /**
   * Gets the volume level of the audio.
   * @returns {number} The volume level from 0.0 to 1.0.
   */
  getVolume() {
    return this.volume;
  }

  /**
   * Gets the current volume level of the audio.
   * @returns {number} The current volume level from 0.0 to 1.0.
   */
  get volume() {
    checkDestroy(this.#destroyed);
    return this.#audioElement.volume;
  }

  /**
   * Sets the volume level.
   * @param {number} value - The volume level from 0.0 to 1.0.
   * @throws {RangeError} If the volume is not between 0.0 and 1.0.
   */
  set volume(value) {
    checkDestroy(this.#destroyed);
    if (typeof value !== 'number' || value < 0 || value > 1) {
      throw new RangeError('Volume must be a number between 0.0 and 1.0.');
    }
    this.#audioElement.volume = value;
  }

  /**
   * Cleans up the adapter resources and marks it as destroyed.
   * @returns {Promise<void>}
   */
  async destroy() {
    if (this.#destroyed) return;

    try {
      this.#audioElement.pause();
      this.#audioElement.src = '';
      this.#currentContentId = null;
      this.#audioElement.load();
    } catch (error) {
      // We catch errors during cleanup to ensure the destruction process completes.
    } finally {
      // @ts-ignore
      this.#audioElement = null;
    }
    this.#destroyed = true;
    super.destroy();
  }
}

export { HtmlAudioAdapter };
