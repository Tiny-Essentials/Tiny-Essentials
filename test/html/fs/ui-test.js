/**
 * @file Bridge between the OPFS test harness UI and the file system module.
 *
 * The module under test is imported from `src/` — it is never copied or
 * re-implemented here. Every button in the UI maps to exactly one entry in the
 * {@link GROUPS} registry.
 */

import { TinyOPFSFileSystem } from '/src/v1/libs/fs/plugins/OPFS/index.mjs';
import * as path from '/src/v1/libs/fs/path.mjs';
import * as encoding from '/src/v1/libs/fs/encoding.mjs';
import { constants } from '/src/v1/libs/fs/constants.mjs';

/* ------------------------------------------------------------------------ */
/* State                                                                     */
/* ------------------------------------------------------------------------ */

/** @type {TinyOPFSFileSystem} */
const fs = new TinyOPFSFileSystem();

/** @type {string} */
const SANDBOX = '/__harness__';

/** @type {import('./ui-test.js').FileHandle | null} */
let activeHandle = null;

/* ------------------------------------------------------------------------ */
/* Serialisation                                                             */
/* ------------------------------------------------------------------------ */

/**
 * @param {unknown} value Candidate value.
 * @returns {value is Record<string, any>} `true` for non-null objects.
 */
const isObject = (value) => typeof value === 'object' && value !== null;

/**
 * @param {unknown} value Candidate value.
 * @returns {boolean} `true` when the value looks like a `Stats` snapshot.
 */
const isStats = (value) =>
  isObject(value) && 'mtimeMs' in value && 'birthtimeMs' in value && 'ino' in value;

/**
 * @param {unknown} value Candidate value.
 * @returns {boolean} `true` when the value looks like a `Dirent`.
 */
const isDirent = (value) =>
  isObject(value) && 'name' in value && typeof value.isFile === 'function' && !('ino' in value);

/**
 * Converts any value into a JSON-friendly structure.
 *
 * @param {unknown} value Value to convert.
 * @param {number} [depth] Current recursion depth.
 * @returns {unknown} A serialisable representation.
 */
const serialize = (value, depth = 0) => {
  if (depth > 6) {
    return '[max depth]';
  }
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (value instanceof Uint8Array) {
    return {
      __type: 'Uint8Array',
      byteLength: value.byteLength,
      text: new TextDecoder().decode(value),
    };
  }
  if (value instanceof ArrayBuffer) {
    return { __type: 'ArrayBuffer', byteLength: value.byteLength };
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (value instanceof Error) {
    return { name: value.name, message: value.message, code: value.code ?? null };
  }
  if (Array.isArray(value)) {
    return value.map((item) => serialize(item, depth + 1));
  }
  if (isStats(value)) {
    return {
      path: value.path,
      name: value.name,
      size: value.size,
      mode: `0o${value.mode.toString(8).padStart(4, '0')}`,
      uid: value.uid,
      gid: value.gid,
      ino: value.ino,
      nlink: value.nlink,
      mtime: value.mtime.toISOString(),
      isFile: value.isFile(),
      isDirectory: value.isDirectory(),
    };
  }
  if (isDirent(value)) {
    return {
      name: value.name,
      kind: value.isDirectory() ? 'directory' : 'file',
    };
  }
  if (typeof value.arrayBuffer === 'function' && 'size' in value) {
    return { __type: 'File', name: value.name, size: value.size };
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, serialize(item, depth + 1)]),
  );
};

/**
 * @param {unknown} value Value to render.
 * @returns {string} A human readable representation.
 */
const formatValue = (value) => {
  const serialised = serialize(value);
  if (typeof serialised === 'string') {
    return serialised;
  }
  return JSON.stringify(serialised, null, 2);
};

/* ------------------------------------------------------------------------ */
/* Console                                                                   */
/* ------------------------------------------------------------------------ */

/** @type {HTMLElement} */
const consoleBody = document.getElementById('console');

/**
 * Appends an entry to the output console.
 *
 * @param {'request' | 'success' | 'error' | 'muted'} level Entry severity.
 * @param {string} label Short label shown in the meta row.
 * @param {unknown} [payload] Optional value rendered below the label.
 * @returns {void}
 */
