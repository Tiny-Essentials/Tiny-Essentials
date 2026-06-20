/**
 * @typedef {Object} RadioContent
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
 * @typedef {Object} ScheduledTask
 * @property {number} timestamp - The absolute time to execute the action.
 * @property {'add'|'remove'|'move'} action - The type of modification.
 * @property {'music'|'voice'} type - Target playlist.
 * @property {any} payload - Data relative to the action (RadioContent, id, or move config).
 */

/**
 * @typedef {Object} RadioEvent
 * @property {string} id - Content ID.
 * @property {string} title - Content title.
 * @property {string} artist - Content artist.
 * @property {number} duration - Total duration of the event.
 * @property {number} start - Start timestamp within the cycle.
 * @property {number} end - End timestamp within the cycle.
 * @property {number} elapsedTime - How many ms have passed since the event started.
 * @property {number} remainingTime - How many ms are left until the event ends.
 * @property {number} progress - Percentage of completion (0 to 1).
 * @property {boolean} isCustom - Whether this is a user-defined position.
 */

/**
 * @typedef {Object} RadioConfig
 * @property {'playlist'|'random'} mode - Sequence mode for music.
 * @property {'playlist'|'random'} voiceMode - Sequence mode for voices.
 * @property {number} silenceDuration - Gap in ms between tracks.
 * @property {number} queryLimit - Safety lock for max items processed.
 * @property {boolean} voiceAfterMusic - Whether to play voice messages after music tracks.
 * @property {number} voiceMin - Minimum amount of voice messages to play if voiceAfterMusic is true.
 * @property {number} voiceMax - Maximum amount of voice messages to play.
 */

/**
 * A deterministic, seed-based radio management system with scheduled adaptations and weighted random generation.
 */
class TinyRadioFm {
  #musicList = [];
  #voiceList = [];
  #customPositions = [];
  #scheduledTasks = [];
  #seed = 0;
  #anchorDate = Date.now();
  #cycleCache = new Map();

