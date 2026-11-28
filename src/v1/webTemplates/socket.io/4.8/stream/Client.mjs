import { Socket } from 'socket.io-client';
import TinyDebugger from '../../../../libs/tools/TinyDebugger.mjs';

/**
 * Names of the socket events used by the chunked stream protocol.
 *
 * @typedef {Object} EventNames
 * @property {string} streamStart - Event that opens a chunked transfer.
 * @property {string} streamChunk - Event that carries a single chunk.
 * @property {string} streamEnd - Event that closes a chunked transfer.
 */

/**
 * First event of a chunked payload.
 *
 * @typedef {Object} SocketStreamStart
 * @property {string} id - Transfer id, shared by every chunk.
 * @property {string} event - Event that will be replayed once the payload is complete.
 * @property {number} total - Amount of chunks that will be sent. Always a positive integer.
 * @property {number} [size] - Payload size in bytes. Absent when the server does not know it.
 */

/**
 * A single chunk of a chunked payload.
 *
 * @typedef {Object} SocketStreamChunk
 * @property {string} id - Transfer id, shared by every chunk.
 * @property {number} index - Zero-based position of the chunk inside the payload.
 * @property {string} data - Slice of the serialized payload.
 */

/**
 * Last event of a chunked payload.
 *
 * @typedef {Object} SocketStreamEnd
 * @property {string} id - Transfer id, shared by every chunk.
 */

/**
 * Mutable state of a transfer that is still being received.
 *
 * @typedef {Object} PendingStream
 * @property {string} event - Event replayed once the payload is complete.
 * @property {number} total - Amount of chunks announced by `stream-start`.
 * @property {string[]} parts - Received chunks, indexed by their original position.
 */

/**
 * Configuration options for initializing the debugger.
 * @typedef {Object} TinyDebuggerOptions
 * @property {boolean} [debugMode=false] - Whether to enable internal debug logging.
 * @property {boolean} [useLogColors=false] - Whether to enable log color support.
 * @property {Partial<Console>} [logger=console] - A custom logger object (must implement console methods).
 */

/**
 * Asserts that a value is a non-empty string.
 *
 * @param {unknown} value - Value under test.
 * @param {string} name - Dotted name used in the error message.
 * @returns {string} The same value, narrowed to `string`.
 * @throws {TypeError} When `value` is not a non-empty string.
 */
function assertNonEmptyString(value, name) {
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError(`"${name}" must be a non-empty string.`);
  }
  return value;
}

/**
 * Asserts that a value is a plain object and returns it as an indexable record.
 *
 * @param {unknown} value - Value under test.
 * @param {string} name - Dotted name used in the error message.
 * @returns {Record<string, unknown>} The same value, narrowed to an indexable object.
 * @throws {TypeError} When `value` is not a plain object.
 */
function assertPlainObject(value, name) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`"${name}" must be a plain object.`);
  }
  return /** @type {Record<string, unknown>} */ (value);
}

/**
 * Merges the caller overrides with the default event names.
 *
 * @param {Partial<EventNames>} socketNames - Overrides for the default event names.
 * @returns {EventNames} A complete, frozen-by-copy set of event names.
 * @throws {TypeError} When `socketNames` is not a plain object.
 * @throws {TypeError} When any provided entry is not a non-empty string.
 */
function resolveEventNames(socketNames) {
  const source = assertPlainObject(socketNames, 'socketNames');

  /** @type {EventNames} */
  const resolved = {
    streamStart: 'stream-start',
    streamChunk: 'stream-chunk',
    streamEnd: 'stream-end',
  };

  for (const key of /** @type {(keyof EventNames)[]} */ (Object.keys(resolved))) {
    const value = source[key];
    if (value === undefined) continue;
    resolved[key] = assertNonEmptyString(value, `socketNames.${key}`);
  }

  return resolved;
}

