import { isJsonObject } from '../../basics/objChecker.mjs';

/**
 * Represents a list of values used in dice modifier operations.
 *
 * Each entry can be either:
 * - A number (representing a fixed numeric value), or
 * - An object describing a dice roll, containing:
 *   - `value`: The rolled result.
 *   - `sides`: The number of sides of the die (e.g., 6 for a d6).
 *
 * Examples of valid entries:
 * - `5`                   → a direct numeric value
 * - `{ value: 3, sides: 6 }` → result of rolling a d6
 *
 * @typedef {(number | { value: number; sides: number })[]} DiceModifiersValues
 */

/**
 * Represents the result after applying all dice modifiers to a roll.
 *
 * @typedef {Object} ApplyDiceModifiersResult
 * @property {number} final - The final computed value after all modifiers and dice results are processed.
 * @property {ApplyDiceModifiersStep[]} steps - A detailed, ordered list of steps describing how the final value was obtained.
 */

/**
 * Represents a single step in the dice-modification process.
 *
 * @typedef {Object} ApplyDiceModifiersStep
 * @property {string[]} tokens - The parsed tokens used in this step after normalization.
 * @property {string[]} rawTokensP - The raw tokens preserved in their partially processed state.
 * @property {string[]} rawTokens - The original unprocessed tokens extracted from the expression.
 * @property {number[]} rawDiceTokenSlots - Index references pointing to where each raw dice token appears in the original expression.
 * @property {number[]} diceTokenSlots - Index references for processed/normalized dice tokens within the final evaluation sequence.
 * @property {number} total - The computed subtotal for this step, before aggregation in later steps.
 * @property {Array<number[]>} dicesResult - A list containing the result set of each dice roll.
 *    Each entry represents a single dice token and contains an array with the rolled numbers.
 */

/**
 * TinySimpleDice
 *
 * A lightweight, flexible dice rolling utility for generating random numbers.
 * You can configure the dice to allow zero, set a maximum value, and even roll
 * values suitable for indexing arrays or Sets.
 */
class TinySimpleDice {
  /**
   * Safely evaluates a mathematical expression (supports +, -, *, /, %, **, parentheses, fractions and decimals).
   * This function ensures only valid math characters are processed.
   *
   * @param {string} expression - Mathematical expression to evaluate.
   * @returns {number} The calculated numeric result.
   * @private
   */
  static _safeEvaluate(expression) {
    // Sanitize and validate only allowed math-safe characters
    if (!/^[\d+\-*/%.()\s^]+$/.test(expression)) {
      throw new Error(`Invalid characters in expression: "${expression}"`);
    }

    // Normalize power operator: allow both ** and ^ for exponentiation
    const normalized = expression.replace(/\^/g, '**');

    try {
      // Create isolated, safe Function (no variables, only math ops)
      return Function(`"use strict"; return (${normalized})`)();
    } catch (err) {
      if (!(err instanceof Error)) throw new Error('Unknown Error');
      throw new Error(`Invalid expression "${expression}": ${err.message}`);
    }
  }

  /**
   * Replaces dice patterns such as `d6`, `d32`, or multi-dice patterns like `3d6`
   * using sequential values from the provided array.
   *
   * - `d6` consumes 1 value from the array.
   * - `3d6` consumes 3 values from the array and replaces the pattern with their sum.
   *
   * If there are not enough values available, missing rolls default to 0.
   *
   * @param {string} input - The input string containing dice patterns.
   * @param {number[]} values - Sequential numeric values used to replace each dice roll.
   * @returns {string} The resulting string where each dice expression is replaced by its computed value.
   *
   * @example
   * replaceValues("You deal d6 damage", [4]);
   * // → "You deal 4 damage"
   *
   * @example
   * replaceValues("Roll 3d6 for strength", [3, 5, 2]);
   * // → "Roll 10 for strength"
   *
   * @example
   * replaceValues("Attack: 2d4 + d8", [1, 3, 7]);
   * // → "Attack: 4 + 7"
   */
  static replaceValues(input, values) {
    let index = 0;

    return input.replace(/(\d*)d(\d+)/g, (match, qty) => {
      const count = qty ? Number(qty) : 1; // default is 1dX
      let total = 0;

      for (let i = 0; i < count; i++) {
        const value = values[index++];
        total += value !== undefined ? value : 0;
      }

      return String(total);
    });
  }

