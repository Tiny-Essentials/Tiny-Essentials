import * as SegmentExtractor from '../../regexp/SegmentExtractor.mjs';
import TinyDebugger from '../tools/TinyDebugger.mjs';
import TinyPromiseQueue from '../utils/TinyPromiseQueue.mjs';
import { createCheckDestroyed } from '../utils/tools.mjs';

const checkDestroy = createCheckDestroyed('TinyRouter');

const { makeSegmentExtractor, segmentExtractorV1 } = SegmentExtractor;

/**
 * Represents a single entry in the navigation history.
 * @typedef {Object} RouterHistoryEntry
 * @property {string} path - The URL path recorded in history.
 * @property {number} timestamp - The Unix timestamp when this path was visited.
 */

/**
 * Additional metadata stored alongside segment extraction results.
 * @typedef {Object} SegExResultExtra
 * @property {string} [pattern] - Stored to allow removal by string.
 */

/**
 * Configuration for registering a route using a function to generate the pattern.
 * @typedef {Object} AddRouteOptionsWithFunction
 * @property {import('../../regexp/SegmentExtractor.mjs').SegExFunction} callback - A function used to process the pattern.
 * @property {string} pattern - Stored to allow removal by string.
 */

/**
 * The result of a segment extraction combined with additional metadata.
 * @typedef {import('../../regexp/SegmentExtractor.mjs').SegExResult & SegExResultExtra} SegExResult
 */

/**
 * Configuration for registering a route using a custom segment extraction pattern.
 * @typedef {Object} AddRouteOptions
 * @property {string} pattern - Stored to allow removal by string.
 * @property {string|RegExp} searchValue - The search pattern (string or RegExp) used to identify dynamic segments.
 * @property {import('../../regexp/SegmentExtractor.mjs').SegExReplacer} replaceValue - The function defining how to transform a segment into a capture group.
 * @property {import('../../regexp/SegmentExtractor.mjs').SegExErrorConfig} errorConfig - Optional configuration to customize error messages.
 */

/**
 * Data structure containing the results of a successful route match.
 * @typedef {Object} RouteMatch
 * @property {string} path - The matched URL path.
 * @property {Record<string, string>} params - The dynamic parameters extracted from the path.
 * @property {URLSearchParams} query - The URL search parameters.
 */

/**
 * Data structure containing details when no route matches the current URL.
 * @typedef {Object} RouteNotFoundData
 * @property {string} path - The path that failed to match.
 * @property {URLSearchParams} query - The URL search parameters.
 */

/**
 * A function executed when a route is successfully matched.
 * @callback RouteCallback
 * @param {RouteMatch} match - The object containing path, params, and query.
 * @returns {Promise<void>|void} - A promise or void indicating completion.
 */

/**
 * A function executed when no route matches the current URL.
 * @callback RouteNotFoundCallback
 * @param {RouteNotFoundData} match - The object containing path and query.
 * @returns {void}
 */

/**
 * Configuration options for initializing the TinyRouter instance.
 * @typedef {Object} RouterOptions
 * @property {boolean} [debugMode=false] - Whether to enable internal debug logging.
 * @property {boolean} [useLogColors=false] - Whether to enable log color support.
 * @property {boolean} [detectHistoryChange=true] - Whether to detect if the history navigation actually changed the URL.
 * @property {Partial<Console>} [logger=console] - A custom logger object (must implement console methods).
 * @property {RouteCallback} [onRouteChanged] - Callback executed whenever the route changes.
 * @property {RouteNotFoundCallback} [onRouteNotFound] - Callback executed when no route matches.
 * @property {number} [historyLimit=0] - Maximum number of history entries. Use -1 for unlimited, or 0 to disable history.
 */

/**
 * A definition of a route, combining its pattern extractor and its execution callback.
 * @typedef {Object} RouteDefinition
 * @property {SegExResult} segmentExtractor - The extraction logic and metadata used to match the path and retrieve parameters.
 * @property {RouteCallback} callback - The function to execute on match.
 */

/**
 * A lightweight, framework-agnostic router for managing client-side navigation.
 */
