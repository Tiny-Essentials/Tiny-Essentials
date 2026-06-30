import TinyEvents from './TinyEvents.mjs';

//////////////////////////////////////////////////////////////////

/**
 * The core properties required for any content item within the radio system.
 * @typedef {Object} RadioContentBase
 * @property {string} id - Unique identifier.
 * @property {string} title - Name of the track/message.
 * @property {string} artist - Artist or speaker name.
 * @property {number} duration - Duration in milliseconds.
 * @property {string} url - Source URL/Path.
 * @property {number} [weight=1] - Probability multiplier for random selection mode.
 */

/**
 * Represents a content item injected at a specific point in the absolute timeline.
 * @typedef {Object} CustomPosition
 * @property {RadioContent} content - The audio/music content.
 * @property {number} intendedTimestamp - The absolute Date.now() target.
 * @property {number} originalTimestamp - The timestamp preserved for intelligent repositioning.
 */

//////////////////////////////////////////////////////////////////

/**
 * Data required to relocate an existing item within a playlist.
 * @typedef {Object} ScheduledMovePayload
 * @property {string} id - Content ID to move.
 * @property {number} newIndex - The target index in the playlist.
 */

/**
 * A union type representing the various data formats a scheduled task payload can take.
 * @typedef {RadioContent | string | ScheduledMovePayload} ScheduledTaskPayload
 */

/**
 * A scheduled instruction to modify the radio state at a specific point in time.
 * @typedef {Object} ScheduledTask
 * @property {number} timestamp - The absolute time to execute the action.
 * @property {'add'|'remove'|'move'} action - The type of modification.
 * @property {'music'|'voice'} type - Target playlist.
 * @property {ScheduledTaskPayload} payload - Data relative to the action.
 */

//////////////////////////////////////////////////////////////////

/**
 * A standardized representation of an active or upcoming event in the radio timeline.
 * @typedef {Object} RadioEvent
 * @property {string} id - Content ID.
 * @property {string} title - Content title.
 * @property {string} artist - Content artist.
 * @property {string} url - Source URL/Path.
 * @property {number} duration - Total duration of the event.
 * @property {number} absoluteStart - Start timestamp within the absolute timeline.
 * @property {number} absoluteEnd - End timestamp within the absolute timeline.
 * @property {number} elapsedTime - How many ms have passed since the event started.
 * @property {number} remainingTime - How many ms are left until the event ends.
 * @property {number} progress - Percentage of completion (0 to 1).
 * @property {boolean} isCustom - Whether this is a user-defined custom position.
 */

/**
 * The available sequence logic modes for playlist playback.
 * @typedef {'playlist'|'random'} RadioModes
 */

/**
 * Global configuration settings for the radio engine behavior.
 * @typedef {Object} RadioConfig
 * @property {RadioModes} mode - Sequence mode for music.
 * @property {RadioModes} voiceMode - Sequence mode for voices.
 * @property {number} silenceDuration - Gap in ms between tracks.
 * @property {number} queryLimit - Safety lock for max items processed.
 * @property {boolean} voiceAfterMusic - Whether to play voice messages after music tracks.
 * @property {number} voiceMin - Minimum amount of voice messages to play if voiceAfterMusic is true.
 * @property {number} voiceMax - Maximum amount of voice messages to play.
 * @property {number} musicMaxConsecutive - Max times a music track can repeat consecutively (0 = unlimited).
 * @property {number} voiceMaxConsecutive - Max times a voice track can repeat consecutively (0 = unlimited).
 */

//////////////////////////////////////////////////////////////////

/**
 * An extension of RadioContent that includes temporal boundaries within a generated cycle.
 * @typedef {RadioContent & { cycleStart: number; cycleEnd: number; }} CycleBlockData
 */

/**
 * A structural block representing a single full iteration of the radio sequence.
 * @typedef {Object} CycleBlock
 * @property {CycleBlockData[]} items - Items belonging to this cycle.
 * @property {number} duration - Total duration of the cycle block in ms.
 */

/**
 * Information about the location of a specific cycle within the absolute timeline.
 * @typedef {Object} CycleLocation
 * @property {CycleBlock} block - The located cycle block.
 * @property {number} startTimestamp - The absolute start time of this cycle.
 * @property {number} loopIndex - The specific loop iteration index.
 */

//////////////////////////////////////////////////////////////////

/**
 * The complete state object used for exporting and importing the radio system.
 * @typedef {Object} TinyRadioFmImport
 * @property {RadioContent[]} music - The music playlist.
 * @property {RadioContent[]} voice - The voice playlist.
 * @property {CustomPosition[]} custom - The custom position injections.
 * @property {ScheduledTask[]} tasks - The pending scheduled tasks.
 * @property {number} seed - The randomness seed.
 * @property {number} anchorDate - The timeline anchor timestamp.
 * @property {RadioConfig} config - The engine configuration.
 */

//////////////////////////////////////////////////////////////////

/**
 * Represents an image attachment, such as album art.
 * @typedef {Object} IPicture
 * @property {string} format - The MIME type of the image (e.g., 'image/jpeg').
 * @property {Uint8Array} data - The raw binary data of the image.
 * @property {string} [description] - An optional textual description of the image.
 * @property {string} [type] - The specific type of picture (e.g., 'cover', 'front', 'back').
 * @property {string} [name] - The filename associated with the image.
 */

/**
 * A numeric structure representing track or disk indexing.
 * @typedef {{no: number|null, of: number|null}} MusicNumber
 */

/**
 * This metadata structure is modeled after the standard output of the
 * `music-metadata` npm package.
 *
 * @typedef {Object} ContentMetadata
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
 * @property {MusicNumber} disk - Disk information containing the current disk number and total disks.
 * @property {MusicNumber} track - Track information containing the current track number and total tracks.
 * @property {IPicture[]} [picture] - An array of picture objects containing album art.
 */

