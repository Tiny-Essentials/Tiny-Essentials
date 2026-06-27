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
 * @typedef {Object} ExtractedMetadata
 * This metadata structure is modeled after the standard output of the
 * `music-metadata` npm package.
 *
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
 * Downloads an audio file from a URL and extracts its ID3/metadata tags.
 *
 * @param {string} url - The full URL of the audio file to be downloaded.
 * @param {(data: Blob) => Promise<{ common: Partial<ExtractedMetadata> }>} parseFile - The function used to parse the file data.
 * @returns {Promise<ExtractedMetadata>} A promise that resolves to an object containing the extracted metadata.
 * @throws {TypeError} If the provided `url` is not a string or `parseFile` is not a function.
 * @throws {Error} If the network request fails or the parsing process encounters an error.
 */
const extractId3Tags = async (url, parseFile) => {
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
      const isArray = (/** @type {string[] | IPicture[] | undefined} */ v) => Array.isArray(v);

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

      // Validate Nested Objects (Disk and Track)
      /**
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
    // We structure the return to match the ExtractedMetadata typedef
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
      picture: common?.picture ?? [],
    };
  } catch (error) {
    // Re-throwing the error allows the caller to handle specific failure cases
    throw error;
  }
};

export default extractId3Tags;