const log = (level, label, payload) => {
  const entry = document.createElement('div');
  entry.className = `entry entry--${level}`;

  const meta = document.createElement('span');
  meta.className = 'entry__meta';
  meta.textContent = `${new Date().toLocaleTimeString()} · ${label}`;
  entry.append(meta);

  if (payload !== undefined) {
    const body = document.createElement('pre');
    body.className = 'entry__body';
    body.textContent = typeof payload === 'string' ? payload : formatValue(payload);
    entry.append(body);
  }

  consoleBody.append(entry);
  if (document.getElementById('console-autoscroll').checked) {
    consoleBody.scrollTop = consoleBody.scrollHeight;
  }
};

/* ------------------------------------------------------------------------ */
/* Field factories                                                           */
/* ------------------------------------------------------------------------ */

/**
 * @param {string} id Field identifier.
 * @param {string} label Visible label.
 * @param {string} value Default value.
 * @param {string} [hint] Optional helper text.
 * @returns {object} A text field descriptor.
 */
const text = (id, label, value, hint) => ({ id, label, value, hint, type: 'text' });

/**
 * @param {string} id Field identifier.
 * @param {string} label Visible label.
 * @param {boolean} checked Default state.
 * @param {string} [hint] Optional helper text.
 * @returns {object} A checkbox field descriptor.
 */
const check = (id, label, checked, hint) => ({ id, label, checked, hint, type: 'checkbox' });

/**
 * @param {string} id Field identifier.
 * @param {string} label Visible label.
 * @param {string[]} values Allowed values.
 * @param {string} value Default value.
 * @param {string} [hint] Optional helper text.
 * @returns {object} A select field descriptor.
 */
const select = (id, label, values, value, hint) => ({
  id,
  label,
  value,
  hint,
  type: 'select',
  options: values.map((item) => ({ value: item, label: item })),
});

/* ------------------------------------------------------------------------ */
/* Test registry                                                             */
/* ------------------------------------------------------------------------ */

const FILE = `${SANDBOX}/notes.txt`;
const COPY = `${SANDBOX}/notes.copy.txt`;
const MOVED = `${SANDBOX}/notes.moved.txt`;
const NESTED = `${SANDBOX}/nested`;