/**
 * The final content object used within the radio system, combining
 * core playback properties with rich metadata.
 *
 * @typedef {RadioContentBase & ContentMetadata} RadioContent
 */

/**
 * A promise that resolves to an object containing the extracted metadata.
 * @callback ParseContentMetadata
 * @param {Blob} data - The raw file blob.
 * @returns {Promise<{ common: Partial<ContentMetadata> }>} A promise resolving to the common metadata properties.
 */

//////////////////////////////////////////////////////////////////

/**
 * @typedef {Object} LoadingProgress
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
 * @typedef {Object} LoadingError
 * @property {Error} error - The original error object.
 * @property {string} url - The URL that failed.
 * @property {LoadingErrorStage} stage - The stage where it failed.
 */

/**
 * Custom error class to provide detailed context during the content preparation process.
 * @extends Error
 */
class RadioLoadingError extends Error {
  /**
   * @param {string} message - Human-readable error message.
   * @param {string} url - The URL that caused the error.
   * @param {LoadingErrorStage} stage - The stage where the error occurred.
   */
  constructor(message, url, stage) {
    super(message);
    this.name = 'RadioLoadingError';
    this.url = url;
    this.stage = stage;
  }
}

//////////////////////////////////////////////////////////////////

/**
 * A deterministic, seed-based radio management system with scheduled adaptations and weighted random generation.
 * @extends TinyEvents
 */
class TinyRadioFm extends TinyEvents {
  static RadioLoadingError = RadioLoadingError;

