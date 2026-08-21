import { EventEmitter } from 'events';
import {
  blobUrlToBase64,
  convertToBlobUrl,
  parseMediaMetadata,
  revokeContentUrls,
  valMediaContentMetadata,
} from '../../basics/mediaContent.mjs';
import { createCheckDestroyed } from '../utils/tools.mjs';
import { isJsonObject } from '../../basics/objChecker.mjs';
import TinyAdvancedRaffle from '../math/TinyAdvancedRaffle.mjs';

const checkDestroy = createCheckDestroyed('TinyRadioFm');

/**
 * @typedef {import('../../basics/mediaContent.mjs').PictureDataType} PictureDataType
 * @typedef {import('../../basics/mediaContent.mjs').MediaContentBase} MediaContentBase
 * @typedef {import('../../basics/mediaContent.mjs').MediaContentMetadata<PictureDataType>} MediaContentMetadata
 * @typedef {import('../../basics/mediaContent.mjs').MediaContent<PictureDataType>} MediaContent
 * @typedef {import('../../basics/mediaContent.mjs').IPicture} IPicture
 * @typedef {import('../../basics/mediaContent.mjs').MediaNumber} MediaNumber
 * @typedef {import('../../basics/mediaContent.mjs').MediaLoadingError} MediaLoadingError
 * @typedef {import('../../basics/mediaContent.mjs').MediaLoadingErrorData} MediaLoadingErrorData
 * @typedef {import('../../basics/mediaContent.mjs').LoadingMediaProgress} LoadingMediaProgress
 * @typedef {import('../../basics/mediaContent.mjs').ParseMediaContentMetadata} ParseMediaContentMetadata
 * @typedef {import('../../basics/mediaContent.mjs').UnknownArtistGetter} UnknownArtistGetter
 */

//////////////////////////////////////////////////////////////////

/**
 * Represents a content item injected at a specific point in the absolute timeline.
 * @typedef {Object} CustomPosition
 * @property {MediaContent} content - The audio/music content.
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
 * @typedef {MediaContent | string | ScheduledMovePayload} ScheduledTaskPayload
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
 * @property {number} voiceWeight - Weight used to calculate the probability of a voice block occurring.
 * @property {number} voiceMin - Minimum amount of voice messages to play if voiceAfterMusic is true.
 * @property {number} voiceMax - Maximum amount of voice messages to play.
 * @property {number} musicMaxConsecutive - Max times a music track can repeat consecutively (-1 = unlimited, 0 = strictly no repetition).
 * @property {number} musicMinConsecutive - Min times a music track must repeat consecutively (1 = no mandatory repetition).
 * @property {number} voiceMaxConsecutive - Max times a voice track can repeat consecutively (-1 = unlimited, 0 = strictly no repetition).
 * @property {number} voiceMinConsecutive - Min times a voice track can repeat consecutively (1 = no mandatory repetition).
 */

//////////////////////////////////////////////////////////////////

/**
 * An extension of MediaContent that includes temporal boundaries within a generated cycle.
 * @typedef {MediaContent & { cycleStart: number; cycleEnd: number; }} CycleBlockData
 */

/**
 * A structural block representing a single full iteration of the radio sequence.
 * @typedef {Object} CycleBlock
 * @property {CycleBlockData[]} items - Items belonging to this cycle.
 * @property {number} duration - Total duration of the cycle block in ms.
 * @property {string|null} lastMusicId - ID of the last music played in this block.
 * @property {number} musicConsecutiveCount - Current consecutive count for music.
 * @property {string|null} lastVoiceId - ID of the last voice played in this block.
 * @property {number} voiceConsecutiveCount - Current consecutive count for voice.
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
 * @property {MediaContent[]} music - The music playlist.
 * @property {MediaContent[]} voice - The voice playlist.
 * @property {CustomPosition[]} custom - The custom position injections.
 * @property {ScheduledTask[]} tasks - The pending scheduled tasks.
 * @property {number} seed - The randomness seed.
 * @property {number} anchorDate - The timeline anchor timestamp.
 * @property {RadioConfig} config - The engine configuration.
 */

//////////////////////////////////////////////////////////////////

/**
 * A deterministic, seed-based radio management system with scheduled adaptations and weighted random generation.
 * @beta
 */
