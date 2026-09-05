/**
 * @template T
 * @typedef {Object} ValidationResult
 * @property {string|null} mimeType - The detected MIME type of the file.
 * @property {string|null} error - The error message if validation failed.
 * @property {T} [data]
 */

/**
 * LAYER 1: Fast Binary Validation (Magic Numbers)
 * Validates if the file header matches expected media categories.
 *
 * @param {Object} options
 * @param {Buffer|Uint8Array|Blob} options.inputData - The raw file data.
 * @param {'image' | 'audio' | 'video'} options.expectedType - The expected media category.
 * @param {(buffer: Uint8Array | ArrayBuffer) => Promise<{ mime: string; } | undefined>} options.fileTypeFromBuffer
 * @returns {Promise<string>} Resolves with the confirmed MIME type if valid.
 * @throws {Error} If the file signature does not match the expected type.
 */
export async function validateMagicNumbers({ inputData, expectedType, fileTypeFromBuffer }) {
  const arrayBuffer = inputData instanceof Blob ? await inputData.arrayBuffer() : inputData;
  const bufferData = new Uint8Array(arrayBuffer);
  const detected = await fileTypeFromBuffer(bufferData);

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
 * @param {Object} options
 * @param {Buffer|Blob} options.inputData - The raw image data.
 * @param {string} options.mimeType - Result from {@link validateMagicNumbers}
 * @returns {Promise<ValidationResult<{ width: number; height: number; format: string }>>} The validation outcome.
 */
export async function validateImage({ inputData, mimeType }) {
  try {
    if (!(inputData instanceof Blob)) throw new TypeError('InputData must be a Blob or File.');
    const bitmap = await createImageBitmap(inputData);
    return {
      mimeType,
      error: null,
      data: { width: bitmap.width, height: bitmap.height, format: mimeType },
    };
  } catch (err) {
    console.error(err);
    return {
      mimeType: null,
      error: err instanceof Error ? err.message : 'Unknown Error',
    };
  }
}

/**
 * @typedef {import('music-metadata').IAudioMetadata} IAudioMetadata
 */

/**
 * LAYER 2 (AUDIO/VIDEO): Deep validation for audio/video files.
 * Validates headers, durations, and container integrity.
 *
 * @param {Object} options
 * @param {Buffer|Blob} options.inputData - The raw media data.
 * @param {string} options.mimeType - Result from {@link validateMagicNumbers}
 * @returns {Promise<ValidationResult<{ duration: number }>>} The validation outcome.
 */
export async function validateAudioVideo({ inputData, mimeType }) {
  try {
    if (!(inputData instanceof Blob)) throw new TypeError('InputData must be a Blob or File.');
    return new Promise((resolve) => {
      const isAudio = mimeType.startsWith('audio/');
      const mediaElement = document.createElement(isAudio ? 'audio' : 'video');
      const url = URL.createObjectURL(inputData);

      mediaElement.preload = 'metadata';

      mediaElement.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        if (isNaN(mediaElement.duration) || mediaElement.duration === 0) {
          resolve({
            mimeType: null,
            error: 'Media structure corrupted: Missing duration in browser.',
          });
        } else {
          resolve({ mimeType, error: null, data: { duration: mediaElement.duration } });
        }
      };

      mediaElement.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({
          mimeType: null,
          error: 'Native browser decoder failed to parse media container.',
        });
      };

      mediaElement.src = url;
    });
  } catch (err) {
    console.error(err);
    return {
      mimeType: null,
      error: err instanceof Error ? err.message : 'Unknown Error',
    };
  }
}
