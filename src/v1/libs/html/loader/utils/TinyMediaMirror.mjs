/**
 * @fileoverview Registry of in-flight media downloads.
 *
 * Two loaders that request the same URL at the same time would normally open
 * two connections and decode the same picture twice. This registry lets the
 * second loader attach to the download that is already running, so the bytes
 * travel through the network exactly once and every consumer receives the very
 * same {@link Blob} instance.
 */

/**
 * Describes a single in-flight download.
 * @template {string} Name
 * @template {unknown[]} Args
 * @typedef {Object} MediaMirrorEntry
 * @property {string} key - The normalized registry key.
 * @property {string} src - The original source URL.
 * @property {number} startedAt - The epoch timestamp, in milliseconds, when the download started.
 * @property {number} mirrors - The number of loaders attached to this download.
 * @property {boolean} settled - Whether the download already produced a payload.
 * @property {number} sequence - The sequence number assigned to the next published event.
 * @property {MediaMirrorEvent<Name, Args>[]} events - Every event published so far, in order.
 * @property {Set<MediaMirrorSubscriber<Name, Args>>} subscribers - The loaders attached to this download.
 * @property {Promise<Blob>} promise - Resolves with the shared blob.
 * @property {(blob: Blob) => void} resolve - Resolves the shared promise.
 * @property {(error: Error) => void} reject - Rejects the shared promise.
 */

/**
 * A read-only snapshot of the registry counters.
 * @typedef {Object} MediaMirrorStats
 * @property {number} pending - The number of downloads currently in flight.
 * @property {number} mirrors - The total number of attached loaders.
 */

/**
 * A read-only snapshot of a single in-flight download.
 * @typedef {Object} MediaMirrorSnapshot
 * @property {string} key - The normalized registry key.
 * @property {string} src - The original source URL.
 * @property {number} startedAt - The epoch timestamp, in milliseconds, when the download started.
 * @property {number} mirrors - The number of loaders attached to this download.
 * @property {boolean} settled - Whether the download already produced a payload.
 */

/**
 * A single event captured from the leading loader.
 * @template {string} Name
 * @template {unknown[]} Args
 * @typedef {Object} MediaMirrorEvent
 * @property {number} seq - The zero-based position of the event in the stream.
 * @property {Name} name - The event name.
 * @property {Args} args - The arguments the event was emitted with.
 * @property {number} timestamp - The high resolution timestamp of the capture.
 */

/**
 * Handles a broadcast event.
 * @template {string} Name
 * @template {any} Args
 * @callback MediaMirrorSubscriber
 * @param {MediaMirrorEvent<Name, Args>} event - The published event.
 * @returns {void}
 */

/**
 * Deduplicates concurrent downloads that target the same URL.
 */
class TinyMediaMirror {
  /** @type {Map<string, MediaMirrorEntry<string, unknown[]>>} */
  static #pending = new Map();

  /**
   * The number of downloads currently in flight.
   * @returns {number} The number of registered downloads.
   */
  static get size() {
    return TinyMediaMirror.#pending.size;
  }

  /**
   * The key of every in-flight download.
   * @returns {string[]} A new array with the registered keys.
   */
  static get keys() {
    return Array.from(TinyMediaMirror.#pending.keys());
  }

  /**
   * A read-only snapshot of the registry counters.
   * @returns {MediaMirrorStats} The current counters.
   */
  static get stats() {
    let mirrors = 0;
    for (const entry of TinyMediaMirror.#pending.values()) {
      mirrors += entry.mirrors;
    }
    return { pending: TinyMediaMirror.#pending.size, mirrors };
  }

  /**
   * Checks whether a download is already in flight for the given key.
   * @param {string} key - The normalized registry key.
   * @returns {boolean} True when a download is in flight.
   */
  static has(key) {
    return TinyMediaMirror.#pending.has(key);
  }

  /**
   * Reads an in-flight download without attaching to it.
   * @param {string} key - The normalized registry key.
   * @returns {MediaMirrorEntry<string, unknown[]>|null} The shared entry, or null when nothing is in flight.
   */
  static get(key) {
    return TinyMediaMirror.#pending.get(key) ?? null;
  }

  /**
   * A read-only snapshot of every in-flight download.
   * @returns {MediaMirrorSnapshot[]} One record per in-flight download.
   */
  static entries() {
    return Array.from(TinyMediaMirror.#pending.values(), (entry) => ({
      key: entry.key,
      src: entry.src,
      startedAt: entry.startedAt,
      mirrors: entry.mirrors,
      settled: entry.settled,
    }));
  }

