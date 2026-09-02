const emailPattern = '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$';

const passwordPattern = '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$';

/**
 * @typedef {Object} UsernameRegexOptions
 * @property {string} [validValues='[a-zA-Z0-9_]'] The allowed characters for the username part.
 * @property {[number, number]} [length=[3, 20]] The [min, max] length of the username part.
 * @property {string} [prefix=null] An optional prefix like '@' or '#'.
 * @property {string} [domain=null] A literal domain string (e.g., '@matrix.org'). Will be escaped automatically.
 * @property {string} [domainPattern=null] A regex pattern for a domain (e.g., '@[a-z0-9.-]+\\.[a-z]{2,}').
 * @property {'lowercase' | 'uppercase' | ((username: string) => string) | null} [transform=null] Optional transformation applied to the extracted usernames.
 */

/**
 * Escapes special regex characters to be used in a literal string.
 * @param {string} string
 * @returns {string}
 */
const escapeRegExp = (string) => String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Applies the requested transformation to a matched string.
 * @param {string} username The matched username string.
 * @param {'lowercase' | 'uppercase' | ((username: string) => string) | null} [transform] The transformation rule.
 * @returns {string} The transformed username.
 */
const applyTransform = (username, transform) => {
  // Validation for the new transform property deeply inspecting its value
  if (transform !== undefined && transform !== null) {
    if (typeof transform !== 'function' && transform !== 'lowercase' && transform !== 'uppercase') {
      throw new TypeError(
        'The "transform" property must be a function, "lowercase", or "uppercase".',
      );
    }
  }

  if (typeof transform === 'function') return transform(username);
  if (transform === 'lowercase') return username.toLowerCase();
  if (transform === 'uppercase') return username.toUpperCase();
  return username;
};

/**
 * Validates the UsernameRegexOptions object deeply.
 * @param {UsernameRegexOptions} [options]
 * @throws {TypeError} If validation fails due to wrong types.
 * @throws {RangeError} If validation fails due to out-of-bounds values.
 */
const validateUsernameOptions = (options) => {
  if (options === undefined) return;
  if (typeof options !== 'object' || options === null || Array.isArray(options)) {
    throw new TypeError('Options must be a plain object.');
  }
};

/**
 * @param {UsernameRegexOptions} [options]
 * @returns {string}
 */
function getDomainPart({ domain, domainPattern } = {}) {
  if (domain !== undefined && typeof domain !== 'string') {
    throw new TypeError('The "domain" property must be a string.');
  }
  if (domainPattern !== undefined && typeof domainPattern !== 'string') {
    throw new TypeError('The "domainPattern" property must be a string.');
  }

  // Priority: domainPattern (regex) > domain (literal)
  if (domainPattern) {
    return `(?:${domainPattern})`;
  } else if (domain) {
    return `(?:${escapeRegExp(domain)})`;
  }
  return '';
}

/**
 * @param {UsernameRegexOptions} [options]
 * @returns {string}
 */
function getPrefix({ prefix } = {}) {
  if (prefix !== undefined && typeof prefix !== 'string') {
    throw new TypeError('The "prefix" property must be a string.');
  }
  return prefix ? escapeRegExp(prefix) : '';
}

/**
 * @param {UsernameRegexOptions} [options]
 * @returns {string}
 */
export const usernameStringRegexBuilder = ({
  validValues = '[a-zA-Z0-9_]',
  length = [3, 20],
} = {}) => {
  if (validValues !== undefined && typeof validValues !== 'string') {
    throw new TypeError('The "validValues" property must be a string.');
  }

  if (length !== undefined) {
    if (!Array.isArray(length) || typeof length[0] !== 'number' || typeof length[1] !== 'number') {
      throw new TypeError('The "length" property must be an array of two numbers.');
    }
    if (length[0] > length[1]) {
      throw new RangeError(
        'The minimum length (length[0]) cannot be greater than the maximum length (length[1]).',
      );
    }
    if (length[0] < 0) {
      throw new RangeError('The length cannot be negative.');
    }
  }

  // Enveloping validValues in a non-capturing group to prevent repetition bugs
  return `(?:${validValues}){${String(length[0])},${String(length[1])}}`;
};

/**
 * @param {UsernameRegexOptions} [options]
 * @returns {RegExp}
 */
export function usernameRegex(options) {
  validateUsernameOptions(options);
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
  validateUsernameOptions(options);
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
 * @returns {string[]}
 * @throws {TypeError}
 */
export function extractUsernames(text, options) {
  if (typeof text !== 'string') {
    throw new TypeError('The input must be a string.');
  }

  const matches = text.match(findUsernameRegex(options));
  if (!matches) return [];

  // Apply the transformation if requested by the developer
  if (options?.transform) {
    return matches.map((match) => applyTransform(match, options.transform));
  }

  return matches;
}
