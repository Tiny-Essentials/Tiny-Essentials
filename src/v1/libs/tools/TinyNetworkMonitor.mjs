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
 * @property {Readonly<ConnectivityStatus>} connectivity - Current online/offline status.
 * @property {Readonly<ConnectionQuality>} quality - Current network quality metrics.
 * @property {Readonly<ResourceMetric[]>} resources - Recent resource loading metrics.
 */

/**
 * A callback function signature for receiving network updates.
 * @typedef {(data: NetworkReport & { event?: Event }) => void} NetworkCallback
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
  #quality = {
    downlink: 0,
    rtt: 0,
    effectiveType: 'unknown',
    saveData: false,
    enabled: !!navigator.connection,
  };
  /** @type {ResourceMetric[]} A collection of recent resource loading metrics. */
  #resources = [];

  /** @type {number} Maximum number of resource metrics to store. Use -1 for infinite. */
  #resourceLimit;

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
   * @param {number} [resourceLimit=1000] - Maximum number of resource metrics to store. Use -1 for infinite.
   * @throws {TypeError} If the provided callback is not a function or resourceLimit is invalid.
   */
  constructor(callback, resourceLimit = 1000) {
    super();
    if (typeof callback !== 'undefined' && typeof callback !== 'function') {
      throw new TypeError('The callback provided to TinyNetworkMonitor must be a function.');
    }
    if (typeof resourceLimit !== 'number' || resourceLimit < -1) {
      throw new TypeError('The resourceLimit must be a number greater than or equal to -1.');
    }

    if (callback) this.#callback = callback;
    this.#resourceLimit = resourceLimit;

    this.#setupListeners();
    this.#setupResourceObserver();
    this.#updateQualityMetrics();
    this.#notify();
  }

  /**
   *  The observer used to track performance entries.
   * @returns {PerformanceObserver|null}
   */
  get observer() {
    return this.#observer;
  }

  /**
   * Indicates whether the monitor has been destroyed.
   * @returns {boolean} True if the monitor has been destroyed, false otherwise.
   */
  get isDestroyed() {
    return this.#isDestroyed;
  }

  /**
   * Returns the current connectivity status.
   * @returns {Readonly<ConnectivityStatus>} A deep clone of the connectivity status.
   */
  get connectivity() {
    checkDestroy(this.#isDestroyed);
    return Object.freeze({ ...this.#connectivity });
  }

  /**
   * Returns the current connection quality metrics.
   * @returns {Readonly<ConnectionQuality>} A deep clone of the quality metrics.
   */
  get quality() {
    checkDestroy(this.#isDestroyed);
    return Object.freeze({ ...this.#quality });
  }

  /**
   * Returns the collection of recent resource loading metrics.
   * @returns {Readonly<ResourceMetric[]>} A deep freeze of the resources array.
   */
  get resources() {
    checkDestroy(this.#isDestroyed);
    return Object.freeze(this.#resources.map((res) => Object.freeze({ ...res })));
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

        // Handle resource limit (FIFO logic)
        if (this.#resourceLimit > 0 && this.#resources.length > this.#resourceLimit) {
          this.#resources.splice(0, this.#resources.length - this.#resourceLimit);
        }

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

    const data = {
      connectivity: Object.freeze({ ...this.#connectivity }),
      quality: Object.freeze({ ...this.#quality }),
      resources: Object.freeze(this.#resources.map((res) => Object.freeze({ ...res }))),
      event,
    };

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
      connectivity: Object.freeze({ ...this.#connectivity }),
      quality: Object.freeze({ ...this.#quality }),
      resources: Object.freeze(this.#resources.map((res) => Object.freeze({ ...res }))),
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
