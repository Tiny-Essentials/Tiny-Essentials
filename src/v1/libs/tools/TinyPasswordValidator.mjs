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
 * @typedef {Object} CustomValidator
 * @property {string} id - Unique identifier for the validator.
 * @property {string} name - Human-readable name of the validator.
 * @property {(value: string) => ValidationResult} validate - A function that takes a string and returns a ValidationResult.
 */

/**
 * @typedef {Object} ManagerValidationResult
 * @property {boolean} allPassed - True if all validators returned isValid: true.
 * @property {ValidationResult[]} details - The array of individual ValidationResult objects from each validator.
 */

/**
 * A utility class for validating passwords against customizable security rules.
 */
class TinyPasswordValidator {
  /**
   * Internal error messages, frozen to prevent runtime tampering.
   * @type {Readonly<{ [key: number]: string }>}
   */
  static #ERROR_MESSAGES = Object.freeze({
    1: `Password must have at least {value} characters.`,
    2: `Password cannot exceed {value} characters.`,
    3: 'Password must contain at least one lowercase letter.',
    4: 'Password must contain at least one uppercase letter.',
    5: 'Password must contain at least one number.',
    6: 'Password must contain at least one special character (@$!%*?&).',
  });

  /**
   * Static regex patterns to prevent recompilation and ensure consistency.
   * @type {Readonly<{ lowercase: () => RegExp, uppercase: () => RegExp, numbers: () => RegExp, special: () => RegExp }>}
   */
  static #PATTERNS = Object.freeze({
    lowercase: () => /[a-z]/,
    uppercase: () => /[A-Z]/,
    numbers: () => /\d/,
    special: () => /[@$!%*?&]/,
  });

  static #fullPatternString =
    '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$';

  static #getFullPattern() {
    return new RegExp(TinyPasswordValidator.#fullPatternString);
  }

  static get fullPatternString() {
    return TinyPasswordValidator.#fullPatternString;
  }

  static get getFullPattern() {
    return TinyPasswordValidator.#getFullPattern;
  }

  /**
   * The internal configuration object containing the validation rules.
   * @type {PasswordRules}
   */
  #rules = {
    requireLowercase: true,
    requireUppercase: true,
    requireNumbers: true,
    requireSpecial: true,
    minLength: 8,
    maxLength: 128,
  };

  get requireLowercase() {
    return this.#rules.requireLowercase;
  }

  get requireUppercase() {
    return this.#rules.requireUppercase;
  }

  get requireNumbers() {
    return this.#rules.requireNumbers;
  }

  get requireSpecial() {
    return this.#rules.requireSpecial;
  }

  get minLength() {
    return this.#rules.minLength;
  }

  get maxLength() {
    return this.#rules.maxLength;
  }
  /**
   * Internal list of registered validators.
   * @type {CustomValidator[]}
   */
  #validators = [];

  /**
   * Adds a new validator to the manager.
   * @param {CustomValidator} validator - The validator object to add.
   * @throws {TypeError} If the validator does not match the CustomValidator typedef.
   */
  add(validator) {
    if (!validator || typeof validator !== 'object') {
      throw new TypeError('Validator must be a valid object.');
    }
    if (typeof validator.id !== 'string') {
      throw new TypeError('Validator must have a string "id".');
    }
    if (typeof validator.name !== 'string') {
      throw new TypeError('Validator must have a string "name".');
    }
    if (typeof validator.validate !== 'function') {
      throw new TypeError('Validator must have a "validate" function.');
    }

    const exists = this.#validators.some((v) => v.id === validator.id);
    if (exists) {
      throw new Error(`Validator with id "${validator.id}" already exists.`);
    }

    this.#validators.push(validator);
  }

  /**
   * Removes a validator by its unique ID.
   * @param {string} id - The ID of the validator to remove.
   * @throws {TypeError} If the ID is not a string.
   */
  remove(id) {
    if (typeof id !== 'string') {
      throw new TypeError('The ID to remove must be a string.');
    }

    const index = this.#validators.findIndex((v) => v.id === id);
    if (index === -1) {
      throw new Error(`Validator with id "${id}" not found.`);
    }

    this.#validators.splice(index, 1);
  }

  /**
   * Reorders the validators list by moving an item from one index to another.
   * @param {number} oldIndex - The current index of the validator.
   * @param {number} newIndex - The target index for the validator.
   * @throws {TypeError} If indices are not integers.
   * @throws {RangeError} If indices are out of bounds.
   */
  reorder(oldIndex, newIndex) {
    if (!Number.isInteger(oldIndex) || !Number.isInteger(newIndex)) {
      throw new TypeError('Indices must be integers.');
    }

    if (oldIndex < 0 || oldIndex >= this.#validators.length) {
      throw new RangeError('oldIndex is out of bounds.');
    }

    if (newIndex < 0 || newIndex >= this.#validators.length) {
      throw new RangeError('newIndex is out of bounds.');
    }

    const [movedItem] = this.#validators.splice(oldIndex, 1);
    this.#validators.splice(newIndex, 0, movedItem);
  }

  /**
   * Sorts the validators using a custom comparator function.
   * @param {(a: CustomValidator, b: CustomValidator) => number} comparator - A function that defines the sort order.
   * @throws {TypeError} If the comparator is not a function.
   */
  sort(comparator) {
    if (typeof comparator !== 'function') {
      throw new TypeError('The comparator must be a function.');
    }
    this.#validators.sort(comparator);
  }

  /**
   * Clears all validators from the manager.
   */
  clear() {
    this.#validators = [];
  }

  /**
   * Gets the total number of validators currently registered.
   * @returns {number}
   */
  get size() {
    return this.#validators.length;
  }

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
    this.setRules(customRules);
  }

  /**
   * Validates the rules configuration with strict type checking.
   * @param {PasswordRules} rules
   * @throws {TypeError} If a property type is incorrect or missing.
   * @throws {RangeError} If numeric values are invalid.
   */
  #validateRulesConfig(rules) {
    if (!rules || typeof rules !== 'object') {
      throw new TypeError('Rules must be a valid object.');
    }

    // Strict boolean validation
    const booleanProps = [
      'requireLowercase',
      'requireUppercase',
      'requireNumbers',
      'requireSpecial',
    ];
    for (const prop of booleanProps) {
      // @ts-ignore
      if (typeof rules[prop] !== 'boolean') {
        throw new TypeError(`Property "${prop}" must be a boolean.`);
      }
    }

    // Strict number validation
    if (typeof rules.minLength !== 'number' || typeof rules.maxLength !== 'number') {
      throw new TypeError('minLength and maxLength must be numbers.');
    }

    if (!Number.isInteger(rules.minLength) || !Number.isInteger(rules.maxLength)) {
      throw new TypeError('minLength and maxLength must be integers.');
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
   * @param {PasswordRules} newRules - New configuration to merge.
   * @throws {TypeError} If the provided rules are invalid.
   */
  set rules(newRules) {
    if (!newRules || typeof newRules !== 'object') {
      throw new TypeError('New rules must be an object.');
    }
    this.#validateRulesConfig(newRules);
    this.#rules = newRules;
  }

  /**
   * Setter to update rules partialy with strict validation.
   * @param {Partial<PasswordRules>} newRules - New configuration to merge.
   * @throws {TypeError} If the provided rules are invalid.
   */
  setRules(newRules) {
    if (!newRules || typeof newRules !== 'object') {
      throw new TypeError('New rules must be an object.');
    }
    const mergedRules = { ...this.#rules, ...newRules };
    this.#validateRulesConfig(mergedRules);
    this.#rules = mergedRules;
  }

  /**
   * Executes all registered validators against a single password.
   * @param {string} password - The password to be validated.
   * @returns {ManagerValidationResult}
   * @throws {TypeError} If the password is not a string.
   */
  execute(password) {
    if (typeof password !== 'string') {
      throw new TypeError('The password must be a string.');
    }

    const details = this.#validators.map((validator) => validator.validate(password));
    const allPassed = details.every((result) => result.isValid);

    return {
      allPassed,
      details,
    };
  }

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
      errors.push(
        TinyPasswordValidator.#ERROR_MESSAGES[1].replace('{value}', String(this.#rules.minLength)),
      );
    } else if (password.length > this.#rules.maxLength) {
      errorCodes.push(2);
      errors.push(
        TinyPasswordValidator.#ERROR_MESSAGES[2].replace('{value}', String(this.#rules.maxLength)),
      );
    } else {
      score += 1;
    }

    // 2. Lowercase Validation
    if (this.#rules.requireLowercase) {
      totalPossiblePoints++;
      if (TinyPasswordValidator.#PATTERNS.lowercase().test(password)) {
        score++;
      } else {
        errorCodes.push(3);
        errors.push(TinyPasswordValidator.#ERROR_MESSAGES[3]);
      }
    }

    // 3. Uppercase Validation
    if (this.#rules.requireUppercase) {
      totalPossiblePoints++;
      if (TinyPasswordValidator.#PATTERNS.uppercase().test(password)) {
        score++;
      } else {
        errorCodes.push(4);
        errors.push(TinyPasswordValidator.#ERROR_MESSAGES[4]);
      }
    }

    // 4. Numbers Validation
    if (this.#rules.requireNumbers) {
      totalPossiblePoints++;
      if (TinyPasswordValidator.#PATTERNS.numbers().test(password)) {
        score++;
      } else {
        errorCodes.push(5);
        errors.push(TinyPasswordValidator.#ERROR_MESSAGES[5]);
      }
    }

    // 5. Special Characters Validation
    if (this.#rules.requireSpecial) {
      totalPossiblePoints++;
      if (TinyPasswordValidator.#PATTERNS.special().test(password)) {
        score++;
      } else {
        errorCodes.push(6);
        errors.push(TinyPasswordValidator.#ERROR_MESSAGES[6]);
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
