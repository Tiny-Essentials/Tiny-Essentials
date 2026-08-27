/**
 * @typedef {Record<string, string>} PathParams
 * Represents a mapping of parameter names to their extracted values.
 */

/**
 * @typedef {Object} SegExErrorConfig
 * @property {string} pathPatternErrorMsg - Custom error message used when the pathPattern is not a string.
 */

/**
 * Represents the result of a path execution, containing extracted parameters and the match status.
 * @typedef {Object} SegExData
 * @property {PathParams} params - The extracted parameters as a key-value mapping.
 * @property {boolean} match - Indicates whether the path successfully matched the pattern.
 */

/**
 * @callback SegExExec
 * @param {string} path - The URL path to be processed.
 * @returns {SegExData} An object containing the parameters extracted from the path.
 */

/**
 * @callback SegExIsUsed
 * @returns {boolean} Returns true if the template has been used to perform a match.
 */

/**
 * @typedef {Object} SegExResult
 * @property {RegExp} regex - The compiled regular expression for the path pattern.
 * @property {string[]} paramNames - The list of parameter names extracted from the pattern.
 * @property {SegExExec} exec - Function to extract parameters from a real path.
 */

/**
 * @callback SegExReplacer
 * @param {string[]} paramNames - The accumulated list of parameter names.
 * @param {string} substring - The original substring found by the search.
 * @param {...any} args - Additional arguments captured by the RegExp (capture groups).
 * @returns {string} The replacement value for the RegExp template.
 */

/**
 *  A function that accepts a path pattern string and returns a SegExResult object.
 * @typedef {(pathPattern: string) => SegExResult} SegExFunction
 */

/**
 * Factory to create a path segment extractor based on a specific pattern.
 *
 * @param {string|RegExp} searchValue - The search pattern (string or RegExp) used to identify dynamic segments.
 * @param {SegExReplacer} replaceValue - The function defining how to transform a segment into a capture group.
 * @param {SegExErrorConfig} errorConfig - Optional configuration to customize error messages.
 * @returns {SegExFunction} A function that accepts a path pattern string and returns a SegExResult.
 * @throws {TypeError} If `searchValue` is not a string or RegExp, or if `replaceValue` is not a function.
 */
export const makeSegmentExtractor = (searchValue, replaceValue, errorConfig) => {
  // Validate searchValue
  if (
    searchValue === null ||
    (typeof searchValue !== 'string' && !(searchValue instanceof RegExp))
  ) {
    throw new TypeError('The searchValue must be a string or a RegExp.');
  }

  // Validate replaceValue
  if (typeof replaceValue !== 'function') {
    throw new TypeError('The replaceValue must be a function.');
  }

  // Deep validation for errorConfig
  if (typeof errorConfig !== 'object' || errorConfig === null) {
    throw new TypeError('The errorConfig must be an object.');
  }
  if (typeof errorConfig.pathPatternErrorMsg !== 'string') {
    throw new TypeError('The errorConfig.pathPatternErrorMsg property must be a string.');
  }

  /**
   * @param {string} pathPattern - The path pattern to compile.
   * @returns {SegExResult} The extraction logic object.
   * @throws {TypeError} If pathPattern is not a string.
   */
  return (pathPattern) => {
    if (typeof pathPattern !== 'string') {
      throw new TypeError(errorConfig.pathPatternErrorMsg);
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
     * @type {SegExExec}
     * Function to perform the regex matching and extract parameters from a given path.
     */
    const exec = (path) => {
      /** @type {PathParams} */
      const params = {};

      const match = path.match(regex);
      used = true;

      if (!match) return { params, match: false };

      // Extract dynamic parameters based on the order they were found in the regex
      paramNames.forEach((name, index) => {
        params[name] = decodeURIComponent(match[index + 1]);
      });

      return { params, match: true };
    };

    return { regex, paramNames, exec };
  };
};

/**
 * Standard implementation for extracting parameters in the `:paramName` format (e.g., "/user/:id").
 * @type {SegExFunction}
 */
export const segmentExtractorV1 = makeSegmentExtractor(
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
  { pathPatternErrorMsg: 'The argument must be a string (e.g., "/user/:id")' },
);
