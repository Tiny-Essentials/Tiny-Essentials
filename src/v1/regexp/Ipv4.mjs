// Credits: https://oneuptime.com/blog/post/2026-03-20-validate-ipv4-regex-javascript/view

// Each octet matches 0-255 without leading zeros (except "0" itself)
const octet = '(?:25[0-5]|2[0-4]\\d|1\\d{2}|[1-9]\\d|\\d)';

/**
 * Generates a regular expression that matches a standard IPv4 address.
 * The pattern ensures the string contains exactly four octets ranging from 0 to 255, separated by periods.
 * @returns {RegExp}
 */
export function ipv4Regex() {
  return new RegExp(`^${octet}\\.${octet}\\.${octet}\\.${octet}$`);
}

/**
 * Validates whether a given input string is a correctly formatted IPv4 address.
 * It checks the string against the IPv4 regular expression pattern and returns a boolean result.
 * @param {string} s - The input string to be validated.
 * @param {RegExp} [regex] - The regex used to execute the function.
 * @returns {boolean} - True if the string is a valid IPv4 address, false otherwise.
 */
export function isValidIPv4(s, regex) {
  if (typeof s !== 'string') {
    throw new TypeError('The input must be a string.');
  }
  return (regex ?? ipv4Regex()).test(s);
}

/**
 * Creates a global regular expression used to locate IPv4 addresses within a larger block of text.
 * It utilizes word boundaries to ensure that only complete IP addresses are matched.
 * @returns {RegExp}
 */
export function findIPv4Regex() {
  return new RegExp(`\\b${octet}(?:\\.${octet}){3}\\b`, 'g');
}

/**
 * Scans the provided text and extracts all occurrences of IPv4 addresses.
 * This function uses a global regular expression to find multiple matches within the input.
 * @param {string} text - The input text content to be searched.
 * @param {RegExp} [regex] - The regex used to execute the function.
 * @returns {string[]} - An array of all matched IP addresses, or null if no matches are found.
 */
export function extractIPsV4(text, regex) {
  if (typeof text !== 'string') {
    throw new TypeError('The input must be a string.');
  }
  return text.match(regex ?? findIPv4Regex()) ?? [];
}