class TinyRadioFm extends EventEmitter {
  /**
   * A Static Factory Method that prepares a MediaContent object by
   * extracting metadata from an audio source.
   *
   * @param {string | HTMLMediaElement} source - A URL string or an existing Audio object.
   * @param {Partial<MediaContentBase & MediaContentMetadata> & { id?: string; weight?: number }} [defaultMetadata={}] - Optional default metadata.
   * @param {Partial<MediaContentBase & MediaContentMetadata> & { id?: string; weight?: number }} [metadata={}] - Optional manual metadata.
   * @param {ParseMediaContentMetadata} [parseFile] - Private helper to interface with parseFile.
   * @param {Object} [callbacks={}] - Callbacks for monitoring the loading process.
   * @param {(progress: LoadingMediaProgress) => void} [callbacks.onProgress] - Callback triggered on stage changes.
   * @param {(error: MediaLoadingErrorData) => void} [callbacks.onError] - Callback triggered when a non-fatal or fatal error occurs.
   * @param {boolean} [convertBase64toBlob=true] - If the image content needs to be converted directly into a high-performance Blob URL, use this method.
   * @returns {Promise<MediaContent>} A promise that resolves to a valid MediaContent object.
   * @throws {MediaLoadingError} If the preparation process fails at any stage.
   */
  static async parseContent(
    source,
    defaultMetadata,
    metadata,
    parseFile,
    callbacks,
    convertBase64toBlob = true,
  ) {
    return parseMediaMetadata(
      source,
      defaultMetadata,
      metadata,
      parseFile,
      callbacks,
      convertBase64toBlob,
      TinyRadioFm.#unknownArtist,
    );
  }

  /**
   * @type {UnknownArtistGetter}
   * The default identifier or function used when an artist cannot be determined.
   */
  static #unknownArtist = 'Unknown Artist';

  /**
   * Gets the current value used to represent unknown artists.
   * @returns {UnknownArtistGetter}
   */
  static get unknownArtist() {
    return TinyRadioFm.#unknownArtist;
  }

  /**
   * Sets the value used to represent unknown artists.
   * @param {UnknownArtistGetter} value - A string or a function that returns a string.
   * @throws {TypeError} If the value is neither a string nor a function.
   */
  static set unknownArtist(value) {
    if (typeof value !== 'string' && typeof value !== 'function')
      throw new TypeError('unknownArtist must have an string or function.');
    TinyRadioFm.#unknownArtist = value;
  }

  /** @type {boolean} */
  #destroyed = false;

  get destroyed() {
    return this.#destroyed;
  }

