/**
 * @file Pure POSIX-like path helpers.
 *
 * OPFS has no symbolic links, therefore `.` and `..` can be resolved
 * lexically without touching the file system.
 *
 * @remarks
 * The public API mirrors `node:path` from the Node.js project, used here
 * as the reference specification. Node.js is distributed under the MIT
 * license.
 *
 * @see {@link https://nodejs.org/api/path.html}
 */

import { PATH_SEPARATOR, ROOT_PATH } from './constants.mjs';

/**
 * Splits a POSIX-like path into normalised segments.
 *
 * @param {string} targetPath Path to normalise.
 * @returns {string[]} The normalised segments, without empty entries.
 */
export const toSegments = (targetPath) => {
  /** @type {string[]} */
  const segments = [];
  for (const segment of targetPath.split(PATH_SEPARATOR)) {
    if (segment.length === 0 || segment === '.') {
      continue;
    }
    if (segment === '..') {
      segments.pop();
      continue;
    }
    segments.push(segment);
  }
  return segments;
};

/**
 * Rebuilds an absolute path from normalised segments.
 *
 * @param {string[]} segments Normalised segments.
 * @returns {string} An absolute path starting with `/`.
 */
export const toAbsolutePath = (segments) => PATH_SEPARATOR + segments.join(PATH_SEPARATOR);

/**
 * Normalises a path.
 *
 * @param {string} targetPath Path to normalise.
 * @returns {string} The normalised absolute path.
 */
export const normalize = (targetPath) => toAbsolutePath(toSegments(targetPath));

/**
 * Joins path fragments and normalises the result.
 *
 * @param {string[]} parts Path fragments.
 * @returns {string} The joined absolute path.
 */
export const join = (...parts) => normalize(parts.join(PATH_SEPARATOR));

/**
 * Returns the parent directory of a path.
 *
 * @param {string} targetPath Source path.
 * @returns {string} The parent directory.
 */
export const dirname = (targetPath) => {
  const segments = toSegments(targetPath);
  segments.pop();
  return toAbsolutePath(segments);
};

/**
 * Returns the last segment of a path.
 *
 * @param {string} targetPath Source path.
 * @param {string} [extension] Extension removed from the result.
 * @returns {string} The base name.
 */
export const basename = (targetPath, extension) => {
  const segments = toSegments(targetPath);
  const name = segments.at(-1) ?? '';
  if (extension !== undefined && name.endsWith(extension)) {
    return name.slice(0, name.length - extension.length);
  }
  return name;
};

/**
 * Returns the extension of a path, including the leading dot.
 *
 * @param {string} targetPath Source path.
 * @returns {string} The extension, or an empty string.
 */
export const extname = (targetPath) => {
  const name = basename(targetPath);
  const index = name.lastIndexOf('.');
  return index <= 0 ? '' : name.slice(index);
};

/**
 * Reports whether a path is absolute.
 *
 * @param {string} targetPath Source path.
 * @returns {boolean} `true` when the path starts with a slash.
 */
export const isAbsolute = (targetPath) => targetPath.startsWith(PATH_SEPARATOR);

/**
 * Resolves a sequence of path fragments against a working directory.
 *
 * @param {string} cwd Working directory used for relative fragments.
 * @param {string[]} parts Path fragments.
 * @returns {string} The resolved absolute path.
 */
export const resolve = (cwd, ...parts) => {
  const [first, ...rest] = parts;
  if (first === undefined) {
    return normalize(cwd);
  }
  const base = isAbsolute(first) ? first : `${cwd}${PATH_SEPARATOR}${first}`;
  return resolve(base, ...rest);
};

export { ROOT_PATH };
