import TinyPasswordValidator from '../../dist/v1/libs/tools/TinyPasswordValidator.mjs';

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Indicates if the password meets all criteria.
 * @property {'Weak' | 'Medium' | 'Strong'} strength - The calculated strength of the password.
 * @property {string[]} errors - A list of error messages if validation fails.
 */

/**
 * @typedef {Object} ValidatorConfig
 * @property {boolean} [requireSpecial] - Whether special characters are required.
 * @property {number} [minLength] - Minimum length of the password.
 * @property {boolean} [requireUppercase] - Whether uppercase letters are required.
 */

/**
 * TestReporter provides a stylized, colorized interface for terminal output.
 * It follows the principle of Separation of Concerns.
 */
class TestReporter {
  #colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m',
  };

  constructor() {
    this.#printHeader();
  }

  #printHeader() {
    console.log(
      `${this.#colors.bright}${this.#colors.cyan}========================================${this.#colors.reset}`,
    );
    console.log(
      `${this.#colors.bright}${this.#colors.cyan}   TINY PASSWORD VALIDATOR TEST SUITE   ${this.#colors.reset}`,
    );
    console.log(
      `${this.#colors.bright}${this.#colors.cyan}========================================${this.#colors.reset}\n`,
    );
  }

  /**
   * Logs a successful test case.
   * @param {string} description - The description of the test.
   * @param {ValidationResult} result - The result object from the validator.
   */
  logSuccess(description, result) {
    console.log(
      `${this.#colors.green}✔ [PASS]${this.#colors.reset} ${this.#colors.bright}${description}${this.#colors.reset}`,
    );
    console.log(
      `   ${this.#colors.green}Result:${this.#colors.reset} ${result.isValid ? 'Valid' : 'Invalid'} | Strength: ${result.strength}`,
    );
    if (result.errors.length > 0) {
      result.errors.forEach((err) =>
        console.log(`   ${this.#colors.yellow}└─ Error: ${err}${this.#colors.reset}`),
      );
    }
    console.log('');
  }

  /**
   * Logs a failed test case.
   * @param {string} description - The description of the test.
   * @param {string} errorMessage - The error message.
   */
  logFailure(description, errorMessage) {
    console.log(
      `${this.#colors.red}✘ [FAIL]${this.#colors.reset} ${this.#colors.bright}${description}${this.#colors.reset}`,
    );
    console.log(`   ${this.#colors.red}Message: ${errorMessage}${this.#colors.reset}\n`);
  }

  /**
   * Logs a programming error/exception.
   * @param {string} description - The description of the test.
   * @param {Error} error - The caught error object.
   */
  logError(description, error) {
    console.log(
      `${this.#colors.magenta}⚠ [ERROR]${this.#colors.reset} ${this.#colors.bright}${description}${this.#colors.reset}`,
    );
    console.log(`   ${this.#colors.red}Type: ${error.name}${this.#colors.reset}`);
    console.log(`   ${this.#colors.red}Message: ${error.message}${this.#colors.reset}\n`);
  }
}

/**
 * Executes the test suite for TinyPasswordValidator.
 * @returns {Promise<void>}
 */
const testTinyPasswordValidator = async () => {
  const reporter = new TestReporter();

  // Example 1: Default usage (Strict rules)
  try {
    const validator = new TinyPasswordValidator();
    const result = validator.validate('abc123');
    reporter.logSuccess('Default usage (Strict rules)', result);
  } catch (e) {
    reporter.logError('Default usage (Strict rules)', e);
  }

  // Example 2: Custom configuration (More flexible)
  try {
    /** @type {ValidatorConfig} */
    const config = {
      requireSpecial: false,
      minLength: 6,
      requireUppercase: false,
    };

    const customValidator = new TinyPasswordValidator(config);
    const result = customValidator.validate('senha123');
    reporter.logSuccess('Custom configuration (Flexible)', result);
  } catch (e) {
    reporter.logError('Custom configuration (Flexible)', e);
  }

  // Example 3: Programming error handling
  try {
    const customValidator = new TinyPasswordValidator({ minLength: 6 });
    // Intentionally triggering a type error by assigning an invalid type to rules
    customValidator.rules = { minLength: 'too long' };
    reporter.logError('No Error handling');
  } catch (e) {
    reporter.logSuccess('Error handling (Invalid property type)', e);
  }
};

export default testTinyPasswordValidator;