/** @type {Array<object>} */
const GROUPS = [
  {
    id: 'environment',
    title: 'Environment',
    description: 'Runtime capabilities and instance accessors.',
    tests: [
      {
        id: 'env.capabilities',
        title: 'TinyOPFSFileSystem.capabilities',
        description: 'Static getter describing what the backend supports.',
        run: () => TinyOPFSFileSystem.capabilities,
      },
      {
        id: 'env.instance',
        title: 'cwd / umask / identity',
        description: 'Accessors resolved by the base class constructor.',
        run: () => ({
          cwd: fs.cwd,
          umask: `0o${fs.umask.toString(8)}`,
          identity: fs.identity,
        }),
      },
      {
        id: 'env.storage',
        title: 'navigator.storage.estimate()',
        description: 'Quota granted to this origin.',
        run: async () => {
          const estimate = await navigator.storage.estimate();
          return {
            usage: `${(estimate.usage / 1024).toFixed(1)} KiB`,
            quota: `${(estimate.quota / 1024 / 1024).toFixed(1)} MiB`,
          };
        },
      },
    ],
  },
  {
    id: 'directories',
    title: 'Directories',
    description: 'mkdir, readdir, rmdir and rm against the sandbox root.',
    tests: [
      {
        id: 'dir.mkdir',
        title: 'mkdir(path, { recursive })',
        description: 'Creates a directory, optionally creating missing parents.',
        fields: [text('path', 'path', NESTED), check('recursive', 'recursive', true)],
        run: ({ path: target, recursive }) =>
          fs.mkdir(target, { recursive: recursive === 'true' }).then((created) => ({
            created: created ?? null,
          })),
      },
      {
        id: 'dir.readdir',
        title: 'readdir(path, { withFileTypes, recursive })',
        description: 'Lists the sandbox root.',
        fields: [
          text('path', 'path', SANDBOX),
          check('withFileTypes', 'withFileTypes', false),
          check('recursive', 'recursive', false),
        ],
        run: ({ path: target, withFileTypes, recursive }) =>
          fs.readdir(target, {
            withFileTypes: withFileTypes === 'true',
            recursive: recursive === 'true',
          }),
      },
      {
        id: 'dir.rmdir',
        title: 'rmdir(path, { recursive })',
        description: 'Removes a directory.',
        fields: [text('path', 'path', NESTED), check('recursive', 'recursive', true)],
        run: ({ path: target, recursive }) =>
          fs.rmdir(target, { recursive: recursive === 'true' }).then(() => 'removed'),
      },
      {
        id: 'dir.rm',
        title: 'rm(path, { recursive, force })',
        description: 'Removes a file or a whole tree.',
        fields: [
          text('path', 'path', SANDBOX),
          check('recursive', 'recursive', true),
          check('force', 'force', true),
        ],
        run: ({ path: target, recursive, force }) =>
          fs
            .rm(target, { recursive: recursive === 'true', force: force === 'true' })
            .then(() => 'removed'),
      },
    ],
  },
  {
    id: 'files',
    title: 'Files',
    description: 'Write, read, append, copy and move file contents.',
    tests: [
      {
        id: 'file.writeFile',
        title: 'writeFile(path, data, { encoding })',
        description: 'Creates or replaces a file.',
        fields: [
          text('path', 'path', FILE),
          text('data', 'data', 'hello opfs'),
          select('encoding', 'encoding', ['utf8', 'base64', 'hex'], 'utf8'),
        ],
        run: ({ path: target, data, encoding: kind }) =>
          fs.writeFile(target, data, { encoding: kind }).then(() => `wrote ${data.length} chars`),
      },
      {
        id: 'file.readFile',
        title: 'readFile(path, { encoding })',
        description: 'Reads a file. Use "binary" to receive a Uint8Array.',
        fields: [
          text('path', 'path', FILE),
          select('encoding', 'encoding', ['utf8', 'base64', 'hex', 'binary'], 'utf8'),
        ],
        run: ({ path: target, encoding: kind }) =>
          fs.readFile(target, { encoding: kind === 'binary' ? null : kind }),
      },
      {
        id: 'file.appendFile',
        title: 'appendFile(path, data)',
        description: 'Appends to an existing file, creating it when missing.',
        fields: [text('path', 'path', FILE), text('data', 'data', ' + appended')],
        run: ({ path: target, data }) =>
          fs.appendFile(target, data).then(() => `appended ${data.length} chars`),
      },
      {
        id: 'file.copyFile',
        title: 'copyFile(source, destination)',
        description: 'Copies a file and its in-memory metadata.',
        fields: [text('source', 'source', FILE), text('destination', 'destination', COPY)],
        run: ({ source, destination }) =>
          fs.copyFile(source, destination).then(() => `copied to ${destination}`),
      },
      {
        id: 'file.rename',
        title: 'rename(oldPath, newPath)',
        description: 'Moves a file or directory.',
        fields: [text('oldPath', 'oldPath', COPY), text('newPath', 'newPath', MOVED)],
        run: ({ oldPath, newPath }) =>
          fs.rename(oldPath, newPath).then(() => `moved to ${newPath}`),
      },
      {
        id: 'file.truncate',
        title: 'truncate(path, length)',
        description: 'Resizes a file, padding with zero bytes when growing.',
        fields: [text('path', 'path', FILE), text('length', 'length', '5')],
        run: ({ path: target, length }) =>
          fs.truncate(target, Number(length)).then(() => `truncated to ${length}`),
      },
      {
        id: 'file.unlink',
        title: 'unlink(path)',
        description: 'Removes a single file.',
        fields: [text('path', 'path', MOVED)],
        run: ({ path: target }) => fs.unlink(target).then(() => `unlinked ${target}`),
      },
    ],
  },
  {
    id: 'metadata',
    title: 'Metadata',
    description: 'Stat, permissions, ownership and timestamps.',
    tests: [
      {
        id: 'meta.stat',
        title: 'stat(path)',
        description: 'Resolves the metadata snapshot.',
        fields: [text('path', 'path', FILE)],
        run: ({ path: target }) => fs.stat(target),
      },
      {
        id: 'meta.lstat',
        title: 'lstat(path)',
        description: 'Alias of stat — OPFS has no symbolic links.',
        fields: [text('path', 'path', FILE)],
        run: ({ path: target }) => fs.lstat(target),
      },
      {
        id: 'meta.exists',
        title: 'exists(path)',
        description: 'Resolves to a boolean instead of throwing.',
        fields: [text('path', 'path', FILE)],
        run: ({ path: target }) => fs.exists(target).then((value) => ({ exists: value })),
      },
      {
        id: 'meta.realpath',
        title: 'realpath(path)',
        description: 'Normalises the path lexically.',
        fields: [text('path', 'path', `${SANDBOX}/./nested/../notes.txt`)],
        run: ({ path: target }) => fs.realpath(target).then((value) => ({ realpath: value })),
      },
      {
        id: 'meta.access',
        title: 'access(path, mode)',
        description: 'Resolves when the permission is granted.',
        fields: [
          text('path', 'path', FILE),
          select('mode', 'mode', ['F_OK', 'R_OK', 'W_OK', 'X_OK'], 'R_OK'),
        ],
        run: ({ path: target, mode }) =>
          fs.access(target, constants[mode]).then(() => `granted (${mode})`),
      },
      {
        id: 'meta.chmod',
        title: 'chmod(path, mode)',
        description: 'Stores the permission bits in the in-memory side table.',
        fields: [text('path', 'path', FILE), text('mode', 'mode (octal)', '644')],
        run: ({ path: target, mode }) =>
          fs.chmod(target, Number.parseInt(mode, 8)).then(() => `mode 0o${mode}`),
      },
      {
        id: 'meta.chown',
        title: 'chown(path, uid, gid)',
        description: 'Stores the owner identifiers.',
        fields: [
          text('path', 'path', FILE),
          text('uid', 'uid', '1000'),
          text('gid', 'gid', '1000'),
        ],
        run: ({ path: target, uid, gid }) =>
          fs.chown(target, Number(uid), Number(gid)).then(() => `owner ${uid}:${gid}`),
      },
      {
        id: 'meta.utimes',
        title: 'utimes(path, atimeMs, mtimeMs)',
        description: 'Overrides the stored timestamps.',
        fields: [
          text('path', 'path', FILE),
          text('atimeMs', 'atimeMs', '1700000000000'),
          text('mtimeMs', 'mtimeMs', '1700000000000'),
        ],
        run: ({ path: target, atimeMs, mtimeMs }) =>
          fs
            .utimes(target, Number(atimeMs), Number(mtimeMs))
            .then(() => new Date(Number(mtimeMs)).toISOString()),
      },
    ],
  },
  {
    id: 'handles',
    title: 'File handles',
    description: 'open() returns a facade that delegates back to the file system.',
    tests: [
      {
        id: 'handle.open',
        title: 'open(path, flags)',
        description: 'Opens a handle and keeps it in the module scope.',
        fields: [text('path', 'path', FILE), text('flags', 'flags', 'r')],
        run: async ({ path: target, flags }) => {
          activeHandle = await fs.open(target, flags);
          return {
            path: activeHandle.path,
            flags: activeHandle.flags,
            closed: activeHandle.closed,
          };
        },
      },
      {
        id: 'handle.readFile',
        title: 'handle.readFile()',
        description: 'Reads through the active handle.',
        run: async () => {
          if (activeHandle === null) {
            throw new Error('Open a handle first (handle.open).');
          }
          return activeHandle.readFile({ encoding: 'utf8' });
        },
      },
      {
        id: 'handle.stat',
        title: 'handle.stat()',
        description: 'Stats through the active handle.',
        run: () => {
          if (activeHandle === null) {
            throw new Error('Open a handle first (handle.open).');
          }
          return activeHandle.stat();
        },
      },
      {
        id: 'handle.close',
        title: 'handle.close()',
        description: 'Releases the handle. Further calls must throw EBADF.',
        run: async () => {
          if (activeHandle === null) {
            throw new Error('Open a handle first (handle.open).');
          }
          await activeHandle.close();
          const closed = activeHandle.closed;
          activeHandle = null;
          return { closed };
        },
      },
    ],
  },
  {
    id: 'path',
    title: 'Path utilities',
    description: 'Pure helpers from <code>path.mjs</code>. No I/O involved.',
    tests: [
      {
        id: 'path.normalize',
        title: 'normalize(path)',
        description: 'Resolves "." and ".." lexically.',
        fields: [text('value', 'path', '/a/./b/../c')],
        run: ({ value }) => ({ result: path.normalize(value) }),
      },
      {
        id: 'path.join',
        title: 'join(...parts)',
        description: 'Joins and normalises the fragments.',
        fields: [text('value', 'parts (comma separated)', '/a/b, ../c, d')],
        run: ({ value }) => ({ result: path.join(...value.split(',').map((item) => item.trim())) }),
      },
      {
        id: 'path.dirname',
        title: 'dirname(path)',
        description: 'Returns the parent directory.',
        fields: [text('value', 'path', '/a/b/c.txt')],
        run: ({ value }) => ({ result: path.dirname(value) }),
      },
      {
        id: 'path.basename',
        title: 'basename(path, extension)',
        description: 'Returns the last segment.',
        fields: [text('value', 'path', '/a/b/c.txt'), text('extension', 'extension', '.txt')],
        run: ({ value, extension }) => ({ result: path.basename(value, extension) }),
      },
      {
        id: 'path.extname',
        title: 'extname(path)',
        description: 'Returns the extension, including the dot.',
        fields: [text('value', 'path', '/a/b/c.tar.gz')],
        run: ({ value }) => ({ result: path.extname(value) }),
      },
      {
        id: 'path.resolve',
        title: 'resolve(cwd, ...parts)',
        description: 'Resolves relative fragments against a working directory.',
        fields: [text('cwd', 'cwd', '/home/user'), text('value', 'parts', '../file.txt')],
        run: ({ cwd, value }) => ({ result: path.resolve(cwd, value) }),
      },
      {
        id: 'path.parse',
        title: 'parse(path)',
        description: 'Splits a path into its structural components.',
        fields: [text('value', 'path', '/a/b/c.tar.gz')],
        run: ({ value }) => path.parse(value),
      },
      {
        id: 'path.format',
        title: 'format(pathObject)',
        description: 'Builds a path from its structural components.',
        fields: [text('dir', 'dir', '/a/b'), text('name', 'name', 'c'), text('ext', 'ext', '.txt')],
        run: ({ dir, name, ext }) => ({ result: path.format({ dir, name, ext }) }),
      },
      {
        id: 'path.relative',
        title: 'relative(from, to)',
        description: 'Computes the relative path between two locations.',
        fields: [text('from', 'from', '/a/b/c'), text('to', 'to', '/a/d/e')],
        run: ({ from, to }) => ({ result: path.relative(from, to) }),
      },
    ],
  },
  {
    id: 'encoding',
    title: 'Encoding utilities',
    description: 'Pure helpers from <code>encoding.mjs</code>.',
    tests: [
      {
        id: 'encoding.roundtrip',
        title: 'toUint8Array() → decodeBytes()',
        description: 'Round-trips a string through every supported encoding.',
        fields: [text('value', 'value', 'Tiny Essentials')],
        run: ({ value }) => {
          const bytes = encoding.toUint8Array(value, 'utf8');
          return {
            utf8: encoding.decodeBytes(bytes, 'utf8'),
            base64: encoding.decodeBytes(bytes, 'base64'),
            hex: encoding.decodeBytes(bytes, 'hex'),
            byteLength: bytes.byteLength,
          };
        },
      },
      {
        id: 'encoding.hex',
        title: 'hexToBytes() with an odd length',
        description: 'Must throw a TypeError.',
        fields: [text('value', 'value', 'abc')],
        run: ({ value }) => ({ result: encoding.hexToBytes(value) }),
      },
    ],
  },
];

