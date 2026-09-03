/**
 * Defines the configuration criteria used to validate a password.
 * @typedef {Object} PasswordRules
 * @property {boolean} requireLowercase - Whether lowercase letters are required.
 * @property {boolean} requireUppercase - Whether uppercase letters are required.
 * @property {boolean} requireNumbers - Whether numeric digits are required.
 * @property {boolean} requireSpecial - Whether special characters (@$!%*?&) are required.
 * @property {number} minLength - The minimum allowed length of the password.
 * @property {number} maxLength - The maximum allowed length of the password.
 */

/**
 * Represents the qualitative assessment of a password's security level.
 * @typedef {'strong' | 'medium' | 'weak'} PasswordStrength
 */

/**
 * Represents the detailed outcome of a password validation check.
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Indicates if the password meets all configured requirements.
 * @property {PasswordStrength} strength - Classification of the password strength.
 * @property {string[]} errors - List of error messages describing which requirements were not met.
 * @property {number[]} errorCodes - List of error codes corresponding to the failed requirements.
 * @property {number} score - The number of requirements successfully met.
 * @property {number} totalPossiblePoints - The total number of points available based on the configuration.
 */

/**
 * A utility class for validating passwords against customizable security rules.
 */
class TinyPasswordValidator {
  /**
   * The internal configuration object containing the validation rules.
   * @type {PasswordRules}
   */
  #rules;

  /**
   * Initializes a new instance of the TinyPasswordValidator with optional custom rules.
   * @param {Object} [customRules={}] - Initial configuration for the validator.
   * @param {boolean} [customRules.requireLowercase=true] - If true, at least one lowercase letter is required.
   * @param {boolean} [customRules.requireUppercase=true] - If true, at least one uppercase letter is required.
   * @param {boolean} [customRules.requireNumbers=true] - If true, at least one numeric digit is required.
   * @param {boolean} [customRules.requireSpecial=true] - If true, at least one special character (@$!%*?&) is required.
   * @param {number} [customRules.minLength=8] - The minimum allowed length of the password.
   * @param {number} [customRules.maxLength=128] - The maximum allowed length of the password.
   */
  constructor(customRules = {}) {
    this.#rules = {
      requireLowercase: true,
      requireUppercase: true,
      requireNumbers: true,
      requireSpecial: true,
      minLength: 8,
      maxLength: 128,
      ...customRules,
    };
    this.#validateRulesConfig(this.#rules);
  }

  /**
   * Validates if the rules configuration is valid.
   * @param {PasswordRules} rules
   * @throws {TypeError} If a data type is incorrect.
   * @throws {RangeError} If numeric values are invalid.
   */
  #validateRulesConfig(rules) {
    if (
      typeof rules.requireLowercase !== 'boolean' ||
      typeof rules.requireUppercase !== 'boolean' ||
      typeof rules.requireNumbers !== 'boolean' ||
      typeof rules.requireSpecial !== 'boolean'
    ) {
      throw new TypeError('Requirement properties must be boolean.');
    }

    if (typeof rules.minLength !== 'number' || typeof rules.maxLength !== 'number') {
      throw new TypeError('minLength and maxLength must be numbers.');
    }

    if (rules.minLength < 0 || rules.maxLength < 0) {
      throw new RangeError('Size values cannot be negative.');
    }

    if (rules.minLength > rules.maxLength) {
      throw new RangeError('minLength cannot be greater than maxLength.');
    }
  }

  /**
   * Getter to access the current rules.
   * @returns {PasswordRules}
   */
  get rules() {
    return { ...this.#rules };
  }

  /**
   * Setter to update rules with strict validation.
   * @param {PasswordRules} newRules - New configuration.
   */
  set rules(newRules) {
    const mergedRules = { ...this.#rules, ...newRules };
    this.#validateRulesConfig(mergedRules);
    this.#rules = mergedRules;
  }

  /**
   * A private mapping of error codes to their corresponding human-readable error messages.
   * @type {Object.<number, string>}
   */
  #errorMessages = {
    1: `Password must have at least {value} characters.`,
    2: `Password cannot exceed {value} characters.`,
    3: 'Password must contain at least one lowercase letter.',
    4: 'Password must contain at least one uppercase letter.',
    5: 'Password must contain at least one number.',
    6: 'Password must contain at least one special character (@$!%*?&).',
  };

  /**
   * Validates a password based on the configured rules.
   * @param {string} password - The password to be validated.
   * @returns {ValidationResult}
   * @throws {TypeError} If the provided password is not a string.
   */
  validate(password) {
    if (typeof password !== 'string') {
      throw new TypeError('The password must be a string.');
    }

    /** @type {string[]} */
    const errors = [];
    /** @type {number[]} */
    const errorCodes = [];
    let score = 0;
    let totalPossiblePoints = 1; // Length counts as one base point

    // 1. Length Validation
    if (password.length < this.#rules.minLength) {
      errorCodes.push(1);
      errors.push(this.#errorMessages[1].replace('{value}', String(this.#rules.minLength)));
    } else if (password.length > this.#rules.maxLength) {
      errorCodes.push(2);
      errors.push(this.#errorMessages[2].replace('{value}', String(this.#rules.maxLength)));
    } else {
      score += 1;
    }

    // 2. Lowercase Validation
    if (this.#rules.requireLowercase) {
      totalPossiblePoints++;
      if (/[a-z]/.test(password)) {
        score++;
      } else {
        errorCodes.push(3);
        errors.push(this.#errorMessages[3]);
      }
    }

    // 3. Uppercase Validation
    if (this.#rules.requireUppercase) {
      totalPossiblePoints++;
      if (/[A-Z]/.test(password)) {
        score++;
      } else {
        errorCodes.push(4);
        errors.push(this.#errorMessages[4]);
      }
    }

    // 4. Numbers Validation
    if (this.#rules.requireNumbers) {
      totalPossiblePoints++;
      if (/\d/.test(password)) {
        score++;
      } else {
        errorCodes.push(5);
        errors.push(this.#errorMessages[5]);
      }
    }

    // 5. Special Characters Validation
    if (this.#rules.requireSpecial) {
      totalPossiblePoints++;
      if (/[@$!%*?&]/.test(password)) {
        score++;
      } else {
        errorCodes.push(6);
        errors.push(this.#errorMessages[6]);
      }
    }

    // Determination of strength based on the proportion of requirements fulfilled
    /** @type {PasswordStrength} */
    let strength = 'weak';
    if (errors.length === 0) {
      strength = 'strong';
    } else if (score / totalPossiblePoints >= 0.7) {
      strength = 'medium';
    }

    return {
      isValid: errors.length === 0,
      score,
      totalPossiblePoints,
      strength,
      errors,
      errorCodes,
    };
  }
}

export default TinyPasswordValidator;
