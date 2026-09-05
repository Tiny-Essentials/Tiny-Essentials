import { isJsonObject } from '../../basics/objChecker.mjs';

/**
 * A generic template for parsed URI results.
 * @typedef {Record<any, any>} ParsedData
 */

/**
 * A generic template for parsed URI results.
 * @template {string} Type
 * @template {ParsedData} Data
 * @typedef {Object} ParsedUri
 * @property {Type} type - The category of the URI.
 * @property {Data} data - The parsed content.
 */

/**
 * A function type used to validate whether a provided URI string matches a specific pattern or protocol.
 * @typedef {(uri: string) => boolean} ParseChecker
 */

/**
 * A function type that accepts a URI string and returns a structured `ParsedUri` object.
 * @template {string} Type
 * @template {ParsedData} Data
 * @typedef {(uri: string) => ParsedUri<Type, Data>} ParserCallback
 */

/**
 * @template {string} Type
 * @template {ParsedData} Data
 * @typedef {(parsed: Data) => string} StringifyCallback
 */

/**
 * A tuple representing a single parsing unit, consisting of a validation function,
 * its corresponding parsing function, and an reconstruction function.
 * @template {string} Type
 * @template {ParsedData} Data
 * @typedef {readonly [Type, ParseChecker, ParserCallback<Type, Data>, StringifyCallback<Type, Data>]} ParserPair
 */

/**
 * A utility class designed to parse various Matrix-related URI formats into structured objects.
 * @template {ParserPair<any, any>} Parser
 */
class TinyUriParser {
  /**
   * Creates a frozen, immutable tuple containing the type, validation condition, parsing function, and stringification function for a specific URI type.
   * @template {string} Type
   * @template {ParsedData} Data
   * @param {Type} type - The unique string identifier representing the URI category.
   * @param {ParseChecker} conditions - A validation function that returns `true` if the URI matches the specific pattern.
   * @param {(uri: string) => Data} parser - A function that extracts and returns the parsed data from the URI string.
   * @param {StringifyCallback<Type, Data>} stringify - A function used to convert the parsed data back into a URI string.
   * @returns {ParserPair<Type, Data>} An immutable tuple containing the type, validation checker, parser, and stringifier.
   */
  static buildParserPair(type, conditions, parser, stringify) {
    return Object.freeze([
      type,
      conditions,
      (uriString) => ({
        type: type,
        data: parser(uriString),
      }),
      stringify,
    ]);
  }

  /**
   * A collection of parser pairs used to iterate through and match URI strings.
   * @type {Set<Parser>}
   */
  #parsers;

  /**
   * Returns an array containing shallow copies of the registered parser pairs to prevent direct mutation of the internal set.
   * @type {Parser[]}
   */
  get parsers() {
    /** @type {Parser[]} */
    return Array.from(this.#parsers).map((parserPair) => [...parserPair]);
  }

  /**
   * Returns the total number of registered parser pairs.
   * @type {number}
   */
  get size() {
    return this.#parsers.size;
  }

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

      // 2. Check if the array has exactly four elements [Type, ParseChecker, ParserCallback, StringifyCallback]
      if (parser.length !== 4) {
        throw new TypeError(`Parser at index ${i} must contain exactly 4 elements.`);
      }

      // 3. Validate that the first element is a string (Type)
      if (parser.length !== 4) {
        throw new TypeError(
          `The first element of the parser at index ${i} must be a string (Type).`,
        );
      }

      // 4. Validate that the second element is a function (ParseChecker)
      if (typeof parser[1] !== 'function') {
        throw new TypeError(
          `The second element of the parser at index ${i} must be a function (ParseChecker).`,
        );
      }

      // 5. Validate that the third element is a function (ParserCallback)
      if (typeof parser[2] !== 'function') {
        throw new TypeError(
          `The third element of the parser at index ${i} must be a function (ParserCallback).`,
        );
      }

      // 6. Validate that the fourth element is a function (StringifyCallback)
      if (typeof parser[3] !== 'function') {
        throw new TypeError(
          `The fourth element of the parser at index ${i} must be a function (StringifyCallback).`,
        );
      }
    }

    this.#parsers = new Set(parsers);
  }

  /**
   * Main entry point for parsing.
   * @param {string} uriString - The raw URI string to parse.
   * @returns {ReturnType<Parser[2]>} The parsed object.
   * @throws {TypeError | RangeError | Error} If the input is invalid or parsing fails.
   */
  parse(uriString) {
    if (typeof uriString !== 'string') {
      throw new TypeError('The input must be a string.');
    }
    for (const parser of this.#parsers) {
      // @ts-ignore
      if (parser[1](uriString)) return parser[2](uriString);
    }
    throw new Error(`Unable to determine the protocol for the provided URI: ${uriString}`);
  }

  /**
   * Reconstructs the original URI string from a parsed object.
   * @param {ReturnType<Parser[2]>} parsedObject - The object returned by the parse method.
   * @returns {string} The reconstructed URI string.
   * @throws {TypeError | Error} If the object is invalid or no reconstructor is found.
   */
  stringify(parsedObject) {
    if (!isJsonObject(parsedObject) || typeof parsedObject.type !== 'string') {
      throw new TypeError('The input must be a valid ParsedUri object with a "type" property.');
    }

    for (const parser of this.#parsers) {
      const [type, , , reconstructor] = parser;
      if (type === parsedObject.type && typeof reconstructor === 'function') {
        const result = reconstructor(parsedObject.data);
        if (typeof result === 'string') {
          return result;
        }
      }
    }

    throw new Error(`No reconstructor found for the parsed type: ${parsedObject.type}`);
  }
}

export default TinyUriParser;
