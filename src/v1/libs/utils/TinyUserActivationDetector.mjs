import TinyDebugger from '../tools/TinyDebugger.mjs';

/**
 * A playback that is waiting for the user activation.
 *
 * @callback PendingPlayback
 * @returns {void}
 */

/**
 * Pending playbacks indexed by their unique request key.
 *
 * @typedef {Map<string, PendingPlayback>} PendingPlaybackQueue
 */

/**
 * Configuration options for initializing the TinyUserActivationDetector instance.
 *
 * @typedef {Object} ActivationOptions
 * @property {boolean} [debugMode=false] - Whether to enable internal debug logging.
 * @property {boolean} [useLogColors=false] - Whether to enable log color support.
 * @property {Partial<Console>} [logger=console] - A custom logger object (must implement console methods).
 */

/**
 * Queues callbacks until the document reports a user activation.
 *
 * Browsers only allow certain APIs (media playback, fullscreen, clipboard,
 * sensors) to start after the visitor interacts with the page. When the action
 * is requested by something other than the visitor — a scroll position, a timer,
 * a route change — the call is silently rejected. This class holds those
 * requests and runs them in order as soon as the document is activated.
 *
 * The activation is read from `navigator.userActivation.hasBeenActive` instead
 * of the gesture events because it is sticky: a single interaction is enough for
 * the whole session, and an interaction that happens before the first request is
 * not lost.
 *
 * Requests are identified by a key, so a new request replaces a pending one with
 * the same key. The internal state is exposed through the
 * {@link TinyUserActivationDetector#size},
 * {@link TinyUserActivationDetector#autoKey},
 * {@link TinyUserActivationDetector#unlocked} and
 * {@link TinyUserActivationDetector#existsTime} getters.
 *
 * @example
 * const detector = new TinyUserActivationDetector({ debugMode: false });
 *
 * detector.whenReady(() => player.start(), 'main-action');
 */
class TinyUserActivationDetector extends TinyDebugger {
  /**
   * How often the user activation is checked, in milliseconds.
   *
   * @type {number}
   */
  static #POLL_INTERVAL = 100;

  /**
   * How often the user activation is checked, in milliseconds.
   *
   * @returns {number} The current polling interval.
   */
  static get pollInterval() {
    return TinyUserActivationDetector.#POLL_INTERVAL;
  }

