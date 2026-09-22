import { execSync } from 'child_process';
import { mkdirSync, cpSync, rmSync, existsSync } from 'fs';
import { resolve } from 'path';

/**
 * @typedef {Object} BuildConfiguration
 * @property {string} pwaTsConfig - Path to the PWA TypeScript configuration file.
 * @property {string} mainTsConfig - Path to the main TypeScript configuration file.
 * @property {string} cssSassCommand - The command to execute the Sass compilation script.
 * @property {string} cssScssCommand - The command to execute the Scss compilation script.
 * @property {string} rollupCommand - The command to run Rollup.
 * @property {string} webpackMode - The mode for Webpack execution.
 * @property {string} pwaSourceDir - The absolute path of the source PWA directory.
 * @property {string} pwaTargetDir - The absolute path of the target PWA directory.
 * @property {string} tempDir - The absolute path of the temporary directory to be cleaned.
 */

/**
 * Manages the build process for the project, including compilation, bundling, and asset management.
 */
class BuildManager {
  /** @type {BuildConfiguration} */
  #config;

  // ANSI Color Codes for terminal output
  #colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    red: '\x1b[31m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
  };

  /**
   * @param {BuildConfiguration} config - The configuration object for the build process.
   * @throws {TypeError} If the configuration object is invalid or missing required properties.
   */
  constructor(config) {
    this.#validateConfig(config);
    this.#config = config;
  }

  /**
   * Validates the configuration object at runtime.
   * @param {BuildConfiguration} config
   * @throws {TypeError}
   */
  #validateConfig(config) {
    const requiredKeys = [
      'pwaTsConfig',
      'mainTsConfig',
      'cssSassCommand',
      'cssScssCommand',
      'rollupCommand',
      'webpackMode',
      'pwaSourceDir',
      'pwaTargetDir',
      'tempDir',
    ];

    for (const key of requiredKeys) {
      if (typeof config[key] !== 'string') {
        throw new TypeError(`Configuration Error: The property "${key}" must be a string.`);
      }
    }
  }

  /**
   * Logs messages to the console with specific formatting and colors.
   * @param {string} message - The message to display.
   * @param {'info' | 'success' | 'warn' | 'error' | 'bright'} level - The severity level of the log.
   */
  #log(message, level = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    let color = this.#colors.reset;
    let prefix = '[INFO]';

    switch (level) {
      case 'success':
        color = this.#colors.green;
        prefix = '[SUCCESS]';
        break;
      case 'warn':
        color = this.#colors.yellow;
        prefix = '[WARNING]';
        break;
      case 'error':
        color = this.#colors.red;
        prefix = '[ERROR]';
        break;
      case 'bright':
        color = this.#colors.bright;
        prefix = '[START]';
        break;
      case 'info':
        color = this.#colors.cyan;
        prefix = '[INFO]';
        break;
    }

    console.log(
      `${color}${this.#colors.bright}${timestamp} ${prefix}${this.#colors.reset} ${message}${this.#colors.reset}`,
    );
  }

  /**
   * Executes a shell command synchronously.
   * @param {string} command - The shell command to execute.
   */
  #runCommand(command) {
    this.#log(`Executing: ${command}`, 'info');
    try {
      execSync(command, { stdio: 'inherit' });
    } catch (error) {
      throw new Error(`Command failed: ${command}`);
    }
  }

  /**
   * Handles the compilation of CSS styles (Sass and Scss).
   */
  #compileStyles() {
    this.#log('Starting CSS compilation phase...', 'info');
    this.#runCommand(this.#config.cssSassCommand);
    this.#runCommand(this.#config.cssScssCommand);
  }

  /**
   * Handles the copying and cleaning of PWA assets.
   */
  #managePwaAssets() {
    const source = this.#config.pwaSourceDir;
    const target = this.#config.pwaTargetDir;
    const temp = this.#config.tempDir;

    if (existsSync(source)) {
      this.#log(`Copying PWA assets from "${source}" to "${target}"...`, 'info');
      mkdirSync(target, { recursive: true });
      cpSync(source, target, { recursive: true });
      rmSync(temp, { recursive: true, force: true });
      this.#log('PWA assets copied and temporary files cleaned successfully!', 'success');
    } else {
      this.#log(`Source directory not found: ${source}`, 'warn');
    }
  }

  /**
   * Orchestrates the entire build pipeline.
   */
  execute() {
    try {
      this.#log('Starting the build process...', 'bright');

      // 1. Compile PWA Service Worker
      this.#runCommand(`npx tsc -p ${this.#config.pwaTsConfig}`);

      // 2. Compile Main TypeScript files
      this.#runCommand(`npx tsc -p ${this.#config.mainTsConfig}`);

      // 3. Compile CSS Styles (Sass/Scss)
      this.#compileStyles();

      // 4. Bundling
      this.#runCommand(this.#config.rollupCommand);
      this.#runCommand(`npx webpack --mode ${this.#config.webpackMode}`);

      // 5. Asset Management
      this.#managePwaAssets();

      this.#log('Build process completed successfully!', 'success');
    } catch (error) {
      this.#log(`Build failed: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// --- Execution Block ---

const buildConfig = {
  pwaTsConfig: resolve('src/v1/libs/router/sw/service/tsconfig.json'),
  mainTsConfig: resolve('tsconfig.json'),
  cssSassCommand: 'node build/sass.mjs',
  cssScssCommand: 'node build/scss.mjs',
  rollupCommand: 'npx rollup -c',
  webpackMode: 'production',
  pwaSourceDir: resolve('dist-sw/src/v1/libs/router/sw/service'),
  pwaTargetDir: resolve('dist/v1/libs/router/sw/service'),
  tempDir: resolve('dist-sw'),
};

const builder = new BuildManager(buildConfig);
builder.execute();
