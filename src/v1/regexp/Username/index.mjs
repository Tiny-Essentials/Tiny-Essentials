/**
 * Transformation applied to the extracted usernames.
 * @typedef {'lowercase' | 'uppercase' | ((username: string) => string) | null} UsernameTransform
 */

/**
 * Configuration options for constructing username regular expressions.
 * @typedef {Object} UsernameRegexOptions
 * @property {string} [validValues='[a-zA-Z0-9_]'] The allowed characters for the username part.
 * @property {[number, number]} [length=[3, 20]] The [min, max] length of the username part.
 * @property {string} [start] A regex pattern defining the required characters at the start of the username.
 * @property {string} [end] A regex pattern defining the required characters at the end of the username.
 * @property {string} [prefix] An optional prefix like '@' or '#'.
 * @property {string} [domain] A literal domain string (e.g., '@matrix.org'). Will be escaped automatically.
 * @property {string} [domainPattern] A regex pattern for a domain (e.g., '@[a-z0-9.-]+\\.[a-z]{2,}').
 * @property {UsernameTransform} [transform] Optional transformation applied to the extracted usernames.
 */

/**
 * @typedef {UsernameRegexOptions | UsernameRegexOptions[]} UsernameOptionsInput
 */

/**
 * Escapes special regex characters to be used in a literal string.
 * @param {string} string The string to be escaped.
 * @returns {string} The escaped string.
 */
const escapeRegExp = (string) => String(string).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Applies the requested transformation to a matched string.
 * @param {string} username The matched username string.
 * @param {UsernameTransform} [transform] The transformation rule to apply.
 * @returns {string} The transformed username string.
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
 * Generates the domain portion of a regular expression.
 * @param {UsernameRegexOptions} [options] The options containing domain or domainPattern.
 * @returns {string} The regex-ready domain portion as a string.
 */
function getDomainPart({ domain, domainPattern, end } = {}) {
  if (end !== undefined && typeof end !== 'string') {
    throw new TypeError('The "end" property must be a string.');
  }
  if (domain !== undefined && typeof domain !== 'string') {
    throw new TypeError('The "domain" property must be a string.');
  }
  if (domainPattern !== undefined && typeof domainPattern !== 'string') {
    throw new TypeError('The "domainPattern" property must be a string.');
  }

  // Priority: domainPattern (regex) > domain (literal)
  if (domainPattern) {
    return `(?:${domainPattern})${end ?? ''}`;
  } else if (domain) {
    return `(?:${escapeRegExp(domain)})${end ?? ''}`;
  }
  return end ?? '';
}

/**
 * Generates the prefix portion of a regular expression.
 * @param {UsernameRegexOptions} [options] The options containing the prefix.
 * @returns {string} The escaped prefix string.
 */
function getPrefix({ prefix, start } = {}) {
  if (start !== undefined && typeof start !== 'string') {
    throw new TypeError('The "start" property must be a string.');
  }
  if (prefix !== undefined && typeof prefix !== 'string') {
    throw new TypeError('The "prefix" property must be a string.');
  }
  return `${start ?? ''}${prefix ? escapeRegExp(prefix) : ''}`;
}

/**
 * Builds the core part of a username regular expression based on character rules and length.
 * @param {UsernameRegexOptions} [options] The options for the core pattern.
 * @returns {string} The regex string for the core username part.
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
 * Internal helper to build the pattern for a single configuration object.
 * @param {UsernameRegexOptions} [options]
 * @returns {string}
 */
function getSinglePattern(options) {
  const prefix = getPrefix(options);
  const core = usernameStringRegexBuilder(options);
  const domainPart = getDomainPart(options);
  return `${prefix}${core}${domainPart}`;
}

/**
 * Validates the UsernameRegexOptions object(s) for correct types and structure.
 * @param {UsernameOptionsInput} [options] The options object or array to validate.
 * @throws {TypeError} If validation fails due to wrong types.
 */
const validateUsernameOptions = (options) => {
  if (options === undefined) return;
  const items = Array.isArray(options) ? options : [options];

  for (const opt of items) {
    if (typeof opt !== 'object' || opt === null || Array.isArray(opt)) {
      throw new TypeError('Options must be a plain object or an array of plain objects.');
    }
  }
};

/**
 * Constructs a complete regular expression for matching a username.
 * @param {UsernameOptionsInput} [options] The options for constructing the regex.
 * @returns {RegExp} The constructed regular expression object.
 */
export function usernameRegex(options) {
  validateUsernameOptions(options);

  if (Array.isArray(options)) {
    const combinedPattern = options.map(getSinglePattern).join('|');
    return new RegExp(`^(?:${combinedPattern})$`);
  }

  return new RegExp(`^${getSinglePattern(options)}$`);
}

/**
 * Validates whether a string matches the specified username pattern.
 * @param {string} s The input string to validate.
 * @param {UsernameOptionsInput} [options] The regex construction options.
 * @returns {boolean} True if the string is a valid username, false otherwise.
 * @throws {TypeError} If the input is not a string.
 */
export function isValidUsername(s, options) {
  if (typeof s !== 'string') {
    throw new TypeError('The input must be a string.');
  }
  return usernameRegex(options).test(s);
}

/**
 * Generates a global regular expression to find usernames within a text.
 * @param {UsernameOptionsInput} [options] The options for the regex.
 * @returns {RegExp} The global regular expression for finding usernames.
 */
export function findUsernameRegex(options) {
  validateUsernameOptions(options);
  const firstOpt = Array.isArray(options) ? options[0] : options;
  const needsLookaround = firstOpt?.prefix || firstOpt?.start;
  const boundaryStart = needsLookaround ? '(?:^|(?<=\\W))' : '\\b';
  const boundaryEnd = needsLookaround ? '(?=\\W|$)' : '\\b';

  if (Array.isArray(options)) {
    const combinedPattern = options.map(getSinglePattern).join('|');
    return new RegExp(`${boundaryStart}(?:${combinedPattern})${boundaryEnd}`, 'g');
  }

  return new RegExp(`${boundaryStart}${getSinglePattern(options)}${boundaryEnd}`, 'g');
}

/**
 * Extracts usernames from a text and applies optional transformations.
 * @param {string} text The text to search through.
 * @param {UsernameOptionsInput} [options] The options for extraction.
 * @returns {string[]} An array of extracted and transformed usernames.
 * @throws {TypeError} If the input text is not a string.
 */
export function extractUsernames(text, options) {
  if (typeof text !== 'string') {
    throw new TypeError('The input must be a string.');
  }

  const matches = text.match(findUsernameRegex(options));
  if (!matches) return [];

  // If an array is provided, we use the transform from the first element
  // because a single combined regex cannot distinguish which rule matched.
  const transform = Array.isArray(options) ? options[0]?.transform : options?.transform;

  if (transform) return matches.map((match) => applyTransform(match, transform));

  return matches;
}
