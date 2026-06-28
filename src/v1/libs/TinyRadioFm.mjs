import TinyEvents from './TinyEvents.mjs';

/**
 * @typedef {Object} RadioContentBase
 * @property {string} id - Unique identifier.
 * @property {string} title - Name of the track/message.
 * @property {string} artist - Artist or speaker name.
 * @property {number} duration - Duration in milliseconds.
 * @property {string} url - Source URL/Path.
 * @property {number} [weight=1] - Probability multiplier for random selection mode.
 */

/**
 * @typedef {Object} CustomPosition
 * @property {RadioContent} content - The audio/music content.
 * @property {number} intendedTimestamp - The absolute Date.now() target.
 * @property {number} originalTimestamp - The timestamp preserved for intelligent repositioning.
 */

/**
 * @typedef {Object} ScheduledMovePayload
 * @property {string} id - Content ID to move.
 * @property {number} newIndex - The target index in the playlist.
 */

/**
 * @typedef {RadioContent | string | ScheduledMovePayload} ScheduledTaskPayload
 */

/**
 * @typedef {Object} ScheduledTask
 * @property {number} timestamp - The absolute time to execute the action.
 * @property {'add'|'remove'|'move'} action - The type of modification.
 * @property {'music'|'voice'} type - Target playlist.
 * @property {ScheduledTaskPayload} payload - Data relative to the action.
 */

/**
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
 * @typedef {'playlist'|'random'} RadioModes
 */

/**
 * @typedef {Object} RadioConfig
 * @property {RadioModes} mode - Sequence mode for music.
 * @property {RadioModes} voiceMode - Sequence mode for voices.
 * @property {number} silenceDuration - Gap in ms between tracks.
 * @property {number} queryLimit - Safety lock for max items processed.
 * @property {boolean} voiceAfterMusic - Whether to play voice messages after music tracks.
 * @property {number} voiceMin - Minimum amount of voice messages to play if voiceAfterMusic is true.
 * @property {number} voiceMax - Maximum amount of voice messages to play.
 */

/**
 * @typedef {RadioContent & { cycleStart: number; cycleEnd: number; }} CycleBlockData
 */

/**
 * @typedef {Object} CycleBlock
 * @property {CycleBlockData[]} items - Items belonging to this cycle.
 * @property {number} duration - Total duration of the cycle block in ms.
 */

/**
 * @typedef {Object} CycleLocation
 * @property {CycleBlock} block - The located cycle block.
 * @property {number} startTimestamp - The absolute start time of this cycle.
 * @property {number} loopIndex - The specific loop iteration index.
 */

/**
 * @typedef {Object} TinyRadioFmImport
 * @property {RadioContent[]} music
 * @property {RadioContent[]} voice
 * @property {CustomPosition[]} custom
 * @property {ScheduledTask[]} tasks
 * @property {number} seed
 * @property {number} anchorDate
 * @property {RadioConfig} config
 */

/**
 * @typedef {Object} IPicture
 * @property {string} format - The MIME type of the image (e.g., 'image/jpeg').
 * @property {Uint8Array} data - The raw binary data of the image.
 * @property {string} [description] - An optional textual description of the image.
 * @property {string} [type] - The specific type of picture (e.g., 'cover', 'front', 'back').
 * @property {string} [name] - The filename associated with the image.
 */

/**
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
 * @param {Blob} data
 * @returns {Promise<{ common: Partial<ContentMetadata> }>}
 */

/**
 * A deterministic, seed-based radio management system with scheduled adaptations and weighted random generation.
 * @extends TinyEvents
 */
class TinyRadioFm extends TinyEvents {
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
        throw new Error('Invalid metadata: "common" property is missing or not an object.');

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
          throw new Error('Invalid metadata: "title" must be a string or null.');
        if (!isString(common.album))
          throw new Error('Invalid metadata: "album" must be a string or null.');
        if (!isString(common.albumartist))
          throw new Error('Invalid metadata: "albumartist" must be a string or null.');
        if (!isString(common.artist))
          throw new Error('Invalid metadata: "artist" must be a string or null.');
        if (!isNumber(common.year))
          throw new Error('Invalid metadata: "year" must be a number or null.');

