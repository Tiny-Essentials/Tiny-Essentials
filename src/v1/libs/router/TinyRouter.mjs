import * as SegmentExtractor from '../../regexp/SegmentExtractor.mjs';
import TinyDebugger from '../tools/TinyDebugger.mjs';

const { makeSegmentExtractor, segmentExtractorV1 } = SegmentExtractor;

/**
 * @typedef {Object} SegExResultExtra
 * @property {string} [pattern] - Stored to allow removal by string.
 */

/**
 * @typedef {Object} AddRouteOptionsWithFunction
 * @property {import('../../regexp/SegmentExtractor.mjs').SegExFunction} callback
 * @property {string} pattern - Stored to allow removal by string.
 */

/**
 * @typedef {import('../../regexp/SegmentExtractor.mjs').SegExResult & SegExResultExtra} SegExResult
 */

/**
 * @typedef {Object} AddRouteOptions
 * @property {string} pattern - Stored to allow removal by string.
 * @property {string|RegExp} searchValue - The search pattern (string or RegExp) used to identify dynamic segments.
 * @property {import('../../regexp/SegmentExtractor.mjs').SegExReplacer} replaceValue - The function defining how to transform a segment into a capture group.
 * @property {import('../../regexp/SegmentExtractor.mjs').SegExErrorConfig} errorConfig - Optional configuration to customize error messages.
 */

/**
 * @typedef {Object} RouteMatch
 * @property {string} path - The matched URL path.
 * @property {Record<string, string>} params - The dynamic parameters extracted from the path.
 * @property {URLSearchParams} query - The URL search parameters.
 */

/**
 * @typedef {Object} RouteNotFoundData
 * @property {string} path - The path that failed to match.
 * @property {URLSearchParams} query - The URL search parameters.
 */

/**
 * @callback RouteCallback
 * @param {RouteMatch} match - The object containing path, params, and query.
 * @returns {Promise<void>|void}
 */

/**
 * @callback RouteNotFoundCallback
 * @param {RouteNotFoundData} match - The object containing path and query.
 * @returns {void}
 */

/**
 * @typedef {Object} RouterOptions
 * @property {boolean} [debugMode=false] - Whether to enable internal debug logging.
 * @property {boolean} [useLogColors=false] - Whether to enable log color support.
 * @property {boolean} [detectHistoryChange=true] - Whether to detect if the history navigation actually changed the URL.
 * @property {Partial<Console>} [logger=console] - A custom logger object (must implement console methods).
 * @property {RouteCallback} [onRouteChanged] - Callback executed whenever the route changes.
 * @property {RouteNotFoundCallback} [onRouteNotFound] - Callback executed when no route matches.
 */

/**
 * @typedef {Object} RouteDefinition
 * @property {SegExResult} segmentExtractor
 * @property {RouteCallback} callback - The function to execute on match.
 */

/**
 * A lightweight, framework-agnostic router for managing client-side navigation.
 */
class TinyRouter extends TinyDebugger {
  static SegmentExtractor = SegmentExtractor;
  /** @type {RouteDefinition[]} */
  #routes = [];
  /** @type {RouteCallback} */
  #onRouteChanged;
  /** @type {RouteNotFoundCallback} */
  #onRouteNotFound;
  /** @type {boolean} */
  #started = false;
  /** @type {EventListenerOrEventListenerObject} */
  #popstateHandler;
  /** @type {boolean} */
  #detectHistoryChange;

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

    super({
      id: '[_blue_TinyRouter_reset_]',
      logger: options.logger ?? console,
      debugMode: options.debugMode ?? false,
      useLogColors: options.useLogColors ?? false,
    });

    this.#onRouteChanged = options.onRouteChanged || (() => {});
    this.#onRouteNotFound = options.onRouteNotFound || (() => {});
    this.#detectHistoryChange = options.detectHistoryChange ?? true;

