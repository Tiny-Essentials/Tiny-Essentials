/**
 * @typedef {import('../../basics/mediaContent.mjs').PictureDataType} PictureDataType
 * @typedef {import('../../basics/mediaContent.mjs').MediaContent<PictureDataType>} MediaContent
 * @typedef {import('./index.mjs').ContentTimeData} ContentTimeData
 */

/**
 * Represents a function used as an event handler, capable of accepting any number of arguments.
 * @typedef {(...args: any[]) => boolean} HandlerFunc
 */

/**
 * @typedef {Object} IframeContainerOptions
 * @property {string} videoId - The SoundCloud song ID to be loaded.
 * @property {number|string} [width=640] - The iframe width in pixels or a string (e.g., '100%').
 * @property {number|string} [height=360] - The iframe height in pixels or a string (e.g., '100%').
 * @property {boolean} [hidden=true] - If true, the iframe will be invisible (opacity 0) and will not respond to clicks (pointer-events none) and appends it to the document body.
 * @property {boolean} [autoPlay=false] - If true, the video will start automatically upon loading.
 * @property {null|number} [startTrack=null]
 * @property {string|null} [color=null]
 * @property {boolean} [buying=false]
 * @property {boolean} [sharing=true]
 * @property {boolean} [download=true]
 * @property {boolean} [showArtwork=true]
 * @property {boolean} [showPlayCount=true]
 * @property {boolean} [showUser=true]
 * @property {boolean} [singleActive=true]
 */

import { EventEmitter } from 'events';
import SoundCloudWidget from './docs/SoundCloudWidget.mjs';
import { BaseMediaAdapter } from './index.mjs';
import { createCheckDestroyed } from '../utils.mjs';
import { createSingletonTask, waitForTrue } from '../../basics/promiseUtils.mjs';
import { isValidObj } from '../../basics/objChecker.mjs';

const makeLoadSoundCloudApi = () => {
  const { callback } = createSingletonTask(async () => {
    // Use existing API if already loaded
    // @ts-ignore
    if (typeof window !== 'undefined' && window.SC && window.SC.Widget) {
      // @ts-ignore
      SoundCloudMediaAdapter.Events = window.SC.Widget.Events;
      return Promise.resolve(undefined);
    }

    return new Promise((resolve, reject) => {
      let isError = false;
      const tag = document.createElement('script');
      tag.src = 'https://w.soundcloud.com/player/api.js';
      tag.async = true;
      tag.onerror = () => {
        isError = true;
        reject(new Error('Failed to load SoundCloud Widget API.'));
      };
      document.body.appendChild(tag);

      // Check periodically if SC is ready
      waitForTrue(
        // @ts-ignore
        () => isError || (typeof window !== 'undefined' && window.SC && window.SC.Widget),
      ).then(() => {
        if (isError) return;
        // @ts-ignore
        SoundCloudMediaAdapter.Events = window.SC.Widget.Events;
        resolve(undefined);
      });
    });
  });
  return callback;
};

/**
 * Method to ensure the SoundCloud Widget API script is loaded.
 */
const loadSoundCloudApi = makeLoadSoundCloudApi();

/**
 * Returns a deep clone of the current YouTube player state values.
 * This ensures the returned object is a copy and does not maintain a reference to the original state.
 * @returns {Record<string, string>} A copy of the Events object.
 */
const getPlayerStateValues = () => {
  return structuredClone(SoundCloudMediaAdapter.Events);
};

/**
 * Returns the SoundCloud Widget constructor from the global window object.
 * @returns {typeof SoundCloudWidget} The SoundCloud Widget constructor.
 * @throws {Error} If the SoundCloud API is not detected in the global scope.
 */
const getSCWidget = () => {
  // @ts-ignore
  if (typeof window === 'undefined' || !window.SC || !window.SC.Widget)
    throw new Error('SoundCloud API not available');
  /** @type {typeof SoundCloudWidget} */
  // @ts-ignore
  const Widget = window.SC.Widget;
  return Widget;
};

const checkDestroy = createCheckDestroyed('SoundCloudMediaAdapter');

/**
 * Implementation of BaseMediaAdapter for the SoundCloud Widget API.
 * This adapter manages the lifecycle of a SoundCloud widget embedded in a container.
 * @extends BaseMediaAdapter
 */
