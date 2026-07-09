/**
 * @typedef {string|(() => string)} UnknownArtistGetter
 */

/**
 * Represents an image attachment template.
 * @template {Uint8Array|string} PictureData
 * @typedef {Object} IPictureTemplate
 * @property {string} format - The MIME type of the image (e.g., 'image/jpeg').
 * @property {PictureData} data - The raw binary data of the image.
 * @property {string} [description] - An optional textual description of the image.
 * @property {string} [type] - The specific type of picture (e.g., 'cover', 'front', 'back').
 * @property {string} [name] - The filename associated with the image.
 */

/**
 * Represents an image attachment, such as album art.
 * @typedef {IPictureTemplate<string>} IPicture
 */

/**
 * A numeric structure representing track or disk indexing.
 * @typedef {{no: number|null, of: number|null}} MediaNumber
 */

/**
 * This metadata structure is modeled template.
 *
 * @template {IPictureTemplate<Uint8Array|string>} IPictureContent
 * @typedef {Object} ContentMetadataTemplate
 * @property {string|null} title - The title of the track.
 * @property {string|null} album - The name of the album.
 * @property {string|null} albumartist - The primary artist of the album.
 * @property {string[]} albumartists - An array of artists associated with the album.
 * @property {string[]} genre - An array of genres associated with the track.
 * @property {string[]} label - The record label.
 * @property {string[]} composer - The composer of the track.
 * @property {number|null} year - The release year.
 * @property {string|null} artist - The primary artist of the track.
 * @property {string[]} artists - An array of artists associated with the track.
 * @property {MediaNumber} disk - Disk information containing the current disk number and total disks.
 * @property {MediaNumber} track - Track information containing the current track number and total tracks.
 * @property {IPictureContent[]} [picture] - An array of picture objects containing album art.
 */

/**
 * This metadata structure is modeled after the standard output of the
 * `music-metadata@11.13.0` npm package.
 *
 * @typedef {ContentMetadataTemplate<IPicture>} MediaContentMetadata
 */

/**
 * The core properties required for any content item within the media system.
 * @typedef {Object} MediaContentBase
 * @property {string} id - Unique identifier.
 * @property {string} title - Name of the track/message.
 * @property {string} artist - Artist or speaker name.
 * @property {number} duration - Duration in milliseconds.
 * @property {string} url - Source URL/Path.
 * @property {number} [weight=1] - Probability multiplier for random selection mode.
 */

/**
 * The final content object used within the media, combining
 * core playback properties with rich metadata.
 *
 * @typedef {MediaContentBase & MediaContentMetadata} MediaContent
 */

//////////////////////////////////////////////////////////////////

/**
 * A promise that resolves to an object containing the extracted metadata.
 * @callback ParseMediaContentMetadata
 * @param {Blob} data - The raw file blob.
 * @returns {Promise<{ common: Partial<ContentMetadataTemplate<IPictureTemplate<Uint8Array|string>>> }>} A promise resolving to the common metadata properties.
 */

/**
 * @typedef {Object} LoadingMediaProgress
 * @property {'loading'|'success'} status - The current status of the operation.
 * @property {LoadingProgressStage} stage - The current execution stage.
 * @property {ProgressEvent<EventTarget>} [event] - The current loading event.
 * @property {string} url - The URL being processed.
 */

/**
 * @typedef {'INITIALIZING'|'DOWNLOADING'|'METADATA_LOADED'|'EXTRACTING_ID3'|'COMPLETE'} LoadingProgressStage
 */

/**
 * @typedef {'INITIALIZING'|'DOWNLOADING'|'METADATA'|'ID3'|'UNKNOWN'} LoadingErrorStage
 */

/**
 * @typedef {Object} MediaLoadingErrorData
 * @property {Error} error - The original error object.
 * @property {string} url - The URL that failed.
 * @property {LoadingErrorStage} stage - The stage where it failed.
 */

//////////////////////////////////////////////////////////////////

