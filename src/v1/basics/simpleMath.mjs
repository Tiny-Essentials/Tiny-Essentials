/**
 * Executes a Rule of Three calculation.
 *
 * @param {number} val1 - The first reference value (numerator in direct proportion, denominator in inverse).
 * @param {number} val2 - The second reference value (denominator in direct proportion, numerator in inverse).
 * @param {number} val3 - The third value (numerator in direct proportion, denominator in inverse).
 * @param {boolean} [inverse] - Whether the calculation should use inverse proportion (true for inverse, false for direct).
 * @returns {number} The result of the Rule of Three operation.
 *
 * Rule of Three Formula (Direct Proportion):
 *      val1 / val2 = val3 / result
 *
 * For Inverse Proportion:
 *      val1 / val3 = val2 / result
 *
 * Visual Representation:
 *
 * For Direct Proportion:
 *      val1      val2
 *      -----  =  ------
 *      val3      result
 *
 * For Inverse Proportion:
 *      val1      val2
 *      -----  =  ------
 *      val3      result
 *
 * @example
 * // Direct proportion:
 * ruleOfThree.execute(2, 6, 3, false); // → 9
 *
 * @example
 * // Inverse proportion:
 * ruleOfThree.execute(2, 6, 3, true); // → 4
 */
export function ruleOfThree(val1, val2, val3, inverse = false) {
  if (typeof val1 !== 'number' || !Number.isFinite(val1))
    throw new TypeError('val1 must be a finite number.');
  if (typeof val2 !== 'number' || !Number.isFinite(val2))
    throw new TypeError('val2 must be a finite number.');
  if (typeof val3 !== 'number' || !Number.isFinite(val3))
    throw new TypeError('val3 must be a finite number.');
  if (typeof inverse !== 'boolean') throw new TypeError('inverse must be a boolean.');

  return inverse ? Number(val1 * val2) / val3 : Number(val3 * val2) / val1;
}

/**
 * Calculates the actual value that corresponds to a percentage of a base number.
 * Unlike `getPercentage`, which tells how much something represents in percent,
 * this function tells how much a given percentage *is worth* in value.
 *
 * @param {number} price - The base number to apply the percentage to.
 * @param {number} percentage - The percentage to calculate from the base.
 * @returns {number} The resulting value of the percentage.
 *
 * @example
 * getSimplePerc(200, 15); // 30
 */
export function getSimplePerc(price, percentage) {
  if (typeof price !== 'number' || !Number.isFinite(price))
    throw new TypeError('price must be a finite number.');
  if (typeof percentage !== 'number' || !Number.isFinite(percentage))
    throw new TypeError('percentage must be a finite number.');

  return price * (percentage / 100);
}

/**
 * Calculates how much percent a partial value represents of the total value.
 *
 * @param {number} part - The partial value to compare.
 * @param {number} total - The total or maximum value.
 * @returns {number} The percentage that 'part' represents of 'total'.
 *
 * @example
 * getPercentage(5, 100); // 5
 */
export function getPercentage(part, total) {
  if (typeof part !== 'number' || !Number.isFinite(part))
    throw new TypeError('part must be a finite number.');
  if (typeof total !== 'number' || !Number.isFinite(total))
    throw new TypeError('total must be a finite number.');

  if (total === 0) return 0;
  return (part / total) * 100;
}

/**
 * Calculates the age based on the given date.
 *
 * @param {number|string|Date} timeData - The birth date (can be a timestamp, ISO string, or Date object).
 * @param {Date|null} [now=null] - The Date object representing the current date. Defaults to the current date and time if not provided.
 * @returns {number|null} The age in years, or null if `timeData` is not provided or invalid.
 */
export function getAge(timeData = 0, now = null) {
  if (typeof timeData !== 'number' && typeof timeData !== 'string' && !(timeData instanceof Date)) {
    throw new TypeError('timeData must be a number, string, or Date object.');
  }

  if (now !== null && !(now instanceof Date)) {
    throw new TypeError('now must be a Date object or null.');
  }

  const birthDate = new Date(timeData);
  if (Number.isNaN(birthDate.getTime())) return null;

  const currentDate = now instanceof Date ? now : new Date();

  let age = currentDate.getFullYear() - birthDate.getFullYear();

  const currentMonth = currentDate.getMonth();
  const birthMonth = birthDate.getMonth();

  const currentDay = currentDate.getDate();
  const birthDay = birthDate.getDate();

  // Adjust if birthday hasn't occurred yet this year
  if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) age--;

  return Math.abs(age);
}

/**
 * @typedef {Object} FormattedByteResult
 * @property {string|null} unit - The resulting unit (e.g., 'MB', 'GB') or null if input is invalid.
 * @property {number|null} value - The numerical value in the chosen unit, or null if input is invalid.
 */

/**
 * Converts a byte value into a human-readable format with unit and value separated.
 *
 * @param {number} bytes - The number of bytes to format. Must be a non-negative number.
 * @param {number|null} [decimals=null] - The number of decimal places to include in the result. Defaults to null. If negative, it will be treated as 0. If null, no rounding is applied.
 * @param {string|null} [maxUnit=null] - Optional unit limit. If provided, restricts conversion to this unit at most (e.g., 'MB' prevents conversion to 'GB' or higher). Must be one of: 'Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'.
 * @returns {FormattedByteResult} An object with the converted value and its corresponding unit. Returns nulls if input is invalid.
 *
 * @example
 * formatBytes(123456789);
 * // → { unit: 'MB', value: 117.74 }
 *
 * @example
 * formatBytes(1073741824, 2, 'MB');
 * // → { unit: 'MB', value: 1024 }
 */
