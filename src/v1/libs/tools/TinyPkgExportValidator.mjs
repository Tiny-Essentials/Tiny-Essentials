import { readFile, readdir, stat } from 'fs/promises';
import { resolve } from 'path';

/**
 * @typedef {Object} ConsoleColors - The color configuration object.
 * @property {string} RESET - The ANSI reset code.
 * @property {string} GREEN - The ANSI green code.
 * @property {string} RED - The ANSI red code.
 * @property {string} YELLOW - The ANSI yellow code.
 * @property {string} CYAN - The ANSI cyan code.
 * @property {string} DIM - The ANSI dim code.
 */

/**
 * @typedef {Object} ValidatorOptions - Configuration options for the validator.
 * @property {string} [projectName] - Custom name for the project report.
 * @property {boolean} [silent] - If true, no logs will be printed to the console.
 * @property {DefaultMessages} [messages] - Custom message templates.
 */

/**
 * @typedef {Object} DefaultMessages
 * @property {string} header
 * @property {string} divider
 * @property {string} itemValid
 * @property {string} itemInvalid
 * @property {string} itemMissing
 * @property {string} itemSkipped
 * @property {string} itemPattern
 * @property {string} itemInvalidTarget
 * @property {string} successHeader
 * @property {string} failureHeader
 * @property {string} errorLoad
 * @property {string} noExports
 * @property {string} errorNotFound
 * @property {string} errorParse
 * @property {string} errorUnexpected
 */

/**
 * @typedef {Object} LogContext
 * @property {string} [projectName] - The project name injected automatically.
 * @property {string} [path] - The dotted context path of the export.
 * @property {string} [errorPath] - The raw target string from package.json.
 * @property {string} [target] - The invalid target value.
 * @property {string} [reason] - The machine-readable failure reason.
 * @property {string} [pattern] - The wildcard pattern that matched.
 * @property {string} [message] - A generic message payload.
 * @property {number} [errorCount] - The number of failures found.
 */

/**
 * The kind of target that was validated.
 * @typedef {'file'|'pattern'|'null'|'invalid'} ExportTargetKind
 */

/**
 * The validation result of a single export target.
 * @typedef {Object} ExportTargetResult
 * @property {string} path - The dotted context path (e.g. "exports -> . -> import").
 * @property {boolean} valid - Whether the target resolves to an existing file.
 * @property {ExportTargetKind} [kind] - The kind of target that was validated.
 * @property {string} [errorPath] - The raw target string declared in package.json.
 * @property {string} [reason] - A short machine-readable reason code for failures.
 */

/**
 * Default messages used when no custom messages are provided.
 * Placeholders like {projectName}, {path}, etc., are replaced at runtime.
 * @type {DefaultMessages}
 */
const DEFAULT_MESSAGES = {
  header: `\n=== {projectName} ===\n`,
  divider: `\n-----------------------------------------`,
  itemValid: `  [✔] {path}`,
  itemInvalid: `  [✘] {path}`,
  itemMissing: `      Missing: {errorPath}`,
  itemSkipped: `  [-] {path} (excluded by null target)`,
  itemPattern: `  [✔] {path} (pattern: {pattern})`,
  itemInvalidTarget: `      Invalid target: {target} ({reason})`,
  successHeader: `SUCCESS: All exports are correctly mapped.`,
  failureHeader: `FAILURE: {errorCount} export(s) are missing or invalid.`,
  errorLoad: `Error: package.json not loaded in the current directory.`,
  noExports: `[!] No "exports" field found in package.json.`,
  errorNotFound: `Error: package.json not found in the current directory.`,
  errorParse: `Error: Failed to parse package.json. Ensure it is valid JSON.`,
  errorUnexpected: `An unexpected error occurred: {message}`,
};

/**
 * Array of keys required by the DefaultMessages type.
 * Used for deep validation of the messages object.
 */
const MESSAGE_KEYS = Object.keys(DEFAULT_MESSAGES);

/**
 * Class responsible for validating package exports.
 * Implements state encapsulation, custom logging, and recursive search logic.
 */
