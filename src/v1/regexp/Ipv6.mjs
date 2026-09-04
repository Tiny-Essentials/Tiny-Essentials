// Credits: https://oneuptime.com/blog/post/2026-03-20-validate-ipv4-regex-javascript/view
// Note: IPv6 logic is significantly more complex due to hexadecimal format and zero compression (::).

/**
 * Matches a single hexadecimal group (1 to 4 hex digits).
 * @type {string}
 */
const hexGroup = '[0-9a-fA-F]{1,4}';

/**
 * A pattern to match standard IPv6 addresses.
 * @type {string}
 */
const ipv6Pattern = `((${hexGroup}:){7}${hexGroup}|(${hexGroup}:){1,7}:|(${hexGroup}:){1,6}:${hexGroup}|(${hexGroup}:){1,5}(:${hexGroup}){1,2}|(${hexGroup}:){1,4}(:${hexGroup}){1,3}|(${hexGroup}:){1,3}(:${hexGroup}){1,4}|(${hexGroup}:){1,2}(:${hexGroup}){1,5}|${hexGroup}:((:${hexGroup}){1,6})|:((:${hexGroup}){1,7}|:))`;

/**
 * Generates a regular expression that matches a standard IPv6 address.
 * @returns {RegExp}
 */
export function ipv6Regex() {
  return new RegExp(`^${ipv6Pattern}$`);
}

/**
 * Validates whether a given input string is a correctly formatted IPv6 address.
 * @param {string} s - The input string to be validated.
 * @param {RegExp} [regex] - The regex used to execute the function.
 * @throws {TypeError} If the input is not a string.
 * @returns {boolean} - True if the string is a valid IPv6 address, false otherwise.
 */
export function isValidIPv6(s, regex) {
  if (typeof s !== 'string') {
    throw new TypeError('The input must be a string.');
  }
  return (regex ?? ipv6Regex()).test(s);
}

/**
 * Creates a global regular expression used to locate IPv6 addresses within a larger block of text.
 * It utilizes word boundaries to ensure that only complete IP addresses are matched.
 * @returns {RegExp}
 */
export function findIPv6Regex() {
  return new RegExp(`\\b${ipv6Pattern}\\b`, 'g');
}

/**
 * Scans the provided text and extracts all occurrences of IPv6 addresses.
 * This function uses a global regular expression to find multiple matches within the input.
 * @param {string} text - The input text content to be searched.
 * @param {RegExp} [regex] - The regex used to execute the function.
 * @throws {TypeError} If the input is not a string.
 * @returns {string[]} - An array of all matched IP addresses, or null if no matches are found.
 */
export function extractIPsV6(text, regex) {
  if (typeof text !== 'string') {
    throw new TypeError('The input must be a string.');
  }
  return text.match(regex ?? findIPv6Regex()) ?? [];
}
