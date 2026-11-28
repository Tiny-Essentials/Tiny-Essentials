#!/usr/bin/env node
/**
 * @fileoverview Removes every `node_modules` folder found inside a directory tree.
 *
 * The build copies the `webTemplates` projects (which have their own
 * `node_modules`) into `dist`, and those dependencies must never be published.
 * This module is used at the end of `build.mjs` and can also be executed
 * manually:
 *
 *   node build/cleanNodeModules.mjs [dir] [--dry-run] [--quiet]
 *
 * Exit codes:
 *   0 - Nothing to remove or everything removed successfully.
 *   1 - At least one folder could not be removed.
 *   2 - Invalid usage.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Name of the folders that must be removed. */
export const TARGET_DIRECTORY_NAME = 'node_modules';

/**
 * Recursively collects every `node_modules` directory inside `dir`.
 *
 * The recursion never enters a `node_modules` folder: the whole folder is
 * removed, so there is no point in walking into it.
 *
 * @param {string} dir - Directory that will be scanned.
 * @param {string[]} [found] - Accumulator used by the recursion.
 * @returns {string[]} Absolute paths of the `node_modules` folders.
 */
export function findNodeModules(dir, found = []) {
  /** @type {import('node:fs').Dirent[]} */
  let entries;

  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return found;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const absolute = path.join(dir, entry.name);

    if (entry.name === TARGET_DIRECTORY_NAME) {
      found.push(absolute);
      continue;
    }

    findNodeModules(absolute, found);
  }

  return found;
}

/**
 * Removes every `node_modules` folder inside `dir`.
 *
 * @param {string} dir - Directory that will be cleaned.
 * @param {Object} [options]
 * @param {boolean} [options.dryRun=false] - Only report what would be removed.
 * @param {(message: string) => void} [options.onRemove] - Called for each removal.
 * @returns {string[]} Absolute paths of the removed (or that would be removed) folders.
 * @throws {TypeError} If `dir` is not a non-empty string.
 */
export function removeNodeModules(dir, { dryRun = false, onRemove } = {}) {
  if (typeof dir !== 'string' || dir.trim() === '') {
    throw new TypeError('The "dir" argument must be a non-empty string.');
  }

  const absoluteDir = path.resolve(dir);

  if (!fs.existsSync(absoluteDir)) return [];

  const folders = findNodeModules(absoluteDir);

  for (const folder of folders) {
    if (!dryRun) fs.rmSync(folder, { recursive: true, force: true });
    if (onRemove) onRemove(folder);
  }

  return folders;
}

// --- CLI ---

const isMain = (() => {
  if (!process.argv[1]) return false;

  try {
    return fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
})();

if (isMain) {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const quiet = args.includes('--quiet');
  const target = args.find((arg) => !arg.startsWith('-')) ?? 'dist';

  if (!fs.existsSync(target)) {
    console.error(`[clean-node-modules] Folder not found: ${path.resolve(target)}`);
    process.exit(2);
  }

  const removed = removeNodeModules(target, {
    dryRun,
    onRemove: (folder) => {
      if (!quiet)
        console.log(`[clean-node-modules] ${dryRun ? 'would remove' : 'removed'} ${folder}`);
    },
  });

  if (!quiet) {
    const verb = dryRun ? 'found' : 'removed';
    console.log(`[clean-node-modules] ${removed.length} node_modules folder(s) ${verb}.`);
  }

  process.exitCode = 0;
}