class TinyPkgExportValidator {
  /**
   * Console color constants (ANSI escape codes).
   * @type {ConsoleColors}
   */
  #COLORS = {
    RESET: '\x1b[0m',
    GREEN: '\x1b[32m',
    RED: '\x1b[31m',
    YELLOW: '\x1b[33m',
    CYAN: '\x1b[36m',
    DIM: '\x1b[2m',
  };

  get COLORS() {
    return structuredClone(this.#COLORS);
  }

  /**
   * Updates the color constants with a new configuration.
   *
   * @param {ConsoleColors} newColors - The new color configuration object.
   * @throws {TypeError} If newColors is not an object, if keys do not match exactly, or if any value is not a string.
   */
  set COLORS(newColors) {
    // 1. Validate that the input is a non-null object and not an array
    if (typeof newColors !== 'object' || newColors === null || Array.isArray(newColors)) {
      throw new TypeError('The provided configuration must be a non-null object.');
    }

    const originalKeys = Object.keys(this.#COLORS);
    const newKeys = Object.keys(newColors);

    // 2. Validate that the keys match exactly (same length and same names)
    const hasSameKeys =
      originalKeys.length === newKeys.length && originalKeys.every((key) => newKeys.includes(key));

    if (!hasSameKeys) {
      throw new TypeError(
        'The new configuration must contain the exact same keys as the original color set.',
      );
    }

    // 3. Validate that all values are strings
    const colorRecord = /** @type {Record<string, string>} */ (newColors);

    for (const key of originalKeys) {
      if (typeof colorRecord[key] !== 'string') {
        throw new TypeError(`The value for key "${key}" must be a string.`);
      }
    }

    // Apply the new configuration using a clone to prevent external mutation
    this.#COLORS = structuredClone(newColors);
  }

  // --- Private State ---

  /** @type {Record<string, any>} */
  #packageData = {};

  /** @type {string} */
  #packageJsonPath;

  /** @type {string} */
  #rootDir;

  /** @type {ExportTargetResult[]} */
  #results;

  /** @type {boolean} */
  #started = false;

  /** @type {string} */
  #projectName;

  /** @type {boolean} */
  #silent;

  /** @type {DefaultMessages} */
  #messages;

  // --- Getters ---

  get packageData() {
    return structuredClone(this.#packageData);
  }
  get packageJsonPath() {
    return this.#packageJsonPath;
  }
  get rootDir() {
    return this.#rootDir;
  }
  get results() {
    return structuredClone(this.#results);
  }
  get started() {
    return this.#started;
  }
  get projectName() {
    return this.#projectName;
  }
  get silent() {
    return this.#silent;
  }

  /**
   * Creates an instance of TinyPkgExportValidator.
   *
   * @param {string} packageJsonPath - The package.json JSON file path.
   * @param {string} rootDir - The project root directory.
   * @param {ValidatorOptions} [options={}] - Configuration options.
   * @throws {TypeError} If arguments are not strings or if options fails deep validation.
   */
  constructor(packageJsonPath, rootDir, options = {}) {
    if (typeof packageJsonPath !== 'string') {
      throw new TypeError('The "packageJsonPath" argument must be a string.');
    }
    if (typeof rootDir !== 'string') {
      throw new TypeError('The "rootDir" argument must be a string.');
    }

    this.#validateOptions(options);

    this.#packageJsonPath = packageJsonPath;
    this.#rootDir = rootDir;
    this.#results = [];

    // Configuration assignment
    this.#projectName = options.projectName ?? 'Tiny-Essentials Export Validation';
    this.#silent = !!options.silent;
    this.#messages = { ...DEFAULT_MESSAGES, ...(options.messages ?? {}) };
  }

  /**
   * Performs a deep validation of the options object against the ValidatorOptions JSDoc.
   *
   * @param {ValidatorOptions} options - The options to validate.
   * @throws {TypeError} If any property does not match the expected type or structure.
   */
  #validateOptions(options) {
    if (typeof options !== 'object' || options === null || Array.isArray(options)) {
      throw new TypeError('The "options" argument must be a non-null object.');
    }

    // Validate projectName
    if (options.projectName !== undefined && typeof options.projectName !== 'string') {
      throw new TypeError('The "options.projectName" property must be a string.');
    }

    // Validate silent
    if (options.silent !== undefined && typeof options.silent !== 'boolean') {
      throw new TypeError('The "options.silent" property must be a boolean.');
    }

    // Validate messages (Deep Validation)
    if (options.messages !== undefined) {
      if (
        typeof options.messages !== 'object' ||
        options.messages === null ||
        Array.isArray(options.messages)
      ) {
        throw new TypeError('The "options.messages" property must be a non-null object.');
      }

      // Ensure all required keys from DefaultMessages are present and are strings
      const messages = /** @type {Record<string, unknown>} */ (options.messages);

      for (const key of MESSAGE_KEYS) {
        if (typeof messages[key] !== 'string') {
          throw new TypeError(`The "options.messages.${key}" property must be a string.`);
        }
      }
    }
  }

  /**
   * Internal helper to apply template replacements.
   *
   * @param {string} template - The message template string.
   * @param {LogContext} context - Data for placeholders.
   * @returns {string} The processed string.
   * @throws {TypeError} If template is not a string or context is not an object.
   */
  #applyTemplate(template, context) {
    if (typeof template !== 'string') {
      throw new TypeError('The template must be a string.');
    }
    if (typeof context !== 'object' || context === null) {
      throw new TypeError('The context must be a non-null object.');
    }

    const values = /** @type {Record<string, unknown>} */ (context);

    return template.replace(/{(\w+)}/g, (match, key) => {
      const value = values[key];
      return value !== undefined ? String(value) : match;
    });
  }

  /**
   * Internal helper to handle console output, coloring, and silent mode.
   *
   * @param {'error'|'warning'|'success'|'info'|'dim'|'cyan'} type - The log type.
   * @param {string} templateKey - The key in the messages object.
   * @param {LogContext} [context={}] - Data for the template.
   * @returns {void}
   * @throws {TypeError} If arguments do not match required types or if type is invalid.
   */
  #log(type, templateKey, context = {}) {
    if (this.#silent) return;

    const VALID_LOG_TYPES = ['error', 'warning', 'success', 'info', 'dim', 'cyan'];

    if (!VALID_LOG_TYPES.includes(type)) {
      throw new TypeError(
        `Invalid log type: "${type}". Valid types are: ${VALID_LOG_TYPES.join(', ')}`,
      );
    }
    if (typeof templateKey !== 'string') {
      throw new TypeError('The templateKey must be a string.');
    }
    if (typeof context !== 'object' || context === null) {
      throw new TypeError('The context must be a non-null object.');
    }

    const messages = /** @type {Record<string, string>} */ (this.#messages);
    const template = messages[templateKey] ?? templateKey;
    const message = this.#applyTemplate(template, { ...context, projectName: this.#projectName });

    switch (type) {
      case 'error':
        console.error(`${this.#COLORS.RED}${message}${this.#COLORS.RESET}`);
        break;
      case 'warning':
        console.log(`${this.#COLORS.YELLOW}${message}${this.#COLORS.RESET}`);
        break;
      case 'success':
        console.log(`${this.#COLORS.GREEN}${message}${this.#COLORS.RESET}`);
        break;
      case 'cyan':
        console.log(`${this.#COLORS.CYAN}${message}${this.#COLORS.RESET}`);
        break;
      case 'dim':
        console.log(`${this.#COLORS.DIM}${message}${this.#COLORS.RESET}`);
        break;
      default:
        console.log(message);
    }
  }

  /**
   * Provides a CLI-based testing interface to execute specific methods or tasks
   * defined in the `actions` object via command-line arguments.
   *
   * If no command-line argument is provided, all actions in the object will be executed
   * sequentially. If an argument is provided, only the corresponding action will run.
   *
   * @param {Record<string, () => Promise<void> | void>} actions - An object where keys are
   * command names (passed via CLI) and values are the functions to be executed.
   * @param {string[]} args - The array of command-line arguments.
   * Defaults to `process.argv` if not provided.
   * @throws {TypeError} If the `actions` argument is not a non-null object.
   */
  async execCommandTester(actions, args) {
    if (typeof actions !== 'object' || actions === null || Array.isArray(actions)) {
      throw new TypeError('The "actions" argument must be a non-null object.');
    }
    if (!Array.isArray(args) || !args.every((arg) => typeof arg === 'string')) {
      throw new TypeError('The "args" argument must be a string array.');
    }

    // We use the 'args' parameter instead of the global 'process.argv'
    // to allow for better dependency tracking by bundlers like Webpack.
    const arg = args[2];
    const availableCommands = Object.keys(actions);

    // Case 1: No argument provided - Run all actions
    if (!arg) {
      this.#log('cyan', 'header');
      this.#log('dim', 'Running all registered commands...');

      for (const commandName of availableCommands) {
        this.#log('cyan', `> Executing: ${commandName}`);
        await actions[commandName]();
      }
    }
    // Case 2: Specific command provided and it exists
    else if (typeof actions[arg] === 'function') {
      this.#log('cyan', `> Executing: ${arg}`);
      await actions[arg]();
    }
    // Case 3: Argument provided but not found in actions
    else {
      this.#log('error', 'errorUnexpected', { message: `Unknown argument: "${arg}"` });
      this.#log('dim', `Valid arguments are: ${availableCommands.join(', ')}`);
    }
  }

  /**
   * Loads and parses the package.json file from the specified path.
   *
   * @returns {Promise<void>} A promise that resolves when the package data is loaded.
   * @throws {TypeError} If the parsed JSON content is not a non-null object.
   * @throws {Error} If the file cannot be read or parsed.
   */
  async start() {
    if (this.#started) return;
    this.#started = true;

    try {
      const packageRaw = await readFile(this.#packageJsonPath, 'utf-8');
      const packageData = JSON.parse(packageRaw);
      if (typeof packageData !== 'object' || packageData === null) {
        this.#started = false;
        throw new TypeError('The "packageData" argument must be a non-null object.');
      }
      this.#packageData = packageData;
    } catch (error) {
      this.#started = false;
      throw error;
    }
  }

  /**
   * Executes the validation process.
   *
   * @returns {Promise<boolean>} True if all paths are valid, false otherwise.
   * @throws {TypeError} If the "exports" field mixes subpath keys with condition keys.
   */
  async validate() {
    if (!this.#started) {
      this.#log('error', 'errorLoad');
      return false;
    }

    const exports = this.#packageData.exports;

    if (exports === undefined || exports === null) {
      this.#log('warning', 'noExports');
      return true;
    }

    this.#results = [];

    try {
      if (typeof exports === 'object' && !Array.isArray(exports)) {
        this.#assertRootKeys(exports);
      }
      await this.#traverseExports(exports, 'exports', true);
    } catch (error) {
      if (error instanceof Error) {
        if (error instanceof SyntaxError) {
          this.#log('error', 'errorParse');
        } else if ('code' in error && error.code === 'ENOENT') {
          this.#log('error', 'errorNotFound');
        } else {
          this.#log('error', 'errorUnexpected', { message: error.message });
        }
      }
      throw error;
    }

    return this.#report();
  }

  /**
   * Ensures the root "exports" object does not mix subpath keys with condition keys.
   *
   * @param {Record<string, unknown>} exportsObject - The root "exports" object.
   * @returns {void}
   * @throws {TypeError} If subpath keys and condition keys are mixed.
   */
  #assertRootKeys(exportsObject) {
    const keys = Object.keys(exportsObject);
    const subpathCount = keys.filter((key) => key.startsWith('.')).length;

    if (subpathCount === 0 || subpathCount === keys.length) return;

    throw new TypeError(
      'The "exports" field cannot mix subpath keys ("./x") with condition keys ("import").',
    );
  }

  /**
   * Validates a single key of an exports object.
   *
   * @param {string} key - The object key to validate.
   * @param {boolean} isRoot - Whether the key belongs to the root "exports" object.
   * @returns {string|null} A reason code when invalid, or null when the key is valid.
   */
  #getKeyError(key, isRoot) {
    if (key.length === 0) return 'EMPTY_KEY';

    const isSubpath = key === '.' || key.startsWith('./');

    if (isSubpath) {
      if (!isRoot) return 'NESTED_SUBPATH_KEY';
      return null;
    }

    if (key.startsWith('.')) return 'INVALID_SUBPATH_KEY';
    if (key.includes(',') || key.includes('/') || key.includes('\\')) return 'INVALID_CONDITION';

    return null;
  }

  /**
   * Recursively traverses the exports tree.
   *
   * @param {unknown} node - The current node of the exports tree.
   * @param {string} currentKey - The dotted context path used for reporting.
   * @param {boolean} [isRoot=false] - Whether this node is the root "exports" value.
   * @returns {Promise<void>}
   * @throws {TypeError} If currentKey is not a string or node has an unsupported type.
   */
  async #traverseExports(node, currentKey, isRoot = false) {
    if (typeof currentKey !== 'string') {
      throw new TypeError('The "currentKey" argument must be a string.');
    }

    // Rule: null is a valid target. It excludes a subpath from a broader pattern.
    if (node === null) {
      this.#results.push({ path: currentKey, valid: true, kind: 'null' });
      return;
    }

    // Rule: a string is a direct file target.
    if (typeof node === 'string') {
      await this.#checkTarget(node, currentKey);
      return;
    }

    // Rule: an array is a fallback list of targets.
    if (Array.isArray(node)) {
      if (node.length === 0) {
        this.#results.push({
          path: currentKey,
          valid: false,
          kind: 'invalid',
          reason: 'EMPTY_ARRAY',
        });
        return;
      }

      for (let index = 0; index < node.length; index += 1) {
        await this.#traverseExports(node[index], `${currentKey}[${index}]`);
      }
      return;
    }

    // Rule: an object holds subpaths (root only) or conditions.
    if (typeof node === 'object') {
      const record = /** @type {Record<string, unknown>} */ (node);
      const keys = Object.keys(record);

      if (keys.length === 0) {
        this.#results.push({
          path: currentKey,
          valid: false,
          kind: 'invalid',
          reason: 'EMPTY_OBJECT',
        });
        return;
      }

      for (const key of keys) {
        const keyError = this.#getKeyError(key, isRoot);

        if (keyError !== null) {
          this.#results.push({
            path: `${currentKey} -> ${key}`,
            valid: false,
            kind: 'invalid',
            errorPath: key,
            reason: keyError,
          });
          continue;
        }

        await this.#traverseExports(record[key], `${currentKey} -> ${key}`);
      }
      return;
    }

    throw new TypeError('The "node" argument must be a string, an array, or a non-null object.');
  }

  /**
   * Validates a single string target and dispatches it to the correct checker.
   *
   * @param {string} target - The raw target string from package.json.
   * @param {string} context - The dotted context path used for reporting.
   * @returns {Promise<void>}
   */
  async #checkTarget(target, context) {
    const targetError = this.#getTargetError(target);

    if (targetError !== null) {
      this.#results.push({
        path: context,
        valid: false,
        kind: 'invalid',
        errorPath: target,
        reason: targetError,
      });
      return;
    }

    if (target.includes('*')) {
      await this.#checkPatternTarget(target, context);
      return;
    }

    await this.#checkFileExists(target, context);
  }

  /**
   * Applies the path rules documented by Node.js for export targets.
   *
   * @param {string} target - The raw target string from package.json.
   * @returns {string|null} A reason code when invalid, or null when the target is valid.
   */
  #getTargetError(target) {
    if (target.length === 0) return 'EMPTY_TARGET';
    if (target.includes('\\')) return 'INVALID_SEGMENT';
    if (target.includes('?') || target.includes('#')) return 'INVALID_CHARACTER';
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(target)) return 'URL_SCHEME_NOT_ALLOWED';
    if (!target.startsWith('./')) return 'TARGET_NOT_RELATIVE';
    if (target.includes('**')) return 'INVALID_PATTERN';

    const segments = target.slice(2).split('/');

    for (const segment of segments) {
      const decoded = this.#safeDecode(segment).toLowerCase();

      if (decoded.length === 0) return 'INVALID_SEGMENT';
      if (decoded === '.' || decoded === '..' || decoded === 'node_modules') {
        return 'INVALID_SEGMENT';
      }
    }

    return null;
  }

  /**
   * Decodes a URI component without throwing on malformed input.
   *
   * @param {string} value - The value to decode.
   * @returns {string} The decoded value, or the original value when decoding fails.
   */
  #safeDecode(value) {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  /**
   * Converts a subpath pattern into an anchored regular expression.
   *
   * @param {string} pattern - The file name pattern (e.g. "*.js").
   * @returns {RegExp} The anchored regular expression.
   */
  #patternToRegExp(pattern) {
    const source = pattern
      .split('*')
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('.*');

    return new RegExp(`^${source}$`);
  }

  /**
   * Expands a wildcard target against the file system.
   *
   * @param {string} target - The raw target containing at least one "*".
   * @param {string} context - The dotted context path used for reporting.
   * @returns {Promise<void>}
   */
  async #checkPatternTarget(target, context) {
    const lastSlash = target.lastIndexOf('/');
    const directory = lastSlash === 0 ? '.' : target.slice(0, lastSlash);
    const filePattern = target.slice(lastSlash + 1);

    // When the wildcard lives in a directory segment, fall back to the static prefix.
    const staticDirectory = directory.includes('*')
      ? directory.slice(0, directory.indexOf('*')).replace(/\/[^/]*$/, '') || '.'
      : directory;

    let entries;

    try {
      entries = await readdir(resolve(this.#rootDir, staticDirectory));
    } catch {
      this.#results.push({
        path: context,
        valid: false,
        kind: 'invalid',
        errorPath: target,
        reason: 'DIRECTORY_NOT_FOUND',
      });
      return;
    }

    const matcher = this.#patternToRegExp(filePattern);
    const hasMatch = entries.some((entry) => matcher.test(entry));

    this.#results.push({
      path: context,
      valid: hasMatch,
      kind: hasMatch ? 'pattern' : 'invalid',
      errorPath: target,
      reason: hasMatch ? undefined : 'PATTERN_NO_MATCH',
    });
  }

  /**
   * Checks for the existence of a regular file in the file system.
   *
   * @param {string} relativePath - The relative path defined in package.json.
   * @param {string} context - The key context for reporting purposes.
   * @returns {Promise<void>}
   * @throws {TypeError} If relativePath or context are not strings.
   */
  async #checkFileExists(relativePath, context) {
    if (typeof relativePath !== 'string') {
      throw new TypeError('The "relativePath" argument must be a string.');
    }
    if (typeof context !== 'string') {
      throw new TypeError('The "context" argument must be a string.');
    }

    const absolutePath = resolve(this.#rootDir, relativePath);

    try {
      const stats = await stat(absolutePath);

      if (!stats.isFile()) {
        this.#results.push({
          path: context,
          valid: false,
          kind: 'invalid',
          errorPath: relativePath,
          reason: 'NOT_A_FILE',
        });
        return;
      }

      this.#results.push({ path: context, valid: true, kind: 'file' });
    } catch {
      this.#results.push({
        path: context,
        valid: false,
        kind: 'invalid',
        errorPath: relativePath,
        reason: 'FILE_NOT_FOUND',
      });
    }
  }

  /**
   * Generates the final report in the console.
   *
   * @returns {boolean} True if there are no errors, false if there are failures.
   */
  #report() {
    this.#log('cyan', 'header');

    let errorCount = 0;

    for (const result of this.#results) {
      if (result.kind === 'null') {
        this.#log('dim', 'itemSkipped', { path: result.path });
        continue;
      }

      if (result.valid) {
        this.#log('success', result.kind === 'pattern' ? 'itemPattern' : 'itemValid', {
          path: result.path,
          pattern: result.errorPath ?? '',
        });
        continue;
      }

      this.#log('error', 'itemInvalid', { path: result.path });

      if (result.reason === 'FILE_NOT_FOUND') {
        this.#log('dim', 'itemMissing', { errorPath: result.errorPath });
      } else {
        this.#log('dim', 'itemInvalidTarget', {
          target: result.errorPath ?? result.path,
          reason: result.reason ?? 'UNKNOWN',
        });
      }

      errorCount++;
    }

    this.#log('cyan', 'divider');

    if (errorCount === 0) {
      this.#log('success', 'successHeader');
      return true;
    }

    this.#log('error', 'failureHeader', { errorCount });
    return false;
  }
}

export default TinyPkgExportValidator;
