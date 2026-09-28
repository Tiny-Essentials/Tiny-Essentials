/**
 * @file Ambient declarations for the Storage Buckets API.
 *
 * The API is not part of the TypeScript `lib.dom` bundle yet, so the shapes
 * consumed by {@link TinyStorageBucketFileSystem} are declared here.
 */

/**
 * Options accepted when opening a storage bucket.
 */
interface StorageBucketOptions {
  /** Persistence guarantee requested from the browser. */
  durability?: 'strict' | 'relaxed';
  /** Whether the bucket should survive eviction. */
  persisted?: boolean;
  /** Maximum number of bytes the bucket may use. */
  quota?: number;
  /** Unix timestamp, in milliseconds, after which the bucket may be cleared. */
  expires?: number;
}

/**
 * Isolated origin private file system returned by {@link StorageBucketManager.open}.
 */
interface StorageBucket {
  /** Name of the bucket. */
  readonly name: string;
  /**
   * @returns The root directory of the bucket.
   */
  getDirectory(): Promise<FileSystemDirectoryHandle>;
}

/**
 * Entry point exposed as `navigator.storageBuckets`.
 */
interface StorageBucketManager {
  /**
   * @param name Name of the bucket.
   * @param options Bucket options.
   * @returns The opened bucket.
   */
  open(name: string, options?: StorageBucketOptions): Promise<StorageBucket>;
  /**
   * @returns The names of every bucket owned by the origin.
   */
  keys(): Promise<string[]>;
  /**
   * @param name Name of the bucket to delete.
   * @returns `true` when the bucket existed.
   */
  delete(name: string): Promise<boolean>;
}

interface Navigator {
  /** Storage Buckets entry point. */
  readonly storageBuckets: StorageBucketManager;
}
