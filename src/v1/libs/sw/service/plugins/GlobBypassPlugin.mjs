import { TinyPluginLayer } from '../../../plugin/TinyPlugin.mjs';
import { isJsonObject } from '../../../../basics/objChecker.mjs';
import { compileGlobRegExp } from '../../../../regexp/Glob.mjs';
import TinyServiceWorkerEngine from '../TinyServiceWorkerEngine.mjs';

/**
 * Configuration options for the GlobBypassPlugin.
 * @typedef {Object} GlobBypassOptions
 * @property {string[]} patterns - Array of glob patterns (e.g., ['\*\*\/*.js', '\*\*\/\*.{css,html}']) that, when matched, make the request bypass the router validation.
 * @property {string[]} [exclude] - Array of glob patterns to ignore (e.g., ['**\/sw.js']).
 * @property {boolean} [sameOriginOnly=true] - When true, only same-origin requests are evaluated.
 * @property {boolean} [devOnly=false] - When true, the bypass is only registered in development mode.
 */

/**
 * A plugin for TinyServiceWorkerEngine that bypasses the router validation for
 * every request whose pathname matches one of the provided glob patterns.
 *
 * @type {import('../TinyServiceWorkerEngine.mjs').SwPluginInstaller<TinyPluginLayer, 'GlobBypass', '1.0.0', [GlobBypassOptions]>}
 * @throws {TypeError} If the engine is invalid or if the provided options do not match the required schema.
 */
const GlobBypassPlugin = (instance, options) => {
  const engine = instance.engine;
  instance.id = 'GlobBypass';
  instance.version = '1.0.0';
  instance.description = 'Glob-based router bypass detector.';
  instance.authors = ['JasminDreasond'];
  instance.contributors = ['JasminDreasond'];
  instance.categories = ['router-validator'];
  instance.tags = ['glob', 'regex', 'bypass', 'router'];

  // 1. Validation
  if (!(engine instanceof TinyServiceWorkerEngine)) {
    throw new TypeError('Plugin requires a TinyServiceWorkerEngine instance to function.');
  }

  if (!isJsonObject(options)) {
    throw new TypeError('[GlobBypassPlugin] Options must be a non-null object.');
  }
  if (!Array.isArray(options.patterns) || !options.patterns.every((p) => typeof p === 'string')) {
    throw new TypeError('[GlobBypassPlugin] options.patterns must be an array of strings.');
  }
  if (
    typeof options.exclude !== 'undefined' &&
    (!Array.isArray(options.exclude) || !options.exclude.every((p) => typeof p === 'string'))
  ) {
    throw new TypeError('[GlobBypassPlugin] options.exclude must be an array of strings.');
  }
  if (
    typeof options.sameOriginOnly !== 'undefined' &&
    typeof options.sameOriginOnly !== 'boolean'
  ) {
    throw new TypeError('[GlobBypassPlugin] options.sameOriginOnly must be a boolean.');
  }
  if (typeof options.devOnly !== 'undefined' && typeof options.devOnly !== 'boolean') {
    throw new TypeError('[GlobBypassPlugin] options.devOnly must be a boolean.');
  }

  const { patterns, exclude, sameOriginOnly = true, devOnly = false } = options;

  // 2. Implementation
  // @ts-ignore
  if (!devOnly) {
    // Pre-compile exclusion patterns into Regex for performance
    const excludeRegexes = (exclude || []).map((pattern) => compileGlobRegExp(pattern));

    for (const pattern of patterns) {
      const regex = compileGlobRegExp(pattern);
      engine.addFetchRegExpListener(regex.source, (fetchObj, response) => {
        if (sameOriginOnly && !fetchObj.isSameOrigin) {
          return; // Skip cross-origin requests
        }

        // Check if the current URL matches any exclusion pattern
        if (excludeRegexes.some((re) => re.test(fetchObj.url.pathname))) {
          return; // Skip excluded requests
        }

        // Bypass the router validation for the matched request
        instance.log('info', `File detected: ${fetchObj.url.toString()}`);
        response.continueCheck = false;
        response.needValidation = false;
        response.code = 200;
      });
    }
  }

  return new TinyPluginLayer();
};

export default GlobBypassPlugin;
