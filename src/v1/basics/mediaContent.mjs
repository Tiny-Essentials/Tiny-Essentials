/**
 * A type representing either a static string or a function that returns a string, used to resolve an unknown artist's name.
 * @typedef {string|(() => string)} UnknownArtistGetter
 */

/**
 * Represents the data type for images, which can be raw binary (Uint8Array) or a string (such as a Blob URL or Data URL).
 * @typedef {Uint8Array|string} PictureDataType
 */

/**
 * Represents an image attachment template.
 * @template {PictureDataType} PictureData
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
 * @typedef {Object} IComment
 * @property {string|null} descriptor - A descriptor for the comment.
 * @property {string|null} language - The language of the comment.
 * @property {string|null} text - The text content of the comment.
 */

/**
 * @typedef {Object} ILyricsText
 * @property {string} text - The lyric text content.
 * @property {number|null} timestamp - The timestamp associated with this lyric line.
 */

/**
 * @typedef {Object} TimestampFormat
 * @property {number} notSynchronized - Indicates if the timestamp is not synchronized.
 * @property {number} mpegFrameNumber - The MPEG frame number.
 * @property {number} milliseconds - The time in milliseconds.
 */

/**
 * @typedef {Object} LyricsContentType
 * @property {number} other - Content type for other.
 * @property {number} lyrics - Content type for lyrics.
 * @property {number} text - Content type for text.
 * @property {number} movement_part - Content type for movement parts.
 * @property {number} events - Content type for events.
 * @property {number} chord - Content type for chords.
 * @property {number} trivia_pop - Content type for trivia/pop.
 */

/**
 * @typedef {Object} ILyricsTag
 * @property {string|null} text - The text content of the lyrics.
 * @property {ILyricsText[]} syncText - An array of synchronized lyric text objects.
 * @property {TimestampFormat} timeStampFormat - The format of the timestamp.
 * @property {LyricsContentType} contentType - The type of lyrical content.
 */

/**
 * @typedef {Object} IRating
 * @property {string|null} source - The source of the rating.
 * @property {number|null} rating - The numeric rating value.
 */

/**
 * This metadata structure is modeled template.
 *
 * @template {IPictureTemplate<PictureDataType>} IPictureContent
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
 * @property {IPictureContent[]} picture - An array of picture objects containing album art.
 * @property {string|null} date - The date.
 * @property {string|null} originaldate - The original date.
 * @property {number|null} originalyear - The original release year.
 * @property {string|null} releasedate - The release date.
 * @property {IComment[]} comment - An array of comments.
 * @property {ILyricsTag[]} lyrics - An array of lyric tags.
 * @property {string|null} albumsort - The sortable album name.
 * @property {string|null} titlesort - The sortable title.
 * @property {string|null} work - The work/composition name.
 * @property {string|null} artistsort - The sortable artist name.
 * @property {string|null} albumartistsort - The sortable album artist name.
 * @property {string|null} composersort - The sortable composer name.
 * @property {string[]} lyricist - An array of lyricists.
 * @property {string[]} writer - An array of writers.
 * @property {string[]} conductor - An array of conductors.
 * @property {string[]} remixer - An array of remixers.
 * @property {string[]} arranger - An array of arrangers.
 * @property {string[]} engineer - An array of engineers.
 * @property {string[]} publisher - An array of publishers.
 * @property {string[]} producer - An array of producers.
 * @property {string[]} djmixer - An array of DJ mixers.
 * @property {string[]} mixer - An array of mixers.
 * @property {string[]} technician - An array of technicians.
 * @property {string|null} grouping - The grouping name.
 * @property {string[]} subtitle - An array of subtitles.
 * @property {string[]} description - An array of descriptions.
 * @property {string|null} longDescription - A long description.
 * @property {string[]} discsubtitle - An array of disc subtitles.
 * @property {string|null} totaltracks - Total number of tracks.
 * @property {string|null} totaldiscs - Total number of discs.
 * @property {number|null} movementTotal - Total number of movements.
 * @property {boolean|null} compilation - Whether it is a compilation.
 * @property {IRating[]} rating - An array of ratings.
 * @property {number|null} bpm - Beats per minute.
 * @property {string|null} mood - The mood of the track.
 * @property {string|null} media - The media type.
 * @property {string[]} catalognumber - An array of catalog numbers.
 * @property {string|null} tvShow - The TV show name.
 * @property {string|null} tvShowSort - The sortable TV show name.
 * @property {number|null} tvSeason - The TV season number.
 * @property {number|null} tvEpisode - The TV episode number.
 * @property {string|null} tvEpisodeId - The TV episode ID.
 * @property {string|null} tvNetwork - The TV network.
 * @property {boolean|null} podcast - Whether it is a podcast.
 * @property {string|null} podcasturl - The podcast URL.
 * @property {string|null} releasestatus - The release status.
 * @property {string[]} releasetype - An array of release types.
 * @property {string|null} releasecountry - The release country.
 * @property {string|null} script - The script.
 * @property {string|null} language - The language.
 * @property {string|null} copyright - The copyright information.
 * @property {string|null} license - The license information.
 * @property {string|null} encodedby - The encoder.
 * @property {string|null} encodersettings - The encoder settings.
 * @property {boolean|null} gapless - Whether it is gapless.
 * @property {string|null} barcode - The barcode.
 * @property {string[]} isrc - An array of ISRC codes.
 * @property {string|null} asin - The ASIN.
 * @property {string|null} website - The website.
 * @property {string[]} performer_instrument - An array of performers and their instruments.
 * @property {number|null} averageLevel - The average loudness level.
 * @property {number|null} peakLevel - The peak loudness level.
 * @property {string[]} notes - An array of notes.
 * @property {string|null} originalalbum - The original album.
 * @property {string|null} originalartist - The original artist.
 * @property {string|null} key - The initial key of the music in the file, e.g. "A Minor".
 * @property {string[]} category - An array of categories.
 * @property {number|null} hdVideo - HD video flag.
 * @property {string[]} keywords - An array of keywords.
 * @property {string|null} movement - The movement.
 * @property {MediaNumber} movementIndex - The movement index.
 * @property {string|null} podcastId - The podcast ID.
 * @property {boolean|null} showMovement - Whether to show movement.
 * @property {number|null} stik - The stik value.
 * @property {number|null} playCounter - The play counter.
 */