    // Bind the popstate event and store the reference for later removal
    this.#popstateHandler = this.#resolve.bind(this);
    window.addEventListener('popstate', this.#popstateHandler);
  }

  /** @returns {boolean} */
  get detectHistoryChange() {
    return this.#detectHistoryChange;
  }

  /** @param {boolean} value */
  set detectHistoryChange(value) {
    if (typeof value !== 'boolean') throw new TypeError('detectHistoryChange must be a boolean.');
    this.#detectHistoryChange = value;
  }

  /** @returns {RouteCallback} */
  get onRouteChanged() {
    return this.#onRouteChanged;
  }

  /** @param {RouteCallback} value */
  set onRouteChanged(value) {
    if (typeof value !== 'function') throw new TypeError('onRouteChanged must be a function.');
    this.#onRouteChanged = value;
  }

  /** @returns {RouteNotFoundCallback} */
  get onRouteNotFound() {
    return this.#onRouteNotFound;
  }

  /** @param {RouteNotFoundCallback} value */
  set onRouteNotFound(value) {
    if (typeof value !== 'function') throw new TypeError('onRouteNotFound must be a function.');
    this.#onRouteNotFound = value;
  }

  /** @returns {boolean} */
  get started() {
    return this.#started;
  }

  /**
   * Returns the current number of registered routes.
   * @returns {number}
   */
  get size() {
    return this.#routes.length;
  }

  /**
   * Returns an array of all registered path patterns.
   * @returns {string[]} An array of path pattern strings.
   */
  get routes() {
    return this.#routes.map((route) => route.segmentExtractor.pattern ?? '');
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
    // Prevent redundant navigation if the path is the same
    if (window.location.pathname + window.location.search === path) return;

    window.history.pushState(state, '', path);
    await this.#resolve();
    this.log('info', `Navigated to: ${path}`);
  }

  /**
   * Triggers the initial route resolution (for deep linking on page load).
   * @returns {Promise<void>}
   * @throws {Error} If the router has already been started.
   */
  async start() {
    if (this.#started) throw new Error('Router has already been started.');
    this.#started = true;
    await this.#resolve();
    this.emit('RouterStarted');
    this.log('info', 'Router started successfully.');
  }

  /**
   * Cleans up the router, removes event listeners, and stops the router.
   */
  stop() {
    window.removeEventListener('popstate', this.#popstateHandler);
    this.#started = false;
    this.clear();
    this.emit('RouterDestroyed');
    this.log('info', 'Router stopped and event listeners removed.');
  }

  /**
   * Navigates to a specific number of steps in the browser's history.
   * @param {number} delta - The number of steps to move (positive for forward, negative for backward).
   * @returns {Promise<boolean>} A promise that resolves to true if the URL changed, false otherwise.
   * @throws {TypeError} If delta is not an integer.
   */
  async go(delta) {
    if (!this.#started) {
      this.log('warn', 'Attempted to navigate while the router is stopped.');
      return false;
    }

    if (!Number.isInteger(delta)) {
      throw new TypeError('The "delta" parameter must be an integer.');
    }

    if (!this.#detectHistoryChange) {
      window.history.go(delta);
      this.log('info', `Navigation command: go(${delta}) (detection disabled)`);
      return true;
    }

    const oldUrl = window.location.pathname + window.location.search;

    return new Promise((resolve) => {
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
    });
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
   * Internal method to match the current URL against registered routes.
   * @returns {Promise<void>}
   */
  async #resolve() {
    const path = window.location.pathname;
    const search = window.location.search;
    const query = new URLSearchParams(search);

    for (const route of this.#routes) {
      const { params, match } = route.segmentExtractor.exec(path);

      if (match) {
        const matchResult = { path, params, query };
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
   * Removes all registered routes.
   */
  clear() {
    this.#routes = [];
    this.emit('RoutesCleared');
    this.log('info', 'All routes have been cleared.');
  }
}

export default TinyRouter;
