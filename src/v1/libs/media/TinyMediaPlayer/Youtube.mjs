/**
 * @typedef {import('../../../basics/mediaContent.mjs').PictureDataType} PictureDataType
 * @typedef {import('../../../basics/mediaContent.mjs').MediaContent<PictureDataType>} MediaContent
 * @typedef {import('./index.mjs').ContentTimeData} ContentTimeData
 * @typedef {import('./index.mjs').ContentData} ContentData
 *
 * @typedef {import('./docs/YouTubePlayer.mjs').YTPlayerState} YTPlayerState
 * @typedef {import('./docs/YouTubePlayer.mjs').YTPlayerErrors} YTPlayerErrors
 * @typedef {import('./docs/YouTubePlayer.mjs').YTQuality} YTQuality
 * @typedef {import('./docs/YouTubePlayer.mjs').YTSphericalProperties} YTSphericalProperties
 * @typedef {import('./docs/YouTubePlayer.mjs').YouTubePlayerEventBase} YouTubePlayerEventBase
 * @typedef {import('./docs/YouTubePlayer.mjs').YTPlayerOptionsEvents} YTPlayerOptionsEvents
 * @typedef {import('./docs/YouTubePlayer.mjs').YTPlayerOptions} YTPlayerOptions
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
 * @property {string|null} [list=null] - The ID of a playlist to load.
 * @property {string|null} [listType=null] - The type of list to load (e.g., 'playlist').
 * @property {string|null} [ccLangPref=null] - The preferred language for closed captions.
 * @property {boolean} [ccLoadPolicy=false] - Whether to load closed captions by default (0 for off, 1 for on).
 * @property {string|null} [color=null] - The color of the player controls (e.g., 'red', 'white').
 * @property {boolean} [controls=true] - Whether to display the player controls.
 * @property {boolean} [disableKb=false] - Whether to disable keyboard controls.
 * @property {boolean} [loop=false] - Whether the video should loop.
 * @property {number|string|null} [end=null] - The time in seconds when the video should end.
 * @property {number|string|null} [start=null] - The time in seconds when the video should start.
 * @property {string|string[]|null} [playlist=null] - A comma-separated list of video IDs to be played as a playlist.
 * @property {boolean} [playsinline=false] - Whether to play the video inline on mobile devices.
 * @property {string|null} [widgetReferrer=null] - The URL of the page where the player is embedded.
 * @property {boolean} [rel=true] - Whether to show related videos from the same channel.
 * @property {string|null} [hl=null] - The language of the player interface.
 * @property {boolean} [fs=true] - Whether to allow the player to enter fullscreen mode.
 * @property {boolean} [ivLoadPolicy=true] - The policy for showing video annotations (1 to show, 3 to hide).
 * @property {string|null} [origin=null] - The origin of the page hosting the player. Defaults to `window.location.origin`.
 *   This is required so the YouTube player can target the parent window with `postMessage` in production.
 */

/**
 * @typedef {Object} ContainerOptions
 * @property {boolean} [hidden=true] - If true, the `hidden` class is added to the container and it is appended to the document body.
 * @property {string|null} [id=null] - An optional id to assign to the container element.
 * @property {string|null} [className=null] - An optional class name to assign to the container element.
 */