  /**
   * Downloads an audio file from a URL and extracts its ID3/metadata tags.
   *
   * @param {string} url - The full URL of the audio file to be downloaded.
   * @param {ParseContentMetadata} parseFile - The function used to parse the file data.
   * @returns {Promise<ContentMetadata>} A promise that resolves to an object containing the extracted metadata.
   * @throws {TypeError} If the provided `url` is not a string or `parseFile` is not a function.
   * @throws {Error} If the network request fails or the parsing process encounters an error.
   */
  static async extractId3Tags(url, parseFile) {
    // Argument Validation
    if (typeof url !== 'string')
      throw new TypeError(`Expected url to be a string, but received ${typeof url}.`);
    if (typeof parseFile !== 'function')
      throw new TypeError(`Expected parseFile to be a function, but received ${typeof parseFile}.`);

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

      /**
       * Internal helper to validate types within the 'common' object.
       * This ensures that if a property is present, it matches the expected type.
       */
      const validate = () => {
        const isString = (/** @type {string | null | undefined} */ v) =>
          typeof v === 'string' || v === null || v === undefined;
        const isNumber = (/** @type {number | null | undefined} */ v) =>
          typeof v === 'number' || v === null || v === undefined;
        const isArray = (/** @type {string[] | IPicture[] | undefined} */ v) =>
          Array.isArray(v) || typeof v === 'undefined';

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
        if (!isArray(common.albumartists))
          throw new TypeError('Invalid metadata: "albumartists" must be an array.');
        if (!isArray(common.genre))
          throw new TypeError('Invalid metadata: "genre" must be an array.');
        if (!isArray(common.label))
          throw new TypeError('Invalid metadata: "label" must be an array.');
        if (!isArray(common.composer))
          throw new TypeError('Invalid metadata: "composer" must be an array.');
        if (!isArray(common.artists))
          throw new TypeError('Invalid metadata: "artists" must be an array.');
        if (!isArray(common.picture))
          throw new TypeError('Invalid metadata: "picture" must be an array.');

        /**
         * Validate Nested Objects (Disk and Track)
         * @param {MusicNumber|null} [info]
         * @param {string} [name]
         */
        const validateTrackInfo = (info, name) => {
          if (info !== undefined && info !== null) {
            if (!(typeof info === 'object' && info !== null))
              throw new TypeError(`Invalid metadata: "${name}" must be an object.`);
            if (typeof info.no !== 'number' && info.no !== null)
              throw new TypeError(`Invalid metadata: "${name}.no" must be a number or null.`);
            if (typeof info.of !== 'number' && info.of !== null)
              throw new TypeError(`Invalid metadata: "${name}.of" must be a number or null.`);
          }
        };

        validateTrackInfo(common.disk, 'disk');
        validateTrackInfo(common.track, 'track');
      };

      validate();

      // 5. Return the specific metadata fields requested
      // We structure the return to match the ContentMetadata typedef
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
        track: common?.track
          ? { no: common.track.no, of: common.track.of }
          : { no: null, of: null },
        picture: common?.picture ?? [],
      };
    } catch (error) {
      // Re-throwing the error allows the caller to handle specific failure cases
      throw error;
    }
  }

  /**
   * A Static Factory Method that prepares a RadioContent object by
   * extracting metadata from an audio source.
   *
   * @param {string | HTMLMediaElement} source - A URL string or an existing Audio object.
   * @param {Partial<RadioContentBase & ContentMetadata> & { id?: string; weight?: number }} [metadata={}] - Optional manual metadata that overrides automatic extraction.
   * @param {ParseContentMetadata} [parseFile] - Private helper to interface with parseFile.
   * @param {Object} [callbacks={}] - Callbacks for monitoring the loading process.
   * @param {(progress: LoadingProgress) => void} [callbacks.onProgress] - Callback triggered on stage changes.
   * @param {(error: LoadingError) => void} [callbacks.onError] - Callback triggered when a non-fatal or fatal error occurs.
   * @returns {Promise<RadioContent>} A promise that resolves to a valid RadioContent object.
   * @throws {RadioLoadingError} If the preparation process fails at any stage.
   *
   * @example
   * // Usage with URL
   * import { parseBlob } from 'music-metadata';
   * const track = await TinyRadioFm.prepareContent('/assets/song.mp3', { title: 'My Song', artist: 'Artist' }, parseBlob);
   * radio.add('music', track);
   *
   * @example
   * // Usage with Audio Object
   * import { parseBlob } from 'music-metadata';
   * const audio = new Audio();
   * audio.src = '/assets/song.mp3';
   * const track = await TinyRadioFm.prepareContent(audio, {}, parseBlob);
   * radio.add('music', track);
   *
   * @example
   * // Usage with tracking
   * const track = await TinyRadioFm.prepareContent(
   *   '/assets/song.mp3',
   *   {},
   *   parseBlob,
   *   {
   *     onProgress: (p) => console.log(`[${p.stage}] ${p.status}`),
   *     onError: (e) => console.error(`Failed at ${e.stage} for ${e.url}: ${e.error.message}`)
   *   }
   * );
   */
  static async prepareContent(
    source,
    metadata = {},
    parseFile = (url) => {
      return new Promise((resolve, reject) =>
        reject(new TypeError('parseFile library not found.')),
      );
    },
    callbacks = {},
  ) {
    // Argument Validation
    if (typeof source !== 'string' && !(source instanceof HTMLMediaElement))
      throw new TypeError('Source must be a string or an HTMLMediaElement.');

    if (callbacks.onProgress && typeof callbacks.onProgress !== 'function')
      throw new TypeError('callbacks.onProgress must be a function.');
    if (callbacks.onError && typeof callbacks.onError !== 'function')
      throw new TypeError('callbacks.onError must be a function.');

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
        throw new RadioLoadingError(
          err instanceof Error ? err.message : 'UNKNOWN ERROR',
          url,
          'METADATA',
        );
      }

      // 3. Initialize Base Data (Core properties required for the system)
      const baseData = {
        id: metadata.id || (await TinyRadioFm._generateSimpleHash(url)),
        duration: Math.floor(audio.duration * 1000), // Convert to ms for our class
        url: url,
        weight: metadata.weight ?? 1,
      };

      // 4. Automatic Metadata Extraction (ID3 Tags)
      /** @type {Partial<ContentMetadata>} */
      let extractedMetadata = {};
      notifyProgress('EXTRACTING_ID3');
      try {
        extractedMetadata = await TinyRadioFm.extractId3Tags(url, parseFile);
      } catch (err) {
        // We treat ID3 failure as a non-fatal error for the whole process,
        // but we still notify the developer via onError.
        notifyError(err instanceof Error ? err : new Error('Unknown Error'), 'ID3');
        console.warn(`[TinyRadioFm] ID3 extraction failed for ${url}. Falling back to filename.`);
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
        ...metadata,
        ...extractedMetadata,
        // Explicitly ensure title and artist are resolved from the hierarchy
        title: extractedMetadata.title || metadata.title || getFallbackTitleFromUrl(url),
        artist:
          extractedMetadata.artist ||
          metadata.artist ||
          (typeof TinyRadioFm.#unknownArtist === 'string'
            ? TinyRadioFm.#unknownArtist
            : String(TinyRadioFm.#unknownArtist())),
      };

      // Notify Success
      if (callbacks.onProgress) {
        callbacks.onProgress({
          status: 'success',
          stage: 'COMPLETE',
          url: url,
        });
      }

      return /** @type {RadioContent} */ (finalContent);
    } catch (err) {
      // If it's already a RadioLoadingError, re-throw it.
      // Otherwise, wrap it.
      if (err instanceof RadioLoadingError) {
        throw err;
      } else {
        const wrappedError = new RadioLoadingError(
          err instanceof Error ? err.message : 'UNKNOWN ERROR',
          url,
          'INITIALIZING',
        );
        notifyError(wrappedError, 'INITIALIZING');
        throw wrappedError;
      }
    }
  }

  /**
   * Internal helper to generate a deterministic ID from a string.
   * @param {string} str
   * @returns {Promise<string>}
   * @private
   */
  static async _generateSimpleHash(str) {
    const msgUint8 = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-1', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    // Return first 8 chars of the hex hash for a clean ID
    return hashArray
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .substring(0, 8);
  }

  /** @type {ContentMetadata} */
  static #contentTemplate = {
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
  };
  /** @type {ContentMetadata} */
  static get contentTemplate() {
    return structuredClone(this.#contentTemplate);
  }

  /** @type {string|(() => string)} */
  static #unknownArtist = 'Unknown Artist';

  get unknownArtist() {
    return TinyRadioFm.#unknownArtist;
  }

  set unknownArtist(value) {
    if (typeof value !== 'string' && typeof value !== 'function')
      throw new TypeError('unknownArtist must have an string or function.');
    TinyRadioFm.#unknownArtist = value;
    this.emit('unknownArtistChanged', { unknownArtist: value });
  }

  /** @type {RadioContent[]} */
  #musicList = [];
  /** @returns {RadioContent[]} */
  get musicList() {
    return structuredClone(this.#musicList);
  }

  /** @type {RadioContent[]} */
  #voiceList = [];
  /** @returns {RadioContent[]} */
  get voiceList() {
    return structuredClone(this.#voiceList);
  }

  /** @type {CustomPosition[]} */
  #customPositions = [];
  /** @returns {CustomPosition[]} */
  get customPositions() {
    return structuredClone(this.#customPositions);
  }

  /** @type {ScheduledTask[]} */
  #scheduledTasks = [];
  /** @returns {ScheduledTask[]} */
  get scheduledTasks() {
    return structuredClone(this.#scheduledTasks);
  }

  /**
   * Returns a deep clone of the internal all list cache.
   * @returns {RadioContent[]} A cloned object of the cache.
   */
  get allList() {
    return [...this.musicList, ...this.voiceList];
  }

  /** @type {number} */
  #seed = 0;
  get seed() {
    return this.#seed;
  }
  /**
   * Sets the core randomness seed and clears the current cycle cache.
   * @param {number} seed - The new seed.
   */
  set seed(seed) {
    if (typeof seed !== 'number') throw new TypeError('Seed must be a number.');
    this.#seed = seed;
    this.#cycleCache.clear();
    this.emit('seedChanged', { seed });
  }

  /** @type {number} */
  #anchorDate = Date.now();
  get anchorDate() {
    return this.#anchorDate;
  }

  /** @type {Map<number, CycleBlock>} */
  #cycleCache = new Map();
  /** @type {Record<number, CycleBlock>} */
  get cycleCache() {
    return structuredClone(Object.fromEntries(this.#cycleCache));
  }

  /** @type {RadioConfig} */
  #config = {
    mode: 'playlist',
    voiceMode: 'playlist',
    silenceDuration: 0,
    queryLimit: 100000,
    voiceAfterMusic: true,
    voiceMin: 0,
    voiceMax: 1,
    musicMaxConsecutive: 0,
    voiceMaxConsecutive: 0,
  };
  /** @returns {RadioConfig} */
  get config() {
    return structuredClone(this.#config);
  }
  /**
   * Performs a complete replacement of the configuration.
   * @param {RadioConfig} config - The new full configuration object.
   * @throws {TypeError|RangeError} If the new configuration is invalid.
   */
  set config(config) {
    // Validate the entire object before applying it
    this.#validateConfig(config);

    this.#config = structuredClone(config);
    this.#cycleCache.clear();
    this.emit('configChanged', { config: this.config });
  }

  /**
   * Validates the integrity and logical consistency of a RadioConfig object.
   *
   * @param {Partial<RadioConfig> | RadioConfig} config - The configuration object to validate.
   * @throws {TypeError} If a property has an incorrect type.
   * @throws {RangeError} If a numeric value is out of allowed bounds or logically inconsistent.
   */
  #validateConfig(config) {
    if (typeof config !== 'object' || config === null) {
      throw new TypeError('Configuration must be a valid object.');
    }

    const modes = ['playlist', 'random'];

    // 1. Type and Bounds Validation
    if (config.mode !== undefined && !modes.includes(config.mode)) {
      throw new TypeError(`Invalid mode: "${config.mode}". Must be one of: ${modes.join(', ')}.`);
    }

    if (config.voiceMode !== undefined && !modes.includes(config.voiceMode)) {
      throw new TypeError(
        `Invalid voiceMode: "${config.voiceMode}". Must be one of: ${modes.join(', ')}.`,
      );
    }

    if (
      config.silenceDuration !== undefined &&
      (typeof config.silenceDuration !== 'number' || config.silenceDuration < 0)
    ) {
      throw new TypeError('silenceDuration must be a non-negative number.');
    }

    if (
      config.queryLimit !== undefined &&
      (typeof config.queryLimit !== 'number' || config.queryLimit <= 0)
    ) {
      throw new TypeError('queryLimit must be a positive number.');
    }

    if (config.voiceAfterMusic !== undefined && typeof config.voiceAfterMusic !== 'boolean') {
      throw new TypeError('voiceAfterMusic must be a boolean.');
    }

    if (
      config.voiceMin !== undefined &&
      (typeof config.voiceMin !== 'number' || config.voiceMin < 0)
    ) {
      throw new TypeError('voiceMin must be a non-negative number.');
    }

    if (
      config.voiceMax !== undefined &&
      (typeof config.voiceMax !== 'number' || config.voiceMax < 0)
    ) {
      throw new TypeError('voiceMax must be a non-negative number.');
    }
    
    if (
      config.musicMaxConsecutive !== undefined &&
      (typeof config.musicMaxConsecutive !== 'number' || config.musicMaxConsecutive < 0)
    ) {
      throw new TypeError('musicMaxConsecutive must be a non-negative number.');
    }
    
    if (
      config.voiceMaxConsecutive !== undefined &&
      (typeof config.voiceMaxConsecutive !== 'number' || config.voiceMaxConsecutive < 0)
    ) {
      throw new TypeError('voiceMaxConsecutive must be a non-negative number.');
    }

    // 2. Logical Cross-Field Validation
    const min = config.voiceMin ?? this.#config.voiceMin;
    const max = config.voiceMax ?? this.#config.voiceMax;

    if (max < min) {
      throw new RangeError(
        `Logical error: voiceMax (${max}) cannot be less than voiceMin (${min}).`,
      );
    }
  }

  /**
   * Initializes the radio system.
   * @param {TinyRadioFmImport|null} [initialData=null] - JSON object to hydrate the radio state.
   * @param {number} [seed=0] - Initial seed for deterministic randomness.
   * @throws {TypeError} If initialData is not an object or null, or if seed is not a number.
   */
  constructor(initialData = null, seed = 0) {
    super();
    if (initialData !== null && typeof initialData !== 'object')
      throw new TypeError('initialData must be an object or null.');
    if (typeof seed !== 'number') throw new TypeError('seed must be a number.');

    this.#seed = seed;

    // Bootstraps the application state ensuring determinism based on the anchor.
    if (initialData) {
      this.#hydrate(initialData);
    } else {
      this.#anchorDate = Date.now();
    }
  }

  // --- PUBLIC API ---

  /**
   * Adds new content instantly to the radio sequence.
   * @param {'music'|'voice'|'custom'} type - The category of the content.
   * @param {RadioContent & { timestamp?: number }} data - The content payload to insert.
   * @throws {TypeError} If the type is invalid or the data lacks a valid ID and numerical duration.
   */
  add(type, data) {
    if (!['music', 'voice', 'custom'].includes(type)) {
      throw new TypeError('Type must be "music", "voice", or "custom".');
    }
    if (!data || typeof data.id !== 'string' || typeof data.duration !== 'number') {
      throw new TypeError(
        'Content must have a string ID and a valid numerical duration in milliseconds.',
      );
    }

    if (type === 'music') {
      this.#musicList.push(data);
      this.#cycleCache.clear();
    } else if (type === 'voice') {
      this.#voiceList.push(data);
      this.#cycleCache.clear();
    } else if (type === 'custom') {
      this.#handleCustomInsertion(data);
    }

    this.#syncRealTimeState(Date.now());
    this.emit('contentAdded', { type, data: structuredClone(data) });
  }

  /**
   * Schedules a modification to the base playlists, seamlessly breaking the timeline when activated.
   * @param {number} timestamp - Epoch timestamp in ms.
   * @param {'add'|'remove'|'move'} action - Action to perform.
   * @param {'music'|'voice'} type - Target list.
   * @param {ScheduledTaskPayload} payload - Data relative to the action.
   * @throws {TypeError} If arguments do not match the required types or action/type constraints.
   */
  scheduleTask(timestamp, action, type, payload) {
    if (typeof timestamp !== 'number' || isNaN(timestamp))
      throw new TypeError('timestamp must be a valid number.');
    if (!['add', 'remove', 'move'].includes(action))
      throw new TypeError('action must be "add", "remove", or "move".');
    if (!['music', 'voice'].includes(type)) throw new TypeError('type must be "music" or "voice".');

    // Payload-specific validation based on action
    if (action === 'add') {
      if (
        typeof payload !== 'object' ||
        payload === null ||
        typeof payload.id !== 'string' ||
        // @ts-ignore
        typeof payload.duration !== 'number'
      ) {
        throw new TypeError(
          'Payload for "add" must be a RadioContent object (id: string, duration: number).',
        );
      }
    } else if (action === 'remove') {
      if (typeof payload !== 'string') {
        throw new TypeError('Payload for "remove" must be a string (the content ID).');
      }
    } else if (action === 'move') {
      if (
        typeof payload !== 'object' ||
        payload === null ||
        typeof payload.id !== 'string' ||
        // @ts-ignore
        typeof payload.newIndex !== 'number'
      ) {
        throw new TypeError(
          'Payload for "move" must be a ScheduledMovePayload (id: string, newIndex: number).',
        );
      }
    }

    /** @type {ScheduledTask} */
    const task = { timestamp, action, type, payload };
    this.#scheduledTasks.push(task);
    this.#syncRealTimeState(Date.now());

    this.emit('taskScheduled', structuredClone(task));
  }

  /**
   * Removes content instantly by ID across all active lists, positions, and future tasks.
   * @param {string} id - The unique identifier of the content.
   * @throws {TypeError} If the id is not a string.
   */
  remove(id) {
    if (typeof id !== 'string') throw new TypeError('id must be a string.');

    /**
     * Filter function to match items against the provided ID.
     * @type {function(any): boolean}
     */
    const filterFn = (item) => item.id !== id && item.content?.id !== id;

    this.#musicList = this.#musicList.filter(filterFn);
    this.#voiceList = this.#voiceList.filter(filterFn);
    this.#customPositions = this.#customPositions.filter(filterFn);

    this.#scheduledTasks = this.#scheduledTasks.filter((t) => {
      if (
        t.action === 'add' &&
        typeof t.payload === 'object' &&
        t.payload !== null &&
        'id' in t.payload
      ) {
        return t.payload.id !== id;
      }
      return t.payload !== id;
    });

    this.#cycleCache.clear();
    this.emit('contentRemoved', { id });
  }

  /**
   * Performs a partial update of the configuration.
   * @param {Partial<RadioConfig>} config - The configuration overrides.
   * @throws {TypeError|RangeError} If the provided values or the resulting state is invalid.
   */
  setConfig(config) {
    // First, validate the incoming partial object for basic type correctness
    this.#validateConfig(config);

    // Create the potential new state
    const nextConfig = { ...this.#config, ...config };

    // Second, validate the complete resulting state for logical consistency (e.g., min vs max)
    this.#validateConfig(nextConfig);

    this.#config = nextConfig;
    this.#cycleCache.clear();
    this.emit('configChanged', { config: this.config });
  }

  /**
   * Retrieves the exact event playing at the current system time.
   * @returns {RadioEvent|null} The current active event, or null if empty.
   */
  getCurrentEvent() {
    const now = Date.now();
    this.#syncRealTimeState(now);
    return this.#getEventAtTime(now, now);
  }

  /**
   * Queries the timeline from a specific date forward to predict upcoming events.
   * Uses a virtual clone to predict scheduled tasks accurately without mutating current state.
   * @param {number} targetDate - The starting epoch timestamp.
   * @param {number} [limit=10] - Maximum number of upcoming events to resolve.
   * @returns {RadioEvent[]} Array of resolved upcoming events.
   * @throws {TypeError} If limit is not a number.
   * @throws {RangeError} If the limit exceeds the configured queryLimit or is <= 0.
   */
  queryTimeline(targetDate, limit = 10) {
    if (typeof limit !== 'number' || isNaN(limit)) {
      throw new TypeError(`Invalid query limit value. Ensure it is a number.`);
    }
    if (limit > this.#config.queryLimit || limit <= 0) {
      throw new RangeError(
        `Invalid query limit. Ensure it is > 0 and <= ${this.#config.queryLimit}.`,
      );
    }

    /**
     * Virtual instance to sandbox the timeline prediction.
     * @type {TinyRadioFm}
     */
    const virtualSandbox = new TinyRadioFm(JSON.parse(this.exportState()));

    /** @type {RadioEvent[]} */
    const events = [];
    let currentTimeWalker = targetDate;

    for (let i = 0; i < limit; i++) {
      virtualSandbox.#syncRealTimeState(currentTimeWalker);
      const nextEvent = virtualSandbox.#resolveNextEvent(currentTimeWalker, targetDate);
      if (!nextEvent) break;

      events.push(nextEvent);
      currentTimeWalker = nextEvent.absoluteEnd;
    }

    this.emit('timelineQueried', { targetDate, limit, resultCount: events.length });
    return events;
  }

  /**
   * Returns all active custom positions currently injected into the timeline.
   * @returns {CustomPosition[]} Shallow copy of custom positions array.
   */
  searchCustomPositions() {
    this.#syncRealTimeState(Date.now());
    return [...this.#customPositions];
  }

  /**
   * Exports the complete state of the radio, including caches and scheduled tasks.
   * @returns {string} Stringified JSON state.
   */
  exportState() {
    return JSON.stringify({
      music: this.#musicList,
      voice: this.#voiceList,
      custom: this.#customPositions,
      tasks: this.#scheduledTasks,
      seed: this.#seed,
      anchorDate: this.#anchorDate,
      config: this.#config,
    });
  }

  /**
   * Imports a previously exported state, overwriting the current instance.
   * @param {string|TinyRadioFmImport} json - JSON state or object.
   * @throws {TypeError} If json is not a valid string or object.
   */
  importState(json) {
    /** @type {TinyRadioFmImport} */
    let data;
    if (typeof json === 'string') {
      try {
        data = JSON.parse(json);
      } catch {
        throw new TypeError('Provided string is not valid JSON.');
      }
    } else if (typeof json === 'object' && json !== null) {
      data = json;
    } else {
      throw new TypeError('Import data must be a valid JSON string or an object.');
    }

    this.#hydrate(data);
    this.emit('stateImported', { data: structuredClone(data) });
  }

  /**
   * Mulberry32 Pseudo-Random Number Generator.
   * @param {number} seed - The initialization seed.
   * @returns {function(): number} PRNG function returning a float between 0 and 1.
   * @private
   */
  _prng(seed) {
    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // --- PRIVATE LOGIC ---

  /**
   * Creates a deterministic sequence supporting weighted selection based on mode.
   * @param {RadioContent[]} list - The source list to sequence.
   * @param {number} currentSeed - Cycle-specific seed.
   * @param {RadioModes} mode - Processing mode.
   * @param {number} [maxConsecutive=0] - Max consecutive repetitions permitted (0 = unlimited).
   * @returns {RadioContent[]} The generated sequence.
   */
  #buildSequence(list, currentSeed, mode, maxConsecutive = 0) {
    if (list.length === 0) return [];
    if (mode !== 'random') return [...list]; // Respects manual indexing/moving

    /**
     * Pool of available items for weighted selection.
     * @type {Array<RadioContent & { weight: number }>}
     */
    const pool = list.map((item) => ({ ...item, weight: item.weight ?? 1 }));
    const random = this._prng(currentSeed);

    /**
     * The finalized deterministic sequence.
     * @type {RadioContent[]}
     */
    const sequence = [];

    /** @type {string|null} */
    let lastId = null;
    let consecutiveCount = 0;

    while (pool.length > 0) {
      let validPool = pool;

      // If there is a restriction rule and the consecutive limit has been reached
      if (maxConsecutive > 0 && lastId !== null && consecutiveCount >= maxConsecutive) {
        // Try filtering the last played to force the rotation
        validPool = pool.filter((item) => item.id !== lastId);

        // Self-adjustment: If there is nothing left in the urn (small/no diversity playlist),
        // we revert to the full pool so as not to stagnate the cycle.
        if (validPool.length === 0) {
          validPool = pool;
        }
      }

      const totalWeight = validPool.reduce((sum, item) => sum + item.weight, 0);

      // Safety catch if all weights are 0
      if (totalWeight <= 0) {
        sequence.push(...validPool);
        break;
      }

      const r = random() * totalWeight;
      let sum = 0;
      /** @type {RadioContent|null} */
      let selectedItem = null;
      let selectedIndex = -1;

      // Run the draw on the valid urn
      for (let i = 0; i < validPool.length; i++) {
        sum += validPool[i].weight;
        if (r <= sum) {
          selectedItem = validPool[i];
          // Find the index in the original pool for correct removal
          selectedIndex = pool.findIndex((p) => selectedItem && p.id === selectedItem.id);
          break;
        }
      }

      // Fallback in case of mathematical failure in floating accuracy
      if (!selectedItem || selectedIndex === -1) {
        selectedItem = validPool[0];
        selectedIndex = pool.findIndex((p) => selectedItem && p.id === selectedItem.id);
      }

      sequence.push(selectedItem);
      pool.splice(selectedIndex, 1);

      // Update counters to the next loop step
      if (selectedItem.id === lastId) {
        consecutiveCount++;
      } else {
        lastId = selectedItem.id;
        consecutiveCount = 1;
      }
    }

    return sequence;
  }

  /**
   * Generates a structural block representing a single full cycle of the radio.
   * @param {number} loopIndex - The current cycle iteration to generate appropriate seeds.
   * @returns {CycleBlock} The generated cycle block containing sequenced items and total duration.
   */
  #buildCycleBlock(loopIndex) {
    const cycleSeed = this.#seed + loopIndex;
    const mixRandom = this._prng(cycleSeed * 10);

    const musicSeq = this.#buildSequence(this.#musicList, cycleSeed + 1, this.#config.mode, this.#config.musicMaxConsecutive);
    const voiceSeq = this.#buildSequence(this.#voiceList, cycleSeed + 2, this.#config.voiceMode, this.#config.voiceMaxConsecutive);

    /**
     * Array containing the positioned items for the current cycle.
     * @type {CycleBlockData[]}
     */
    const block = [];
    let cycleDuration = 0;
    let voiceCursor = 0;

    for (let mIdx = 0; mIdx < musicSeq.length; mIdx++) {
      const music = musicSeq[mIdx];
      block.push({
        ...music,
        cycleStart: cycleDuration,
        cycleEnd: cycleDuration + music.duration,
      });
      cycleDuration += music.duration + this.#config.silenceDuration;

      if (this.#config.voiceAfterMusic && voiceSeq.length > 0) {
        const range = this.#config.voiceMax - this.#config.voiceMin + 1;
        const voiceAmount = Math.floor(mixRandom() * range) + this.#config.voiceMin;

        for (let v = 0; v < voiceAmount; v++) {
          const voice = voiceSeq[voiceCursor % voiceSeq.length];
          voiceCursor++;

          block.push({
            ...voice,
            cycleStart: cycleDuration,
            cycleEnd: cycleDuration + voice.duration,
          });
          cycleDuration += voice.duration + this.#config.silenceDuration;
        }
      }
    }

    return { items: block, duration: cycleDuration };
  }

  /**
   * Fast-forwards to find the exact cycle encompassing the target absolute timestamp.
   * @param {number} targetAbsoluteTime - The absolute epoch timestamp to locate.
   * @returns {CycleLocation|null} The resolved cycle location or null if lists are empty.
   * @throws {Error} If the loop safety limit is hit.
   */
  #locateCycleForTime(targetAbsoluteTime) {
    if (this.#musicList.length === 0) return null;

    let walkerAnchor = this.#anchorDate;
    let loopIdx = 0;

    while (true) {
      if (loopIdx > this.#config.queryLimit) {
        throw new Error('Safety limit hit during cycle location.');
      }

      let blockData = this.#cycleCache.get(loopIdx);
      if (!blockData) {
        blockData = this.#buildCycleBlock(loopIdx);
        this.#cycleCache.set(loopIdx, blockData);
      }

      if (blockData.duration === 0) return null;

      if (
        targetAbsoluteTime >= walkerAnchor &&
        targetAbsoluteTime < walkerAnchor + blockData.duration
      ) {
        return { block: blockData, startTimestamp: walkerAnchor, loopIndex: loopIdx };
      }

      walkerAnchor += blockData.duration;
      loopIdx++;
    }
  }

  /**
   * Orchestrates overlap checking to find the absolute closest next event.
   * @param {number} walkerTime - The internal time cursor during queries.
   * @param {number} originalTargetDate - The initial requested epoch target.
   * @returns {RadioEvent|null} The resolved next event.
   */
  #resolveNextEvent(walkerTime, originalTargetDate) {
    /**
     * @type {CustomPosition|undefined}
     */
    const nextCustomPos = this.#customPositions
      .filter((cp) => cp.intendedTimestamp + cp.content.duration > walkerTime)
      .sort((a, b) => a.intendedTimestamp - b.intendedTimestamp)[0];

    let customEvent = null;
    if (nextCustomPos) {
      const qTime = Math.max(originalTargetDate, nextCustomPos.intendedTimestamp);
      customEvent = this.#formatEvent(
        nextCustomPos.content,
        nextCustomPos.intendedTimestamp,
        qTime,
        true,
      );
    }

    const baseEvent = this.#getNextBaseEvent(walkerTime, originalTargetDate);

    if (!baseEvent && !customEvent) return null;
    if (!baseEvent) return customEvent;
    if (!customEvent) return baseEvent;

    if (customEvent.absoluteStart <= baseEvent.absoluteStart) return customEvent;

    // Truncate base event if an impending custom event overlaps it
    if (customEvent.absoluteStart < baseEvent.absoluteEnd) {
      baseEvent.absoluteEnd = customEvent.absoluteStart;
      baseEvent.duration = baseEvent.absoluteEnd - baseEvent.absoluteStart;
      baseEvent.remainingTime = Math.max(0, baseEvent.absoluteEnd - originalTargetDate);
      baseEvent.progress = Math.min(1, baseEvent.elapsedTime / baseEvent.duration);
    }

    return baseEvent;
  }

  /**
   * Resolves the next standard loop event bypassing custom interruptions.
   * @param {number} walkerTime - The internal time cursor.
   * @param {number} originalTargetDate - The initial requested epoch target.
   * @returns {RadioEvent|null} The formatted base event.
   */
  #getNextBaseEvent(walkerTime, originalTargetDate) {
    let cycleInfo = this.#locateCycleForTime(walkerTime);
    if (!cycleInfo) return null;

    const { block, startTimestamp } = cycleInfo;
    const cycleCurrentTime = walkerTime - startTimestamp;

    /** @type {CycleBlockData|undefined} */
    let nextItem = block.items.find((i) => i.cycleEnd > cycleCurrentTime);
    let absoluteStart;

    if (nextItem) {
      absoluteStart = startTimestamp + nextItem.cycleStart;
    } else {
      // Reached the gap between cycles, fetch the next loop
      cycleInfo = this.#locateCycleForTime(startTimestamp + block.duration);
      if (!cycleInfo || cycleInfo.block.items.length === 0) return null;

      nextItem = cycleInfo.block.items[0];
      absoluteStart = cycleInfo.startTimestamp + nextItem.cycleStart;
    }

    const qTime = Math.max(originalTargetDate, absoluteStart);
    return this.#formatEvent(nextItem, absoluteStart, qTime, false);
  }

  /**
   * Calculates exactly what is playing at a specific absolute timestamp.
   * @param {number} absoluteTime - The target time to inspect.
   * @param {number} originalQueryTime - Original requested time to calculate elapsed data.
   * @returns {RadioEvent|null} The active event or null.
   */
  #getEventAtTime(absoluteTime, originalQueryTime) {
    const activeCustom = this.#customPositions.find(
      (cp) =>
        absoluteTime >= cp.intendedTimestamp &&
        absoluteTime < cp.intendedTimestamp + cp.content.duration,
    );

    if (activeCustom) {
      return this.#formatEvent(
        activeCustom.content,
        activeCustom.intendedTimestamp,
        originalQueryTime,
        true,
      );
    }

    const cycleInfo = this.#locateCycleForTime(absoluteTime);
    if (!cycleInfo) return null;

    const { block, startTimestamp } = cycleInfo;
    const cycleRelativeTime = absoluteTime - startTimestamp;

    const currentItem = block.items.find(
      (i) => cycleRelativeTime >= i.cycleStart && cycleRelativeTime < i.cycleEnd,
    );

    if (!currentItem) return null;
    return this.#formatEvent(
      currentItem,
      startTimestamp + currentItem.cycleStart,
      originalQueryTime,
      false,
    );
  }

  /**
   * Formats internal block data into standardized external event structures.
   * @param {CycleBlockData | RadioContent} item - Raw content data.
   * @param {number} absoluteStart - Event's absolute start epoch.
   * @param {number} queryTime - Timestamp requested for progress math.
   * @param {boolean} isCustom - Flag indicating if it is a user injected custom event.
   * @returns {RadioEvent} Standardized output.
   */
  #formatEvent(item, absoluteStart, queryTime, isCustom) {
    const elapsedTime = queryTime - absoluteStart;
    return {
      id: item.id,
      title: item.title,
      artist: item.artist,
      duration: item.duration,
      url: item.url,
      absoluteStart: absoluteStart,
      absoluteEnd: absoluteStart + item.duration,
      elapsedTime: elapsedTime,
      remainingTime: item.duration - elapsedTime,
      progress: Math.min(1, elapsedTime / item.duration),
      isCustom: isCustom,
    };
  }

  /**
   * Safely calculates the best absolute timestamp gap for a custom event without disrupting metadata.
   * @param {RadioContent & { timestamp?: number }} data - Target data to insert.
   */
  #handleCustomInsertion(data) {
    const originalTarget = data.timestamp || Date.now();
    const duration = data.duration;

    const activeCps = [...this.#customPositions].sort(
      (a, b) => a.intendedTimestamp - b.intendedTimestamp,
    );

    let bestSlot = originalTarget;
    const hasOverlap = activeCps.some(
      (cp) =>
        originalTarget < cp.intendedTimestamp + cp.content.duration &&
        originalTarget + duration > cp.intendedTimestamp,
    );

    if (hasOverlap) {
      const now = Date.now();

      /**
       * Contains the valid windows of time available.
       * @type {Array<{start: number, end: number}>}
       */
      const gaps = [];
      let currentBoundary = now;

      // Extract available timeline gaps
      for (const cp of activeCps) {
        if (cp.intendedTimestamp > currentBoundary) {
          gaps.push({ start: currentBoundary, end: cp.intendedTimestamp });
        }
        currentBoundary = Math.max(
          currentBoundary,
          cp.intendedTimestamp + cp.content.duration + this.#config.silenceDuration,
        );
      }
      gaps.push({ start: currentBoundary, end: Infinity });

      // Mathematical closest distance algorithm
      let minDistance = Infinity;

      for (const gap of gaps) {
        if (gap.end - gap.start >= duration) {
          let candidate = null;

          if (originalTarget >= gap.start && originalTarget + duration <= gap.end) {
            candidate = originalTarget;
          } else if (originalTarget < gap.start) {
            candidate = gap.start;
          } else if (originalTarget > gap.end) {
            candidate = gap.end - duration;
          }

          if (candidate !== null) {
            const distance = Math.abs(originalTarget - candidate);
            if (distance < minDistance) {
              minDistance = distance;
              bestSlot = candidate;
            }
          }
        }
      }
    }

    this.#customPositions.push({
      content: data,
      intendedTimestamp: bestSlot,
      originalTimestamp: originalTarget,
    });
  }

  /**
   * Processes all pending tasks up to the requested boundary time and shifts internal timelines.
   * @param {number} boundaryTime - Threshold to apply mutations.
   */
  #syncRealTimeState(boundaryTime) {
    const pendingTasks = this.#scheduledTasks.filter((t) => t.timestamp <= boundaryTime);
    this.#scheduledTasks = this.#scheduledTasks.filter((t) => t.timestamp > boundaryTime);

    const expiredCps = this.#customPositions.filter(
      (cp) => cp.intendedTimestamp + cp.content.duration <= boundaryTime,
    );
    this.#customPositions = this.#customPositions.filter(
      (cp) => cp.intendedTimestamp + cp.content.duration > boundaryTime,
    );

    let listsMutated = false;

    expiredCps.forEach((cp) => {
      this.#seed += cp.content.id.length;
      listsMutated = true;
      this.emit('customPositionExpired', { contentId: cp.content.id });
    });

    // Applies scheduled modifications intelligently, establishing new anchor epochs to prevent timeline corruption.
    if (pendingTasks.length > 0) {
      pendingTasks
        .sort((a, b) => a.timestamp - b.timestamp)
        .forEach((task) => {
          const list = task.type === 'music' ? this.#musicList : this.#voiceList;

          if (task.action === 'add') {
            list.push(/** @type {RadioContent} */ (task.payload));
          } else if (task.action === 'remove') {
            const payloadId = /** @type {string} */ (task.payload);
            const idx = list.findIndex((i) => i.id === payloadId);
            if (idx !== -1) list.splice(idx, 1);
          } else if (task.action === 'move') {
            const payloadData = /** @type {ScheduledMovePayload} */ (task.payload);
            const idx = list.findIndex((i) => i.id === payloadData.id);
            if (idx !== -1) {
              const [item] = list.splice(idx, 1);
              list.splice(payloadData.newIndex, 0, item);
            }
          }

          this.#anchorDate = task.timestamp;
          this.#seed += 1; // Adapt timeline
          listsMutated = true;
          this.emit('taskExecuted', structuredClone(task));
        });
    }

    if (listsMutated) {
      this.#cycleCache.clear();
    }
  }

  /**
   * Hydrates class state from an exported JSON object.
   * @param {TinyRadioFmImport} data
   */
  #hydrate(data) {
    this.#musicList = data.music || [];
    this.#voiceList = data.voice || [];
    this.#seed = data.seed || 0;
    this.#anchorDate = data.anchorDate || Date.now();
    this.#config = { ...this.#config, ...(data.config || {}) };
    this.#customPositions = data.custom || [];
    this.#scheduledTasks = data.tasks || [];
  }
}

export default TinyRadioFm;
