/**
 * @typedef {import('../../basics/mediaContent.mjs').PictureDataType} PictureDataType
 * @typedef {import('../../basics/mediaContent.mjs').MediaContent<PictureDataType>} MediaContent
 * @typedef {import('./index.mjs').ContentTimeData} ContentTimeData
 * @typedef {import('./index.mjs').ContentData} ContentData
 */

import { isValidObj } from '../../basics/objChecker.mjs';
import { createCheckDestroyed } from '../utils.mjs';
import { BaseMediaAdapter } from './index.mjs';

const checkDestroy = createCheckDestroyed('HtmlVideoAdapter');

/**
 * Concrete implementation of the BaseMediaAdapter using HTML5 Video.
 * This class wraps the HTMLVideoElement and provides an adapter interface.
 */
class HtmlVideoAdapter extends BaseMediaAdapter {
  /** @type {boolean} */
  #destroyed = false;

  get id() {
    return 'html5Video';
  }

  /** @type {HTMLVideoElement} */
  #videoElement = document.createElement('video');

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
   * Exposing the element to easily bind the 'playing' event in testing.
   * @returns {HTMLVideoElement}
   * @throws {Error} If the adapter has been destroyed.
   */
  get videoElement() {
    checkDestroy(this.#destroyed);
    return this.#videoElement;
  }

  /**
   * Initializes a new instance of the HtmlVideoAdapter.
   */
  constructor() {
    super();

    this.#videoElement.addEventListener('play', () => this.emit('play'));
    this.#videoElement.addEventListener('pause', () => this.emit('pause'));
    this.#videoElement.addEventListener('ended', () => this.emit('ended'));
    this.#videoElement.addEventListener('timeupdate', () => {
      this.emit('timeupdate', this.getTimeData());
    });
    this.#videoElement.addEventListener('error', (error) => {
      this.emit('error', error);
    });
    this.#videoElement.addEventListener('seeked', () => {
      this.emit('seek', this.getCurrentTime());
    });
  }

  /**
   * Synchronously checks whether the media adapter is fully initialized and ready.
   * @returns {boolean} True if the adapter is ready, false otherwise.
   */
  isReady() {
    checkDestroy(this.#destroyed);
    return true;
  }

  /**
   * Asynchronously waits until the content media adapter is fully initialized and ready.
   * @returns {Promise<void>} A promise that resolves once the adapter is ready.
   */
  async waitIsReady() {
    checkDestroy(this.#destroyed);
    return;
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
   * Determines if the provided content is compatible with this adapter.
   * @param {MediaContent} content - The media content object.
   * @returns {boolean} True if the content is compatible, false otherwise.
   * @throws {TypeError} If content is not a valid object.
   */
  static canHandle(content) {
    if (!isValidObj(content)) {
      throw new TypeError('Content must be a valid object.');
    }
    return (
      typeof content.url === 'string' &&
      (content.url.startsWith('http') || content.url.startsWith('blob:')) &&
      (content.mediaType === undefined || content.mediaType === 'video')
    );
  }

  /**
   * Determines if the provided content is compatible with this adapter.
   * @param {MediaContent} content - The media content object.
   * @returns {boolean} True if the content is compatible, false otherwise.
   * @throws {TypeError} If content is not a valid object.
   */
  canHandle(content) {
    checkDestroy(this.#destroyed);
    return HtmlVideoAdapter.canHandle(content);
  }

  /**
   * Plays the video content provided via the URL.
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

    if (this.#videoElement.src !== content.url) {
      this.#currentContentId = content.url;
      this.#videoElement.src = content.url;
      this.#videoElement.load();
    }
    await this.#videoElement.play();
  }

  /**
   * Pauses the video playback.
   * @returns {Promise<void>} A promise that resolves when playback is paused.
   */
  async pause() {
    checkDestroy(this.#destroyed);
    this.#videoElement.pause();
  }

  /**
   * Stops the video playback and resets the current time to zero.
   * @returns {Promise<void>} A promise that resolves when playback is stopped.
   */
  async stop() {
    checkDestroy(this.#destroyed);
    this.#videoElement.pause();
    this.#videoElement.currentTime = 0;
  }

  /**
   * Seeks to a specific time in the video.
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
    this.#videoElement.currentTime = currentTime;
  }

  /**
   * Checks whether the player is currently muted.
   * @returns {boolean} True if muted, false otherwise.
   */
  isMuted() {
    checkDestroy(this.#destroyed);
    return this.#videoElement.muted;
  }

  /**
   * Mutes the current playback.
   * @returns {Promise<void>}
   */
  async mute() {
    checkDestroy(this.#destroyed);
    this.#videoElement.muted = true;
  }

  /**
   * Unmutes the current playback.
   * @returns {Promise<void>}
   */
  async unmute() {
    checkDestroy(this.#destroyed);
    this.#videoElement.muted = false;
  }

  /**
   * Gets the current playback time.
   * @returns {number} The current time in milliseconds.
   */
  getCurrentTime() {
    checkDestroy(this.#destroyed);
    return Math.floor(this.#videoElement.currentTime * 1000);
  }

  /**
   * Gets the total duration of the video.
   * @returns {number} The total duration in milliseconds.
   */
  getTotalDuration() {
    checkDestroy(this.#destroyed);
    const duration = this.#videoElement.duration;
    return Number.isFinite(duration) ? Math.floor(duration * 1000) : 0;
  }

  /**
   * Gets the remaining time until the video ends.
   * @returns {number} The remaining time in milliseconds.
   */
  getRemainingTime() {
    checkDestroy(this.#destroyed);
    const total = this.getTotalDuration();
    const current = this.getCurrentTime();
    return total > 0 ? total - current : 0;
  }

  /**
   * Gets the percentage of the video that has been played.
   * @returns {number} The percentage from 0 to 100.
   */
  getPlaybackPercentage() {
    checkDestroy(this.#destroyed);
    const total = this.getTotalDuration();
    const current = this.getCurrentTime();
    return total > 0 ? (current / total) * 100 : 0;
  }

  /**
   * Sets the volume level of the video.
   * @param {number} volume - The volume level from 0.0 to 1.0.
   * @throws {RangeError} If the volume is not between 0.0 and 1.0.
   */
  setVolume(volume) {
    this.volume = volume;
  }

  /**
   * Gets the volume level of the video.
   * @returns {number} The volume level from 0.0 to 1.0.
   */
  getVolume() {
    return this.volume;
  }

  /**
   * Gets the current volume level of the video.
   * @returns {number} The volume level from 0.0 to 1.0.
   */
  get volume() {
    checkDestroy(this.#destroyed);
    return this.#videoElement.volume;
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
    this.#videoElement.volume = value;
    this.emit('volumeChange', value);
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
   * Cleans up the adapter resources and marks it as destroyed.
   * @returns {Promise<void>}
   */
  async destroy() {
    if (this.#destroyed) return;

    try {
      this.#videoElement.pause();
      this.#videoElement.src = '';
      this.#currentContentId = null;
      this.#videoElement.load();
    } catch (error) {
      // We catch errors during cleanup to ensure the destruction process completes.
    } finally {
      // @ts-ignore
      this.#videoElement = null;
    }
    this.#destroyed = true;
    super.destroy();
  }
}

export { HtmlVideoAdapter };
