import { EventEmitter } from 'events';
import { createCheckDestroyed } from '../utils/tools.mjs';
import TinyArrayComparator from '../array/TinyArrayComparator.mjs';

const checkDestroy = createCheckDestroyed('TinyBrowserMonitor');

/**
 * Defines the valid identifiers for the various monitoring systems available.
 * @typedef {'connectivity'|'quality'|'battery'|'device'|'cpu'|'gpu'|'performance'|'resource'|'paint'|'navigation'|'layout-shift'|'lcp'|'longtask'|'memory-usage'|'fps'|'window'|'screen'} SystemValue
 */

/**
 * @typedef {'bytes'|'KB'|'MB'|'GB'} MemoryFormat
 */

/**
 * @typedef {{ used: number; total: number; limit: number; }} MemoryHumanData
 */

/**
 * Represents the JavaScript heap memory usage.
 * @typedef {Object} MemoryUsage
 * @property {number} usedJSHeapSize - The amount of memory currently being used by the JS heap in bytes.
 * @property {number} totalJSHeapSize - The total amount of memory currently allocated for the JS heap in bytes.
 * @property {number} jsHeapSizeLimit - The maximum amount of memory that can be allocated for the JS heap in bytes.
 * @property {boolean} enabled - Indicates if the Memory API is available.
 */

/**
 * Configuration options used to initialize the TinyBrowserMonitor instance.
 * @typedef {Object} MonitorOptions
 * @property {number} [resourceLimit=1000] - Maximum number of resource metrics to store. Use -1 for infinite.
 * @property {SystemValue[]} [systems] - List of systems to enable. If empty, all are enabled.
 * @property {number} [memoryIntervalMs=100] - Interval in milliseconds for memory polling.
 */

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
 * Represents the current state and availability of the device's battery information.
 * @typedef {Object} BatteryStatus
 * @property {number} level - Battery charge level (0 to 1).
 * @property {boolean} charging - Whether the device is currently charging.
 * @property {number} chargingTime - Time until full charge in seconds.
 * @property {number} dischargingTime - Time until empty in seconds.
 * @property {boolean} enabled - Indicates if the Battery Status API is available.
 */

/**
 * Represents the hardware-specific metrics of the user's device.
 * @typedef {Object} GPUInfo
 * @property {string} vendor - The GPU manufacturer.
 * @property {string} renderer - The specific GPU model name.
 */

/**
 * Represents the CPU-related metrics of the user's device.
 * @typedef {Object} CPUInfo
 * @property {number} logicalCores - The number of logical processing cores.
 */

/**
 * Represents the hardware-specific metrics of the user's device.
 * @typedef {Object} DeviceMetrics
 * @property {number} memory - Approximate amount of device memory in GB.
 * @property {CPUInfo} cpu - CPU-related metrics.
 * @property {GPUInfo} gpu - GPU-related metrics.
 * @property {boolean} enabled - Indicates if the requested device information was successfully retrieved.
 */

/**
 * Represents the performance metrics of a single loaded resource.
 * @typedef {Object} ResourceMetric
 * @property {string} name - The URL of the resource.
 * @property {number} duration - Time taken to load the resource in ms.
 * @property {string} entryType - The type of performance entry (e.g., 'resource').
 */

/**
 * Represents the timing data related to browser paint events.
 * @typedef {Object} PaintMetrics
 * @property {number} firstPaint - Time when the first pixel was painted.
 * @property {number} firstContentfulPaint - Time when the first content was painted.
 */

/**
 * Represents the performance timing metrics related to page navigation.
 * @typedef {Object} NavigationMetrics
 * @property {number} ttfb - Time to first byte in ms.
 * @property {number} domContentLoaded - Time until DOMContentLoaded in ms.
 * @property {number} loadEvent - Time until load event in ms.
 */

/**
 * Represents the rendering performance in frames per second.
 * @typedef {Object} FrameRateMetrics
 * @property {number} fps - The current frames per second.
 * @property {number} timestamp - The timestamp of the last measurement.
 */