import { EventEmitter } from 'events';
import { BaseMediaAdapter } from './index.mjs';
import YouTubePlayer from './docs/YouTubePlayer.mjs';
import { createCheckDestroyed } from '../../utils/tools.mjs';
import { createSingletonTask, waitForTrue } from '../../../basics/promiseUtils.mjs';
import { isValidObj } from '../../../basics/objChecker.mjs';

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
   * Includes semantic events triggered by state changes.
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
    timeupdate: 'timeupdate',
    play: 'play',
    pause: 'pause',
    ended: 'ended',
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
   * The default HTML element where the YouTube player will be injected.
   * It can be an `<iframe>` or any regular element (e.g. a `<div>`), since the
   * YouTube IFrame API is able to replace the target element with its own iframe.
   * @type {HTMLElement|null}
   */
  static #defaultContainer = null;

  /**
   * Default options merged into every `YT.Player` instance created by this adapter.
   * @type {YTPlayerOptions}
   */
  static #playerOptions = {};

  /**
   * Registry to reuse players and master emitters per container.
   * @type {WeakMap<HTMLElement, {player: YouTubePlayer, masterEmitter: EventEmitter, refCount: number}>}
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

  /**
   * Gets the default options used to initialize every `YT.Player` instance.
   * The returned object is a shallow copy, so mutating it will not affect the adapter.
   * @returns {YTPlayerOptions}
   */
  static get playerOptions() {
    return { ...this.#playerOptions };
  }

  /**
   * Sets the default options used to initialize every `YT.Player` instance.
   * These values are merged with (and can be overridden by) the options provided
   * internally by the adapter, such as `videoId`, `playerVars` and `events`.
   * @param {YTPlayerOptions} options - The options to be used as defaults.
   * @throws {TypeError} If the provided options are not a plain object.
   */
  static set playerOptions(options) {
    if (options === null || typeof options !== 'object' || Array.isArray(options)) {
      throw new TypeError('The playerOptions must be an object.');
    }
    this.#playerOptions = { ...options };
  }

  /**
   * Creates a YouTube iframe element.
   * This element can be used as the `defaultContainer` for the adapter.
   *
   * @deprecated Use {@link YoutubeMediaAdapter.createContainer} instead.
   * @param {IframeContainerOptions} options - Configuration for the iframe creation.
   * @returns {HTMLIFrameElement} The created iframe element.
   * @throws {TypeError} If the `videoId` is not a valid string.
   */
  static createIframeContainer(options) {
    const {
      videoId,
      width = 640,
      height = 360,
      hidden = true,
      autoplay = false,
      ivLoadPolicy = true,
      list = null,
      listType = null,
      ccLangPref = null,
      ccLoadPolicy = false,
      color = null,
      controls = true,
      disableKb = false,
      loop = false,
      end = null,
      start = null,
      playlist = null,
      playsinline = false,
      widgetReferrer = null,
      rel = true,
      fs = true,
      hl = null,
      origin = null,
    } = options;

    if (typeof videoId !== 'string' || videoId.trim() === '') {
      throw new TypeError('The "videoId" property is required and must be a valid string.');
    }

    const iframe = document.createElement('iframe');

    // enablejsapi=1 is required to allow control via the YouTube API.
    // The `origin` parameter is mandatory in production: without it the embedded
    // player cannot validate the parent window and every postMessage call is
    // rejected with "The target origin provided ('https://www.youtube.com') does
    // not match the recipient window's origin".
    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      rel: rel ? '1' : '0',
      iv_load_policy: ivLoadPolicy ? '1' : '3',
      loop: loop ? '1' : '0',
      playsinline: playsinline ? '1' : '0',
      fs: fs ? '1' : '0',
      cc_load_policy: ccLoadPolicy ? '1' : '0',
      controls: controls ? '1' : '0',
      disablekb: disableKb ? '1' : '0',
      enablejsapi: '1',
    });

    if (typeof playlist === 'string' || Array.isArray(playlist)) {
      params.set('playlist', Array.isArray(playlist) ? playlist.join(',') : playlist);
    }
    if (typeof ccLangPref === 'string') params.set('cc_lang_pref', ccLangPref);
    if (typeof end === 'string' || typeof end === 'number') params.set('end', String(end));
    if (typeof start === 'string' || typeof start === 'number') params.set('start', String(start));
    if (typeof list === 'string') params.set('list', list);
    if (typeof listType === 'string') params.set('listType', listType);
    if (typeof widgetReferrer === 'string') params.set('widget_referrer', widgetReferrer);
    if (typeof color === 'string') params.set('color', color);
    if (typeof hl === 'string') params.set('hl', hl);

    const resolvedOrigin =
      origin ?? (typeof window !== 'undefined' ? window.location.origin : null);
    if (resolvedOrigin) params.set('origin', resolvedOrigin);

    iframe.src = `https://www.youtube.com/embed/${videoId}?${params.toString()}`;

    iframe.style.width = `${width}px`;
    iframe.style.height = `${height}px`;
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('allow', 'autoplay; encrypted-media');

    iframe.style.pointerEvents = 'none';
    iframe.style.backgroundColor = '#000';

    if (hidden) {
      iframe.style.position = 'fixed';
      iframe.style.opacity = '0';
      iframe.style.pointerEvents = 'none';
      document.body.appendChild(iframe);
    }

    return iframe;
  }

  /**
   * Creates a plain `<div>` element to be used as the player container.
   *
   * Unlike {@link YoutubeMediaAdapter.createIframeContainer}, this does not create
   * an `<iframe>` up front. The YouTube IFrame API is able to replace the target
   * element with its own iframe, so any regular element (e.g. a `<div>`) works as
   * a container. This is the recommended approach when you want the API to fully
   * manage the underlying iframe.
   *
   * @param {ContainerOptions} [options] - Configuration for the container creation.
   * @returns {HTMLDivElement} The created container element.
   */
  static createContainer(options = {}) {
    const { hidden = true, id = null, className = null } = options;

    const container = document.createElement('div');

    if (typeof id === 'string') container.id = id;
    if (typeof className === 'string') container.className = className;

    container.style.pointerEvents = 'none';
    container.style.backgroundColor = '#000';

    if (hidden) {
      container.style.position = 'fixed';
      container.style.opacity = '0';
      container.style.pointerEvents = 'none';
      document.body.appendChild(container);
    }

    return container;
  }

  /**
   * Returns the URL for a YouTube video thumbnail with a specified quality.
   * @param {string} videoId - The YouTube video ID.
   * @param {string} [quality='maxresdefault'] - The thumbnail quality (e.g., 'default', 'mqdefault', 'hqdefault', 'sddefault', 'maxresdefault').
   * @returns {string} The thumbnail URL.
   * @throws {TypeError} If the videoId is not a valid string.
   */
  static getThumbnailUrl(videoId, quality = 'maxresdefault') {
    if (typeof videoId !== 'string' || videoId.trim() === '') {
      throw new TypeError('The "videoId" must be a non-empty string.');
    }
    if (typeof quality !== 'string' || quality.trim() === '') {
      throw new TypeError('The "quality" must be a non-empty string.');
    }
    return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
  }

  get id() {
    return 'youtubeEmbedApi';
  }

  /** @type {YouTubePlayer|null} */
  #player = null;

  /** @type {HTMLElement} */
  #container;

  #isReady = false;

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

  /** @type {number} */
  #lastReportedTime = 0;

  /** @type {ReturnType<typeof setInterval>|null} */
  #timeUpdateInterval = null;

  /** @type {number} */
  #pollingTimeUpdateValue = 250;

  /** @type {boolean} */
  #isPaused = false;

  /** @type {boolean} */
  #isEnded = false;

  get pollingTimeUpdateValue() {
    checkDestroy(this.#destroyed);
    return this.#pollingTimeUpdateValue;
  }

  set pollingTimeUpdateValue(timeMs) {
    checkDestroy(this.#destroyed);
    if (typeof timeMs !== 'number') throw new TypeError('Time must be a number.');
    this.#pollingTimeUpdateValue = timeMs;
  }

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
    this.emit('volumeChange', this.#currentVolume);
  }

  /**
   * @returns {number} The current volume level from 0.0 to 1.0.
   */
  get volume() {
    checkDestroy(this.#destroyed);
    return this.#currentVolume;
  }

  /**
   * Synchronously checks whether the YouTube media adapter is fully initialized and ready.
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
   * Asynchronously waits until the YouTube media adapter is fully initialized and ready.
   * @returns {Promise<void>} A promise that resolves once the adapter is ready.
   */
  async waitIsReady() {
    checkDestroy(this.#destroyed);
    return waitForTrue(() => this.#isReady);
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
   * Determines if the content is a valid YouTube URL or ID.
   * @param {MediaContent} content - The media content to evaluate.
   * @returns {boolean} True if the content is a YouTube link/ID, false otherwise.
   */
  static canHandle(content) {
    if (!isValidObj(content)) {
      throw new TypeError('Content must be a valid object.');
    }
    if (typeof content.url !== 'string') return false;
    const youtubeRegex =
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    return youtubeRegex.test(content.url);
  }

  /**
   * Determines if the content is a valid YouTube URL or ID.
   * @param {MediaContent} content - The media content to evaluate.
   * @returns {boolean} True if the content is a YouTube link/ID, false otherwise.
   */
  canHandle(content) {
    checkDestroy(this.#destroyed);
    return YoutubeMediaAdapter.canHandle(content);
  }

  /**
   * Plays the media content. If the player is already initialized with a different video,
   * it will load the new video automatically.
   *
   * Example: https://www.youtube.com/watch?v=XXXXXXXXXXX
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

    if (this.#player && typeof this.#player.setVolume === 'function') {
      this.#player.setVolume(this.#currentVolume * 100);
    }

    // If the video is different, load the new one
    if (this.#currentContentId !== targetVideoId) {
      this.#currentContentId = targetVideoId;
      this.#player?.loadVideoById(targetVideoId);
      // Reset the last reported time to 0 to prevent a false 'seek' event
      // when the new video starts playing.
      this.#lastReportedTime = 0;
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
          if (isValidObj(state)) {
            if (state.data === YoutubeMediaAdapter.PlayerState.PLAYING) {
              this.#isPaused = false;
              this.#isEnded = false;
              masterEmitter.emit('play');
            }
            if (state.data === YoutubeMediaAdapter.PlayerState.PAUSED) {
              this.#isPaused = true;
              this.#isEnded = false;
              masterEmitter.emit('pause');
            }
            if (state.data === YoutubeMediaAdapter.PlayerState.ENDED) {
              this.#isPaused = false;
              this.#isEnded = true;
              masterEmitter.emit('ended');
            }
          }
        }
        return result;
      };
    });

    return new Promise((resolve) => {
      const Player = getYtPlayer();
      /** @type {Record<string, string|number>} */
      const playerVars = { playsinline: 1 };
      // The `origin` player var is what the embedded player uses as the
      // `postMessage` target. Without it the handshake is rejected in
      // production ("target origin ... does not match the recipient
      // window's origin") and `onReady` never fires.
      if (typeof window !== 'undefined' && window.location?.origin) {
        playerVars.origin = window.location.origin;
      }

      // Merge the user-provided defaults with the values required by the
      // adapter. The adapter-controlled values (videoId, playerVars, events)
      // always win so the player keeps working as expected.
      const { playerVars: customPlayerVars, ...customOptions } = YoutubeMediaAdapter.#playerOptions;
      this.#player = new Player(this.#container, {
        ...customOptions,
        videoId: videoId,
        playerVars: { ...customPlayerVars, ...playerVars },
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
        this.#lastReportedTime = this.getCurrentTime();
        this.#startPollingTimeUpdate();
        this.#isReady = true;
        resolve();
      });

      this.#attachToMaster();
    });
  }

  /**
   * Starts a polling interval to emit 'timeupdate' events, matching the HTML5 Audio interface.
   * Also detects 'seek' events by monitoring large jumps in the playback time.
   */
  #startPollingTimeUpdate() {
    this.#timeUpdateInterval = setInterval(() => {
      if (!this.#player) return;

      const currentTime = this.getCurrentTime();
      const isPlaying = this.#player.getPlayerState() === YoutubeMediaAdapter.PlayerState.PLAYING;

      if (isPlaying) {
        const diff = Math.abs(currentTime - this.#lastReportedTime);

        // If the time jump is greater than 1 second, we interpret it as a 'seek' event.
        // This captures both programmatic seeks and user interactions with the YouTube UI.
        if (diff > 1000) {
          this.emit('seek', currentTime / 1000);
        }

        this.#masterEmitter?.emit('timeupdate', this.getTimeData());
      }

      // Always update the last reported time to keep it in sync with the actual player position.
      // This prevents false 'seek' events when resuming playback after a pause or a seek while paused.
      this.#lastReportedTime = currentTime;
    }, this.#pollingTimeUpdateValue);
  }

  /**
   * Connects this instance to the master emitter of the shared player.
   */
  #attachToMaster() {
    checkDestroy(this.#destroyed);
    if (!this.#masterEmitter) return;

    for (const eventName of Object.values(YoutubeMediaAdapter.EVENT_MAPPING)) {
      /** @type {HandlerFunc} */
      const handler = (...args) => this.emit(/** @type {any} */ (eventName), ...args);
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
    const targetTimeInSeconds = timeMs / 1000;
    this.#player?.seekTo(targetTimeInSeconds, true);
  }

  /**
   * Checks whether the player is currently muted.
   * @returns {boolean|null} True if muted, false otherwise.
   */
  isMuted() {
    checkDestroy(this.#destroyed);
    return this.#player?.isMuted() ?? null;
  }

  /**
   * Mutes the current playback.
   * @returns {Promise<void>}
   */
  async mute() {
    checkDestroy(this.#destroyed);
    this.#player?.mute();
  }

  /**
   * Unmutes the current playback.
   * @returns {Promise<void>}
   */
  async unMute() {
    checkDestroy(this.#destroyed);
    this.#player?.unMute();
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
   * Gets the total duration of the YouTube video.
   * @returns {number} The total duration in milliseconds.
   */
  getTotalDuration() {
    checkDestroy(this.#destroyed);
    return this.#player ? Math.floor(this.#player.getDuration() * 1000) : 0;
  }

  /**
   * Gets the remaining time until the YouTube video ends.
   * @returns {number} The remaining time in milliseconds.
   */
  getRemainingTime() {
    checkDestroy(this.#destroyed);
    const total = this.getTotalDuration();
    const current = this.getCurrentTime();
    return total > 0 ? total - current : 0;
  }

  /**
   * Gets the percentage of the YouTube video that has been played.
   * @returns {number} The percentage from 0 to 100.
   */
  getPlaybackPercentage() {
    checkDestroy(this.#destroyed);
    const total = this.getTotalDuration();
    const current = this.getCurrentTime();
    return total > 0 ? (current / total) * 100 : 0;
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
   * @returns {number}
   * @throws {RangeError} If volume is outside [0.0, 1.0].
   */
  getVolume() {
    return this.volume;
  }

  /**
   * Retrieves the thumbnail URL for the currently loaded video with a specified quality.
   * @param {string} [quality='maxresdefault'] - The thumbnail quality.
   * @returns {string|null} The thumbnail URL or null if no video is loaded.
   */
  getThumbnailUrl(quality = 'maxresdefault') {
    checkDestroy(this.#destroyed);
    return this.#currentContentId
      ? YoutubeMediaAdapter.getThumbnailUrl(this.#currentContentId, quality)
      : null;
  }

  /**
   * Retrieves the metadata of the currently loaded YouTube video, returning a structured
   * object containing details such as the video ID, title, author, and duration.
   * @returns {Promise<ContentData>}
   */
  async getContentData() {
    const video = this.#player?.getVideoData();
    if (!video) throw new Error('No video data available from the YouTube player.');
    return {
      id: String(video.video_id ?? ''),
      createdAt: '',
      artistId: '',
      artistName: String(video.author ?? ''),
      description: '',
      title: String(video.title ?? ''),
      duration: Number(video.progressBarEndPositionUtcTimeMillis ?? 0),
      avatar: this.getThumbnailUrl() ?? '',
      url: `https://youtu.be/${this.#currentContentId}`,
    };
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
 * the YouTube Player constructor and the current player state mapping.
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
