/**
 * @typedef {Object} PasswordRules
 * @property {boolean} requireLowercase
 * @property {boolean} requireUppercase
 * @property {boolean} requireNumbers
 * @property {boolean} requireSpecial
 * @property {number} minLength
 * @property {number} maxLength
 */

/**
 * @typedef {'strong' | 'medium' | 'weak'} PasswordStrength
 */

/**
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Indica se a senha atende a todos os requisitos configurados.
 * @property {PasswordStrength} strength - Classificação da força da senha.
 * @property {string[]} errors - Lista de mensagens descrevendo quais requisitos não foram atendidos.
 * @property {number} score
 * @property {number} totalPossiblePoints
 */

class TinyPasswordValidator {
  /** @type {PasswordRules} */
  #rules;

  /**
   * @param {Object} [customRules={}] - Configurações iniciais do validador.
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
   * Valida se as configurações de regras são válidas.
   * @param {PasswordRules} rules
   * @throws {TypeError} Se um tipo de dado estiver incorreto.
   * @throws {RangeError} Se os valores numéricos forem inválidos.
   */
  #validateRulesConfig(rules) {
    if (
      typeof rules.requireLowercase !== 'boolean' ||
      typeof rules.requireUppercase !== 'boolean' ||
      typeof rules.requireNumbers !== 'boolean' ||
      typeof rules.requireSpecial !== 'boolean'
    ) {
      throw new TypeError('As propriedades de exigência devem ser booleanas.');
    }

    if (typeof rules.minLength !== 'number' || typeof rules.maxLength !== 'number') {
      throw new TypeError('minLength e maxLength devem ser números.');
    }

    if (rules.minLength < 0 || rules.maxLength < 0) {
      throw new RangeError('Os valores de tamanho não podem ser negativos.');
    }

    if (rules.minLength > rules.maxLength) {
      throw new RangeError('minLength não pode ser maior que maxLength.');
    }
  }

  /**
   * Getter para acessar as regras atuais.
   * @returns {PasswordRules}
   */
  get rules() {
    return { ...this.#rules };
  }

  /**
   * Setter para atualizar as regras com validação rigorosa.
   * @param {PasswordRules} newRules - Novas configurações.
   */
  set rules(newRules) {
    const mergedRules = { ...this.#rules, ...newRules };
    this.#validateRulesConfig(mergedRules);
    this.#rules = mergedRules;
  }

  /**
   * Valida uma senha com base nas regras configuradas.
   * @param {string} password - A senha a ser validada.
   * @returns {ValidationResult}
   * @throws {TypeError} Se a senha fornecida não for uma string.
   */
  validate(password) {
    if (typeof password !== 'string') {
      throw new TypeError('A senha deve ser uma string.');
    }

    const errors = [];
    let score = 0;
    let totalPossiblePoints = 1; // O comprimento da senha conta como 1 ponto base

    // 1. Validação de Comprimento
    if (password.length < this.#rules.minLength) {
      errors.push(`A senha deve ter pelo menos ${this.#rules.minLength} caracteres.`);
    } else if (password.length > this.#rules.maxLength) {
      errors.push(`A senha não pode exceder ${this.#rules.maxLength} caracteres.`);
    } else {
      score += 1;
    }

    // 2. Validação de Letras Minúsculas
    if (this.#rules.requireLowercase) {
      totalPossiblePoints++;
      if (/[a-z]/.test(password)) {
        score++;
      } else {
        errors.push('A senha deve conter pelo menos uma letra minúscula.');
      }
    }

    // 3. Validação de Letras Maiúsculas
    if (this.#rules.requireUppercase) {
      totalPossiblePoints++;
      if (/[A-Z]/.test(password)) {
        score++;
      } else {
        errors.push('A senha deve conter pelo menos uma letra maiúscula.');
      }
    }

    // 4. Validação de Números
    if (this.#rules.requireNumbers) {
      totalPossiblePoints++;
      if (/\d/.test(password)) {
        score++;
      } else {
        errors.push('A senha deve conter pelo menos um número.');
      }
    }

    // 5. Validação de Caracteres Especiais
    if (this.#rules.requireSpecial) {
      totalPossiblePoints++;
      // Usando o padrão de caracteres que você forneceu no Regex original
      if (/[@$!%*?&]/.test(password)) {
        score++;
      } else {
        errors.push('A senha deve conter pelo menos um caractere especial (@$!%*?&).');
      }
    }

    // Determinação da força baseada na proporção de requisitos atendidos
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
