/**
 * @fileoverview Concrete loader for images. Exposes cache detection, aspect
 * ratio helpers, full control over the decode step, and advanced animation parsing.
 */
import TinyMediaLoader from '../TinyMediaLoader.mjs';
import TinyImageProbe from '../probe/TinyImageProbe.mjs';

const EMPTY_GIF = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

/**
 * A reference to the early decoder type used for extracting metadata from raw bytes.
 * @typedef {import('../TinyMediaLoader.mjs').MediaEarlyDecoder} MediaEarlyDecoder
 */

/**
 * @typedef {Object} AnimationFrame
 * @property {string} url - The Object URL of the single-frame blob.
 * @property {string} cacheKey - The unique key used in TinyMediaCache.
 */

/**
 * @typedef {Object} AnimationScriptStep
 * @property {number} delay - Duration of the frame in milliseconds.
 */

/**
 * @typedef {Object} ImageLoaderOptions
 * @property {string} [src] - The image source URL.
 * @property {number} [timeout] - Maximum time in milliseconds before the load is aborted.
 * @property {string|null} [crossOrigin] - The CORS mode applied to the image.
 * @property {'sync'|'async'|'auto'} [decoding] - The decoding hint passed to the browser.
 * @property {HTMLImageElement|null} [element] - An existing DOM element to adopt.
 * @property {boolean} [earlyDecode] - Whether to decode the dimensions from the response headers using WebCodecs.
 * @property {boolean} [progressive] - Whether to show the image progressively while streaming (default true).
 * @property {boolean} [autoReload] - Whether an external `src` change triggers a reload.
 * @property {boolean} [stream] - Whether to download the image through fetch for byte progress.
 * @property {boolean} [useHeadRequest] - Whether to perform a HEAD request to fetch HTTP headers before downloading.
 * @property {import('../utils/TinyMediaCache.mjs').default|null} [cache] - An optional shared memory cache.
 * @property {'none'|'native'|'script-only'|'controlled'} [animationControl] - How animated images are handled.
 */

/**
 * Reads the ISOBMFF boxes that live between two offsets.
 * @param {Uint8Array} bytes - The full file buffer.
 * @param {number} start - The offset of the first box.
 * @param {number} end - The offset after the last box.
 * @returns {Array<{ type: string, start: number, dataStart: number, dataEnd: number, end: number }>} The parsed box headers.
 */
function readIsoBoxes(bytes, start, end) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const result = [];
  let offset = start;
  while (offset + 8 <= end) {
    let size = view.getUint32(offset);
    const type = String.fromCharCode(
      bytes[offset + 4],
      bytes[offset + 5],
      bytes[offset + 6],
      bytes[offset + 7],
    );
    let headerSize = 8;
    if (size === 1) {
      if (offset + 16 > end) break;
      size = view.getUint32(offset + 8) * 0x100000000 + view.getUint32(offset + 12);
      headerSize = 16;
    } else if (size === 0) {
      size = end - offset;
    }
    if (size < headerSize || offset + size > end) break;
    result.push({
      type,
      start: offset,
      dataStart: offset + headerSize,
      dataEnd: offset + size,
      end: offset + size,
    });
    offset += size;
  }
  return result;
}

/**
 * Concatenates a list of byte arrays into a single buffer.
 * @param {Uint8Array<ArrayBuffer>[]} chunks - The chunks to join.
 * @returns {Uint8Array<ArrayBuffer>} The concatenated bytes.
 */
