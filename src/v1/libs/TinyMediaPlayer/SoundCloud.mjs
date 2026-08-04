/**
 * @typedef {import('../../basics/mediaContent.mjs').PictureDataType} PictureDataType
 * @typedef {import('../../basics/mediaContent.mjs').MediaContent<PictureDataType>} MediaContent
 * @typedef {import('./index.mjs').ContentTimeData} ContentTimeData
 * @typedef {import('./index.mjs').ContentData} ContentData
 *
 * @typedef {import('./docs/SoundCloudWidget.mjs').SoundObject} SoundObject
 * @typedef {import('./docs/SoundCloudWidget.mjs').MediaObject} MediaObject
 * @typedef {import('./docs/SoundCloudWidget.mjs').TranscodingObject} TranscodingObject
 * @typedef {import('./docs/SoundCloudWidget.mjs').PublisherObject} PublisherObject
 * @typedef {import('./docs/SoundCloudWidget.mjs').UserBadgesObject} UserBadgesObject
 * @typedef {import('./docs/SoundCloudWidget.mjs').CreatorSubscriptionObject} CreatorSubscriptionObject
 * @typedef {import('./docs/SoundCloudWidget.mjs').VisualsObject} VisualsObject
 * @typedef {import('./docs/SoundCloudWidget.mjs').VisualsObjectData} VisualsObjectData
 * @typedef {import('./docs/SoundCloudWidget.mjs').UserObject} UserObject
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
 * @property {null|number} [startTrack=null] - The track number to start playback from.
 * @property {string|null} [color=null] - The color of the widget's user interface.
 * @property {boolean} [buying=false] - Whether the "Buy" button is displayed in the widget.
 * @property {boolean} [sharing=true] - Whether the "Share" button is displayed in the widget.
 * @property {boolean} [download=true] - Whether the "Download" button is displayed in the widget.
 * @property {boolean} [showArtwork=true] - Whether the track's artwork is displayed.
 * @property {boolean} [showPlayCount=true] - Whether the play count is displayed.
 * @property {boolean} [showUser=true] - Whether the user/artist information is displayed.
 * @property {boolean} [singleActive=true] - Whether to restrict playback to a single active track.
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
const getEventValues = () => {
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

  #isReady = false;

  #loadedProgress = 0;

  get loadedProgress() {
    return this.#loadedProgress;
  }

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

  /** @type {boolean} */
  #isMuted = false;

  /** @type {number} */
  #preMuteVolume = 1.0;

  /** @type {boolean} */
  #isPaused = false;

  /** @type {boolean} */
  #isEnded = false;

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
   * Synchronously checks whether the SoundCloud media adapter is fully initialized and ready.
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
   * Asynchronously waits until the SoundCloud media adapter is fully initialized and ready.
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
   * Determines if the content is a valid SoundCloud URL or ID.
   * @param {MediaContent} content - The media content to evaluate.
   * @returns {boolean} True if the content is a SoundCloud link/ID, false otherwise.
   */
  static canHandle(content) {
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
   * Determines if the content is a valid SoundCloud URL or ID.
   * @param {MediaContent} content - The media content to evaluate.
   * @returns {boolean} True if the content is a SoundCloud link/ID, false otherwise.
   */
  canHandle(content) {
    checkDestroy(this.#destroyed);
    return SoundCloudMediaAdapter.canHandle(content);
  }

  /**
   * Plays the media content. If the player is already initialized with a different video,
   * it will load the new video automatically.
   *
   * Example: https://api.soundcloud.com/tracks/XXXXXXXXX (From SoundCloud Embed)
   * @param {MediaContent} content - The media content to play.
   * @returns {Promise<void>}
   * @throws {TypeError} If the content data is invalid.
   * @throws {Error} If the track fails to load within the timeout period.
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

    // If the video is different, load the new one
    if (this.#currentContentId !== targetId) {
      this.#currentContentId = targetId;

      await new Promise(async (resolve, reject) => {
        let timeout = false;
        // We set a time limit of 10 seconds to prevent await from locking the system
        const timeoutId = setTimeout(() => {
          timeout = true;
          reject(new Error('SoundCloud track load timeout: The track took too long to load.'));
        }, 10000);

        // Command to load the new song
        this.#widget?.load(`https://api.soundcloud.com/tracks/${targetId}`);
        await waitForTrue(() => true, 700);
        /** @type {Partial<SoundObject>} */
        let sound = {};

        // We registered the listener for the READY event before calling the load
        await waitForTrue(() => {
          this.#widget?.getCurrentSound((s) => {
            sound = s;
          });
          return String(sound.id) === targetId;
        }).then(() => {
          if (timeout) return;
          clearTimeout(timeoutId);
          if (this.#widget && typeof this.#widget.setVolume === 'function') {
            this.#widget.setVolume(this.#currentVolume * 100);
          }
          resolve(null);
        });
      });

      // After Promise is resolved (READY event received), we begin play
      this.#widget?.play();
    } else {
      // If it's the same song, we just play
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
      this.#widget.getCurrentSound(
        (audioData) => (this.#currentContentId = audioData ? (String(audioData.id) ?? null) : null),
      );
      this.#attachToMaster();
      return;
    }

    // Create new master emitter for this specific container
    const masterEmitter = new EventEmitter();
    return new Promise((resolve) => {
      let isReady = false;
      const WidgetClass = getSCWidget();
      this.#widget = new WidgetClass(this.#container);

      const eventSync = (/** @type {any} */ event, /** @type {string} */ eventName) => {
        if (!event) return;
        if (this.#isMuted)
          this.#widget?.getVolume((volume) => {
            if (this.#isMuted && volume > 0) {
              this.#isMuted = false;
              this.volume = this.#preMuteVolume;
            }
          });
        if (typeof event.currentPosition === 'number') this.#cachedPosition = event.currentPosition;
        if (typeof event.loadedProgress === 'number') this.#loadedProgress = event.loadedProgress;
        if (typeof event.soundId === 'number') this.#currentContentId = String(event.soundId);
      };

      // Resolve the initialization promise when the player is ready
      this.#widget.bind(SoundCloudMediaAdapter.Events.READY, (/** @type {any} */ event) => {
        eventSync(event, 'READY');
        this.#masterEmitter?.emit('onReady');
        if (isReady) return;
        isReady = true;
        this.#isReady = true;
        resolve();
      });

      this.#widget.bind(SoundCloudMediaAdapter.Events.PLAY, (/** @type {any} */ event) => {
        eventSync(event, 'PLAY');
        this.#isPaused = false;
        this.#isEnded = false;
        this.#masterEmitter?.emit('play');
      });

      this.#widget.bind(SoundCloudMediaAdapter.Events.PAUSE, (/** @type {any} */ event) => {
        eventSync(event, 'PAUSE');
        this.#isPaused = true;
        this.#isEnded = false;
        this.#masterEmitter?.emit('pause');
      });

      this.#widget.bind(SoundCloudMediaAdapter.Events.FINISH, (/** @type {any} */ event) => {
        eventSync(event, 'FINISH');
        this.#isPaused = false;
        this.#isEnded = true;
        this.#masterEmitter?.emit('ended');
      });

      this.#widget.bind(SoundCloudMediaAdapter.Events.LOAD_PROGRESS, (/** @type {any} */ event) => {
        eventSync(event, 'LOAD_PROGRESS');
      });

      this.#widget.bind(SoundCloudMediaAdapter.Events.PLAY_PROGRESS, (/** @type {any} */ event) => {
        eventSync(event, 'PLAY_PROGRESS');
        // SoundCloud uses callbacks for getters, so we update local cache
        this.#widget?.getDuration((dur) => {
          this.#cachedDuration = dur;
          this.#masterEmitter?.emit('timeupdate', this.getTimeData());
        });
      });

      this.#widget.bind(SoundCloudMediaAdapter.Events.SEEK, (/** @type {any} */ event) => {
        eventSync(event, 'SEEK');
        this.#masterEmitter?.emit('seek', event.currentPosition);
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
  }

  /**
   * Checks whether the player is currently muted.
   * @returns {boolean} True if muted, false otherwise.
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
    if (this.#isMuted) return;

    this.#isMuted = true;
    this.#preMuteVolume = this.#currentVolume;

    // We update the state directly to avoid the setter's logic
    // overwriting preMuteVolume during the transition.
    this.#currentVolume = 0;
    if (this.#widget && typeof this.#widget.setVolume === 'function') {
      this.#widget.setVolume(0);
    }
  }

  /**
   * Unmutes the current playback.
   * @returns {Promise<void>}
   */
  async unMute() {
    checkDestroy(this.#destroyed);
    if (!this.#isMuted) return;

    this.#isMuted = false;
    // This will trigger the 'set volume' logic which applies the restored volume
    this.volume = this.#preMuteVolume;
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
   * @returns {string|null} The thumbnail URL or null if no video is loaded.
   */
  getThumbnailUrl() {
    checkDestroy(this.#destroyed);
    return this.#currentContentId
      ? SoundCloudMediaAdapter.getThumbnailUrl(this.#currentContentId)
      : null;
  }

  /**
   * Retrieves the metadata of the currently loaded SoundCloud music, returning a structured
   * object containing details such as the audio ID, title, author, and duration.
   * @returns {Promise<ContentData>}
   */
  async getContentData() {
    return new Promise((resolve, reject) => {
      if (!this.#widget) reject(new Error('No music data available from the SoundCloud player.'));
      else
        this.#widget.getCurrentSound((sound) => {
          resolve({
            id: String(sound.id ?? ''),
            createdAt: String(sound.created_at ?? ''),
            artistId: String(sound.user_id ?? ''),
            artistName: String(sound.user?.full_name ?? ''),
            description: String(sound.description ?? ''),
            title: String(sound.label_name ?? ''),
            duration: Number(sound.duration ?? ''),
            avatar: String(sound.artwork_url ?? ''),
            url: String(sound.uri ?? ''),
          });
        });
    });
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
 * @returns {Promise<{ Widget: typeof SoundCloudWidget }>}
 * An object containing the Player constructor and the current player state mapping.
 */
const getSC = async () => {
  await loadSoundCloudApi();
  return {
    Widget: getSCWidget(),
  };
};

export { SoundCloudMediaAdapter, getEventValues, getSCWidget, loadSoundCloudApi, getSC };
