/**
 * @typedef {Object} UrlRegexOptions - Configuration options for customizing the generated URL regular expression.
 * @property {string} [protocol='https?'] - The protocol scheme (e.g., 'http', 'https').
 * @property {string} [subDomain=''] - The subdomain string to match.
 * @property {boolean} [subDomainOptional=true] - Whether the subdomain is required or optional.
 * @property {[number, number]} [nameMaxLength=[1, 256]] - An array containing the minimum and maximum length for the domain name.
 * @property {[number, number]} [topLevelDomainLength=[1, 6]] - An array containing the minimum and maximum length for the TLD.
 */

/**
 * Validates the UrlRegexOptions object to ensure all properties match the required types.
 * This is a private helper used to maintain strict type safety at runtime.
 *
 * @param {UrlRegexOptions} options - The configuration options to validate.
 * @throws {TypeError} If the options are not an object or if any property fails type validation.
 * @private
 */
const validateUrlRegexOptions = (options) => {
  if (options === undefined) return;
  if (typeof options !== 'object' || options === null || Array.isArray(options)) {
    throw new TypeError('Options must be an object.');
  }
  if (options.protocol !== undefined && typeof options.protocol !== 'string') {
    throw new TypeError('The "protocol" property must be a string.');
  }
  if (options.subDomain !== undefined && typeof options.subDomain !== 'string') {
    throw new TypeError('The "subDomain" property must be a string.');
  }
  if (options.subDomainOptional !== undefined && typeof options.subDomainOptional !== 'boolean') {
    throw new TypeError('The "subDomainOptional" property must be a boolean.');
  }
  if (options.nameMaxLength !== undefined) {
    if (
      !Array.isArray(options.nameMaxLength) ||
      options.nameMaxLength.length !== 2 ||
      typeof options.nameMaxLength[0] !== 'number' ||
      typeof options.nameMaxLength[1] !== 'number'
    ) {
      throw new TypeError('The "nameMaxLength" property must be an array of two numbers.');
    }
  }
  if (options.topLevelDomainLength !== undefined) {
    if (
      !Array.isArray(options.topLevelDomainLength) ||
      options.topLevelDomainLength.length !== 2 ||
      typeof options.topLevelDomainLength[0] !== 'number' ||
      typeof options.topLevelDomainLength[1] !== 'number'
    ) {
      throw new TypeError('The "topLevelDomainLength" property must be an array of two numbers.');
    }
  }
};

/**
 * Constructs a URL regular expression pattern string based on the provided configuration options.
 * @param {UrlRegexOptions} [options] - The configuration options.
 * @returns {string} The generated regex pattern string.
 */
export const urlStringRegexBuilder = (options = {}) => {
  validateUrlRegexOptions(options);
  const {
    protocol = 'https?',
    subDomain = '',
    subDomainOptional = true,
    nameMaxLength = [1, 256],
    topLevelDomainLength = [1, 6],
  } = options;
  return `${protocol}:\\/\\/${subDomain ? `(${subDomain}\\.)${subDomainOptional ? '?' : ''}` : ''}[-a-zA-Z0-9@:%._\\+~#=]{${String(nameMaxLength[0])},${String(nameMaxLength[1])}}\\.[a-zA-Z0-9()]{${String(topLevelDomainLength[0])},${String(topLevelDomainLength[1])}}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)`;
};

/**
 * Creates a RegExp object anchored to the start and end of the string using the provided configuration.
 * @param {UrlRegexOptions} [options] - The configuration options.
 * @returns {RegExp} The resulting RegExp object.
 */
export function urlRegex(options) {
  return new RegExp(`^${urlStringRegexBuilder(options)}$`);
}

/**
 * Validates whether a given string matches the specified URL pattern.
 * @param {string} s - The string to validate.
 * @param {UrlRegexOptions} [options] - The configuration options.
 * @returns {boolean} True if the string is a valid URL according to the pattern, false otherwise.
 * @throws {TypeError} If the input string is not a string.
 */
export function isValidUrl(s, options) {
  if (typeof s !== 'string') {
    throw new TypeError('The input must be a string.');
  }
  return urlRegex(options).test(s);
}

/**
 * Generates a global RegExp object used to find all occurrences of URLs within a text.
 * @param {UrlRegexOptions} [options] - The configuration options.
 * @returns {RegExp} The resulting global RegExp object.
 */
export function findUrlRegex(options) {
  return new RegExp(`\\b${urlStringRegexBuilder(options)}\\b`, 'g');
}

/**
 * Extracts all matching URL strings from a given text using the provided configuration.
 * @param {string} text - The text to search.
 * @param {UrlRegexOptions} [options] - The configuration options.
 * @returns {string[]} An array of matches or null if no matches are found.
 * @throws {TypeError} If the input text is not a string.
 */
export function extractUrls(text, options) {
  if (typeof text !== 'string') {
    throw new TypeError('The input must be a string.');
  }
  return text.match(findUrlRegex(options)) ?? [];
}
