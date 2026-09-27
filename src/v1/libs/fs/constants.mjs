/**
 * @file Numeric constants shared by every {@link FS} backend.
 */

/** @type {Readonly<Record<string, number>>} */
export const constants = Object.freeze({
  F_OK: 0,
  R_OK: 4,
  W_OK: 2,
  X_OK: 1,
  COPYFILE_EXCL: 1,
  COPYFILE_FICLONE: 2,
  COPYFILE_FICLONE_FORCE: 4,
  O_RDONLY: 0,
  O_WRONLY: 1,
  O_RDWR: 2,
  O_CREAT: 64,
  O_EXCL: 128,
  O_TRUNC: 512,
  O_APPEND: 1024,
});

/** @type {Readonly<Record<string, number>>} */
export const PERMISSION = Object.freeze({
  OWNER_READ: 0o400,
  OWNER_WRITE: 0o200,
  OWNER_EXECUTE: 0o100,
  GROUP_READ: 0o040,
  GROUP_WRITE: 0o020,
  GROUP_EXECUTE: 0o010,
  OTHER_READ: 0o004,
  OTHER_WRITE: 0o002,
  OTHER_EXECUTE: 0o001,
  SETUID: 0o4000,
  SETGID: 0o2000,
  STICKY: 0o1000,
});

/** @type {Readonly<Record<string, number>>} */
export const FILE_TYPE = Object.freeze({
  FILE: 0o100000,
  DIRECTORY: 0o040000,
  SYMBOLIC_LINK: 0o120000,
});

/** @type {number} */
export const DEFAULT_FILE_MODE = 0o666;

/** @type {number} */
export const DEFAULT_DIRECTORY_MODE = 0o777;

/** @type {number} */
export const DEFAULT_UMASK = 0o022;

/** @type {string} */
export const ROOT_PATH = '/';

/** @type {string} */
export const PATH_SEPARATOR = '/';

/** @type {readonly string[]} */
export const SUPPORTED_ENCODINGS = Object.freeze(['utf8', 'utf-8', 'base64', 'hex']);
