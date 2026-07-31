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
 * @typedef {(...args: any[]) => boolean} HandlerFunc
 */

/**
 * @typedef {Object} IframeContainerOptions
 * @property {string} videoId - The YouTube video ID to be loaded.
 * @property {number|string} [width=640] - The iframe width in pixels or a string (e.g., '100%').
 * @property {number|string} [height=360] - The iframe height in pixels or a string (e.g., '100%').
 * @property {boolean} [hidden=true] - If true, the iframe will be invisible (opacity 0) and will not respond to clicks (pointer-events none) and appends it to the document body.
 * @property {boolean} [autoplay=false] - If true, the video will start automatically upon loading.
 */

import { EventEmitter } from 'events';
import { BaseMediaAdapter } from './index.mjs';
import YouTubePlayer from './docs/YouTubePlayer.mjs';
import { createCheckDestroyed } from '../utils.mjs';
import { createSingletonTask, waitForTrue } from '../../basics/promiseUtils.mjs';
import { isValidObj } from '../../basics/objChecker.mjs';

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
      let isError = false;
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      tag.async = true;
      tag.onerror = () => {
        isError = true;
        reject(new Error('Failed to load YouTube IFrame API.'));
      };
      document.body.appendChild(tag);

      // Check periodically if YT is ready
      waitForTrue(
        // @ts-ignore
        () => isError || (typeof window !== 'undefined' && window.YT && window.YT.Player),
      ).then(() => {
        if (isError) return;
        // @ts-ignore
        YoutubeMediaAdapter.PlayerState = window.YT.PlayerState;
        resolve(undefined);
      });
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
   * @type {HTMLIFrameElement|null}
   */
  static #defaultContainer = null;

  /**
   * Registry to reuse players and master emitters per container.
   * @type {WeakMap<HTMLIFrameElement, {player: YouTubePlayer, masterEmitter: EventEmitter, refCount: number}>}
   */
  static #registry = new WeakMap();

  /**
   * Gets the globally configured default container for YouTube players.
   * @returns {HTMLIFrameElement|null}
   */
  static get defaultContainer() {
    return this.#defaultContainer;
  }

  /**
   * Sets the globally configured default container for YouTube players.
   * @param {HTMLIFrameElement|null} element - The element to be used as the default container.
   * @throws {TypeError} If the provided element is not an instance of HTMLIFrameElement.
   */
  static set defaultContainer(element) {
    if (element !== null && !(element instanceof HTMLIFrameElement)) {
      throw new TypeError('The defaultContainer must be an instance of HTMLIFrameElement.');
    }
    this.#defaultContainer = element;
  }

  /**
   * Creates a YouTube iframe element.
   * This element can be used as the `defaultContainer` for the adapter.
   *
   * @param {IframeContainerOptions} options - Configuration for the iframe creation.
   * @returns {HTMLIFrameElement} The created iframe element.
   * @throws {TypeError} If the `videoId` is not a valid string.
   */
  static createIframeContainer(options) {
    const { videoId, width = 640, height = 360, hidden = true, autoplay = false } = options;

    if (typeof videoId !== 'string' || videoId.trim() === '') {
      throw new TypeError('The "videoId" property is required and must be a valid string.');
    }

    const iframe = document.createElement('iframe');

    // enablejsapi=1 is required to allow control via the YouTube API
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&enablejsapi=1`;

    iframe.style.width = `${width}px`;
    iframe.style.height = `${height}px`;
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'autoplay; encrypted-media');

    if (hidden) {
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      // Absolute positioning outside the viewport to prevent layout shifting
      iframe.style.position = 'absolute';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      document.body.appendChild(iframe);
    }

    return iframe;
  }

  get id() {
    return 'youtubeEmbedApi';
  }

  /** @type {YouTubePlayer|null} */
  #player = null;

  /** @type {HTMLIFrameElement} */
  #container;

  /** @type {Promise<void>} */
  #apiLoadedPromise;

  /** @type {number} */
  #currentVolume = 1.0;

  /** @type {EventEmitter|null} */
  #masterEmitter = null;

  /** @type {Array<{eventName: string, handler: HandlerFunc}>} */
  #eventHandlers = [];

  /** @type {boolean} */
  #destroyed = false;

  /** @type {string|null} */
  #currentContentId = null;

  get currentContentId() {
    return this.#currentContentId;
  }

  /** @type {ReturnType<typeof setInterval>|null} */
  #timeUpdateInterval = null;

  /**
   * Gets whether the adapter has been destroyed.
   * @returns {boolean}
   */
  get destroyed() {
    return this.#destroyed;
  }

  /**
   * Initializes the YouTube Media Adapter.
   * @throws {Error} If allowInstanceSharing is false and the container is already in use.
   */
  constructor() {
    const container = YoutubeMediaAdapter.#defaultContainer;
    if (!(container instanceof HTMLIFrameElement)) {
      throw new TypeError(
        'The YoutubeMediaAdapter.defaultContainer must be an instance of HTMLIFrameElement.',
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

  /**
   * Determines if the content is a valid YouTube URL or ID.
   * @param {MediaContent} content - The media content to evaluate.
   * @returns {boolean} True if the content is a YouTube link/ID, false otherwise.
   */
  canHandle(content) {
    checkDestroy(this.#destroyed);
    if (!isValidObj(content)) {
      throw new TypeError('Content must be a valid object.');
    }
    if (typeof content.url !== 'string') return false;
    const youtubeRegex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    return youtubeRegex.test(content.url);
  }

  /**
   * Plays the media content. If the player is already initialized with a different video,
   * it will load the new video automatically.
   * @param {MediaContent} content - The media content to play.
   * @returns {Promise<void>}
   * @throws {TypeError} If the content data is invalid.
   */
  async play(content) {
    checkDestroy(this.#destroyed);
    await this.#apiLoadedPromise;

    if (!isValidObj(content) || !content.url) {
      throw new TypeError('Invalid media content provided to play().');
    }

    const videoSource = typeof content.url === 'string' ? content.url : '';
    const targetVideoId = this.#extractVideoId(videoSource);

    if (!this.#player) {
      await this.#initializePlayer(targetVideoId);
    }

    // If the video is different, load the new one
    if (this.#currentContentId !== targetVideoId) {
      this.#currentContentId = targetVideoId;
      this.#player?.loadVideoById(targetVideoId);
    } else {
      this.#player?.playVideo();
    }

    return Promise.resolve();
  }

  /**
   * Initializes the YT.Player instance and sets up semantic event bridging.
   * @param {string} videoId - The video ID to load.
   * @returns {Promise<void>}
   */
  async #initializePlayer(videoId) {
    checkDestroy(this.#destroyed);
    const existing = YoutubeMediaAdapter.#registry.get(this.#container);

    if (existing) {
      existing.refCount++; // Increment reference count for the shared player
      this.#player = existing.player;
      this.#masterEmitter = existing.masterEmitter;
      this.#currentContentId = this.#player.getVideoData()?.video_id || null;
      this.#attachToMaster();
      return;
    }

    // Create new master emitter for this specific container
    const masterEmitter = new EventEmitter();

    // Map YouTube API events to the Master Emitter
    /** @type {Record<string, HandlerFunc>} */
    const playerEvents = {};
    Object.entries(YoutubeMediaAdapter.EVENT_MAPPING).forEach(([ytEvent, internalEvent]) => {
      playerEvents[ytEvent] = (...args) => {
        const result = masterEmitter.emit(internalEvent, ...args);
        // Bridge YouTube states to semantic events: play, pause, ended
        if (ytEvent === 'onStateChange') {
          const state = args[0];
          if (state === YoutubeMediaAdapter.PlayerState.PLAYING) masterEmitter.emit('play');
          if (state === YoutubeMediaAdapter.PlayerState.PAUSED) masterEmitter.emit('pause');
          if (state === YoutubeMediaAdapter.PlayerState.ENDED) masterEmitter.emit('ended');
        }
        return result;
      };
    });

    return new Promise((resolve) => {
      const Player = getYtPlayer();
      this.#player = new Player(this.#container, {
        videoId: videoId,
        playerVars: { playsinline: 1 },
        events: playerEvents,
      });

      // Register this container and its master emitter with initial refCount
      YoutubeMediaAdapter.#registry.set(this.#container, {
        player: this.#player,
        masterEmitter: masterEmitter,
        refCount: 1,
      });

      this.#masterEmitter = masterEmitter;

      // Resolve the initialization promise when the player is ready
      this.#masterEmitter?.once('onReady', () => {
        this.#startPollingTimeUpdate();
        resolve();
      });

      this.#attachToMaster();
    });
  }

  /**
   * Starts a polling interval to emit 'timeupdate' events, matching the HTML5 Audio interface.
   */
  #startPollingTimeUpdate() {
    this.#timeUpdateInterval = setInterval(() => {
      if (
        this.#player &&
        this.#player.getPlayerState() === YoutubeMediaAdapter.PlayerState.PLAYING
      ) {
        this.#masterEmitter?.emit('timeupdate', this.getCurrentTime());
      }
    }, 250);
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
    this.#player?.pauseVideo();
  }

  /**
   * Stops the playback completely.
   * @returns {Promise<void>}
   */
  async stop() {
    checkDestroy(this.#destroyed);
    this.#player?.stopVideo();
  }

  /**
   * Seeks to a specific time in the media timeline.
   * @param {number} timeMs - The target time in milliseconds.
   * @returns {Promise<void>}
   * @throws {TypeError} If timeMs is not a number.
   */
  async seek(timeMs) {
    checkDestroy(this.#destroyed);
    if (typeof timeMs !== 'number') throw new TypeError('Time must be a number.');
    const currentTime = timeMs / 1000;
    this.#player?.seekTo(currentTime, true);
    this.emit('seek', currentTime);
  }

  /**
   * Retrieves the current playback time.
   * @returns {number} The current time in milliseconds.
   */
  getCurrentTime() {
    checkDestroy(this.#destroyed);
    return this.#player ? this.#player.getCurrentTime() * 1000 : 0;
  }

  /**
   * Sets the playback volume.
   * @param {number} volume - The volume level from 0.0 to 1.0.
   * @returns {void}
   * @throws {RangeError} If volume is outside [0.0, 1.0].
   */
  setVolume(volume) {
    this.volume = volume;
  }

  /**
   * Gets the playback volume.
   * @returns {number} The volume level from 0.0 to 1.0.
   */
  getVolume() {
    return this.volume;
  }

  /**
   * Cleans up the instance and disconnects from the shared player.
   */
  destroy() {
    if (this.#destroyed) return;

    if (this.#timeUpdateInterval) {
      clearInterval(this.#timeUpdateInterval);
    }

    // 1. Detach from the master emitter
    if (this.#masterEmitter && this.#eventHandlers.length > 0) {
      for (const { eventName, handler } of this.#eventHandlers) {
        this.#masterEmitter.off(eventName, handler);
      }
      this.#eventHandlers = [];
    }

    // 2. Handle Registry Cleanup (Reference Counting)
    const existing = YoutubeMediaAdapter.#registry.get(this.#container);
    if (existing) {
      existing.refCount--;
      // If this was the last instance using this player/container, clean up the registry
      if (existing.refCount <= 0) {
        YoutubeMediaAdapter.#registry.delete(this.#container);
      }
    }

    this.#player = null;
    this.#masterEmitter = null;
    this.#currentContentId = null;
    this.#destroyed = true;
    super.destroy();
  }
}

/**
 * Asynchronously ensures the YouTube IFrame API is loaded and returns
 * the YouTube Player constructor and the current PlayerState values.
 *
 * @returns {Promise<{ Player: typeof YouTubePlayer, PlayerState: Record<string, number> }>}
 * An object containing the Player constructor and the current player state mapping.
 */
const getYT = async () => {
  await loadYoutubeApi();
  return {
    Player: getYtPlayer(),
    PlayerState: getPlayerStateValues(),
  };
};

export { YoutubeMediaAdapter, getYtPlayer, loadYoutubeApi, getPlayerStateValues, getYT };