class TinyRouter extends TinyDebugger {
  /** The SegmentExtractor module. */
  static SegmentExtractor = SegmentExtractor;
  /** @type {RouteDefinition[]} The collection of registered routes. */
  #routes = [];
  /** @type {RouteCallback} The callback function triggered on route changes. */
  #onRouteChanged;
  /** @type {RouteNotFoundCallback} The callback function triggered when no route matches. */
  #onRouteNotFound;
  /** @type {boolean} Indicates whether the router has been started. */
  #started = false;
  /** @type {EventListenerOrEventListenerObject} The event handler for the popstate event. */
  #popstateHandler;
  /** @type {boolean} Flag to determine if history navigation changes should be detected. */
  #detectHistoryChange;
  /** @type {RouterHistoryEntry[]} The internal record of visited paths. */
  #history = [];
  /** @type {number} Maximum number of entries to keep in history. */
  #historyLimit;
  /** @type {number} Current position index in the internal history. */
  #historyIndex = -1;
  /** @type {TinyPromiseQueue} A promise queue used to handle asynchronous routing operations sequentially. */
  #queue = new TinyPromiseQueue();
  /** @type {boolean} A flag indicating if the router instance has been destroyed. */
  #isDestroyed = false;

  /**
   * @param {RouterOptions} [options={}] - Configuration options for the router.
   * @throws {TypeError} If options is not an object or if the logger lacks required methods.
   */
  constructor(options = {}) {
    if (typeof options !== 'object' || options === null) {
      throw new TypeError('Options must be a non-null object.');
    }
    if (
      typeof options.detectHistoryChange !== 'undefined' &&
      typeof options.detectHistoryChange !== 'boolean'
    )
      throw new TypeError('detectHistoryChange must be a boolean.');
    if (
      typeof options.onRouteChanged !== 'undefined' &&
      typeof options.onRouteChanged !== 'function'
    )
      throw new TypeError('onRouteChanged must be a function.');
    if (
      typeof options.onRouteNotFound !== 'undefined' &&
      typeof options.onRouteNotFound !== 'function'
    )
      throw new TypeError('onRouteNotFound must be a function.');
    if (
      typeof options.historyLimit !== 'undefined' &&
      (!Number.isInteger(options.historyLimit) || options.historyLimit < -1)
    )
      throw new TypeError('historyLimit must be an integer and greater than or equal to -1.');

    super({
      id: '[_blue_TinyRouter_reset_]',
      logger: options.logger ?? console,
      debugMode: options.debugMode ?? false,
      useLogColors: options.useLogColors ?? false,
    });

    this.#onRouteChanged = options.onRouteChanged || (() => {});
    this.#onRouteNotFound = options.onRouteNotFound || (() => {});
    this.#detectHistoryChange = options.detectHistoryChange ?? true;
    this.#historyIndex = -1;

    // Initialize history limit and handle the "0" (disabled) case
    this.#historyLimit = options.historyLimit ?? 0;
    this.#popstateHandler = this.#resolve.bind(this);
  }

  /** @returns {boolean} Returns whether the router instance has been destroyed. */
  get isDestroyed() {
    return this.#isDestroyed;
  }