  /**
   * Gets the total count of all content items (music and voice) in the system.
   * @returns {number}
   */
  get size() {
    checkDestroy(this.#destroyed);
    return this.#musicList.length + this.#voiceList.length;
  }

  /**
   * Gets the total number of items in the music playlist.
   * @returns {number}
   */
  get musicSize() {
    checkDestroy(this.#destroyed);
    return this.#musicList.length;
  }

  /**
   * Gets the total number of items in the voice playlist.
   * @returns {number}
   */
  get voiceSize() {
    checkDestroy(this.#destroyed);
    return this.#voiceList.length;
  }

  /**
   * Gets the number of active custom position injections.
   * @returns {number}
   */
  get customPosSize() {
    checkDestroy(this.#destroyed);
    return this.#customPositions.length;
  }

  /**
   * Gets the number of pending scheduled tasks.
   * @returns {number}
   */
  get tasksSize() {
    checkDestroy(this.#destroyed);
    return this.#scheduledTasks.length;
  }

  /**
   * Gets the number of items currently stored in the cycle cache.
   * @returns {number}
   */
  get cycleCacheSize() {
    checkDestroy(this.#destroyed);
    return this.#cycleCache.size;
  }

  /** @type {MediaContent[]} */
  #musicList = [];
  /**
   * Gets a deep clone of the music playlist.
   * @returns {MediaContent[]}
   */
  get musicList() {
    checkDestroy(this.#destroyed);
    return structuredClone(this.#musicList);
  }

  /** @type {MediaContent[]} */
  #voiceList = [];
  /**
   * Gets a deep clone of the voice playlist.
   * @returns {MediaContent[]}
   */
  get voiceList() {
    checkDestroy(this.#destroyed);
    return structuredClone(this.#voiceList);
  }

  /** @type {CustomPosition[]} */
  #customPositions = [];
  /**
   * Gets a deep clone of the custom position injections.
   * @returns {CustomPosition[]}
   */
  get customPositions() {
    checkDestroy(this.#destroyed);
    return structuredClone(this.#customPositions);
  }

  /** @type {ScheduledTask[]} */
  #scheduledTasks = [];
  /**
   * Gets a deep clone of the scheduled tasks.
   * @returns {ScheduledTask[]}
   */
  get scheduledTasks() {
    checkDestroy(this.#destroyed);
    return structuredClone(this.#scheduledTasks);
  }

  /**
   * Returns a deep clone of the internal all list cache.
   * @returns {MediaContent[]} A cloned object of the cache.
   */
  get allList() {
    checkDestroy(this.#destroyed);
    return [...this.musicList, ...this.voiceList];
  }

  /** @type {number} */
  #seed = 0;
  /**
   * Gets the current randomness seed.
   * @returns {number}
   */
  get seed() {
    checkDestroy(this.#destroyed);
    return this.#seed;
  }
  /**
   * Sets the core randomness seed and clears the current cycle cache.
   * @param {number} seed - The new seed.
   */
  set seed(seed) {
    checkDestroy(this.#destroyed);
    if (typeof seed !== 'number') throw new TypeError('Seed must be a number.');
    this.#seed = seed;
    this.#cycleCache.clear();
    this.emit('seedChanged', { seed });
  }

  /** @type {number} */
  #anchorDate = Date.now();
  /**
   * Gets the absolute timestamp used as the timeline anchor.
   * @returns {number}
   */
  get anchorDate() {
    checkDestroy(this.#destroyed);
    return this.#anchorDate;
  }

  /** @type {Map<number, CycleBlock>} */
  #cycleCache = new Map();

  /** @type {RadioConfig} */
  #config = {
    mode: 'playlist',
    voiceMode: 'playlist',
    silenceDuration: 0,
    queryLimit: 100000,
    voiceAfterMusic: true,
    voiceMin: 0,
    voiceMax: 1,
    voiceWeight: 1,
    musicMaxConsecutive: 0,
    musicMinConsecutive: 0,
    voiceMaxConsecutive: 0,
    voiceMinConsecutive: 0,
  };
  /**
   * Gets a deep clone of the current radio configuration.
   * @returns {RadioConfig}
   */
  get config() {
    checkDestroy(this.#destroyed);
    return structuredClone(this.#config);
  }
  /**
   * Performs a complete replacement of the configuration.
   * @param {RadioConfig} config - The new full configuration object.
   * @throws {TypeError|RangeError} If the new configuration is invalid.
   */
  set config(config) {
    checkDestroy(this.#destroyed);
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

    // Type and Bounds Validation
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

    const checkRange = (/** @type {number | undefined} */ val, /** @type {string} */ minKey) => {
      if (val !== undefined && (typeof val !== 'number' || val < 0)) {
        throw new TypeError(`${minKey} must be a non-negative number.`);
      }
    };

    checkRange(config.voiceWeight, 'voiceWeight');
    checkRange(config.voiceMin, 'voiceMin');
    checkRange(config.voiceMax, 'voiceMax');
    checkRange(config.musicMinConsecutive, 'musicMinConsecutive');
    checkRange(config.musicMaxConsecutive, 'musicMaxConsecutive');
    checkRange(config.voiceMinConsecutive, 'voiceMinConsecutive');
    checkRange(config.voiceMaxConsecutive, 'voiceMaxConsecutive');

    // Logical cross-field validation
    const vMin = config.voiceMin ?? this.#config.voiceMin;
    const vMax = config.voiceMax ?? this.#config.voiceMax;
    if (vMax < vMin) {
      throw new RangeError(
        `Logical error: voiceMax (${vMax}) cannot be less than voiceMin (${vMin}).`,
      );
    }

    const mMin = config.musicMinConsecutive ?? this.#config.musicMinConsecutive;
    const mMax = config.musicMaxConsecutive ?? this.#config.musicMaxConsecutive;
    if (mMax !== -1 && mMin > mMax) {
      throw new RangeError(
        `Logical error: musicMinConsecutive (${mMin}) cannot be greater than musicMaxConsecutive (${mMax}).`,
      );
    }
  }

  /** @type {boolean} */
  #optimizeMediaMemory = true;

  /**
   * Gets whether Blob URLs for media content
   * should be converted to Base64 during export and restored during import.
   * @returns {boolean}
   */
  get optimizeMediaMemory() {
    checkDestroy(this.#destroyed);
    return this.#optimizeMediaMemory;
  }

  /**
   * Sets whether Blob URLs should be converted to Base64 during export and restored during import.
   * @param {boolean} value
   * @throws {TypeError} If value is not a boolean.
   */
  set optimizeMediaMemory(value) {
    checkDestroy(this.#destroyed);
    if (typeof value !== 'boolean') throw new TypeError('optimizeMediaMemory must be a boolean.');
    this.#optimizeMediaMemory = value;
  }

  /** @type {boolean} */
  #optimizePictureMemory = true;

  /**
   * Gets whether Blob URLs for pictures
   * should be converted to Base64 during export and restored during import.
   * @returns {boolean}
   */
  get optimizePictureMemory() {
    checkDestroy(this.#destroyed);
    return this.#optimizePictureMemory;
  }

  /**
   * Sets whether Blob URLs should be converted to Base64 during export and restored during import.
   * @param {boolean} value
   * @throws {TypeError} If value is not a boolean.
   */
  set optimizePictureMemory(value) {
    checkDestroy(this.#destroyed);
    if (typeof value !== 'boolean') throw new TypeError('optimizePictureMemory must be a boolean.');
    this.#optimizePictureMemory = value;
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
   * Converts new content base64 instantly to the blob url.
   * @param {MediaContent} data
   */
  _ccBase64ToBlobUrl(data) {
    if (this.#optimizeMediaMemory) {
      // Restores the content url if it is a Base64 string
      if (typeof data.url === 'string' && data.url.startsWith('data:')) {
        data.url = convertToBlobUrl(data.url);
      }
    }

    if (data.picture && Array.isArray(data.picture)) {
      data.picture = data.picture.map((pic) => {
        if (this.#optimizePictureMemory) {
          // Check whether the data is compatible with the Blob structure (Base64 or Binary)
          const isBase64 = typeof pic.data === 'string' && pic.data.startsWith('data:');
          const isUint8Array = pic.data instanceof Uint8Array;

          if (isBase64 || isUint8Array) {
            return {
              ...pic,
              data: convertToBlobUrl(pic.data, pic.format),
            };
          }
        }

        // If memory optimization is disabled or it is a default URL, return as is
        return pic;
      });
    }
  }

  /**
   * Restores the content blob instantly to the base64 url.
   * @param {MediaContent} data
   */
  async _rcblobUrlToBase64(data) {
    // Optimizes the content url (audio/music) if it is a Blob URL
    if (this.#optimizeMediaMemory && typeof data.url === 'string' && data.url.startsWith('blob:')) {
      data.url = await blobUrlToBase64(data.url);
    }

    // Optimizes the pictures
    if (this.#optimizePictureMemory && data.picture && Array.isArray(data.picture)) {
      data.picture = await Promise.all(
        data.picture.map(async (pic) => {
          // Only performs the asynchronous conversion if it really is a Blob URL
          if (typeof pic.data === 'string' && pic.data.startsWith('blob:')) {
            return {
              ...pic,
              data: await blobUrlToBase64(pic.data),
            };
          }
          return pic; // Keep intact if it is a standard URL
        }),
      );
    }
  }

  /**
   * Adds new content instantly to the radio sequence.
   * @param {'music'|'voice'|'custom'} type - The category of the content.
   * @param {MediaContent & { timestamp?: number }} data - The content payload to insert.
   * @param {boolean} [smartQueue=true] - If true, delays insertion until the end of the content playing at that timestamp (only affects 'custom').
   * @throws {TypeError} If the type is invalid or the data lacks a valid ID and numerical duration.
   */
  add(type, data, smartQueue = true) {
    checkDestroy(this.#destroyed);
    if (!['music', 'voice', 'custom'].includes(type)) {
      throw new TypeError('Type must be "music", "voice", or "custom".');
    }
    if (!data || typeof data.id !== 'string' || typeof data.duration !== 'number') {
      throw new TypeError(
        'Content must have a string ID and a valid numerical duration in milliseconds.',
      );
    }
    if (typeof smartQueue !== 'boolean') {
      throw new TypeError('smartQueue must be a boolean.');
    }

    valMediaContentMetadata(data);
    const newItem = structuredClone(data);
    this._ccBase64ToBlobUrl(newItem);
    if (type === 'music') {
      this.#musicList.push(newItem);
      this.#cycleCache.clear();
    } else if (type === 'voice') {
      this.#voiceList.push(newItem);
      this.#cycleCache.clear();
    } else if (type === 'custom') {
      this.#handleCustomInsertion(newItem, smartQueue);
    }

    this.#syncRealTimeState(Date.now());
    this.emit('contentAdded', { type, data: structuredClone(newItem) });
  }

  /**
   * Schedules a modification to the base playlists, seamlessly breaking the timeline when activated.
   * @param {number} timestamp - Epoch timestamp in ms.
   * @param {'add'|'remove'|'move'} action - Action to perform.
   * @param {'music'|'voice'} type - Target list.
   * @param {ScheduledTaskPayload} payload - Data relative to the action.
   * @param {boolean} [smartQueue=true] - If true, delays the task execution until the end of the content playing at that timestamp.
   * @throws {TypeError} If arguments do not match the required types or action/type constraints.
   */
  scheduleTask(timestamp, action, type, payload, smartQueue = true) {
    checkDestroy(this.#destroyed);
    if (typeof timestamp !== 'number' || isNaN(timestamp))
      throw new TypeError('timestamp must be a valid number.');
    if (!['add', 'remove', 'move'].includes(action))
      throw new TypeError('action must be "add", "remove", or "move".');
    if (!['music', 'voice'].includes(type)) throw new TypeError('type must be "music" or "voice".');
    if (typeof smartQueue !== 'boolean') throw new TypeError('smartQueue must be a boolean.');

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
          'Payload for "add" must be a MediaContent object (id: string, duration: number).',
        );
      }
    } else if (action === 'remove') {
      if (typeof payload !== 'string')
        throw new TypeError('Payload for "remove" must be a string (the content ID).');
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

    let finalTimestamp = timestamp;

    // Smart Adjustment Logic (Smart Queue)
    if (smartQueue) {
      // Check if there's anything playing exactly on the requested timestamp
      const eventAtTime = this.#getEventAtTime(timestamp, timestamp);

      // If there is, we set the timing of the task to the exact fraction of milliseconds
      // in which this event ends before the next audio begins.
      if (eventAtTime) finalTimestamp = eventAtTime.absoluteEnd;
    }

    if (
      isJsonObject(payload) &&
      // @ts-ignore
      typeof payload.newIndex !== 'number'
    )
      // @ts-ignore
      valMediaContentMetadata(payload);
    /** @type {ScheduledTask} */
    const task = { timestamp: finalTimestamp, action, type, payload };
    this.#scheduledTasks.push(task);

    // Synchronize the state in real time. If the endTimestamp is in the future,
    // the task will remain securely pending without breaking the radio.
    this.#syncRealTimeState(Date.now());

    this.emit('taskScheduled', structuredClone(task));
  }

  /**
   * Removes content instantly by ID across all active lists, positions, and future tasks.
   * @param {string} id - The unique identifier of the content.
   * @throws {TypeError} If the id is not a string.
   */
  remove(id) {
    checkDestroy(this.#destroyed);
    if (typeof id !== 'string') throw new TypeError('id must be a string.');

    // Revoke Blob URLs of items being removed to free memory
    this.#musicList.filter((item) => item.id === id).forEach((item) => revokeContentUrls(item));
    this.#voiceList.filter((item) => item.id === id).forEach((item) => revokeContentUrls(item));
    this.#customPositions
      .filter((cp) => cp.content?.id === id)
      .forEach((cp) => revokeContentUrls(cp.content));

    /**
     * Filter function to match items against the provided ID.
     * @type {(item: any) => boolean}
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
        if (t.payload.id === id) {
          revokeContentUrls(/** @type {MediaContent} */ (t.payload));
          return false;
        }
        return true;
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
    checkDestroy(this.#destroyed);
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
    checkDestroy(this.#destroyed);
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
    checkDestroy(this.#destroyed);
    if (typeof limit !== 'number' || isNaN(limit))
      throw new TypeError('Invalid query limit value. Ensure it is a number.');
    if (limit > this.#config.queryLimit || limit <= 0)
      throw new RangeError(
        `Invalid query limit. Ensure it is > 0 and <= ${this.#config.queryLimit}.`,
      );

    /**
     * Virtual instance to sandbox the timeline prediction.
     * @type {TinyRadioFm}
     */
    const virtualSandbox = new TinyRadioFm(JSON.parse(this._exportState()));

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

    virtualSandbox.destroy(false);
    this.emit('timelineQueried', { targetDate, limit, resultCount: events.length });
    return events;
  }

  /**
   * Returns all active custom positions currently injected into the timeline.
   * @returns {CustomPosition[]} Shallow copy of custom positions array.
   */
  searchCustomPositions() {
    checkDestroy(this.#destroyed);
    this.#syncRealTimeState(Date.now());
    return [...this.#customPositions];
  }

  /**
   * Process a content list, waiting to convert the images and content URLs from Blob URL to Base64.
   * @param {MediaContent[]} list
   * @returns {Promise<MediaContent[]>}
   * @private
   */
  async _processListForExport(list) {
    return Promise.all(
      list.map(async (item) => {
        valMediaContentMetadata(item);
        const newItem = structuredClone(item);
        await this._rcblobUrlToBase64(newItem);
        return newItem;
      }),
    );
  }

  /**
   * Exports the complete state of the radio, including caches and scheduled tasks.
   * @returns {string} Stringified JSON state.
   * @private
   */
  _exportState() {
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
   * Exports the complete state of the radio, including caches and scheduled tasks.
   * @returns {Promise<string>} Stringified JSON state.
   */
  async exportState() {
    checkDestroy(this.#destroyed);
    const processedMusic = await this._processListForExport(this.#musicList);
    const processedVoice = await this._processListForExport(this.#voiceList);

    const processedCustom = await Promise.all(
      this.#customPositions.map(async (cp) => {
        const processedContent = await this._processListForExport([cp.content]);
        return { ...cp, content: processedContent[0] };
      }),
    );

    const processedTasks = await Promise.all(
      this.#scheduledTasks.map(async (task) => {
        if (
          task.action === 'add' &&
          task.payload &&
          typeof task.payload === 'object' &&
          'title' in task.payload
        ) {
          const processedPayload = await this._processListForExport([
            /** @type {MediaContent} */ (task.payload),
          ]);
          return { ...task, payload: processedPayload[0] };
        }
        return task;
      }),
    );

    return JSON.stringify({
      music: processedMusic,
      voice: processedVoice,
      custom: processedCustom,
      tasks: processedTasks,
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
    checkDestroy(this.#destroyed);
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
   * @returns {() => number} PRNG function returning a float between 0 and 1.
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
   * @param {MediaContent[]} list - The source list to sequence.
   * @param {number} currentSeed - Cycle-specific seed.
   * @param {RadioModes} mode - Processing mode.
   * @param {number} [minConsecutive=0] - Min times a track must repeat.
   * @param {number} [maxConsecutive=0] - Max times a track can repeat.
   * @param {string|null} [initialLastId=null] - Memory of the last played ID.
   * @param {number} [initialConsecutiveCount=0] - Memory of the consecutive count.
   * @returns {{ items: MediaContent[], lastId: string|null, consecutiveCount: number }}
   */
  #buildSequence(
    list,
    currentSeed,
    mode,
    minConsecutive = 0,
    maxConsecutive = 0,
    initialLastId = null,
    initialConsecutiveCount = 0,
  ) {
    if (list.length === 0) {
      return { items: [], lastId: initialLastId, consecutiveCount: initialConsecutiveCount };
    }

    if (mode !== 'random') {
      const items = [...list];
      const lastItem = items[items.length - 1];
      return {
        items,
        lastId: lastItem.id,
        consecutiveCount: initialLastId === lastItem.id ? initialConsecutiveCount + 1 : 1,
      };
    }

    const random = this._prng(currentSeed);

    /**
     * The finalized deterministic sequence.
     * @type {MediaContent[]}
     */
    const sequence = [];

    /** @type {string|null} */
    let lastId = initialLastId;
    let consecutiveCount = initialConsecutiveCount;

    // Initializes TinyAdvancedRaffle specifically for this sequence generation
    const raffle = new TinyAdvancedRaffle({
      rng: random,
      normalization: 'relative',
    });

    // We keep the pool as an array to respect the original structure and support possible
    // duplicate IDs, if they occur (even though it is rare).

    /** @type {MediaContent[]} */
    const pool = [...list];

    // Registers all items in the Raffle system
    pool.forEach((item) => {
      const itemWeight = item.weight ?? 1;
      const existing = raffle.getItem(item.id);
      if (!existing) {
        raffle.addItem(item.id, { weight: itemWeight });
      } else {
        // If the ID already exists, we add its weight to maintain the correct proportion
        raffle.setBaseWeight(item.id, existing.baseWeight + itemWeight);
      }
    });

    while (pool.length > 0) {
      /** @type {MediaContent|null} */
      let selectedItem = null;
      let selectedIndex = -1;

      // 1. Minimum repetition logic
      if (lastId !== null && consecutiveCount < minConsecutive) {
        selectedIndex = pool.findIndex((item) => item.id === lastId);

        if (selectedIndex !== -1) {
          selectedItem = pool[selectedIndex];
        } else if (sequence.length > 0) {
          // Duplicates the previous item without consuming from pool
          selectedItem = sequence[sequence.length - 1];
        }
      }

      // 2. Maximum repetition logic and drawing using the Raffle
      if (!selectedItem) {
        let excludedId = null;

        if (lastId !== null && maxConsecutive !== -1 && consecutiveCount >= maxConsecutive) {
          // Checks if there are other different items in the pool before preventing the last one
          const hasOtherItems = pool.some((item) => item.id !== lastId);
          if (hasOtherItems) {
            raffle.excludeItem(lastId);
            excludedId = lastId;
          }
        }

        const drawResult = raffle.drawOne();

        if (drawResult) {
          selectedIndex = pool.findIndex((item) => item.id === drawResult.id);
          if (selectedIndex !== -1) {
            selectedItem = pool[selectedIndex];
          }
        }

        // Removes the exclusion to avoid breaking future draws
        if (excludedId) {
          raffle.includeItem(excludedId);
        }
      }

      // Safety fallback
      if (!selectedItem) {
        selectedItem = pool[0];
        selectedIndex = 0;
      }

      sequence.push(selectedItem);

      // Updates the pool and the Raffle after the item has been drawn and used
      if (selectedIndex !== -1) {
        pool.splice(selectedIndex, 1);

        // If this item is no longer in the pool permanently, remove it from the Raffle
        const stillInPool = pool.some((item) => item.id === selectedItem.id);
        if (!stillInPool) {
          raffle.removeItem(selectedItem.id);
        } else {
          // If it still exists, we reduce the weight proportionally to continue the draw fairly
          const existing = raffle.getItem(selectedItem.id);
          if (existing) {
            const newWeight = Math.max(0, existing.baseWeight - (selectedItem.weight ?? 1));
            if (newWeight <= 0) raffle.removeItem(selectedItem.id);
            else raffle.setBaseWeight(selectedItem.id, newWeight);
          }
        }
      }

      if (selectedItem.id === lastId) {
        consecutiveCount++;
      } else {
        lastId = selectedItem.id;
        consecutiveCount = 1;
      }
    }

    raffle.destroy(); // Ensures memory is cleared at the end of each cycle

    return { items: sequence, lastId, consecutiveCount };
  }

  /**
   * Generates a structural block representing a single full cycle of the radio.
   * @param {number} loopIndex - The current cycle iteration to generate appropriate seeds.
   * @returns {CycleBlock} The generated cycle block containing sequenced items and total duration.
   */
  #buildCycleBlock(loopIndex) {
    const cycleSeed = this.#seed + loopIndex;
    const mixRandom = this._prng(cycleSeed * 10);

    // Initial memory state
    let initialLastMusicId = null;
    let initialMusicConsecutive = 0;
    let initialLastVoiceId = null;
    let initialVoiceConsecutive = 0;

    // Rescues memory from the previous block seamlessly
    if (loopIndex > 0) {
      const prevBlock = this.#cycleCache.get(loopIndex - 1);
      if (prevBlock) {
        initialLastMusicId = prevBlock.lastMusicId ?? null;
        initialMusicConsecutive = prevBlock.musicConsecutiveCount ?? 0;
        initialLastVoiceId = prevBlock.lastVoiceId ?? null;
        initialVoiceConsecutive = prevBlock.voiceConsecutiveCount ?? 0;
      }
    }

    const musicData = this.#buildSequence(
      this.#musicList,
      cycleSeed + 1,
      this.#config.mode,
      this.#config.musicMinConsecutive,
      this.#config.musicMaxConsecutive,
      initialLastMusicId,
      initialMusicConsecutive,
    );
    const musicSeq = musicData.items;

    const voiceData = this.#buildSequence(
      this.#voiceList,
      cycleSeed + 2,
      this.#config.voiceMode,
      this.#config.voiceMinConsecutive,
      this.#config.voiceMaxConsecutive,
      initialLastVoiceId,
      initialVoiceConsecutive,
    );
    const voiceSeq = voiceData.items;

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
        // Calculate chance based on weight: P = W / (W + 1)
        const voiceChance = this.#config.voiceWeight / (this.#config.voiceWeight + 1);

        // Only proceed if the random roll is less than the calculated chance
        if (mixRandom() < voiceChance) {
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
    }

    return {
      items: block,
      duration: cycleDuration,
      lastMusicId: musicData.lastId,
      musicConsecutiveCount: musicData.consecutiveCount,
      lastVoiceId: voiceData.lastId,
      voiceConsecutiveCount: voiceData.consecutiveCount,
    };
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
   * @param {CycleBlockData | MediaContent} item - Raw content data.
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
   * @param {MediaContent & { timestamp?: number }} data - Target data to insert.
   * @param {boolean} smartQueue - Adjusts the insertion to the end of the currently playing content.
   */
  #handleCustomInsertion(data, smartQueue) {
    let originalTarget = data.timestamp || Date.now();
    const duration = data.duration;

    if (smartQueue) {
      // Check what is playing at the exact moment of the originalTarget
      const eventAtTime = this.#getEventAtTime(originalTarget, originalTarget);

      // If there is any content playing (whether music, voice or even other custom),
      // we push the initial target to the exact millisecond where it ends.
      if (eventAtTime) originalTarget = eventAtTime.absoluteEnd;
    }

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
      originalTimestamp: data.timestamp || Date.now(),
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
      revokeContentUrls(cp.content); // Free memory!
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
            list.push(/** @type {MediaContent} */ (task.payload));
          } else if (task.action === 'remove') {
            const idx = list.findIndex((i) => i.id === task.payload);
            if (idx !== -1) {
              const [removedItem] = list.splice(idx, 1);
              revokeContentUrls(removedItem); // Free memory!
            }
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

    if (listsMutated) this.#cycleCache.clear();
  }

  /**
   * Hydrates class state from an exported JSON object.
   * @param {TinyRadioFmImport} data
   */
  #hydrate(data) {
    // Revoke current blob URLs before overwriting state to prevent memory leaks
    this.#musicList.forEach((item) => revokeContentUrls(item));
    this.#voiceList.forEach((item) => revokeContentUrls(item));
    this.#customPositions.forEach((cp) => revokeContentUrls(cp.content));
    this.#scheduledTasks.forEach((task) => {
      if (
        task.action === 'add' &&
        task.payload &&
        typeof task.payload === 'object' &&
        'title' in task.payload
      ) {
        revokeContentUrls(/** @type {MediaContent} */ (task.payload));
      }
    });

    const processListForImport = (/** @type {MediaContent[]} */ list) =>
      list.map((item) => {
        valMediaContentMetadata(item);
        const newItem = structuredClone(item);
        this._ccBase64ToBlobUrl(newItem);
        return newItem;
      });

    this.#musicList = processListForImport(data.music);
    this.#voiceList = processListForImport(data.voice);
    this.#seed = data.seed || 0;
    this.#anchorDate = data.anchorDate || Date.now();
    this.#config = { ...this.#config, ...(data.config || {}) };

    this.#customPositions = data.custom.map((cp) => ({
      ...cp,
      content: processListForImport([cp.content])[0],
    }));

    this.#scheduledTasks = data.tasks.map((task) => {
      if (
        task.action === 'add' &&
        task.payload &&
        typeof task.payload === 'object' &&
        'title' in task.payload
      ) {
        return {
          ...task,
          payload: processListForImport([/** @type {MediaContent} */ (task.payload)])[0],
        };
      }
      return task;
    });
  }

  /**
   * Destroys the radio instance, releasing all allocated memory (including Blob URLs)
   * and permanently cleaning all caches, lists and tasks.
   * @param {boolean} [destroyThumbs=true]
   */
  destroy(destroyThumbs = true) {
    if (this.#destroyed) return;

    if (destroyThumbs) {
      this.#musicList.forEach((item) => revokeContentUrls(item));
      this.#voiceList.forEach((item) => revokeContentUrls(item));
      this.#customPositions.forEach((cp) => revokeContentUrls(cp.content));
      this.#scheduledTasks.forEach((task) => {
        if (
          task.action === 'add' &&
          task.payload &&
          typeof task.payload === 'object' &&
          'title' in task.payload
        ) {
          revokeContentUrls(/** @type {MediaContent} */ (task.payload));
        }
      });
    }

    this.#musicList = [];
    this.#voiceList = [];
    this.#customPositions = [];
    this.#scheduledTasks = [];

    this.#cycleCache.clear();
    this.emit('destroyed', { timestamp: Date.now() });
    this.removeAllListeners();
    this.#destroyed = true;
  }
}

export default TinyRadioFm;