const checkString = (/** @type {string} */ val, /** @type {string} */ name) => {
  if (typeof val !== 'string')
    throw new TypeError(`Expected "${name}" to be a string, but received ${typeof val}.`);
};
const checkFunction = (/** @type {Function} */ val, /** @type {string} */ name) => {
  if (typeof val !== 'function')
    throw new TypeError(`Expected "${name}" to be a function, but received ${typeof val}.`);
};
const checkObject = (/** @type {Object<string, any> | null} */ val, /** @type {string} */ name) => {
  if (typeof val !== 'object' || val === null || Array.isArray(val)) {
    throw new TypeError(
      `Expected "${name}" to be a plain object, but received ${val === null ? 'null' : Array.isArray(val) ? 'array' : typeof val}.`,
    );
  }
};

/** @type {Map<string, number>} */
export const _blobCounter = new Map();

/** @returns {MediaContentBase} */
export const getMediaContentBase = () => ({
  id: '',
  title: '',
  artist: '',
  url: '',
  duration: 0,
  weight: 1,
});

/** @returns {MediaContentMetadata} */
export const getMediaContentMetadata = () => ({
  title: null,
  album: null,
  albumartist: null,
  albumartists: [],
  genre: [],
  label: [],
  composer: [],
  year: null,
  artist: null,
  artists: [],
  disk: { no: null, of: null },
  track: { no: null, of: null },
  picture: [],
});

/**
 * Custom error class to provide detailed context during the content preparation process.
 * @extends Error
 */
export class MediaLoadingError extends Error {
  /**
   * @param {string} message - Human-readable error message.
   * @param {string} url - The URL that caused the error.
   * @param {LoadingErrorStage} stage - The stage where the error occurred.
   */
  constructor(message, url, stage) {
    checkString(message, 'message');
    checkString(url, 'url');
    if (typeof stage !== 'string')
      throw new TypeError(`Expected "stage" to be a string, but received ${typeof stage}.`);

    super(message);
    this.name = 'MediaLoadingError';
    this.url = url;
    this.stage = stage;
  }
}

/**
 * Internal helper to generate a deterministic ID from a string.
 * @param {string} str
 * @returns {Promise<string>}
 * @private
 */
export const generateSimpleHash = async (str) => {
  checkString(str, 'str');

  const msgUint8 = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  // Return first 8 chars of the hex hash for a clean ID
  return hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .substring(0, 8);
};

/**
 * Helper to convert Uint8Array or Base64 string directly into a high performance Blob URL.
 * @param {Uint8Array|string} data
 * @param {string} format
 * @returns {string} The generated Blob URL or original string if already valid.
 */
export const convertToBlobUrl = (data, format = 'image/jpeg') => {
  if (!(data instanceof Uint8Array) && typeof data !== 'string') {
    throw new TypeError(
      `Expected "data" to be an instance of Uint8Array or a string, but received ${typeof data}.`,
    );
  }
  checkString(format, 'format');

  const createBlobCounter = (/** @type {Blob} */ blob) => {
    const url = URL.createObjectURL(blob);
    const blobUrlUsage = _blobCounter.get(url);
    _blobCounter.set(url, typeof blobUrlUsage === 'number' ? blobUrlUsage + 1 : 1);
    return url;
  };

  if (data instanceof Uint8Array) {
    // @ts-ignore
    const blob = new Blob([data], { type: format });
    return createBlobCounter(blob);
  } else if (typeof data === 'string' && data.startsWith('data:')) {
    const base64Part = data.split(',')[1];
    const byteString = atob(base64Part);
    const ab = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      ab[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: format });
    return createBlobCounter(blob);
  }
  return typeof data === 'string' ? data : '';
};

/**
 * Asynchronous helper to convert a Blob URL back to Base64 (Date URL) at export time.
 * @param {string} url
 * @returns {Promise<string>}
 */
export const blobUrlToBase64 = async (url) => {
  checkString(url, 'url');

  if (!url.startsWith('blob:')) return url;
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.warn(`[TinyAudioUtils] Failed to convert Blob URL to Base64 on export: ${url}`, e);
    return url;
  }
};

