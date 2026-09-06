import { EventEmitter } from 'events';
import { createCheckDestroyed } from '../utils/tools.mjs';

const checkDestroy = createCheckDestroyed('TinyNetworkMonitor');

/**
 * @typedef {Object} NetworkStatus
 * @property {boolean} isOnline - Indicates if the browser is currently connected to a network.
 */

/**
 * @typedef {(data: { status: NetworkStatus; event?: Event }) => void} NetworkCallback
 */

/**
 * A monitor that tracks the browser's network connectivity status.
 */
class TinyNetworkMonitor extends EventEmitter {
  #isDestroyed = false;

  get isDestroyed() {
    return this.#isDestroyed;
  }

  /**
   * The current network status.
   * @type {NetworkStatus}
   */
  #currentStatus = { isOnline: navigator.onLine };

  /**
   * The callback function to execute on status change.
   * @type {NetworkCallback|null}
   */
  #callback = null;

  /**
   * Creates an instance of NetworkMonitor.
   * @param {NetworkCallback} [callback] - Function to call when status changes.
   * @throws {TypeError} If the provided callback is not a function.
   */
  constructor(callback) {
    super();
    if (typeof callback !== 'undefined' && typeof callback !== 'function') {
      throw new TypeError('The callback provided to NetworkMonitor must be a function.');
    }

    if (callback) this.#callback = callback;
    this.#setupListeners();
    this.#notify();
  }

  /**
   * Attaches event listeners to the window object.
   */
  #setupListeners() {
    window.addEventListener('online', this.#handleUpdate);
    window.addEventListener('offline', this.#handleUpdate);
  }

  /**
   * Internal handler for network events.
   * @param {Event} event - The browser event object.
   * @bind {NetworkMonitor}
   */
  #handleUpdate = (event) => {
    this.#currentStatus = { isOnline: navigator.onLine };
    this.#notify(event);
  };

  /**
   * Validates the status object and executes the callback.
   * @param {Event} [event] - The browser event object.
   * @throws {TypeError} If the internal status object structure is invalid.
   */
  #notify(event) {
    // Strict validation of the object structure and property types
    if (typeof this.#currentStatus !== 'object' || this.#currentStatus === null || typeof this.#currentStatus.isOnline !== 'boolean') {
      throw new TypeError('Internal Error: NetworkStatus object structure is invalid.');
    }

    const data = { status: this.#currentStatus , event };
    if (this.#callback) this.#callback(data);
    this.emit('NetworkStatus', data);
  }

  /**
   * Returns the current network status.
   * @returns {NetworkStatus} A copy of the current status object.
   */
  get status() {
    checkDestroy(this.#isDestroyed);
    return { ...this.#currentStatus };
  }

  /**
   * Removes event listeners to prevent memory leaks.
   */
  destroy() {
    if (this.#isDestroyed) return;
    window.removeEventListener('online', this.#handleUpdate);
    window.removeEventListener('offline', this.#handleUpdate);
    this.removeAllListeners();
    this.#isDestroyed = true;
    this.emit('Destroyed');
  }
}

export default TinyNetworkMonitor;
