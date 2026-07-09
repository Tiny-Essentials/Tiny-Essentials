import { createCheckDestroyed } from './utils.mjs';

const checkDestroy = createCheckDestroyed('TinyElementObserver');

/**
 * Callback type used for element mutation detectors.
 *
 * @callback ElementDetectorsFn
 * @param {MutationRecord} mutation - Single mutation record being processed.
 * @param {number} index - Index of the current mutation in the batch.
 * @param {MutationRecord[]} mutations - Full list of mutation records from the observer callback.
 * @returns {void}
 */

/**
 * TinyElementObserver
 *
 * A utility class for tracking DOM element mutations.
 * It leverages the native MutationObserver API, providing a higher-level abstraction
 * with a system of configurable detectors that can dispatch custom events or run custom logic.
 * @template {Element} HTMLElement
 */
class TinyElementObserver {
  /**
   * Tracks whether the instance has been destroyed.
   * @type {boolean}
   */
  #destroyed = false;

  /**
   * Gets the current destruction status of the instance.
   *
   * @returns {boolean} True if the instance is destroyed, false otherwise.
   */
  get destroyed() {
    return this.#destroyed;
  }

  /** @type {HTMLElement} */
  #el;

  /**
   * Get the current element being observed.
   * @returns {HTMLElement} The DOM element being tracked, or `undefined` if none is set.
   */
  get el() {
    checkDestroy(this.#destroyed);
    return this.#el;
  }

  /**
   * Configuration settings for the MutationObserver instance.
   *
   * @type {MutationObserverInit}
   */
  #settings = {};

  /**
   * Get the observer settings.
   * @returns {MutationObserverInit}
   */
  get settings() {
    checkDestroy(this.#destroyed);
    return this.#settings;
  }

  /**
   * Set the observer settings.
   * @param {MutationObserverInit} settings
   */
  set settings(settings) {
    checkDestroy(this.#destroyed);
    if (typeof settings !== 'object' || settings === null)
      throw new TypeError('settings must be a non-null object.');
    this.#settings = settings;
  }

  /**
   * Internal MutationObserver instance that tracks DOM attribute changes.
   * @type {MutationObserver|null}
   */
  #observer = null;

  /**
   * Get the current MutationObserver instance.
   * @returns {MutationObserver|null}
   */
  get observer() {
    checkDestroy(this.#destroyed);
    return this.#observer;
  }

  /**
   * List of detectors executed on observed mutations.
   * Each detector is a tuple:
   * - name: string identifier
   * - handler: function processing MutationRecords
   *
   * @type {Array<[string, ElementDetectorsFn]>}
   */
  #detectors = [];

  /**
   * Get the element detectors.
   * @returns {Array<[string, ElementDetectorsFn]>}
   */
  get detectors() {
    checkDestroy(this.#destroyed);
    return this.#detectors.map((item) => [item[0], item[1]]);
  }

  /**
   * Set the element detectors.
   * @param {Array<[string, ElementDetectorsFn]>} detectors
   */
  set detectors(detectors) {
    checkDestroy(this.#destroyed);
    if (!Array.isArray(detectors)) throw new TypeError('detectors must be an array.');

    /** @type {Array<[string, ElementDetectorsFn]>} */
    const values = [];
    for (const [name, fn] of detectors) {
      if (typeof name !== 'string') throw new TypeError('Detector name must be a string.');
      if (typeof fn !== 'function')
        throw new TypeError(`Detector handler for "${name}" must be a function.`);
      values.push([name, fn]);
    }
    this.#detectors = values;
  }

  /**
   * Returns true if a MutationObserver is currently active.
   * @returns {boolean}
   */
  get isActive() {
    checkDestroy(this.#destroyed);
    return !!this.#observer;
  }

  /**
   * Get the number of registered detectors.
   *
   * @returns {number} Total count of detectors.
   */
  get size() {
    checkDestroy(this.#destroyed);
    return this.#detectors.length;
  }

  /**
   * Create a new TinyElementObserver instance.
   *
   * @param {HTMLElement} el - Set the target element to be observed.
   * @param {Object} [settings={}] - Configuration object.
   * @param {Array<[string, ElementDetectorsFn]>} [settings.initDetectors=[]] - Optional initial detectors to register.
   * @param {MutationObserverInit} [settings.initCfg] - Optional MutationObserver configuration.
   */
  constructor(el, { initDetectors = [], initCfg = {} } = {}) {
    this.#el = el;
    if (initDetectors.length) this.detectors = initDetectors;
    if (initCfg) this.settings = initCfg;
  }

  /**
   * Remove all registered detectors.
   * After calling this, no mutation events will be processed
   * until new detectors are added again.
   */
  clear() {
    checkDestroy(this.#destroyed);
    this.#detectors = [];
  }

  /**
   * Start tracking DOM mutations on the defined element.
   *
   * @throws {Error} If no element has been set to observe.
   */
  start() {
    checkDestroy(this.#destroyed);
    if (!this.#el) throw new Error('Cannot start observation: no target element has been set.');
    if (this.#observer) return;
    this.#observer = new MutationObserver((mutations) => {
      mutations.forEach((value, index, array) =>
        this.#detectors.forEach((item) => item[1](value, index, array)),
      );
    });

    this.#observer.observe(this.#el, this.#settings);
  }

  /**
   * Stop tracking changes.
   */
  stop() {
    checkDestroy(this.#destroyed);
    if (!this.#observer) return;
    this.#observer.disconnect();
    this.#observer = null;
  }

  // ================= Detectors Editor =================

  /**
   * Add a detector to the end of the array.
   * @param {string} name
   * @param {ElementDetectorsFn} handler
   */
  add(name, handler) {
    checkDestroy(this.#destroyed);
    this.#validateDetector(name, handler);
    this.#detectors.push([name, handler]);
  }

  /**
   * Add a detector to the start of the array.
   * @param {string} name
   * @param {ElementDetectorsFn} handler
   */
  insertAtStart(name, handler) {
    checkDestroy(this.#destroyed);
    this.#validateDetector(name, handler);
    this.#detectors.unshift([name, handler]);
  }

  /**
   * Insert a detector at a specific index.
   * @param {number} index
   * @param {string} name
   * @param {ElementDetectorsFn} handler
   * @param {'before'|'after'} position - Position relative to the index
   */
  insertAt(index, name, handler, position = 'after') {
    checkDestroy(this.#destroyed);
    this.#validateDetector(name, handler);
    if (typeof index !== 'number' || index < 0 || index >= this.#detectors.length)
      throw new RangeError('Invalid index for insertDetectorAt.');
    const insertIndex = position === 'before' ? index : index + 1;
    this.#detectors.splice(insertIndex, 0, [name, handler]);
  }

  /**
   * Remove a detector at a specific index.
   * @param {number} index
   */
  removeAt(index) {
    checkDestroy(this.#destroyed);
    if (typeof index !== 'number' || index < 0 || index >= this.#detectors.length)
      throw new RangeError('Invalid index for removeDetectorAt.');
    this.#detectors.splice(index, 1);
  }

  /**
   * Remove detectors relative to a specific index.
   * @param {number} index - Reference index
   * @param {number} before - Number of items before the index to remove
   * @param {number} after - Number of items after the index to remove
   */
  removeAround(index, before = 0, after = 0) {
    checkDestroy(this.#destroyed);
    if (typeof index !== 'number' || index < 0 || index >= this.#detectors.length)
      throw new RangeError('Invalid index for removeDetectorsAround.');
    const start = Math.max(0, index - before);
    const deleteCount = before + 1 + after;
    this.#detectors.splice(start, deleteCount);
  }

  /**
   * Check if a detector exists at a specific index.
   * @param {number} index
   * @returns {boolean}
   */
  isIndexUsed(index) {
    checkDestroy(this.#destroyed);
    return index >= 0 && index < this.#detectors.length;
  }

  /**
   * Check if a handler function already exists in the array.
   * @param {ElementDetectorsFn} handler
   * @returns {boolean}
   */
  hasHandler(handler) {
    checkDestroy(this.#destroyed);
    if (typeof handler !== 'function') throw new TypeError('Handler must be a function.');
    return this.#detectors.some(([_, fn]) => fn === handler);
  }

  /**
   * Internal validation for detector entries.
   * @param {string} name
   * @param {ElementDetectorsFn} handler
   */
  #validateDetector(name, handler) {
    if (typeof name !== 'string' || !name.trim())
      throw new TypeError('Detector name must be a non-empty string.');
    if (typeof handler !== 'function')
      throw new TypeError(`Detector handler for "${name}" must be a function.`);
  }

  /**
   * Completely destroy this observer instance.
   * Stops the MutationObserver (if active) and clears all detectors,
   * leaving the instance unusable until reconfigured.
   */
  destroy() {
    if (this.#destroyed) return;
    this.stop();
    this.clear();
    this.#destroyed = true;
  }
}

export default TinyElementObserver;
