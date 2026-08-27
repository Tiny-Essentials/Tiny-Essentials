/**
 * @typedef {Record<string, string>} PathParams
 * Represents a mapping of parameter names to their extracted values.
 */

/**
 * @callback SegmentGetterExec
 * @param {string} path - The URL path to be processed.
 * @returns {PathParams} An object containing the parameters extracted from the path.
 */

/**
 * @callback SegmentGetterIsUsed
 * @returns {boolean} Returns true if the template has been used to perform a match.
 */

/**
 * @typedef {Object} SegmentGetterResult
 * @property {RegExp} regex - The compiled regular expression for the path pattern.
 * @property {string[]} paramNames - The list of parameter names extracted from the pattern.
 * @property {SegmentGetterExec} exec - Function to extract parameters from a real path.
 * @property {SegmentGetterIsUsed} isUsed - Function to check if the template has been used.
 */

/**
 * @callback SegmentGetterReplacer
 * @param {string[]} paramNames - The accumulated list of parameter names.
 * @param {string} substring - The original substring found by the search.
 * @param {...any} args - Additional arguments captured by the RegExp (capture groups).
 * @returns {string} The replacement value for the RegExp template.
 */

/**
 * Factory to create a path segment extractor based on a specific pattern.
 *
 * @param {string|RegExp} searchValue - The search pattern (string or RegExp) used to identify dynamic segments.
 * @param {SegmentGetterReplacer} replaceValue - The function defining how to transform a segment into a capture group.
 * @returns {(pathPattern: string) => SegmentGetterResult} A function that accepts a path pattern string and returns a SegmentGetterResult.
 * @throws {TypeError} If `searchValue` is not a string or RegExp, or if `replaceValue` is not a function.
 */
export const makeSegmentGetterTemplate = (searchValue, replaceValue) => {
  if (
    searchValue === null ||
    (typeof searchValue !== 'string' && !(searchValue instanceof RegExp))
  ) {
    throw new TypeError('The searchValue must be a string or a RegExp.');
  }

  if (typeof replaceValue !== 'function') {
    throw new TypeError('The replaceValue must be a function.');
  }

  /**
   * @param {string} pathPattern - The path pattern to compile (e.g., "/user/:id").
   * @returns {SegmentGetterResult} The extraction logic object.
   * @throws {TypeError} If pathPattern is not a string.
   */
  return (pathPattern) => {
    if (typeof pathPattern !== 'string') {
      throw new TypeError('The argument must be a string (e.g., "/user/:id")');
    }

    /** @type {boolean} */
    let used = false;

    /** @type {string[]} */
    const paramNames = [];

    const regexPath = pathPattern.replace(searchValue, (_, ...args) =>
      replaceValue(paramNames, _, ...args),
    );

    const regex = new RegExp(`^${regexPath}$`);

    /**
     * @type {SegmentGetterExec}
     */
    const exec = (path) => {
      /** @type {PathParams} */
      const params = {};

      const match = path.match(regex);
      used = true;

      if (!match) return params;

      // Extract dynamic parameters based on the order they were found in the regex
      paramNames.forEach((name, index) => {
        params[name] = decodeURIComponent(match[index + 1]);
      });

      return params;
    };

    /**
     * @type {SegmentGetterIsUsed}
     */
    const isUsed = () => used;

    return { regex, paramNames, exec, isUsed };
  };
};

/**
 * Standard implementation for extracting parameters in the `:paramName` format.
 * @type {(pathPattern: string) => SegmentGetterResult}
 */
export const makeSegmentGetterV1 = makeSegmentGetterTemplate(
  /:([^/]+)/g,
  /**
   * @param {string[]} paramNames - The accumulated list of parameter names.
   * @param {string} _ - The full matched substring (e.g., ":id").
   * @param {string} paramName - The captured parameter name (e.g., "id").
   * @returns {string} The regex capture group string.
   */
  (paramNames, _, paramName) => {
    paramNames.push(paramName);
    return '([^/]+)';
  },
);