class SoundCloudMediaAdapter extends BaseMediaAdapter {
  /**
   * Mapping SoundCloud API events for internal adapter events.
   * @type {Record<string, string>}
   * @private
   */
  static EVENT_MAPPING = {
    onReady: 'onReady',
    timeupdate: 'timeupdate',
    play: 'play',
    pause: 'pause',
    ended: 'ended',
  };

  /**
   * Static object containing event names to match SC.Widget.Events.
   * @type {Record<string, string>}
   */
  static Events = {
    LOAD_PROGRESS: 'LOAD_PROGRESS',
    PLAY_PROGRESS: 'PLAY_PROGRESS',
    PLAY: 'PLAY',
    PAUSE: 'PAUSE',
    FINISH: 'FINISH',
    SEEK: 'SEEK',
    READY: 'READY',
    CLICK_DOWNLOAD: 'CLICK_DOWNLOAD',
    CLICK_BUY: 'CLICK_BUY',
    OPEN_SHARE_PANEL: 'OPEN_SHARE_PANEL',
    ERROR: 'ERROR',
  };

  /**
   * Safety lock: If true, multiple instances can share the same player/iframe via WeakMap.
   * If false, only one instance can be bound to a specific container at a time.
   * @type {boolean}
   */
  static allowInstanceSharing = false;

  /**
   * The default HTML element where the SoundCloud iframe will be injected.
   * @type {HTMLIFrameElement|null}
   */
  static #defaultContainer = null;

  /**
   * Registry to reuse players and master emitters per container.
   * @type {WeakMap<HTMLIFrameElement, {widget: SoundCloudWidget, masterEmitter: EventEmitter, refCount: number}>}
   */
  static #registry = new WeakMap();

  /**
   * Gets the globally configured default container for SoundCloud players.
   * @returns {HTMLIFrameElement|null}
   */
  static get defaultContainer() {
    return this.#defaultContainer;
  }

  /**
   * Sets the globally configured default container for SoundCloud players.
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
   * Creates a SoundCloud iframe element.
   * This element can be used as the `defaultContainer` for the adapter.
   *
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
      autoPlay = false,
      startTrack = null,
      color = null,
      buying = false,
      sharing = true,
      download = true,
      showArtwork = true,
      showPlayCount = true,
      showUser = true,
      singleActive = true,
    } = options;

    if (typeof videoId !== 'string' || videoId.trim() === '') {
      throw new TypeError('The "videoId" property is required and must be a valid string.');
    }

    const iframe = document.createElement('iframe');

    // SoundCloud requires the widget API to be enabled via the URL or by including the script
    iframe.src = `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${videoId}${typeof startTrack === 'number' ? `&start_track=${startTrack}` : ''}&auto_play=${autoPlay ? 'true' : 'false'}${typeof color === 'string' ? `&color=${color}` : ''}&buying=${buying ? 'true' : 'false'}&sharing=${sharing ? 'true' : 'false'}&download=${download ? 'true' : 'false'}&show_artwork=${showArtwork ? 'true' : 'false'}&show_playcount=${showPlayCount ? 'true' : 'false'}&show_user=${showUser ? 'true' : 'false'}&single_active=${singleActive ? 'true' : 'false'}`;
    iframe.scrolling = 'no';
    iframe.frameBorder = 'no';
    iframe.allow = 'autoplay';
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

  /**
   * Returns the thumbnail URL for the currently loaded track.
   * @param {string} trackId - The SoundCloud track ID.
   * @returns {string} The thumbnail URL.
   * @throws {TypeError} If the trackId is not a valid string.
   */
  static getThumbnailUrl(trackId) {
    if (typeof trackId !== 'string' || trackId.trim() === '') {
      throw new TypeError('The "trackId" must be a non-empty string.');
    }
    return `https://i.soundcloud.com/${trackId}.jpg`;
  }

  get id() {
    return 'soundcloudEmbedApi';
  }

  /** @type {SoundCloudWidget|null} */
  #widget = null;

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

  /** @type {number} */
  #cachedDuration = 0;

  /** @type {number} */
  #cachedPosition = 0;

  /**
   * Gets whether the adapter has been destroyed.
   * @returns {boolean}
   */
  get destroyed() {
    return this.#destroyed;
  }