/**
 * @typedef {Object} MediaContentFetchNativeData
 * @property {string} id - The unique identifier for the native data.
 * @property {any|Record<string|number|symbol, unknown>} [value] - The actual data value.
 */

/**
 * A record containing common metadata tags.
 * @template {PictureDataType} PictureData
 * @typedef {Record<string|number|symbol, unknown> & Partial<ContentMetadataTemplate<IPictureTemplate<PictureData>>>} ICommonTagsResult
 */

/**
 * A mapping of keys to arrays of native metadata fetch data.
 * @typedef {Record<string|number|symbol, MediaContentFetchNativeData[]>} INativeTags
 */

/**
 * @template {PictureDataType} PictureData
 * @typedef {Object} MediaContentFetchData
 * @property {ICommonTagsResult<PictureDataType>} common - The common metadata properties.
 * @property {INativeTags} native - The native metadata properties.
 * @property {unknown} format - The format of the media.
 * @property {unknown} quality - The quality of the media.
 */

/**
 * This metadata structure is modeled after the standard output of the
 * `music-metadata@11.13.0` npm package.
 *
 * @template {PictureDataType} PictureData
 * @typedef {{ _fetch_data: null|MediaContentFetchData<PictureData>; } & ContentMetadataTemplate<IPictureTemplate<PictureData>>} MediaContentMetadata
 */

/**
 * The core properties required for any content item within the media system.
 * @typedef {Object} MediaContentBase
 * @property {string} id - Unique identifier.
 * @property {string} [mediaType] - Media type (e.g., video, audio).
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
 * @template {PictureDataType} PictureData
 * @typedef {MediaContentBase & MediaContentMetadata<PictureData>} MediaContent
 */

//////////////////////////////////////////////////////////////////

/**
 * A promise that resolves to an object containing the extracted metadata.
 * @callback ParseMediaContentMetadata
 * @param {Blob} data - The raw file blob.
 * @returns {Promise<MediaContentFetchData<PictureDataType>>} A promise resolving to the common metadata properties.
 */

/**
 * @typedef {Object} LoadingMediaProgress Represents the current state of a media loading operation, including its status, execution stage, and the URL being processed.
 * @property {'loading'|'success'} status - The current status of the operation.
 * @property {LoadingProgressStage} stage - The current execution stage.
 * @property {ProgressEvent<EventTarget>} [event] - The current loading event.
 * @property {string} url - The URL being processed.
 */

/**
 * Defines the specific execution stages of a successful loading process.
 * @typedef {'INITIALIZING'|'DOWNLOADING'|'METADATA_LOADED'|'EXTRACTING_ID3'|'COMPLETE'} LoadingProgressStage
 */

/**
 * Defines the specific stages where a loading error might occur.
 * @typedef {'INITIALIZING'|'DOWNLOADING'|'METADATA'|'ID3'|'UNKNOWN'} LoadingErrorStage
 */

