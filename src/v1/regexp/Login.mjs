const emailPattern = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$';

const passwordPattern = '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$';

/**
 * @typedef {Object} UsernameRegexOptions
 * @property {string} [validValues='[a-zA-Z0-9_]'] The allowed characters for the username part.
 * @property {[number, number]} [length=[3, 20]] The [min, max] length of the username part.
 * @property {string} [prefix=null] An optional prefix like '@' or '#'.
 * @property {string} [domain=null] A literal domain string (e.g., '@matrix.org'). Will be escaped automatically.
 * @property {string} [domainPattern=null] A regex pattern for a domain (e.g., '@[a-z0-9.-]+\\.[a-z]{2,}').
 */

/**
 * Escapes special regex characters to be used in a literal string.
 * @param {string} string
 * @returns {string}
 */
const escapeRegExp = (string) => String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Validates the UsernameRegexOptions object deeply.
 * @param {UsernameRegexOptions} [options]
 * @throws {TypeError} If validation fails.
 */
const validateOptions = (options) => {
  if (options === undefined) return;
  if (typeof options !== 'object' || options === null) {
    throw new TypeError('Options must be an object.');
  }
  if (options.validValues !== undefined && typeof options.validValues !== 'string') {
    throw new TypeError('The "validValues" property must be a string.');
  }
  if (options.length !== undefined) {
    if (
      !Array.isArray(options.length) ||
      typeof options.length[0] !== 'number' ||
      typeof options.length[1] !== 'number'
    ) {
      throw new TypeError('The "length" property must be an array of two numbers.');
    }
  }
  if (options.prefix !== undefined && typeof options.prefix !== 'string') {
    throw new TypeError('The "prefix" property must be a string.');
  }
  if (options.domain !== undefined && typeof options.domain !== 'string') {
    throw new TypeError('The "domain" property must be a string.');
  }
  if (options.domainPattern !== undefined && typeof options.domainPattern !== 'string') {
    throw new TypeError('The "domainPattern" property must be a string.');
  }
};

/**
 * @param {UsernameRegexOptions} [options]
 * @returns {string}
 */
function getDomainPart(options) {
  // Priority: domainPattern (regex) > domain (literal)
  if (options?.domainPattern) {
    return `(?:${options.domainPattern})`;
  } else if (options?.domain) {
    return `(?:${escapeRegExp(options.domain)})`;
  }
  return '';
}

/**
 * @param {UsernameRegexOptions} [options]
 * @returns {string}
 */
function getPrefix(options) {
  return options?.prefix ? escapeRegExp(options.prefix) : '';
}

/**
 * @param {UsernameRegexOptions} [options]
 * @returns {string}
 */
export const usernameStringRegexBuilder = ({
  validValues = '[a-zA-Z0-9_]',
  length = [3, 20],
} = {}) => {
  validateOptions({ validValues, length });
  return `${validValues}{${String(length[0])},${String(length[1])}}`;
};

/**
 * @param {UsernameRegexOptions} [options]
 * @returns {RegExp}
 */
export function usernameRegex(options) {
  validateOptions(options);
  const prefix = getPrefix(options);
  const core = usernameStringRegexBuilder(options);
  const domainPart = getDomainPart(options);
  return new RegExp(`^${prefix}${core}${domainPart}$`);
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
  validateOptions(options);
  const prefix = getPrefix(options);
  const core = usernameStringRegexBuilder(options);
  const domainPart = getDomainPart(options);

  // FIX: \b fails when the prefix is a non-word character (like @).
  // We use a lookbehind for non-word characters or start of string,
  // and a lookahead for non-word characters or end of string.
  const boundaryStart = options?.prefix ? '(?:^|(?<=\\W))' : '\\b';
  const boundaryEnd = options?.prefix ? '(?=\\W|$)' : '\\b';

  return new RegExp(`${boundaryStart}${prefix}${core}${domainPart}${boundaryEnd}`, 'g');
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
