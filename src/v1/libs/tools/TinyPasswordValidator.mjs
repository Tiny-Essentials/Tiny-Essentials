/**
 * @typedef {Object} PasswordRules
 * @property {boolean} requireLowercase - Whether lowercase letters are required.
 * @property {boolean} requireUppercase - Whether uppercase letters are required.
 * @property {boolean} requireNumbers - Whether numeric digits are required.
 * @property {boolean} requireSpecial - Whether special characters (@$!%*?&) are required.
 * @property {number} minLength - The minimum allowed length of the password.
 * @property {number} maxLength - The maximum allowed length of the password.
 */

/**
 * @typedef {'strong' | 'medium' | 'weak'} PasswordStrength
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Indicates if the password meets all configured requirements.
 * @property {PasswordStrength} strength - Classification of the password strength.
 * @property {string[]} errors - List of error messages describing which requirements were not met.
 * @property {number} score - The number of requirements successfully met.
 * @property {number} totalPossiblePoints - The total number of points available based on the configuration.
 */

class TinyPasswordValidator {
  /** @type {PasswordRules} */
  #rules;

  /**
   * @param {Object} [customRules={}] - Initial configuration for the validator.
   * @param {boolean} [customRules.requireLowercase=true] - Se verdadeiro, exige ao menos uma letra minúscula.
   * @param {boolean} [customRules.requireUppercase=true] - Se verdadeiro, exige ao menos uma letra maiúscula.
   * @param {boolean} [customRules.requireNumbers=true] - Se verdadeiro, exige ao menos um dígito numérico.
   * @param {boolean} [customRules.requireSpecial=true] - Se verdadeiro, exige ao menos um caractere especial (@$!%*?&).
   * @param {number} [customRules.minLength=8] - O comprimento mínimo permitido para a senha.
   * @param {number} [customRules.maxLength=128] - O comprimento máximo permitido para a senha.
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
   * Validates a password based on the configured rules.
   * @param {string} password - The password to be validated.
   * @returns {ValidationResult}
   * @throws {TypeError} If the provided password is not a string.
   */
  validate(password) {
    if (typeof password !== 'string') {
      throw new TypeError('The password must be a string.');
    }

    const errors = [];
    let score = 0;
    let totalPossiblePoints = 1; // Length counts as one base point

    // 1. Length Validation
    if (password.length < this.#rules.minLength) {
      errors.push(`Password must have at least ${this.#rules.minLength} characters.`);
    } else if (password.length > this.#rules.maxLength) {
      errors.push(`Password cannot exceed ${this.#rules.maxLength} characters.`);
    } else {
      score += 1;
    }

    // 2. Lowercase Validation
    if (this.#rules.requireLowercase) {
      totalPossiblePoints++;
      if (/[a-z]/.test(password)) {
        score++;
      } else {
        errors.push('Password must contain at least one lowercase letter.');
      }
    }

    // 3. Uppercase Validation
    if (this.#rules.requireUppercase) {
      totalPossiblePoints++;
      if (/[A-Z]/.test(password)) {
        score++;
      } else {
        errors.push('Password must contain at least one uppercase letter.');
      }
    }

    // 4. Numbers Validation
    if (this.#rules.requireNumbers) {
      totalPossiblePoints++;
      if (/\d/.test(password)) {
        score++;
      } else {
        errors.push('Password must contain at least one number.');
      }
    }

    // 5. Special Characters Validation
    if (this.#rules.requireSpecial) {
      totalPossiblePoints++;
      if (/[@$!%*?&]/.test(password)) {
        score++;
      } else {
        errors.push('Password must contain at least one special character (@$!%*?&).');
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
    };
  }
}

export default TinyPasswordValidator;
