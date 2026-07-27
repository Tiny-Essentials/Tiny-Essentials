/**
 * @typedef {import('../../basics/mediaContent.mjs').PictureDataType} PictureDataType
 * @typedef {import('../../basics/mediaContent.mjs').MediaContent<PictureDataType>} MediaContent
 *
 * @typedef {import('./docs/YouTubePlayer.mjs').YTPlayerState} YTPlayerState
 * @typedef {import('./docs/YouTubePlayer.mjs').YTPlayerErrors} YTPlayerErrors
 * @typedef {import('./docs/YouTubePlayer.mjs').YTQuality} YTQuality
 * @typedef {import('./docs/YouTubePlayer.mjs').YTSphericalProperties} YTSphericalProperties
 * @typedef {import('./docs/YouTubePlayer.mjs').YouTubePlayerEventBase} YouTubePlayerEventBase
 * @typedef {import('./docs/YouTubePlayer.mjs').YTPlayerOptionsEvents} YTPlayerOptionsEvents
 * @typedef {import('./docs/YouTubePlayer.mjs').YTPlayerOptionsEvents} YTPlayerOptions
 * @typedef {import('./docs/YouTubePlayer.mjs').EventNames} EventNames
 * @typedef {import('./docs/YouTubePlayer.mjs').YTPlaylistOptions} YTPlaylistOptions
 * @typedef {import('./docs/YouTubePlayer.mjs').VideoByUrlOptions} VideoByUrlOptions
 * @typedef {import('./docs/YouTubePlayer.mjs').VideoByIdOptions} VideoByIdOptions
 *
 * @typedef {import('./docs/YouTubePlayer.mjs').OnReadyEvent} OnReadyEvent
 * @typedef {import('./docs/YouTubePlayer.mjs').OnStateChangeEvent} OnStateChangeEvent
 * @typedef {import('./docs/YouTubePlayer.mjs').OnErrorEvent} OnErrorEvent
 * @typedef {import('./docs/YouTubePlayer.mjs').OnPlaybackQualityChangeEvent} OnPlaybackQualityChangeEvent
 * @typedef {import('./docs/YouTubePlayer.mjs').OnPlaybackRateChangeEvent} OnPlaybackRateChangeEvent
 * @typedef {import('./docs/YouTubePlayer.mjs').OnApiChangeEvent} OnApiChangeEvent
 * @typedef {import('./docs/YouTubePlayer.mjs').OnAutoplayBlockedEvent} OnAutoplayBlockedEvent
 */

import { BaseMediaAdapter } from './index.mjs';
import YouTubePlayer from './docs/YouTubePlayer.mjs';

/**
 * Implementation of BaseMediaAdapter for the YouTube IFrame Player API.
 * This adapter manages the lifecycle of a YouTube player embedded in a container.
 * @extends BaseMediaAdapter
 */
export class YoutubeMediaAdapter extends BaseMediaAdapter {
  /**
   * Represents the current state of the player.
   * @type {Record<string, number>}
   */
  static PlayerState = {
    UNSTARTED: -1,
    ENDED: 0,
    PLAYING: 1,
    PAUSED: 2,
    BUFFERING: 3,
    CUED: 5,
  };

  /**
   * The default HTML element where the YouTube iframe will be injected.
   * @type {HTMLElement|null}
   */
  static #defaultContainer = null;

  /**
   * Gets the globally configured default container for YouTube players.
   * @returns {HTMLElement|null}
   */
  static get defaultContainer() {
    return this.#defaultContainer;
  }

  /**
   * Sets the globally configured default container for YouTube players.
   * @param {HTMLElement|null} element - The element to be used as the default container.
   * @throws {TypeError} If the provided element is not an instance of HTMLElement.
   */
  static set defaultContainer(element) {
    if (element !== null && !(element instanceof HTMLElement)) {
      throw new TypeError('The defaultContainer must be an instance of HTMLElement.');
    }
    this.#defaultContainer = element;
  }

  /** @type {YouTubePlayer|null} */
  #player = null;

  /** @type {HTMLElement} */
  #container;

  /** @type {Promise<void>} */
  #apiLoadedPromise;

  /** @type {number} */
  #currentVolume = 1.0;

  /**
   * Initializes the YouTube Media Adapter.
   * The container is automatically assigned from the static `defaultContainer`.
   */
  constructor() {
    const container = YoutubeMediaAdapter.#defaultContainer;
    if (!(container instanceof HTMLElement)) {
      throw new TypeError('The YoutubeMediaAdapter.defaultContainer must be an instance of HTMLElement.');
    }
    super();
    this.#container = container;
    this.#apiLoadedPromise = this.#loadYoutubeApi();
  }

  /**
   * Private method to ensure the YouTube IFrame API script is loaded.
   * @returns {Promise<void>}
   */
  async #loadYoutubeApi() {
    // @ts-ignore
    if (window.YT && window.YT.Player) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.onerror = () => reject(new Error('Failed to load YouTube IFrame API.'));
      document.body.appendChild(tag);

