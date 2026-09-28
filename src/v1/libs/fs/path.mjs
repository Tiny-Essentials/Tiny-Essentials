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
 * @typedef {Object} ParsedPath
 * @property {string} root Root of the path. Always `/`.
 * @property {string} dir Directory of the path.
 * @property {string} base Base name, including the extension.
 * @property {string} ext Extension, including the leading dot.
 * @property {string} name Base name, without the extension.
 */

/**
 * @typedef {Object} PathObject
 * @property {string} [root] Root of the path.
 * @property {string} [dir] Directory of the path.
 * @property {string} [base] Base name, including the extension.
 * @property {string} [ext] Extension, including the leading dot.
 * @property {string} [name] Base name, without the extension.
 */

/**
 * Platform-specific path segment separator. Always `/` in the browser.
 *
 * @type {string}
 */
export const sep = PATH_SEPARATOR;

/**
 * Platform-specific list separator, as used by `PATH`-like variables.
 *
 * @type {string}
 */
export const delimiter = ':';

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

/**
 * Parses a path into its structural components.
 *
 * @param {string} targetPath Source path.
 * @returns {ParsedPath} The parsed components.
 */
export const parse = (targetPath) => {
  const segments = toSegments(targetPath);
  const base = segments.at(-1) ?? '';
  const extension = extname(base);
  return {
    root: PATH_SEPARATOR,
    dir: toAbsolutePath(segments.slice(0, -1)),
    base,
    ext: extension,
    name: extension.length === 0 ? base : base.slice(0, base.length - extension.length),
  };
};

/**
 * Builds a path from its structural components.
 *
 * @param {PathObject} pathObject Components to serialise.
 * @returns {string} The normalised absolute path.
 * @throws {TypeError} When `pathObject` is not a plain object.
 */
export const format = (pathObject) => {
  if (pathObject === null || typeof pathObject !== 'object' || Array.isArray(pathObject)) {
    throw new TypeError('The "pathObject" argument must be of type object');
  }
  const { root, dir, base, ext, name } = pathObject;
  const resolvedBase = base ?? `${name ?? ''}${ext ?? ''}`;
  const resolvedDirectory = dir ?? root ?? ROOT_PATH;
  return normalize(`${resolvedDirectory}${PATH_SEPARATOR}${resolvedBase}`);
};

/**
 * Computes the relative path from one location to another.
 *
 * @param {string} from Source path.
 * @param {string} to Destination path.
 * @returns {string} The relative path, or an empty string when both are equal.
 */
export const relative = (from, to) => {
  const fromSegments = toSegments(from);
  const toSegmentsList = toSegments(to);
  let shared = 0;
  while (
    shared < fromSegments.length &&
    shared < toSegmentsList.length &&
    fromSegments[shared] === toSegmentsList[shared]
  ) {
    shared += 1;
  }
  const upward = new Array(fromSegments.length - shared).fill('..');
  return [...upward, ...toSegmentsList.slice(shared)].join(PATH_SEPARATOR);
};

export { ROOT_PATH };
