import { EventEmitter } from 'events';
import { createCheckDestroyed } from '../utils/tools.mjs';

const checkDestroy = createCheckDestroyed('TinyNetworkMonitor');

/**
 * Represents the current connectivity status of the network connection.
 * @typedef {Object} ConnectivityStatus
 * @property {boolean} isOnline - Indicates if the browser is currently connected to a network.
 */

/**
 * Represents the qualitative metrics of the current network connection.
 * @typedef {Object} ConnectionQuality
 * @property {number} downlink - Effective bandwidth estimate in Mbps.
 * @property {number} rtt - Estimated round-trip time in ms.
 * @property {string} effectiveType - Effective connection type (e.g., '4g').
 * @property {boolean} saveData - Whether the user has enabled data saver mode.
 * @property {boolean} enabled - Indicates whether the Network Information API is available.
 */

/**
 * Represents the performance metrics of a single loaded resource.
 * @typedef {Object} ResourceMetric
 * @property {string} name - The URL of the resource.
 * @property {number} duration - Time taken to load the resource in ms.
 * @property {string} entryType - The type of performance entry (e.g., 'resource').
 */

/**
 * Represents a comprehensive report containing connectivity status, connection quality, and recent resource performance metrics.
 * @typedef {Object} NetworkReport
 * @property {ConnectivityStatus} connectivity - Current online/offline status.
 * @property {ConnectionQuality} quality - Current network quality metrics.
 * @property {ResourceMetric[]} resources - Recent resource loading metrics.
 */

/**
 * A callback function signature for receiving network updates.
 * @typedef {(data: { report: NetworkReport; event?: Event }) => void} NetworkCallback
 */

/**
 * An monitor that tracks connectivity, connection quality, and resource performance.
 */
class TinyNetworkMonitor extends EventEmitter {
  /** @type {boolean} Indicates whether the monitor has been destroyed. */
  #isDestroyed = false;

  /**
   * The current network status.
   * @type {ConnectivityStatus}
   */
  #connectivity = { isOnline: navigator.onLine };

  /** @type {ConnectionQuality} Stores the current network quality metrics. */
  #quality = { downlink: 0, rtt: 0, effectiveType: 'unknown', saveData: false, enabled: !!navigator.connection };
  /** @type {ResourceMetric[]} A collection of recent resource loading metrics. */
  #resources = [];

  /**
   * The callback function to execute on status changes.
   * @type {NetworkCallback|null}
   */
  #callback = null;
  /** @type {PerformanceObserver|null} The observer used to track performance entries. */
  #observer = null;

  /**
   * Creates an instance of TinyNetworkMonitor.
   * @param {NetworkCallback} [callback] - Function to call when status changes.
   * @throws {TypeError} If the provided callback is not a function.
   */
  constructor(callback) {
    super();
    if (typeof callback !== 'undefined' && typeof callback !== 'function') {
      throw new TypeError('The callback provided to TinyNetworkMonitor must be a function.');
    }

    if (callback) this.#callback = callback;

    this.#setupListeners();
    this.#setupResourceObserver();
    this.#updateQualityMetrics();
    this.#notify();
  }

  /**
   * Indicates whether the monitor has been destroyed.
   * @returns {boolean} True if the monitor has been destroyed, false otherwise.
   */
  get isDestroyed() {
    return this.#isDestroyed;
  }

  /**
   * Attaches event listeners to the window and connection APIs.
   */
  #setupListeners() {
    window.addEventListener('online', this.#handleUpdate);
    window.addEventListener('offline', this.#handleUpdate);

    if (navigator.connection) {
      navigator.connection.addEventListener('change', this.#handleUpdate);
    }
  }

  /**
   * Sets up PerformanceObserver to monitor resource loading times.
   */
  #setupResourceObserver() {
    try {
      this.#observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.#resources.push({
            name: entry.name,
            duration: entry.duration,
            entryType: entry.entryType,
          });
        });
        this.#notify();
      });

      this.#observer.observe({ type: 'resource', buffered: true });
    } catch (error) {
      console.warn('PerformanceObserver is not supported in this browser.');
    }
  }

  /**
   * Internal handler for network events.
   * @param {Event} event - The browser event object.
   * @bind {TinyNetworkMonitor}
   */
  #handleUpdate = (event) => {
    this.#updateConnectivity();
    this.#updateQualityMetrics();
    this.#notify(event);
  };

  /**
   * Updates the connectivity status.
   */
  #updateConnectivity() {
    this.#connectivity = { isOnline: navigator.onLine };
  }

  /**
   * Updates the connection quality metrics using the Network Information API.
   */
  #updateQualityMetrics() {
    if (navigator.connection) {
      const { downlink, rtt, effectiveType, saveData } = navigator.connection;

      // Strict validation of connection properties
      this.#quality = {
        downlink: typeof downlink === 'number' ? downlink : 0,
        rtt: typeof rtt === 'number' ? rtt : 0,
        effectiveType: typeof effectiveType === 'string' ? effectiveType : 'unknown',
        saveData: typeof saveData === 'boolean' ? saveData : false,
        enabled: true,
      };
    }
  }

  /**
   * Validates the data structure and executes the callback and emitters.
   * @param {Event} [event] - The browser event object.
   */
  #notify(event) {
    this.#validateInternalState();

    const report = Object.freeze({
      connectivity: Object.freeze({ ...this.#connectivity }),
      quality: Object.freeze({ ...this.#quality }),
      resources: this.#resources.map((res) => Object.freeze({ ...res })),
    });

    const data = { report, event };

    if (this.#callback) {
      this.#callback(data);
    }
    this.emit('NetworkUpdate', data);
  }

  /**
   * Validates internal state to prevent runtime corruption.
   * @throws {TypeError} If internal state is inconsistent.
   */
  #validateInternalState() {
    if (typeof this.#connectivity.isOnline !== 'boolean') {
      throw new TypeError('Internal Error: Connectivity status is invalid.');
    }
    if (typeof this.#quality.downlink !== 'number') {
      throw new TypeError('Internal Error: Quality metrics are invalid.');
    }
  }

  /**
   * Returns a deep-frozen report of the current network status.
   * @returns {NetworkReport} A read-only copy of the current network report.
   */
  get report() {
    checkDestroy(this.#isDestroyed);
    return Object.freeze({
      connectivity: { ...this.#connectivity },
      quality: { ...this.#quality },
      resources: [...this.#resources],
    });
  }

  /**
   * Removes all listeners and observers to prevent memory leaks.
   */
  destroy() {
    if (this.#isDestroyed) return;

    window.removeEventListener('online', this.#handleUpdate);
    window.removeEventListener('offline', this.#handleUpdate);

    if (navigator.connection) {
      navigator.connection.removeEventListener('change', this.#handleUpdate);
    }

    if (this.#observer) {
      this.#observer.disconnect();
    }

    this.removeAllListeners();
    this.#isDestroyed = true;
    this.emit('Destroyed');
  }
}

export default TinyNetworkMonitor;
