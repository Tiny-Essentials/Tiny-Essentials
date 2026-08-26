import { resolve, relative } from 'path';
import { build } from 'vite';

/**
 * @typedef {Object} TinyVitePwaOptions
 * @property {Record<any, any>} manifest - The Web App Manifest object.
 * @property {string} manifestPath - The URL path where the manifest should be served.
 * @property {string} srcDir - The source directory containing the Service Worker.
 * @property {string} filename - The name of the Service Worker file.
 * @property {boolean} [injectRegister=true] - Optional. Whether to automatically inject the SW registration script into the HTML <head>.
 * @property {boolean} [injectManifestToGlobal=true] - Optional. Whether to inject the manifest into the global scope via Vite's `define`.
 */

// ANSI Color Codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Internal logger to maintain consistent plugin output formatting using ANSI colors.
 */
const logger = {
  prefix: `${colors.cyan}[tiny-vite-pwa]${colors.reset}`,
  info: (/** @type {string} */ msg) =>
    console.log(`${logger.prefix} ${colors.blue}[INFO]${colors.reset} ${msg}`),
  success: (/** @type {string} */ msg) =>
    console.log(`${logger.prefix} ${colors.green}[SUCCESS]${colors.reset} ${msg}${colors.reset}`),
  warn: (/** @type {string} */ msg) =>
    console.warn(`${logger.prefix} ${colors.yellow}[WARN]${colors.reset} ${msg}${colors.reset}`),
  error: (/** @type {string} */ msg, /** @type {Error} */ err) =>
    console.error(
      `${logger.prefix} ${colors.red}[ERROR]${colors.reset} ${msg}${colors.reset}`,
      err || '',
    ),
  log: (/** @type {string} */ msg) => console.log(msg),
  dim: (/** @type {string} */ msg) => console.log(`${colors.dim}${msg}${colors.reset}`),
};

/**
 * Custom PWA Plugin.
 * Resolves Manifest, Dev HMR, and Service Worker bundling.
 *
 * NOTE: The Service Worker file is always served from the root directory of the website.
 *
 * TypeScript Support: To enable IntelliSense and avoid type errors when using
 * the injected '__TINY_PWA_MANIFEST__' global variable, add the following to your `env.d.ts` file:
 *
 * ```typescript
 * declare global {
 *   interface Window {
 *     __TINY_PWA_MANIFEST__: Record<string, any>;
 *   }
 * }
 * ```
 *
 * @param {TinyVitePwaOptions} options - The configuration options for the plugin.
 * @returns {import('vite').Plugin} The Vite plugin object.
 */
