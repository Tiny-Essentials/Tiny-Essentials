/**
 * @template {string} Type
 * @template {Record<any, any>} Data
 * @typedef {Object} ParsedTemplate
 * @property {Type} type - The category of the URI.
 * @property {Data} data - The parsed content.
 */

/**
 * @typedef {Object} MXCData
 * @property {'mxc'} dataType - The category of the data.
 * @property {string} server - The Matrix server domain (e.g., 'matrix.org').
 * @property {string} deviceId - The unique identifier for the device or room.
 */

/**
 * @typedef {Object} MatrixSchemeData
 * @property {'matrix_scheme'} dataType - The category of the data.
 * @property {'room' | 'user' | 'event'} type - The type of the matrix resource.
 * @property {string} resourceId - The primary identifier (room ID or user ID).
 * @property {string} [eventId] - The specific event ID (only if type is 'event').
 * @property {string|null} server - The matrix server domain.
 * @property {Record<string, string>} params - Key-value pairs of query parameters (e.g., { via: 'server.com' }).
 */

/**
 * @typedef {Object} MatrixWebData
 * @property {'matrix_web_url'} dataType - The category of the data.
 * @property {string} originalUrl - The full original input URL.
 * @property {string} decodedFragment - The decoded string from the URL fragment.
 * @property {MatrixSchemeData | MXCData} parsed - The result of the parsed resource.
 */

/**
 * @typedef {ParsedTemplate<'mxc', MXCData>} ParsedMXC
 */

/**
 * @typedef {ParsedTemplate<'matrix_scheme', MatrixSchemeData>} ParsedSchemeData
 */

/**
 * @typedef {ParsedTemplate<'matrix_web_url', MatrixWebData>} ParsedWebData
 */

/**
 * @typedef {ParsedTemplate<'custom', Record<string, any>>} ParsedCustom
 */

class TinyUriParser {
  /** @type {Map<string, (uri: string) => any>} */
  #customParsers;

  /**
   * Initializes the parser.
   * @param {Map<string, (uri: string) => any>} [customParsers] - Map of custom protocols to their parsing functions.
   */
  constructor(customParsers = new Map()) {
    this.#customParsers = customParsers;
  }

  /**
   * Main entry point for parsing.
   * @param {string} uriString - The raw URI string to parse.
   * @returns {ParsedMXC|ParsedSchemeData|ParsedWebData|ParsedCustom} The parsed object.
   * @throws {TypeError | RangeError | Error} If the input is invalid or parsing fails.
   */
  parse(uriString) {
    if (typeof uriString !== 'string') {
      throw new TypeError('The input must be a string.');
    }

    if (uriString.startsWith('mxc://')) {
      return {
        type: 'mxc',
        data: this.#parseMxc(uriString),
      };
    }

    if (uriString.startsWith('matrix:')) {
      return {
        type: 'matrix_scheme',
        data: this.#parseMatrixScheme(uriString),
      };
    }

    // Check for Web URLs (e.g., https://matrix.to/#/...)
    if (uriString.includes('://') && uriString.includes('#/')) {
      return {
        type: 'matrix_web_url',
        data: this.#parseWebUrl(uriString),
      };
    }

    // Check custom protocols
    for (const [protocol, parser] of this.#customParsers) {
      if (uriString.startsWith(`${protocol}:`)) {
        return {
          type: 'custom',
          data: parser(uriString),
        };
      }
    }

    throw new Error(`Unable to determine the protocol for the provided URI: ${uriString}`);
  }

  /**
   * Parses MXC URIs.
   * @param {string} uri
   * @returns {MXCData}
   */
  #parseMxc(uri) {
    const regex = /^mxc:\/\/([^/]+)\/(.+)$/;
    const match = uri.match(regex);

    if (!match) {
      throw new Error(`Invalid MXC URI format: ${uri}`);
    }

    const [_, server, deviceId] = match;

