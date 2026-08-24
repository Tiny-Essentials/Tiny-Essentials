import TinyDebugger from '../tools/TinyDebugger.mjs';

/**
 * @typedef {Object} RouteMatch
 * @property {string} path - The matched path.
 * @property {Object} params - The dynamic parameters extracted from the path (e.g., { id: '123' }).
 * @property {URLSearchParams} query - The URL search parameters.
 */

/**
 * @typedef {Object} RouteNotFoundData
 * @property {string} path - The matched path.
 * @property {URLSearchParams} query - The URL search parameters.
 */

/**
 * @callback RouteCallback
 * @param {RouteMatch} match - The object containing path, params, and query.
 */

/**
 * @callback RouteNotFoundCallback
 * @param {RouteNotFoundData} match - The object containing path and query.
 */

/**
 * @typedef {Object} Router
 * @property {RegExp} regex
 * @property {string[]} paramNames
 * @property {RouteCallback} callback
 */

/**
 * A lightweight, framework-agnostic router for managing client-side navigation.
 */
class TinyRouter extends TinyDebugger {
  /** @type {Router[]} */
  #routes = [];
  /** @type {RouteCallback} */
  #onRouteChanged;
  /** @type {RouteNotFoundCallback} */
  #onRouteNotFound;
  /** @type {boolean} */
  #started = false;

  /**
   * @param {Object} options
   * @param {boolean} [options.debugMode=false] - Whether to enable internal debug logging.
   * @param {boolean} [options.useLogColors=false] - Whether to enable log color support.
   * @param {Partial<Console>} [options.logger=console] - A custom logger object (must implement console methods).
   * @param {RouteCallback} [options.onRouteChanged] - Callback executed whenever the route changes.
   * @param {RouteNotFoundCallback} [options.onRouteNotFound]
   */
  constructor(options = {}) {
    super({
      id: '[_blue_TinyRouter_reset_] :debug:',
      logger: options.logger ?? console,
      debugMode: options.debugMode ?? false,
      useLogColors: options.useLogColors ?? false,
    });

    this.#onRouteChanged = options.onRouteChanged || (() => {});
    this.#onRouteNotFound = options.onRouteNotFound || (() => {});

    // Bind the popstate event to handle browser back/forward buttons
    window.addEventListener('popstate', () => this.#resolve());
  }

  /**
   * Registers a new route pattern.
   * @param {string} pathPattern - The path pattern (e.g., '/images/:host/:id' or '/search').
   * @param {RouteCallback} callback - Function to execute when this route is matched.
   */
  addRoute(pathPattern, callback) {
    /** @type {string[]} */
    const paramNames = [];
    // Regex to find segments starting with ':' (e.g., ':id)
    const regexPath = pathPattern.replace(/:([^/]+)/g, (_, paramName) => {
      paramNames.push(paramName);
      return '([^/]+)';
    });

    this.#routes.push({
      regex: new RegExp(`^${regexPath}$`),
      paramNames,
      callback,
    });
    this.log('info', '');
  }

  /**
   * Navigates to a specific path programmatically.
   * @param {string} path - The target path.
   * @param {Object} [state] - Optional state object to associate with the history entry.
   */
  async navigate(path, state = {}) {
    // Prevent redundant navigation if the path is the same
    if (window.location.pathname + window.location.search === path) return;

    window.history.pushState(state, '', path);
    await this.#resolve();
    this.log('info', '');
  }

  /**
   * Triggers the initial route resolution (for deep linking on page load).
   */
  async start() {
    if (this.#started) throw new Error('');
    await this.#resolve();
    this.log('info', '');
  }

  /**
   * Internal method to match the current URL against registered routes.
   */
  async #resolve() {
    const path = window.location.pathname;
    const search = window.location.search;
    const query = new URLSearchParams(search);

    for (const route of this.#routes) {
      const match = path.match(route.regex);

      if (match) {
        /** @type {Record<string, string>} */
        const params = {};
        // Extract dynamic parameters based on the order they were found in the regex
        route.paramNames.forEach((name, index) => {
          params[name] = decodeURIComponent(match[index + 1]);
        });

        const matchResult = { path, params, query };

        // Execute the route's specific callback
        await route.callback(matchResult);

        // Notify the global listener
        this.#onRouteChanged(matchResult);
        this.emit('RouteChanged', matchResult);
        this.log('info', '');
        return;
      }
    }

    // If no route matches, you could implement a 404 logic here
    const matchResult = { path, query };
    this.#onRouteNotFound(matchResult);
    this.emit('RouteNotFound', matchResult);
    this.log('warn', 'No route matched the current URL.');
  }
}

export default TinyRouter;
