/**
 * @fileoverview ESM resolve hooks used by the Node.js test-suite.
 *
 * Every project inside `src/v1/webTemplates/**` is self-contained: it has its
 * own `package.json` and its own `node_modules` (multiformats, ag-psd, vite,
 * sharp, ...). Those packages are intentionally **not** installed in the root
 * `node_modules`, because they are only required by the project that lives next
 * to them.
 *
 * That breaks the test-suite in two different ways:
 *
 * 1. The compiled files in `dist/v1/webTemplates/**` keep their bare imports
 *    (`multiformats/cid`, `ag-psd`, ...), but `node_modules` is never copied to
 *    `dist` (and it must not be, since `dist` is a disposable build artifact).
 * 2. Some tests import those third-party packages directly
 *    (e.g. `test/libs/MediaValidator.mjs`), so the dependency has to be found
 *    from the test folder as well.
 *
 * The hooks below solve both cases without touching the compiled output:
 *
 * - a failing resolution coming from `dist/v1/webTemplates/**` is retried from
 *   the mirrored path inside `src/v1/webTemplates/**`, where the dependency is
 *   actually installed;
 * - a bare specifier that cannot be resolved at all is looked up inside every
 *   `node_modules` folder that belongs to a `webTemplates` project.
 *
 * Two flavours of the hook are exported so the same logic can run on every
 * supported Node.js version:
 *
 * - {@link resolve} is synchronous and is meant to be used with
 *   `module.registerHooks()` (Node.js >= 22.15 / 23.5);
 * - {@link resolveAsync} is the `async` counterpart used with the older
 *   `module.register()` API (Node.js >= 20.6), where `nextResolve()` returns a
 *   promise.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/** Absolute path of the `dist/v1/webTemplates` directory. */
const DIST_WEB_TEMPLATES = fileURLToPath(new URL('../dist/v1/webTemplates/', import.meta.url));

/** Absolute path of the `src/v1/webTemplates` directory. */
const SRC_WEB_TEMPLATES = fileURLToPath(new URL('../src/v1/webTemplates/', import.meta.url));

/**
 * Returns `true` when the specifier points to a package (or a Node.js builtin)
 * instead of a relative/absolute path.
 *
 * @param {string} specifier - The imported specifier.
 * @returns {boolean}
 */
function isBareSpecifier(specifier) {
  return !specifier.startsWith('.') && !specifier.startsWith('/') && !path.isAbsolute(specifier);
}

/**
 * Translates a `dist/v1/webTemplates/**` URL into the equivalent
 * `src/v1/webTemplates/**` URL.
 *
 * @param {string | undefined} parentURL - The importer URL provided by Node.js.
 * @returns {string | null} The mirrored source URL, or `null` when the importer
 * is not inside `dist/v1/webTemplates`.
 */
function toSourceURL(parentURL) {
  if (!parentURL || !parentURL.startsWith('file:')) return null;

  let parentPath;
  try {
    parentPath = fileURLToPath(parentURL);
  } catch {
    return null;
  }

  const relativePath = path.relative(DIST_WEB_TEMPLATES, parentPath);
  if (!relativePath || relativePath.startsWith('..') || path.isAbsolute(relativePath)) return null;

  return pathToFileURL(path.join(SRC_WEB_TEMPLATES, relativePath)).href;
}

/**
 * Cached list of every `node_modules` folder that belongs to a `webTemplates`
 * project. The folder structure does not change while the test-suite runs.
 *
 * @type {string[] | null}
 */
let cachedModuleDirectories = null;

/**
 * @returns {string[]} The absolute paths of the nested `node_modules` folders.
 */
function getModuleDirectories() {
  if (cachedModuleDirectories) return cachedModuleDirectories;

  /** @type {string[]} */
  const directories = [];

  /**
   * @param {string} dir - Directory to scan.
   * @param {number} depth - Current recursion depth.
   */
  const walk = (dir, depth) => {
    if (depth > 6) return;

    /** @type {import('node:fs').Dirent[]} */
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.name === 'node_modules') {
        directories.push(fullPath);
        continue;
      }
      if (entry.name.startsWith('.')) continue;
      walk(fullPath, depth + 1);
    }
  };

  walk(SRC_WEB_TEMPLATES, 0);
  cachedModuleDirectories = directories;
  return directories;
}

/**
 * Tries to resolve a bare specifier from one of the nested `node_modules`
 * folders that live inside `src/v1/webTemplates`.
 *
 * @param {string} specifier - The bare specifier to resolve.
 * @returns {string | null} The resolved `file:` URL, or `null` when not found.
 */
function resolveFromWebTemplates(specifier) {
  for (const moduleDirectory of getModuleDirectories()) {
    try {
      const require = createRequire(path.join(moduleDirectory, 'noop.cjs'));
      return pathToFileURL(require.resolve(specifier)).href;
    } catch {
      // Not available in this folder: try the next one.
    }
  }

  return null;
}

/**
 * Tries to resolve a bare specifier from a `webTemplates` project.
 *
 * @param {string} specifier - The bare specifier to resolve.
 * @returns {{ url: string, shortCircuit: true } | null}
 */
function resolveBareSpecifier(specifier) {
  if (!isBareSpecifier(specifier)) return null;
  const url = resolveFromWebTemplates(specifier);
  return url ? { url, shortCircuit: true } : null;
}

/**
 * Node.js ESM resolve hook (synchronous flavour).
 *
 * It first tries the default resolution. Only when it fails does it fall back
 * to the `webTemplates` aware strategies, which keeps the behaviour of every
 * other file in the repository completely untouched.
 *
 * Requires `module.registerHooks()`, available on Node.js >= 22.15 / 23.5.
 * Use {@link resolveAsync} on older releases.
 *
 * @type {import('node:module').ResolveHookSync}
 */
export function resolve(specifier, context, nextResolve) {
  try {
    return nextResolve(specifier, context);
  } catch (error) {
    // 1. `dist/v1/webTemplates/**` -> `src/v1/webTemplates/**`
    const parentURL = toSourceURL(context.parentURL);
    if (parentURL) {
      try {
        return nextResolve(specifier, { ...context, parentURL });
      } catch {
        // Fall through to the package lookup below.
      }
    }

    // 2. Bare specifier that only exists inside a `webTemplates` project.
    const resolved = resolveBareSpecifier(specifier);
    if (resolved) return resolved;

    throw error;
  }
}

/**
 * Node.js ESM resolve hook (asynchronous flavour).
 *
 * Same behaviour as {@link resolve}, but compatible with the `module.register()`
 * loader API (Node.js >= 20.6), where `nextResolve()` returns a promise.
 *
 * @type {import('node:module').ResolveHook}
 */
export async function resolveAsync(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    // 1. `dist/v1/webTemplates/**` -> `src/v1/webTemplates/**`
    const parentURL = toSourceURL(context.parentURL);
    if (parentURL) {
      try {
        return await nextResolve(specifier, { ...context, parentURL });
      } catch {
        // Fall through to the package lookup below.
      }
    }

    // 2. Bare specifier that only exists inside a `webTemplates` project.
    const resolved = resolveBareSpecifier(specifier);
    if (resolved) return resolved;

    throw error;
  }
}
