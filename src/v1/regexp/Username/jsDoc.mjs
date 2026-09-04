/**
 * Represents the type for transformations applied to extracted usernames.
 * @typedef {import('./index.mjs').UsernameTransform} UsernameTransform
 */

/**
 * Configuration options for constructing username regular expressions.
 * @typedef {Object} UsernameRegexTemplate
 * @property {string[]} [pure] A collection of recommended regex strings for use in secondary utilities.
 * @property {string} validValues The allowed characters for the username part.
 * @property {[number, number]} [length] The [min, max] length of the username part.
 * @property {string} [start] A regex pattern defining the required characters at the start of the username.
 * @property {string} [end] A regex pattern defining the required characters at the end of the username.
 * @property {string} [prefix] An prefix like '@' or '#'.
 * @property {string} [domainPattern] A regex pattern for a domain.
 * @property {string} [domain] A literal domain string (e.g., '@matrix.org'). Will be escaped automatically.
 * @property {UsernameTransform} [transform] Optional transformation applied to the extracted usernames.
 */
