import { access, readFile } from 'fs/promises';
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
 * Class responsible for validating package exports.
 * Implements state encapsulation and recursive search logic.
 */
class TinyPkgExportValidator {
  /**
   * Console color constants (ANSI escape codes).
   * Used to provide professional and clear visual feedback.
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
    for (const key of originalKeys) {
      // @ts-ignore
      if (typeof newColors[key] !== 'string') {
        throw new TypeError(`The value for key "${key}" must be a string.`);
      }
    }

    // Apply the new configuration using a clone to prevent external mutation
    this.#COLORS = structuredClone(newColors);
  }

  /**
   * The content of the package.json JSON object.
   * @type {Record<string, any>}
   */
  #packageData = {};

  get packageData() {
    return structuredClone(this.#packageData);
  }

  /** @type {string} */
  #packageJsonPath;

  get packageJsonPath() {
    return this.#packageJsonPath;
  }

  /** @type {string} */
  #rootDir;

  get rootDir() {
    return this.#rootDir;
  }

  /** @type {Array<{path: string, valid: boolean, errorPath?: string}>} */
  #results;

  /**
   * Indicates whether the package data has been successfully loaded.
   * @type {boolean}
   */
  #started = false;

  get started() {
    return this.#started;
  }

  /**
   * Creates an instance of TinyPkgExportValidator.
   *
   * @param {string} packageJsonPath - The package.json JSON file path.
   * @param {string} rootDir - The project root directory.
   * @throws {TypeError} If packageJsonPath is not a string or rootDir is not a string.
   */
  constructor(packageJsonPath, rootDir) {
    if (typeof packageJsonPath !== 'string') {
      throw new TypeError('The "packageJsonPath" argument must be a string.');
    }
    if (typeof rootDir !== 'string') {
      throw new TypeError('The "rootDir" argument must be a string.');
    }

    this.#packageJsonPath = packageJsonPath;
    this.#rootDir = rootDir;
    this.#results = [];
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

    const packageRaw = await readFile(this.#packageJsonPath, 'utf-8');
    const packageData = JSON.parse(packageRaw);
    if (typeof packageData !== 'object' || packageData === null) {
      this.#started = false;
      throw new TypeError('The "packageData" argument must be a non-null object.');
    }

    this.#packageData = packageData;
  }

  /**
   * Getter to access the validation results.
   * @returns {Array<{path: string, valid: boolean, errorPath?: string}>} List of validated paths.
   */
  get results() {
    return structuredClone(this.#results);
  }

  /**
   * Executes the validation process.
   * @returns {Promise<boolean>} Returns true if all paths are valid, false otherwise.
   */
  async validate() {
    if (!this.#started) {
      console.error(
        `${this.#COLORS.RED}Error: package.json not loaded in the current directory.${this.#COLORS.RESET}`,
      );
      return true;
    }

    const exports = this.#packageData.exports;

    if (!exports) {
      console.log(
        `${this.#COLORS.YELLOW}[!] No "exports" field found in package.json.${this.#COLORS.RESET}`,
      );
      return true;
    }

    this.#results = [];
    try {
      await this.#traverseExports(exports);
    } catch (error) {
      if (error instanceof Error) {
        if ('code' in error && error.code === 'ENOENT') {
          console.error(
            `${this.#COLORS.RED}Error: package.json not found in the current directory.${this.#COLORS.RESET}`,
          );
        } else if (error instanceof SyntaxError) {
          console.error(
            `${this.#COLORS.RED}Error: Failed to parse package.json. Ensure it is valid JSON.${this.#COLORS.RESET}`,
          );
        } else {
          console.error(
            `${this.#COLORS.RED}An unexpected error occurred:${this.#COLORS.RESET}`,
            error.message,
          );
        }
      }
      throw error;
    }
    return this.#report();
  }

  /**
   * Recursively traverses the exports object.
   *
   * @param {Record<string, any>|string} node - The current node of the exports object.
   * @param {string} currentKey - The current key (used for log tracking).
   * @returns {Promise<void>}
   */
  async #traverseExports(node, currentKey = '') {
    if (typeof node === 'string') {
      // Base case: the value is a direct path
      await this.#checkFileExists(node, currentKey);
    } else if (typeof node === 'object' && node !== null) {
      // Recursive case: the value is an object (e.g., { import: '...', require: '...' })
      const keys = Object.keys(node);
      for (const key of keys) {
        const subKey = currentKey ? `${currentKey} -> ${key}` : key;
        await this.#traverseExports(node[key], subKey);
      }
    }
  }

  /**
   * Checks for the existence of a file in the file system.
   *
   * @param {string} relativePath - The relative path defined in package.json.
   * @param {string} context - The key context for reporting purposes.
   * @returns {Promise<void>}
   */
  async #checkFileExists(relativePath, context) {
    // Remove potential wildcards (e.g., '*') for literal path validation
    const cleanPath = relativePath.replace(/\*/g, '');
    const absolutePath = resolve(this.#rootDir, cleanPath);

    try {
      await access(absolutePath);
      this.#results.push({ path: context, valid: true });
    } catch {
      this.#results.push({ path: context, valid: false, errorPath: relativePath });
    }
  }

  /**
   * Generates the final report in the console.
   *
   * @returns {boolean} True if there are no errors, false if there are failures.
   */
  #report() {
    console.log(
      `\n${this.#COLORS.CYAN}=== Tiny-Essentials Export Validation ===${this.#COLORS.RESET}\n`,
    );

    let errorCount = 0;

    for (const result of this.#results) {
      if (result.valid) {
        console.log(`${this.#COLORS.GREEN}  [✔] ${result.path}${this.#COLORS.RESET}`);
      } else {
        console.log(`${this.#COLORS.RED}  [✘] ${result.path}${this.#COLORS.RESET}`);
        console.log(`      ${this.#COLORS.DIM}Missing: ${result.errorPath}${this.#COLORS.RESET}`);
        errorCount++;
      }
    }

    console.log(
      `\n${this.#COLORS.CYAN}-----------------------------------------${this.#COLORS.RESET}`,
    );
    if (errorCount === 0) {
      console.log(
        `${this.#COLORS.GREEN}SUCCESS: All exports are correctly mapped.${this.#COLORS.RESET}`,
      );
      return true;
    } else {
      console.log(
        `${this.#COLORS.RED}FAILURE: ${errorCount} export(s) are missing or invalid.${this.#COLORS.RESET}`,
      );
      return false;
    }
  }
}

export default TinyPkgExportValidator;