      // Check periodically if YT is ready
      const checkInterval = setInterval(() => {
        // @ts-ignore
        if (window.YT && window.YT.Player) {
          // @ts-ignore
          YoutubeMediaAdapter.PlayerState = window.YT.PlayerState;
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    });
  }

  /**
   * @returns {YouTubePlayer} The current YouTube player instance.
   * @throws {Error} If the player has not been initialized.
   */
  get player() {
    if (!this.#player)
      throw new Error('YouTube player instance not initialized. Ensure a valid video was played.');
    return this.#player;
  }

  /**
   * @param {number} value - The volume level from 0.0 to 1.0.
   * @throws {RangeError} If the volume is not between 0.0 and 1.0.
   */
  set volume(value) {
    if (typeof value !== 'number' || value < 0 || value > 1) {
      throw new RangeError('Volume must be a number between 0.0 and 1.0.');
    }
    this.#currentVolume = value;
    if (this.#player && typeof this.#player.setVolume === 'function') {
      this.#player.setVolume(value * 100);
    }
  }

  /**
   * @returns {number} The current volume level from 0.0 to 1.0.
   */
  get volume() {
    return this.#currentVolume;
  }

  /**
   * Determines if the content is a valid YouTube URL or ID.
   * @param {MediaContent} content - The media content to evaluate.
   * @returns {boolean} True if the content is a YouTube link/ID, false otherwise.
   */
  canHandle(content) {
    if (!content || !content.data) {
      return false;
    }

    // Assuming content.data contains the URL or the ID string
    const videoSource = typeof content.data === 'string' ? content.data : content.data.url;
    const youtubeRegex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;

    return youtubeRegex.test(videoSource);
  }

  /**
   * Initializes the YouTube player and starts playback.
   * @param {MediaContent} content - The media content to play.
   * @returns {Promise<void>}
   * @throws {TypeError} If the content data is invalid.
   */
  async play(content) {
    await this.#apiLoadedPromise;

    if (!content || !content.data) {
      throw new TypeError('Invalid media content provided to play().');
    }

    const videoSource = typeof content.data === 'string' ? content.data : content.data.url;

    if (!this.#player) {
      await this.#initializePlayer(videoSource);
    }

    return new Promise((resolve) => {
      this.#player?.playVideo();
      resolve();
    });
  }

  /**
   * Initializes the YT.Player instance.
   * @param {string} videoIdOrUrl - The YouTube video ID or URL.
   * @returns {Promise<void>}
   */
  async #initializePlayer(videoIdOrUrl) {
    return new Promise((resolve) => {
      /** @type {typeof YouTubePlayer} */
      // @ts-ignore
      const Player = window.YT.Player;
      this.#player = new Player(this.#container, {
        videoId: this.#extractVideoId(videoIdOrUrl),
        playerVars: {
          playsinline: 1,
        },
        events: {
          onReady: (...args) => {
            this.emit('onReady', ...args);
            resolve();
          },
          onPlaybackQualityChange: (...args) => this.emit('onPlaybackQualityChange', ...args),
          onPlaybackRateChange: (...args) => this.emit('onPlaybackRateChange', ...args),
          onError: (...args) => this.emit('onError', ...args),
          onApiChange: (...args) => this.emit('onApiChange', ...args),
          onAutoplayBlocked: (...args) => this.emit('onAutoplayBlocked', ...args),
          onStateChange: (...args) => this.emit('onStateChange', ...args),
        },
      });
    });
  }

  /**
   * Extracts the 11-character video ID from a URL or returns the string if it is already an ID.
   * @param {string} url - The URL or ID.
   * @returns {string} The extracted video ID.
   */
  #extractVideoId(url) {
    const regex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : url;
  }

  /**
   * Pauses the current playback.
   * @returns {Promise<void>}
   */
  async pause() {
    if (this.#player) {
      this.#player.pauseVideo();
    }
  }

  /**
   * Stops the playback completely.
   * @returns {Promise<void>}
   */
  async stop() {
    if (this.#player) {
      this.#player.stopVideo();
    }
  }

  /**
   * Seeks to a specific time in the media timeline.
   * @param {number} timeMs - The target time in milliseconds.
   * @returns {Promise<void>}
   * @throws {TypeError} If timeMs is not a number.
   */
  async seek(timeMs) {
    if (typeof timeMs !== 'number') {
      throw new TypeError('Time must be a number.');
    }
    if (this.#player) {
      this.#player.seekTo(timeMs / 1000, true);
    }
  }

  /**
   * Retrieves the current playback time.
   * @returns {number} The current time in milliseconds.
   */
  getCurrentTime() {
    if (this.#player) {
      return this.#player.getCurrentTime() * 1000;
    }
    return 0;
  }

  /**
   * Sets the playback volume.
   * @param {number} volume - The volume level from 0.0 to 1.0.
   * @returns {void}
   * @throws {RangeError} If volume is outside [0.0, 1.0].
   */
  setVolume(volume) {
    // Using the setter logic via the property
    this.volume = volume;
  }
}
