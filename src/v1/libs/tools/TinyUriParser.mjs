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
 * @template {ParserPair} Parsers
 */
class TinyUriParser {
  /**
   * A collection of parser pairs used to iterate through and match URI strings.
   * @type {Set<Parsers>}
   */
  #parsers;

  /**
   * Initializes the TinyUriParser instance with a collection of parser pairs.
   * @param {...Parsers} parsers
   */
  constructor(...parsers) {
    this.#parsers = new Set(parsers);
  }

  /**
   * Main entry point for parsing.
   * @param {string} uriString - The raw URI string to parse.
   * @returns {ReturnType<Parsers[1]>} The parsed object.
   * @throws {TypeError | RangeError | Error} If the input is invalid or parsing fails.
   */
  parse(uriString) {
    for (const parser of this.#parsers) {
      // @ts-ignore
      if (parser[0](uriString)) return parser[1](uriString);
    }
    if (typeof uriString !== 'string') {
      throw new TypeError('The input must be a string.');
    }
    throw new Error(`Unable to determine the protocol for the provided URI: ${uriString}`);
  }
}

export default TinyUriParser;