    /** @type {MXCData} */
    const data = { server, deviceId, dataType: 'mxc' };
    this.#validateMXCData(data);
    return data;
  }

  /**
   * Parses Matrix Scheme URIs (matrix:r/..., matrix:u/..., etc).
   * @param {string} uri
   * @returns {MatrixSchemeData}
   */
  #parseMatrixScheme(uri) {
    // Regex handles: matrix:<type>/<resource>[/e/<event>][<query>]
    // Types supported: r, u, roomid
    const regex =
      /^matrix:(?<prefix>r|u|roomid)\/(?<resource>[^?/\s]+)(?:\/e\/(?<event>[^?/\s]+))?(?<query>\?.*)?$/;
    const match = uri.match(regex);

    if (!match) {
      throw new Error(`Invalid Matrix Scheme URI: ${uri}`);
    }

    // @ts-ignore
    const { prefix, resource, event, query } = match.groups;

    /** @type {MatrixSchemeData} */
    const data = {
      dataType: 'matrix_scheme',
      type: prefix === 'r' || prefix === 'roomid' ? 'room' : 'user',
      resourceId: resource,
      server: null, // Will be extracted from resource if possible, or left for normalization
      params: {},
    };

    // Transforms the query string into a key/value object
    if (query) {
      const searchParams = new URLSearchParams(query);
      data.params = Object.fromEntries(searchParams.entries());
    }

    if (event) {
      data.type = 'event';
      data.eventId = event;
    }

    // Extract server from resource (e.g., "somewhere:example.org")
    const lastColonIndex = resource.lastIndexOf(':');
    if (lastColonIndex !== -1) {
      data.server = resource.substring(lastColonIndex + 1);
      data.resourceId = resource.substring(0, lastColonIndex);
    } else {
      data.server = null; // Fallback
    }

    this.#validateMatrixSchemeData(data);
    return data;
  }

  /**
   * Parses Matrix Web URLs by decoding the fragment.
   * @param {string} url
   * @returns {MatrixWebData}
   */
  #parseWebUrl(url) {
    const urlObj = new URL(url);
    const fragment = urlObj.hash.substring(2); // Remove '#/'
    const decodedFragment = decodeURIComponent(fragment);

    let parsedResource;

    // Normalization logic: Convert web shorthand to Matrix Scheme
    if (decodedFragment.startsWith('#') || decodedFragment.startsWith('!')) {
      // It's a room
      const normalizedResource = decodedFragment.startsWith('#')
        ? `matrix:r/${decodedFragment.substring(1)}`
        : `matrix:r/${decodedFragment}`;
      parsedResource = this.#parseMatrixScheme(normalizedResource);
    } else if (decodedFragment.startsWith('@')) {
      // It's a user
      const normalizedResource = `matrix:u/${decodedFragment.substring(1)}`;
      parsedResource = this.#parseMatrixScheme(normalizedResource);
    } else {
      // Fallback: treat decoded fragment as a direct matrix scheme
      parsedResource = this.#parseMatrixScheme(`matrix:${decodedFragment}`);
    }

    return {
      dataType: 'matrix_web_url',
      originalUrl: url,
      decodedFragment,
      parsed: parsedResource,
    };
  }

  /**
   * @param {MXCData} data
   */
  #validateMXCData(data) {
    if (typeof data.server !== 'string' || data.server.length === 0) {
      throw new TypeError('MXCData: server must be a non-empty string.');
    }
    if (typeof data.deviceId !== 'string' || data.deviceId.length === 0) {
      throw new TypeError('MXCData: deviceId must be a non-empty string.');
    }
  }

  /**
   * @param {MatrixSchemeData} data
   */
  #validateMatrixSchemeData(data) {
    const validTypes = ['room', 'user', 'event'];
    if (!validTypes.includes(data.type)) {
      throw new TypeError(`MatrixSchemeData: Invalid type "${data.type}".`);
    }
    if (typeof data.resourceId !== 'string' || data.resourceId.length === 0) {
      throw new TypeError('MatrixSchemeData: resourceId must be a non-empty string.');
    }
    if (data.server !== null && (typeof data.server !== 'string' || data.server.length === 0)) {
      throw new TypeError('MatrixSchemeData: server must be a non-empty string.');
    }
    if (data.type === 'event' && (typeof data.eventId !== 'string' || data.eventId.length === 0)) {
      throw new TypeError(
        'MatrixSchemeData: eventId must be a non-empty string when type is "event".',
      );
    }
    if (data.params && typeof data.params !== 'object') {
      throw new TypeError('MatrixSchemeData: params must be an object.');
    }
  }
}

export default TinyUriParser;