  /** @returns {number} Returns the current position in history. */
  get historyIndex() {
    checkDestroy(this.#isDestroyed);
    return this.#historyIndex;
  }

  /** @returns {number} Returns the maximum number of history entries allowed. */
  get historyLimit() {
    checkDestroy(this.#isDestroyed);
    return this.#historyLimit;
  }

  /** @returns {boolean} Returns whether the router detects changes in history navigation. */
  get detectHistoryChange() {
    checkDestroy(this.#isDestroyed);
    return this.#detectHistoryChange;
  }

  /** @param {boolean} value Sets whether the router detects changes in history navigation. */
  set detectHistoryChange(value) {
    checkDestroy(this.#isDestroyed);
    if (typeof value !== 'boolean') throw new TypeError('detectHistoryChange must be a boolean.');
    this.#detectHistoryChange = value;
  }

  /** @returns {RouteCallback} Returns the callback function for route changes. */
  get onRouteChanged() {
    checkDestroy(this.#isDestroyed);
    return this.#onRouteChanged;
  }

  /** @param {RouteCallback} value Sets the callback function for route changes. */
  set onRouteChanged(value) {
    checkDestroy(this.#isDestroyed);
    if (typeof value !== 'function') throw new TypeError('onRouteChanged must be a function.');
    this.#onRouteChanged = value;
  }

  /** @returns {RouteNotFoundCallback} Returns the callback function for unmatched routes. */
  get onRouteNotFound() {
    checkDestroy(this.#isDestroyed);
    return this.#onRouteNotFound;
  }

  /** @param {RouteNotFoundCallback} value Sets the callback function for unmatched routes. */
  set onRouteNotFound(value) {
    checkDestroy(this.#isDestroyed);
    if (typeof value !== 'function') throw new TypeError('onRouteNotFound must be a function.');
    this.#onRouteNotFound = value;
  }

  /** @returns {boolean} Returns whether the router is currently active. */
  get started() {
    checkDestroy(this.#isDestroyed);
    return this.#started;
  }

  /**
   * Returns the current number of registered routes.
   * @returns {number}
   */
  get size() {
    checkDestroy(this.#isDestroyed);
    return this.#routes.length;
  }

  /**
   * Returns an array of all registered path patterns.
   * @returns {string[]} An array of path pattern strings.
   */
  get routes() {
    checkDestroy(this.#isDestroyed);
    return this.#routes.map((route) => route.segmentExtractor.pattern ?? '');
  }

  /**
   * Returns a copy of the current navigation history.
   * @returns {RouterHistoryEntry[]} An array of history entries.
   */
  get history() {
    checkDestroy(this.#isDestroyed);
    return this.#history.map((i) => ({ ...i }));
  }

  /**
   * Imports and validates a history log to restore previous navigation state.
   * @param {RouterHistoryEntry[]} historyData - The array of history entries to import.
   * @throws {TypeError} If historyData is not an array or if any entry is invalid.
   */
  set history(historyData) {
    checkDestroy(this.#isDestroyed);
    if (!Array.isArray(historyData)) {
      throw new TypeError('History data must be an array.');
    }

    // Deep validation of every entry
    for (const entry of historyData) {
      if (typeof entry !== 'object' || entry === null) {
        throw new TypeError('Each history entry must be an object.');
      }
      if (typeof entry.path !== 'string') {
        throw new TypeError('Each history entry must have a string "path" property.');
      }
      if (typeof entry.timestamp !== 'number') {
        throw new TypeError('Each history entry must have a number "timestamp" property.');
      }
    }

    this.#history = historyData.map((i) => ({ ...i }));
    this.log('info', 'History has been successfully imported.');
  }

  /**
   * Registers a new route pattern.
   * @param {string | AddRouteOptions | AddRouteOptionsWithFunction} patternOrOptions -
   *    A path pattern string (e.g., '/user/:id') OR a configuration object for custom regex.
   * @param {RouteCallback} callback - Function to execute when this route is matched.
   * @throws {TypeError} If arguments are invalid.
   * @throws {Error} If the route pattern is already registered.
   */
  add(patternOrOptions, callback) {
    checkDestroy(this.#isDestroyed);
    /** @type {SegExResult} */
    // @ts-ignore
    let se = {};

    // 1. Handle String Input (Legacy/Simple Mode)
    if (typeof patternOrOptions === 'string') {
      se = segmentExtractorV1(patternOrOptions);
      se.pattern = patternOrOptions;
      // 2. Handle Object Input (Advanced/Custom Regex Mode)
    } else if (typeof patternOrOptions === 'object' && patternOrOptions !== null) {
      // @ts-ignore
      if (typeof patternOrOptions.callback === 'function') {
        /** @type {AddRouteOptionsWithFunction} */
        // @ts-ignore
        const options = patternOrOptions;
        options.callback(options.pattern);
      } else {
        /** @type {AddRouteOptions} */
        // @ts-ignore
        const options = patternOrOptions;
        se = makeSegmentExtractor(
          options.searchValue,
          options.replaceValue,
          options.errorConfig,
        )(options.pattern);
      }
      se.pattern = patternOrOptions.pattern;
    } else {
      throw new TypeError(
        'The first argument must be a string (e.g., "/user/:id") or an object of SegmentExtractor maker.',
      );
    }

    // 3. Callback Validation
    if (typeof callback !== 'function') {
      throw new TypeError('The callback must be a function.');
    }

    // 4. Prevent duplicate route registration
    if (this.has(se.pattern)) {
      throw new Error(`Route with pattern "${se.pattern}" is already registered.`);
    }

    // 5. Final Registration
    this.#routes.push({ segmentExtractor: se, callback });
    this.emit('RouteAdded', se.pattern);
    this.log('info', `New route registered: ${se.pattern}`);
  }

  /**
   * Removes a registered route by its original pattern string.
   * @param {string} pathPattern - The pattern to remove.
   * @throws {TypeError} If pathPattern is not a string.
   */
  remove(pathPattern) {
    checkDestroy(this.#isDestroyed);
    if (typeof pathPattern !== 'string') throw new TypeError('pathPattern must be a string.');

    const initialLength = this.#routes.length;
    this.#routes = this.#routes.filter((route) => route.segmentExtractor.pattern !== pathPattern);

    if (this.#routes.length === initialLength) {
      this.log('warn', `Attempted to remove non-existent route: ${pathPattern}`);
    } else {
      this.emit('RouteRemoved', pathPattern);
      this.log('info', `Route removed: ${pathPattern}`);
    }
  }

  /**
   * Checks if a route pattern is already registered.
   * @param {string} pathPattern - The pattern to check.
   * @returns {boolean} True if the route exists, false otherwise.
   * @throws {TypeError} If pathPattern is not a string.
   */
  has(pathPattern) {
    checkDestroy(this.#isDestroyed);
    if (typeof pathPattern !== 'string') throw new TypeError('pathPattern must be a string.');
    return this.#routes.some((route) => route.segmentExtractor.pattern === pathPattern);
  }

  /**
   * Navigates to a specific path programmatically.
   * @param {string | URL | null | undefined} path - The target path.
   * @param {any} [state={}] - Optional state object to associate with history.
   * @returns {Promise<void>}
   * @throws {TypeError} If path is not a string or state is not an object.
   */
  async navigate(path, state = {}) {
    checkDestroy(this.#isDestroyed);
    // Prevent redundant navigation if the path is the same
    if (window.location.pathname + window.location.search === path) return;

    window.history.pushState(state, '', path);
    await this.#queue.enqueue(() => this.#resolve());
    this.log('info', `Navigated to: ${path}`);
  }

  /**
   * Triggers the initial route resolution (for deep linking on page load).
   * @returns {Promise<void>}
   * @throws {Error} If the router has already been started.
   */
  start() {
    if (this.#started)
      return new Promise((resolve, reject) =>
        reject(new Error('Router has already been started.')),
      );
    // Wrapped handler to synchronize the internal index when popstate is triggered by the browser
    this.#popstateHandler = () => {
      const path = window.location.pathname;
      if (this.#historyLimit !== 0) {
        const index = this.#history.findIndex((h) => h.path === path);
        if (index !== -1) {
          this.#historyIndex = index;
        }
      }
      return this.#resolve();
    };

    window.addEventListener('popstate', this.#popstateHandler);
    this.#started = true;
    return this.#queue.enqueue(
      () =>
        new Promise((resolve, reject) => {
          let err;
          try {
            checkDestroy(this.#isDestroyed);
          } catch (error) {
            err = error;
          }
          if (err) return reject(err);

          this.#resolve()
            .then(() => {
              this.emit('RouterStarted');
              this.log('info', 'Router started successfully.');
              resolve();
            })
            .catch(reject);
        }),
    );
  }

  /**
   * Cleans up the router, removes event listeners, and stops the router.
   */
  stop() {
    checkDestroy(this.#isDestroyed);
    window.removeEventListener('popstate', this.#popstateHandler);
    this.#started = false;
    this.clearAll();
    this.emit('RouterStopped');
    this.log('info', 'Router stopped and event listeners removed.');
  }

  /**
   * Navigates to a specific number of steps in the browser's history.
   * @param {number} delta - The number of steps to move (positive for forward, negative for backward).
   * @returns {Promise<boolean>} A promise that resolves to true if the URL changed, false otherwise.
   * @throws {TypeError} If delta is not an integer.
   */
  async go(delta) {
    checkDestroy(this.#isDestroyed);
    if (!this.#started) {
      this.log('warn', 'Attempted to navigate while the router is stopped.');
      return false;
    }

    if (!Number.isInteger(delta)) {
      throw new TypeError('The "delta" parameter must be an integer.');
    }

    // If history limit is active, navigate using the internal cache
    if (this.#historyLimit !== 0) {
      const newIndex = this.#historyIndex + delta;
      if (newIndex >= 0 && newIndex < this.#history.length) {
        const targetPath = this.#history[newIndex].path;
        window.history.pushState(null, '', targetPath);
        await this.#queue.enqueue(() => this.#resolve());
        return true;
      }
      return false;
    }

    // Native behavior when historyLimit is 0
    if (!this.#detectHistoryChange) {
      window.history.go(delta);
      this.log('info', `Navigation command: go(${delta}) (detection disabled)`);
      return true;
    }

    const oldUrl = window.location.pathname + window.location.search;

    return this.#queue.enqueue(
      () =>
        new Promise((resolve) => {
          // We use a temporary handler to detect the 'popstate' event
          const handler = () => {
            window.removeEventListener('popstate', handler);
            const newUrl = window.location.pathname + window.location.search;
            // Returns true if the URL actually changed
            resolve(oldUrl !== newUrl);
          };

          window.addEventListener('popstate', handler);

          // Safety mechanism: If 'popstate' is not triggered (e.g., no history to move to),
          // we wait for a very short time and then check if the URL changed anyway.
          setTimeout(() => {
            window.removeEventListener('popstate', handler);
            const currentUrl = window.location.pathname + window.location.search;
            resolve(oldUrl !== currentUrl);
          }, 100);

          window.history.go(delta);
          this.log('info', `Navigation command: go(${delta})`);
        }),
    );
  }

  /**
   * Navigates to the previous entry in the browser's history stack.
   * @returns {Promise<boolean>} A promise that resolves to true if the URL changed, false otherwise.
   */
  async back() {
    return this.go(-1);
  }

  /**
   * Navigates to the next entry in the browser's history stack.
   * @returns {Promise<boolean>} A promise that resolves to true if the URL changed, false otherwise.
   */
  async forward() {
    return this.go(1);
  }

  /**
   * Internal method to record a successful navigation.
   * @param {string} path - The path to record.
   */
  #recordHistory(path) {
    checkDestroy(this.#isDestroyed);
    // If limit is 0, the feature is disabled; do nothing.
    if (this.#historyLimit === 0) return;

    // If we are already at the current path (e.g., via go() or popstate), do not add a duplicate
    if (this.#historyIndex >= 0 && this.#history[this.#historyIndex].path === path) {
      return;
    }

    // Branching Logic: If we are in the middle of the history and a new route is opened,
    // remove all entries ahead of the current position.
    if (this.#historyIndex >= 0) {
      this.#history = this.#history.slice(0, this.#historyIndex + 1);
    }

    this.#history.push({ path, timestamp: Date.now() });
    this.#historyIndex++;

    // Maintain the maximum allowed size for the cache
    if (this.#historyLimit > 0 && this.#history.length > this.#historyLimit) {
      this.#history.shift(); // Removes the oldest entry (first element)
      this.#historyIndex--;
    }
    this.emit('HistoryRecorded', { ...this.#history[this.#historyIndex] });
  }

  /**
   * Internal method to match the current URL against registered routes.
   * @returns {Promise<void>}
   */
  async #resolve() {
    checkDestroy(this.#isDestroyed);
    const path = window.location.pathname;
    const search = window.location.search;
    const query = new URLSearchParams(search);

    for (const route of this.#routes) {
      const { params, match } = route.segmentExtractor.exec(path);

      if (match) {
        const matchResult = { path, params, query };

        // Record the successful navigation in our private history
        this.#recordHistory(path);

        // Execute the route's specific callback
        this.emit('BeforeRouteChanged', matchResult);
        await route.callback(matchResult);

        // Notify the global listener
        this.#onRouteChanged(matchResult);
        this.emit('AfterRouteChanged', matchResult);
        this.log('info', `Route matched: ${path}`);
        return;
      }
    }

    // If no route matches, you could implement a 404 logic here
    const matchResult = { path, query };
    this.#onRouteNotFound(matchResult);
    this.emit('RouteNotFound', matchResult);
    this.log('warn', `No route matched the current URL: ${path}`);
  }

  /**
   * Removes a specific entry from the navigation history by its index.
   * @param {number} index - The index of the entry to remove.
   * @throws {TypeError} If index is not an integer.
   * @throws {RangeError} If the index is out of bounds.
   */
  removeHistoryEntry(index) {
    checkDestroy(this.#isDestroyed);
    if (!Number.isInteger(index)) {
      throw new TypeError('The index must be an integer.');
    }
    if (index < 0 || index >= this.#history.length) {
      throw new RangeError('The provided index is out of bounds.');
    }

    this.#history.splice(index, 1);
    this.emit('HistoryEntryRemoved', index);
    this.log('info', `History entry at index ${index} was removed.`);
  }

  /**
   * Clears all entries from the navigation history.
   */
  clearHistory() {
    checkDestroy(this.#isDestroyed);
    this.#history = [];
    this.emit('HistoryCleared');
    this.log('info', 'Navigation history has been cleared.');
  }

  /**
   * Removes all registered routes.
   */
  clear() {
    checkDestroy(this.#isDestroyed);
    this.#routes = [];
    this.emit('RoutesCleared');
    this.log('info', 'All routes have been cleared.');
  }

  /**
   * Removes all instance data.
   */
  clearAll() {
    checkDestroy(this.#isDestroyed);
    this.clear();
    this.clearHistory();
  }

  /**
   * Destroy the instance.
   */
  destroy() {
    if (this.#isDestroyed) return;
    this.stop();
    this.#isDestroyed = true;
  }
}

export default TinyRouter;
