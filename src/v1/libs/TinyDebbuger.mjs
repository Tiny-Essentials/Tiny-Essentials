import { EventEmitter } from 'events';
import { isValidObj } from '../basics/objChecker.mjs';

class TinyDebbuger extends EventEmitter {
  /**
   * @param {Object} config
   * @param {Partial<Console>} config.logger - A custom logger (must implement console methods).
   * @param {string} config.id - The debugger id.
   * @param {boolean} config.debugMode -  Whether to enable internal debug logging.
   * @throws {TypeError} If the value is not an object with a log method.
   */
  constructor({ logger, id, debugMode }) {
    super();
    if (!isValidObj(logger)) {
      throw new TypeError('Logger must be an object that implements the Console interface.');
    }
    if (typeof id !== 'string') {
      throw new TypeError('Logger instance id must be a string.');
    }
    this.#instanceId = id;
    this.#logger = logger;
    this.debugMode = debugMode;
    this.log('info', 'Custom logger assigned.');
  }

  /** @type {Partial<Console>} */
  #logger;

  /** @type {string} */
  #instanceId;

  /** @returns {string} The instance debug id. */
  get instanceId() {
    return this.#instanceId;
  }

  /** @type {boolean} */
  #debugMode = false;

  /** @returns {boolean} True if debug mode is enabled. */
  get debugMode() {
    return this.#debugMode;
  }

  /**
   * @param {boolean} value - Enables or disables debug mode.
   * @throws {TypeError} If the value is not a boolean.
   */
  set debugMode(value) {
    if (typeof value !== 'boolean') {
      throw new TypeError('debugMode must be a boolean.');
    }
    this.#debugMode = value;
    this.log('info', `Debug mode set to: ${this.#debugMode ? 'ON' : 'OFF'}`);
    this.emit('setDebugMode', value);
  }

  logClear() {
    if (!this.#debugMode) return;
    return this.#logger.clear ? this.#logger.clear() : console.clear();
  }

  logGroupEnd() {
    if (!this.#debugMode) return;
    return this.#logger.groupEnd ? this.#logger.groupEnd() : console.groupEnd();
  }

  /**
   * @param {'count' | 'countReset' | 'time' | 'timeEnd' | 'profile' | 'profileEnd' | 'timeStamp'} logType - The console type.
   * @param {string} [label]
   */
  logLabel(logType, label) {
    if (!this.#debugMode) return;
    const log = this.#logger[logType] ? this.#logger[logType] : console[logType];
    if (!log) throw new Error('');
    return log(label);
  }

  /**
   * @param {string} [label]
   * @param {...any} args
   */
  logTimeLabel(label, ...args) {
    if (!this.#debugMode) return;
    return this.#logger.timeLog
      ? this.#logger.timeLog(label, ...args)
      : console.timeLog(label, ...args);
  }

  /**
   * @param {any} [condition]
   * @param {...any} args
   */
  logAssert(condition, ...args) {
    if (!this.#debugMode) return;
    return this.#logger.assert
      ? this.#logger.assert(condition, ...args)
      : console.assert(condition, ...args);
  }

  /**
   * @param {any} [item]
   * @param {import('util').InspectOptions} [options]
   */
  logDir(item, options) {
    if (!this.#debugMode) return;
    return this.#logger.dir ? this.#logger.dir(item, options) : console.dir(item, options);
  }

  /**
   * @param {any} [tabularData]
   * @param {string[]} [properties]
   */
  logTable(tabularData, properties) {
    if (!this.#debugMode) return;
    return this.#logger.table
      ? this.#logger.table(tabularData, properties)
      : console.table(tabularData, properties);
  }

  /**
   * Internal helper to handle debug logging.
   * @param {'log' | 'info' | 'warn' | 'error' | 'debug' | 'dirxml' | 'group' | 'groupCollapsed' | 'trace'} logType - The console type.
   * @param {string} message - The message to log.
   * @param {...any} args - Additional arguments to pass to the logger.
   */
  log(logType, message, ...args) {
    if (!this.#debugMode) return;
    const prefix = this.#instanceId;
    const log = this.#logger[logType] ? this.#logger[logType] : console[logType];
    if (log) return log(prefix, message, ...args);
    else {
      // Fallback if the custom logger is missing the specific type
      return console.log(prefix, message, ...args);
    }
  }
}

export default TinyDebbuger;
