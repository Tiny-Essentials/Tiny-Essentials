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
 * @template {ParserCallback<any, any>} ParserCallbackData
 * A utility class designed to parse various Matrix-related URI formats into structured objects.
 */
class TinyUriParser {
/**
 * A collection of parser pairs, where each pair consists of a validation function and its corresponding parsing function.
 * @type {Set<[ParseChecker, ParserCallbackData]>}
 */
  #parsers;

  /**
   * Initializes the parser.
   * @param {[ParseChecker, ParserCallbackData][]} parsers
   */
  constructor(parsers) {
    this.#parsers = new Set(parsers);
  }

  /**
   * Main entry point for parsing.
   * @param {string} uriString - The raw URI string to parse.
   * @throws {TypeError | RangeError | Error} If the input is invalid or parsing fails.
   */
  parse(uriString) {
    for (const parser of this.#parsers) {
      if (parser[0](uriString)) return parser[1](uriString);
    }
    if (typeof uriString !== 'string') {
      throw new TypeError('The input must be a string.');
    }
    throw new Error(`Unable to determine the protocol for the provided URI: ${uriString}`);
  }
}

export default TinyUriParser;
