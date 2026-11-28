#!/usr/bin/env node
/**
 * @fileoverview Compares the hash of every file inside `dist` with a reference
 * copy of the build (a clone of the folder) and reports exactly which files are
 * different and where the difference starts.
 *
 * Usage:
 *   node build/verifyHash.mjs <referenceDir> [options]
 *
 * Any directory named `build` (for example `v1/build`) is always skipped on both
 * sides, because it is never part of the published output.
 *
 * Options:
 *   --dist <dir>          Folder that will be verified. Default: `dist`.
 *   --algorithm <name>    Hash algorithm. Default: `sha256`.
 *   --ignore <glob>       Skip paths matching the glob (repeatable).
 *   --concurrency <n>     How many files are hashed in parallel. Default: 8.
 *   --context <n>         Bytes shown around the first difference. Default: 24.
 *   --no-diff             Do not inspect the file contents, only the hashes.
 *   --json                Print the report as JSON.
 *   --quiet               Only print the summary and the problems.
 *   --no-color            Disable ANSI colors.
 *   --help                Show this message.
 *
 * Exit codes:
 *   0 - Every file is identical.
 *   1 - At least one file is different, missing or extra.
 *   2 - Invalid usage or I/O error.
 *
 * Examples:
 *   node build/verifyHash.mjs ../Tiny-Essentials-clone/dist
 *   node build/verifyHash.mjs ../clone/dist --algorithm sha512 --ignore "**\/*.map"
 *   node build/verifyHash.mjs ../clone/dist --json > report.json
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Absolute path of the repository root. */
const ROOT_DIR = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

/** Size of the chunks used while scanning files. */
const CHUNK_SIZE = 64 * 1024;

/**
 * Directory names that are always skipped, no matter where they appear.
 * `build` folders are never part of the published output, so they must not
 * influence the comparison.
 */
const IGNORED_DIRECTORY_NAMES = new Set(['build']);

/** Status of a file that exists on both sides with the same hash. */
const STATUS = {
  identical: 'identical',
  different: 'different',
  missingInReference: 'missing-in-reference',
  missingInDist: 'missing-in-dist',
};

/** @type {Record<string, string>} */
const COLORS = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * @typedef {Object} Options
 * @property {string} reference - Reference directory informed by the user.
 * @property {string} dist - Directory that will be verified.
 * @property {string} algorithm - Hash algorithm name.
 * @property {string[]} ignore - Glob patterns that must be skipped.
 * @property {number} concurrency - Amount of files hashed in parallel.
 * @property {number} context - Bytes shown around the first difference.
 * @property {boolean} diff - Inspect the file contents to locate the difference.
 * @property {boolean} json - Print the report as JSON.
 * @property {boolean} quiet - Only print the summary and the problems.
 * @property {boolean} color - Use ANSI colors.
 * @property {boolean} help - Print the help message.
 */

/**
 * @typedef {Object} FileEntry
 * @property {string} absolute - Absolute path of the file.
 * @property {number} size - File size in bytes.
 */

/**
 * @typedef {Object} SideDetail
 * @property {number} line - 1-based line number of the first difference.
 * @property {number} column - 1-based column of the first difference.
 * @property {string} preview - Hex/ASCII preview around the difference.
 * @property {string | null} lineText - Full line content (truncated) or null.
 */

/**
 * @typedef {Object} DifferenceDetail
 * @property {number} offset - Byte offset of the first difference.
 * @property {SideDetail} dist - Details of the verified file.
 * @property {SideDetail} reference - Details of the reference file.
 */

/**
 * @typedef {Object} FileResult
 * @property {string} relative - Path relative to the compared roots (posix style).
 * @property {string} status - One of {@link STATUS}.
 * @property {FileEntry} [dist]
 * @property {FileEntry} [reference]
 * @property {string} [distHash]
 * @property {string} [referenceHash]
 * @property {DifferenceDetail} [detail]
 */

/**
 * Converts a path to the posix format, so reports are stable across platforms.
 *
 * @param {string} value
 * @returns {string}
 */
const toPosix = (value) => value.split(path.sep).join('/');

/**
 * Creates the colorizer used by the report.
 *
 * @param {boolean} enabled
 * @returns {(color: keyof typeof COLORS, value: string) => string}
 */
function createPainter(enabled) {
  return (color, value) => (enabled ? `${COLORS[color]}${value}${COLORS.reset}` : value);
}

/**
 * Converts a small glob subset (`*`, `**`, `?`) into a RegExp.
 *
 * @param {string} glob
 * @returns {RegExp}
 */