  /**
   * Registers a new in-flight download. When the key is already taken the
   * existing entry is returned, so a live download is never overwritten.
   * @param {string} key - The normalized registry key.
   * @param {string} src - The original source URL.
   * @returns {MediaMirrorEntry<string, unknown[]>} The registered entry.
   * @throws {TypeError} If `key` is not a string.
   * @throws {TypeError} If `src` is not a string.
   */
  static open(key, src) {
    if (typeof key !== 'string') {
      throw new TypeError('The "key" argument must be a string.');
    }
    if (typeof src !== 'string') {
      throw new TypeError('The "src" argument must be a string.');
    }
    const existing = TinyMediaMirror.#pending.get(key);
    if (existing) {
      return existing;
    }
    /** @type {MediaMirrorEntry<string, unknown[]>} */
    const entry = {
      key,
      src,
      startedAt: Date.now(),
      mirrors: 0,
      settled: false,
      sequence: 0,
      events: [],
      subscribers: new Set(),
      promise: /** @type {Promise<Blob>} */ (/** @type {unknown} */ (null)),
      resolve: () => {},
      reject: () => {},
    };
    entry.promise = new Promise((resolve, reject) => {
      entry.resolve = (blob) => {
        entry.settled = true;
        resolve(blob);
      };
      entry.reject = (error) => {
        entry.settled = true;
        reject(error);
      };
    });
    // A download without mirrors must never surface as an unhandled rejection.
    entry.promise.catch(() => {});
    TinyMediaMirror.#pending.set(key, entry);
    return entry;
  }

  /**
   * Attaches a new consumer to an in-flight download.
   * @param {string} key - The normalized registry key.
   * @returns {MediaMirrorEntry<string, unknown[]>|null} The shared entry, or null when nothing is in flight.
   */
  static attach(key) {
    const entry = TinyMediaMirror.#pending.get(key);
    if (!entry) {
      return null;
    }
    entry.mirrors += 1;
    return entry;
  }

  /**
   * Removes a finished download from the registry. A download that never
   * produced a payload rejects its waiters instead of hanging them forever.
   * @param {string} key - The normalized registry key.
   * @returns {boolean} True when an entry was removed.
   */
  static close(key) {
    const entry = TinyMediaMirror.#pending.get(key);
    if (!entry) {
      return false;
    }
    if (!entry.settled) {
      entry.reject(new Error(`The mirrored download for "${entry.src}" ended without a payload.`));
    }
    return TinyMediaMirror.#pending.delete(key);
  }

  /**
   * Rejects every in-flight download and empties the registry.
   * @returns {void}
   */
  static clear() {
    for (const entry of TinyMediaMirror.#pending.values()) {
      if (!entry.settled) {
        entry.reject(new Error('The mirror registry was cleared.'));
      }
    }
    TinyMediaMirror.#pending.clear();
  }

  /**
   * Broadcasts an event to every loader attached to an in-flight download. The
   * event is appended to the history so a loader that attaches later still
   * receives the complete stream, in its original order.
   * @param {string} key - The normalized registry key.
   * @param {string} name - The event name.
   * @param {unknown[]} args - The arguments the event was emitted with.
   * @returns {number} The number of subscribers that received the event.
   * @throws {TypeError} If `key` is not a string.
   * @throws {TypeError} If `name` is not a string.
   * @throws {TypeError} If `args` is not an array.
   */
  static publish(key, name, args) {
    if (typeof key !== 'string') {
      throw new TypeError('The "key" argument must be a string.');
    }
    if (typeof name !== 'string') {
      throw new TypeError('The "name" argument must be a string.');
    }
    if (!Array.isArray(args)) {
      throw new TypeError('The "args" argument must be an array.');
    }
    const entry = TinyMediaMirror.#pending.get(key);
    if (!entry) {
      return 0;
    }
    const event = { seq: entry.sequence, name, args, timestamp: performance.now() };
    entry.sequence += 1;
    entry.events.push(event);
    for (const subscriber of entry.subscribers) {
      subscriber(event);
    }
    return entry.subscribers.size;
  }

  /**
   * Attaches a subscriber to an in-flight download. The entire history is
   * replayed synchronously, in its original order, before the handler starts
   * receiving live events. Because JavaScript never preempts a running
   * function, no live event can slip between the replay and the subscription,
   * so the handler observes exactly the same sequence the leader produced.
   * @param {string} key - The normalized registry key.
   * @param {MediaMirrorSubscriber<string, unknown[]>} handler - The callback invoked for every event.
   * @returns {(() => void)|null} A function that detaches the subscriber, or null when nothing is in flight.
   * @throws {TypeError} If `handler` is not a function.
   */
  static subscribe(key, handler) {
    if (typeof handler !== 'function') {
      throw new TypeError('The "handler" argument must be a function.');
    }
    const entry = TinyMediaMirror.#pending.get(key);
    if (!entry) {
      return null;
    }
    const { events } = entry;
    for (let index = 0; index < events.length; index += 1) {
      handler(events[index]);
    }
    entry.subscribers.add(handler);
    return () => entry.subscribers.delete(handler);
  }

  /**
   * The ordered event history of an in-flight download. The array is live and
   * must be treated as read-only.
   * @param {string} key - The normalized registry key.
   * @returns {MediaMirrorEvent<string, unknown[]>[]} The captured events, oldest first.
   */
  static history(key) {
    return TinyMediaMirror.#pending.get(key)?.events ?? [];
  }
}

export default TinyMediaMirror;