/**
 * Safely revokes Blob URLs to prevent memory leaks from createObjectURL.
 * @param {MediaContent} content
 */
export const revokeContentUrls = (content) => {
  checkObject(content, 'content');

  if (content && Array.isArray(content.picture)) {
    content.picture.forEach((pic) => {
      if (typeof pic.data === 'string' && pic.data.startsWith('blob:')) {
        const blobUrlUsage = _blobCounter.get(pic.data) ?? 0;
        if (blobUrlUsage > 1) _blobCounter.set(pic.data, blobUrlUsage - 1);
        else _blobCounter.delete(pic.data);
        if (blobUrlUsage <= 1) URL.revokeObjectURL(pic.data);
      }
    });
  }
};

/**
 * Central logic of metadata validation.
 * @param {Partial<ContentMetadataTemplate<IPictureTemplate<string | Uint8Array<ArrayBufferLike>>>>} common - The object to be validated.
 * @param {boolean} isPartial - If true, properties can be undefined.
 */
const validateMediaContent = (common, isPartial) => {
  checkObject(common, 'common');
  if (typeof isPartial !== 'boolean') throw new TypeError('Expected "isPartial" to be a boolean.');

  const isUndefinedAllowed = (/** @type {any} */ v) => isPartial && typeof v === 'undefined';

  const isString = (/** @type {string | null | undefined} */ v) =>
    isUndefinedAllowed(v) || typeof v === 'string' || v === null;

  const isNumber = (/** @type {number | null | undefined}} */ v) =>
    isUndefinedAllowed(v) || typeof v === 'number' || v === null;

  const isArray = (
    /** @type {string[] | IPictureTemplate<string|Uint8Array>[] | undefined} */ v,
    /** @type {(value: any, index: number, array: any[]) => any} */ valueValidator,
  ) => {
    if (isUndefinedAllowed(v)) return true;
    if (Array.isArray(v) && v.every(valueValidator)) return true;
    return false;
  };

  // Validate Primitives
  if (!isString(common.title))
    throw new TypeError('Invalid metadata: "title" must be a string or null.');
  if (!isString(common.album))
    throw new TypeError('Invalid metadata: "album" must be a string or null.');
  if (!isString(common.albumartist))
    throw new TypeError('Invalid metadata: "albumartist" must be a string or null.');
  if (!isString(common.artist))
    throw new TypeError('Invalid metadata: "artist" must be a string or null.');
  if (!isNumber(common.year))
    throw new TypeError('Invalid metadata: "year" must be a number or null.');

  // Validate Arrays
  if (!isArray(common.albumartists, (value) => typeof value === 'string'))
    throw new TypeError('Invalid metadata: "albumartists" must be an array of string.');
  if (!isArray(common.genre, (value) => typeof value === 'string'))
    throw new TypeError('Invalid metadata: "genre" must be an array of string.');
  if (!isArray(common.label, (value) => typeof value === 'string'))
    throw new TypeError('Invalid metadata: "label" must be an array of string.');
  if (!isArray(common.composer, (value) => typeof value === 'string'))
    throw new TypeError('Invalid metadata: "composer" must be an array of string.');
  if (!isArray(common.artists, (value) => typeof value === 'string'))
    throw new TypeError('Invalid metadata: "artists" must be an array of string.');
  if (
    !isArray(
      common.picture,
      (value) =>
        value &&
        typeof value === 'object' &&
        (typeof value.description === 'undefined' || typeof value.description === 'string') &&
        (typeof value.name === 'undefined' || typeof value.name === 'string') &&
        (typeof value.type === 'undefined' || typeof value.type === 'string') &&
        typeof value.format === 'string' &&
        (value.data instanceof Uint8Array || typeof value.data === 'string'),
    )
  )
    throw new TypeError('Invalid metadata: "picture" must be an array of pictures.');

  /**
   * Validate Nested Objects (Disk and Track)
   * @param {MediaNumber|null} [info]
   * @param {string} [name]
   */
  const validateTrackInfo = (info, name) => {
    if (isUndefinedAllowed(info)) return; // Ignores if partial

    if (info === undefined || info === null) {
      throw new TypeError(`Invalid metadata: "${name}" is required.`);
    }

    if (typeof info !== 'object')
      throw new TypeError(`Invalid metadata: "${name}" must be an object or null.`);
    if (typeof info.no !== 'number' && info.no !== null)
      throw new TypeError(`Invalid metadata: "${name}.no" must be a number or null.`);
    if (typeof info.of !== 'number' && info.of !== null)
      throw new TypeError(`Invalid metadata: "${name}.of" must be a number or null.`);
  };

  validateTrackInfo(common.disk, 'disk');
  validateTrackInfo(common.track, 'track');
};

