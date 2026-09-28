/**
 * @file Storage Bucket backend for {@link TinyFSCore}.
 *
 * A storage bucket is an isolated origin private file system. This backend
 * reuses every primitive implemented by {@link TinyOPFSFileSystem} and only
 * overrides how the root directory handle is resolved, so a bucket behaves
 * exactly like the default origin private file system.
 */

import TinyOPFSFileSystem from './index.mjs';
import { createFileSystemError } from '../../error.mjs';
import { ROOT_PATH } from '../../constants.mjs';

/** @type {string} */
const DEFAULT_BUCKET_NAME = 'tiny-fs';

/**
 * @typedef {Object} StorageBucketOpenOptions
 * @property {'strict' | 'relaxed'} [durability] Persistence guarantee requested from the browser.
 * @property {boolean} [persisted] Whether the bucket should survive eviction.
 * @property {number} [quota] Maximum number of bytes the bucket may use.
 * @property {number} [expires] Unix timestamp, in milliseconds, after which the bucket may be cleared.
 */

/**
 * @typedef {Object} StorageBucketDescriptor
 * @property {string} [name] Name of the storage bucket. Defaults to `'tiny-fs'`.
 * @property {'strict' | 'relaxed'} [durability] Persistence guarantee requested from the browser.
 * @property {boolean} [persisted] Whether the bucket should survive eviction.
 * @property {number} [quota] Maximum number of bytes the bucket may use.
 * @property {number} [expires] Unix timestamp, in milliseconds, after which the bucket may be cleared.
 */

/**
 * @typedef {Object} StorageBucketFileSystemOptions
 * @property {string} [cwd] Working directory used to resolve relative paths.
 * @property {number} [umask] Permission mask applied on creation.
 * @property {import('../../index.mjs').FSIdentity} [identity] Effective identity used by `access`.
 * @property {StorageBucketDescriptor} [bucket] Storage bucket configuration.
 */

/**
 * @typedef {Object} ResolvedBucketDescriptor
 * @property {string} name Validated bucket name.
 * @property {StorageBucketOpenOptions} options Validated bucket options.
 */

/**
 * Validates the `bucket` option.
 *
 * @param {unknown} value Candidate value.
 * @returns {ResolvedBucketDescriptor} The validated descriptor.
 * @throws {TypeError} When the descriptor or one of its members has the wrong type.
 * @throws {RangeError} When a numeric member is negative.
 */
const assertBucketDescriptor = (value) => {
  if (value === undefined) {
    return { name: DEFAULT_BUCKET_NAME, options: {} };
  }
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError('The "bucket" option must be of type object');
  }
  const { name, durability, persisted, quota, expires } = /** @type {StorageBucketDescriptor} */ (
    value
  );
  if (name !== undefined && (typeof name !== 'string' || name.length === 0)) {
    throw new TypeError('The "bucket.name" option must be a non-empty string');
  }
  if (durability !== undefined && durability !== 'strict' && durability !== 'relaxed') {
    throw new TypeError('The "bucket.durability" option must be "strict" or "relaxed"');
  }
  if (persisted !== undefined && typeof persisted !== 'boolean') {
    throw new TypeError('The "bucket.persisted" option must be of type boolean');
  }
  if (quota !== undefined) {
    if (!Number.isInteger(quota)) {
      throw new TypeError('The "bucket.quota" option must be an integer');
    }
    if (quota < 0) {
      throw new RangeError('The "bucket.quota" option must not be negative');
    }
  }
  if (expires !== undefined) {
    if (!Number.isInteger(expires)) {
      throw new TypeError('The "bucket.expires" option must be an integer');
    }
    if (expires < 0) {
      throw new RangeError('The "bucket.expires" option must not be negative');
    }
  }
  return {
    name: name ?? DEFAULT_BUCKET_NAME,
    options: { durability, persisted, quota, expires },
  };
};

/**
 * Origin Private File System backend scoped to a single storage bucket.
 *
 * @beta
 */
class TinyStorageBucketFileSystem extends TinyOPFSFileSystem {
  /** @type {string} */
  #bucketName;

  /** @type {StorageBucketOpenOptions} */
  #bucketOptions;

  /** @type {FileSystemDirectoryHandle | null} */
  #bucketRoot = null;

  /**
   * @param {StorageBucketFileSystemOptions} [options] Construction options.
   * @throws {TypeError} When the `bucket` option is malformed.
   * @throws {RangeError} When a numeric bucket option is negative.
   */
  constructor(options = {}) {
    super(options);
    const descriptor = assertBucketDescriptor(options.bucket);
    this.#bucketName = descriptor.name;
    this.#bucketOptions = descriptor.options;
  }

  /**
   * @returns {boolean} `true` when the Storage Buckets API is available.
   */
  static get isSupported() {
    return (
      typeof navigator !== 'undefined' &&
      typeof navigator.storageBuckets === 'object' &&
      navigator.storageBuckets !== null
    );
  }

  /**
   * Lists the names of every storage bucket owned by the origin.
   *
   * @returns {Promise<string[]>} The bucket names.
   * @throws {Error} When the Storage Buckets API is not available.
   */
  static async listBuckets() {
    TinyStorageBucketFileSystem.#assertSupported('keys');
    return navigator.storageBuckets.keys();
  }

  /**
   * Deletes a storage bucket owned by the origin.
   *
   * @param {string} name Name of the bucket to delete.
   * @returns {Promise<boolean>} `true` when the bucket existed.
   * @throws {TypeError} When `name` is not a non-empty string.
   * @throws {Error} When the Storage Buckets API is not available.
   */
  static async deleteBucket(name) {
    if (typeof name !== 'string' || name.length === 0) {
      throw new TypeError('The "name" argument must be a non-empty string');
    }
    TinyStorageBucketFileSystem.#assertSupported('delete');
    return navigator.storageBuckets.delete(name);
  }

  /** @returns {string} Name of the storage bucket backing this instance. */
  get bucketName() {
    return this.#bucketName;
  }

  /**
   * @override
   * @returns {Promise<FileSystemDirectoryHandle>} The bucket root directory.
   * @throws {Error} When the Storage Buckets API is not available.
   */
  async _resolveRoot() {
    if (this.#bucketRoot !== null) {
      return this.#bucketRoot;
    }
    TinyStorageBucketFileSystem.#assertSupported('open');
    const bucket = await navigator.storageBuckets.open(this.#bucketName, this.#bucketOptions);
    this.#bucketRoot = await bucket.getDirectory();
    return this.#bucketRoot;
  }

  /**
   * @param {string} syscall Name of the originating operation.
   * @returns {void}
   * @throws {Error} When the Storage Buckets API is not available.
   */
  static #assertSupported(syscall) {
    if (!TinyStorageBucketFileSystem.isSupported) {
      throw createFileSystemError(
        'ENOSYS',
        syscall,
        ROOT_PATH,
        'the Storage Buckets API is not available in this environment',
      );
    }
  }
}

export default TinyStorageBucketFileSystem;
