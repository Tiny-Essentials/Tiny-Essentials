/**
 * @typedef {Object} IPicture
 * @property {string} format - The MIME type of the image (e.g., 'image/jpeg').
 * @property {Uint8Array} data - The raw binary data of the image.
 * @property {string} [description] - An optional textual description of the image.
 * @property {string} [type] - The specific type of picture (e.g., 'cover', 'front', 'back').
 * @property {string} [name] - The filename associated with the image.
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
 * @property {{no: number|null, of: number|null}} disk - Disk information containing the current disk number and total disks.
 * @property {{no: number|null, of: number|null}} track - Track information containing the current track number and total tracks.
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

    // 4. Validate the parsed metadata structure
    // We ensure that 'metadata' exists and that 'metadata.common' is a valid object 
    // before proceeding to the mapping stage.
    if (!metadata || typeof metadata.common !== 'object')
      throw new Error('The parsed metadata structure is invalid: "common" property is missing or not an object.');
    const common = metadata.common;

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
