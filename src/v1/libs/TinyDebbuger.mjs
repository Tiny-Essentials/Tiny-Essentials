import { EventEmitter } from 'events';
import { isValidObj } from '../basics/objChecker.mjs';

/**
 * A lightweight debugging utility that wraps console methods and provides event emission.
 * @extends EventEmitter
 */
class TinyDebbuger extends EventEmitter {
  /**
   * Creates an instance of TinyDebbuger.
   * @param {Object} config - The configuration object.
   * @param {Partial<Console>} config.logger - A custom logger (must implement Console methods).
   * @param {string} config.id - The unique identifier for this debugger instance.
   * @param {boolean} config.debugMode - Whether to enable internal debug logging.
   * @param {boolean} [config.canEmitLogs=false] - Whether to emit debug events to listeners.
   * @throws {TypeError} If logger is not an object, id is not a string, debugMode is not a boolean, or canEmitLogs is not a boolean.
   */
  constructor({ logger, id, debugMode, canEmitLogs = false }) {
    super();
    if (!isValidObj(logger)) {
      throw new TypeError('Logger must be an object that implements the Console interface.');
    }
    if (typeof id !== 'string') {
      throw new TypeError('Logger instance id must be a string.');
    }
    if (typeof debugMode !== 'boolean') {
      throw new TypeError('debugMode must be a boolean.');
    }
    if (typeof canEmitLogs !== 'boolean') {
      throw new TypeError('canEmitLogs must be a boolean.');
    }

    this.#instanceId = id;
    this.#logger = logger;
    this.debugMode = debugMode;
    this.#canEmitLogs = canEmitLogs;

    this.log('info', `Emit logs of debug mode set to: ${this.#debugMode ? 'ON' : 'OFF'}`);
    this.log('info', 'Custom logger assigned.');
  }

  /** @type {Partial<Console>} */
  #logger;

  /** @type {string} */
  #instanceId;

  /** @type {boolean} */
  #canEmitLogs = false;

  /** @type {boolean} */
  #debugMode = false;

  /**
   * @returns {string} The instance debug id.
   */
  get instanceId() {
    return this.#instanceId;
  }

  /**
   * @returns {boolean} Whether event emission is enabled.
   */
  get canEmitLogs() {
    return this.#canEmitLogs;
  }

  /**
   * @returns {boolean} True if debug mode is enabled.
   */
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

  /**
   * Clears the console.
   * @returns {void|undefined}
   */
  logClear() {
    if (!this.#debugMode) return;
    if (this.#canEmitLogs) this.emit('debug:clear');
    return this.#logger.clear ? this.#logger.clear() : console.clear();
  }

  /**
   * Ends the current console group.
   * @returns {void|undefined}
   */
  logGroupEnd() {
    if (!this.#debugMode) return;
    if (this.#canEmitLogs) this.emit('debug:groupEnd');
    return this.#logger.groupEnd ? this.#logger.groupEnd() : console.groupEnd();
  }

  /**
   * Logs a specific console type with an optional label.
   * @param {'count' | 'countReset' | 'time' | 'timeEnd' | 'profile' | 'profileEnd' | 'timeStamp'} logType - The console method to use.
   * @param {string} [label] - The label to associate with the log.
   * @throws {TypeError} If the specified logType is not supported or label is not a string.
   * @returns {void}
   */
  logLabel(logType, label) {
    if (!this.#debugMode) return;

    const validTypes = [
      'count',
      'countReset',
      'time',
      'timeEnd',
      'profile',
      'profileEnd',
      'timeStamp',
    ];
    if (!validTypes.includes(logType)) {
      throw new TypeError(`Invalid logType. Expected one of: ${validTypes.join(', ')}`);
    }

    if (label !== undefined && typeof label !== 'string') {
      throw new TypeError('The label must be a string.');
    }

    const log = this.#logger[logType] ? this.#logger[logType] : console[logType];
    if (!log)
      throw new TypeError(
        `The log type "${logType}" is not supported by the provided logger or console.`,
      );

    if (this.#canEmitLogs) this.emit('debug:logLabel', logType, label);
    return log(label);
  }

  /**
   * Starts a timer with a label.
   * @param {string} label - The label for the timer.
   * @param {...any} args - Additional arguments for the timer.
   * @throws {TypeError} If label is not a string.
   * @returns {void}
   */
  logTimeLabel(label, ...args) {
    if (!this.#debugMode) return;
    if (this.#canEmitLogs) this.emit('debug:timeLog', label, ...args);
    return this.#logger.timeLog
      ? this.#logger.timeLog(label, ...args)
      : console.timeLog(label, ...args);
  }

  /**
   * Asserts a condition and logs a message if the condition is false.
   * @param {boolean} condition - The condition to evaluate.
   * @param {...any} args - Arguments to log if the condition is false.
   * @returns {void}
   */
  logAssert(condition, ...args) {
    if (!this.#debugMode) return;
    if (this.#canEmitLogs) this.emit('debug:assert', condition, ...args);
    return this.#logger.assert
      ? this.#logger.assert(condition, ...args)
      : console.assert(condition, ...args);
  }

  /**
   * Logs an element as a JavaScript object.
   * @param {any} item - The object to inspect.
   * @param {import('util').InspectOptions} [options] - Inspection options.
   * @returns {void}
   */
  logDir(item, options) {
    if (!this.#debugMode) return;
    if (this.#canEmitLogs) this.emit('debug:dir', item, options);
    return this.#logger.dir ? this.#logger.dir(item, options) : console.dir(item, options);
  }

  /**
   * Displays a table of objects.
   * @param {any} tabularData - The data to be displayed in a table.
   * @param {string[]} [properties] - The properties (columns) to display.
   * @throws {TypeError} If properties is provided but is not an array of strings.
   * @returns {void}
   */
  logTable(tabularData, properties) {
    if (!this.#debugMode) return;
    if (properties !== undefined) {
      if (!Array.isArray(properties) || !properties.every((p) => typeof p === 'string')) {
        throw new TypeError('Properties must be an array of strings.');
      }
    }

    if (this.#canEmitLogs) this.emit('debug:table', tabularData, properties);
    return this.#logger.table
      ? this.#logger.table(tabularData, properties)
      : console.table(tabularData, properties);
  }

  /**
   * Internal helper to handle debug logging.
   * @param {'log' | 'info' | 'warn' | 'error' | 'debug' | 'dirxml' | 'group' | 'groupCollapsed' | 'trace'} logType - The console method to use.
   * @param {string} message - The message to log.
   * @param {...any} args - Additional arguments to pass to the logger.
   * @throws {TypeError} If logType is invalid or message is not a string.
   * @returns {void}
   */
  log(logType, message, ...args) {
    if (!this.#debugMode) return;

    const validTypes = [
      'log',
      'info',
      'warn',
      'error',
      'debug',
      'dirxml',
      'group',
      'groupCollapsed',
      'trace',
    ];
    if (!validTypes.includes(logType)) {
      throw new TypeError(`Invalid logType. Expected one of: ${validTypes.join(', ')}`);
    }
    if (typeof message !== 'string') {
      throw new TypeError('The message must be a string.');
    }

    const prefix = this.#instanceId;
    const log = this.#logger[logType] ? this.#logger[logType] : console[logType];

    if (log) {
      if (this.#canEmitLogs) this.emit('debug:log', prefix, message, ...args);
      return log(logType, prefix, message, ...args);
    } else {
      if (this.#canEmitLogs) this.emit('debug:log', prefix, message, ...args);
      return console.log(logType, prefix, message, ...args);
    }
  }
}

export default TinyDebbuger;