  /**
   * Initializes the SoundCloud Media Adapter.
   * @throws {Error} If allowInstanceSharing is false and the container is already in use.
   */
  constructor() {
    const container = SoundCloudMediaAdapter.#defaultContainer;
    if (!(container instanceof HTMLIFrameElement)) {
      throw new TypeError(
        'The SoundCloudMediaAdapter.defaultContainer must be an instance of HTMLIFrameElement.',
      );
    }

    if (
      !SoundCloudMediaAdapter.allowInstanceSharing &&
      SoundCloudMediaAdapter.#registry.has(container)
    ) {
      throw new Error(
        'Security Lock: This container is already bound to another SoundCloudMediaAdapter instance.',
      );
    }

    super();
    this.#container = container;
    this.#apiLoadedPromise = loadSoundCloudApi();
  }

  /**
   * @returns {SoundCloudWidget} The current SoundCloud widget instance.
   * @throws {Error} If the widget has not been initialized.
   */
  get widget() {
    checkDestroy(this.#destroyed);
    if (!this.#widget) {
      throw new Error('SoundCloud widget instance not initialized.');
    }
    return this.#widget;
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
    if (this.#widget && typeof this.#widget.setVolume === 'function') {
      this.#widget.setVolume(value * 100);
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
   * Determines if the content is a valid SoundCloud URL or ID.
   * @param {MediaContent} content - The media content to evaluate.
   * @returns {boolean} True if the content is a SoundCloud link/ID, false otherwise.
   */
  canHandle(content) {
    checkDestroy(this.#destroyed);
    if (!isValidObj(content)) {
      throw new TypeError('Content must be a valid object.');
    }
    if (typeof content.url !== 'string') return false;
    // Regex to match SoundCloud track IDs
    const scRegex = /^https?:\/\/api.(soundcloud\.com|snd\.sc)\/tracks\/(.*)$/;
    const result = content.url.match(scRegex);
    return result && result[2] ? true : false;
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

    const songSource = typeof content.url === 'string' ? content.url : '';
    const targetId = this.#extractId(songSource);

    if (!this.#widget) {
      await this.#initializeWidget(targetId);
    }

    if (this.#widget && typeof this.#widget.setVolume === 'function') {
      this.#widget.setVolume(this.#currentVolume * 100);
    }

    // If the video is different, load the new one
    if (this.#currentContentId !== targetId) {
      this.#currentContentId = targetId;
      this.#widget?.load(`https://api.soundcloud.com/tracks/${targetId}`);
    } else {
      this.#widget?.play();
    }

    return Promise.resolve();
  }

  /**
   * Initializes the SoundCloud Widget.
   * @param {string} trackId - The track ID.
   * @returns {Promise<void>}
   */
  async #initializeWidget(trackId) {
    checkDestroy(this.#destroyed);
    const existing = SoundCloudMediaAdapter.#registry.get(this.#container);

    if (existing) {
      existing.refCount++; // Increment reference count for the shared player
      this.#widget = existing.widget;
      this.#masterEmitter = existing.masterEmitter;
      // this.#currentContentId = this.#player.getVideoData()?.video_id || null;
      this.#attachToMaster();
      return;
    }

    // Create new master emitter for this specific container
    const masterEmitter = new EventEmitter();
    return new Promise((resolve) => {
      const WidgetClass = getSCWidget();
      this.#widget = new WidgetClass(this.#container);

      // Resolve the initialization promise when the player is ready
      this.#widget.bind(SoundCloudMediaAdapter.Events.READY, () => {
        this.#masterEmitter?.emit('onReady');
        this.#startPollingTimeUpdate();
        resolve();
      });

      this.#widget.bind(SoundCloudMediaAdapter.Events.PLAY, () => {
        this.#masterEmitter?.emit('play');
      });

      this.#widget.bind(SoundCloudMediaAdapter.Events.PAUSE, () => {
        this.#masterEmitter?.emit('pause');
      });

      this.#widget.bind(SoundCloudMediaAdapter.Events.FINISH, () => {
        this.#masterEmitter?.emit('ended');
      });

      for (const eventName of Object.values(SoundCloudMediaAdapter.Events)) {
        this.#widget.bind(
          SoundCloudMediaAdapter.Events[eventName],
          (/** @type {any} */ ...args) => {
            const result = masterEmitter.emit(eventName, ...args);
            return result;
          },
        );
      }

      // Register this container and its master emitter with initial refCount
      SoundCloudMediaAdapter.#registry.set(this.#container, {
        widget: this.#widget,
        masterEmitter: masterEmitter,
        refCount: 1,
      });

      this.#masterEmitter = masterEmitter;
      this.#attachToMaster();
    });
  }

  /**
   * Starts a polling interval to emit 'timeupdate' events, matching the HTML5 Audio interface.
   */
  #startPollingTimeUpdate() {
    this.#timeUpdateInterval = setInterval(() => {
      if (this.#widget) {
        // SoundCloud uses callbacks for getters, so we update local cache
        this.#widget.getPosition((pos) => {
          this.#cachedPosition = pos;
          this.#masterEmitter?.emit('timeupdate', this.getTimeData());
        });
        this.#widget.getDuration((dur) => {
          this.#cachedDuration = dur;
        });
      }
    }, 250);
  }

  /**
   * Connects this instance to the master emitter of the shared player.
   */
  #attachToMaster() {
    checkDestroy(this.#destroyed);
    if (!this.#masterEmitter) return;

    for (const eventName of Object.values({
      ...SoundCloudMediaAdapter.EVENT_MAPPING,
      ...SoundCloudMediaAdapter.Events,
    })) {
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
  #extractId(url) {
    checkDestroy(this.#destroyed);
    const regex =
      /(?:soundcloud\.com\/[\w-]+\/([\w-]+))|(?:soundcloud\.com\/[\w-]+)\/([\w-]+)|([\w-]{11})/;
    const match = url.match(regex);
    return match ? match[1] || match[2] || match[3] : url;
  }

  /**
   * Pauses the current playback.
   * @returns {Promise<void>}
   */
  async pause() {
    checkDestroy(this.#destroyed);
    this.#widget?.pause();
  }

  /**
   * Stops the playback completely.
   * @returns {Promise<void>}
   */
  async stop() {
    checkDestroy(this.#destroyed);
    this.#widget?.pause();
    this.#widget?.seekTo(0);
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
    this.#widget?.seekTo(timeMs);
    this.emit('seek', timeMs);
  }

  /**
   * Retrieves the current playback time.
   * @returns {number} The current time in milliseconds.
   */
  getCurrentTime() {
    checkDestroy(this.#destroyed);
    return this.#cachedPosition;
  }

  /**
   * Gets the total duration of the YouTube video.
   * @returns {number} The total duration in milliseconds.
   */
  getTotalDuration() {
    checkDestroy(this.#destroyed);
    return this.#cachedDuration;
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
    return this.#currentVolume;
  }

  /**
   * Retrieves the thumbnail URL for the currently loaded video with a specified quality.
   * @param {string} [quality='maxresdefault'] - The thumbnail quality.
   * @returns {string|null} The thumbnail URL or null if no video is loaded.
   */
  getThumbnailUrl(quality = 'maxresdefault') {
    checkDestroy(this.#destroyed);
    return this.#currentContentId
      ? SoundCloudMediaAdapter.getThumbnailUrl(this.#currentContentId)
      : null;
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
    const existing = SoundCloudMediaAdapter.#registry.get(this.#container);
    if (existing) {
      existing.refCount--;
      // If this was the last instance using this player/container, clean up the registry
      if (existing.refCount <= 0) {
        SoundCloudMediaAdapter.#registry.delete(this.#container);
      }
    }

    this.#widget = null;
    this.#masterEmitter = null;
    this.#currentContentId = null;
    this.#destroyed = true;
    super.destroy();
  }
}

/**
 * Asynchronously ensures the SoundCloud IFrame API is loaded and returns
 * the SoundCloud Player constructor and the current player state mapping.
 *
 * @returns {Promise<{ Widget: typeof SoundCloudWidget, Events: Record<string, string> }>}
 * An object containing the Player constructor and the current player state mapping.
 */
const getSC = async () => {
  await loadSoundCloudApi();
  return {
    Widget: getSCWidget(),
    Events: getPlayerStateValues(),
  };
};

export { SoundCloudMediaAdapter, getPlayerStateValues, getSCWidget, loadSoundCloudApi, getSC };
