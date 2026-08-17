/**
 * Class responsible for validating package exports.
 * Implements state encapsulation and recursive search logic.
 */
class TinyPkgExportValidator {
  /** @type {Record<string, any>} */
  #packageData;
  /** @type {string} */
  #rootDir;
  /** @type {Array<{path: string, valid: boolean, errorPath?: string}>} */
  #results;

  /**
   * Creates an instance of TinyPkgExportValidator.
   *
   * @param {Record<string, any>} packageData - The content of the package.json JSON object.
   * @param {string} rootDir - The project root directory.
   * @throws {TypeError} If packageData is not a non-null object or rootDir is not a string.
   */
  constructor(packageData, rootDir) {
    if (typeof packageData !== 'object' || packageData === null) {
      throw new TypeError('The "packageData" argument must be a non-null object.');
    }
    if (typeof rootDir !== 'string') {
      throw new TypeError('The "rootDir" argument must be a string.');
    }

    this.#packageData = packageData;
    this.#rootDir = rootDir;
    this.#results = [];
  }

  /**
   * Getter to access the validation results.
   * @returns {Array<{path: string, valid: boolean, errorPath?: string}>} List of validated paths.
   */
  get results() {
    return this.#results;
  }

  /**
   * Executes the validation process.
   * @returns {Promise<boolean>} Returns true if all paths are valid, false otherwise.
   */
  async validate() {
    const exports = this.#packageData.exports;

    if (!exports) {
      console.log(`${COLORS.YELLOW}[!] No "exports" field found in package.json.${COLORS.RESET}`);
      return true;
    }

    this.#results = [];
    await this.#traverseExports(exports);
    return this.#report();
  }

  /**
   * Recursively traverses the exports object.
   *
   * @param {Record<string, any>|string} node - The current node of the exports object.
   * @param {string} currentKey - The current key (used for log tracking).
   * @private
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
   * @private
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
   * @private
   */
  #report() {
    console.log(`\n${COLORS.CYAN}=== Tiny-Essentials Export Validation ===${COLORS.RESET}\n`);

    let errorCount = 0;

    for (const result of this.#results) {
      if (result.valid) {
        console.log(`${COLORS.GREEN}  [✔] ${result.path}${COLORS.RESET}`);
      } else {
        console.log(`${COLORS.RED}  [✘] ${result.path}${COLORS.RESET}`);
        console.log(`      ${COLORS.DIM}Missing: ${result.errorPath}${COLORS.RESET}`);
        errorCount++;
      }
    }

    console.log(`\n${COLORS.CYAN}-----------------------------------------${COLORS.RESET}`);
    if (errorCount === 0) {
      console.log(`${COLORS.GREEN}SUCCESS: All exports are correctly mapped.${COLORS.RESET}`);
      return true;
    } else {
      console.log(
        `${COLORS.RED}FAILURE: ${errorCount} export(s) are missing or invalid.${COLORS.RESET}`,
      );
      return false;
    }
  }
}

export default TinyPkgExportValidator;