  /**
   * Tokenizes an expression string while replacing dice patterns (`d6`, `3d6`, etc.)
   * with numeric values taken sequentially from the provided array.
   *
   * This function performs two operations:
   * 1. Dice replacement:
   *    - `d6` consumes 1 value.
   *    - `3d6` consumes 3 values and returns their sum.
   *    - Missing values default to 0.
   *
   * 2. Tokenization:
   *    - Numbers become numeric tokens.
   *    - Operators (`+`, `-`, `*`, `/`, `(`, `)`) become string tokens.
   *
   * Example:
   * Input:  "2d6 + 4 - d8"
   * Values: [3, 4, 5]
   * Output: [7, "+", 4, "-", 5]
   *
   * @param {string} input - The input string containing dice expressions.
   * @param {number[]} values - Sequential numbers used to replace each dice roll.
   * @returns {{ tokens: (string|number)[], text: string }} A tokenized list where dice expressions become numbers.
   *
   * @example
   * tokenizeValues("You deal d6 + 2", [4]);
   * // → [4, "+", 2]
   *
   * @example
   * tokenizeValues("3d6 + d4", [3, 5, 2, 1]);
   * // → [10, "+", 1]
   *
   * @example
   * tokenizeValues("2d4 - 1d8 + 7", [1, 3, 7]);
   * // → [4, "-", 7, "+", 7]
   */
  static tokenizeValues(input, values) {
    // Tokenizer: numbers become numbers, operators become strings.
    const replaced = TinySimpleDice.replaceValues(input, values);
    const tokens = [];
    const regex = /\d+|[()+\-*/]/g;
    let match;

    while ((match = regex.exec(replaced)) !== null) {
      if (/^\d+$/.test(match[0])) {
        tokens.push(Number(match[0]));
      } else {
        tokens.push(match[0]);
      }
    }

    return { tokens, text: replaced };
  }

  /**
   * Parses a dice configuration string supporting notations like "6d" (one d6) or "3d6" (three d6).
   * Extracts all valid dice expressions and keeps their full context as modifiers.
   *
   * @param {string} input - Comma-separated dice expressions.
   * @returns {{
   *   sides: { count: number, sides: number }[],
   *   modifiers: { index: number, original: string, expression: string }[]
   * }}
   */
  static parseString(input) {
    if (typeof input !== 'string') {
      throw new TypeError('Input must be a string.');
    }

    const parts = input
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    /** @type {{ count: number, sides: number }[]} */
    const sides = [];

    /** @type {{ index: number, original: string, expression: string }[]} */
    const modifiers = [];

    parts.forEach((part, i) => {
      // ✅ Match dice patterns:
      // - 6d  → one d6
      // - 3d6 → three d6
      // - 12d100 → twelve d100
      const regex = /\b(?:(\d+)?d(\d+))\b/g;
      let match;
      const foundDice = [];

      // --- 🔸 Resolve random choice groups like (0 | 1 | d1)
      const finalPart = part.replace(/\(([^()]+?\|[^()]+?)\)/g, (match, inner) => {
        const options =
          typeof inner === 'string'
            ? inner
                .split('|')
                .map((s) => s.trim())
                .filter(Boolean)
            : [];

        if (options.length === 0) throw new Error(`Invalid random-choice group: "${match}"`);

        const chosen = options[Math.floor(Math.random() * options.length)];
        return chosen;
      });

      while ((match = regex.exec(finalPart)) !== null) {
        const count = parseInt(match[1] || '1', 10); // Default to 1 if not specified (e.g. "d6" or "6d")
        const sidesCount = parseInt(match[2], 10);

        if (isNaN(sidesCount)) {
          throw new Error(`Invalid dice sides in expression "${match[0]}" at position ${i + 1}.`);
        }

        foundDice.push({ count, sides: sidesCount });
      }

      if (foundDice.length === 0 && Number.isNaN(parseFloat(finalPart))) {
        throw new Error(`Invalid dice expression at position ${i + 1}: "${part}"`);
      }

      // Add all found dice
      sides.push(...foundDice);

      // Store full expression
      modifiers.push({
        index: i,
        original: part,
        expression: finalPart,
      });
    });

    if (sides.length === 0) throw new Error(`Invalid dice amount.`);

    return { sides, modifiers };
  }