const tinyVitePwaPlugin = (options) => {
  // --- Strict Runtime Validation ---
  if (typeof options !== 'object' || options === null) {
    throw new TypeError('The "options" argument must be a non-null object.');
  }

  if (typeof options.manifest !== 'object' || options.manifest === null) {
    throw new TypeError('The "manifest" property must be an object.');
  }

  if (typeof options.manifestPath !== 'string') {
    throw new TypeError('The "manifestPath" property must be a string.');
  }

  if (typeof options.srcDir !== 'string') {
    throw new TypeError('The "srcDir" property must be a string.');
  }

  if (typeof options.filename !== 'string') {
    throw new TypeError('The "filename" property must be a string.');
  }

  if (options.injectRegister !== undefined && typeof options.injectRegister !== 'boolean') {
    throw new TypeError('The "injectRegister" property must be a boolean.');
  }

  if (
    options.injectManifestToGlobal !== undefined &&
    typeof options.injectManifestToGlobal !== 'boolean'
  ) {
    throw new TypeError('The "injectManifestToGlobal" property must be a boolean.');
  }

  const { manifest, manifestPath, srcDir, filename } = options;
  const injectRegister = options.injectRegister ?? true;
  const injectManifestToGlobal = options.injectManifestToGlobal ?? true;

  /** @type {string} */
  let swSourcePath;
  /** @type {import('vite').ResolvedConfig} */
  let viteConfig;

  return {
    name: 'tiny-vite-pwa',

    // Capture Vite configuration to use during build mode
    configResolved(config) {
      viteConfig = config;
      swSourcePath = resolve(config.root, srcDir, filename);
    },

    config(config) {
      const define = { ...config.define };
      if (injectManifestToGlobal) define.__TINY_PWA_MANIFEST__ = JSON.stringify(manifest);
      return { ...config, define };
    },

    // REQUIREMENTS 1 & 4 (DEV Mode): Serve the manifest and the Service Worker
    configureServer(server) {
      // Extract server info to build a clickable URL
      const serverConfig = server.config.server || {};
      let host = serverConfig.host;
      if (host === true) {
        host = '0.0.0.0';
      } else if (typeof host !== 'string') {
        host = 'localhost';
      }

      const port = serverConfig.port;
      const isHttps = serverConfig.https ? true : false;

      const protocol = isHttps ? 'https' : 'http';

      // If host is 0.0.0.0, use localhost so the link is clickable in the terminal
      const displayHost = host === '0.0.0.0' ? 'localhost' : host;
      const baseUrl = `${protocol}://${displayHost}:${port}`;

      const normalizedManifestPath = manifestPath.startsWith('/')
        ? manifestPath
        : `/${manifestPath}`;
      const swUrl = `/${filename}`;

      server.middlewares.use(async (req, res, next) => {
        // Serve manifest.json dynamically
        if (req.url === normalizedManifestPath) {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(manifest, null, 2));
          return;
        }

        // Serve the Service Worker in Dev mode using Vite's transformer
        if (req.url === `/${filename}`) {
          try {
            const transformed = await server.transformRequest(swSourcePath);
            if (transformed) {
              res.setHeader('Content-Type', 'application/javascript');
              res.end(transformed.code);
              return;
            }
          } catch (e) {
            logger.error(
              'Error transforming the SW in dev:',
              e instanceof Error ? e : new Error('Unknown Error'),
            );
          }
        }
        next();
      });

      logger.success(`Manifest available at: ${baseUrl}${normalizedManifestPath}`);
      logger.success(`Service Worker available at: ${baseUrl}${swUrl}`);

      // Warning regarding client-side routing interception
      logger.warn(
        `NOTE: If your Service Worker implements client-side routing, ensure it is configured to bypass interception for the manifest and SW files. Improper routing configuration may cause 404 errors in the browser, even though the server is serving the files correctly.`,
      );
    },

    // REQUIREMENT 3: Monitor SW changes and notify the frontend
    handleHotUpdate({ file, server }) {
      if (file.startsWith(resolve(viteConfig.root, srcDir))) {
        logger.info('Service Worker change detected. Notifying frontend...');
        // Send a custom event via Vite's WebSocket
        server.ws.send({
          type: 'custom',
          event: 'pwa:sw-updated',
          data: { message: 'The Service Worker file has been changed.' },
        });

        // Return an empty array so Vite does not attempt a full page reload automatically
        return [];
      }
    },

    // INJECT HTML SCRIPT: Inject the SW registration code into the output HTML
    transformIndexHtml() {
      if (!injectRegister) return;

      // In production mode, we append a timestamp to the URL to force cache busting.
      // In development mode, we omit the timestamp to avoid generating unnecessary logs on every reload.
      const isBuild = viteConfig && viteConfig.command === 'build';
      const versionQuery = isBuild ? `?v=${Date.now()}` : '';
      const swUrl = `/${filename}${versionQuery}`;

      logger.info(`Injecting Service Worker registration script into HTML (URL: ${swUrl})`);

      return [
        {
          tag: 'script',
          injectTo: 'head',
          children: `if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('${swUrl}', { type: 'classic' })${!isBuild ? `.then(() => console.log('[tiny-vite-pwa] SW registered.')).catch(err => console.error('[tiny-vite-pwa] SW error:', err))` : ''}; }); }`,
        },
      ];
    },

    // REQUIREMENT 1 (PROD Mode): Save the manifest to the dist directory
    generateBundle() {
      // Remove the leading slash from the path to prevent Rollup errors
      const emitPath = manifestPath.replace(/^\//, '');
      this.emitFile({
        type: 'asset',
        fileName: emitPath,
        source: JSON.stringify(manifest),
      });
    },

    // REQUIREMENT 4 (PROD Mode): Bundle the Service Worker separately
    async closeBundle() {
      // Only run this during the build command (production)
      if (viteConfig.command === 'build') {
        const projectRoot = viteConfig.root || process.cwd();

        const relativeSourceSW = relative(projectRoot, swSourcePath);
        const relativeDestSW = relative(projectRoot, resolve(viteConfig.build.outDir, filename));

        const manifestDestPath = resolve(viteConfig.build.outDir, manifestPath.replace(/^\//, ''));
        const relativeDestManifest = relative(projectRoot, manifestDestPath);

        logger.info('Initiating Service Worker bundling process...');

        logger.dim('--------------------------------------------------');
        logger.log(` Mode:       ${colors.bright}${viteConfig.mode}${colors.reset}`);

        // Manifest Info
        logger.log(
          ` Manifest:   ${colors.cyan}${relativeDestManifest}${colors.reset} (from [Config Object])`,
        );

        // Service Worker Info
        logger.log(` SW Source:  ${colors.cyan}${relativeSourceSW}${colors.reset}`);
        logger.log(` SW Dest:    ${colors.cyan}${relativeDestSW}${colors.reset}`);

        logger.dim('--------------------------------------------------');

        try {
          await build({
            configFile: false, // Ignore the main vite.config.js to prevent infinite loops
            mode: viteConfig.mode,
            build: {
              outDir: viteConfig.build.outDir,
              emptyOutDir: false, // IMPORTANT: Do not delete the React build that was just completed
              lib: {
                entry: swSourcePath,
                name: 'ServiceWorker',
                formats: ['iife'], // IIFE bundles all imports into a single file (classic SW standard)
                fileName: () => filename,
              },
              rollupOptions: {
                // Ensures no hashes are added to the SW filename
                output: {
                  entryFileNames: filename,
                },
              },
            },
          });
          logger.success('Service Worker bundled successfully.');
        } catch (e) {
          logger.error(
            'Failed to bundle the Service Worker.',
            e instanceof Error ? e : new Error('Unknown Error'),
          );
        }
      }
    },
  };
};

export default tinyVitePwaPlugin;