  /**
   * Updates how often the user activation is checked.
   *
   * The new value is only used by the next scheduled check, so a running
   * instance picks it up on the following tick.
   *
   * @param {number} value - The new polling interval, in milliseconds.
   * @throws {TypeError} If the value is not a finite number.
   * @throws {RangeError} If the value is not greater than zero.
   */
  static set pollInterval(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new TypeError('pollInterval must be a finite number.');
    }
    if (value <= 0) {
      throw new RangeError('pollInterval must be greater than zero.');
    }
    TinyUserActivationDetector.#POLL_INTERVAL = value;
  }

  /**
   * Checks whether the document already received a user gesture.
   *
   * `navigator.userActivation` is the only reliable way to know if the page was
   * already activated (a back/forward navigation, a reload or a gesture that
   * happened before this module was imported, for example).
   *
   * @returns {boolean} `true` when the browser reports a previous activation, `false` otherwise or when the API is unavailable.
   */
  static hasUserActivation() {
    return typeof navigator !== 'undefined' && navigator.userActivation?.hasBeenActive === true;
  }

  /**
   * @param {ActivationOptions} [options={}] - Configuration options for the user activation.
   * @throws {TypeError} If `options` is not a plain object.
   * @throws {TypeError} If `options.debugMode` is not a boolean.
   * @throws {TypeError} If `options.useLogColors` is not a boolean.
   * @throws {TypeError} If `options.logger` is not a Console-compatible object.
   */
  constructor(options = {}) {
    if (options === null || typeof options !== 'object' || Array.isArray(options)) {
      throw new TypeError('options must be a plain object.');
    }

    const { debugMode = false, useLogColors = false, logger = console } = options;

    if (typeof debugMode !== 'boolean') {
      throw new TypeError('options.debugMode must be a boolean.');
    }
    if (typeof useLogColors !== 'boolean') {
      throw new TypeError('options.useLogColors must be a boolean.');
    }
    if (logger === null || typeof logger !== 'object') {
      throw new TypeError('options.logger must be a Console-compatible object.');
    }

    super({
      id: '[_main_class_TinyUserActivationDetector_reset_]',
      logger,
      debugMode,
      useLogColors,
    });
  }

  /**
   * Whether the browser already allows audio playback.
   *
   * A document without `navigator` (server side rendering) is treated as
   * unlocked, so every callback runs immediately.
   *
   * @type {boolean}
   */
  #unlocked = typeof navigator === 'undefined' || TinyUserActivationDetector.hasUserActivation();

  /**
   * Playbacks waiting for the user activation, indexed by their unique key.
   *
   * @type {PendingPlaybackQueue}
   */
  #queue = new Map();

  /**
   * Counter used to generate the automatic keys of the anonymous requests.
   *
   * @type {number}
   */
  #autoKey = 0;

  /**
   * Handle of the polling timer, or `undefined` when the polling is stopped.
   *
   * @type {ReturnType<typeof setTimeout> | undefined}
   */
  #timer;

  /**
   * Number of playbacks waiting for the user activation.
   *
   * @returns {number}
   */
  get size() {
    return this.#queue.size;
  }

  /**
   * Number of automatic keys already generated by {@link TinyUserActivationDetector#whenReady}.
   *
   * @returns {number}
   */
  get autoKey() {
    return this.#autoKey;
  }

  /**
   * Whether the browser already allows audio playback.
   *
   * @returns {boolean}
   */
  get unlocked() {
    return this.#unlocked;
  }

  /**
   * Whether the polling timer is currently scheduled.
   *
   * @returns {boolean}
   */
  get existsTime() {
    return !!this.#timer;
  }

  /**
   * Stops watching the user activation.
   *
   * The pending queue is preserved.
   *
   * @returns {void}
   */
  #stopWatching() {
    if (this.#timer === undefined) return;
    clearTimeout(this.#timer);
    this.#timer = undefined;
  }

  /**
   * Schedules the next user activation check.
   *
   * Does nothing when the timer is already scheduled or when the audio is
   * already unlocked.
   *
   * @returns {void}
   */
  #watch() {
    if (this.#timer !== undefined || this.#unlocked) return;

    this.#timer = setTimeout(() => {
      this.#timer = undefined;
      if (TinyUserActivationDetector.hasUserActivation()) this.unlock();
      else this.#watch();
    }, TinyUserActivationDetector.#POLL_INTERVAL);
  }

  /**
   * Runs every pending callback and empties the queue.
   *
   * Every callback is executed even when a previous one throws. When the loop
   * finishes, the collected errors are thrown so they are never swallowed.
   *
   * @returns {void}
   * @throws {*} The error thrown by the only failing callback.
   * @throws {AggregateError} When more than one callback throws.
   */
  flush() {
    const pending = this.#queue;
    this.#queue = new Map();
    const errors = [];

    for (const callback of pending.values()) {
      try {
        callback();
      } catch (err) {
        errors.push(err);
      }
    }

    if (errors.length === 1) throw errors[0];
    if (errors.length > 1) {
      throw new AggregateError(errors, `${errors.length} pending callbacks failed.`);
    }
  }

  /**
   * Marks the audio as unlocked and runs everything that was waiting for it.
   *
   * Calling it more than once has no effect.
   *
   * @returns {void}
   */
  unlock() {
    if (this.#unlocked) return;

    this.#unlocked = true;
    this.#stopWatching();
    this.flush();
  }

  /**
   * Runs the callback as soon as the audio is allowed to play.
   *
   * A `key` makes the request unique: a new callback with a key that is still
   * waiting replaces the previous one, so scrolling around before the first
   * interaction does not queue the same playback twice.
   *
   * @param {PendingPlayback} callback - Playback to start.
   * @param {string} [key] - Unique key of the request. When omitted, an automatic key is generated.
   * @returns {string} The key of the request, or an empty string when the callback ran immediately.
   * @throws {TypeError} If `callback` is not a function.
   * @throws {TypeError} If `key` is provided and is not a non-empty string.
   *
   * @example
   * detector.whenReady(() => audio.play(), 'chapter-1');
   */
  whenReady(callback, key) {
    if (typeof callback !== 'function') {
      throw new TypeError('callback must be a function.');
    }
    if (key !== undefined && typeof key !== 'string') {
      throw new TypeError('key must be a string when provided.');
    }
    if (key === '') {
      throw new TypeError('key cannot be an empty string.');
    }

    // The visitor may have interacted with the page before this request (or
    // before this module was even imported). The activation is sticky, so a
    // single interaction is enough for the whole session.
    if (!this.#unlocked && TinyUserActivationDetector.hasUserActivation()) this.unlock();

    if (this.#unlocked) {
      callback();
      return '';
    }

    const keyResult = key ?? `auto-${this.#autoKey++}`;
    this.#queue.set(keyResult, callback);
    this.#watch();
    return keyResult;
  }

  /**
   * Discards a pending request.
   *
   * @param {string} key - Key returned by {@link TinyUserActivationDetector#whenReady}.
   * @returns {void}
   * @throws {TypeError} If `key` is not a string.
   */
  cancel(key) {
    if (typeof key !== 'string') {
      throw new TypeError('key must be a string.');
    }

    this.#queue.delete(key);
  }

  /**
   * Discards every pending request and stops watching the user activation.
   *
   * The automatic key counter is preserved.
   *
   * @returns {void}
   */
  clear() {
    this.#queue.clear();
    this.#stopWatching();
  }

  /**
   * Restores the instance to its initial state.
   *
   * The `unlocked` state is intentionally preserved, because a user activation
   * cannot be revoked by the page.
   *
   * @returns {void}
   */
  reset() {
    this.clear();
    this.#autoKey = 0;
  }
}

export default TinyUserActivationDetector;