  /**
   * Applies parsed modifiers (expressions) to a base number.
   * Replaces only the first number in the expression with the current result
   * before evaluation. Returns an object containing a step-by-step history.
   *
   * @param {DiceModifiersValues} values - Starting number (e.g., dice base value).
   * @param {{ expression: string, original: string }[]} modifiers - Parsed modifiers from TinySimpleDice.parseString.
   * @returns {ApplyDiceModifiersResult}
   */
  static applyModifiers(values, modifiers) {
    if (
      !Array.isArray(values) ||
      !values.every(
        (n) =>
          (typeof n === 'number' && !Number.isNaN(n)) ||
          (isJsonObject(n) &&
            typeof n.value === 'number' &&
            !Number.isNaN(n.value) &&
            typeof n.sides === 'number' &&
            !Number.isNaN(n.sides)),
      )
    )
      throw new TypeError('Bases must be a valid numbers.');

    if (!Array.isArray(modifiers))
      throw new TypeError('Modifiers must be an array of modifier objects.');

    let result = 0;

    /** @type {ApplyDiceModifiersStep[]} */
    const steps = [];
    /** @type {DiceModifiersValues} */
    const iv = [...values];

    for (const index in modifiers) {
      const mod = modifiers[index];
      if (typeof mod.expression !== 'string') {
        throw new Error('Each modifier must include an expression string.');
      }

      const originalExp = mod.original;
      const expression = mod.expression;

      /** @type {Array<number[]>} */
      const dices = [];

      /** @type {number[]} */
      const diceTokenSlots = [];
      /** @type {number[]} */
      const rawDiceTokenSlots = [];

      /**
       * Tokenize expression for manipulation or display.
       * Supports dice, numbers, parentheses, math ops, and choice groups.
       * Ensures (0 | 1 | d1) is treated as ONE token.
       * @param {string} value
       * @returns {string[]}
       */
      const matchTokens = (value) =>
        value.match(/\(\s*[^()]+\|\s*[^()]+\s*\)|\b\d*d\d+\b|[-+]?\d+(?:\.\d+)?|[+\-*/%^()]/g) ||
        [];

      const rawTokens = matchTokens(expression);
      const rawTokensOriginal = matchTokens(originalExp);
      const tokens = [...rawTokens];
      /** @type {string[]} */
      const rawSlotsUsed = [];

      // ✅ Replace the first numeric literal (integer/decimal) that may be inside parentheses
      // @ts-ignore
      const replacedExpr = expression.replace(/\b\d*d\d+\b/g, (m0) => {
        // Parse dice numbers
        const diceParsed = m0.split('d');
        const getRawTokenSlot = () => {
          for (const index in rawTokens) {
            if (rawTokens[index] === m0 && rawSlotsUsed.indexOf(index) < 0) {
              rawSlotsUsed.push(index);
              rawDiceTokenSlots.push(Number(index));
              break;
            }
          }
        };

        /**
         * Validates that the dice value does not exceed the number of sides.
         * @param {{ value: number; sides: number }} r - The dice roll result and the number of sides.
         * @throws {Error} If the value is greater than the number of sides.
         */
        const diceValidator = (r) => {
          if (r.value > r.sides)
            throw new Error(
              `Invalid dice roll: value (${r.value}) must be between 1 and ${r.sides}.`,
            );
        };

        // 1dn
        if (diceParsed[0].trim().length === 0) {
          const r = iv.shift();
          const rv = typeof r === 'number' ? r : isJsonObject(r) ? r.value : 0;
          if (isJsonObject(r)) diceValidator(r);

          dices.push([rv]);

          for (const index in tokens) {
            if (tokens[index] === m0) {
              tokens[index] = String(rv);
              diceTokenSlots.push(Number(index));
              break;
            }
          }

          getRawTokenSlot();
          return rv;
        }

        // ndn
        /** @type {number[]} */
        const dices2 = [];
        const diceAmount = Number(diceParsed[0]);

        const newTokensInsert = ['('];
        let total = '(';
        for (let i = 0; i < diceAmount; i++) {
          const r = iv.shift();
          const rv = typeof r === 'number' ? r : isJsonObject(r) ? r.value : 0;
          if (isJsonObject(r)) diceValidator(r);

          newTokensInsert.push(String(rv));

          const finishSpace = i < diceAmount - 1 ? ' + ' : ')';
          newTokensInsert.push(finishSpace);

          total += `${rv}${finishSpace}`;
          dices2.push(rv);
        }

        for (const index in tokens) {
          const i = Number(index);
          if (tokens[i] === m0) {
            tokens.splice(i, 1, ...newTokensInsert);
            // Each new item a new string is added
            let amount = 1;
            for (let i2 = 0; i2 < diceAmount; i2++) {
              diceTokenSlots.push(i + i2 + amount);
              amount++;
            }
            break;
          }
        }
        dices.push(dices2);

        getRawTokenSlot();
        return total;
      });

      /** @type {number} */
      let evaluated;
      try {
        evaluated = TinySimpleDice._safeEvaluate(replacedExpr);
      } catch (err) {
        if (!(err instanceof Error)) throw new Error('Unknown Error');
        throw new Error(
          `Error evaluating expression "${replacedExpr}" (from "${expression}"): ${err.message}`,
        );
      }

      steps.push({
        rawTokensP: rawTokens,
        rawTokens: rawTokensOriginal,
        tokens,
        rawDiceTokenSlots,
        diceTokenSlots,
        dicesResult: dices,
        total: evaluated,
      });

      result += evaluated;
    }

    // Complete
    return {
      final: result,
      steps,
    };
  }

