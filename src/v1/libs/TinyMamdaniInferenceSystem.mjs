/**
 * Utility to calculate fuzzy membership using a trapezoidal shape.
 * @param {number} value - The input value to check.
 * @param {number} a - Start of the rise.
 * @param {number} b - End of the rise (start of plateau).
 * @param {number} c - Start of the fall (end of plateau).
 * @param {number} d - End of the fall.
 * @returns {number} Degree of membership [0, 1].
 */
export const trapezoid = (value, a, b, c, d) => {
  /** @type {number} - Slope rising from zero to one */
  const rise = (value - a) / (b - a);

  /** @type {number} - Slope falling from one to zero */
  const fall = (d - value) / (d - c);

  /** @type {number} - Internal value clamping between 0 and 1 */
  const membership = Math.max(0, Math.min(rise, 1, fall));
  return isNaN(membership) ? 0 : membership;
};

/**
 * Represents a single Membership Function (Trapezoidal).
 */
class FuzzySet {
  #name;
  #a;
  #b;
  #c;
  #d;

  get name() {
    return this.#name;
  }

  set name(value) {
    if (typeof value !== 'string') throw new TypeError('');
    this.#name = value;
  }

  get a() {
    return this.#a;
  }

  set a(value) {
    if (typeof value !== 'number') throw new TypeError('');
    this.#a = value;
  }

  get b() {
    return this.#b;
  }

  set b(value) {
    if (typeof value !== 'number') throw new TypeError('');
    this.#b = value;
  }

  get c() {
    return this.#c;
  }

  set c(value) {
    if (typeof value !== 'number') throw new TypeError('');
    this.#c = value;
  }

  get d() {
    return this.#d;
  }

  set d(value) {
    if (typeof value !== 'number') throw new TypeError('');
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
    this.#name = name;
    this.#a = a;
    this.#b = b;
    this.#c = c;
    this.#d = d;
  }

  /**
   * Calculates the membership degree.
   * @param {number} x - Crisp input.
   * @returns {number}
   */
  calculateMembership(x) {
    return trapezoid(x, this.#a, this.#b, this.#c, this.#d);
  }
}

/**
 * The Inference Engine handles linguistic variables and defuzzification.
 */
class MamdaniInferenceSystem {
  /** @type {Map<string, FuzzySet[]>} */
  #variables = new Map();

  /**
   * Registers a linguistic variable and its sets.
   * @param {string} name - Variable name (e.g., "temperature").
   * @param {FuzzySet[]} sets - Array of fuzzy sets.
   */
  addVariable(name, sets) {
    this.#variables.set(name, sets);
  }

  /**
   * Fuzzifies a crisp input into a map of memberships.
   * @param {string} varName
   * @param {number} value
   * @returns {Object.<string, number>}
   */
  fuzzify(varName, value) {
    /** @type {FuzzySet[]} */
    const sets = this.#variables.get(varName) || [];
    /** @type {Object.<string, number>} */
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
   * @returns {number} The crisp output value.
   */
  defuzzifyCentroid(fuzzyOutput, outputSets) {
    /** @type {number} */
    let totalAreaWeighted = 0;
    /** @type {number} */
    let totalArea = 0;
    /** @type {number} - Resolution of the integral approximation */
    const step = 0.5;

    // Numerical integration (Centroid approximation)
    for (let i = 0; i <= 100; i += step) {
      /** @type {number} */
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