        // Validate Arrays
        if (!isArray(common.albumartists))
          throw new Error('Invalid metadata: "albumartists" must be an array.');
        if (!isArray(common.genre)) throw new Error('Invalid metadata: "genre" must be an array.');
        if (!isArray(common.label)) throw new Error('Invalid metadata: "label" must be an array.');
        if (!isArray(common.composer))
          throw new Error('Invalid metadata: "composer" must be an array.');
        if (!isArray(common.artists))
          throw new Error('Invalid metadata: "artists" must be an array.');
        if (!isArray(common.picture))
          throw new Error('Invalid metadata: "picture" must be an array.');

        /**
         * Validate Nested Objects (Disk and Track)
         * @param {MusicNumber|null} [info]
         * @param {string} [name]
         */
        const validateTrackInfo = (info, name) => {
          if (info !== undefined && info !== null) {
            if (!(typeof info === 'object' && info !== null))
              throw new Error(`Invalid metadata: "${name}" must be an object.`);
            if (typeof info.no !== 'number' && info.no !== null)
              throw new Error(`Invalid metadata: "${name}.no" must be a number or null.`);
            if (typeof info.of !== 'number' && info.of !== null)
              throw new Error(`Invalid metadata: "${name}.of" must be a number or null.`);
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
   * @returns {Promise<RadioContent>} A promise that resolves to a valid RadioContent object.
   * @throws {Error} If the source is invalid or cannot be accessed.
   *
   * @example
   * // Usage with URL
   * const track = await TinyRadioFm.prepareContent('/assets/song.mp3', { title: 'My Song', artist: 'Artist' });
   * radio.add('music', track);
   *
   * @example
   * // Usage with Audio Object
   * const audio = new Audio();
   * audio.src = '/assets/song.mp3';
   * const track = await TinyRadioFm.prepareContent(audio);
   * radio.add('music', track);
   */
  static async prepareContent(
    source,
    metadata = {},
    parseFile = (url) => {
      return new Promise((resolve, reject) => reject(new Error('parseFile library not found.')));
    },
  ) {
    let audio;
    let url;

    // 1. Normalize Source
    if (typeof source === 'string') {
      url = source;
      audio = new Audio(url);
    } else if (source instanceof HTMLMediaElement) {
      audio = source;
      url = audio.src;
    } else {
      throw new Error('Invalid source type. Expected a URL string or an HTMLMediaElement.');
    }

    // 2. Wait for audio metadata to be available (Essential for duration)
    await new Promise((resolve, reject) => {
      // If already loaded, resolve immediately
      if (audio.readyState >= 1) resolve(undefined);
      else {
        audio.addEventListener('loadedmetadata', resolve, { once: true });
        audio.addEventListener(
          'error',
          () => reject(new Error(`Failed to load audio source: ${url}`)),
          { once: true },
        );
      }
    });

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
    if (!metadata.title || !metadata.artist) {
      try {
        extractedMetadata = await TinyRadioFm.extractId3Tags(url, parseFile);
      } catch (err) {
        // If extraction fails (e.g., library not loaded or no tags), we silently fall back to baseData
        console.error(err);
        console.warn(
          `[TinyRadioFm] Automatic metadata extraction failed for ${url}. Using defaults.`,
        );
      }
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
      ...extractedMetadata,
      ...metadata,
      // Explicitly ensure title and artist are resolved from the hierarchy
      title: metadata.title || extractedMetadata.title || getFallbackTitleFromUrl(url),
      artist: metadata.artist || extractedMetadata.artist || 'Unknown Artist',
    };

    return /** @type {RadioContent} */ (finalContent);
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

  /** @type {RadioContent[]} */
  #musicList = [];
  /** @type {RadioContent[]} */
  #voiceList = [];
  /** @type {CustomPosition[]} */
  #customPositions = [];
  /** @type {ScheduledTask[]} */
  #scheduledTasks = [];

  /** @type {number} */
  #seed = 0;
  /** @type {number} */
  #anchorDate = Date.now();

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
  };

  /** @type {Map<string, RadioContent & { cachedAt: number; }>} */
  #metadataCache = new Map();

  /**
   * Returns a deep clone of the internal metadata cache.
   * @returns {Record<string, RadioContent & { cachedAt: number; }>} A cloned object of the cache.
   */
  get metadataCache () {
    // Convert Map to Object and then perform a deep clone
    return structuredClone(Object.fromEntries(this.#metadataCache));
  }

  /**
   * Initializes the radio system.
   * @param {TinyRadioFmImport|null} [initialData=null] - JSON object to hydrate the radio state.
   * @param {number} [seed=0] - Initial seed for deterministic randomness.
   */
  constructor(initialData = null, seed = 0) {
    super();
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
   * @throws {Error} If the content lacks a valid ID or numerical duration.
   */
  add(type, data) {
    if (!data.id || typeof data.duration !== 'number') {
      throw new Error('Content must have an ID and a valid numerical duration in milliseconds.');
    }

    this.#cacheMetadata(data);

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
    this.emit('contentAdded', { type, data });
  }

  /**
   * Schedules a modification to the base playlists, seamlessly breaking the timeline when activated.
   * @param {number} timestamp - Epoch timestamp in ms.
   * @param {'add'|'remove'|'move'} action - Action to perform.
   * @param {'music'|'voice'} type - Target list.
   * @param {ScheduledTaskPayload} payload - The content, ID, or move configuration.
   */
  scheduleTask(timestamp, action, type, payload) {
    if (action === 'add' && typeof payload === 'object' && 'id' in payload) {
      this.#cacheMetadata(/** @type {RadioContent} */ (payload));
    }

    /** @type {ScheduledTask} */
    const task = { timestamp, action, type, payload };
    this.#scheduledTasks.push(task);
    this.#syncRealTimeState(Date.now());

    this.emit('taskScheduled', task);
  }

  /**
   * Removes content instantly by ID across all active lists, positions, and future tasks.
   * @param {string} id - The unique identifier of the content.
   */
  remove(id) {
    /**
     * Filter function to match items against the provided ID.
     * @type {function(any): boolean}
     */
    const filterFn = (item) => item.id !== id && item.content?.id !== id;

    this.#musicList = this.#musicList.filter(filterFn);
    this.#voiceList = this.#voiceList.filter(filterFn);
    this.#customPositions = this.#customPositions.filter(filterFn);

    this.#scheduledTasks = this.#scheduledTasks.filter((t) => {
      if (t.action === 'add' && typeof t.payload === 'object' && 'id' in t.payload) {
        return t.payload.id !== id;
      }
      return t.payload !== id;
    });

    // Clean up metadata cache when content is removed
    this.#metadataCache.delete(id);
    this.#cycleCache.clear();
    this.emit('contentRemoved', { id });
  }

  /**
   * Sets the core randomness seed and clears the current cycle cache.
   * @param {number} seed - The new seed.
   */
  setSeed(seed) {
    this.#seed = seed;
    this.#cycleCache.clear();
    this.emit('seedChanged', { seed });
  }

  /**
   * Configures radio modes and playback limits.
   * @param {Partial<RadioConfig>} config - The configuration overrides.
   */
  setConfig(config) {
    this.#config = { ...this.#config, ...config };
    this.#cycleCache.clear();
    this.emit('configChanged', { config: this.#config });
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
   * @throws {Error} If the limit exceeds the configured queryLimit or is invalid.
   */
  queryTimeline(targetDate, limit = 10) {
    if (limit > this.#config.queryLimit || limit <= 0 || isNaN(limit)) {
      throw new Error(`Invalid query limit. Ensure it is > 0 and <= ${this.#config.queryLimit}.`);
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
   * @param {string|TinyRadioFmImport} json - JSON state.
   */
  importState(json) {
    /** @type {TinyRadioFmImport} */
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    this.#hydrate(data);
    this.emit('stateImported', { data });
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
   * @returns {RadioContent[]} The generated sequence.
   */
  #buildSequence(list, currentSeed, mode) {
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

    while (pool.length > 0) {
      const totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);

      // Safety catch if all weights are 0
      if (totalWeight <= 0) {
        sequence.push(...pool);
        break;
      }

      const r = random() * totalWeight;
      let sum = 0;

      for (let i = 0; i < pool.length; i++) {
        sum += pool[i].weight;
        if (r <= sum) {
          sequence.push(pool[i]);
          pool.splice(i, 1);
          break;
        }
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

    const musicSeq = this.#buildSequence(this.#musicList, cycleSeed + 1, this.#config.mode);
    const voiceSeq = this.#buildSequence(this.#voiceList, cycleSeed + 2, this.#config.voiceMode);

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
      // Remove from metadata cache when custom position expires
      this.#metadataCache.delete(cp.content.id);
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
          this.emit('taskExecuted', task);
        });
    }

    if (listsMutated) {
      this.#cycleCache.clear();
    }
  }

  /**
   * Caches track metadata internally.
   * @param {RadioContent} data - Content configuration.
   */
  #cacheMetadata(data) {
    this.#metadataCache.set(data.id, { ...data, cachedAt: Date.now() });
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
