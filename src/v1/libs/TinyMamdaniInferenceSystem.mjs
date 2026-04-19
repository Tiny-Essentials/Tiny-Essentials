/**
 * Utility to calculate fuzzy membership using a trapezoidal shape safely.
 * @param {number} value - The input value to check.
 * @param {number} a - Start of the rise.
 * @param {number} b - End of the rise (start of plateau).
 * @param {number} c - Start of the fall (end of plateau).
 * @param {number} d - End of the fall.
 * @returns {number} Degree of membership [0, 1].
 */
export const trapezoid = (value, a, b, c, d) => {
  // If the value is completely outside the outer bounds, return 0 immediately (Performance optimization)
  if (value <= a || value >= d) return 0;
  // If the value is entirely within the plateau, return 1 immediately
  if (value >= b && value <= c) return 1;

  /** @type {number} - Safely calculate rising slope */
  const rise = a === b ? 1 : (value - a) / (b - a);

  /** @type {number} - Safely calculate falling slope */
  const fall = c === d ? 1 : (d - value) / (d - c);

  /** @type {number} - Internal value clamping between 0 and 1 */
  const membership = Math.max(0, Math.min(rise, 1, fall));

  return isNaN(membership) ? 0 : membership;
};

/**
 * Utility to validate types and throw formatted errors, preventing code repetition.
 * @param {any} value - The value to evaluate.
 * @param {string} expectedType - The expected data type.
 * @param {string} paramName - The name of the parameter for the error message.
 */
const validateType = (value, expectedType, paramName) => {
  if (typeof value !== expectedType) {
    throw new TypeError(`Parameter '${paramName}' must be a ${expectedType}.`);
  }
};

/**
 * Represents a single Membership Function (Trapezoidal).
 */
class FuzzySet {
  /**
   * Utility to calculate fuzzy membership using a trapezoidal shape.
   * @param {number} value - The input value to check.
   * @param {number} a - Start of the rise.
   * @param {number} b - End of the rise (start of plateau).
   * @param {number} c - Start of the fall (end of plateau).
   * @param {number} d - End of the fall.
   * @returns {number} Degree of membership [0, 1].
   */
  static trapezoid(value, a, b, c, d) {
    return trapezoid(value, a, b, c, d);
  }

  /** @type {string} - Internal name of the fuzzy set */
  #name = '';
  /** @type {number} - Internal left foot coordinate */
  #a = 0;
  /** @type {number} - Internal left shoulder coordinate */
  #b = 0;
  /** @type {number} - Internal right shoulder coordinate */
  #c = 0;
  /** @type {number} - Internal right foot coordinate */
  #d = 0;

  get name() {
    return this.#name;
  }
  set name(value) {
    validateType(value, 'string', 'FuzzySet.name');
    this.#name = value;
  }

  get a() {
    return this.#a;
  }
  set a(value) {
    validateType(value, 'number', 'FuzzySet.a');
    this.#a = value;
  }

  get b() {
    return this.#b;
  }
  set b(value) {
    validateType(value, 'number', 'FuzzySet.b');
    this.#b = value;
  }

  get c() {
    return this.#c;
  }
  set c(value) {
    validateType(value, 'number', 'FuzzySet.c');
    this.#c = value;
  }

  get d() {
    return this.#d;
  }
  set d(value) {
    validateType(value, 'number', 'FuzzySet.d');
    this.#d = value;
  }

  /**
   * @param {string} name - Name of the set (e.g., "Hot").
   * @param {number} a - Left foot.
   * @param {number} b - Left shoulder.
   * @param {number} c - Right shoulder.
   * @param {number} d - Right feet.
   */
  constructor(name, a, b, c, d) {
    this.name = name;
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
  }

  /**
   * Calculates the membership degree.
   * @param {number} x - Crisp input.
   * @returns {number}
   */
  calculateMembership(x) {
    validateType(x, 'number', 'calculateMembership.x');
    return FuzzySet.trapezoid(x, this.#a, this.#b, this.#c, this.#d);
  }
}

/**
 * The Inference Engine handles linguistic variables and defuzzification.
 */
class MamdaniInferenceSystem {
  /** @type {Map<string, FuzzySet[]>} - Storage for linguistic variables */
  #variables = new Map();

