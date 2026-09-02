const emailPattern = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$';

const passwordPattern = '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$';

/**
 * @typedef {Object} UsernameRegexOptions
 * @property {string} [validValues='[a-zA-Z0-9_]']
 * @property {[number, number]} [length=[3,20]]
 */

/**
 * @param {UsernameRegexOptions} [options]
 * @returns {string}
 */
export const usernameStringRegexBuilder = ({
  validValues = '[a-zA-Z0-9_]',
  length = [3, 20],
} = {}) => {
  return `${validValues}{${String(length[0])},${String(length[1])}}`;
};

/**
 * @param {UsernameRegexOptions} [options]
 * @returns {RegExp}
 */
export function usernameRegex(options) {
  return new RegExp(`^${usernameStringRegexBuilder(options)}$`);
}

/**
 * @param {string} s
 * @param {UsernameRegexOptions} [options]
 * @returns {boolean}
 * @throws {TypeError}
 */
export function isValidUsername(s, options) {
  if (typeof s !== 'string') {
    throw new TypeError('The input must be a string.');
  }
  return usernameRegex(options).test(s);
}

/**
 * @param {UsernameRegexOptions} [options]
 * @returns {RegExp}
 */
export function findUsernameRegex(options) {
  return new RegExp(`\\b${usernameStringRegexBuilder(options)}\\b`, 'g');
}

/**
 * @param {string} text
 * @param {UsernameRegexOptions} [options]
 * @returns {RegExpMatchArray | null}
 * @throws {TypeError}
 */
export function extractUsernames(text, options) {
  if (typeof text !== 'string') {
    throw new TypeError('The input must be a string.');
  }
  return text.match(findUsernameRegex(options));
}