  /** @type {RadioConfig} */
  #config = {
    mode: 'playlist', // 'playlist' | 'random'
    voiceMode: 'playlist',
    silenceDuration: 0,
    queryLimit: 100000, // Safety lock
    voiceAfterMusic: true,
    voiceMin: 0,
    voiceMax: 1,
  };
  #metadataCache = new Map();

  /**
   * @param {Object|null} initialData - JSON object to initialize the radio.
   * @param {number} [seed=0] - Initial seed for randomness.
   */
  constructor(initialData = null, seed = 0) {
    this.#seed = seed;

    /**
     * @inner
     * Bootstraps the application state ensuring determinism based on the anchor.
     */
    if (initialData) {
      this.#hydrate(initialData);
    } else {
      this.#anchorDate = Date.now();
    }
  }

  // --- PUBLIC API ---

  /**
   * Adds new content instantly to the radio sequence.
   * @param {'music'|'voice'|'custom'} type
   * @param {Object} data
   */
  add(type, data) {
    if (!data.id || !data.duration || typeof data.duration !== 'number') {
      throw new Error('Content must have an ID and a valid numerical duration in milliseconds.');
    }

    this.#cacheMetadata(data);

    if (type === 'music') {
      this.#musicList.push(data);
      this.#clearCaches();
    } else if (type === 'voice') {
      this.#voiceList.push(data);
      this.#clearCaches();
    } else if (type === 'custom') {
      this.#handleCustomInsertion(data);
    }

    this.#syncRealTimeState(Date.now());
  }

  /**
   * Schedules a modification to the base playlists, breaking the timeline seamlessly when activated.
   * @param {number} timestamp - Epoch timestamp in ms.
   * @param {'add'|'remove'|'move'} action
   * @param {'music'|'voice'} type
   * @param {RadioContent | string | { id: string, newIndex: number }} payload
   */
  scheduleTask(timestamp, action, type, payload) {
    if (action === 'add' && payload.id) {
      this.#cacheMetadata(payload);
    }

    this.#scheduledTasks.push({ timestamp, action, type, payload });
    this.#syncRealTimeState(Date.now());
  }

  /**
   * Removes content instantly by ID across all active lists and tasks.
   * @param {string} id
   */
  remove(id) {
    const filterFn = (item) => item.id !== id || (item.content && item.content.id !== id);
    this.#musicList = this.#musicList.filter(filterFn);
    this.#voiceList = this.#voiceList.filter(filterFn);
    this.#customPositions = this.#customPositions.filter(filterFn);

    // Also remove from future pending tasks
    this.#scheduledTasks = this.#scheduledTasks.filter(
      (t) => !(t.action === 'add' && t.payload.id === id),
    );
    this.#clearCaches();
  }

  /**
   * Sets the core randomness seed.
   * @param {number} seed
   */
  setSeed(seed) {
    this.#seed = seed;
    this.#clearCaches();
  }

  /**
   * Configures radio modes and limits.
   * @param {Partial<RadioConfig>} config
   */
  setConfig(config) {
    this.#config = { ...this.#config, ...config };
    this.#clearCaches();
  }

  /**
   * Retrieves the exact event playing right now.
   * @returns {Object|null}
   */
  getCurrentEvent() {
    const now = Date.now();
    this.#syncRealTimeState(now);
    return this.#getEventAtTime(now, now);
  }

  /**
   * Queries the timeline from a specific date forward.
   * Uses a virtual clone to predict scheduled tasks correctly.
   * @param {number} targetDate
   * @param {number} [limit=10]
   * @returns {Array<Object>}
   */
  queryTimeline(targetDate, limit = 10) {
    if (limit > this.#config.queryLimit || limit <= 0 || isNaN(limit)) {
      throw new Error(`Invalid query limit. Ensure it is > 0 and <= ${this.#config.queryLimit}.`);
    }

    /**
     * @inner
     * @description Clones the radio to a sandbox to predict future mutations without destroying the real present.
     */
    const virtualSandbox = new TinyRadioFm(JSON.parse(this.exportState()));
    const events = [];
    let currentTimeWalker = targetDate;

    for (let i = 0; i < limit; i++) {
      virtualSandbox.#syncRealTimeState(currentTimeWalker);
      const nextEvent = virtualSandbox.#resolveNextEvent(currentTimeWalker, targetDate);
      if (!nextEvent) break;

      events.push(nextEvent);
      currentTimeWalker = nextEvent.absoluteEnd;
    }

    return events;
  }

  /**
   * Returns all active custom positions.
   * @returns {Array<Object>}
   */
  searchCustomPositions() {
    this.#syncRealTimeState(Date.now());
    return [...this.#customPositions];
  }

  /**
   * Exports the complete state (including tasks) for sharing.
   * @returns {string}
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
   * Imports a state.
   * @param {string} json
   */
  importState(json) {
    const data = JSON.parse(json);
    this.#hydrate(data);
  }

  // --- PRIVATE LOGIC ---

  /**
   * Invalidate timeline caches if lists or configs mutate.
   */
  #clearCaches() {
    this.#cycleCache.clear();
  }

  /**
   * Mulberry32 PRNG.
   * @param {number} seed
   * @returns {function(): number}
   */
  #prng(seed) {
    return function () {
      let t = (seed += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * Creates a deterministic sequence supporting weighted selection.
   * @param {any[]} list
   * @param {number} currentSeed
   * @param {string} mode
   */
  #buildSequence(list, currentSeed, mode) {
    if (list.length === 0) return [];

    if (mode !== 'random') {
      return [...list]; // Respects manual indexing/moving
    }

    /**
     * @inner
     * @description Weighted Random Selection algorithm ensuring determinism via PRNG.
     */
    const sequence = [];
    const pool = list.map((item) => ({ ...item, weight: item.weight ?? 1 }));
    const random = this.#prng(currentSeed);

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
   * Generates a block, utilizing loopIndex to apply the `+1` seed rule per cycle.
   * @param {number} loopIndex
   * @returns {Object}
   */
  #buildCycleBlock(loopIndex) {
    const cycleSeed = this.#seed + loopIndex;
    const mixRandom = this.#prng(cycleSeed * 10);

    const musicSeq = this.#buildSequence(this.#musicList, cycleSeed + 1, this.#config.mode);
    const voiceSeq = this.#buildSequence(this.#voiceList, cycleSeed + 2, this.#config.voiceMode);

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
   * Fast-forwards to find the exact cycle containing the target timestamp.
   * @param {number} targetAbsoluteTime
   * @returns {Object|null} { block, startTimestamp, loopIndex }
   */
  #locateCycleForTime(targetAbsoluteTime) {
    if (this.#musicList.length === 0) return null;

    let walkerAnchor = this.#anchorDate;
    let loopIdx = 0;

    while (true) {
      if (loopIdx > this.#config.queryLimit)
        throw new Error('Safety limit hit during cycle location.');

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
   * Orchestrates the overlap checking and finds the closest next event.
   * @param {number} walkerTime
   * @param {number} originalTargetDate
   */
  #resolveNextEvent(walkerTime, originalTargetDate) {
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

    if (customEvent.absoluteStart < baseEvent.absoluteEnd) {
      baseEvent.absoluteEnd = customEvent.absoluteStart;
      baseEvent.duration = baseEvent.absoluteEnd - baseEvent.absoluteStart;
      baseEvent.remainingTime = Math.max(0, baseEvent.absoluteEnd - originalTargetDate);
      baseEvent.progress = Math.min(1, baseEvent.elapsedTime / baseEvent.duration);
    }

    return baseEvent;
  }

  /**
   * Resolves the next base loop event from a given time.
   * @param {number} walkerTime
   * @param {number} originalTargetDate
   */
  #getNextBaseEvent(walkerTime, originalTargetDate) {
    let cycleInfo = this.#locateCycleForTime(walkerTime);
    if (!cycleInfo) return null;

    const { block, startTimestamp } = cycleInfo;
    const cycleCurrentTime = walkerTime - startTimestamp;

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
   * The magic formula to resolve what plays at an exact absolute timestamp.
   * @param {number} absoluteTime
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
   * Formats the raw data into a readable event structure.
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
   * Intelligently finds the absolute closest spatial gap to preserving the original metadata.
   */
  #handleCustomInsertion(data) {
    const originalTarget = data.timestamp || Date.now();
    const duration = data.duration;

    const activeCps = [...this.#customPositions].sort(
      (a, b) => a.intendedTimestamp - b.intendedTimestamp,
    );

    let bestSlot = originalTarget;
    let hasOverlap = activeCps.some(
      (cp) =>
        originalTarget < cp.intendedTimestamp + cp.content.duration &&
        originalTarget + duration > cp.intendedTimestamp,
    );

    if (hasOverlap) {
      const now = Date.now();
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
   * Synchronizes timeline mutations and scheduled tasks up to a given time boundary.
   * @param {number} boundaryTime
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
    });

    /**
     * @inner
     * @description Applies scheduled modifications intelligently, establishing new anchor epochs to prevent timeline corruption.
     */
    if (pendingTasks.length > 0) {
      pendingTasks
        .sort((a, b) => a.timestamp - b.timestamp)
        .forEach((task) => {
          const list = task.type === 'music' ? this.#musicList : this.#voiceList;

          if (task.action === 'add') {
            list.push(task.payload);
          } else if (task.action === 'remove') {
            const idx = list.findIndex((i) => i.id === task.payload);
            if (idx !== -1) list.splice(idx, 1);
          } else if (task.action === 'move') {
            const idx = list.findIndex((i) => i.id === task.payload.id);
            if (idx !== -1) {
              const [item] = list.splice(idx, 1);
              list.splice(task.payload.newIndex, 0, item);
            }
          }

          this.#anchorDate = task.timestamp;
          this.#seed += 1; // Adapt timeline
          listsMutated = true;
        });
    }

    if (listsMutated) {
      this.#clearCaches();
    }
  }

  async #cacheMetadata(data) {
    this.#metadataCache.set(data.id, { ...data, cachedAt: Date.now() });
  }

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
