import {
  blobUrlToBase64,
  convertToBlobUrl,
  prepareMediaContent,
  revokeContentUrls,
} from '../basics/mediaContent.mjs';
import TinyEvents from './TinyEvents.mjs';

/**
 * @typedef {import('../basics/mediaContent.mjs').MediaContentBase} MediaContentBase
 * @typedef {import('../basics/mediaContent.mjs').MediaContentMetadata} MediaContentMetadata
 * @typedef {import('../basics/mediaContent.mjs').MediaContent} MediaContent
 * @typedef {import('../basics/mediaContent.mjs').IPicture} IPicture
 * @typedef {import('../basics/mediaContent.mjs').MediaNumber} MediaNumber
 * @typedef {import('../basics/mediaContent.mjs').MediaLoadingError} MediaLoadingError
 * @typedef {import('../basics/mediaContent.mjs').MediaLoadingErrorData} MediaLoadingErrorData
 * @typedef {import('../basics/mediaContent.mjs').LoadingMediaProgress} LoadingMediaProgress
 * @typedef {import('../basics/mediaContent.mjs').ParseMediaContentMetadata} ParseMediaContentMetadata
 * @typedef {import('../basics/mediaContent.mjs').UnknownArtistGetter} UnknownArtistGetter
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
 * @property {number} voiceMin - Minimum amount of voice messages to play if voiceAfterMusic is true.
 * @property {number} voiceMax - Maximum amount of voice messages to play.
 * @property {number} musicMaxConsecutive - Max times a music track can repeat consecutively (-1 = unlimited, 0 = strictly no repetition).
 * @property {number} voiceMaxConsecutive - Max times a voice track can repeat consecutively (-1 = unlimited, 0 = strictly no repetition).
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
 * @extends TinyEvents
 * @beta
 */
