import { EventEmitter } from 'events';
import { isValidObj } from '../basics/objChecker.mjs';

/**
 * A lightweight debugging utility that wraps console methods and provides event emission.
 * @extends EventEmitter
 */
class TinyDebugger extends EventEmitter {
  /** @type {Partial<Console>} */
  #logger;

  /** @type {string} */
  #logId;

  /** @type {boolean} */
  #canEmitLogs;

  /** @type {boolean} */
  #debugMode;

  /** @type {boolean} */
  #useLogColors;

  /**
   * Colors (ANSI Escape Codes)
   * @type {Map<string, string>}
   */
  #colorMap = new Map([
    // Log types mapping (for automatic usage)
    ['log', '\x1b[37m'], // White
    ['info', '\x1b[36m'], // Cyan
    ['warn', '\x1b[33m'], // Yellow
    ['error', '\x1b[31m'], // Red
    ['debug', '\x1b[35m'], // Magenta
    ['reset', '\x1b[0m'], // Reset

    // Color names mapping (for manual usage via _color_)
    ['black', '\x1b[30m'],
    ['red', '\x1b[31m'],
    ['green', '\x1b[32m'],
    ['yellow', '\x1b[33m'],
    ['blue', '\x1b[34m'],
    ['magenta', '\x1b[35m'],
    ['cyan', '\x1b[36m'],
    ['white', '\x1b[37m'],
    ['gray', '\x1b[90m'],
  ]);

  /**
   * Prefixes
   * @type {Map<string, string>}
   */
  #prefixMap = new Map([
    ['log', '[_log_LOG_reset_]'],
    ['info', '[_info_INFO_reset_]'],
    ['warn', '[_warn_WARN_reset_]'],
    ['error', '[_error_ERROR_reset_]'],
    ['debug', '[_debug_DEBUG_reset_]'],
  ]);

  /**
   * Creates an instance of TinyDebugger.
   * @param {Object} config - The configuration object.
   * @param {Partial<Console>} config.logger - A custom logger (must implement Console methods).
   * @param {string} config.id - The unique identifier for this debugger instance.
   * @param {boolean} config.debugMode - Whether to enable internal debug logging.
   * @param {boolean} [config.canEmitLogs=false] - Whether to emit debug events to listeners.
   * @param {boolean} [config.useLogColors=false] - Whether to enable log color support.
   * @throws {TypeError} If parameters do not match the required types.
   */
  constructor({ logger, id, debugMode, canEmitLogs = false, useLogColors = false }) {
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
    if (typeof useLogColors !== 'boolean') {
      throw new TypeError('useLogColors must be a boolean.');
    }

    this.#logId = id;
    this.#logger = logger;
    this.#debugMode = debugMode;
    this.#canEmitLogs = canEmitLogs;
    this.#useLogColors = useLogColors;

    this.log('info', `Emit logs of debug mode set to: ${this.#debugMode ? 'ON' : 'OFF'}`);
    this.log('info', 'Custom logger assigned.');
  }

  /**
   * @returns {string} The instance debug id.
   */
  get logId() {
    return this.#logId;
  }

  /**
   * @returns {boolean} Whether event emission is enabled.
   */
  get canEmitLogs() {
    return this.#canEmitLogs;
  }

  /**
   * @returns {boolean} True if log colors mode is enabled.
   */
  get useLogColors() {
    return this.#useLogColors;
  }

  /**
   * @param {boolean} value - Enables or disables log colors mode.
   * @throws {TypeError} If the value is not a boolean.
   */
  set useLogColors(value) {
    if (typeof value !== 'boolean') {
      throw new TypeError('useLogColors must be a boolean.');
    }
    this.#useLogColors = value;
    this.log('info', `Log Colors usage mode set to: ${this.#useLogColors ? 'ON' : 'OFF'}`);
    this.emit('setDebugMode', value);
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
   * Adds a new color shortcut.
   * @param {string} id - The shortcut ID (e.g., 'red').
   * @param {string} code - The replacement string (e.g., ANSI code).
   */
  _addLogColor(id, code) {
    this.#colorMap.set(id, code);
  }

  /**
   * Removes a color shortcut.
   * @param {string} id - The shortcut ID to remove.
   */
  _removeLogColor(id) {
    this.#colorMap.delete(id);
  }

  /**
   * Adds a new prefix shortcut.
   * @param {string} id - The shortcut ID (e.g., 'info').
   * @param {string} text - The text to insert (e.g., '[INFO]').
   */
  _addLogPrefix(id, text) {
    this.#prefixMap.set(id, text);
  }

  /**
   * Removes a prefix shortcut.
   * @param {string} id - The shortcut ID to remove.
   */
  _removeLogPrefix(id) {
    this.#prefixMap.delete(id);
  }

  /**
   * Internal method to apply prefix and color replacements.
   * @param {string} text - The text to format.
   * @returns {string} The formatted text.
   */
  #applyFormatting(text) {
    if (typeof text !== 'string') return text;
    let result = text;

    // 1. Apply Prefixes first
    for (const [id, value] of this.#prefixMap) {
      const regex = new RegExp(`\\:${id}\\:`, 'g');
      result = result.replace(regex, value);
    }

    // 2. Apply Color shortcuts second
    for (const [id, value] of this.#colorMap) {
      const regex = new RegExp(`\\_${id}\\_`, 'g');
      result = result.replace(regex, this.#useLogColors ? value : '');
    }

    return result;
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

    let prefix = this.#logId;
    let formattedMessage = message;

    prefix = this.#applyFormatting(prefix);
    formattedMessage = this.#applyFormatting(formattedMessage);

    const logFunc = this.#logger[logType] ? this.#logger[logType] : console[logType];

    if (logFunc) {
      if (this.#canEmitLogs) this.emit('debug:log', prefix, formattedMessage, ...args);
      return logFunc(prefix, formattedMessage, ...args);
    } else {
      if (this.#canEmitLogs) this.emit('debug:log', prefix, formattedMessage, ...args);
      return console.log(prefix, formattedMessage, ...args);
    }
  }
}

export default TinyDebugger;