  /**
   * Rolls a dice specifically for choosing an array or Set index.
   * @param {any[]|Set<any>} arr - The array or Set to get a random index from.
   * @returns {number} - Valid index for the array or Set.
   * @throws {TypeError} If the input is not an array or Set.
   */
  static rollArrayIndex(arr) {
    const isArray = Array.isArray(arr);
    const isSet = arr instanceof Set;
    if (!isArray && !isSet) throw new TypeError('rollArrayIndex expects an array or Set.');
    return Math.floor(Math.random() * (isArray ? arr.length : arr.size));
  }

  /** @type {number} */
  #maxValue;
  /** @type {boolean} */
  #allowZero;

  /**
   * Maximum value the dice can roll.
   * @type {number}
   */
  get maxValue() {
    return this.#maxValue;
  }

  /**
   * Set the maximum value the dice can roll.
   * @param {number} value - New maximum value (must be a non-negative integer)
   * @throws {TypeError} If value is not a non-negative integer
   */
  set maxValue(value) {
    if (!Number.isInteger(value) || value < 0)
      throw new TypeError('maxValue must be an integer greater than -1.');
    this.#maxValue = value;
  }

  /**
   * Whether 0 is allowed as a result.
   * @type {boolean}
   */
  get allowZero() {
    return this.#allowZero;
  }

  /**
   * Set whether 0 is allowed as a result.
   * @param {boolean} value - true to allow 0, false to disallow
   * @throws {TypeError} If value is not a boolean
   */
  set allowZero(value) {
    if (typeof value !== 'boolean') throw new TypeError('allowZero must be a boolean.');
    this.#allowZero = value;
  }

  /**
   * Creates a new TinySimpleDice instance.
   * @param {Object} options - Configuration options for the dice.
   * @param {number} options.maxValue - Maximum value the dice can roll.
   * @param {boolean} [options.allowZero=true] - Whether 0 is allowed as a result.
   * @throws {TypeError} If maxValue is not a non-negative integer or allowZero is not boolean.
   */
  constructor({ maxValue, allowZero = true }) {
    if (typeof allowZero !== 'boolean') throw new TypeError('allowZero must be an boolean.');
    if (!Number.isInteger(maxValue) || maxValue < 0)
      throw new TypeError('maxValue must be an integer greater than -1.');
    this.#maxValue = maxValue;
    this.#allowZero = allowZero;
  }

  /**
   * Rolls the dice according to the configuration.
   * @returns {number} - Random number according to the dice configuration.
   */
  roll() {
    const min = this.#allowZero ? 0 : 1;
    return Math.floor(Math.random() * (this.#maxValue - min + 1)) + min;
  }
}

export default TinySimpleDice;
