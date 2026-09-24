import { TinySetMapDatabase, TinySetDb } from '../../../storage/TinySetMapDatabase.mjs';
import TinyServiceWorkerEngine from '../TinyServiceWorkerEngine.mjs';

const { TinyPluginLayer } = TinyServiceWorkerEngine;

const db = new TinySetMapDatabase('tiny-sw-vite-file-detector', [
  {
    create: [
      {
        name: 'logged-urls',
        validate: (value) => typeof value === 'string',
        type: 'set',
      },
    ],
  },
]);

/**
 * Persistent store of URL strings that already emitted a detection log.
 * Survives service worker restarts by mirroring every write into IndexedDB.
 * @type {TinySetDb<string>}
 */
const loggedUrls = db.tableSet('logged-urls');

/**
 * Configuration options for the ViteFileDetectorPlugin to define which paths should be bypassed.
 * @typedef {Object} ViteFileDetectorOptions
 * @property {(string|RegExp)[]} paths - An array of strings or regular expressions used to identify URLs that should be bypassed.
 * @property {string} srcPath - The base path for the source directory to be included in the bypass list.
 * @property {string} manifestPath - The path to the manifest file to be included in the bypass list.
 * @property {number} maxCachedUrls - Maximum amount of detected URLs kept in the persistent cache. When the limit is reached, the oldest entries are evicted before the new one is written. Use `Infinity` to keep every URL forever.
 */

/**
 * Default configuration to maintain backward compatibility.
 * @type {ViteFileDetectorOptions}
 */
const DEFAULT_OPTIONS = {
  paths: ['/@vite', '/@react', '/node_modules'],
  srcPath: '/src',
  manifestPath: '/manifest.json',
  maxCachedUrls: 1000,
};

/**
 * A plugin for TinyServiceWorkerEngine to detect and bypass Vite-specific files.
 *
 * @type {import('../TinyServiceWorkerEngine.mjs').SwPluginInstaller<InstanceType<typeof TinyPluginLayer>, 'ViteFileDetector', '1.0.0', [Partial<ViteFileDetectorOptions>]|[]>}
 * @throws {TypeError} If the engine is invalid or if the provided options do not match the required schema.
 */
const ViteFileDetectorPlugin = (instance, options = {}) => {
  const engine = instance.engine;
  instance.id = 'ViteFileDetector';
  instance.version = '1.0.0';
  instance.description = 'Vite File detector.';
  instance.authors = ['JasminDreasond'];
  instance.contributors = ['JasminDreasond'];
  instance.categories = ['framework-validator'];
  instance.tags = ['vite', 'framework', 'validator'];

  if (!(engine instanceof TinyServiceWorkerEngine)) {
    throw new TypeError('Plugin requires a TinyServiceWorkerEngine instance to function.');
  }

  // 1. Merge and Validate Options
  /** @type {ViteFileDetectorOptions} */
  const config = { ...DEFAULT_OPTIONS, ...options };

  if (!Array.isArray(config.paths)) {
    throw new TypeError('The "paths" property in options must be an array.');
  }

  const paths = [...config.paths, config.srcPath, config.manifestPath];

  // Deep validation of the paths array elements
  paths.forEach((pattern, index) => {
    const isValidString = typeof pattern === 'string';
    const isValidRegExp = pattern instanceof RegExp;

    if (!isValidString && !isValidRegExp) {
      throw new TypeError(
        `Invalid type at paths[${index}]: Expected string or RegExp, but received ${typeof pattern}.`,
      );
    }
  });

  // 2. Validate the cache limit
  if (typeof config.maxCachedUrls !== 'number') {
    throw new TypeError(
      `The "maxCachedUrls" option must be a number, but received ${typeof config.maxCachedUrls}.`,
    );
  }

  if (
    config.maxCachedUrls !== Infinity &&
    (!Number.isInteger(config.maxCachedUrls) || config.maxCachedUrls < 1)
  ) {
    throw new RangeError(
      `The "maxCachedUrls" option must be a positive integer or Infinity, but received ${config.maxCachedUrls}.`,
    );
  }

  const { maxCachedUrls } = config;

  // 3. Implementation
  // @ts-ignore
  if (import.meta.env.DEV) {
    /**
     * Tail of the detection queue.
     *
     * Every cache mutation is chained here because `TinySetDb` only makes each
     * individual call atomic. Without this queue, two detections that resolve in
     * the same tick would both read the same `size` and both decide to insert,
     * letting the cache grow past `maxCachedUrls`.
     * @type {Promise<void>}
     */
    let detectionQueue = Promise.resolve();

    /**
     * Runs a detection task after every previously queued task has settled.
     * @param {() => Promise<void>} task - The task that touches the cache.
     * @returns {Promise<void>} Resolves when the task settles.
     */
    const enqueueDetection = (task) => {
      const result = detectionQueue.then(task);
      detectionQueue = result.catch(() => undefined);
      return result;
    };

    /**
     * Drops the oldest URLs until a single new entry fits inside the limit.
     *
     * The `+ 1` reserves the slot for the value that is about to be inserted,
     * so the cache always ends up with exactly `maxCachedUrls` entries.
     * @returns {Promise<void>} Resolves once the cache is below the limit.
     */
    const evictOldestUrls = async () => {
      const overflow = loggedUrls.size - maxCachedUrls + 1;
      if (overflow <= 0) return;

      const snapshot = await loggedUrls.toArray();
      /** @type {Promise<any>[]} */
      const promises = [];
      for (let index = 0; index < overflow; index += 1) {
        promises.push(loggedUrls.delete(snapshot[index]));
      }
      await Promise.all(promises);
    };

    engine.addFetchGlobalListener('ViteFileDetectorPlugin', ({ url }, response) => {
      const isBypassed = paths.some((pattern) => {
        if (pattern instanceof RegExp) return pattern.test(url.pathname);
        return url.pathname.startsWith(pattern);
      });

      if (!isBypassed) return;

      response.continueCheck = false;
      response.needValidation = false;
      response.code = 200;

      const cacheKey = url.toString();

      enqueueDetection(async () => {
        if (await loggedUrls.has(cacheKey)) return;
        await evictOldestUrls();
        await loggedUrls.add(cacheKey);
        instance.log('warn', `File detected: ${cacheKey}`);
      }).catch((error) => {
        instance.log('error', `Failed to cache the detected URL "${cacheKey}": ${error.message}`);
      });
    });
  }

  return new TinyPluginLayer();
};

export default ViteFileDetectorPlugin;
