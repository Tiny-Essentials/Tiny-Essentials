#!/usr/bin/env node
/**
 * @fileoverview Installs the dependencies of every self-contained project that
 * lives inside `src/v1/webTemplates`.
 *
 * Each folder under `src/v1/webTemplates` is an independent project with its own
 * `package.json` (and its own `node_modules`), so the root `npm install` does
 * not touch them. This script discovers them automatically and runs
 * `npm install` in each one.
 *
 * Usage:
 *   node build/installWebTemplates.mjs [options]
 *
 * Options:
 *   --strict        Exit with a non-zero code when a project fails to install.
 *   --dry-run       Only list the projects that would be installed.
 *   --production    Install only production dependencies (`--omit=dev`).
 *   -- <args...>    Everything after `--` is forwarded to `npm install`.
 *
 * It is executed automatically by the `postinstall` script, so a plain
 * `npm install` at the repository root is enough. Set the environment variable
 * `WEB_TEMPLATES_SKIP_INSTALL=1` to skip it (useful in CI).
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** Absolute path of the repository root. */
const ROOT_DIR = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

/** Folder that contains the self-contained projects. */
const WEB_TEMPLATES_DIR = path.join(ROOT_DIR, 'src', 'v1', 'webTemplates');

/** Maximum depth used while looking for `package.json` files. */
const MAX_DEPTH = 8;

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

/**
 * @param {string} message
 * @returns {void}
 */
const log = (message) => console.log(`${colors.cyan}[webTemplates]${colors.reset} ${message}`);

/**
 * @param {string} message
 * @returns {void}
 */
const warn = (message) => console.warn(`${colors.yellow}[webTemplates]${colors.reset} ${message}`);

/**
 * @param {string} message
 * @returns {void}
 */
const fail = (message) => console.error(`${colors.red}[webTemplates]${colors.reset} ${message}`);

/**
 * Recursively collects every directory that contains a `package.json`,
 * skipping `node_modules` and dot-directories.
 *
 * @param {string} dir - Directory to scan.
 * @param {number} [depth=0] - Current recursion depth.
 * @returns {string[]} Absolute paths of the projects, sorted alphabetically.
 */
function findProjects(dir, depth = 0) {
  if (depth > MAX_DEPTH) return [];

  /** @type {import('node:fs').Dirent[]} */
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }

  const hasPackageJson = entries.some((entry) => entry.isFile() && entry.name === 'package.json');

  if (hasPackageJson) return [dir];

  return entries
    .filter((entry) => entry.isDirectory())
    .filter((entry) => entry.name !== 'node_modules' && !entry.name.startsWith('.'))
    .flatMap((entry) => findProjects(path.join(dir, entry.name), depth + 1))
    .sort();
}

/**
 * Resolves the command used to run npm, so the script also works on Windows.
 *
 * @returns {string} The npm executable.
 */
function getNpmCommand() {
  return process.platform === 'win32' ? 'npm.cmd' : 'npm';
}

/**
 * @typedef {Object} Options
 * @property {boolean} strict
 * @property {boolean} dryRun
 * @property {boolean} production
 * @property {string[]} extraArgs
 */

/**
 * @param {string[]} argv
 * @returns {Options}
 */
function parseArgs(argv) {
  const separator = argv.indexOf('--');
  const own = separator === -1 ? argv : argv.slice(0, separator);
  const extraArgs = separator === -1 ? [] : argv.slice(separator + 1);

  return {
    strict: own.includes('--strict'),
    dryRun: own.includes('--dry-run'),
    production: own.includes('--production'),
    extraArgs,
  };
}

/**
 * @param {Options} options
 * @returns {void}
 */
function main({ strict, dryRun, production, extraArgs }) {
  if (process.env.WEB_TEMPLATES_SKIP_INSTALL === '1') {
    log('WEB_TEMPLATES_SKIP_INSTALL=1 detected, skipping.');
    return;
  }

  if (!fs.existsSync(WEB_TEMPLATES_DIR)) {
    log('No webTemplates folder found, nothing to install.');
    return;
  }

  const projects = findProjects(WEB_TEMPLATES_DIR);

  if (projects.length === 0) {
    log('No project with a package.json was found.');
    return;
  }

  log(`Found ${colors.bold}${projects.length}${colors.reset} project(s) to install.`);

  const args = ['install', '--no-audit', '--no-fund'];
  if (production) args.push('--omit=dev');
  args.push(...extraArgs);

  /** @type {{ project: string, code: number }[]} */
  const failures = [];

  for (const project of projects) {
    const relative = path.relative(ROOT_DIR, project).split(path.sep).join('/');

    if (dryRun) {
      log(`${colors.dim}[dry-run]${colors.reset} ${relative}`);
      continue;
    }

    log(`Installing ${colors.bold}${relative}${colors.reset} ...`);

    const result = spawnSync(getNpmCommand(), args, {
      cwd: project,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    });

    if (result.status === 0) {
      log(`${colors.green}✔${colors.reset} ${relative}`);
    } else {
      failures.push({ project: relative, code: result.status ?? 1 });
      fail(`✖ ${relative} (exit code ${result.status ?? 'unknown'})`);
    }
  }

  if (dryRun) return;

  if (failures.length === 0) {
    log(`${colors.green}All ${projects.length} project(s) installed successfully.${colors.reset}`);
    return;
  }

  fail(`${failures.length} of ${projects.length} project(s) failed to install:`);
  for (const { project, code } of failures) fail(`  - ${project} (exit code ${code})`);

  if (strict) process.exitCode = 1;
  else warn('Run with --strict to make this a hard failure.');
}

main(parseArgs(process.argv.slice(2)));