  /**
   * Internal helper to validate an array of FuzzySets.
   * @param {FuzzySet[]} sets
   */
  #validateFuzzySets(sets) {
    if (!Array.isArray(sets)) {
      throw new TypeError("Parameter 'sets' must be an array.");
    }
    if (!sets.every((set) => set instanceof FuzzySet)) {
      throw new TypeError('All elements in the array must be instances of FuzzySet.');
    }
  }

  /**
   * Registers a linguistic variable and its sets.
   * @param {string} name - Variable name (e.g., "temperature").
   * @param {FuzzySet[]} sets - Array of fuzzy sets.
   */
  addVariable(name, sets) {
    validateType(name, 'string', 'addVariable.name');
    this.#validateFuzzySets(sets);
    this.#variables.set(name, sets);
  }

  /**
   * Removes a linguistic variable.
   * @param {string} name - Variable name (e.g., "temperature").
   * @returns {boolean} True if the element was successfully removed.
   */
  removeVariable(name) {
    validateType(name, 'string', 'removeVariable.name');
    return this.#variables.delete(name);
  }

  /**
   * Gets a linguistic variable and its sets.
   * @param {string} name - Variable name (e.g., "temperature").
   * @returns {FuzzySet[]}
   */
  getVariable(name) {
    validateType(name, 'string', 'getVariable.name');

    /** @type {FuzzySet[] | undefined} - Attempted fetch from map */
    const result = this.#variables.get(name);

    if (!result)
      throw new Error(`Linguistic variable '${name}' not found in the inference system.`);

    return [...result];
  }

  /**
   * Checks if a linguistic variable exists.
   * @param {string} name - Variable name (e.g., "temperature").
   * @returns {boolean}
   */
  hasVariable(name) {
    validateType(name, 'string', 'hasVariable.name');
    return this.#variables.has(name);
  }

  /**
   * Fuzzifies a crisp input into a map of memberships.
   * @param {string} varName
   * @param {number} value
   * @returns {Object.<string, number>}
   */
  fuzzify(varName, value) {
    validateType(varName, 'string', 'fuzzify.varName');
    validateType(value, 'number', 'fuzzify.value');

    /** @type {FuzzySet[]} - The sets associated with the variable */
    const sets = this.#variables.get(varName) || [];
    /** @type {Object.<string, number>} - The fuzzified results dictionary */
    const results = {};

    sets.forEach((set) => {
      results[set.name] = set.calculateMembership(value);
    });

    return results;
  }

  /**
   * Performs defuzzification using the Centroid (Center of Gravity) method.
   * @param {Object.<string, number>} fuzzyOutput - Results from rule evaluation.
   * @param {FuzzySet[]} outputSets - The sets defining the output range.
   * @param {number} [step=0.5] - Resolution of the integral approximation.
   * @returns {number} The crisp output value.
   */
  defuzzifyCentroid(fuzzyOutput, outputSets, step = 0.5) {
    validateType(fuzzyOutput, 'object', 'defuzzifyCentroid.fuzzyOutput');

    for (const outputName in fuzzyOutput) {
      validateType(fuzzyOutput[outputName], 'number', `fuzzyOutput['${outputName}']`);
    }

    this.#validateFuzzySets(outputSets);
    validateType(step, 'number', 'defuzzifyCentroid.step');

    /** @type {number} - Accumulated weighted area for centroid */
    let totalAreaWeighted = 0;
    /** @type {number} - Accumulated total area */
    let totalArea = 0;

    // Numerical integration (Centroid approximation)
    for (let i = 0; i <= 100; i += step) {
      /** @type {number} - Maximum membership found at point x(i) */
      let maxMembershipAtX = 0;

      outputSets.forEach((set) => {
        /** @type {number} - Rule strength applied to the output set */
        const strength = fuzzyOutput[set.name] || 0;
        /** @type {number} - Cut or scale the output set membership */
        const membership = Math.min(strength, set.calculateMembership(i));

        maxMembershipAtX = Math.max(maxMembershipAtX, membership);
      });

      totalAreaWeighted += i * maxMembershipAtX;
      totalArea += maxMembershipAtX;
    }

    return totalArea === 0 ? 0 : totalAreaWeighted / totalArea;
  }
}

export { FuzzySet, MamdaniInferenceSystem };