/**
 * Helper to validate types within the media content metadata object.
 * This ensures that if a property is present, it matches the expected type.
 * @param {ContentMetadataTemplate<IPictureTemplate<string | Uint8Array<ArrayBufferLike>>>} common
 */
export const valMediaContentMetadata = (common) => validateMediaContent(common, false);

/**
 * Helper to validate types within the media content metadata object.
 * Allows the absence of properties (useful for updates/patch).
 * @param {Partial<ContentMetadataTemplate<IPictureTemplate<string | Uint8Array<ArrayBufferLike>>>>} common
 */
export const valMediaContentMetadataPartial = (common) => validateMediaContent(common, true);

/**
 * Downloads an audio file from a URL and extracts its ID3/metadata tags.
 *
 * @param {string} url - The full URL of the audio file to be downloaded.
 * @param {ParseMediaContentMetadata} parseFile - The function used to parse the file data.
 * @returns {Promise<MediaContentMetadata>} A promise that resolves to an object containing the extracted metadata.
 * @throws {TypeError} If the provided `url` is not a string or `parseFile` is not a function.
 * @throws {Error} If the network request fails or the parsing process encounters an error.
 */
export const extractMediaId3Tags = async (url, parseFile) => {
  // Argument Validation
  checkString(url, 'url');
  checkFunction(parseFile, 'parseFile');

  try {
    // 1. Download the file from the provided URL
    const response = await fetch(url);

    if (!response.ok)
      throw new Error(`Failed to fetch audio file: ${response.status} ${response.statusText}`);

    // 2. Convert the response into a Blob so the parser can read it
    const blob = await response.blob();

    // 3. Use the provided parser function on the Blob
    const metadata = await parseFile(blob);

    // 4. Complete Validation of the parsed metadata structure
    if (!metadata || typeof metadata.common !== 'object')
      throw new TypeError('Invalid metadata: "common" property is missing or not an object.');

    const common = metadata.common;
    valMediaContentMetadataPartial(common);

    // 5. Return the specific metadata fields requested
    // We structure the return to match the MediaContentMetadata typedef
    return {
      title: common?.title ?? null,
      album: common?.album ?? null,
      albumartist: common?.albumartist ?? null,
      albumartists: common?.albumartists ?? [],
      genre: common?.genre ?? [],
      label: common?.label ?? [],
      composer: common?.composer ?? [],
      year: common?.year ?? null,
      artist: common?.artist ?? null,
      artists: common?.artists ?? [],
      disk: common?.disk ? { no: common.disk.no, of: common.disk.of } : { no: null, of: null },
      track: common?.track ? { no: common.track.no, of: common.track.of } : { no: null, of: null },
      picture:
        common?.picture?.map((value) => ({
          ...value,
          data: convertToBlobUrl(value.data, value.format),
        })) ?? [],
    };
  } catch (error) {
    // Re-throwing the error allows the caller to handle specific failure cases
    throw error;
  }
};

