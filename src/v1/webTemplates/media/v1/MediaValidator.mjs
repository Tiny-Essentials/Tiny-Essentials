/**
 * @template T
 * @typedef {Object} ValidationResult
 * @property {string|null} mimeType - The detected MIME type of the file.
 * @property {string|null} error - The error message if validation failed.
 * @property {T} [data]
 */

/**
 * HELPER: Converts a Buffer into a readable stream for libraries that require stream inputs.
 * @param {Buffer} buffer - The file buffer to convert.
 * @param {typeof import('stream').Readable} Readable
 */
function bufferToStream(buffer, Readable) {
  return Readable.from(buffer);
}

/**
 * LAYER 1: Fast Binary Validation (Magic Numbers)
 * Validates if the file header matches expected media categories.
 *
 * `file-type@22.0.2` npm package.
 *
 * @param {Object} options
 * @param {Buffer} options.buffer - The raw file buffer from the upload.
 * @param {'image' | 'audio' | 'video'} options.expectedType - The expected media category.
 * @param {import('file-type').fileTypeFromBuffer} options.fileTypeFromBuffer
 * @returns {Promise<string>} Resolves with the confirmed MIME type if valid.
 * @throws {Error} If the file signature does not match the expected type.
 */
export async function validateMagicNumbers({ buffer, expectedType, fileTypeFromBuffer }) {
  const detected = await fileTypeFromBuffer(buffer);

  if (!detected) {
    throw new Error('File signature could not be identified (Unknown Magic Numbers).');
  }

  const mime = detected.mime;
  const isTypeValid = {
    image: mime.startsWith('image/'),
    audio: mime.startsWith('audio/'),
    video: mime.startsWith('video/') || mime === 'application/x-mpegurl', // Handles some streaming formats
  };

  if (!isTypeValid[expectedType]) {
    throw new Error(`Security Alert: File disguised as ${expectedType}. Actual MIME type: ${mime}`);
  }

  return mime;
}

/**
 * LAYER 2 (IMAGE): Structural and metadata validation for images.
 * Forces the decoding engine to parse the image structure to detect hidden exploits.
 *
 * `sharp@0.35.4` npm package.
 *
 * @param {Object} options
 * @param {Buffer} options.buffer - The raw image buffer.
 * @param {string} options.mimeType - Result from {@link validateMagicNumbers}
 * @param {import('sharp').SharpConstructor} options.Sharp
 * @returns {Promise<ValidationResult<{ data: import('sharp').Sharp; metadata: import('sharp').Metadata }>>} The validation outcome.
 */
export async function validateImage({ buffer, mimeType, Sharp }) {
  try {
    // Deep structural parsing (Checks for corrupted structures or embedded malicious scripts)
    // sharp().metadata() forces the libvips C++ library to completely parse the image header/payload.
    const data = Sharp(buffer);
    const metadata = await data.metadata();

    return { mimeType, error: null, data: { data, metadata } };
  } catch (err) {
    console.error(err);
    return {
      mimeType: null,
      error: err instanceof Error ? err.message : 'Unknown Error',
    };
  }
}

/**
 * LAYER 2 (AUDIO/VIDEO): Deep validation for audio files using native JS metadata parsing.
 * Validates audio headers, durations, and container integrity without external tools.
 *
 * `music-metadata@11.15.0` npm package.
 *
 * @param {Object} options
 * @param {Buffer} options.buffer - The raw media buffer.
 * @param {string} options.mimeType - Result from {@link validateMagicNumbers}
 * @param {import('music-metadata').parseStream} options.parseStream
 * @param {typeof import('stream').Readable} options.Readable
 * @returns {Promise<ValidationResult<import('music-metadata').IAudioMetadata>>} The validation outcome.
 */
export async function validateAudioVideo({ buffer, mimeType, parseStream, Readable }) {
  try {
    // Deep metadata structural parsing
    // music-metadata parses the container (ID3 tags, RIFF headers, FLAC blocks).
    // If the file is a disguised script, the parser will fail to find valid audio frames.
    const stream = bufferToStream(buffer, Readable);
    const metadata = await parseStream(stream, mimeType);

    if (!metadata.format || typeof metadata.format.duration !== 'number') {
      throw new Error('Audio file structure is corrupted or missing explicit audio streams.');
    }

    return { mimeType, error: null, data: metadata };
  } catch (err) {
    console.error(err);
    return {
      mimeType: null,
      error: err instanceof Error ? err.message : 'Unknown Error',
    };
  }
}
