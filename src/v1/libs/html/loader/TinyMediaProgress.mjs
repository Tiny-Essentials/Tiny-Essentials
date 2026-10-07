/**
 * @fileoverview Tracks byte-level progress for a media download. It is a plain
 * value object: the loader pushes chunks in and reads snapshots out.
 */

/**
 * @typedef {Object} MediaProgressSnapshot
 * @property {number} loaded - The number of bytes downloaded so far.
 * @property {number} total - The total number of bytes (0 when unknown).
 * @property {number} remaining - The number of bytes left to download.
 * @property {number} percent - The completion percentage between 0 and 100.
 * @property {number} rate - The smoothed download rate in bytes per second.
 * @property {number} elapsed - The elapsed time in milliseconds.
 * @property {number} eta - The estimated time remaining in milliseconds.
 * @property {number} chunks - The number of chunks received so far.
 */

/**
 * Accumulates download chunks and derives rate, ETA and percentage.
 */
class TinyMediaProgress {
  /** @type {number} */
  #total;
  /** @type {number} */
  #loaded = 0;
  /** @type {number} */
  #chunks = 0;
  /** @type {number} */
  #startTime = 0;
  /** @type {number} */
  #lastTime = 0;
  /** @type {number} */
  #lastLoaded = 0;
  /** @type {number} */
  #rate = 0;

  /**
   * @param {number} [total] - The total number of bytes (0 when unknown).
   * @throws {RangeError} If `total` is not a positive number.
   */
  constructor(total = 0) {
    if (typeof total !== 'number' || Number.isNaN(total) || total < 0) {
      throw new RangeError('The "total" argument must be a positive number.');
    }
    this.#total = total;
  }

  /**
   * The total number of bytes (0 when unknown).
   * @returns {number}
   */
  get total() {
    return this.#total;
  }

  /**
   * @param {number} value - The new total in bytes.
   * @throws {RangeError} If `value` is not a positive number.
   */
  set total(value) {
    if (typeof value !== 'number' || Number.isNaN(value) || value < 0) {
      throw new RangeError('The "total" value must be a positive number.');
    }
    this.#total = value;
  }

  /**
   * @returns {number} The number of bytes downloaded so far.
   */
  get loaded() {
    return this.#loaded;
  }

  /**
   * @returns {number} The number of bytes left to download.
   */
  get remaining() {
    return this.#total > 0 ? Math.max(0, this.#total - this.#loaded) : 0;
  }

  /**
   * @returns {number} The completion percentage between 0 and 100.
   */
  get percent() {
    return this.#total > 0 ? Math.min(100, (this.#loaded / this.#total) * 100) : 0;
  }

  /**
   * @returns {number} The smoothed download rate in bytes per second.
   */
  get rate() {
    return this.#rate;
  }

  /**
   * @returns {number} The number of chunks received so far.
   */
  get chunks() {
    return this.#chunks;
  }

  /**
   * @returns {number} The elapsed time in milliseconds.
   */
  get elapsed() {
    return this.#startTime === 0 ? 0 : performance.now() - this.#startTime;
  }

  /**
   * @returns {number} The estimated time remaining in milliseconds.
   */
  get eta() {
    if (this.#rate <= 0 || this.#total <= 0) {
      return 0;
    }
    return (this.remaining / this.#rate) * 1000;
  }

  /**
   * Marks the start of the download.
   * @returns {TinyMediaProgress} The current instance for chaining.
   */
  start() {
    this.#startTime = performance.now();
    this.#lastTime = this.#startTime;
    return this;
  }

  /**
   * Registers a new chunk and updates the smoothed rate.
   * @param {number} bytes - The size of the chunk in bytes.
   * @returns {TinyMediaProgress} The current instance for chaining.
   * @throws {RangeError} If `bytes` is not a positive number.
   */
  push(bytes) {
    if (typeof bytes !== 'number' || Number.isNaN(bytes) || bytes < 0) {
      throw new RangeError('The "bytes" argument must be a positive number.');
    }
    const now = performance.now();
    this.#loaded += bytes;
    this.#chunks += 1;
    const deltaTime = now - this.#lastTime;
    if (deltaTime > 0) {
      const instantRate = ((this.#loaded - this.#lastLoaded) / deltaTime) * 1000;
      this.#rate = this.#rate === 0 ? instantRate : this.#rate * 0.7 + instantRate * 0.3;
    }
    this.#lastTime = now;
    this.#lastLoaded = this.#loaded;
    return this;
  }

  /**
   * @returns {MediaProgressSnapshot} An immutable snapshot of the current state.
   */
  snapshot() {
    return {
      loaded: this.#loaded,
      total: this.#total,
      remaining: this.remaining,
      percent: this.percent,
      rate: this.#rate,
      elapsed: this.elapsed,
      eta: this.eta,
      chunks: this.#chunks,
    };
  }
}

export default TinyMediaProgress;