/**
 * A Static Factory Method that prepares a MediaContent object by
 * extracting metadata from an audio source.
 *
 * @param {string | HTMLMediaElement} source - A URL string or an existing Audio object.
 * @param {Partial<MediaContentBase & MediaContentMetadata> & { id?: string; weight?: number }} [defaultMetadata={}] - Optional default metadata that overrides automatic extraction.
 * @param {Partial<MediaContentBase & MediaContentMetadata> & { id?: string; weight?: number }} [metadata={}] - Optional manual metadata that overrides automatic extraction.
 * @param {ParseMediaContentMetadata} [parseFile] - Private helper to interface with parseFile.
 * @param {Object} [callbacks={}] - Callbacks for monitoring the loading process.
 * @param {(progress: LoadingMediaProgress) => void} [callbacks.onProgress] - Callback triggered on stage changes.
 * @param {(error: MediaLoadingErrorData) => void} [callbacks.onError] - Callback triggered when a non-fatal or fatal error occurs.
 * @param {UnknownArtistGetter} unknownArtist
 * @returns {Promise<MediaContent>} A promise that resolves to a valid MediaContent object.
 * @throws {MediaLoadingError} If the preparation process fails at any stage.
 *
 * @example
 * // Usage with URL
 * import { parseBlob } from 'music-metadata';
 * const track = await parseMediaMetadata('/assets/song.mp3', {}, { title: 'My Song', artist: 'Artist' }, parseBlob);
 * media.add('music', track);
 *
 * @example
 * // Usage with Audio Object
 * import { parseBlob } from 'music-metadata';
 * const audio = new Audio();
 * audio.src = '/assets/song.mp3';
 * const track = await parseMediaMetadata(audio, {}, {}, parseBlob);
 * media.add('music', track);
 *
 * @example
 * // Usage with tracking
 * const track = await parseMediaMetadata(
 *   '/assets/song.mp3',
 *   {},
 *   {},
 *   parseBlob,
 *   {
 *     onProgress: (p) => console.log(`[${p.stage}] ${p.status}`),
 *     onError: (e) => console.error(`Failed at ${e.stage} for ${e.url}: ${e.error.message}`)
 *   }
 * );
 */
