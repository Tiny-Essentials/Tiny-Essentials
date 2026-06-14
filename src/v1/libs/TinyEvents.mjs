/**
 * A generic event listener callback function.
 *
 * @callback handler
 * @param {...any} payload - The data payload passed when the event is triggered.
 * @returns {void}
 */

/**
 * TinyEvents provides a minimalistic event emitter system similar to Node.js's EventEmitter,
 * enabling components to subscribe to, emit, and manage events and their listeners.
 *
 * Features include:
 * - Adding/removing event listeners (`on`, `off`, `offAll`, `offAllTypes`)
 * - One-time listeners (`once`)
 * - Emitting events (`emit`)
 * - Listener inspection and limits (`listenerCount`, `listeners`, `eventNames`)
 * - Maximum listener control (`setMaxListeners`, `getMaxListeners`)
 *
 * This class is useful for lightweight, dependency-free publish/subscribe event handling
 * within modular JavaScript applications.
 *
 * @class
 */
class TinyEvents {
  /** @type {Map<string, { handler: handler; config: { once: boolean } }[]>} */
  #listeners = new Map();

  /** @type {number} */
  #maxListeners = 10;

  /** @type {boolean} */
  #throwMaxListeners = false;

  /**
   * Normalizes the event parameter into an array of strings.
   *
   * @param {string|string[]} event
   * @param {string} method
   * @returns {string[]}
   */
  #normalizeEvents(event, method) {
    if (typeof event === 'string') return [event];
    if (Array.isArray(event) && event.every((e) => typeof e === 'string')) return event;
    throw new TypeError(`${method}(event): event must be a string or string[]`);
  }

  /**
   * Enables or disables throwing an error when the maximum number of listeners is exceeded.
   *
   * @param {boolean} shouldThrow - If true, an error will be thrown when the max is exceeded.
   */
  setThrowOnMaxListeners(shouldThrow) {
    if (typeof shouldThrow !== 'boolean')
      throw new TypeError('setThrowOnMaxListeners(value): value must be a boolean');
    this.#throwMaxListeners = shouldThrow;
  }

  /**
   * Checks whether an error will be thrown when the max listener limit is exceeded.
   *
   * @returns {boolean} True if an error will be thrown, false if only a warning is shown.
   */
  getThrowOnMaxListeners() {
    return this.#throwMaxListeners;
  }

  ///////////////////////////////////////////////////

  /**
   * Internal method to prepend a listener with options.
   *
   * @param {string} event - Event name.
   * @param {handler} handler - The callback function.
   * @param {Object} [settings={}] - Optional settings.
   * @param {boolean} [settings.once=false] - If the listener should be executed once.
   */
  #prepend(event, handler, { once = false } = {}) {
    let eventData = this.#listeners.get(event);
    if (!Array.isArray(eventData)) {
      eventData = [];
      this.#listeners.set(event, eventData);
    }
    eventData.unshift({ handler, config: { once } });

    const max = this.#maxListeners;
    if (max > 0 && eventData.length > max) {
      const warnMessage =
        `Possible memory leak detected. ${eventData.length} "${event}" listeners added. ` +
        `Use setMaxListeners() to increase limit.`;
      if (!this.#throwMaxListeners) console.warn(warnMessage);
      else throw new Error(warnMessage);
    }
  }

  /**
   * Adds a listener to the beginning of the listeners array for the specified event.
   *
   * @param {string|string[]} event - Event name.
   * @param {handler} handler - The callback function.
   */
  prependListener(event, handler) {
    const events = this.#normalizeEvents(event, 'prependListener');
    if (typeof handler !== 'function')
      throw new TypeError('prependListener(event, handler): handler must be a function');
    for (const ev of events) this.#prepend(ev, handler);
  }

  /**
   * Adds a one-time listener to the beginning of the listeners array for the specified event.
   *
   * @param {string|string[]} event - Event name.
   * @param {handler} handler - The callback function.
   * @returns {handler[]} - The wrapped handler used internally.
   */
  prependListenerOnce(event, handler) {
    const events = this.#normalizeEvents(event, 'prependListenerOnce');
    if (typeof handler !== 'function')
      throw new TypeError('prependListenerOnce(event, handler): handler must be a function');

    const wrappedHandlers = [];
    for (const ev of events) {
      /** @type {handler} */
      const wrapped = (...args) => {
        this.off(ev, wrapped);
        handler(...args);
      };
      this.#prepend(ev, wrapped, { once: true });
      wrappedHandlers.push(wrapped);
    }
    return wrappedHandlers;
  }

  ////////////////////////////////////////////////////////////

  /**
   * Adds a event listener.
   *
   * @param {string|string[]} event - Event name, such as 'onScrollBoundary' or 'onAutoScroll'.
   * @param {handler} handler - Callback function to be called when event fires.
   * @param {Object} [settings={}] - Optional settings.
   * @param {boolean} [settings.once=false] - This is a once event.
   */
  #on(event, handler, { once = false } = {}) {
    const events = this.#normalizeEvents(event, 'on');
    for (const ev of events) {
      let eventData = this.#listeners.get(ev);
      if (!Array.isArray(eventData)) {
        eventData = [];
        this.#listeners.set(ev, eventData);
      }
      eventData.push({ handler, config: { once } });
      // Warn if listener count exceeds the max allowed
      const max = this.#maxListeners;
      if (max > 0 && eventData.length > max) {
        const warnMessage =
          `Possible memory leak detected. ${eventData.length} "${ev}" listeners added. ` +
          `Use setMaxListeners() to increase limit.`;
        if (!this.#throwMaxListeners) console.warn(warnMessage);
        else throw new Error(warnMessage);
      }
    }
  }

  /**
   * Adds a event listener.
   *
   * @param {string|string[]} event - Event name, such as 'onScrollBoundary' or 'onAutoScroll'.
   * @param {handler} handler - Callback function to be called when event fires.
   */
  on(event, handler) {
    if (typeof handler !== 'function')
      throw new TypeError('on(event, handler): handler must be a function');
    return this.#on(event, handler);
  }

  /**
   * Registers an event listener that runs only once, then is removed.
   *
   * @param {string|string[]} event - Event name, such as 'onScrollBoundary' or 'onAutoScroll'.
   * @param {handler} handler - The callback function to run on event.
   * @returns {handler[]} - The wrapped version of the handler.
   */
  once(event, handler) {
    const events = this.#normalizeEvents(event, 'once');
    if (typeof handler !== 'function')
      throw new TypeError('once(event, handler): handler must be a function');

    const wrappedHandlers = [];
    for (const ev of events) {
      /** @type {handler} */
      const wrapped = (...args) => {
        this.off(ev, wrapped);
        handler(...args);
      };
      this.#on(ev, wrapped, { once: true });
      wrappedHandlers.push(wrapped);
    }
    return wrappedHandlers;
  }

  /**
   * Adds a event listener.
   *
   * @param {string|string[]} event - Event name, such as 'onScrollBoundary' or 'onAutoScroll'.
   * @param {handler} handler - Callback function to be called when event fires.
   */
  appendListener(event, handler) {
    return this.on(event, handler);
  }

  /**
   * Registers an event listener that runs only once, then is removed.
   *
   * @param {string|string[]} event - Event name, such as 'onScrollBoundary' or 'onAutoScroll'.
   * @param {handler} handler - The callback function to run on event.
   * @returns {handler[]} - The wrapped version of the handler.
   */
  appendListenerOnce(event, handler) {
    return this.once(event, handler);
  }

  ///////////////////////////////////////////////

  /**
   * Removes a previously registered event listener.
   *
   * @param {string|string[]} event - The name of the event to remove the handler from.
   * @param {handler} handler - The specific callback function to remove.
   */
  off(event, handler) {
    const events = this.#normalizeEvents(event, 'off');
    if (typeof handler !== 'function')
      throw new TypeError('off(event, handler): handler must be a function');

    for (const ev of events) {
      const listeners = this.#listeners.get(ev);
      if (!Array.isArray(listeners)) continue;

      const index = listeners.findIndex((listener) => listener.handler === handler);
      if (index !== -1) listeners.splice(index, 1);

      // Optionally clean up empty arrays (optional)
      if (listeners.length === 0) this.#listeners.delete(ev);
    }
  }

  /**
   * Removes all event listeners of a specific type from the element.
   *
   * @param {string|string[]} event - The event type to remove (e.g. 'onScrollBoundary').
   */
  offAll(event) {
    const events = this.#normalizeEvents(event, 'offAll');
    for (const ev of events) this.#listeners.delete(ev);
  }

  /**
   * Removes all event listeners of all types from the element.
   */
  offAllTypes() {
    this.#listeners.clear();
  }

  /**
   * Removes all event listeners of all types from the element.
   */
  removeAllListeners() {
    return this.offAllTypes();
  }

  /////////////////////////////////////////////

  /**
   * Returns the number of listeners for a given event.
   *
   * @param {string} event - The name of the event.
   * @returns {number} Number of listeners for the event.
   */
  listenerCount(event) {
    if (typeof event !== 'string')
      throw new TypeError('listenerCount(event): event name must be a string');

    const listeners = this.#listeners.get(event);
    return Array.isArray(listeners) ? listeners.length : 0;
  }

  /**
   * Returns a copy of the array of listeners for the specified event.
   *
   * @param {string} event - The name of the event.
   * @returns {handler[]} Array of listener functions.
   */
  listeners(event) {
    if (typeof event !== 'string')
      throw new TypeError('listeners(event): event name must be a string');

    const listeners = this.#listeners.get(event);
    return Array.isArray(listeners)
      ? [...listeners]
          .filter((listener) => !listener.config.once)
          .map((listener) => listener.handler)
      : [];
  }

  /**
   * Returns a copy of the array of listeners for the specified event.
   *
   * @param {string} event - The name of the event.
   * @returns {handler[]} Array of listener functions.
   */
  onceListeners(event) {
    if (typeof event !== 'string')
      throw new TypeError('onceListeners(event): event name must be a string');

    const listeners = this.#listeners.get(event);
    return Array.isArray(listeners)
      ? [...listeners]
          .filter((listener) => listener.config.once)
          .map((listener) => listener.handler)
      : [];
  }

  /**
   * Returns a copy of the internal listeners array for the specified event,
   * including wrapper functions like those used by `.once()`.
   * @param {string | symbol} event - The event name.
   * @returns {handler[]} An array of raw listener functions.
   */
  allListeners(event) {
    if (typeof event !== 'string')
      throw new TypeError('allListeners(event): event name must be a string');
    const listeners = this.#listeners.get(event);
    return Array.isArray(listeners) ? [...listeners].map((listener) => listener.handler) : [];
  }

  /**
   * Returns an array of event names for which there are registered listeners.
   *
   * @returns {string[]} Array of registered event names.
   */
  eventNames() {
    return [...this.#listeners.keys()];
  }

  /**
   * Emits an event, triggering all registered handlers for that event.
   *
   * @param {string|string[]} event - The event name to emit.
   * @param {...any} payload - Optional data to pass to each handler.
   * @returns {boolean[]} True if any listeners were called, false otherwise.
   */
  emit(event, ...payload) {
    const events = this.#normalizeEvents(event, 'emit');
    const called = [];
    for (const ev of events) {
      const listeners = this.#listeners.get(ev);
      if (!Array.isArray(listeners) || listeners.length === 0) {
        called.push(false);
        continue;
      }

      // Call all listeners with the provided data
      listeners.forEach((listener) => listener.handler(...payload));
      called.push(true);
    }
    return called;
  }

  ///////////////////////////////////

  /**
   * Sets the maximum number of listeners per event before a warning is shown.
   *
   * @param {number} n - The maximum number of listeners.
   */
  setMaxListeners(n) {
    if (!Number.isInteger(n) || n < 0)
      throw new TypeError('setMaxListeners(n): n must be a non-negative integer');
    this.#maxListeners = n;
  }

  /**
   * Gets the maximum number of listeners allowed per event.
   *
   * @returns {number} The maximum number of listeners.
   */
  getMaxListeners() {
    return this.#maxListeners;
  }
}

export default TinyEvents;