/**
 * Aggregates various performance and timing metrics into a single object.
 * @typedef {Object} PerformanceMetrics
 * @property {PaintMetrics} paint - Paint timing metrics.
 * @property {NavigationMetrics|null} navigation - Navigation timing metrics.
 * @property {number} layoutShift - Cumulative Layout Shift (CLS) value.
 * @property {number} lcp - Largest Contentful Paint (LCP) value in ms.
 * @property {number[]} longTasks - Array of durations of long tasks in ms.
 * @property {Readonly<FrameRateMetrics>} fps - Current frame rate metrics.
 */

/**
 * Represents the dimensions and pixel ratio of the browser viewport.
 * @typedef {Object} WindowMetrics
 * @property {number} width - The width of the viewport in pixels.
 * @property {number} height - The height of the viewport in pixels.
 * @property {number} devicePixelRatio - The device pixel ratio.
 */

/**
 * Represents the physical screen/monitor properties.
 * @typedef {Object} ScreenMetrics
 * @property {number} width - The screen width in pixels.
 * @property {number} height - The screen height in pixels.
 * @property {number} availWidth - The available screen width in pixels (excluding OS taskbars).
 * @property {number} availHeight - The available screen height in pixels (excluding OS taskbars).
 * @property {number} colorDepth - The color depth of the screen in bits.
 * @property {number} pixelDepth - The pixel depth of the screen in bits.
 * @property {string} orientation - The orientation of the screen (e.g., 'landscape-primary').
 */

/**
 * Represents a comprehensive report containing connectivity status, connection quality, recent resource performance metrics, and memory usage.
 * @typedef {Object} NetworkEvent
 * @property {Readonly<ConnectivityStatus>} connectivity - Current online/offline status.
 * @property {Readonly<ConnectionQuality>} quality - Current network quality metrics.
 * @property {Readonly<BatteryStatus>} battery - Current battery status.
 * @property {Readonly<DeviceMetrics>} device - Current device hardware metrics.
 * @property {Readonly<PerformanceMetrics>} performance - Comprehensive performance metrics.
 * @property {Readonly<ResourceMetric[]>} resources - Recent resource loading metrics.
 * @property {Readonly<MemoryUsage>} memoryUsage - Current JavaScript heap memory metrics.
 * @property {Readonly<WindowMetrics>} windowMetrics - Current viewport dimensions.
 * @property {Readonly<ScreenMetrics>} screenMetrics - Current screen/monitor properties.
 * @property {Event} [event]
 */

/**
 * A callback function signature for receiving network updates.
 * @typedef {(data: NetworkEvent) => void} NetworkCallback
 */

/** @type {SystemValue[]} */
const VALID_SYSTEMS = [
  'connectivity',
  'quality',
  'battery',
  'device',
  'cpu',
  'gpu',
  'performance',
  'resource',
  'paint',
  'navigation',
  'layout-shift',
  'lcp',
  'longtask',
  'memory-usage',
  'fps',
  'window',
  'screen',
];

/**
 * An advanced monitor that tracks connectivity, connection quality, battery,
 * device constraints, and comprehensive performance metrics.
 */
class TinyBrowserMonitor extends EventEmitter {
  /** @type {boolean} Indicates whether the monitor has been destroyed. */
  #isDestroyed = false;

  /** @type {Set<SystemValue>} A set containing the identifiers for the systems currently being monitored. */
  #enabledSystems = new Set();

  /**
   * The current network status.
   * @type {ConnectivityStatus}
   */
  #connectivity = { isOnline: navigator.onLine };

  /** @type {null|NodeJS.Timeout} */
  #memoryInterval = null;

  /** @type {number} */
  #memoryIntervalMs;