export const parseMediaMetadata = async (
  source,
  defaultMetadata = {},
  metadata = {},
  parseFile = (url) => {
    return new Promise((resolve, reject) => reject(new TypeError('parseFile library not found.')));
  },
  callbacks = {},
  unknownArtist = 'null',
) => {
  // Argument Validation
  if (typeof source !== 'string' && !(source instanceof HTMLMediaElement))
    throw new TypeError('Source must be a string or an HTMLMediaElement.');

  checkObject(defaultMetadata, 'defaultMetadata');
  checkObject(metadata, 'metadata');
  checkFunction(parseFile, 'parseFile');
  checkObject(callbacks, 'callbacks');

  if (callbacks.onProgress && typeof callbacks.onProgress !== 'function')
    throw new TypeError('callbacks.onProgress must be a function.');
  if (callbacks.onError && typeof callbacks.onError !== 'function')
    throw new TypeError('callbacks.onError must be a function.');

  if (typeof unknownArtist !== 'string' && typeof unknownArtist !== 'function') {
    throw new TypeError('unknownArtist must be a string or a function returning a string.');
  }

  /** @type {HTMLMediaElement} */
  let audio;
  /** @type {string} */
  let url = '';

  /**
   * @param {LoadingProgressStage} stage
   * @param {ProgressEvent<EventTarget>} [event]
   */
  const notifyProgress = (stage, event) => {
    if (callbacks.onProgress) {
      callbacks.onProgress({
        event,
        status: 'loading',
        stage,
        url: url || (source instanceof HTMLMediaElement ? source.src : 'unknown'),
      });
    }
  };

  const notifyError = (/** @type {Error} */ error, /** @type {LoadingErrorStage} */ stage) => {
    if (callbacks.onError) {
      callbacks.onError({
        error,
        url: url || (source instanceof HTMLMediaElement ? source.src : 'unknown'),
        stage,
      });
    }
  };

  try {
    // 1. Normalize Source
    notifyProgress('INITIALIZING');
    if (typeof source === 'string') {
      url = source;
      audio = new Audio(url);
    } else {
      audio = source;
      url = audio.src;
    }

    // 2. Wait for audio metadata and monitor download progress
    try {
      await new Promise((resolve, reject) => {
        /**
         * Listener for the 'progress' event (detects actual data downloading)
         * @type {(this: HTMLMediaElement, ev: ProgressEvent<EventTarget>) => any}
         */
        const onProgress = (event) => notifyProgress('DOWNLOADING', event);

        // Listener for 'loadedmetadata' (duration is now available)
        const onMetadata = () => {
          cleanup();
          resolve(undefined);
        };

        // Listener for errors
        const onError = (/** @type {{ message: any; }} */ err) => {
          cleanup();
          reject(new Error(`HTMLMediaElement failed to load: ${err.message || 'Unknown error'}`));
        };

        const cleanup = () => {
          audio.removeEventListener('progress', onProgress);
          audio.removeEventListener('loadedmetadata', onMetadata);
          audio.removeEventListener('error', onError);
        };

        audio.addEventListener('progress', onProgress);
        audio.addEventListener('loadedmetadata', onMetadata);
        audio.addEventListener('error', onError);

        // If metadata is already there (e.g. cached by browser)
        if (audio.readyState >= 1) {
          cleanup();
          resolve(undefined);
        }
      });

      notifyProgress('METADATA_LOADED');
    } catch (err) {
      throw new MediaLoadingError(
        err instanceof Error ? err.message : 'UNKNOWN ERROR',
        url,
        'METADATA',
      );
    }

    // 3. Initialize Base Data (Core properties required for the system)
    const baseData = {
      id: metadata.id || (await generateSimpleHash(url)),
      duration: Math.floor(audio.duration * 1000), // Convert to ms for our class
      url: url,
      weight: metadata.weight ?? 1,
    };

    // 4. Automatic Metadata Extraction (ID3 Tags)
    /** @type {Partial<MediaContentMetadata>} */
    let extractedMetadata = {};
    notifyProgress('EXTRACTING_ID3');
    try {
      extractedMetadata = await extractMediaId3Tags(url, parseFile);
    } catch (err) {
      // We treat ID3 failure as a non-fatal error for the whole process,
      // but we still notify the developer via onError.
      notifyError(err instanceof Error ? err : new Error('Unknown Error'), 'ID3');
      console.warn(`[TinyAudioUtils] ID3 extraction failed for ${url}. Falling back to filename.`);
    }

    /**
     * Extracts a readable filename from a URL without the extension.
     * @param {string} url
     * @returns {string}
     */
    const getFallbackTitleFromUrl = (url) => {
      try {
        // Remove query params or hashes, get the last segment, and strip extension
        const filename = url.split(/[?#]/)[0].split('/').pop();
        return (filename ?? '').replace(/\.[^/.]+$/, '') || 'Unknown Track';
      } catch {
        return 'Unknown Track';
      }
    };

    // 5. Final Merge Logic
    // Priority: Manual Metadata (highest) > Extracted ID3 > Default values
    const finalContent = {
      ...baseData,
      ...defaultMetadata,
      ...extractedMetadata,
      ...metadata,
      // Explicitly ensure title and artist are resolved from the hierarchy
      title: extractedMetadata.title || metadata.title || getFallbackTitleFromUrl(url),
      artist:
        extractedMetadata.artist ||
        metadata.artist ||
        (typeof unknownArtist === 'string' ? unknownArtist : String(unknownArtist())),
    };

    // Notify Success
    if (callbacks.onProgress) {
      callbacks.onProgress({
        status: 'success',
        stage: 'COMPLETE',
        url: url,
      });
    }

    return /** @type {MediaContent} */ (finalContent);
  } catch (err) {
    // If it's already a MediaLoadingError, re-throw it.
    // Otherwise, wrap it.
    if (err instanceof MediaLoadingError) {
      throw err;
    } else {
      const wrappedError = new MediaLoadingError(
        err instanceof Error ? err.message : 'UNKNOWN ERROR',
        url,
        'INITIALIZING',
      );
      notifyError(wrappedError, 'INITIALIZING');
      throw wrappedError;
    }
  }
};
