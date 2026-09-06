import { EventEmitter } from 'events';
import { createCheckDestroyed } from '../utils/tools.mjs';
import TinyArrayComparator from '../array/TinyArrayComparator.mjs';

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
 * @typedef {Object} BatteryStatus
 * @property {number} level - Battery charge level (0 to 1).
 * @property {boolean} charging - Whether the device is currently charging.
 * @property {number} chargingTime - Time until full charge in seconds.
 * @property {number} dischargingTime - Time until empty in seconds.
 * @property {boolean} enabled - Indicates if the Battery Status API is available.
 */

/**
 * @typedef {Object} DeviceMetrics
 * @property {number} memory - Approximate amount of device memory in GB.
 * @property {boolean} enabled - Indicates if the Device Memory API is available.
 */

/**
 * Represents the performance metrics of a single loaded resource.
 * @typedef {Object} ResourceMetric
 * @property {string} name - The URL of the resource.
 * @property {number} duration - Time taken to load the resource in ms.
 * @property {string} entryType - The type of performance entry (e.g., 'resource').
 */

/**
 * @typedef {Object} PaintMetrics
 * @property {number} firstPaint - Time when the first pixel was painted.
 * @property {number} firstContentfulPaint - Time when the first content was painted.
 */

/**
 * @typedef {Object} NavigationMetrics
 * @property {number} ttfb - Time to first byte in ms.
 * @property {number} domContentLoaded - Time until DOMContentLoaded in ms.
 * @property {number} loadEvent - Time until load event in ms.
 */

/**
 * @typedef {Object} PerformanceMetrics
 * @property {PaintMetrics} paint - Paint timing metrics.
 * @property {NavigationMetrics|null} navigation - Navigation timing metrics.
 * @property {number} layoutShift - Cumulative Layout Shift (CLS) value.
 * @property {number} lcp - Largest Contentful Paint (LCP) value in ms.
 * @property {number[]} longTasks - Array of durations of long tasks in ms.
 */

/**
 * Represents a comprehensive report containing connectivity status, connection quality, and recent resource performance metrics.
 * @typedef {Object} NetworkEvent
 * @property {Readonly<ConnectivityStatus>} connectivity - Current online/offline status.
 * @property {Readonly<ConnectionQuality>} quality - Current network quality metrics.
 * @property {Readonly<BatteryStatus>} battery - Current battery status.
 * @property {Readonly<DeviceMetrics>} device - Current device hardware metrics.
 * @property {Readonly<PerformanceMetrics>} performance - Comprehensive performance metrics.
 * @property {Readonly<ResourceMetric[]>} resources - Recent resource loading metrics.
 * @property {Event} [event]
 */

/**
 * A callback function signature for receiving network updates.
 * @typedef {(data: NetworkEvent) => void} NetworkCallback
 */

