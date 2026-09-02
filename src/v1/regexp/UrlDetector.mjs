/**
 * @typedef {Object} UrlRegexOptions
 * @property {string} [protocol='https?']
 * @property {string} [subdomain='www']
 * @property {[number, number]} [nameMaxLength=[1, 256]]
 * @property {[number, number]} [topLevelDomainLength=[1, 6]]
 */

/**
 * @param {UrlRegexOptions} [options]
 */
export const urlStringRegexBuilder = ({
  protocol = 'https?',
  subdomain = 'www',
  nameMaxLength = [1, 256],
  topLevelDomainLength = [1, 6],
} = {}) => {
  return `${protocol}:\\/\\/(${subdomain}\\.)?[-a-zA-Z0-9@:%._\\+~#=]{${String(nameMaxLength[0])},${String(nameMaxLength[1])}}\\.[a-zA-Z0-9()]{${String(topLevelDomainLength[0])},${String(topLevelDomainLength[1])}}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)`;
};

/**
 * @param {UrlRegexOptions} [options]
 * @returns {RegExp}
 */
export function urlRegex(options) {
  return new RegExp(`^${urlStringRegexBuilder(options)}$`);
}

/**
 * @param {string} s
 * @param {UrlRegexOptions} [options]
 * @returns {boolean}
 */
export function isValidUrl(s, options) {
  if (typeof s !== 'string') {
    throw new TypeError('The input must be a string.');
  }
  return urlRegex(options).test(s);
}

/**
 * @param {UrlRegexOptions} [options]
 * @returns {RegExp}
 */
export function findUrlRegex(options) {
  return new RegExp(`\\b${urlStringRegexBuilder(options)}\\b`, 'g');
}

/**
 * @param {string} text
 * @param {UrlRegexOptions} [options]
 * @returns {RegExpMatchArray | null}
 */
export function extractUrls(text, options) {
  if (typeof text !== 'string') {
    throw new TypeError('The input must be a string.');
  }
  return text.match(findUrlRegex(options));
}
