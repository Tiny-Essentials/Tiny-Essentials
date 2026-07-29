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

/** 
 * Represents a function used as an event handler, capable of accepting any number of arguments. 
 * @typedef {(...args: any) => boolean} HandlerFunc
 */

import { EventEmitter } from 'events';
import { BaseMediaAdapter } from './index.mjs';
import YouTubePlayer from './docs/YouTubePlayer.mjs';
import { createCheckDestroyed } from '../utils.mjs';
import { createSingletonTask } from '../../basics/promiseUtils.mjs';

const makeLoadYoutubeApi = () => {
  const { callback } = createSingletonTask(async () => {
    // Use existing API if already loaded
    // @ts-ignore
    if (typeof window !== 'undefined' && window.YT && window.YT.Player) {
      // @ts-ignore
      YoutubeMediaAdapter.PlayerState = window.YT.PlayerState;
      return Promise.resolve(undefined);
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
        if (typeof window !== 'undefined' && window.YT && window.YT.Player) {
          // @ts-ignore
          YoutubeMediaAdapter.PlayerState = window.YT.PlayerState;
          clearInterval(checkInterval);
          resolve(undefined);
        }
      }, 100);
    });
  });
  return callback;
};

/**
 * Method to ensure the YouTube IFrame API script is loaded.
 */
const loadYoutubeApi = makeLoadYoutubeApi();

/**
 * Returns a deep clone of the current YouTube player state values.
 * This ensures the returned object is a copy and does not maintain a reference to the original state.
 * @returns {Record<string, number>} A copy of the PlayerState object.
 */
const getPlayerStateValues = () => {
  return structuredClone(YoutubeMediaAdapter.PlayerState);
};

/**
 * Retrieves the YouTube Player constructor from the global window object.
 * @returns {typeof YouTubePlayer} The YouTube Player constructor.
 * @throws {Error} If the YouTube API is not detected in the global scope.
 */
const getYtPlayer = () => {
  // @ts-ignore
  if (typeof window === 'undefined' || !window.YT || !window.YT.Player)
    throw new Error('YouTube API not available');
  /** @type {typeof YouTubePlayer} */
  // @ts-ignore
  const Player = window.YT.Player;
  return Player;
};

const checkDestroy = createCheckDestroyed('YoutubeMediaAdapter');

/**
 * Implementation of BaseMediaAdapter for the YouTube IFrame Player API.
 * This adapter manages the lifecycle of a YouTube player embedded in a container.
 * @extends BaseMediaAdapter
 */
class YoutubeMediaAdapter extends BaseMediaAdapter {
  /**
   * Mapping YouTube API events for internal adapter events.
   * @type {Record<string, string>}
   * @private
   */
  static EVENT_MAPPING = {
    onReady: 'onReady',
    onPlaybackQualityChange: 'onPlaybackQualityChange',
    onPlaybackRateChange: 'onPlaybackRateChange',
    onError: 'onError',
    onApiChange: 'onApiChange',
    onAutoplayBlocked: 'onAutoplayBlocked',
    onStateChange: 'onStateChange',
  };

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
   * Safety lock: If true, multiple instances can share the same player/iframe via WeakMap.
   * If false, only one instance can be bound to a specific container at a time.
   * @type {boolean}
   */
  static allowInstanceSharing = false;

  /**
   * The default HTML element where the YouTube iframe will be injected.
   * @type {HTMLElement|null}
   */
  static #defaultContainer = null;

  /**
   * Registry to reuse players and master emitters per container.
   * @type {WeakMap<HTMLElement, {player: YouTubePlayer, masterEmitter: EventEmitter}>}
   */
  static #registry = new WeakMap();

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

  /** @type {EventEmitter|null} */
  #masterEmitter = null;

  /** @type {Array<{eventName: string, handler: HandlerFunc}>} */
  #eventHandlers = [];

  /**
   * Initializes the YouTube Media Adapter.
   * @throws {Error} If allowInstanceSharing is false and the container is already in use.
   */
  constructor() {
    const container = YoutubeMediaAdapter.#defaultContainer;
    if (!(container instanceof HTMLElement)) {
      throw new TypeError(
        'The YoutubeMediaAdapter.defaultContainer must be an instance of HTMLElement.',
      );
    }

    // Safety Lock Check
    if (!YoutubeMediaAdapter.allowInstanceSharing && YoutubeMediaAdapter.#registry.has(container)) {
      throw new Error(
        'Security Lock: This container is already bound to another YoutubeMediaAdapter instance.',
      );
    }

    super();
    this.#container = container;
    this.#apiLoadedPromise = loadYoutubeApi();
  }