/**
 * Validates a raw `stream-start` payload.
 *
 * @param {unknown} payload - Raw payload emitted by the server.
 * @returns {SocketStreamStart} The validated payload.
 * @throws {TypeError} When `id` or `event` is not a non-empty string.
 * @throws {RangeError} When `total` is not a positive integer.
 * @throws {RangeError} When `size` is present and is not a finite number greater than or equal to zero.
 */
function assertStreamStart(payload) {
  const source = assertPlainObject(payload, 'stream-start');

  const id = assertNonEmptyString(source.id, 'stream-start.id');
  const event = assertNonEmptyString(source.event, 'stream-start.event');

  const { total, size } = source;

  if (typeof total !== 'number' || !Number.isInteger(total) || total <= 0) {
    throw new RangeError('"stream-start.total" must be a positive integer.');
  }

  if (size !== undefined && (typeof size !== 'number' || !Number.isFinite(size) || size < 0)) {
    throw new RangeError(
      '"stream-start.size" must be a finite number greater than or equal to zero.',
    );
  }

  return { id, event, total, size: /** @type {number | undefined} */ (size) };
}

/**
 * Validates a raw `stream-chunk` payload.
 *
 * @param {unknown} payload - Raw payload emitted by the server.
 * @returns {SocketStreamChunk} The validated payload.
 * @throws {TypeError} When `id` or `data` is not a string.
 * @throws {RangeError} When `index` is not a non-negative integer.
 */
function assertStreamChunk(payload) {
  const source = assertPlainObject(payload, 'stream-chunk');

  const id = assertNonEmptyString(source.id, 'stream-chunk.id');
  const { index, data } = source;

  if (typeof index !== 'number' || !Number.isInteger(index) || index < 0) {
    throw new RangeError('"stream-chunk.index" must be a non-negative integer.');
  }

  if (typeof data !== 'string') {
    throw new TypeError('"stream-chunk.data" must be a string.');
  }

  return { id, index, data };
}

/**
 * Validates a raw `stream-end` payload.
 *
 * @param {unknown} payload - Raw payload emitted by the server.
 * @returns {SocketStreamEnd} The validated payload.
 * @throws {TypeError} When `id` is not a non-empty string.
 */
function assertStreamEnd(payload) {
  const source = assertPlainObject(payload, 'stream-end');
  return { id: assertNonEmptyString(source.id, 'stream-end.id') };
}

/**
 * Reassembles the chunked payloads sent by a Socket.IO server.
 *
 * The server splits any payload above a size threshold into a
 * `stream-start` / `stream-chunk` / `stream-end` sequence. This class buffers
 * the chunks and, once the payload is complete, replays it to the local
 * listeners registered on the same socket, so the rest of the application keeps
 * using plain `socket.on('some-event', handler)`.
 *
 * @example
 * const client = new TinySocketIOStreamClient(socket);
 * socket.on('message', (payload) => console.log(payload));
 * // Later, when the component unmounts:
 * client.destroy();
 */
class TinySocketIOStreamClient extends TinyDebugger {
  /** @type {Socket} */
  #socket;

  /** @type {EventNames} */
  #socketNames;

  /**
   * Payloads that are still being received.
   *
   * The server splits anything above `STREAM_THRESHOLD` into `stream-chunk`
   * events so the browser never has to parse a multi-megabyte packet.
   *
   * @type {Map<string, PendingStream>}
   */
  #streams = new Map();

  /** @type {boolean} */
  #destroyed = false;

  /**
   * Handles the `stream-start` event.
   *
   * @param {unknown} payload - Raw payload emitted by the server.
   * @returns {void}
   */
  #handleStreamStart = (payload) => {
    if (this.#destroyed) return;

    try {
      const { id, event, total } = assertStreamStart(payload);
      this.#streams.set(id, { event, total, parts: [] });
    } catch (error) {
      this.log('error', '[stream] Discarded an invalid "stream-start" event.', error);
    }
  };

