const passwordPattern = '^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$';

/**
 * @typedef {Object} EmailRegexOptions
 * @property {string} [validName]
 * @property {string} [validDomain]
 * @property {string[]} [blacklistDomains]
 * @property {string[]} [whitelistDomains]
 * @property {string[]} [blacklistUsernames]
 * @property {string[]} [whitelistUsernames]
 */

/**
 * Validates the EmailRegexOptions object to ensure all properties match the required types.
 * This is a private helper used to maintain strict type safety at runtime.
 *
 * @param {EmailRegexOptions} options - The configuration options to validate.
 * @throws {TypeError} If the options are not an object or if any property fails type validation.
 * @private
 */
const validateEmailRegexOptions = (options) => {
  if (options === undefined) return;
  if (typeof options !== 'object' || options === null || Array.isArray(options)) {
    throw new TypeError('Options must be an object.');
  }

  /**
   * Helper to validate if a property is an array of strings.
   * @param {any} arr - The array to validate.
   * @param {string} name - The name of the property for the error message.
   * @private
   */
  const validateArray = (arr, name) => {
    if (arr !== undefined) {
      if (!Array.isArray(arr)) {
        throw new TypeError(`${name} must be an array.`);
      }
      for (let i = 0; i < arr.length; i++) {
        if (typeof arr[i] !== 'string') {
          throw new TypeError(`All elements in ${name} must be strings.`);
        }
      }
    }
  };

  validateArray(options.blacklistDomains, 'blacklistDomains');
  validateArray(options.whitelistDomains, 'whitelistDomains');
  validateArray(options.blacklistUsernames, 'blacklistUsernames');
  validateArray(options.whitelistUsernames, 'whitelistUsernames');
};

/**
 * Constructs a email regular expression pattern string based on the provided configuration options.
 * @param {EmailRegexOptions} [options] - The configuration options.
 * @returns {string} The generated regex pattern string.
 */
export const emailStringRegexBuilder = (options = {}) => {
  validateEmailRegexOptions(options);
  const { validName = '[a-zA-Z0-9._%+-]+', validDomain = '[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}' } = options;
  return `${validName}@${validDomain}`;
};

/**
 * Creates a RegExp object anchored to the start and end of the string using the provided configuration.
 * @param {EmailRegexOptions} [options] - The configuration options.
 * @returns {RegExp} The resulting RegExp object.
 */
export function emailRegex(options) {
  return new RegExp(`^${emailStringRegexBuilder(options)}$`);
}

/**
 * Validates whether a given string matches the specified email pattern and respects blacklist/whitelist rules.
 * @param {string} s - The string to validate.
 * @param {EmailRegexOptions} [options={}] - The configuration options.
 * @returns {boolean} True if the string is a valid email according to the pattern and filters, false otherwise.
 * @throws {TypeError} If the input string is not a string.
 */
export function isValidEmail(s, options = {}) {
  if (typeof s !== 'string') {
    throw new TypeError('The input must be a string.');
  }

  const pattern = emailRegex(options);
  if (!pattern.test(s)) {
    return false;
  }

  // Since the regex matched, we can safely split the string into username and domain.
  const [username, domain] = s.split('@');

  // Whitelist checks: If a whitelist exists, the value MUST be in it.
  if (Array.isArray(options.whitelistDomains) && !options.whitelistDomains.includes(domain)) {
    return false;
  }
  if (Array.isArray(options.whitelistUsernames) && !options.whitelistUsernames.includes(username)) {
    return false;
  }

  // Blacklist checks: If a blacklist exists, the value MUST NOT be in it.
  if (Array.isArray(options.blacklistDomains) && options.blacklistDomains.includes(domain)) {
    return false;
  }
  if (Array.isArray(options.blacklistUsernames) && options.blacklistUsernames.includes(username)) {
    return false;
  }

  return true;
}

/**
 * Generates a global RegExp object used to find all occurrences of URLs within a text.
 * @param {EmailRegexOptions} [options] - The configuration options.
 * @returns {RegExp} The resulting global RegExp object.
 */
export function findEmailRegex(options) {
  return new RegExp(`\\b${emailStringRegexBuilder(options)}\\b`, 'g');
}

/**
 * Extracts all matching email strings from a given text using the provided configuration.
 * @param {string} text - The text to search.
 * @param {EmailRegexOptions} [options] - The configuration options.
 * @returns {RegExpMatchArray | null} An array of matches or null if no matches are found.
 * @throws {TypeError} If the input text is not a string.
 */
export function extractEmails(text, options) {
  if (typeof text !== 'string') {
    throw new TypeError('The input must be a string.');
  }
  return text.match(findEmailRegex(options));
}
