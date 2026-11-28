/** @typedef {import('socket.io-client').Socket} Socket */

/**
 * First event of a chunked payload.
 *
 * The index signature keeps the type assignable from `SocketPayload`, so the
 * socket listeners can narrow it without a cast.
 * @typedef {Object} SocketStreamStart
 * @property {string} id - Transfer id, shared by every chunk.
 * @property {string} event - Event that will be replayed once the payload is complete.
 * @property {number} total - Amount of chunks that will be sent.
 * @property {number} [size] - Payload size in bytes.
 */


/**
 *  A single chunk of a chunked payload.
 * @typedef {Object} SocketStreamChunk
 * @property {string} id - Transfer id.
 * @property {number} index - Position of the chunk.
 * @property {string} data - Slice of the serialized payload.
 */

/** 
 * Last event of a chunked payload. 
 * @typedef {Object} SocketStreamEnd
 * @property {string} id - Transfer id.
 */

class TinySocketIOStream {
  /** @type {Socket} */
  #socket;

  /**
   * Payloads that are still being received.
   *
   * The server splits anything above `STREAM_THRESHOLD` into `stream-chunk`
   * events so the browser never has to parse a multi-megabyte packet.
   *
   * @type {Map<string, { event: string, total: number, parts: string[] }>}
   */
  #streams = new Map();

  /** 
   * Reassembles the chunked payloads sent by the server.
   *
   * The chunks are concatenated as plain strings and only parsed once the
   * whole payload arrived, so a huge message never blocks the tab while it
   * is still being received.
   * @param {Socket} socket - The Socket IO Instance.
   */
  constructor(socket) {
    this.#socket = socket;

    this.#socket.on('stream-start', (result) => {
      const { id, event, total } = /** @type {SocketStreamStart} */ (result);
      if (typeof id !== 'string' || typeof event !== 'string') return;
      this.#streams.set(id, { event, total: Number(total) || 0, parts: [] });
    });

    this.#socket.on('stream-chunk', (result) => {
      const { id, index, data } = /** @type {SocketStreamChunk} */ (result);
      const stream = this.#streams.get(id);
      if (!stream) return;
      stream.parts[Number(index)] = data;
    });

    this.#socket.on('stream-end', (result) => {
      const { id } = /** @type {SocketStreamEnd} */ (result);
      const stream = this.#streams.get(id);
      if (!stream) return;
      this.#streams.delete(id);

      let data;
      try {
        data = JSON.parse(stream.parts.join(''));
      } catch (err) {
        console.error('[socket-io] [stream] Failed to parse payload', err);
        return;
      }

      // Dispatch to the local listeners only. `socket.emit` would send the
      // payload back to the server instead of notifying this tab.
      if (!this.#socket) return;
      for (const listener of this.#socket.listeners(stream.event)) listener(data);
    });
  }
}

export default TinySocketIOStream;
