/**
 * A generic template for parsed URI results.
 * @template {string} Type
 * @template {Record<any, any>} Data
 * @typedef {Object} ParsedTemplate
 * @property {Type} type - The category of the URI.
 * @property {Data} data - The parsed content.
 */

/**
 * A function type used to validate whether a provided URI string matches a specific pattern or protocol.
 * @typedef {(uri: string) => boolean} ParseChecker
 */

/**
 * A function type that accepts a URI string and returns a structured `ParsedTemplate` object.
 * @template {string} Type
 * @template {Record<any, any>} Data
 * @typedef {(uri: string) => ParsedTemplate<Type, Data>} ParserCallback
 */

/**
 * A tuple representing a single parsing unit, consisting of a validation function and its corresponding parsing function.
 * @typedef {[ParseChecker, ParserCallback<any, any>]} ParserPair
 */

/**
 * A utility class designed to parse various Matrix-related URI formats into structured objects.
 * @template {ParserPair} Parser
 */
class TinyUriParser {
  /**
   * A collection of parser pairs used to iterate through and match URI strings.
   * @type {Set<Parser>}
   */
  #parsers;

  /**
   * Initializes the TinyUriParser instance with a collection of parser pairs.
   * @param {...Parser} parsers
   * @throws {TypeError} If any provided parser is not a valid ParserPair.
   */
  constructor(...parsers) {
    for (const i in parsers) {
      const parser = parsers[i];

      // 1. Check if the argument is an array (the base of a tuple/ParserPair)
      if (!Array.isArray(parser)) {
        throw new TypeError(`Parser at index ${i} must be an array representing a ParserPair.`);
      }

      // 2. Check if the array has exactly two elements [ParseChecker, ParserCallback]
      if (parser.length !== 2) {
        throw new TypeError(`Parser at index ${i} must contain exactly two elements.`);
      }

      // 3. Validate that the first element is a function (ParseChecker)
      if (typeof parser[0] !== 'function') {
        throw new TypeError(
          `The first element of the parser at index ${i} must be a function (ParseChecker).`,
        );
      }

      // 4. Validate that the second element is a function (ParserCallback)
      if (typeof parser[1] !== 'function') {
        throw new TypeError(
          `The second element of the parser at index ${i} must be a function (ParserCallback).`,
        );
      }
    }

    this.#parsers = new Set(parsers);
  }

  /**
   * Main entry point for parsing.
   * @param {string} uriString - The raw URI string to parse.
   * @returns {ReturnType<Parser[1]>} The parsed object.
   * @throws {TypeError | RangeError | Error} If the input is invalid or parsing fails.
   */
  parse(uriString) {
    if (typeof uriString !== 'string') {
      throw new TypeError('The input must be a string.');
    }
    for (const parser of this.#parsers) {
      // @ts-ignore
      if (parser[0](uriString)) return parser[1](uriString);
    }
    throw new Error(`Unable to determine the protocol for the provided URI: ${uriString}`);
  }
}

export default TinyUriParser;