/* ------------------------------------------------------------------------ */
/* Smoke suite                                                               */
/* ------------------------------------------------------------------------ */

/** @type {string[]} */
const SMOKE_SUITE = [
  'env.capabilities',
  'dir.mkdir',
  'file.writeFile',
  'file.appendFile',
  'file.readFile',
  'meta.stat',
  'meta.chmod',
  'meta.access',
  'dir.readdir',
  'file.copyFile',
  'file.rename',
  'handle.open',
  'handle.readFile',
  'handle.close',
  'file.unlink',
  'dir.rm',
];

/* ------------------------------------------------------------------------ */
/* Rendering                                                                 */
/* ------------------------------------------------------------------------ */

/** @type {Map<string, { test: object, read: () => Record<string, string> }>} */
const registry = new Map();

/**
 * Builds a single input control.
 *
 * @param {object} field Field descriptor.
 * @returns {HTMLElement} The control element.
 */
const buildControl = (field) => {
  if (field.type === 'select') {
    const element = document.createElement('select');
    for (const option of field.options) {
      const node = document.createElement('option');
      node.value = option.value;
      node.textContent = option.label;
      node.selected = option.value === field.value;
      element.append(node);
    }
    return element;
  }
  const input = document.createElement('input');
  input.type = field.type === 'checkbox' ? 'checkbox' : 'text';
  if (field.type === 'checkbox') {
    input.checked = field.checked === true;
  } else {
    input.value = field.value ?? '';
  }
  return input;
};