  /**
   * @returns {YouTubePlayer} The current YouTube player instance.
   * @throws {Error} If the player has not been initialized.
   */
  get player() {
    checkDestroy(this.#destroyed);
    if (!this.#player) {
      throw new Error('YouTube player instance not initialized. Ensure a valid video was played.');
    }
    return this.#player;
  }

  /**
   * @param {number} value - The volume level from 0.0 to 1.0.
   * @throws {RangeError} If the volume is not between 0.0 and 1.0.
   */
  set volume(value) {
    checkDestroy(this.#destroyed);
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
    checkDestroy(this.#destroyed);
    return this.#currentVolume;
  }

  /** @type {boolean} */
  #destroyed = false;

  get destroyed() {
    return this.#destroyed;
  }

  /**
   * Determines if the content is a valid YouTube URL or ID.
   * @param {MediaContent} content - The media content to evaluate.
   * @returns {boolean} True if the content is a YouTube link/ID, false otherwise.
   */
  canHandle(content) {
    checkDestroy(this.#destroyed);
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
    checkDestroy(this.#destroyed);
    await this.#apiLoadedPromise;

    if (!content || !content.data) {
      throw new TypeError('Invalid media content provided to play().');
    }

    const videoSource = typeof content.data === 'string' ? content.data : content.data.url;

    if (!this.#player) {
      await this.#initializePlayer(videoSource);
    }

    if (this.#player && typeof this.#player.setVolume === 'function') {
      this.#player.setVolume(this.#currentVolume * 100);
    }

    return new Promise((resolve) => {
      this.#player?.playVideo();
      resolve();
    });
  }

  /**
   * Initializes the YT.Player instance or reuses an existing one.
   * @param {string} videoIdOrUrl - The YouTube video ID or URL.
   * @returns {Promise<void>}
   */
  async #initializePlayer(videoIdOrUrl) {
    checkDestroy(this.#destroyed);
    const existing = YoutubeMediaAdapter.#registry.get(this.#container);

    if (existing) {
      this.#player = existing.player;
      this.#masterEmitter = existing.masterEmitter;
      this.#attachToMaster();
      return;
    }

    // Create new master emitter for this specific container
    const masterEmitter = new EventEmitter();

    // Map YouTube API events to the Master Emitter
    /** @type {Record<string, HandlerFunc>} */
    const playerEvents = {};
    Object.entries(YoutubeMediaAdapter.EVENT_MAPPING).forEach(([ytEvent, internalEvent]) => {
      playerEvents[ytEvent] = (...args) => masterEmitter.emit(internalEvent, ...args);
    });

    return new Promise((resolve) => {
      const Player = getYtPlayer();
      this.#player = new Player(this.#container, {
        videoId: this.#extractVideoId(videoIdOrUrl),
        playerVars: {
          playsinline: 1,
        },
        events: playerEvents,
      });

      // Register this container and its master emitter
      YoutubeMediaAdapter.#registry.set(this.#container, {
        player: this.#player,
        masterEmitter: masterEmitter,
      });

      this.#masterEmitter = masterEmitter;

      // Resolve the initialization promise when the player is ready
      this.#masterEmitter?.once('onReady', () => resolve());
      this.#attachToMaster();
    });
  }

  /**
   * Connects this instance to the master emitter of the shared player.
   */
  #attachToMaster() {
    checkDestroy(this.#destroyed);
    if (!this.#masterEmitter) return;

    for (const eventName of Object.values(YoutubeMediaAdapter.EVENT_MAPPING)) {
      /** @type {HandlerFunc} */
      const handler = (...args) => this.emit(eventName, ...args);
      this.#masterEmitter.on(eventName, handler);
      this.#eventHandlers.push({ eventName, handler });
    }
  }

  /**
   * Extracts the 11-character video ID from a URL or returns the string if it is already an ID.
   * @param {string} url - The URL or ID.
   * @returns {string} The extracted video ID.
   */
  #extractVideoId(url) {
    checkDestroy(this.#destroyed);
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
    checkDestroy(this.#destroyed);
    if (this.#player) {
      this.#player.pauseVideo();
    }
  }

  /**
   * Stops the playback completely.
   * @returns {Promise<void>}
   */
  async stop() {
    checkDestroy(this.#destroyed);
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
    checkDestroy(this.#destroyed);
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
    checkDestroy(this.#destroyed);
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
    checkDestroy(this.#destroyed);
    this.volume = volume;
  }

  /**
   * Cleans up the instance and disconnects from the shared player.
   */
  destroy() {
    if (this.#destroyed) return;
    if (this.#masterEmitter && this.#eventHandlers.length > 0) {
      for (const { eventName, handler } of this.#eventHandlers) {
        this.#masterEmitter.off(eventName, handler);
      }
      this.#eventHandlers = [];
    }
    this.#player = null;
    this.#masterEmitter = null;
    super.destroy();
    this.#destroyed = true;
  }
}

export { YoutubeMediaAdapter, getYtPlayer, loadYoutubeApi, getPlayerStateValues };