function globToRegExp(glob) {
  const normalized = glob.replace(/\\/g, '/').replace(/^\.\//, '');
  let source = '';

  for (let index = 0; index < normalized.length; index++) {
    const char = normalized[index];

    if (char === '*') {
      if (normalized[index + 1] === '*') {
        index += 1;
        if (normalized[index + 1] === '/') {
          index += 1;
          source += '(?:.*/)?';
        } else {
          source += '.*';
        }
      } else {
        source += '[^/]*';
      }
      continue;
    }

    if (char === '?') {
      source += '[^/]';
      continue;
    }

    source += char.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }

  return new RegExp(`^${source}$`);
}

/**
 * @param {string} value
 * @returns {string}
 */
function formatBytes(value) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KiB`;
  return `${(value / (1024 * 1024)).toFixed(2)} MiB`;
}

/**
 * Renders a buffer as `hex  |ascii|` so the difference is visible in the terminal.
 *
 * @param {Buffer} buffer
 * @returns {string}
 */
function formatBuffer(buffer) {
  if (buffer.length === 0) return '(empty)';

  const hex = [...buffer].map((byte) => byte.toString(16).padStart(2, '0')).join(' ');
  const ascii = [...buffer]
    .map((byte) => (byte >= 0x20 && byte <= 0x7e ? String.fromCharCode(byte) : '.'))
    .join('');

  return `${hex}  |${ascii}|`;
}

/**
 * @param {string} value
 * @param {number} max
 * @returns {string}
 */
function truncate(value, max = 160) {
  const single = value.replace(/\r?\n$/, '');
  return single.length > max ? `${single.slice(0, max)}…` : single;
}

/**
 * @param {string} message
 * @returns {never}
 */
function usageError(message) {
  const error = new Error(message);
  error.name = 'UsageError';
  throw error;
}

/**
 * @param {string[]} argv
 * @returns {Options}
 */
function parseArgs(argv) {
  /** @type {Options} */
  const options = {
    reference: '',
    dist: 'dist',
    algorithm: 'sha256',
    ignore: [],
    concurrency: 8,
    context: 24,
    diff: true,
    json: false,
    quiet: false,
    color: Boolean(process.stdout.isTTY) && !process.env.NO_COLOR,
    help: false,
  };

  /** @type {string[]} */
  const positional = [];

  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];

    /**
     * @param {string} name
     * @returns {string}
     */
    const readValue = (name) => {
      const value = argv[index + 1];
      if (value === undefined || value.startsWith('--')) usageError(`Missing value for ${name}.`);
      index += 1;
      return value;
    };

    switch (arg) {
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--dist':
        options.dist = readValue('--dist');
        break;
      case '--algorithm':
      case '--algo':
        options.algorithm = readValue('--algorithm');
        break;
      case '--ignore':
        options.ignore.push(readValue('--ignore'));
        break;
      case '--concurrency':
        options.concurrency = Number(readValue('--concurrency'));
        break;
      case '--context':
        options.context = Number(readValue('--context'));
        break;
      case '--no-diff':
        options.diff = false;
        break;
      case '--json':
        options.json = true;
        break;
      case '--quiet':
        options.quiet = true;
        break;
      case '--no-color':
        options.color = false;
        break;
      default:
        if (arg.startsWith('-')) usageError(`Unknown option: ${arg}`);
        positional.push(arg);
    }
  }

  if (options.help) return options;

  if (positional.length === 0) {
    usageError(
      'You must inform the reference directory.\n\n  node build/verifyHash.mjs <referenceDir>',
    );
  }

  if (positional.length > 1) usageError(`Unexpected arguments: ${positional.slice(1).join(' ')}`);

  if (!Number.isFinite(options.concurrency) || options.concurrency < 1) {
    usageError('--concurrency must be a positive number.');
  }

  if (!Number.isFinite(options.context) || options.context < 0) {
    usageError('--context must be zero or a positive number.');
  }

  options.reference = positional[0];
  options.ignore = options.ignore.map((pattern) => pattern.replace(/\\/g, '/'));

  return options;
}

/**
 * @returns {void}
 */
function printHelp() {
  console.log(`
Usage: node build/verifyHash.mjs <referenceDir> [options]

Compares the hash of every file inside the build folder with a reference copy
of the same folder and reports which files are different and where.

Options:
  --dist <dir>         Folder that will be verified. Default: dist
  --algorithm <name>   Hash algorithm. Default: sha256
  --ignore <glob>      Skip paths matching the glob (repeatable)
  --concurrency <n>    Files hashed in parallel. Default: 8
  --context <n>        Bytes shown around the first difference. Default: 24
  --no-diff           Only compare the hashes, do not inspect the contents
  --json               Print the report as JSON
  --quiet              Only print the summary and the problems
  --no-color           Disable ANSI colors
  --help               Show this message

Directories named "build" are always ignored on both sides.

Exit codes:
  0  Every file is identical
  1  At least one file is different, missing or extra
  2  Invalid usage or I/O error
`);
}

/**
 * Recursively lists every file of a directory.
 *
 * @param {string} baseDir - Directory that will be scanned.
 * @param {RegExp[]} ignore - Patterns that must be skipped.
 * @returns {Promise<Map<string, FileEntry>>} Files indexed by their relative posix path.
 */
async function listFiles(baseDir, ignore) {
  /** @type {Map<string, FileEntry>} */
  const files = new Map();

  /**
   * @param {string} current
   * @returns {Promise<void>}
   */
  const visit = async (current) => {
    const entries = await fs.readdir(current, { withFileTypes: true });
    entries.sort((a, b) => a.name.localeCompare(b.name));

    for (const entry of entries) {
      const absolute = path.join(current, entry.name);
      const relative = toPosix(path.relative(baseDir, absolute));

      if (ignore.some((pattern) => pattern.test(relative))) continue;

      if (entry.isDirectory()) {
        // Folders such as `v1/build` are never part of the published output, so
        // they are pruned before being walked into.
        if (IGNORED_DIRECTORY_NAMES.has(entry.name.toLowerCase())) continue;
        await visit(absolute);
        continue;
      }

      // Symbolic links and special files are intentionally skipped: the goal is
      // to compare the real build output only.
      if (!entry.isFile()) continue;

      const stats = await fs.stat(absolute);
      files.set(relative, { absolute, size: stats.size });
    }
  };

  await visit(baseDir);

  return files;
}

/**
 * @param {string} absolutePath
 * @param {string} algorithm
 * @returns {Promise<string>} The hex digest of the file.
 */
function hashFile(absolutePath, algorithm) {
  return new Promise((resolve, reject) => {
    const hash = createHash(algorithm);
    const stream = createReadStream(absolutePath);

    stream.on('error', reject);
    stream.on('data', (chunk) => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

/**
 * Finds the offset of the first byte that differs between two files.
 *
 * @param {string} firstPath
 * @param {string} secondPath
 * @returns {Promise<number>} The offset or -1 when both files are identical.
 */
async function findFirstDifference(firstPath, secondPath) {
  const [first, second] = await Promise.all([fs.open(firstPath, 'r'), fs.open(secondPath, 'r')]);

  try {
    const firstBuffer = Buffer.allocUnsafe(CHUNK_SIZE);
    const secondBuffer = Buffer.allocUnsafe(CHUNK_SIZE);
    let offset = 0;

    for (;;) {
      const [firstRead, secondRead] = await Promise.all([
        first.read(firstBuffer, 0, CHUNK_SIZE, offset),
        second.read(secondBuffer, 0, CHUNK_SIZE, offset),
      ]);

      const comparable = Math.min(firstRead.bytesRead, secondRead.bytesRead);

      for (let index = 0; index < comparable; index++) {
        if (firstBuffer[index] !== secondBuffer[index]) return offset + index;
      }

      if (firstRead.bytesRead !== secondRead.bytesRead) return offset + comparable;
      if (firstRead.bytesRead === 0) return -1;

      offset += firstRead.bytesRead;
    }
  } finally {
    await Promise.all([first.close(), second.close()]);
  }
}

/**
 * Reads a small window of the file, used to preview the difference.
 *
 * @param {string} absolutePath
 * @param {number} offset
 * @param {number} length
 * @returns {Promise<Buffer>}
 */
async function readWindow(absolutePath, offset, length) {
  if (length <= 0) return Buffer.alloc(0);

  const handle = await fs.open(absolutePath, 'r');

  try {
    const buffer = Buffer.alloc(length);
    const { bytesRead } = await handle.read(buffer, 0, length, offset);
    return buffer.subarray(0, bytesRead);
  } finally {
    await handle.close();
  }
}

/**
 * Resolves the line/column of a byte offset and returns the line content.
 *
 * @param {string} absolutePath
 * @param {number} offset
 * @returns {Promise<{ line: number, column: number, text: string | null }>}
 */
async function locate(absolutePath, offset) {
  const handle = await fs.open(absolutePath, 'r');

  try {
    const buffer = Buffer.allocUnsafe(CHUNK_SIZE);
    let position = 0;
    let line = 1;
    let lineStart = 0;

    while (position < offset) {
      const { bytesRead } = await handle.read(
        buffer,
        0,
        Math.min(CHUNK_SIZE, offset - position),
        position,
      );

      if (bytesRead === 0) break;

      for (let index = 0; index < bytesRead; index++) {
        if (buffer[index] === 0x0a) {
          line += 1;
          lineStart = position + index + 1;
        }
      }

      position += bytesRead;
    }

    const text = await readLine(handle, lineStart);

    return { line, column: offset - lineStart + 1, text };
  } finally {
    await handle.close();
  }
}

/**
 * Reads a single line starting at the given offset.
 *
 * @param {import('node:fs/promises').FileHandle} handle
 * @param {number} start - Byte offset where the line starts.
 * @returns {Promise<string | null>}
 */
async function readLine(handle, start) {
  const buffer = Buffer.allocUnsafe(4096);
  const { bytesRead } = await handle.read(buffer, 0, buffer.length, start);

  if (bytesRead === 0) return '';

  const chunk = buffer.subarray(0, bytesRead);
  const newLine = chunk.indexOf(0x0a);
  const line = newLine === -1 ? chunk : chunk.subarray(0, newLine);

  return truncate(line.toString('utf8'));
}

/**
 * Builds the human readable description of a difference.
 *
 * @param {string} distPath
 * @param {string} referencePath
 * @param {number} context - Amount of bytes shown before/after the difference.
 * @returns {Promise<DifferenceDetail | null>}
 */
async function describeDifference(distPath, referencePath, context) {
  const offset = await findFirstDifference(distPath, referencePath);

  if (offset === -1) return null;

  const start = Math.max(0, offset - context);
  const length = context * 2 + 1;

  const [distWindow, referenceWindow, distLocation, referenceLocation] = await Promise.all([
    readWindow(distPath, start, length),
    readWindow(referencePath, start, length),
    locate(distPath, offset),
    locate(referencePath, offset),
  ]);

  return {
    offset,
    dist: {
      line: distLocation.line,
      column: distLocation.column,
      preview: formatBuffer(distWindow),
      lineText: distLocation.text,
    },
    reference: {
      line: referenceLocation.line,
      column: referenceLocation.column,
      preview: formatBuffer(referenceWindow),
      lineText: referenceLocation.text,
    },
  };
}

/**
 * Runs the tasks with a limited amount of parallel executions.
 *
 * @template T, R
 * @param {T[]} items
 * @param {number} limit
 * @param {(item: T) => Promise<R>} worker
 * @returns {Promise<R[]>}
 */
async function mapLimit(items, limit, worker) {
  /** @type {R[]} */
  const results = new Array(items.length);
  let cursor = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await worker(items[index]);
    }
  });

  await Promise.all(runners);

  return results;
}

/**
 * @param {Options} options
 * @returns {Promise<number>} The exit code.
 */
async function main(options) {
  const paint = createPainter(options.color);
  const distDir = path.resolve(options.dist);
  const referenceDir = path.resolve(options.reference);

  const [distStats, referenceStats] = await Promise.all([
    fs.stat(distDir).catch(() => null),
    fs.stat(referenceDir).catch(() => null),
  ]);

  if (!distStats?.isDirectory()) usageError(`Build folder not found: ${distDir}`);
  if (!referenceStats?.isDirectory()) usageError(`Reference folder not found: ${referenceDir}`);

  const ignore = options.ignore.map(globToRegExp);
  const [distFiles, referenceFiles] = await Promise.all([
    listFiles(distDir, ignore),
    listFiles(referenceDir, ignore),
  ]);

  const relativePaths = [...new Set([...distFiles.keys(), ...referenceFiles.keys()])].sort((a, b) =>
    a.localeCompare(b),
  );

  const results = await mapLimit(relativePaths, options.concurrency, async (relative) => {
    const distFile = distFiles.get(relative);
    const referenceFile = referenceFiles.get(relative);

    if (!referenceFile) {
      return /** @type {FileResult} */ ({
        relative,
        status: STATUS.missingInReference,
        dist: distFile,
      });
    }

    if (!distFile) {
      return /** @type {FileResult} */ ({
        relative,
        status: STATUS.missingInDist,
        reference: referenceFile,
      });
    }

    const [distHash, referenceHash] = await Promise.all([
      hashFile(distFile.absolute, options.algorithm),
      hashFile(referenceFile.absolute, options.algorithm),
    ]);

    if (distHash === referenceHash) {
      return /** @type {FileResult} */ ({
        relative,
        status: STATUS.identical,
        dist: distFile,
        reference: referenceFile,
        distHash,
        referenceHash,
      });
    }

    const detail = options.diff
      ? await describeDifference(distFile.absolute, referenceFile.absolute, options.context)
      : undefined;

    return /** @type {FileResult} */ ({
      relative,
      status: STATUS.different,
      dist: distFile,
      reference: referenceFile,
      distHash,
      referenceHash,
      detail: detail ?? undefined,
    });
  });

  const summary = {
    dist: distDir,
    reference: referenceDir,
    algorithm: options.algorithm,
    total: results.length,
    identical: results.filter((result) => result.status === STATUS.identical).length,
    different: results.filter((result) => result.status === STATUS.different).length,
    missingInReference: results.filter((result) => result.status === STATUS.missingInReference)
      .length,
    missingInDist: results.filter((result) => result.status === STATUS.missingInDist).length,
  };

  const problems = results.filter((result) => result.status !== STATUS.identical);

  if (options.json) {
    console.log(JSON.stringify({ summary, files: results }, null, 2));
    return problems.length === 0 ? 0 : 1;
  }

  if (!options.quiet) {
    console.log(`${paint('cyan', '[hash-check]')} dist:      ${distDir}`);
    console.log(`${paint('cyan', '[hash-check]')} reference: ${referenceDir}`);
    console.log(`${paint('cyan', '[hash-check]')} algorithm: ${options.algorithm}`);
    console.log('');
  }

  for (const result of problems) {
    if (result.status === STATUS.missingInReference) {
      console.log(`${paint('yellow', '✖')} ${paint('bold', result.relative)}`);
      console.log(
        `    ${paint('yellow', 'only exists in the build folder')} (not found in the reference)`,
      );
      continue;
    }

    if (result.status === STATUS.missingInDist) {
      console.log(`${paint('yellow', '✖')} ${paint('bold', result.relative)}`);
      console.log(
        `    ${paint('yellow', 'missing in the build folder')} (exists in the reference)`,
      );
      continue;
    }

    console.log(`${paint('red', '✖')} ${paint('bold', result.relative)}`);
    console.log(
      `    size:  ${formatBytes(result.dist?.size ?? 0)} (build) vs ${formatBytes(
        result.reference?.size ?? 0,
      )} (reference)`,
    );
    console.log(
      `    hash:  ${result.distHash?.slice(0, 16)} (build) vs ${result.referenceHash?.slice(
        0,
        16,
      )} (reference)`,
    );

    if (result.detail) {
      const { offset, dist, reference } = result.detail;
      console.log(`    first difference at byte ${paint('bold', String(offset))}`);
      console.log(
        `    build:     line ${dist.line}, column ${dist.column}  ${paint('dim', dist.preview)}`,
      );
      console.log(
        `    reference: line ${reference.line}, column ${reference.column}  ${paint(
          'dim',
          reference.preview,
        )}`,
      );

      if (dist.lineText !== null && reference.lineText !== null) {
        if (dist.lineText !== reference.lineText) {
          console.log(`    ${paint('green', '-')} ${dist.lineText}`);
          console.log(`    ${paint('red', '+')} ${reference.lineText}`);
        } else {
          console.log(`    ${paint('dim', `line: ${dist.lineText}`)}`);
        }
      }
    }

    console.log('');
  }

  const hasProblems = problems.length > 0;
  const summaryLine = [
    `${summary.total} file(s) compared`,
    `${summary.identical} identical`,
    `${summary.different} different`,
    `${summary.missingInReference} only in build`,
    `${summary.missingInDist} only in reference`,
  ].join(' | ');

  if (hasProblems) {
    console.log(paint('red', `✖ ${summaryLine}`));
    return 1;
  }

  console.log(paint('green', `✔ ${summaryLine}`));
  return 0;
}

let exitCode = 0;

try {
  const options = parseArgs(process.argv.slice(2));

  if (options.help) {
    printHelp();
  } else {
    exitCode = await main(options);
  }
} catch (error) {
  const isUsageError = error instanceof Error && error.name === 'UsageError';
  console.error(
    `${isUsageError ? '' : 'Unexpected error: '}${error instanceof Error ? error.message : error}`,
  );
  if (isUsageError) console.error('\nRun with --help to see the available options.');
  exitCode = 2;
}

process.exitCode = exitCode;