/**
 * An advanced monitor that tracks connectivity, connection quality, battery,
 * device constraints, and comprehensive performance metrics.
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

  /** @type {BatteryStatus} The current status of the device's battery. */
  #battery = {
    level: 1,
    charging: true,
    chargingTime: 0,
    dischargingTime: 0,
    enabled: false,
  };

  /** @type {DeviceMetrics} The current hardware metrics of the device. */
  #deviceMetrics = {
    memory: 0,
    enabled: !!navigator.deviceMemory,
  };

  /** @type {PerformanceMetrics} The current performance and timing metrics. */
  #performance = {
    paint: { firstPaint: 0, firstContentfulPaint: 0 },
    navigation: null,
    layoutShift: 0,
    lcp: 0,
    longTasks: [],
  };

  /** @type {number} Maximum number of resource metrics to store. Use -1 for infinite. */
  #resourceLimit;

  /**
   * The callback function to execute on status changes.
   * @type {NetworkCallback|null}
   */
  #callback = null;
  /** @type {PerformanceObserver[]} The observer used to track performance entries. */
  #observers = [];

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

    this.#callback = callback || null;
    this.#resourceLimit = resourceLimit;

    this.#setupListeners();
    this.#setupPerformanceObservers();
    this.#setupDeviceMetrics();
    this.#setupBatteryMonitoring();
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
   * Returns the current battery status.
   * @returns {Readonly<BatteryStatus>} A deep clone of the battery status.
   */
  get battery() {
    checkDestroy(this.#isDestroyed);
    return Object.freeze({ ...this.#battery });
  }

  /**
   * Returns the current device hardware metrics.
   * @returns {Readonly<DeviceMetrics>} A deep clone of the device metrics.
   */
  get device() {
    checkDestroy(this.#isDestroyed);
    return Object.freeze({ ...this.#deviceMetrics });
  }

  /**
   * Returns the current performance metrics.
   * @returns {Readonly<PerformanceMetrics>} A deep clone of the performance metrics.
   */
  get performance() {
    checkDestroy(this.#isDestroyed);
    return Object.freeze({
      ...this.#performance,
      paint: Object.freeze({ ...this.#performance.paint }),
      navigation: this.#performance.navigation
        ? Object.freeze({ ...this.#performance.navigation })
        : null,
    });
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
   * Initializes and stores hardware-specific metrics such as device memory.
   */
  #setupDeviceMetrics() {
    if (navigator.deviceMemory) {
      this.#deviceMetrics.memory = navigator.deviceMemory;
    }
  }

  /**
   * Asynchronously initializes battery monitoring using the Battery Status API.
   * @returns {Promise<void>}
   */
  async #setupBatteryMonitoring() {
    if (navigator.getBattery) {
      try {
        const battery = await navigator.getBattery();
        this.#battery.enabled = true;

        const updateBattery = () => {
          this.#battery = {
            level: battery.level,
            charging: battery.charging,
            chargingTime: battery.chargingTime,
            dischargingTime: battery.dischargingTime,
            enabled: true,
          };
          this.#notify();
        };

        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
        battery.addEventListener('chargingtimechange', updateBattery);
        battery.addEventListener('dischargingtimechange', updateBattery);

        updateBattery();
      } catch (error) {
        console.warn('Battery Status API failed to initialize:', error);
      }
    }
  }

  /**
   * Initializes and starts multiple PerformanceObservers to track web vital metrics.
   */
  #setupPerformanceObservers() {
    const observerConfigs = [
      { type: 'resource', callback: this.#handleResourceEntry.bind(this) },
      { type: 'paint', callback: this.#handlePaintEntry.bind(this) },
      { type: 'navigation', callback: this.#handleNavigationEntry.bind(this) },
      { type: 'layout-shift', callback: this.#handleLayoutShiftEntry.bind(this) },
      { type: 'largest-contentful-paint', callback: this.#handleLCPEntry.bind(this) },
      { type: 'longtask', callback: this.#handleLongTaskEntry.bind(this) },
    ];

    for (const config of observerConfigs) {
      try {
        const observer = new PerformanceObserver(config.callback);
        observer.observe({ type: config.type, buffered: true });
        this.#observers.push(observer);
      } catch (e) {
        // Silently skip unsupported observer types
      }
    }
  }

  /**
   * Processes new resource performance entries and maintains the resource history.
   * @param {PerformanceObserverEntryList} list - The list of performance entries.
   */
  #handleResourceEntry(list) {
    const entries = list.getEntries();
    /** @type {TinyArrayComparator<ResourceMetric>} */
    const comparator = new TinyArrayComparator(
      this.#resources.map((v) => ({ ...v })),
      { idKey: 'name' },
    );

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

    const compareResult = comparator.compare(this.#resources);
    for (const result of compareResult) {
      this.emit(
        `Resource${result.status === 'added' ? 'Added' : result.status === 'deleted' ? 'Deleted' : 'Edited'}`,
        result.oldItem,
        result.item,
      );
    }
    this.#notify();
  }

  /**
   * Processes paint-related performance entries to update paint timing metrics.
   * @param {PerformanceObserverEntryList} list - The list of performance entries.
   */
  #handlePaintEntry(list) {
    list.getEntries().forEach((entry) => {
      if (entry.name === 'first-paint') {
        this.#performance.paint.firstPaint = entry.startTime;
      } else if (entry.name === 'first-contentful-paint') {
        this.#performance.paint.firstContentfulPaint = entry.startTime;
      }
    });
    this.#notify();
  }

  /**
   * Extracts and updates navigation timing metrics from performance entries.
   * @param {PerformanceObserverEntryList} list - The list of performance entries.
   */
  #handleNavigationEntry(list) {
    /** @type {PerformanceNavigationTiming} */
    // @ts-ignore
    const entry = list.getEntries()[0];
    if (entry) {
      this.#performance.navigation = {
        ttfb: entry.responseStart - entry.requestStart,
        domContentLoaded: entry.domContentLoadedEventEnd - entry.startTime,
        loadEvent: entry.loadEventEnd - entry.startTime,
      };
    }
    this.#notify();
  }

  /**
   * Processes layout shift entries to track Cumulative Layout Shift (CLS).
   * @param {PerformanceObserverEntryList} list - The list of performance entries.
   */
  #handleLayoutShiftEntry(list) {
    list.getEntries().forEach((entry) => {
      /** @type {LayoutShift} */
      // @ts-ignore
      const shiftEntry = entry;

      if (!shiftEntry.hadRecentInput) {
        this.#performance.layoutShift += shiftEntry.value;
      }
    });
    this.#notify();
  }

  /**
   * Updates the Largest Contentful Paint (LCP) value using the latest entry.
   * @param {PerformanceObserverEntryList} list - The list of performance entries.
   */
  #handleLCPEntry(list) {
    const lastEntry = list.getEntries().pop();
    if (lastEntry) {
      this.#performance.lcp = lastEntry.startTime;
    }
    this.#notify();
  }

  /**
   * Collects durations of long tasks to monitor main thread responsiveness.
   * @param {PerformanceObserverEntryList} list - The list of performance entries.
   */
  #handleLongTaskEntry(list) {
    list.getEntries().forEach((entry) => {
      this.#performance.longTasks.push(entry.duration);
    });
    this.#notify();
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

    /** @type {NetworkEvent} */
    const data = {
      connectivity: Object.freeze({ ...this.#connectivity }),
      quality: Object.freeze({ ...this.#quality }),
      resources: Object.freeze(this.#resources.map((res) => Object.freeze({ ...res }))),
      battery: Object.freeze({ ...this.#battery }),
      device: Object.freeze({ ...this.#deviceMetrics }),
      performance: this.performance,
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
   * Removes all listeners and observers to prevent memory leaks.
   */
  destroy() {
    if (this.#isDestroyed) return;

    window.removeEventListener('online', this.#handleUpdate);
    window.removeEventListener('offline', this.#handleUpdate);

    if (navigator.connection) {
      navigator.connection.removeEventListener('change', this.#handleUpdate);
    }

    this.#observers.forEach((obs) => obs.disconnect());
    this.#observers = [];

    this.removeAllListeners();
    this.#isDestroyed = true;
    this.emit('Destroyed');
  }
}

export default TinyNetworkMonitor;
