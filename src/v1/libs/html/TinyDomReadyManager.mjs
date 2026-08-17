/**
 * A basic function that performs a task when the system is ready.
 * Used for handlers in the readiness queue.
 *
 * @typedef {() => void} Fn
 */

/**
 * A function that determines whether a specific handler should be executed.
 * Should return `true` to allow execution, or `false` to skip the handler.
 *
 * @typedef {() => boolean} FnFilter
 */

/**
 * @typedef {Object} Handler
 * @property {Fn} fn - Function to execute when ready.
 * @property {boolean} once - Whether to execute only once.
 * @property {number} priority - Execution order (higher priority runs first).
 * @property {FnFilter|null} filter - Optional filter function to determine execution.
 * @property {boolean} domOnly - Whether to run as soon as DOM is ready (before full readiness).
 */

class TinyDomReadyManager {
  /** @type {Handler[]} */
  #handlers = [];

  /** @type {boolean} */
  #isDomReady = false;

  /** @type {boolean} */
  #isFullyReady = false;

  /** @type {Promise<any>[]} */
  #promises = [];

  /**
   * Checks if the DOM is ready and if all Promises have been resolved.
   */
  #checkAllReady() {
    if (this.#isDomReady) {
      Promise.all(this.#promises)
        .then(() => {
          this.#isFullyReady = true;
          this.#runHandlers(false); // run non-domOnly
        })
        .catch((err) => {
          console.error('[TinyDomReadyManager] Promise rejected:', err);
        });
    }
  }

  /**
   * Executes handlers by filtering them by `domOnly` flag and sorting by priority.
   * @param {boolean} domOnlyOnly - Whether to run only `domOnly` handlers.
   */
  #runHandlers(domOnlyOnly) {
    this.#handlers
      .filter((h) => h.domOnly === domOnlyOnly)
      .sort((a, b) => b.priority - a.priority)
      .forEach((handler) => this.#invokeHandler(handler));

    this.#handlers = this.#handlers.filter((h) => !(h.once && (domOnlyOnly ? h.domOnly : true)));
  }

  /**
   * Executes a handler if its filter passes.
   * @param {Handler} handler
   */
  #invokeHandler(handler) {
    if (typeof handler.filter === 'function') {
      try {
        if (!handler.filter()) return;
      } catch (err) {
        console.warn('[TinyDomReadyManager] Filter error:', err);
        return;
      }
    }

    try {
      handler.fn();
    } catch (err) {
      console.error('[TinyDomReadyManager] Handler error:', err);
    }
  }

  /**
   * Marks the system as DOM-ready and runs DOM-only handlers.
   * @private
   */
  _markDomReady() {
    this.#isDomReady = true;
    this.#runHandlers(true); // Run domOnly
    this.#checkAllReady(); // Then check for full readiness
  }

  /**
   * Initializes the manager using `DOMContentLoaded`.
   */
  init() {
    if (this.#isDomReady) throw new Error('[TinyDomReadyManager] init() has already been called.');

    if (document.readyState === 'interactive' || document.readyState === 'complete') {
      this._markDomReady();
    } else {
      document.addEventListener('DOMContentLoaded', () => this._markDomReady());
    }
  }

  /**
   * Adds a Promise to delay full readiness.
   * @param {Promise<any>} promise
   * @throws {TypeError}
   */
  addPromise(promise) {
    if (!(promise instanceof Promise))
      throw new TypeError('[TinyDomReadyManager] promise must be a valid Promise.');

    if (this.#isFullyReady) return;
    this.#promises.push(promise);
    if (this.#isDomReady) this.#checkAllReady();
  }

  /**
   * Registers a handler to run either after DOM is ready or after full readiness.
   *
   * @param {Fn} fn - Function to execute.
   * @param {Object} [options]
   * @param {boolean} [options.once=true] - Execute only once.
   * @param {number} [options.priority=0] - Higher priority runs first.
   * @param {FnFilter|null} [options.filter=null] - Optional filter function.
   * @param {boolean} [options.domOnly=false] - If true, executes after DOM ready only.
   * @throws {TypeError} If fn is not a function.
   */
  onReady(fn, { once = true, priority = 0, filter = null, domOnly = false } = {}) {
    if (typeof fn !== 'function')
      throw new TypeError('[TinyDomReadyManager] fn must be a function.');

    const handler = { fn, once, priority, filter, domOnly };

    if (domOnly && this.#isDomReady) {
      this.#invokeHandler(handler);
      if (!once) this.#handlers.push(handler);
      return;
    }

    if (!domOnly && this.#isFullyReady) {
      this.#invokeHandler(handler);
    } else {
      this.#handlers.push(handler);
    }
  }

  /**
   * Returns whether the system is fully ready (DOM + Promises).
   * @returns {boolean}
   */
  isReady() {
    return this.#isFullyReady;
  }

  /**
   * Returns whether the DOM is ready (DOMContentLoaded has fired).
   * Does not wait for promises.
   * @returns {boolean}
   */
  isDomReady() {
    return this.#isDomReady;
  }
}

export default TinyDomReadyManager;
