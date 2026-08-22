import fs from 'fs/promises';
import path from 'path';

/**
 * @typedef {Object} CopyConfig
 * @property {string} src - The source directory path.
 * @property {string} dest - The destination directory path.
 */

/**
 * Class responsible for managing the recursive copying of SCSS files between directories.
 */
class ScssCopier {
  /** @type {CopyConfig[]} */
  #configs;

  /**
   * @param {CopyConfig[]} configs - A list of objects containing source and destination.
   * @throws {TypeError} If the arguments do not follow the expected format.
   */
  constructor(configs) {
    this.#validateConfigs(configs);
    this.#configs = configs;
  }

  /**
   * Strictly validates the provided configuration structure.
   * @param {CopyConfig[]} configs
   * @throws {TypeError} If validation fails.
   * @private
   */
  #validateConfigs(configs) {
    if (!Array.isArray(configs)) {
      throw new TypeError('The "configs" argument must be an Array.');
    }

    for (const config of configs) {
      if (typeof config.src !== 'string' || typeof config.dest !== 'string') {
        throw new TypeError(
          `Invalid configuration detected. Each object must have 'src' and 'dest' as strings. Received: ${JSON.stringify(config)}`,
        );
      }

      if (config.src.trim() === '' || config.dest.trim() === '') {
        throw new TypeError(
          'The source (src) and destination (dest) paths cannot be empty strings.',
        );
      }
    }
  }

  /**
   * Executes the copying process of all configured .scss files recursively.
   * @returns {Promise<void>}
   * @throws {Error} If a file system error occurs during execution.
   */
  async execute() {
    console.log('🚀 Starting recursive SCSS build process...');

    for (const config of this.#configs) {
      try {
        await this.#copyDirectory(config.src, config.dest);
      } catch (error) {
        // Using generic Error here because the error originates from I/O system operations
        throw new Error(`Failed to process directory ${config.src}: ${error.message}`);
      }
    }

    console.log('✅ Recursive SCSS build completed successfully!');
  }

  /**
   * Recursively copies .scss files from a directory to another.
   * @param {string} srcDir - Source directory.
   * @param {string} destDir - Destination directory.
   * @throws {Error}
   * @private
   */
  async #copyDirectory(srcDir, destDir) {
    // Ensure the current destination directory exists
    await fs.mkdir(destDir, { recursive: true });

    // 'withFileTypes: true' returns Dirent objects instead of just strings
    // This allows us to check if an item is a file or directory without extra syscalls
    const entries = await fs.readdir(srcDir, { withFileTypes: true });

    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(destDir, entry.name);

      if (entry.isDirectory()) {
        // RECURSION: If it's a directory, call this method again for the sub-directory
        await this.#copyDirectory(srcPath, destPath);
      } else if (entry.isFile() && entry.name.endsWith('.scss')) {
        // If it's a file and ends with .scss, copy it
        await fs.copyFile(srcPath, destPath);
        console.log(`[COPIED] ${entry.name} -> ${destDir}`);
      }
    }
  }
}

// --- Execution Configuration ---

/**
 * To add new directories in the future, simply add new objects
 * to this array following the { src: '...', dest: '...' } pattern.
 */
const buildConfigs = [
  {
    src: path.resolve('src/v1/webTemplates/bootstrap/5.3/scss'),
    dest: path.resolve('dist/v1/webTemplates/bootstrap/5.3/scss'),
  },
  // Example of how to add another:
  // {
  //   src: path.resolve('src/other/styles'),
  //   dest: path.resolve('dist/other/styles'),
  // },
];

const copier = new ScssCopier(buildConfigs);

copier.execute().catch((err) => {
  console.error(`❌ Critical Build Error: ${err.message}`);
  process.exit(1);
});
