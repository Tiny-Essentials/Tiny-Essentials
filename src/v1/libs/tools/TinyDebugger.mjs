import { EventEmitter } from 'events';
import { isValidObj } from '../../basics/objChecker.mjs';
import { browserIs } from '../../basics/browserDetector.mjs';

/**
 * @typedef {Object} DebuggerConstructor
 * @property {Partial<Console>} logger - A custom logger (must implement Console methods).
 * @property {string} id - The unique identifier for this debugger instance.
 * @property {boolean} debugMode - Whether to enable internal debug logging.
 * @property {boolean} [canEmitLogs=false] - Whether to emit debug events to listeners.
 * @property {boolean} [useLogColors=false] - Whether to enable log color support.
 */

/**
 * A `console`-compatible facade. Every method delegates to a TinyDebugger instance.
 * @typedef {Object} ConsoleFacade
 * @property {(...data: any[]) => void} log - Writes a log message.
 * @property {(...data: any[]) => void} info - Writes an informational message.
 * @property {(...data: any[]) => void} warn - Writes a warning message.
 * @property {(...data: any[]) => void} error - Writes an error message.
 * @property {(...data: any[]) => void} debug - Writes a debug message.
 * @property {(...data: any[]) => void} dirxml - Writes an XML representation.
 * @property {(...data: any[]) => void} group - Starts a log group.
 * @property {(...data: any[]) => void} groupCollapsed - Starts a collapsed log group.
 * @property {(...data: any[]) => void} trace - Writes a stack trace.
 * @property {(condition: boolean, ...data: any[]) => void} assert - Logs when the condition is false.
 * @property {(item: any, options?: import('util').InspectOptions) => void} dir - Logs an object.
 * @property {(tabularData: any, properties?: string[]) => void} table - Logs a table.
 * @property {() => void} clear - Clears the console.
 * @property {() => void} groupEnd - Ends the current log group.
 * @property {(label?: string) => void} count - Logs the call count for a label.
 * @property {(label?: string) => void} countReset - Resets the counter for a label.
 * @property {(label?: string) => void} time - Starts a timer.
 * @property {(label?: string) => void} timeEnd - Stops a timer.
 * @property {(label?: string, ...data: any[]) => void} timeLog - Logs the current timer value.
 * @property {(label?: string) => void} timeStamp - Adds a timestamp marker.
 * @property {(label?: string) => void} profile - Starts a profiler.
 * @property {(label?: string) => void} profileEnd - Stops a profiler.
 */

/**
 * A lightweight debugging utility that wraps console methods and provides event emission.
 * @extends EventEmitter
 */
class TinyDebugger extends EventEmitter {
  /** @type {Partial<Console>} */
  #logger;

  /** @type {string} */
  #logId;

  /** @type {string|null} */
  #logSubId = null;

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
   * @param {DebuggerConstructor} config - The configuration object.
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
    this.#useLogColors = browserIs() !== 'firefox' ? useLogColors : false;

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
   * @returns {string} The instance debug sub id.
   */
  get logSubId() {
    if (typeof this.#logSubId !== 'string') {
      throw new Error(
        'logSubId has not been set yet. Assign a string to "logSubId" before reading it.',
      );
    }
    return this.#logSubId;
  }

  /**
   * @param {string} value - The new instance debug sub id.
   * @throws {Error} If the sub id has not been set yet.
   */
  set logSubId(value) {
    if (typeof value !== 'string') {
      throw new TypeError(`logSubId must be a string. Received: ${typeof value}.`);
    }
    if (this.#logSubId !== null) {
      throw new Error(`logSubId is already set to "${this.#logSubId}" and cannot be reassigned.`);
    }
    this.#logSubId = value;
    this.emit('setLogSubId', value);
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
    this.emit('setUseLogColors', value);
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
   * Internal method to apply prefix and color replacements.
   * @param {string} text - The text to format.
   * @returns {string} The formatted text.
   */
  _applyLogFormatting(text) {
    return this.#applyFormatting(text);
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
   * @param {string} [label] - The label for the timer.
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
   * @param {boolean} [condition] - The condition to evaluate.
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
   * @param {any} [item] - The object to inspect.
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
   * @param {any} [tabularData] - The data to be displayed in a table.
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
    let subPrefix = this.#logSubId ?? '';
    let formattedMessage = message;

    prefix = this.#applyFormatting(prefix);
    if (subPrefix) subPrefix = this.#applyFormatting(subPrefix);
    formattedMessage = this.#applyFormatting(formattedMessage);
    const fullPrefix = `${prefix}${subPrefix ? ` ${subPrefix}` : ''}`;

    const logFunc = this.#logger[logType] ? this.#logger[logType] : console[logType];

    if (logFunc) {
      if (this.#canEmitLogs) this.emit('debug:log', fullPrefix, formattedMessage, ...args);
      return logFunc(fullPrefix, formattedMessage, ...args);
    } else {
      if (this.#canEmitLogs) this.emit('debug:log', fullPrefix, formattedMessage, ...args);
      return console.log(fullPrefix, formattedMessage, ...args);
    }
  }

  /**
   * Forwards a `console`-style call to the internal `log` method.
   * @param {'log' | 'info' | 'warn' | 'error' | 'debug' | 'dirxml' | 'group' | 'groupCollapsed' | 'trace'} logType - The console method to use.
   * @param {any[]} data - The arguments forwarded to the logger.
   * @returns {void}
   */
  #forwardLog(logType, data) {
    const [message = '', ...rest] = data;
    return typeof message === 'string'
      ? this.log(logType, message, ...rest)
      : this.log(logType, '', message, ...rest);
  }

  /**
   * Builds a `console`-compatible facade bound to this instance.
   * Every call is routed through the existing logging methods, so formatting,
   * debug mode and event emission keep working without extra code.
   * @returns {ConsoleFacade} A `console`-compatible object bound to this instance.
   */
  toConsole() {
    return {
      log: (...data) => this.#forwardLog('log', data),
      info: (...data) => this.#forwardLog('info', data),
      warn: (...data) => this.#forwardLog('warn', data),
      error: (...data) => this.#forwardLog('error', data),
      debug: (...data) => this.#forwardLog('debug', data),
      dirxml: (...data) => this.#forwardLog('dirxml', data),
      group: (...data) => this.#forwardLog('group', data),
      groupCollapsed: (...data) => this.#forwardLog('groupCollapsed', data),
      trace: (...data) => this.#forwardLog('trace', data),
      assert: (condition, ...data) => this.logAssert(condition, ...data),
      dir: (item, options) => this.logDir(item, options),
      table: (tabularData, properties) => this.logTable(tabularData, properties),
      clear: () => this.logClear(),
      groupEnd: () => this.logGroupEnd(),
      count: (label) => this.logLabel('count', label),
      countReset: (label) => this.logLabel('countReset', label),
      time: (label) => this.logLabel('time', label),
      timeEnd: (label) => this.logLabel('timeEnd', label),
      timeLog: (label, ...data) => this.logTimeLabel(label, ...data),
      timeStamp: (label) => this.logLabel('timeStamp', label),
      profile: (label) => this.logLabel('profile', label),
      profileEnd: (label) => this.logLabel('profileEnd', label),
    };
  }
}

export default TinyDebugger;