function concatBytes(chunks) {
  let length = 0;
  for (const chunk of chunks) length += chunk.length;
  const out = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

/**
 * Encodes an ASCII string as a byte array.
 * @param {string} value - The ASCII string.
 * @returns {Uint8Array<ArrayBuffer>} The encoded bytes.
 */
function asciiBytes(value) {
  const out = new Uint8Array(value.length);
  for (let i = 0; i < value.length; i += 1) out[i] = value.charCodeAt(i);
  return out;
}

/**
 * Encodes a big-endian unsigned 16-bit integer.
 * @param {number} value - The value to encode.
 * @returns {Uint8Array<ArrayBuffer>} The encoded bytes.
 */
function u16be(value) {
  return new Uint8Array([(value >> 8) & 0xff, value & 0xff]);
}

/**
 * Encodes a big-endian unsigned 32-bit integer.
 * @param {number} value - The value to encode.
 * @returns {Uint8Array<ArrayBuffer>} The encoded bytes.
 */
function u32be(value) {
  return new Uint8Array([
    (value >>> 24) & 0xff,
    (value >>> 16) & 0xff,
    (value >>> 8) & 0xff,
    value & 0xff,
  ]);
}

/**
 * Serializes an ISOBMFF box from its type and payload chunks.
 * @param {string} type - The 4-character box type.
 * @param {...Uint8Array<ArrayBuffer>} chunks - The payload chunks.
 * @returns {Uint8Array<ArrayBuffer>} The serialized box.
 */
function buildIsoBox(type, ...chunks) {
  const payload = concatBytes(chunks);
  const out = new Uint8Array(8 + payload.length);
  out.set(u32be(out.length), 0);
  out.set(asciiBytes(type), 4);
  out.set(payload, 8);
  return out;
}

/**
 * Wraps a raw AV1 sample into a self-contained single-frame AVIF file.
 * @param {Uint8Array<ArrayBuffer>} av1c - The raw `av1C` configuration box.
 * @param {number} width - The frame width in pixels.
 * @param {number} height - The frame height in pixels.
 * @param {Uint8Array<ArrayBuffer>} frame - The raw AV1 sample payload.
 * @returns {Uint8Array<ArrayBuffer>} A valid single-frame AVIF file.
 */
function buildAvifFrame(av1c, width, height, frame) {
  const ftyp = buildIsoBox(
    'ftyp',
    asciiBytes('avif'),
    u32be(0),
    asciiBytes('avif'),
    asciiBytes('mif1'),
    asciiBytes('miaf'),
  );
  /** @param {number} dataOffset */
  const buildMeta = (dataOffset) => {
    const hdlr = buildIsoBox(
      'hdlr',
      u32be(0),
      u32be(0),
      asciiBytes('pict'),
      u32be(0),
      u32be(0),
      u32be(0),
      new Uint8Array([0]),
    );
    const pitm = buildIsoBox('pitm', u32be(0), u16be(1));
    const iloc = buildIsoBox(
      'iloc',
      u32be(0),
      new Uint8Array([0x44, 0x00]),
      u16be(1),
      u16be(1),
      u16be(0),
      u16be(1),
      u32be(dataOffset),
      u32be(frame.length),
    );
    const infe = buildIsoBox(
      'infe',
      u32be(0x02000000),
      u16be(1),
      u16be(0),
      asciiBytes('av01'),
      new Uint8Array([0]),
    );
    const iinf = buildIsoBox('iinf', u32be(0), u16be(1), infe);
    const ispe = buildIsoBox('ispe', u32be(0), u32be(width), u32be(height));
    const ipco = buildIsoBox('ipco', av1c, ispe);
    const ipma = buildIsoBox('ipma', u32be(0), u32be(1), u16be(1), new Uint8Array([2, 0x81, 0x02]));
    const iprp = buildIsoBox('iprp', ipco, ipma);
    return buildIsoBox('meta', u32be(0), hdlr, pitm, iloc, iinf, iprp);
  };
  const placeholder = buildMeta(0);
  const dataOffset = ftyp.length + placeholder.length + 8;
  const meta = buildMeta(dataOffset);
  const mdat = buildIsoBox('mdat', frame);
  return concatBytes([ftyp, meta, mdat]);
}

/**
 * Loads a single image with full lifecycle and animation control.
 * @extends {TinyMediaLoader<HTMLImageElement>}
 */
class TinyImageLoader extends TinyMediaLoader {
  /**
   * Retrieves the tag name used to create the underlying element.
   * @returns {string} The uppercase tag name, always `'IMG'`.
   */
  static get tagName() {
    return 'IMG';
  }

  /** @type {HTMLImageElement|null} */
  #image;
  /** @type {string|null} */
  #crossOrigin;
  /** @type {'sync'|'async'|'auto'} */
  #decoding;
  /** @type {boolean} */
  #stream;

  // --- Animation Control State ---
  /** @type {'none'|'native'|'script-only'|'controlled'} */
  #animationControl;
  /** @type {AnimationFrame[]} */
  #frames = [];
  /** @type {AnimationScriptStep[]} */
  #animationScript = [];
  /** @type {boolean} */
  #isFrozen = false;
  /** @type {boolean} */
  #isPlaying = true;
  /** @type {number} */
  #playbackRate = 1.0;
  /** @type {number} */
  #currentFrameIndex = 0;
  /** @type {ReturnType<typeof setTimeout>|null} */
  #playbackTimer = null;
  /** @type {string|null} */
  #originalAnimatedUrl = null;

  /**
   * Creates a new image loader and validates the provided options.
   * @param {ImageLoaderOptions} [options] - The loader configuration.
   * @throws {TypeError} If `crossOrigin` is not a string or null.
   * @throws {TypeError} If `decoding` is not a string.
   */
  constructor(options = {}) {
    if (
      options.element !== null &&
      options.element !== undefined &&
      !(options.element instanceof HTMLImageElement)
    ) {
      throw new TypeError('The "element" option must be an HTMLImageElement or null.');
    }
    super({ useHeadRequest: false, ...options });

    const {
      crossOrigin = null,
      decoding = 'async',
      stream = false,
      animationControl = 'none',
    } = options;

    if (crossOrigin !== null && typeof crossOrigin !== 'string') {
      throw new TypeError('The "crossOrigin" option must be a string or null.');
    }
    if (typeof decoding !== 'string') {
      throw new TypeError('The "decoding" option must be a string.');
    }

    this.#crossOrigin = crossOrigin;
    this.#decoding = decoding;
    this.#image = null;
    this.#animationControl = animationControl;

    // To extract blobs and scripts, we MUST stream the bytes.
    this.#stream = this.#animationControl !== 'none' ? true : Boolean(stream);

    this._insertDecoder('image', (mime) => {
      const probe = new TinyImageProbe(mime);
      return {
        write: (chunk) => {
          const size = probe.push(chunk);
          if (size) this._emitMetadata(size, 'PROBE');
        },
        close: () => {
          // When the download/stream ends, we call finalize()
          // to collect all accumulated animation metadata.
          const animationData = probe.finalize();
          // Emits advanced information (frames, loopCount, duration)
          if (animationData) this._emitMetadata(animationData, 'PROBE_ANIMATION');
          probe.close();
        },
      };
    });
  }

  /**
   * The underlying `<img>` element.
   * @returns {HTMLImageElement|null} The current image element, or `null` before the load starts.
   */
  get image() {
    return this.#image;
  }

  /**
   * Indicates whether the image is downloaded through fetch for byte-level progress.
   * @returns {boolean} `true` when streaming is enabled, otherwise `false`.
   */
  get stream() {
    return this.#stream;
  }

  /**
   * The intrinsic width of the image in pixels.
   * @returns {number} The intrinsic width in pixels.
   */
  get naturalWidth() {
    return this.#image?.naturalWidth ?? 0;
  }

  /**
   * The intrinsic height of the image in pixels.
   * @returns {number} The intrinsic height in pixels.
   */
  get naturalHeight() {
    return this.#image?.naturalHeight ?? 0;
  }

  /**
   * The aspect ratio of the image (width / height).
   * @returns {number} The width divided by the height, or 0 when unknown.
   */
  get aspectRatio() {
    const height = this.naturalHeight;
    return height === 0 ? 0 : this.naturalWidth / height;
  }

  // --- Advanced Animation API ---

  /**
   * Freezes the animation. In native mode, falls back to the static 1st frame blob.
   * @param {number|null} [frameIndex] - Frame index to freeze on (controlled mode only).
   */
  freeze(frameIndex = null) {
    if (this.#animationControl === 'none' || this.#animationControl === 'script-only') return;
    this.#isFrozen = true;
    if (this.#animationControl === 'native' && this.#frames.length > 0) {
      const url = this.#frames[0].url;
      if (this.#image) {
        this._setInternalSrc(url);
        this.#image.src = url;
      }
    } else if (this.#animationControl === 'controlled') {
      this.pause();
      if (frameIndex !== null && frameIndex >= 0 && frameIndex < this.#frames.length) {
        this.#currentFrameIndex = frameIndex;
      }
      if (this.#image && this.#frames[this.#currentFrameIndex]) {
        const url = this.#frames[this.#currentFrameIndex].url;
        this._setInternalSrc(url);
        this.#image.src = url;
      }
    }
  }

  /**
   * Unfreezes and resumes the animation.
   */
  unfreeze() {
    if (this.#animationControl === 'none' || this.#animationControl === 'script-only') return;
    this.#isFrozen = false;
    if (this.#animationControl === 'native') {
      if (this.#image && this.#originalAnimatedUrl) {
        this._setInternalSrc(this.#originalAnimatedUrl);
        this.#image.src = this.#originalAnimatedUrl;
      }
    } else if (this.#animationControl === 'controlled') {
      this.play();
    }
  }

  /**
   * Plays the animation (controlled mode only).
   */
  play() {
    if (this.#animationControl !== 'controlled') return;
    if (this.#playbackTimer) return;
    this.#isPlaying = true;
    this.#isFrozen = false;
    this.#playLoop();
  }

  /**
   * Pauses the animation (controlled mode only).
   */
  pause() {
    if (this.#animationControl !== 'controlled') return;
    this.#isPlaying = false;
    if (this.#playbackTimer) {
      clearTimeout(this.#playbackTimer);
      this.#playbackTimer = null;
    }
  }

  /**
   * Gets or sets the playback speed modifier.
   * @type {number}
   */
  get playbackRate() {
    return this.#playbackRate;
  }
  set playbackRate(value) {
    if (this.#animationControl !== 'controlled') return;
    this.#playbackRate = Math.max(0.1, Number(value) || 1);
  }

  /**
   * Gets a deep copy of the current animation script or replaces it to modify behavior.
   * @type {AnimationScriptStep[]}
   */
  get animationScript() {
    return JSON.parse(JSON.stringify(this.#animationScript));
  }
  set animationScript(script) {
    if (this.#animationControl !== 'controlled') {
      throw new Error('Animation script editing is only available in controlled mode.');
    }
    this.#animationScript = Array.isArray(script) ? script : [];
  }

  // --- Core Lifecycle ---

  /**
   * Resolves the target element, wires the load listeners and decodes the image.
   * @protected
   * @returns {Promise<void>} A promise that resolves once the image is decoded and ready.
   */
  async _startLoad() {
    const image = /** @type {HTMLImageElement} */ (this._resolveElement());
    this.#image = image;

    if (this.#crossOrigin) image.crossOrigin = this.#crossOrigin;
    image.decoding = this.#decoding;

    // Resets the state machine attributes strictly prior to load guarantees so `EMPTY_GIF` sizes
    // from a previously aborted fetch never mislead our `ready` completion conditions.
    image.removeAttribute('src');
    this._flushMutations();

    let ready;
    if (this.#stream) {
      ready = await this.#streamInto(image);
    } else {
      ready = this._waitForMedia(image, 'load');
      image.src = this.src;
      this._flushMutations();
    }

    await ready;

    if (typeof image.decode === 'function') {
      try {
        await image.decode();
      } catch {
        // A decode failure is non-fatal: the image is still renderable.
      }
    }
  }

  /**
   * Downloads the image through fetch, emitting byte-level progress.
   * Updates the image source progressively during the stream.
   * @param {HTMLImageElement} image - The target image element.
   * @returns {Promise<Promise<void>>} A promise resolving to the final ready event load listener.
   * @throws {Error} If the network request fails.
   */
  async #streamInto(image) {
    const cached = this._acquireFromCache();
    if (cached) {
      this.emit('cachehit', cached);
      this._setInternalSrc(cached.objectUrl);
      this.#originalAnimatedUrl = cached.objectUrl;

      // Se a imagem for animada e o controle não for 'none', precisamos popular this.#frames.
      // Mesmo que seja 'native', precisamos do primeiro frame para a função freeze().
      if (
        this.#animationControl !== 'none' &&
        cached.metadata?.animation &&
        this.#frames.length === 0
      ) {
        // Processamos o buffer da cache. O método #extractGifFrames cuidará de
        // reutilizar URLs existentes ou adicionar novos frames à cache.
        await this.#parseAnimationFromBuffer(await cached.blob.arrayBuffer());
      }

      if (this.#animationControl === 'controlled') {
        this.#originalAnimatedUrl = null;
        this.play();
        return Promise.resolve();
      }

      const ready = this._waitForMedia(image, 'load');
      image.src = cached.objectUrl;
      this._flushMutations();
      return ready;
    }

    let lastUpdate = performance.now();
    /** @type {string|null} */
    let previousUrl = null;

    try {
      const blob = await this._downloadStream(this.src, (_, chunks) => {
        if (this.progressive && this.#animationControl !== 'controlled') {
          const now = performance.now();
          // Update visual image every 500ms to avoid thrashing CPU
          if (now - lastUpdate > 500) {
            lastUpdate = now;
            const currentBlob = new Blob(chunks, { type: this.metadata.type || 'image/jpeg' });
            const tempUrl = URL.createObjectURL(currentBlob);
            if (previousUrl) URL.revokeObjectURL(previousUrl);
            previousUrl = tempUrl;

            // Explicitly marks the temporary URL as internal so the MutationObserver
            // ignores it and keeps the original source URL for the cache engine.
            this._setInternalSrc(tempUrl);
            image.src = tempUrl;
            this._flushMutations();
          }
        }
      });

      // Extração de script e frames usando arrayBuffer sem utilizar a tag Canvas
      if (this.#animationControl !== 'none' && this.metadata.animation) {
        await this.#parseAnimationFromBuffer(await blob.arrayBuffer());
      }

      const url = this._cacheBlob(blob);
      this._setInternalSrc(url);

      if (this.#animationControl === 'controlled') {
        this.#originalAnimatedUrl = null;
        this.play();
        return Promise.resolve(); // Fake load ready, control loop assumes rendering
      }

      this.#originalAnimatedUrl = url;
      const ready = this._waitForMedia(image, 'load');
      image.src = url;
      this._flushMutations();
      return ready;
    } finally {
      if (previousUrl) URL.revokeObjectURL(previousUrl);
    }
  }

  // --- Animation Binary Slicer (Canvas-Free) ---

  /**
   * @param {ArrayBuffer} arrayBuffer
   */
  async #parseAnimationFromBuffer(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    const mime = this.metadata.type;

    if (mime === 'image/gif') {
      this.#extractGifFrames(bytes);
    } else if (mime === 'image/webp') {
      this.#extractWebpFrames(bytes);
    } else if (mime === 'image/png' || mime === 'image/apng') {
      this.#extractApngFrames(bytes);
    } else if (mime === 'image/avif') {
      this.#extractAvifFrames(bytes);
    }
  }

  /**
   * Calculates the CRC-32 checksum for a given byte array.
   * @param {Uint8Array} bytes
   * @returns {number}
   */
  #crc32(bytes) {
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
      c ^= bytes[i];
      for (let j = 0; j < 8; j++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  /**
   * Slices an AVIF binary into multiple valid single-frame AVIF blobs.
   * @param {Uint8Array} bytes - The full AVIF file.
   * @returns {void}
   */
  #extractAvifFrames(bytes) {
    const top = readIsoBoxes(bytes, 0, bytes.length);
    const moov = top.find((box) => box.type === 'moov');
    if (!moov) return;

    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const traks = readIsoBoxes(bytes, moov.dataStart, moov.dataEnd).filter(
      (box) => box.type === 'trak',
    );

    /** @type {{ stbl: { dataStart: number, dataEnd: number }, timescale: number }|null} */
    let track = null;
    for (const trak of traks) {
      const mdia = readIsoBoxes(bytes, trak.dataStart, trak.dataEnd).find((b) => b.type === 'mdia');
      if (!mdia) continue;
      const minf = readIsoBoxes(bytes, mdia.dataStart, mdia.dataEnd).find((b) => b.type === 'minf');
      if (!minf) continue;
      const stbl = readIsoBoxes(bytes, minf.dataStart, minf.dataEnd).find((b) => b.type === 'stbl');
      if (!stbl) continue;
      const mdhd = readIsoBoxes(bytes, mdia.dataStart, mdia.dataEnd).find((b) => b.type === 'mdhd');
      let timescale = 1000;
      if (mdhd) {
        const version = bytes[mdhd.dataStart];
        timescale =
          version === 1 ? view.getUint32(mdhd.dataStart + 20) : view.getUint32(mdhd.dataStart + 12);
      }
      track = { stbl, timescale };
      break;
    }
    if (!track) return;

    const children = readIsoBoxes(bytes, track.stbl.dataStart, track.stbl.dataEnd);
    const stszBox = children.find((b) => b.type === 'stsz');
    const stcoBox = children.find((b) => b.type === 'stco');
    const co64Box = children.find((b) => b.type === 'co64');
    const stscBox = children.find((b) => b.type === 'stsc');
    const sttsBox = children.find((b) => b.type === 'stts');
    const stsdBox = children.find((b) => b.type === 'stsd');
    if (!stszBox || !stscBox || !stsdBox) return;

    const sampleSizes = [];
    {
      const base = stszBox.dataStart + 4;
      const uniform = view.getUint32(base);
      const count = view.getUint32(base + 4);
      for (let i = 0; i < count; i += 1) {
        sampleSizes.push(uniform > 0 ? uniform : view.getUint32(base + 8 + i * 4));
      }
    }

    const chunkOffsets = [];
    if (stcoBox) {
      const count = view.getUint32(stcoBox.dataStart + 4);
      for (let i = 0; i < count; i += 1) {
        chunkOffsets.push(view.getUint32(stcoBox.dataStart + 8 + i * 4));
      }
    } else if (co64Box) {
      const count = view.getUint32(co64Box.dataStart + 4);
      for (let i = 0; i < count; i += 1) {
        const high = view.getUint32(co64Box.dataStart + 8 + i * 8);
        const low = view.getUint32(co64Box.dataStart + 12 + i * 8);
        chunkOffsets.push(high * 0x100000000 + low);
      }
    }

    const stsc = [];
    {
      const count = view.getUint32(stscBox.dataStart + 4);
      for (let i = 0; i < count; i += 1) {
        const base = stscBox.dataStart + 8 + i * 12;
        stsc.push({
          firstChunk: view.getUint32(base),
          samplesPerChunk: view.getUint32(base + 4),
        });
      }
    }

    const sampleDurations = [];
    if (sttsBox) {
      const count = view.getUint32(sttsBox.dataStart + 4);
      for (let i = 0; i < count; i += 1) {
        const base = sttsBox.dataStart + 8 + i * 8;
        const entryCount = view.getUint32(base);
        const delta = view.getUint32(base + 4);
        for (let j = 0; j < entryCount; j += 1) sampleDurations.push(delta);
      }
    }

    const sampleOffsets = [];
    {
      let sampleIndex = 0;
      for (let i = 0; i < stsc.length; i += 1) {
        const { firstChunk, samplesPerChunk } = stsc[i];
        const lastChunk = i + 1 < stsc.length ? stsc[i + 1].firstChunk - 1 : chunkOffsets.length;
        for (let chunk = firstChunk; chunk <= lastChunk; chunk += 1) {
          let offset = chunkOffsets[chunk - 1] ?? 0;
          for (let s = 0; s < samplesPerChunk; s += 1) {
            sampleOffsets.push(offset);
            offset += sampleSizes[sampleIndex] ?? 0;
            sampleIndex += 1;
          }
        }
      }
    }

    const entries = readIsoBoxes(bytes, stsdBox.dataStart + 8, stsdBox.dataEnd);
    const sampleEntry = entries[0];
    if (!sampleEntry) return;
    const width = view.getUint16(sampleEntry.dataStart + 24);
    const height = view.getUint16(sampleEntry.dataStart + 26);
    const entryChildren = readIsoBoxes(bytes, sampleEntry.dataStart + 78, sampleEntry.dataEnd);
    const av1cBox = entryChildren.find((b) => b.type === 'av1C');
    if (!av1cBox) return;
    const av1c = bytes.subarray(av1cBox.start, av1cBox.end);

    const frameCount = Math.min(sampleSizes.length, sampleOffsets.length);
    for (let i = 0; i < frameCount; i += 1) {
      const size = sampleSizes[i];
      const offset = sampleOffsets[i];
      const duration = sampleDurations[i] ?? 0;
      let delay = track.timescale > 0 ? Math.round((duration / track.timescale) * 1000) : 100;
      if (delay <= 10) delay = 100;
      this.#animationScript.push({ delay });

      if (this.#animationControl !== 'script-only') {
        const cacheKey = `${this.src}???frame=${this.#frames.length}`;
        let url = null;

        if (this.cache) {
          const existing = this.cache.get(cacheKey);
          if (existing) {
            url = existing.objectUrl;
            this.cache.acquire(cacheKey);
          }
        }

        if (!url) {
          const frameData = bytes.subarray(offset, offset + size);
          /** @type {BlobPart} */
          const file = buildAvifFrame(av1c, width, height, frameData);
          const blob = new Blob([file], { type: 'image/avif' });

          if (this.cache) {
            const entry = this.cache.set(cacheKey, blob, false);
            this.cache.acquire(cacheKey);
            url = entry.objectUrl;
          } else {
            url = URL.createObjectURL(blob);
          }
        }
        this.#frames.push({ url, cacheKey });
      }

      if (this.#animationControl === 'native') break;
    }
  }

  /**
   * Slices a WebP binary into multiple valid single-frame WebP blobs.
   * @param {Uint8Array<ArrayBuffer>} bytes
   */
  #extractWebpFrames(bytes) {
    if (bytes.length < 12) return;
    let offset = 12;

    let vp8x = null;
    let anim = null;
    const preDataChunks = [];
    const frames = [];

    while (offset + 8 <= bytes.length) {
      const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 8);
      const fourcc = String.fromCharCode(
        bytes[offset],
        bytes[offset + 1],
        bytes[offset + 2],
        bytes[offset + 3],
      );
      const size = view.getUint32(4, true);
      const payloadEnd = offset + 8 + size + (size % 2);

      if (payloadEnd > bytes.length) break;

      const chunkBytes = bytes.subarray(offset, payloadEnd);

      if (fourcc === 'VP8X') {
        vp8x = chunkBytes;
      } else if (fourcc === 'ANIM') {
        anim = chunkBytes;
      } else if (fourcc === 'ANMF') {
        const payload = offset + 8;
        const dur = bytes[payload + 12] | (bytes[payload + 13] << 8) | (bytes[payload + 14] << 16);
        frames.push({ chunk: chunkBytes, delay: dur });
      } else {
        if (!frames.length && fourcc !== 'VP8 ' && fourcc !== 'VP8L') {
          preDataChunks.push(chunkBytes);
        }
      }

      offset = payloadEnd;
    }

    if (frames.length === 0) return;

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      let delay = frame.delay;
      if (delay <= 10) delay = 100;
      this.#animationScript.push({ delay });

      if (this.#animationControl !== 'script-only') {
        const cacheKey = `${this.src}???frame=${this.#frames.length}`;
        let url = null;

        if (this.cache) {
          const existing = this.cache.get(cacheKey);
          if (existing) {
            url = existing.objectUrl;
            this.cache.acquire(cacheKey);
          }
        }

        if (!url) {
          /** @type {Uint8Array<ArrayBuffer>[]} */
          const outChunks = [];
          if (vp8x) outChunks.push(vp8x);
          if (anim) outChunks.push(anim);
          for (const chunk of preDataChunks) outChunks.push(chunk);
          outChunks.push(frame.chunk);

          let totalPayloadSize = 4;
          for (const c of outChunks) totalPayloadSize += c.length;

          const riffHeader = new Uint8Array(12);
          const riffView = new DataView(riffHeader.buffer);
          riffHeader.set([0x52, 0x49, 0x46, 0x46], 0);
          riffView.setUint32(4, totalPayloadSize, true);
          riffHeader.set([0x57, 0x45, 0x42, 0x50], 8);

          const blob = new Blob([riffHeader, ...outChunks], { type: 'image/webp' });

          if (this.cache) {
            const entry = this.cache.set(cacheKey, blob, false);
            this.cache.acquire(cacheKey);
            url = entry.objectUrl;
          } else {
            url = URL.createObjectURL(blob);
          }
        }
        this.#frames.push({ url, cacheKey });
      }

      if (this.#animationControl === 'native') break;
    }
  }

  /**
   * Slices an APNG binary into multiple valid single-frame APNG blobs.
   * @param {Uint8Array} bytes
   */
  #extractApngFrames(bytes) {
    const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    if (bytes.length < 8) return;

    let offset = 8;
    const preDataChunks = [];
    let iend = null;
    const frames = [];
    /** @type {null|{ fctl: Uint8Array<ArrayBufferLike>; delay: number; dataChunks: ({ type: string, bytes: Uint8Array<ArrayBufferLike> })[] }} */
    let currentFrame = null;
    let seenIdatOrFctl = false;

    while (offset + 8 <= bytes.length) {
      const view = new DataView(bytes.buffer, bytes.byteOffset + offset, 8);
      const size = view.getUint32(0);
      const type = String.fromCharCode(
        bytes[offset + 4],
        bytes[offset + 5],
        bytes[offset + 6],
        bytes[offset + 7],
      );
      const chunkEnd = offset + 12 + size;

      if (chunkEnd > bytes.length) break;

      const chunkBytes = bytes.subarray(offset, chunkEnd);

      if (type === 'acTL') {
        // Skip original global animation controller
      } else if (type === 'fcTL') {
        seenIdatOrFctl = true;
        if (currentFrame) frames.push(currentFrame);
        const fcTLView = new DataView(bytes.buffer, bytes.byteOffset + offset + 8, 26);
        const delayNum = fcTLView.getUint16(20);
        const delayDen = fcTLView.getUint16(22) || 100;
        const delay = delayDen === 0 ? 100 : Math.round((delayNum / delayDen) * 1000);
        currentFrame = { fctl: chunkBytes, dataChunks: [], delay };
      } else if (type === 'IDAT') {
        seenIdatOrFctl = true;
        if (currentFrame) {
          currentFrame.dataChunks.push({ type: 'IDAT', bytes: chunkBytes });
        }
      } else if (type === 'fdAT') {
        seenIdatOrFctl = true;
        if (currentFrame) {
          currentFrame.dataChunks.push({ type: 'fdAT', bytes: chunkBytes });
        }
      } else if (type === 'IEND') {
        iend = chunkBytes;
        break;
      } else {
        if (!seenIdatOrFctl) {
          preDataChunks.push(chunkBytes);
        }
      }

      offset = chunkEnd;
    }

    if (currentFrame) frames.push(currentFrame);
    if (frames.length === 0) return;

    for (let i = 0; i < frames.length; i++) {
      const frame = frames[i];
      let delay = frame.delay;
      if (delay <= 10) delay = 100;
      this.#animationScript.push({ delay });

      if (this.#animationControl !== 'script-only') {
        const cacheKey = `${this.src}???frame=${this.#frames.length}`;
        let url = null;

        if (this.cache) {
          const existing = this.cache.get(cacheKey);
          if (existing) {
            url = existing.objectUrl;
            this.cache.acquire(cacheKey);
          }
        }

        if (!url) {
          let seq = 0;

          // Force a new 1-frame animation controller for this chunk
          const acTL = new Uint8Array(20);
          const acTLView = new DataView(acTL.buffer);
          acTLView.setUint32(0, 8);
          acTL.set([0x61, 0x63, 0x54, 0x4c], 4);
          acTLView.setUint32(8, 1);
          acTLView.setUint32(12, 0);
          acTLView.setUint32(16, this.#crc32(acTL.subarray(4, 16)));

          const fctl = new Uint8Array(frame.fctl);
          const fctlView = new DataView(fctl.buffer);
          fctlView.setUint32(8, seq++);
          fctlView.setUint32(fctl.length - 4, this.#crc32(fctl.subarray(4, fctl.length - 4)));

          /** @type {Uint8Array<ArrayBufferLike>[]} */
          const outChunks = [new Uint8Array(signature), ...preDataChunks, acTL, fctl];

          for (const chunk of frame.dataChunks) {
            if (chunk.type === 'IDAT') {
              outChunks.push(chunk.bytes);
            } else if (chunk.type === 'fdAT') {
              // Convert fdAT to standard IDAT by removing sequence number
              const idatChunk = new Uint8Array(chunk.bytes.length - 4);
              const idatView = new DataView(idatChunk.buffer);
              idatView.setUint32(0, chunk.bytes.length - 16);
              idatChunk.set([0x49, 0x44, 0x41, 0x54], 4);
              idatChunk.set(chunk.bytes.subarray(12, chunk.bytes.length - 4), 8);
              idatView.setUint32(
                idatChunk.length - 4,
                this.#crc32(idatChunk.subarray(4, idatChunk.length - 4)),
              );
              outChunks.push(idatChunk);
            }
          }

          if (iend) outChunks.push(iend);

          const blob = new Blob(outChunks, { type: 'image/apng' });

          if (this.cache) {
            const entry = this.cache.set(cacheKey, blob, false);
            this.cache.acquire(cacheKey);
            url = entry.objectUrl;
          } else {
            url = URL.createObjectURL(blob);
          }
        }
        this.#frames.push({ url, cacheKey });
      }

      if (this.#animationControl === 'native') break;
    }
  }

  /**
   * Slices a GIF binary into multiple valid single-frame GIF blobs.
   * @param {Uint8Array} bytes
   */
  #extractGifFrames(bytes) {
    if (bytes.length < 13) return;

    let offset = 13;
    const packed = bytes[10];
    const hasGCT = packed & 0x80;
    const gctSize = hasGCT ? 3 * (1 << ((packed & 0x07) + 1)) : 0;
    offset += gctSize;

    // Cabeçalho global + Paleta de Cores (usado de base para todos os frames)
    const globalHeader = bytes.subarray(0, offset);

    let gce = null;
    let delay = 100;

    while (offset < bytes.length) {
      const block = bytes[offset];
      if (block === 0x3b) break; // Trailer de fim do GIF

      if (block === 0x21) {
        const ext = bytes[offset + 1];
        if (ext === 0xf9) {
          // Graphic Control Extension (Possui o Delay)
          gce = bytes.subarray(offset, offset + 8);
          delay = (bytes[offset + 4] | (bytes[offset + 5] << 8)) * 10;
          if (delay <= 10) delay = 100; // Correção para delays muito rápidos
        }
        // Pular blocos de dados
        offset += 2;
        while (offset < bytes.length && bytes[offset] !== 0) {
          offset += bytes[offset] + 1;
        }
        offset++;
      } else if (block === 0x2c) {
        // Image Descriptor
        const imgStart = offset;
        offset += 10;
        const localPacked = bytes[offset - 1];
        if (localPacked & 0x80) {
          offset += 3 * (1 << ((localPacked & 0x07) + 1)); // LCT Local
        }
        offset++; // LZW Min Code

        while (offset < bytes.length && bytes[offset] !== 0) {
          offset += bytes[offset] + 1;
        }
        offset++;
        const imgEnd = offset;

        // Registrar o script de tempo
        this.#animationScript.push({ delay });

        if (this.#animationControl !== 'script-only') {
          const cacheKey = `${this.src}???frame=${this.#frames.length}`;
          let url = null;

          // 1. Tenta recuperar o frame existente da cache para evitar duplicatas
          if (this.cache) {
            const existing = this.cache.get(cacheKey);
            if (existing) {
              url = existing.objectUrl;
              this.cache.acquire(cacheKey);
            }
          }

          // 2. Se não existir na cache, cria o Blob e armazena
          if (!url) {
            const frameBytes = new Uint8Array(
              globalHeader.length + (gce ? gce.length : 0) + (imgEnd - imgStart) + 1,
            );
            frameBytes.set(globalHeader, 0);
            let cursor = globalHeader.length;
            if (gce) {
              frameBytes.set(gce, cursor);
              cursor += gce.length;
            }
            frameBytes.set(bytes.subarray(imgStart, imgEnd), cursor);
            frameBytes[frameBytes.length - 1] = 0x3b;

            const blob = new Blob([frameBytes], { type: 'image/gif' });
            if (this.cache) {
              const entry = this.cache.set(cacheKey, blob, false);
              this.cache.acquire(cacheKey);
              url = entry.objectUrl;
            } else {
              url = URL.createObjectURL(blob);
            }
          }

          this.#frames.push({ url, cacheKey });
        }

        // Em modo Nativo, nós só precisamos fatiar o Primeiro frame para a função de freeze
        if (this.#animationControl === 'native') break;
        gce = null;
      } else {
        break; // Bloco desconhecido, evita loops
      }
    }
  }

  /**
   * Executes the manual animation loop.
   */
  #playLoop() {
    if (!this.#isPlaying || this.#isFrozen || !this.#image || this.#frames.length === 0) return;
    const frame = this.#frames[this.#currentFrameIndex];
    const scriptStep = this.#animationScript[this.#currentFrameIndex];
    const delay = (scriptStep?.delay || 100) / this.#playbackRate;

    this._setInternalSrc(frame.url);
    this.#image.src = frame.url;
    this._flushMutations();

    this.#playbackTimer = setTimeout(() => {
      this.#currentFrameIndex = (this.#currentFrameIndex + 1) % this.#frames.length;
      this.#playLoop();
    }, delay);
  }

  // --- Overrides ---

  /**
   * Builds the metadata descriptor for the loaded image.
   * @protected
   * @returns {import('../TinyMediaLoader.mjs').MediaMetadataDetails} The image metadata details.
   */
  _getMetadataDetails() {
    const image = this.#image;
    return {
      type: image?.naturalWidth ? `image/${this.#getExtension()}` : 'image/*',
      width: image?.naturalWidth ?? 0,
      height: image?.naturalHeight ?? 0,
      duration: NaN,
      size: this._getResourceSize(),
    };
  }

  /**
   * Aborts the fetch gracefully allowing a retry process to spin up safely on the same element instance without
   * triggering stale asynchronous cache responses.
   * @protected
   * @returns {void}
   */
  _abort() {
    super._abort();
    if (this.#image) {
      this.#image.src = EMPTY_GIF;
      this._flushMutations();
    }
  }

  /**
   * Releases all acquired animation frames from the cache or revokes their object URLs.
   * @protected
   * @returns {void}
   */
  _releaseAnimationFrames() {
    for (const frame of this.#frames) {
      if (this.cache) {
        this.cache.release(frame.cacheKey);
      } else {
        URL.revokeObjectURL(frame.url);
      }
    }

    this.#frames = [];
    this.#animationScript = [];
    this.#currentFrameIndex = 0;
  }

  /**
   * Detaches the load handlers, revokes the object URL and clears the source of the image element.
   * @protected
   * @returns {void} This method does not return a value.
   */
  _cleanup() {
    this._revokeObjectUrl();
    this.pause();

    // Utiliza o método auxiliar para limpar a cache de frames
    this._releaseAnimationFrames();

    this.#originalAnimatedUrl = null;

    if (this.#image) {
      this.#image.onload = null;
      this.#image.onerror = null;
      this.#image.removeAttribute('src');
      this.#image.src = EMPTY_GIF;
      this._flushMutations();
    }
  }

  /**
   * Creates the `<img>` element used by the loader.
   * @protected
   * @returns {HTMLImageElement} A new, detached image element.
   */
  _createElement() {
    return document.createElement('img');
  }

  /**
   * Extracts the lowercase file extension from the image source.
   * @returns {string} The file extension without a dot, or `'png'` when none is found.
   */
  #getExtension() {
    const clean = this.src.split('?')[0].split('#')[0];
    const dot = clean.lastIndexOf('.');
    return dot === -1 ? 'png' : clean.slice(dot + 1).toLowerCase();
  }
}

export default TinyImageLoader;