  /** @type {MemoryUsage} The current JavaScript heap memory usage. */
  #memoryUsage = {
    usedJSHeapSize: 0,
    totalJSHeapSize: 0,
    jsHeapSizeLimit: 0,
    enabled: !!performance.memory,
  };

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
    cpu: {
      logicalCores: 0,
    },
    gpu: {
      vendor: 'unknown',
      renderer: 'unknown',
    },
    enabled: !!navigator.deviceMemory,
  };

  /** @type {FrameRateMetrics} The current frame rate metrics. */
  #fps = {
    fps: 60,
    timestamp: performance.now(),
  };

  /** @type {number|null} The animation frame request ID for the FPS loop. */
  #fpsRequestId = null;

  /** @type {PerformanceMetrics} The current performance and timing metrics. */
  #performance = {
    paint: { firstPaint: 0, firstContentfulPaint: 0 },
    navigation: null,
    layoutShift: 0,
    lcp: 0,
    fps: this.#fps,
    longTasks: [],
  };

  /** @type {WindowMetrics} The current viewport dimensions. */
  #windowMetrics = {
    width: window.innerWidth,
    height: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
  };

  /** @type {ScreenMetrics} The current screen/monitor properties. */
  #screenMetrics = {
    width: window.screen.width,
    height: window.screen.height,
    availWidth: window.screen.availWidth,
    availHeight: window.screen.availHeight,
    colorDepth: window.screen.colorDepth,
    pixelDepth: window.screen.pixelDepth,
    orientation: window.screen.orientation?.type || 'unknown',
  };

  /** @type {number} Maximum number of resource metrics to store. Use -1 for infinite. */
  #resourceLimit;

  /** @type {PerformanceObserver[]} The observer used to track performance entries. */
  #observers = [];

  /**
   * Creates an instance of TinyBrowserMonitor.
   * @param {MonitorOptions} [options={}] - Configuration options.
   * @throws {TypeError} If the provided resourceLimit is invalid, memoryIntervalMs is invalid, or systems is not an array.
   * @throws {TypeError} If any provided system is not a valid SystemValue.
   */
  constructor(options = {}) {
    super();

    const { resourceLimit = 1000, systems = [], memoryIntervalMs = 100 } = options;

    // 1. Validate resourceLimit
    if (typeof resourceLimit !== 'number' || resourceLimit < -1) {
      throw new TypeError('The resourceLimit must be a number greater than or equal to -1.');
    }

    // 2. Validate memoryIntervalMs with a safety floor (16ms ~ 60fps) to prevent CPU exhaustion
    if (typeof memoryIntervalMs !== 'number' || memoryIntervalMs < 16) {
      throw new TypeError('The memoryIntervalMs must be a number greater than or equal to 16.');
    }

    // 3. Validate systems is an array and contains only valid SystemValue types
    if (!Array.isArray(systems)) {
      throw new TypeError('The systems option must be an array.');
    }

    for (const system of systems) {
      if (!VALID_SYSTEMS.includes(system)) {
        throw new TypeError(`Invalid system identifier: "${system}". Must be one of: ${VALID_SYSTEMS.join(', ')}`);
      }
    }

    this.#resourceLimit = resourceLimit;
    this.#memoryIntervalMs = memoryIntervalMs;

    // Logic: If systems array is empty, enable everything.
    this.#enabledSystems = systems.length === 0 ? new Set(VALID_SYSTEMS) : new Set(systems);

    this.#initializeSelectedSystems();
    this.#notify();
  }

  /**
   * Initializes only the systems selected in the options.
   */
  #initializeSelectedSystems() {
    if (this.#enabledSystems.has('connectivity')) {
      this.#setupListeners();
    }
    if (this.#enabledSystems.has('quality')) {
      this.#updateQualityMetrics();
    }
    if (this.#enabledSystems.has('battery')) {
      this.#setupBatteryMonitoring();
    }

    if (this.#enabledSystems.has('memory-usage')) {
      this.#setupMemoryUsage();
    }

    if (this.#enabledSystems.has('fps')) {
      this.#setupFPSMonitoring();
    }

    if (this.#enabledSystems.has('window')) {
      this.#setupWindowMonitoring();
    }
    if (this.#enabledSystems.has('screen')) {
      this.#updateScreenMetrics();
    }

    // Hardware initialization:
    // Triggers if 'device' (memory), 'cpu', or 'gpu' is explicitly requested.
    const hasHardwareRequested =
      this.#enabledSystems.has('device') ||
      this.#enabledSystems.has('cpu') ||
      this.#enabledSystems.has('gpu');

    if (hasHardwareRequested) {
      this.#setupDeviceMetrics();
    }

    // Performance logic:
    // If 'performance' is enabled, we enable all performance observers.
    // Otherwise, we only enable the specific sub-types requested in the systems array.
    /** @type {SystemValue[]} */
    const performanceKeys = ['resource', 'paint', 'navigation', 'layout-shift', 'lcp', 'longtask'];
    const isPerformanceEnabled = this.#enabledSystems.has('performance');
    const hasSpecificPerformanceRequested = performanceKeys.some((key) =>
      this.#enabledSystems.has(key),
    );

    if (isPerformanceEnabled || hasSpecificPerformanceRequested) {
      this.#setupPerformanceObservers(isPerformanceEnabled);
    }
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
   * Returns the current viewport dimensions.
   * @returns {Readonly<WindowMetrics>} A deep clone of the window metrics.
   */
  get windowMetrics() {
    checkDestroy(this.#isDestroyed);
    return Object.freeze({ ...this.#windowMetrics });
  }

  /**
   * Returns the current screen/monitor properties.
   * @returns {Readonly<ScreenMetrics>} A deep clone of the screen metrics.
   */
  get screenMetrics() {
    checkDestroy(this.#isDestroyed);
    return Object.freeze({ ...this.#screenMetrics });
  }

  /**
   * Returns the current device hardware metrics.
   * @returns {Readonly<DeviceMetrics>} A deep clone of the device metrics.
   */
  get device() {
    checkDestroy(this.#isDestroyed);
    return Object.freeze({ ...this.#deviceMetrics });
  }

  /** @type {FrameRateMetrics} */
  get fps() {
    checkDestroy(this.#isDestroyed);
    return Object.freeze({ ...this.#fps });
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
      fps: Object.freeze({ ...this.#performance.fps }),
      navigation: this.#performance.navigation
        ? Object.freeze({ ...this.#performance.navigation })
        : null,
    });
  }

  get memoryUsage() {
    checkDestroy(this.#isDestroyed);
    return Object.freeze({ ...this.#memoryUsage });
  }

  /**
   * Returns an array of all currently enabled systems.
   * @returns {Readonly<SystemValue[]>} A read-only array of enabled system identifiers.
   */
  get enabledSystems() {
    checkDestroy(this.#isDestroyed);
    return Object.freeze([...this.#enabledSystems]);
  }

  /**
   * Checks if a specific system is currently enabled.
   * @param {SystemValue} system - The identifier of the system to check.
   * @returns {boolean} True if the system is enabled, false otherwise.
   * @throws {TypeError} If the provided system is not a string.
   */
  has(system) {
    checkDestroy(this.#isDestroyed);
    if (typeof system !== 'string') {
      throw new TypeError('The system identifier must be a string.');
    }
    return this.#enabledSystems.has(system);
  }

  /**
   * Returns the number of currently enabled systems.
   * @returns {number} The count of enabled systems.
   */
  get size() {
    checkDestroy(this.#isDestroyed);
    return this.#enabledSystems.size;
  }

  /**
   * Formats the current memory usage metrics into a human-readable string.
   * @param {MemoryFormat} format - The desired unit for the output.
   * @returns {MemoryHumanData} A formatted string containing used, total, and limit memory.
   * @throws {TypeError} If the provided format is not one of: 'bytes', 'KB', 'MB', 'GB'.
   */
  getFormattedMemoryUsage(format) {
    checkDestroy(this.#isDestroyed);

    const validFormats = ['bytes', 'KB', 'MB', 'GB'];
    if (typeof format !== 'string' || !validFormats.includes(format)) {
      throw new TypeError(
        `Invalid format: "${format}". Must be one of: ${validFormats.join(', ')}`,
      );
    }

    const units = {
      bytes: 1,
      KB: 1024,
      MB: Math.pow(1024, 2),
      GB: Math.pow(1024, 3),
    };

    const divisor = units[format];

    /** @type {(value: number) => number} */
    const formatValue = (value) => value / divisor;

    return {
      used: formatValue(this.#memoryUsage.usedJSHeapSize),
      total: formatValue(this.#memoryUsage.totalJSHeapSize),
      limit: formatValue(this.#memoryUsage.jsHeapSizeLimit),
    };
  }

  /**
   * Initializes window size monitoring by listening to resize events.
   */
  #setupWindowMonitoring() {
    window.addEventListener('resize', this.#handleWindowResize);
    this.#updateWindowMetrics();
  }

  /**
   * Updates the window metrics based on the current viewport state.
   */
  #updateWindowMetrics() {
    this.#windowMetrics = {
      width: window.innerWidth,
      height: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
    };
  }

  /**
   * Updates the screen metrics.
   */
  #updateScreenMetrics() {
    this.#screenMetrics = {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      colorDepth: window.screen.colorDepth,
      pixelDepth: window.screen.pixelDepth,
      orientation: window.screen.orientation?.type || 'unknown',
    };
  }

  /**
   * Event handler for window resize events.
   * @bind {TinyBrowserMonitor}
   */
  #handleWindowResize = () => {
    this.#updateWindowMetrics();
    this.emit('WindowResize', Object.freeze({ ...this.#windowMetrics }));
  };

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
   * Initializes FPS monitoring to track rendering performance (GPU/CPU proxy).
   */
  #setupFPSMonitoring() {
    let frameCount = 0;
    let lastTime = performance.now();

    /** @param {number} currentTime */
    const loop = (currentTime) => {
      frameCount++;

      // Update metrics every 1 second
      if (currentTime - lastTime >= 1000) {
        this.#fps = {
          fps: Math.round((frameCount * 1000) / (currentTime - lastTime)),
          timestamp: currentTime,
        };
        frameCount = 0;
        lastTime = currentTime;
        this.emit('FPS', Object.freeze({ ...this.#fps }));
      }

      this.#fpsRequestId = requestAnimationFrame(loop);
    };

    this.#fpsRequestId = requestAnimationFrame(loop);
  }

  /**
   * Initializes hardware-specific metrics based on enabled systems.
   */
  #setupDeviceMetrics() {
    // Initialize with default/empty values to maintain structure
    this.#deviceMetrics = {
      memory: 0,
      cpu: { logicalCores: 0 },
      gpu: { vendor: 'unknown', renderer: 'unknown' },
      enabled: false,
    };

    let anyDataRetrieved = false;
    if (this.#enabledSystems.has('device')) {
      // 1. Memory (via 'device' permission)
      if (typeof navigator.deviceMemory === 'number') {
        this.#deviceMetrics.memory = navigator.deviceMemory;
        anyDataRetrieved = true;
      }

      // 2. CPU (via 'cpu' or 'device' permission)
      if (this.#enabledSystems.has('cpu')) {
        if (typeof navigator.hardwareConcurrency === 'number') {
          this.#deviceMetrics.cpu.logicalCores = navigator.hardwareConcurrency;
          anyDataRetrieved = true;
        }
      }

      // 3. GPU (via 'gpu' or 'device' permission)
      if (this.#enabledSystems.has('gpu')) {
        try {
          const canvas = document.createElement('canvas');
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

          if (gl instanceof WebGLRenderingContext) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
              this.#deviceMetrics.gpu.vendor =
                gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || 'unknown';
              this.#deviceMetrics.gpu.renderer =
                gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || 'unknown';
              anyDataRetrieved = true;
            }
          }
        } catch (e) {
          console.warn('TinyBrowserMonitor: GPU retrieval failed.', e);
        }
      }
    }

    this.#deviceMetrics.enabled = anyDataRetrieved;
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
          this.emit('BatteryUpdated', Object.freeze({ ...this.#battery }));
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
   * Initializes memory monitoring using the Performance Memory API.
   */
  #setupMemoryUsage() {
    const memory = performance.memory;
    if (memory) {
      const updateMemory = () => {
        this.#memoryUsage = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          enabled: true,
        };
        this.emit('MemoryUsage', Object.freeze({ ...this.#memoryUsage }));
      };

      // Since performance.memory is not event-driven, we poll it periodically.
      // We use a standard interval to check for changes.
      this.#memoryInterval = setInterval(updateMemory, this.#memoryIntervalMs);
      updateMemory();
    }
  }

  /**
   * Initializes and starts PerformanceObservers based on enabled systems.
   * @param {boolean} [enableAll=false] - If true, enables all performance observers.
   */
  #setupPerformanceObservers(enableAll = false) {
    /** @type {({ key: SystemValue; type: string; callback: (list: PerformanceObserverEntryList) => void; })[]} */
    const observerMapping = [
      { key: 'resource', type: 'resource', callback: this.#handleResourceEntry.bind(this) },
      { key: 'paint', type: 'paint', callback: this.#handlePaintEntry.bind(this) },
      { key: 'navigation', type: 'navigation', callback: this.#handleNavigationEntry.bind(this) },
      {
        key: 'layout-shift',
        type: 'layout-shift',
        callback: this.#handleLayoutShiftEntry.bind(this),
      },
      { key: 'lcp', type: 'largest-contentful-paint', callback: this.#handleLCPEntry.bind(this) },
      { key: 'longtask', type: 'longtask', callback: this.#handleLongTaskEntry.bind(this) },
    ];

    for (const config of observerMapping) {
      if (enableAll || this.#enabledSystems.has(config.key)) {
        try {
          const observer = new PerformanceObserver(config.callback);
          observer.observe({ type: config.type, buffered: true });
          this.#observers.push(observer);
        } catch (e) {
          console.error(e);
          // Silently skip unsupported observer types
        }
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
    this.emit('PaintUpdated', Object.freeze({ ...this.#performance.paint }));
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
    this.emit('NavigationUpdated', Object.freeze({ ...this.#performance.navigation }));
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
    this.emit('LayoutShiftUpdated', { layoutShift: this.#performance.layoutShift });
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
    this.emit('LcpUpdated', { lcp: this.#performance.lcp });
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
    this.emit('LongTaskUpdated', { lcp: [...this.#performance.longTasks] });
    this.#notify();
  }

  /**
   * Internal handler for network events.
   * @param {Event} event - The browser event object.
   * @bind {TinyBrowserMonitor}
   */
  #handleUpdate = (event) => {
    if (this.#enabledSystems.has('connectivity')) {
      this.#updateConnectivity();
    }
    if (this.#enabledSystems.has('quality')) {
      this.#updateQualityMetrics();
    }
    this.#notify(event);
  };

  /**
   * Updates the connectivity status.
   */
  #updateConnectivity() {
    this.#connectivity = { isOnline: navigator.onLine };
    this.emit('ConnectivityUpdated', { ...this.#connectivity });
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
      memoryUsage: Object.freeze({ ...this.#memoryUsage }),
      windowMetrics: Object.freeze({ ...this.#windowMetrics }),
      screenMetrics: Object.freeze({ ...this.#screenMetrics }),
      event,
    };

    this.emit('NetworkUpdated', data);
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

    if (this.#enabledSystems.has('connectivity')) {
      window.removeEventListener('online', this.#handleUpdate);
      window.removeEventListener('offline', this.#handleUpdate);
    }

    if (this.#enabledSystems.has('window')) {
      window.removeEventListener('resize', this.#handleWindowResize);
    }

    if (this.#enabledSystems.has('quality') && navigator.connection) {
      navigator.connection.removeEventListener('change', this.#handleUpdate);
    }

    if (this.#enabledSystems.has('performance')) {
      this.#observers.forEach((obs) => obs.disconnect());
      this.#observers = [];
    }

    if (this.#memoryInterval) clearInterval(this.#memoryInterval);
    if (this.#fpsRequestId) {
      cancelAnimationFrame(this.#fpsRequestId);
    }
    this.removeAllListeners();
    this.#isDestroyed = true;
    this.emit('Destroyed');
  }
}

export default TinyBrowserMonitor;
