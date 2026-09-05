/**
 * @template T
 * @typedef {Object} ValidationResult
 * @property {string|null} error - The error message if validation failed.
 * @property {T} [data]
 */

/**
 * @typedef {import('stream').Readable} Readable
 * @typedef {typeof import('stream').Readable} ConstructorReadable
 */

/**
 * @typedef {import('file-type').FileTypeResult} FileTypeResult
 */

/**
 * LAYER 1: Fast Binary Validation (Magic Numbers)
 * Validates if the file header matches expected media categories.
 *
 * `file-type@22.0.2` npm package.
 *
 * @param {Object} options
 * @param {Buffer} options.buffer - The raw file buffer from the upload.
 * @param {'image' | 'audio' | 'video'} options.expectedType - The expected media category.
 * @param {(buffer: Uint8Array | ArrayBuffer) => Promise<FileTypeResult | undefined>} options.fileTypeFromBuffer
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
 * @typedef {import('sharp').SharpConstructor} SharpConstructor
 * @typedef {import('sharp').Sharp} Sharp
 * @typedef {import('sharp').Metadata} SharpMetadata
 */

/**
 * LAYER 2 (IMAGE): Structural and metadata validation for images.
 * Forces the decoding engine to parse the image structure to detect hidden exploits.
 *
 * `sharp@0.35.4` npm package.
 *
 * @param {Object} options
 * @param {Buffer} options.buffer - The raw image buffer.
 * @param {SharpConstructor} options.Sharp
 * @returns {Promise<ValidationResult<{ data: Sharp; metadata: SharpMetadata }>>} The validation outcome.
 */
export async function validateImage({ buffer, Sharp }) {
  try {
    // Deep structural parsing (Checks for corrupted structures or embedded malicious scripts)
    // sharp().metadata() forces the libvips C++ library to completely parse the image header/payload.
    const data = Sharp(buffer);
    const metadata = await data.metadata();

    return { error: null, data: { data, metadata } };
  } catch (err) {
    console.error(err);
    return {
      error: err instanceof Error ? err.message : 'Unknown Error',
    };
  }
}

/**
 * @typedef {import('music-metadata').IAudioMetadata} IAudioMetadata
 * @typedef {import('music-metadata').IFileInfo} IFileInfo
 * @typedef {import('music-metadata').IOptions} IOptions
 */

/**
 * LAYER 2 (AUDIO/VIDEO): Deep validation for audio files using native JS metadata parsing.
 * Validates audio headers, durations, and container integrity without external tools.
 *
 * `music-metadata@11.15.0` npm package.
 *
 * @param {Object} options
 * @param {Buffer} options.buffer - The raw media buffer.
 * @param {(stream: Readable, fileInfo?: IFileInfo | string, options?: IOptions) => Promise<IAudioMetadata>} [options.parseStream]
 * @param {(uint8Array: Uint8Array<ArrayBufferLike>, fileInfo?: IFileInfo | string, options?: IOptions) => Promise<IAudioMetadata>} [options.parseBuffer]
 * @param {ConstructorReadable} [options.Readable]
 * @returns {Promise<ValidationResult<IAudioMetadata>>} The validation outcome.
 */
export async function validateAudioVideo({ buffer, parseBuffer }) {
  try {
    // Deep metadata structural parsing
    // music-metadata parses the container (ID3 tags, RIFF headers, FLAC blocks).
    // If the file is a disguised script, the parser will fail to find valid audio frames.
    const metadata = await (parseBuffer ? parseBuffer(buffer) : null);

    if (!metadata || !metadata.format || typeof metadata.format.duration !== 'number') {
      throw new Error('Audio file structure is corrupted or missing explicit audio streams.');
    }

    return { error: null, data: metadata };
  } catch (err) {
    console.error(err);
    return {
      error: err instanceof Error ? err.message : 'Unknown Error',
    };
  }
}
