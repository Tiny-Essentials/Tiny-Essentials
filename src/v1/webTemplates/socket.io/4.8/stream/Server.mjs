import { randomUUID } from 'crypto';

/**
 * Chunked transfer for large payloads.
 *
 * Socket.IO serializes the whole packet on the server and parses it back on the
 * client, both on the main thread. A multi-megabyte roleplay message freezes the
 * tab while that happens, and it also blows past the 1 MB `maxHttpBufferSize`
 * that Socket.IO (and therefore the proxy) enforces per packet.
 *
 * Instead of sending one huge `new-message`, the payload is serialized once and
 * sliced into small `stream-chunk` events wrapped by `stream-start` and
 * `stream-end`. The client rebuilds the string and only then parses it, so the
 * browser never blocks for long and every packet stays well under the transport
 * limit.
 */

/** Payloads above this size, in bytes, are split into chunks. */
export const STREAM_THRESHOLD = 256 * 1024;

/**
 * Size of each chunk, in characters.
 *
 * Kept far below the 1 MB Socket.IO default so the JSON envelope added by the
 * transport never pushes a packet over the limit.
 */
export const STREAM_CHUNK_SIZE = 64 * 1024;

/** Events used by the chunked transfer. */
export const STREAM_EVENTS = {
  START: 'stream-start',
  CHUNK: 'stream-chunk',
  END: 'stream-end',
};

/**
 * Measures the serialized size of a payload.
 *
 * @param {unknown} data - Payload to measure.
 * @returns {number} Size in bytes, or `0` when it cannot be serialized.
 */
export const getPayloadSize = (data) => {
  try {
    return Buffer.byteLength(JSON.stringify(data) ?? '', 'utf8');
  } catch {
    return 0;
  }
};

/**
 * Emits an event, splitting the payload when it is too large.
 *
 * Small payloads are sent untouched, so the chunked path is only paid for by
 * the messages that actually need it.
 *
 * @param {(eventName: string, payload: unknown) => void} emit - Sink for the events.
 * @param {string} eventName - Event the client should receive.
 * @param {unknown} data - Payload to send.
 * @param {{ threshold?: number, chunkSize?: number }} [options] - Overrides for the defaults.
 * @returns {{ streamed: boolean, size: number, chunks: number }}
 */
export const emitStreamed = (emit, eventName, data, options = {}) => {
  const threshold = options.threshold ?? STREAM_THRESHOLD;
  const chunkSize = options.chunkSize ?? STREAM_CHUNK_SIZE;
  const size = getPayloadSize(data);

  if (size <= threshold) {
    emit(eventName, data);
    return { streamed: false, size, chunks: 1 };
  }

  // Serialize once: the client concatenates the chunks back and parses them.
  const json = JSON.stringify(data);
  const total = Math.max(1, Math.ceil(json.length / chunkSize));
  const id = randomUUID();

  emit(STREAM_EVENTS.START, { id, event: eventName, total, size });

  for (let index = 0; index < total; index++) {
    emit(STREAM_EVENTS.CHUNK, {
      id,
      index,
      data: json.slice(index * chunkSize, (index + 1) * chunkSize),
    });
  }

  emit(STREAM_EVENTS.END, { id });

  return { streamed: true, size, chunks: total };
};

/**
 * Wraps a room broadcaster so it streams large payloads.
 *
 * @param {(roomId: string, eventName: string, payload: unknown) => void} broadcast - Room broadcaster.
 * @param {{ threshold?: number, chunkSize?: number }} [options] - Overrides for the defaults.
 * @returns {(roomId: string, eventName: string, data: unknown) => void}
 */
export const createStreamBroadcast =
  (broadcast, options = {}) =>
  (roomId, eventName, data) =>
    emitStreamed((event, payload) => broadcast(roomId, event, payload), eventName, data, options);