export function formatBytes(bytes, decimals = null, maxUnit = null) {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes < 0)
    throw new TypeError('bytes must be a positive number.');
  if (bytes === 0) return { unit: 'Bytes', value: 0 };

  if (decimals !== null && (typeof decimals !== 'number' || !Number.isFinite(decimals))) {
    throw new TypeError('decimals must be a number or null.');
  }

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  if (maxUnit !== null) {
    if (typeof maxUnit !== 'string') throw new TypeError('maxUnit must be a string or null.');
    if (!sizes.includes(maxUnit))
      throw new RangeError(`maxUnit must be one of: ${sizes.join(', ')}`);
  }

  const maxIndex = maxUnit && sizes.includes(maxUnit) ? sizes.indexOf(maxUnit) : sizes.length - 1;
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), maxIndex);

  let value = bytes / Math.pow(k, i);

  if (decimals !== null) {
    const dm = decimals < 0 ? 0 : decimals;
    value = parseFloat(value.toFixed(dm));
  }

  const unit = sizes[i];
  return { unit, value };
}

/**
 * Generates a Fibonacci-like sequence as an array of vectors.
 *
 * @param {Object} [settings={}]
 * @param {number[]} [settings.baseValues=[0, 1]] - An array of two starting numbers (e.g. [0, 1] or [1, 1]).
 * @param {number} [settings.length=10] - Total number of items to generate in the sequence.
 * @param {(a: number, b: number, index: number) => number} [settings.combiner=((a, b) => a + b)] - A custom function to combine previous two numbers.
 * @returns {number[]} The resulting Fibonacci sequence.
 *
 * FibonacciVectors2D
 * @example
 * generateFibonacciSequence({
 *   baseValues: [[0, 1], [1, 1]],
 *   length: 10,
 *   combiner: ([x1, y1], [x2, y2]) => [x1 + x2, y1 + y2]
 * });
 *
 * @beta
 */
export function genFibonacciSeq({
  baseValues = [0, 1],
  length = 10,
  combiner = (a, b) => a + b,
} = {}) {
  if (!Array.isArray(baseValues) || baseValues.length !== 2) {
    throw new Error('baseValues must be an array of exactly two numbers.');
  }
  if (typeof length !== 'number' || !Number.isInteger(length)) {
    throw new RangeError('length must be an integer.');
  }
  if (typeof combiner !== 'function') {
    throw new TypeError('combiner must be a function.');
  }

  const sequence = [...baseValues.slice(0, 2)];

  for (let i = 2; i < length; i++) {
    const next = combiner(sequence[i - 2], sequence[i - 1], i);
    sequence.push(next);
  }

  return sequence;
}

/**
 * Calculates the unit price of a coin or token based on the market capitalization and circulating supply.
 *
 * This function is typically used in financial contexts to determine the price
 * of an asset by dividing its total market capitalization by its circulating supply.
 *
 * @param {number} originalMarketCap - The total market capitalization (e.g., in USD).
 * @param {number} circulatingSupply - The number of coins/tokens currently in circulation.
 * @returns {number} The calculated price per unit of the asset.
 */
export function calculateMarketcap(originalMarketCap, circulatingSupply) {
  if (
    typeof originalMarketCap !== 'number' ||
    Number.isNaN(originalMarketCap) ||
    !Number.isFinite(originalMarketCap)
  )
    throw new TypeError('Original market cap must be a finite number.');
  if (
    typeof circulatingSupply !== 'number' ||
    Number.isNaN(circulatingSupply) ||
    !Number.isFinite(circulatingSupply)
  )
    throw new TypeError('Circulating supply must be a finite number.');
  if (circulatingSupply <= 0) throw new RangeError('Circulating supply must be greater than zero.');
  return originalMarketCap / circulatingSupply;
}

/**
 * Calculates the new price of a coin when the market cap changes.
 * @param {number} originalMarketCap - The original market cap.
 * @param {number} circulatingSupply - The circulating supply.
 * @param {number} newMarketCap - The new market cap.
 * @returns {{
 *   originalPrice: number,
 *   newPrice: number,
 *   priceChangePercent: number
 * }}
 */
export function compareMarketcap(originalMarketCap, circulatingSupply, newMarketCap) {
  if (
    typeof newMarketCap !== 'number' ||
    Number.isNaN(newMarketCap) ||
    !Number.isFinite(newMarketCap)
  )
    throw new TypeError('New market cap must be a finite number.');
  const originalPrice = calculateMarketcap(originalMarketCap, circulatingSupply);
  const newPrice = typeof newMarketCap === 'number' ? newMarketCap / circulatingSupply : NaN;
  const priceChangePercent =
    typeof newMarketCap === 'number' ? ((newPrice - originalPrice) / originalPrice) * 100 : NaN;
  return {
    originalPrice,
    newPrice,
    priceChangePercent,
  };
}