/**
 * A data structure containing details about a media loading error.
 * @typedef {Object} MediaLoadingErrorData
 * @property {Error} error - The original error object.
 * @property {string} url - The URL that failed.
 * @property {LoadingErrorStage} stage - The stage where it failed.
 */

//////////////////////////////////////////////////////////////////

const checkString = (/** @type {string} */ val, /** @type {string} */ name) => {
  if (typeof name !== 'string') throw new TypeError('Expected "name" to be a string.');
  if (typeof val !== 'string')
    throw new TypeError(`Expected "${name}" to be a string, but received ${typeof val}.`);
};

const checkFunction = (/** @type {Function} */ val, /** @type {string} */ name) => {
  if (typeof name !== 'string') throw new TypeError('Expected "name" to be a string.');
  if (typeof val !== 'function')
    throw new TypeError(`Expected "${name}" to be a function, but received ${typeof val}.`);
};

const checkObject = (/** @type {Object<string, any> | null} */ val, /** @type {string} */ name) => {
  if (typeof name !== 'string') throw new TypeError('Expected "name" to be a string.');
  if (typeof val !== 'object' || val === null || Array.isArray(val)) {
    throw new TypeError(
      `Expected "${name}" to be a plain object, but received ${val === null ? 'null' : Array.isArray(val) ? 'array' : typeof val}.`,
    );
  }
};

/** @type {Map<string, number>} */
export const _blobCounter = new Map();

/**
 * Returns a new object initialized with the default values for the core media content properties.
 * @returns {MediaContentBase}
 */
export const getMediaContentBase = () => ({
  id: '',
  title: '',
  artist: '',
  url: '',
  duration: 0,
  weight: 1,
});

/**
 * Returns a new object initialized with the default values for the media content metadata properties.
 * @returns {MediaContentMetadata<PictureDataType>}
 */