/**
 * Renders every group declared in {@link GROUPS}.
 *
 * @returns {void}
 */
const render = () => {
  const panels = document.getElementById('panels');
  const groupTemplate = document.getElementById('template-group');
  const testTemplate = document.getElementById('template-test');
  const fieldTemplate = document.getElementById('template-field');

  for (const group of GROUPS) {
    const groupNode = groupTemplate.content.firstElementChild.cloneNode(true);
    groupNode.querySelector('.group__title').textContent = group.title;
    groupNode.querySelector('.group__description').textContent = group.description;
    const body = groupNode.querySelector('.group__body');

    for (const test of group.tests) {
      const testNode = testTemplate.content.firstElementChild.cloneNode(true);
      testNode.querySelector('.test__title').textContent = test.title;
      testNode.querySelector('.test__description').textContent = test.description;
      const fields = testNode.querySelector('.test__fields');

      for (const field of test.fields ?? []) {
        const fieldNode = fieldTemplate.content.firstElementChild.cloneNode(true);
        fieldNode.querySelector('.field__label').textContent = field.label;
        fieldNode.querySelector('.field__control').append(buildControl(field));
        fieldNode.querySelector('.field__hint').textContent = field.hint ?? '';
        fields.append(fieldNode);
      }

      const read = () => {
        const values = {};
        const controls = fields.querySelectorAll('.field');
        (test.fields ?? []).forEach((field, index) => {
          const control = controls[index].querySelector('input, select, textarea');
          values[field.id] = field.type === 'checkbox' ? String(control.checked) : control.value;
        });
        return values;
      };

      registry.set(test.id, { test, read });
      testNode.querySelector('.test__run').addEventListener('click', () => execute(test.id));
      body.append(testNode);
    }

    groupNode.querySelector('.group__run').addEventListener('click', async () => {
      for (const test of group.tests) {
        await execute(test.id);
      }
    });

    panels.append(groupNode);
  }
};