  /**
   * Handles the `stream-chunk` event.
   *
   * @param {unknown} payload - Raw payload emitted by the server.
   * @returns {void}
   */
  #handleStreamChunk = (payload) => {
    if (this.#destroyed) return;

    try {
      const { id, index, data } = assertStreamChunk(payload);
      const stream = this.#streams.get(id);
      if (!stream) return;
      stream.parts[index] = data;
    } catch (error) {
      this.log('error', '[stream] Discarded an invalid "stream-chunk" event.', error);
    }
  };

  /**
   * Handles the `stream-end` event.
   *
   * @param {unknown} payload - Raw payload emitted by the server.
   * @returns {void}
   */
  #handleStreamEnd = (payload) => {
    if (this.#destroyed) return;

    let stream;
    try {
      const { id } = assertStreamEnd(payload);
      stream = this.#streams.get(id);
      if (!stream) return;
      this.#streams.delete(id);
    } catch (error) {
      this.log('error', '[stream] Discarded an invalid "stream-end" event.', error);
      return;
    }

    let data;
    try {
      data = JSON.parse(stream.parts.join(''));
    } catch (error) {
      this.log('error', '[stream] Failed to parse payload', error);
      return;
    }

    // Dispatch to the local listeners only. `socket.emit` would send the
    // payload back to the server instead of notifying this tab.
    for (const listener of this.#socket.listeners(stream.event)) listener(data);
  };

  /**
   * Creates a client bound to a single Socket.IO connection.
   *
   * @param {Socket} socket - Socket.IO instance whose events will be observed.
   * @param {Partial<EventNames>} [socketNames] - Overrides for the default event names.
   * @param {TinyDebuggerOptions} [options]
   * @throws {TypeError} When `socket` does not implement `on`, `off` and `listeners`.
   * @throws {TypeError} When `socketNames` is not a plain object.
   * @throws {TypeError} When any `socketNames` entry is not a non-empty string.
   */
  constructor(socket, socketNames = {}, options = {}) {
    super({
      id: '[_main_class_TinySocketIOStreamClient_reset_]',
      logger: options.logger ?? console,
      debugMode: options.debugMode ?? false,
      useLogColors: options.useLogColors ?? false,
    });

    if (!(socket instanceof Socket))
      throw new TypeError("The 'socket' argument must be an instance of Socket.IO.");
    this.#socket = socket;
    this.#socketNames = resolveEventNames(socketNames);

    this.#socket.on(this.#socketNames.streamStart, this.#handleStreamStart);
    this.#socket.on(this.#socketNames.streamChunk, this.#handleStreamChunk);
    this.#socket.on(this.#socketNames.streamEnd, this.#handleStreamEnd);
  }

  /**
   * Resolved event names, as used by the socket listeners.
   *
   * @returns {EventNames} A defensive copy, safe to mutate.
   */
  get socketNames() {
    return { ...this.#socketNames };
  }

  /**
   * Whether `destroy()` has already run.
   *
   * @returns {boolean} `true` after `destroy()` has been called.
   */
  get destroyed() {
    return this.#destroyed;
  }

  /**
   * Amount of transfers that started but did not finish yet.
   *
   * @returns {number} Number of buffered, incomplete transfers.
   */
  get pendingCount() {
    return this.#streams.size;
  }

  /**
   * Detaches every socket listener and drops all partially received payloads.
   *
   * The method is idempotent: calling it more than once is safe and does not
   * touch the socket again.
   *
   * @returns {void}
   */
  destroy() {
    if (this.#destroyed) return;
    this.#destroyed = true;

    this.#socket.off(this.#socketNames.streamStart, this.#handleStreamStart);
    this.#socket.off(this.#socketNames.streamChunk, this.#handleStreamChunk);
    this.#socket.off(this.#socketNames.streamEnd, this.#handleStreamEnd);

    this.#streams.clear();
  }
}

export default TinySocketIOStreamClient;