export const getMediaContentMetadata = () => ({
  _fetch_data: null,
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
  movementIndex: { no: null, of: null },
  picture: [],
  date: null,
  originaldate: null,
  originalyear: null,
  releasedate: null,
  comment: [],
  lyrics: [],
  albumsort: null,
  titlesort: null,
  work: null,
  artistsort: null,
  albumartistsort: null,
  composersort: null,
  lyricist: [],
  writer: [],
  conductor: [],
  remixer: [],
  arranger: [],
  engineer: [],
  publisher: [],
  producer: [],
  djmixer: [],
  mixer: [],
  technician: [],
  grouping: null,
  subtitle: [],
  description: [],
  longDescription: null,
  discsubtitle: [],
  totaltracks: null,
  totaldiscs: null,
  movementTotal: null,
  compilation: null,
  rating: [],
  bpm: null,
  mood: null,
  media: null,
  catalognumber: [],
  tvShow: null,
  tvShowSort: null,
  tvSeason: null,
  tvEpisode: null,
  tvEpisodeId: null,
  tvNetwork: null,
  podcast: null,
  podcasturl: null,
  releasestatus: null,
  releasetype: [],
  releasecountry: null,
  script: null,
  language: null,
  copyright: null,
  license: null,
  encodedby: null,
  encodersettings: null,
  gapless: null,
  barcode: null,
  isrc: [],
  asin: null,
  website: null,
  performer_instrument: [],
  averageLevel: null,
  peakLevel: null,
  notes: [],
  originalalbum: null,
  originalartist: null,
  key: null,
  category: [],
  hdVideo: null,
  keywords: [],
  movement: null,
  podcastId: null,
  showMovement: null,
  stik: null,
  playCounter: null,
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
 * @param {PictureDataType} data
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
 * @template {PictureDataType} PictureData
 * @param {MediaContent<PictureData>} content
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
 * @param {Partial<ContentMetadataTemplate<IPictureTemplate<string | Uint8Array>>>} common - The object to be validated.
 * @param {boolean} isPartial - If true, properties can be undefined.
 */
const validateMediaContent = (common, isPartial) => {
  checkObject(common, 'common');
  if (typeof isPartial !== 'boolean') throw new TypeError('Expected "isPartial" to be a boolean.');

  const isUndefinedAllowed = (/** @type {any} */ v, forceNoUndefined = false) =>
    !forceNoUndefined && isPartial && typeof v === 'undefined';

  const isString = (/** @type {string | null | undefined} */ v, forceNoUndefined = false) =>
    isUndefinedAllowed(v, forceNoUndefined) ||
    typeof v === 'string' ||
    (!forceNoUndefined && v === null);

  const isNumber = (/** @type {number | null | undefined} */ v, forceNoUndefined = false) =>
    isUndefinedAllowed(v, forceNoUndefined) ||
    typeof v === 'number' ||
    (!forceNoUndefined && v === null);

  const isBoolean = (/** @type {boolean | null | undefined} */ v, forceNoUndefined = false) =>
    isUndefinedAllowed(v, forceNoUndefined) ||
    typeof v === 'boolean' ||
    (!forceNoUndefined && v === null);

  const isArray = (
    /** @type {any[]|undefined} */ v,
    /** @type {(value: any) => boolean} */ valueValidator,
  ) => {
    if (isUndefinedAllowed(v)) return true;
    checkFunction(valueValidator, 'valueValidator');
    return Array.isArray(v) && v.every(valueValidator);
  };

  // --- Recursive Validators for Deep Validation ---

  const isTimestampFormat = (
    /** @type {{ notSynchronized: number | null | undefined; mpegFrameNumber: number | null | undefined; milliseconds: number | null | undefined; } | null} */ v,
  ) =>
    v !== null &&
    typeof v === 'object' &&
    isNumber(v.notSynchronized, true) &&
    isNumber(v.mpegFrameNumber, true) &&
    isNumber(v.milliseconds, true);

  const isLyricsText = (
    /** @type {{ text: string | null | undefined; timestamp: number | null | undefined; } | null} */ v,
  ) => v !== null && typeof v === 'object' && isString(v.text, true) && isNumber(v.timestamp);

  const isLyricsContentType = (
    /** @type {{ other: number | null | undefined; lyrics: number | null | undefined; text: number | null | undefined; movement_part: number | null | undefined; events: number | null | undefined; chord: number | null | undefined; trivia_pop: number | null | undefined; } | null} */ v,
  ) =>
    v !== null &&
    typeof v === 'object' &&
    isNumber(v.other, true) &&
    isNumber(v.lyrics, true) &&
    isNumber(v.text, true) &&
    isNumber(v.movement_part, true) &&
    isNumber(v.events, true) &&
    isNumber(v.chord, true) &&
    isNumber(v.trivia_pop, true);

  const isLyricsTag = (
    /** @type {{ text: string | null | undefined; syncText: any[] | undefined; timeStampFormat: any; contentType: any; } | null} */ v,
  ) =>
    v !== null &&
    typeof v === 'object' &&
    isString(v.text) &&
    isArray(v.syncText, isLyricsText) &&
    isTimestampFormat(v.timeStampFormat) &&
    isLyricsContentType(v.contentType);

  const isComment = (
    /** @type {{ descriptor: string | null | undefined; language: string | null | undefined; text: string | null | undefined; } | null} */ v,
  ) =>
    v !== null &&
    typeof v === 'object' &&
    isString(v.descriptor) &&
    isString(v.language) &&
    isString(v.text);

  const isRating = (
    /** @type {{ source: string | null | undefined; rating: number | null | undefined; } | null} */ v,
  ) => v !== null && typeof v === 'object' && isString(v.source) && isNumber(v.rating);

  // --- Primitive Validation ---

  if (!isString(common.title))
    throw new TypeError('Invalid metadata: "title" must be a string or null.');
  if (!isString(common.album))
    throw new TypeError('Invalid metadata: "album" must be a string or null.');
  if (!isString(common.albumartist))
    throw new TypeError('Invalid metadata: "albumartist" must be a a string or null.');
  if (!isString(common.artist))
    throw new TypeError('Invalid metadata: "artist" must be a string or null.');
  if (!isBoolean(common.compilation))
    throw new TypeError('Invalid metadata: "compilation" must be a boolean or null.');
  if (!isBoolean(common.podcast))
    throw new TypeError('Invalid metadata: "podcast" must be a boolean or null.');
  if (!isBoolean(common.gapless))
    throw new TypeError('Invalid metadata: "gapless" must be a boolean or null.');
  if (!isBoolean(common.showMovement))
    throw new TypeError('Invalid metadata: "showMovement" must be a boolean or null.');
  if (!isNumber(common.averageLevel))
    throw new TypeError('Invalid metadata: "averageLevel" must be a number or null.');
  if (!isNumber(common.peakLevel))
    throw new TypeError('Invalid metadata: "peakLevel" must be a number or null.');
  if (!isNumber(common.hdVideo))
    throw new TypeError('Invalid metadata: "hdVideo" must be a number or null.');
  if (!isNumber(common.stik))
    throw new TypeError('Invalid metadata: "stik" must be a number or null.');
  if (!isNumber(common.playCounter))
    throw new TypeError('Invalid metadata: "playCounter" must be a number or null.');
  if (!isNumber(common.tvSeason))
    throw new TypeError('Invalid metadata: "tvSeason" must be a number or null.');
  if (!isNumber(common.tvEpisode))
    throw new TypeError('Invalid metadata: "tvEpisode" must be a number or null.');
  if (!isNumber(common.year))
    throw new TypeError('Invalid metadata: "year" must be a number or null.');
  if (!isNumber(common.bpm))
    throw new TypeError('Invalid metadata: "bpm" must be a number or null.');
  if (!isNumber(common.originalyear))
    throw new TypeError('Invalid metadata: "originalyear" must be a number or null.');
  if (!isNumber(common.movementTotal))
    throw new TypeError('Invalid metadata: "movementTotal" must be a number or null.');
  if (!isString(common.date))
    throw new TypeError('Invalid metadata: "date" must be a string or null.');
  if (!isString(common.originaldate))
    throw new TypeError('Invalid metadata: "originaldate" must be a string or null.');
  if (!isString(common.releasedate))
    throw new TypeError('Invalid metadata: "releasedate" must be a string or null.');
  if (!isString(common.albumsort))
    throw new TypeError('Invalid metadata: "albumsort" must be a string or null.');
  if (!isString(common.titlesort))
    throw new TypeError('Invalid metadata: "titlesort" must be a string or null.');
  if (!isString(common.work))
    throw new TypeError('Invalid metadata: "work" must be a string or null.');
  if (!isString(common.artistsort))
    throw new TypeError('Invalid metadata: "artistsort" must be a string or null.');
  if (!isString(common.albumartistsort))
    throw new TypeError('Invalid metadata: "albumartistsort" must be a string or null.');
  if (!isString(common.composersort))
    throw new TypeError('Invalid metadata: "composersort" must be a string or null.');
  if (!isString(common.grouping))
    throw new TypeError('Invalid metadata: "grouping" must be a string or null.');
  if (!isString(common.longDescription))
    throw new TypeError('Invalid metadata: "longDescription" must be a string or null.');
  if (!isString(common.totaltracks))
    throw new TypeError('Invalid metadata: "totaltracks" must be a string or null.');
  if (!isString(common.totaldiscs))
    throw new TypeError('Invalid metadata: "totaldiscs" must be a string or null.');
  if (!isString(common.mood))
    throw new TypeError('Invalid metadata: "mood" must be a string or null.');
  if (!isString(common.media))
    throw new TypeError('Invalid metadata: "media" must be a string or null.');
  if (!isString(common.tvShow))
    throw new TypeError('Invalid metadata: "tvShow" must be a string or null.');
  if (!isString(common.tvShowSort))
    throw new TypeError('Invalid metadata: "tvShowSort" must be a string or null.');
  if (!isString(common.tvEpisodeId))
    throw new TypeError('Invalid metadata: "tvEpisodeId" must be a string or null.');
  if (!isString(common.tvNetwork))
    throw new TypeError('Invalid metadata: "tvNetwork" must be a string or null.');
  if (!isString(common.podcasturl))
    throw new TypeError('Invalid metadata: "podcasturl" must be a string or null.');
  if (!isString(common.releasestatus))
    throw new TypeError('Invalid metadata: "releasestatus" must be a string or null.');
  if (!isString(common.releasecountry))
    throw new TypeError('Invalid metadata: "releasecountry" must be a string or null.');
  if (!isString(common.script))
    throw new TypeError('Invalid metadata: "script" must be a string or null.');
  if (!isString(common.language))
    throw new TypeError('Invalid metadata: "language" must be a string or null.');
  if (!isString(common.copyright))
    throw new TypeError('Invalid metadata: "copyright" must be a string or null.');
  if (!isString(common.license))
    throw new TypeError('Invalid metadata: "license" must be a string or null.');
  if (!isString(common.encodedby))
    throw new TypeError('Invalid metadata: "encodedby" must be a string or null.');
  if (!isString(common.encodersettings))
    throw new TypeError('Invalid metadata: "encodersettings" must be a string or null.');
  if (!isString(common.barcode))
    throw new TypeError('Invalid metadata: "barcode" must be a string or null.');
  if (!isString(common.asin))
    throw new TypeError('Invalid metadata: "asin" must be a string or null.');
  if (!isString(common.website))
    throw new TypeError('Invalid metadata: "website" must be a string or null.');
  if (!isString(common.originalalbum))
    throw new TypeError('Invalid metadata: "originalalbum" must be a string or null.');
  if (!isString(common.originalartist))
    throw new TypeError('Invalid metadata: "originalartist" must be a string or null.');
  if (!isString(common.key))
    throw new TypeError('Invalid metadata: "key" must be a string or null.');
  if (!isString(common.movement))
    throw new TypeError('Invalid metadata: "movement" must be a string or null.');
  if (!isString(common.podcastId))
    throw new TypeError('Invalid metadata: "podcastId" must be a string or null.');

  // Validate Arrays
  if (!isArray(common.albumartists, (v) => typeof v === 'string'))
    throw new TypeError('Invalid metadata: "albumartists" must be an array of strings.');
  if (!isArray(common.genre, (v) => typeof v === 'string'))
    throw new TypeError('Invalid metadata: "genre" must be an array of strings.');
  if (!isArray(common.label, (v) => typeof v === 'string'))
    throw new TypeError('Invalid metadata: "label" must be an array of strings.');
  if (!isArray(common.composer, (v) => typeof v === 'string'))
    throw new TypeError('Invalid metadata: "composer" must be an array of strings.');
  if (!isArray(common.artists, (v) => typeof v === 'string'))
    throw new TypeError('Invalid metadata: "artists" must be an array of strings.');
  if (!isArray(common.lyricist, (v) => typeof v === 'string'))
    throw new TypeError('Invalid metadata: "lyricist" must be an array of strings.');
  if (!isArray(common.writer, (v) => typeof v === 'string'))
    throw new TypeError('Invalid metadata: "writer" must be an array of strings.');
  if (!isArray(common.conductor, (v) => typeof v === 'string'))
    throw new TypeError('Invalid metadata: "conductor" must be an array of strings.');
  if (!isArray(common.remixer, (v) => typeof v === 'string'))
    throw new TypeError('Invalid metadata: "remixer" must be an array of strings.');
  if (!isArray(common.arranger, (v) => typeof v === 'string'))
    throw new TypeError('Invalid metadata: "arranger" must be an array of strings.');
  if (!isArray(common.engineer, (v) => typeof v === 'string'))
    throw new TypeError('Invalid metadata: "engineer" must be an array of strings.');
  if (!isArray(common.publisher, (v) => typeof v === 'string'))
    throw new TypeError('Invalid metadata: "publisher" must be an array of strings.');
  if (!isArray(common.producer, (v) => typeof v === 'string'))
    throw new TypeError('Invalid metadata: "producer" must be an array of strings.');
  if (!isArray(common.djmixer, (v) => typeof v === 'string'))
    throw new TypeError('Invalid metadata: "djmixer" must be an array of strings.');
  if (!isArray(common.mixer, (v) => typeof v === 'string'))
    throw new TypeError('Invalid metadata: "mixer" must be an array of strings.');
  if (!isArray(common.technician, (v) => typeof v === 'string'))
    throw new TypeError('Invalid metadata: "technician" must be an array of strings.');
  if (!isArray(common.subtitle, (v) => typeof v === 'string'))
    throw new TypeError('Invalid metadata: "subtitle" must be an array of strings.');
  if (!isArray(common.description, (v) => typeof v === 'string'))
    throw new TypeError('Invalid metadata: "description" must be an array of strings.');
  if (!isArray(common.discsubtitle, (v) => typeof v === 'string'))
    throw new TypeError('Invalid metadata: "discsubtitle" must be an array of strings.');
  if (!isArray(common.releasetype, (v) => typeof v === 'string'))
    throw new TypeError('Invalid metadata: "releasetype" must be an array of strings.');
  if (!isArray(common.isrc, (v) => typeof v === 'string'))
    throw new TypeError('Invalid metadata: "isrc" must be an array of strings.');
  if (!isArray(common.performer_instrument, (v) => typeof v === 'string'))
    throw new TypeError('Invalid metadata: "performer_instrument" must be an array of strings.');
  if (!isArray(common.notes, (v) => typeof v === 'string'))
    throw new TypeError('Invalid metadata: "notes" must be an array of strings.');
  if (!isArray(common.category, (v) => typeof v === 'string'))
    throw new TypeError('Invalid metadata: "category" must be an array of strings.');
  if (!isArray(common.keywords, (v) => typeof v === 'string'))
    throw new TypeError('Invalid metadata: "keywords" must be an array of strings.');
  if (!isArray(common.catalognumber, (v) => typeof v === 'string'))
    throw new TypeError('Invalid metadata: "catalognumber" must be an array of strings.');

  // Validate Complex Arrays

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

  if (!isArray(common.comment, isComment))
    throw new TypeError('Invalid metadata: "comment" must be an array of valid IComment objects.');
  if (!isArray(common.lyrics, isLyricsTag))
    throw new TypeError('Invalid metadata: "lyrics" must be an array of valid ILyricsTag objects.');
  if (!isArray(common.rating, isRating))
    throw new TypeError('Invalid metadata: "rating" must be an array of valid IRating objects.');

  // Validate Nested Objects (Disk, Track, Movement, etc.)

  /**
   * Validate Nested Objects (Disk and Track)
   * @param {string} name
   * @param {MediaNumber|null} [info]
   */
  const validateTrackInfo = (name, info) => {
    if (isUndefinedAllowed(info)) return;
    if (info === null) return;
    if (typeof info !== 'object')
      throw new TypeError(`Invalid metadata: "${name}" must be an object or null.`);
    if (typeof info.no !== 'number' && info.no !== null)
      throw new TypeError(`Invalid metadata: "${name}.no" must be a number or null.`);
    if (typeof info.of !== 'number' && info.of !== null)
      throw new TypeError(`Invalid metadata: "${name}.of" must be a number or null.`);
  };

  validateTrackInfo('disk', common.disk);
  validateTrackInfo('track', common.track);
  validateTrackInfo('movementIndex', common.movementIndex);
};

/**
 * Helper to validate types within the media content metadata object.
 * This ensures that if a property is present, it matches the expected type.
 * @param {ContentMetadataTemplate<IPictureTemplate<string | Uint8Array>>} common
 */
export const valMediaContentMetadata = (common) => {
  checkObject(common, 'common');
  return validateMediaContent(common, false);
};

/**
 * Helper to validate types within the media content metadata object.
 * Allows the absence of properties (useful for updates/patch).
 * @param {Partial<ContentMetadataTemplate<IPictureTemplate<string | Uint8Array>>>} common
 */
export const valMediaContentMetadataPartial = (common) => {
  checkObject(common, 'common');
  return validateMediaContent(common, true);
};

/**
 * Downloads an audio file from a URL and extracts its ID3/metadata tags.
 *
 * @param {string} url - The full URL of the audio file to be downloaded.
 * @param {ParseMediaContentMetadata} parseFile - The function used to parse the file data.
 * @param {boolean} [convertBase64toBlob=true] - If the image content needs to be converted directly into a high-performance Blob URL, use this method.
 * @returns {Promise<MediaContentMetadata<PictureDataType>>} A promise that resolves to an object containing the extracted metadata.
 * @throws {TypeError} If the provided `url` is not a string or `parseFile` is not a function.
 * @throws {Error} If the network request fails or the parsing process encounters an error.
 */
export const extractMediaId3Tags = async (url, parseFile, convertBase64toBlob = true) => {
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
      throw new TypeError('Invalid metadata: "common" property is missing.');

    const common = metadata.common;
    valMediaContentMetadataPartial(common);

    // 5. Return the specific metadata fields requested
    // We structure the return to match the MediaContentMetadata typedef
    return {
      _fetch_data: metadata,
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
      movementIndex: common?.movementIndex
        ? { no: common.movementIndex.no, of: common.movementIndex.of }
        : { no: null, of: null },
      picture:
        common?.picture?.map((value) => ({
          ...value,
          data: convertBase64toBlob ? convertToBlobUrl(value.data, value.format) : value.data,
        })) ?? [],
      date: common?.date ?? null,
      originaldate: common?.originaldate ?? null,
      originalyear: common?.originalyear ?? null,
      releasedate: common?.releasedate ?? null,
      comment: common?.comment ?? [],
      lyrics: common?.lyrics ?? [],
      albumsort: common?.albumsort ?? null,
      titlesort: common?.titlesort ?? null,
      work: common?.work ?? null,
      artistsort: common?.artistsort ?? null,
      albumartistsort: common?.albumartistsort ?? null,
      composersort: common?.composersort ?? null,
      lyricist: common?.lyricist ?? [],
      writer: common?.writer ?? [],
      conductor: common?.conductor ?? [],
      remixer: common?.remixer ?? [],
      arranger: common?.arranger ?? [],
      engineer: common?.engineer ?? [],
      publisher: common?.publisher ?? [],
      producer: common?.producer ?? [],
      djmixer: common?.djmixer ?? [],
      mixer: common?.mixer ?? [],
      technician: common?.technician ?? [],
      grouping: common?.grouping ?? null,
      subtitle: common?.subtitle ?? [],
      description: common?.description ?? [],
      longDescription: common?.longDescription ?? null,
      discsubtitle: common?.discsubtitle ?? [],
      totaltracks: common?.totaltracks ?? null,
      totaldiscs: common?.totaldiscs ?? null,
      movementTotal: common?.movementTotal ?? null,
      compilation: common?.compilation ?? null,
      rating: common?.rating ?? [],
      bpm: common?.bpm ?? null,
      mood: common?.mood ?? null,
      media: common?.media ?? null,
      catalognumber: common?.catalognumber ?? [],
      tvShow: common?.tvShow ?? null,
      tvShowSort: common?.tvShowSort ?? null,
      tvSeason: common?.tvSeason ?? null,
      tvEpisode: common?.tvEpisode ?? null,
      tvEpisodeId: common?.tvEpisodeId ?? null,
      tvNetwork: common?.tvNetwork ?? null,
      podcast: common?.podcast ?? null,
      podcasturl: common?.podcasturl ?? null,
      releasestatus: common?.releasestatus ?? null,
      releasetype: common?.releasetype ?? [],
      releasecountry: common?.releasecountry ?? null,
      script: common?.script ?? null,
      language: common?.language ?? null,
      copyright: common?.copyright ?? null,
      license: common?.license ?? null,
      encodedby: common?.encodedby ?? null,
      encodersettings: common?.encodersettings ?? null,
      gapless: common?.gapless ?? null,
      barcode: common?.barcode ?? null,
      isrc: common?.isrc ?? [],
      asin: common?.asin ?? null,
      website: common?.website ?? null,
      performer_instrument: common?.performer_instrument ?? [],
      averageLevel: common?.averageLevel ?? null,
      peakLevel: common?.peakLevel ?? null,
      notes: common?.notes ?? [],
      originalalbum: common?.originalalbum ?? null,
      originalartist: common?.originalartist ?? null,
      key: common?.key ?? null,
      category: common?.category ?? [],
      hdVideo: common?.hdVideo ?? null,
      keywords: common?.keywords ?? [],
      movement: common?.movement ?? null,
      podcastId: common?.podcastId ?? null,
      showMovement: common?.showMovement ?? null,
      stik: common?.stik ?? null,
      playCounter: common?.playCounter ?? null,
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
 * @template {PictureDataType} PictureData
 * @param {string | HTMLMediaElement} source - A URL string or an existing Audio object.
 * @param {Partial<MediaContentBase & MediaContentMetadata<PictureData>> & { id?: string; weight?: number }} [defaultMetadata={}] - Optional default metadata that overrides automatic extraction.
 * @param {Partial<MediaContentBase & MediaContentMetadata<PictureData>> & { id?: string; weight?: number }} [metadata={}] - Optional manual metadata that overrides automatic extraction.
 * @param {ParseMediaContentMetadata} [parseFile] - Private helper to interface with parseFile.
 * @param {Object} [callbacks={}] - Callbacks for monitoring the loading process.
 * @param {(progress: LoadingMediaProgress) => void} [callbacks.onProgress] - Callback triggered on stage changes.
 * @param {(error: MediaLoadingErrorData) => void} [callbacks.onError] - Callback triggered when a non-fatal or fatal error occurs.
 * @param {boolean} [convertBase64toBlob=true] - If the image content needs to be converted directly into a high-performance Blob URL, use this method.
 * @param {UnknownArtistGetter} unknownArtist
 * @returns {Promise<MediaContent<PictureData>>} A promise that resolves to a valid MediaContent object.
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
  parseFile = (data) => {
    if (!(data instanceof Blob)) throw new TypeError('Expected "data" to be a Blob.');
    return new Promise((_, reject) => reject(new TypeError('parseFile library not found.')));
  },
  callbacks = {},
  convertBase64toBlob = true,
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
    checkString(stage, 'stage');
    if (event !== undefined && !(event instanceof Event)) {
      throw new TypeError('Expected "event" to be an Event or undefined.');
    }

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
    if (!(error instanceof Error)) throw new TypeError('Expected "error" to be an Error.');
    checkString(stage, 'stage');

    if (callbacks.onError) {
      callbacks.onError({
        error: error instanceof Error ? error : new Error(String(error)),
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
    /** @type {Partial<MediaContentMetadata<PictureDataType>>} */
    let extractedMetadata = {};
    notifyProgress('EXTRACTING_ID3');
    try {
      extractedMetadata = await extractMediaId3Tags(url, parseFile, convertBase64toBlob);
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
      checkString(url, 'url');
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
      callbacks.onProgress({ status: 'success', stage: 'COMPLETE', url: url });
    }

    return /** @type {MediaContent<PictureData>} */ (finalContent);
  } catch (err) {
    // If it's already a MediaLoadingError, re-throw it.
    // Otherwise, wrap it.
    if (err instanceof MediaLoadingError) throw err;
    const wrappedError = new MediaLoadingError(
      err instanceof Error ? err.message : 'UNKNOWN ERROR',
      url,
      'INITIALIZING',
    );
    notifyError(wrappedError, 'INITIALIZING');
    throw wrappedError;
  }
};
