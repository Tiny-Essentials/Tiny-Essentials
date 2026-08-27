/**
 * @callback SegmentGetterExec
 * @param {string} path
 * @returns {Record<string, string>}
 */

/**
 * @callback SegmentGetterIsUsed
 * @returns {boolean}
 */

/**
 * @typedef {Object} SegmentGetterResult
 * @property {RegExp} regex
 * @property {string[]} paramNames
 * @property {SegmentGetterExec} exec
 * @property {SegmentGetterIsUsed} isUsed
 */

/**
 * @callback SegmentGetterReplacer
 * @param {string[]} paramNames
 * @param {string} substring
 * @param {...any} args
 * @returns {string}
 */

/**
 * @param {string|RegExp} searchValue
 * @param {SegmentGetterReplacer} replaceValue
 */
export const makeSegmentGetterTemplate =
  (searchValue, replaceValue) =>
  /**
   * @param {string} pathPattern
   * @returns {SegmentGetterResult}
   */
  (pathPattern) => {
    if (typeof pathPattern !== 'string')
      throw new TypeError('The argument must be a string (e.g., "/user/:id")');

    /** @type {boolean} */
    let used = false;

    /** @type {string[]} */
    const paramNames = [];

    const regexPath = pathPattern.replace(searchValue, (_, ...args) =>
      replaceValue(paramNames, _, ...args),
    );

    const regex = new RegExp(`^${regexPath}$`);

    /** @type {SegmentGetterExec} */
    const exec = (path) => {
      /** @type {Record<string, string>} */
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

    const isUsed = () => used;

    return { regex, paramNames, exec, isUsed };
  };

export const makeSegmentGetterV1 = makeSegmentGetterTemplate(
  /:([^/]+)/g,
  // Regex to find segments starting with ':' (e.g., ':id)
  (paramNames, _, paramName) => {
    paramNames.push(paramName);
    return '([^/]+)';
  },
);
