import { CID } from 'multiformats/cid';
import { sha256 } from 'multiformats/hashes/sha2';

/**
 * Multicodec code for the dag-pb format.
 * @type {number}
 */
const CODEC_DAG_PB = 0x70;

/**
 * Multicodec code for raw binary data.
 * @type {number}
 */
const CODEC_RAW = 0x55;

/**
 * @typedef {Object} CIDGenerationResult
 * @property {string} cidString - The string representation of the CID.
 * @property {'v0' | 'v1'} version - The CID version that was generated.
 * @property {'sha256'} hashAlgorithm - The algorithm used for hashing.
 * @property {number} codec - The multicodec code of the content.
 */

/**
 * A utility class to generate IPFS Content Identifiers (CIDs) locally.
 */
class IPFSHasher {
  /** @type {'v0' | 'v1'} */
  #version;

  /**
   * @param {'v0' | 'v1'} [version='v1'] - The CID version to generate.
   * @throws {TypeError} If the version is not 'v0' or 'v1'.
   */
  constructor(version = 'v1') {
    if (version !== 'v0' && version !== 'v1') {
      throw new TypeError('Invalid CID version. Use "v0" or "v1".');
    }
    this.#version = version;
  }

  /**
   * Generates a CID from the provided data.
   *
   * @param {Uint8Array} data - The raw data to be hashed.
   * @returns {Promise<CIDGenerationResult>} A promise resolving to the CID result.
   * @throws {TypeError} If the input data is not a Uint8Array.
   */
  async generate(data) {
    if (!(data instanceof Uint8Array)) {
      throw new TypeError(`Expected Uint8Array, but received ${typeof data}.`);
    }

    // sha256.digest is asynchronous and must be awaited.
    const hash = await sha256.digest(data);

    /** @type {CID} */
    let cid;
    /** @type {number} */
    let codec;

    if (this.#version === 'v0') {
      // CIDv0 is locked to dag-pb + sha256. The codec is implicit.
      codec = CODEC_DAG_PB;
      cid = CID.createV0(hash);
    } else {
      // CIDv1 is explicit: we choose the raw codec for file bytes.
      codec = CODEC_RAW;
      cid = CID.create(1, codec, hash);
    }

    return {
      cidString: cid.toString(),
      version: this.#version,
      hashAlgorithm: 'sha256',
      codec,
    };
  }
}

export default IPFSHasher;