/* ------------------------------------------------------------------------ */
/* Execution                                                                 */
/* ------------------------------------------------------------------------ */

/**
 * Runs a single test and pipes the outcome to the console.
 *
 * @param {string} id Registered test identifier.
 * @returns {Promise<void>} Resolves once the entry is rendered.
 */
const execute = async (id) => {
  const entry = registry.get(id);
  if (entry === undefined) {
    log('error', 'harness', `Unknown test: ${id}`);
    return;
  }
  const values = entry.read();
  log('request', entry.test.title, values);
  try {
    const result = await entry.test.run(values);
    log('success', `${entry.test.title} → ok`, result);
  } catch (error) {
    log('error', `${entry.test.title} → ${error.name}`, error.message);
  }
};

/* ------------------------------------------------------------------------ */
/* Bootstrap                                                                 */
/* ------------------------------------------------------------------------ */

const bootstrap = () => {
  render();

  const badge = document.getElementById('environment');
  const supported = typeof navigator !== 'undefined' && 'storage' in navigator;
  badge.textContent = supported ? 'OPFS available' : 'OPFS unavailable';
  badge.className = `badge ${supported ? 'badge--ready' : 'badge--failed'}`;

  document.getElementById('action-run-all').addEventListener('click', async (event) => {
    event.currentTarget.disabled = true;
    for (const id of SMOKE_SUITE) {
      await execute(id);
    }
    if (!event.currentTarget) return;
    event.currentTarget.disabled = false;
  });

  document.getElementById('action-clean').addEventListener('click', async () => {
    await fs.rm(SANDBOX, { recursive: true, force: true });
    await fs.mkdir(SANDBOX, { recursive: true });
    log('muted', 'harness', `Sandbox recreated at ${SANDBOX}`);
  });

  document.getElementById('action-clear').addEventListener('click', () => {
    consoleBody.replaceChildren();
  });

  log('muted', 'harness', 'Ready. Start with "Run smoke suite".');
};

bootstrap();