class TinyRadioFm extends TinyEvents {
  /**
   * A Static Factory Method that prepares a MediaContent object by
   * extracting metadata from an audio source.
   *
   * @param {string | HTMLMediaElement} source - A URL string or an existing Audio object.
   * @param {Partial<MediaContentBase & MediaContentMetadata> & { id?: string; weight?: number }} [metadata={}] - Optional manual metadata that overrides automatic extraction.
   * @param {ParseMediaContentMetadata} [parseFile] - Private helper to interface with parseFile.
   * @param {Object} [callbacks={}] - Callbacks for monitoring the loading process.
   * @param {(progress: LoadingMediaProgress) => void} [callbacks.onProgress] - Callback triggered on stage changes.
   * @param {(error: MediaLoadingErrorData) => void} [callbacks.onError] - Callback triggered when a non-fatal or fatal error occurs.
   * @returns {Promise<MediaContent>} A promise that resolves to a valid MediaContent object.
   * @throws {MediaLoadingError} If the preparation process fails at any stage.
   */
  static async prepareContent(source, metadata, parseFile, callbacks) {
    return prepareMediaContent(source, metadata, parseFile, callbacks, TinyRadioFm.#unknownArtist);
  }

  /** @type {MediaContentMetadata} */
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
  /** @type {MediaContentMetadata} */
  static get contentTemplate() {
    return structuredClone(this.#contentTemplate);
  }

  get size() {
    return this.#musicList.length + this.#voiceList.length;
  }

  get musicSize() {
    return this.#musicList.length;
  }

  get voiceSize() {
    return this.#voiceList.length;
  }

  get customPosSize() {
    return this.#customPositions.length;
  }

  get tasksSize() {
    return this.#scheduledTasks.length;
  }

  get cycleCacheSize() {
    return this.#cycleCache.size;
  }

  /** @type {UnknownArtistGetter} */
  static #unknownArtist = 'Unknown Artist';

  static get unknownArtist() {
    return TinyRadioFm.#unknownArtist;
  }

  static set unknownArtist(value) {
    if (typeof value !== 'string' && typeof value !== 'function')
      throw new TypeError('unknownArtist must have an string or function.');
    TinyRadioFm.#unknownArtist = value;
  }

  /** @type {MediaContent[]} */
  #musicList = [];
  /** @returns {MediaContent[]} */
  get musicList() {
    return structuredClone(this.#musicList);
  }

  /** @type {MediaContent[]} */
  #voiceList = [];
  /** @returns {MediaContent[]} */
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
   * @returns {MediaContent[]} A cloned object of the cache.
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
      (typeof config.musicMaxConsecutive !== 'number' || config.musicMaxConsecutive < -1)
    ) {
      throw new TypeError('musicMaxConsecutive must be a number >= -1.');
    }

    if (
      config.voiceMaxConsecutive !== undefined &&
      (typeof config.voiceMaxConsecutive !== 'number' || config.voiceMaxConsecutive < -1)
    ) {
      throw new TypeError('voiceMaxConsecutive must be a number >= -1.');
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
   * @param {MediaContent & { timestamp?: number }} data - The content payload to insert.
   * @param {boolean} [smartQueue=true] - If true, delays insertion until the end of the content playing at that timestamp (only affects 'custom').
   * @throws {TypeError} If the type is invalid or the data lacks a valid ID and numerical duration.
   */
  add(type, data, smartQueue = true) {
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

    if (type === 'music') {
      this.#musicList.push(data);
      this.#cycleCache.clear();
    } else if (type === 'voice') {
      this.#voiceList.push(data);
      this.#cycleCache.clear();
    } else if (type === 'custom') {
      this.#handleCustomInsertion(data, smartQueue);
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
   * @param {boolean} [smartQueue=true] - If true, delays the task execution until the end of the content playing at that timestamp.
   * @throws {TypeError} If arguments do not match the required types or action/type constraints.
   */
  scheduleTask(timestamp, action, type, payload, smartQueue = true) {
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

    let finalTimestamp = timestamp;

    // Smart Adjustment Logic (Smart Queue)
    if (smartQueue) {
      // Check if there's anything playing exactly on the requested timestamp
      const eventAtTime = this.#getEventAtTime(timestamp, timestamp);

      // If there is, we set the timing of the task to the exact fraction of milliseconds
      // in which this event ends before the next audio begins.
      if (eventAtTime) {
        finalTimestamp = eventAtTime.absoluteEnd;
      }
    }

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
    if (typeof id !== 'string') throw new TypeError('id must be a string.');

    // Revoke Blob URLs of items being removed to free memory
    this.#musicList.filter((item) => item.id === id).forEach((item) => revokeContentUrls(item));
    this.#voiceList.filter((item) => item.id === id).forEach((item) => revokeContentUrls(item));
    this.#customPositions
      .filter((cp) => cp.content?.id === id)
      .forEach((cp) => revokeContentUrls(cp.content));

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
    this.#syncRealTimeState(Date.now());
    return [...this.#customPositions];
  }

  /**
   * Process a content list, waiting to convert the images from Blob URL to Base64.
   * @param {MediaContent[]} list
   * @returns {Promise<MediaContent[]>}
   * @private
   */
  async _processListForExport(list) {
    return Promise.all(
      list.map(async (item) => {
        const newItem = structuredClone(item);
        if (newItem.picture && Array.isArray(newItem.picture)) {
          newItem.picture = await Promise.all(
            newItem.picture.map(async (pic) => ({
              ...pic,
              data: await blobUrlToBase64(pic.data),
            })),
          );
        }
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
   * @param {MediaContent[]} list - The source list to sequence.
   * @param {number} currentSeed - Cycle-specific seed.
   * @param {RadioModes} mode - Processing mode.
   * @param {number} [maxConsecutive=0] - Max consecutive repetitions permitted (-1 = unlimited, 0 = strictly no repeat).
   * @returns {MediaContent[]} The generated sequence.
   */
  #buildSequence(list, currentSeed, mode, maxConsecutive = 0) {
    if (list.length === 0) return [];
    if (mode !== 'random') return [...list]; // Respects manual indexing/moving

    /**
     * Pool of available items for weighted selection.
     * @type {Array<MediaContent & { weight: number }>}
     */
    const pool = list.map((item) => ({ ...item, weight: item.weight ?? 1 }));
    const random = this._prng(currentSeed);

    /**
     * The finalized deterministic sequence.
     * @type {MediaContent[]}
     */
    const sequence = [];

    /** @type {string|null} */
    let lastId = null;
    let consecutiveCount = 0;

    while (pool.length > 0) {
      let validPool = pool;

      // If there is a restriction rule and the consecutive limit has been reached
      if (maxConsecutive !== -1 && lastId !== null && consecutiveCount > maxConsecutive) {
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
      /** @type {MediaContent|null} */
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

    const musicSeq = this.#buildSequence(
      this.#musicList,
      cycleSeed + 1,
      this.#config.mode,
      this.#config.musicMaxConsecutive,
    );
    const voiceSeq = this.#buildSequence(
      this.#voiceList,
      cycleSeed + 2,
      this.#config.voiceMode,
      this.#config.voiceMaxConsecutive,
    );

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
      if (eventAtTime) {
        originalTarget = eventAtTime.absoluteEnd;
      }
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
            const payloadId = /** @type {string} */ (task.payload);
            const idx = list.findIndex((i) => i.id === payloadId);
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

    if (listsMutated) {
      this.#cycleCache.clear();
    }
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

    const processListForImport = (/** @type {MediaContent[]} */ list) => {
      return list.map((item) => {
        const newItem = { ...item };
        if (newItem.picture && Array.isArray(newItem.picture)) {
          newItem.picture = newItem.picture.map((pic) => ({
            ...pic,
            data: convertToBlobUrl(pic.data, pic.format),
          }));
        }
        return newItem;
      });
    };

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
  }
}

export default TinyRadioFm;
