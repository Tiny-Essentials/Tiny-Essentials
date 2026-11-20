import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import * as sass from 'sass';
import { build } from 'esbuild';

import { arraySortPositions } from '../src/v1/index.mjs';

const port = 3145;

// Resolve __dirname (since we are using ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIME_TYPES = {
  // === TEXT ===
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv',
  '.md': 'text/markdown',
  '.xml': 'application/xml',

  // === IMAGES ===
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
  '.tiff': 'image/tiff',
  '.tif': 'image/tiff',
  '.avif': 'image/avif',

  // === AUDIO ===
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/x-m4a',
  '.aac': 'audio/aac',
  '.flac': 'audio/flac',
  '.mid': 'audio/midi',
  '.midi': 'audio/midi',

  // === VIDEO ===
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogv': 'video/ogg',
  '.avi': 'video/x-msvideo',
  '.mov': 'video/quicktime',
  '.mpeg': 'video/mpeg',
  '.mkv': 'video/x-matroska',

  // === DOCUMENTS / OFFICE ===
  '.pdf': 'application/pdf',
  '.json': 'application/json',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.odt': 'application/vnd.oasis.opendocument.text',
  '.ods': 'application/vnd.oasis.opendocument.spreadsheet',

  // === ARCHIVES ===
  '.zip': 'application/zip',
  '.rar': 'application/x-rar-compressed',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
  '.7z': 'application/x-7z-compressed',

  // === FONTS ===
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',

  // === OTHER / BINARIES ===
  '.exe': 'application/octet-stream',
  '.bin': 'application/octet-stream',
  '.wasm': 'application/wasm',
};

function getContentTypeNative(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

/* -------------------------------------------------------------------------- *
 * Minimal HTTP framework (Express replacement)
 *
 * Only the small subset of the Express API used by this dev server is
 * implemented, on top of the native `node:http` module:
 *
 *   app.use([mount], handler)   app.get(matcher, ...handlers)
 *   app.listen(port, host, cb)
 *   req.path  req.query  req.params
 *   res.status()  res.type()  res.send()  res.json()  res.sendFile()
 *   expressStatic(root, options)
 * -------------------------------------------------------------------------- */

/**
 * Sends a raw body, mimicking `res.send()` from Express.
 * @param {http.ServerResponse} res
 * @param {*} body
 */
function sendBody(res, body) {
  if (body !== null && typeof body === 'object' && !Buffer.isBuffer(body)) {
    return sendJson(res, body);
  }

  /** @type {Buffer} */
  let payload;
  if (body === undefined || body === null) payload = Buffer.alloc(0);
  else if (Buffer.isBuffer(body)) payload = body;
  else payload = Buffer.from(String(body), 'utf8');

  if (!res.hasHeader('Content-Type')) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
  }
  res.setHeader('Content-Length', String(payload.length));
  res.end(payload);
}

/**
 * @param {http.ServerResponse} res
 * @param {*} body
 */
function sendJson(res, body) {
  const payload = JSON.stringify(body);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Length', String(Buffer.byteLength(payload)));
  res.end(payload);
}

/**
 * Streams a file to the client, honoring `Range` and `HEAD` requests.
 *
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {string} filePath
 * @param {fs.Stats} stats
 * @param {{ etag?: boolean, lastModified?: boolean, cacheControl?: boolean, setHeaders?: (res: http.ServerResponse, filePath: string, stats: fs.Stats) => void }} [options]
 */
function sendFile(req, res, filePath, stats, options = {}) {
  const { etag = true, lastModified = true, cacheControl = true, setHeaders } = options;

  if (typeof setHeaders === 'function') setHeaders(res, filePath, stats);

  const size = stats.size;

  if (lastModified) res.setHeader('Last-Modified', stats.mtime.toUTCString());

  /** @type {string|undefined} */
  let etagValue;
  if (etag) {
    etagValue = `W/"${size.toString(16)}-${Math.floor(stats.mtimeMs).toString(16)}"`;
    res.setHeader('ETag', etagValue);
  }

  if (cacheControl && !res.hasHeader('Cache-Control')) {
    res.setHeader('Cache-Control', 'public, max-age=0');
  }

  res.setHeader('Accept-Ranges', 'bytes');

  if (etagValue && req.headers['if-none-match'] === etagValue) {
    res.statusCode = 304;
    return res.end();
  }

  let start = 0;
  let end = size - 1;
  let status = 200;

  const rangeHeader = req.headers.range;
  if (rangeHeader && rangeHeader.startsWith('bytes=')) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader.split(',')[0].trim());
    if (match) {
      const [, rawStart, rawEnd] = match;

      if (rawStart === '') {
        const suffix = parseInt(rawEnd, 10);
        if (!Number.isNaN(suffix)) {
          start = Math.max(0, size - suffix);
          end = size - 1;
        }
      } else {
        start = parseInt(rawStart, 10);
        end = rawEnd === '' ? size - 1 : Math.min(parseInt(rawEnd, 10), size - 1);
      }

      if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) {
        res.statusCode = 416;
        res.setHeader('Content-Range', `bytes */${size}`);
        return res.end();
      }

      status = 206;
    }
  }

  if (status === 206) res.statusCode = 206;
  if (!res.hasHeader('Content-Type')) {
    res.setHeader('Content-Type', getContentTypeNative(filePath));
  }
  res.setHeader('Content-Length', String(end - start + 1));
  if (status === 206) res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);

  if (req.method === 'HEAD') return res.end();

  const stream = fs.createReadStream(filePath, { start, end });
  stream.on('error', () => {
    if (!res.writableEnded) res.end();
  });
  res.on('close', () => stream.destroy());
  stream.pipe(res);
}

/**
 * Adds the Express-like helpers to the native response object.
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 */
function attachResponseHelpers(req, res) {
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };

  res.type = (type) => {
    res.setHeader('Content-Type', type);
    return res;
  };

  res.send = (body) => {
    sendBody(res, body);
    return res;
  };

  res.json = (body) => {
    sendJson(res, body);
    return res;
  };
  res.sendFile = (filePath) => {
    fs.promises
      .stat(filePath)
      .then((stats) => sendFile(req, res, filePath, stats, { etag: false }))
      .catch(() => {
        if (!res.writableEnded) res.end();
      });
  };
}

/**
 * Matches a route matcher (string or RegExp) against a pathname.
 * @param {string|RegExp} matcher
 * @param {string} pathname
 * @returns {string[]|null} The decoded params, or `null` when it does not match.
 */
function matchRoute(matcher, pathname) {
  if (matcher instanceof RegExp) {
    const match = matcher.exec(pathname);
    if (!match) return null;
    return match.slice(1).map((value) => {
      if (value === undefined) return value;
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    });
  }

  if (typeof matcher === 'string') {
    return matcher === pathname ? [] : null;
  }

  return null;
}

/**
 * Runs a list of route handlers in sequence.
 * @param {Function[]} handlers
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {(err?: unknown) => void} next
 */
function runHandlers(handlers, req, res, next) {
  let index = 0;

  const step = (err) => {
    if (err) return next(err);

    const handler = handlers[index++];
    if (!handler) return next();

    try {
      const result = handler(req, res, step);
      if (result && typeof result.catch === 'function') result.catch(step);
    } catch (error) {
      step(error);
    }
  };

  step();
}

/**
 * Creates a tiny Express-compatible application.
 */
function createApp() {
  /** @type {Array<object>} */
  const stack = [];

  /**
   * @param {http.IncomingMessage} req
   * @param {http.ServerResponse} res
   */
  const requestHandler = (req, res) => {
    let url;
    try {
      url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    } catch {
      res.statusCode = 400;
      return res.end('Bad Request');
    }

    req.path = url.pathname;
    req.query = Object.fromEntries(url.searchParams);
    req.params = [];
    req.originalUrl = req.url;

    attachResponseHelpers(req, res);

    let index = 0;

    /** @param {unknown} err */
    const fail = (err) => {
      if (res.writableEnded) return;
      if (res.headersSent) return res.end();

      const error = /** @type {any} */ (err);
      res.statusCode = (error && error.status) || 500;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end(error && error.stack ? error.stack : String(err));
    };

    /** @param {unknown} [err] */
    const dispatch = (err) => {
      if (res.writableEnded) return;

      while (index < stack.length) {
        const layer = /** @type {any} */ (stack[index++]);

        if (layer.kind === 'use') {
          const isErrorHandler = !layer.handler.isStatic && layer.handler.length === 4;

          if (err) {
            if (!isErrorHandler) continue;
            try {
              return layer.handler(err, req, res, dispatch);
            } catch (error) {
              return fail(error);
            }
          }

          if (isErrorHandler) continue;

          if (layer.mount !== '/') {
            if (req.path !== layer.mount && !req.path.startsWith(layer.mount + '/')) continue;
          }

          const subPath =
            layer.mount === '/' ? req.path : req.path.slice(layer.mount.length) || '/';

          try {
            const result = layer.handler(req, res, dispatch, subPath);
            if (result && typeof result.catch === 'function') result.catch(dispatch);
          } catch (error) {
            return dispatch(error);
          }
          return;
        }

        // Route layer
        if (err) continue;
        if (layer.method !== req.method && !(layer.method === 'GET' && req.method === 'HEAD')) {
          continue;
        }

        const params = matchRoute(layer.matcher, req.path);
        if (!params) continue;

        req.params = params;
        return runHandlers(layer.handlers, req, res, dispatch);
      }

      if (err) return fail(err);

      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Not Found');
    };

    dispatch();
  };

  const app = {
    /**
     * @param {...any} args
     */
    use(...args) {
      let mount = '/';
      let handlers = args;

      if (typeof args[0] === 'string') {
        mount = args[0];
        handlers = args.slice(1);
      }

      for (const handler of handlers.flat()) {
        stack.push({ kind: 'use', mount, handler });
      }

      return app;
    },

    /**
     * @param {string|RegExp} matcher
     * @param {...Function} handlers
     */
    get(matcher, ...handlers) {
      stack.push({ kind: 'route', method: 'GET', matcher, handlers: handlers.flat() });
      return app;
    },

    /**
     * @param {number} listenPort
     * @param {string} host
     * @param {() => void} callback
     */
    listen(listenPort, host, callback) {
      return http.createServer(requestHandler).listen(listenPort, host, callback);
    },
  };

  return app;
}

/**
 * Serves the files of a directory, mimicking `express.static()`.
 *
 * @param {string} root
 * @param {{ index?: string, etag?: boolean, lastModified?: boolean, cacheControl?: boolean, setHeaders?: (res: http.ServerResponse, filePath: string, stats: fs.Stats) => void }} [options]
 */
function expressStatic(root, options = {}) {
  const { index = 'index.html', ...sendOptions } = options;
  const rootPath = path.resolve(root);

  /**
   * @type {((req: http.IncomingMessage, res: http.ServerResponse, next: Function, subPath?: string) => Promise<void>) & { isStatic?: boolean }}
   */
  const staticMiddleware = async (req, res, next, subPath) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') return next();

    const rawPath = typeof subPath === 'string' ? subPath : req.path;

    /** @type {string} */
    let decoded;
    try {
      decoded = decodeURIComponent(rawPath);
    } catch {
      return next();
    }

    if (decoded.includes('\0')) return next();

    const filePath = path.resolve(rootPath, '.' + path.posix.normalize('/' + decoded));
    if (filePath !== rootPath && !filePath.startsWith(rootPath + path.sep)) return next();

    /** @type {fs.Stats} */
    let stats;
    try {
      stats = await fs.promises.stat(filePath);
    } catch {
      return next();
    }

    if (stats.isDirectory()) {
      if (!decoded.endsWith('/')) {
        const queryIndex = req.url.indexOf('?');
        const search = queryIndex === -1 ? '' : req.url.slice(queryIndex);
        res.statusCode = 301;
        res.setHeader('Location', decoded + '/' + search);
        return res.end();
      }

      const indexPath = path.join(filePath, index);
      try {
        const indexStats = await fs.promises.stat(indexPath);
        if (!indexStats.isFile()) return next();
        return sendFile(req, res, indexPath, indexStats, sendOptions);
      } catch {
        return next();
      }
    }

    if (!stats.isFile()) return next();

    return sendFile(req, res, filePath, stats, sendOptions);
  };

  // Marks the middleware so the router never mistakes it for an error handler.
  staticMiddleware.isStatic = true;

  return staticMiddleware;
}

/* -------------------------------------------------------------------------- *
 * Application
 * -------------------------------------------------------------------------- */

const app = createApp();

// Define the public directory
const publicDir = path.join(__dirname, './html');
const imgDir = path.join(__dirname, './img');
const errorsDir = path.join(__dirname, './errors');
const projectRoot = path.join(__dirname, '../');

/**
 * Directory that contains the `bootstrap` package. Required because the theme
 * uses bare specifiers such as `@import 'bootstrap/scss/functions'`.
 * @type {string}
 */
const nodeModulesDir = path.join(projectRoot, 'node_modules');

/**
 * Directories searched by the throttled endpoint, in order. The first match
 * wins, so `publicDir` keeps priority over `imgDir` when both contain a file
 * with the same name.
 * @type {string[]}
 */
const mediaRoots = [publicDir, imgDir];

/**
 * Resolves a request path against every allowed media root.
 * @param {string} target - The path taken from the `src` query parameter.
 * @returns {string|null} The first existing file, or null when none matches.
 */
function resolveMedia(target) {
  const relative = target.replace(/^[/\\]+/, '');
  for (const root of mediaRoots) {
    const candidate = path.resolve(root, relative);
    if (!candidate.startsWith(root + path.sep)) {
      continue;
    }
    try {
      if (fs.statSync(candidate).isFile()) {
        return candidate;
      }
    } catch {
      // Not in this root: try the next one.
    }
  }
  return null;
}

app.use((req, res, next) => {
  // Allow connections from any origin
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Allowed methods
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  // Headers the browser can send
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Range, If-Range',
  );

  // Headers that the frontend is allowed to read
  res.setHeader(
    'Access-Control-Expose-Headers',
    'Content-Length, Content-Range, Accept-Ranges, Content-Type, ETag, Last-Modified',
  );

  // GOLDEN RULE: Intercept the preflight (OPTIONS) so it doesn't hit a 404 error!
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
});

function disableCache(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
}

/**
 * @typedef {(filePath: string, fileName: string, req: http.IncomingMessage, res: http.ServerResponse, next?: Function) => void} ReadFileUrl
 */

/**
 * @param {string} mimetype
 * @param {string[]} formats
 * @param {string} folder
 * @param {ReadFileUrl} [response]
 */
const readFileUrl =
  (
    mimetype,
    formats,
    folder = '',
    response = async (filePath, fileName, req, res) => res.sendFile(filePath),
  ) =>
  (req, res, next) =>
    new Promise((resolve, reject) => {
      disableCache(res);
      const filePath = path.join(projectRoot, folder, req.params[0]);
      if (!filePath.startsWith(projectRoot)) {
        return res.status(403).send('Access denied: path is outside allowed root.');
      }

      let allowed = false;
      for (const format of formats) {
        if (filePath.endsWith(format)) {
          allowed = true;
          break;
        }
      }

      if (!allowed) return next();
      try {
        fs.accessSync(filePath, fs.constants.F_OK);
      } catch (err) {
        reject(err);
      } finally {
        res.type(mimetype);
        response(filePath, req.params[0], req, res, next).then(resolve).catch(reject);
      }
    });

/** @type {Record<string, string>} */
const nodePolyfills = {
  fs: `
    function readFile() { console.warn("fs.readFile is not available in browser"); }
    function writeFile() { console.warn("fs.writeFile is not available in browser"); }
    const promises = {
      readFile: async () => { console.warn("fs.promises.readFile is not available in browser"); return ""; },
      writeFile: async () => { console.warn("fs.promises.writeFile is not available in browser"); }
    };
  `,
  'fs/promises': `
    async function readFile() { console.warn("fs.promises.readFile is not available in browser"); return ""; }
    async function writeFile() { console.warn("fs.promises.writeFile is not available in browser"); }
  `,
  path: `
    function join(...args) { return args.join("/"); }
    function resolve(...args) { return args.join("/"); }
  `,
  os: `
    function platform() { return "browser"; }
    function homedir() { return "/"; }
  `,
};

/** @type {ReadFileUrl} */
const jsLoader = async (filePath, fileName, req, res) => {
  try {
    let code = await fs.promises.readFile(filePath, 'utf-8');

    // Detects Node module imports and replaces them with mocks
    for (const modName of Object.keys(nodePolyfills)) {
      // import default
      code = code.replace(
        new RegExp(`import\\s+([a-zA-Z0-9_$]+)\\s+from\\s*['"]${modName}['"];?`, 'g'),
        (_match, defName) =>
          `const ${defName} = (function(){ ${nodePolyfills[modName]} return exports; })();`,
      );

      // import * as alias
      code = code.replace(
        new RegExp(`import\\s+\\*\\s+as\\s+([a-zA-Z0-9_$]+)\\s+from\\s*['"]${modName}['"];?`, 'g'),
        (_match, alias) =>
          `const ${alias} = (function(){ let exports={}; ${nodePolyfills[modName]} return exports; })();`,
      );

      // import { x, y as z }
      code = code.replace(
        new RegExp(`import\\s*\\{([^}]+)\\}\\s*from\\s*['"]${modName}['"];?`, 'g'),
        (_match, members) => {
          return members
            .split(',')
            .map((m) => m.trim())
            .map((m) => {
              const [orig, alias] = m.split(/\s+as\s+/).map((s) => s.trim());
              const name = alias || orig;
              return `const ${name} = (function(){ let exports={}; ${nodePolyfills[modName]} return exports.${orig}; })();`;
            })
            .join('\n');
        },
      );
    }

    res.type('application/javascript');
    res.send(code);
  } catch (err) {
    console.error(err);
    res.status(500).send(`JS compilation error:\n${err.message}`);
  }
};

/** @type {ReadFileUrl} */
const mdLoader = async (filePath, fileName, req, res) => {
  try {
    const mdContent = await fs.promises.readFile(filePath, 'utf-8');
    const html = marked.parse(mdContent);

    // Wraps the HTML in a basic template
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>${fileName}</title>
          <style>
            body {
              max-width: 800px;
              margin: 2rem auto;
              padding: 1rem;
              font-family: sans-serif;
              line-height: 1.6;
            }
            h1,h2,h3 { border-bottom: 1px solid #ccc; }
            code { background: #eee; padding: 2px 4px; border-radius: 4px; }
            pre code { display: block; padding: 1rem; background: #272822; color: #f8f8f2; overflow-x: auto; }
          </style>
        </head>
        <body>
          ${html}
        </body>
      </html>
    `);
  } catch (err) {
    res.status(404).send(`Markdown file not found: ${fileName}`);
  }
};

/** @type {ReadFileUrl} */
const readScss = async (filePath, fileName, req, res) => {
  try {
    const result = await sass.compileAsync(filePath, {
      style: 'expanded',
      loadPaths: [path.dirname(filePath), nodeModulesDir],
      quietDeps: true,
      silenceDeprecations: ['import'],
    });
    res.type('text/css').send(result.css);
  } catch (err) {
    console.error(err);
    res.status(500).type('text/plain').send(`SCSS compilation error:\n${err.message}`);
  }
};

/**
 * Renderers applied to files served from disk, keyed by file extension.
 * Any request whose path ends with one of these extensions is rendered
 * instead of being streamed as a raw file.
 * @type {Map<string, ReadFileUrl>}
 */
const renderers = new Map([
  ['.scss', readScss],
  ['.md', mdLoader],
]);

/**
 * Directories scanned by the on-the-fly renderer, in priority order.
 * @type {string[]}
 */
const renderRoots = [publicDir, imgDir, errorsDir];

/**
 * Resolves a URL path to an existing file inside one of the render roots.
 * @param {string} urlPath - Raw pathname taken from the request.
 * @returns {string|null} Absolute path of the first match, or null when none exists.
 */
function resolveRenderTarget(urlPath) {
  /** @type {string} */
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath);
  } catch {
    return null;
  }

  const relative = decoded.replace(/^[/\\]+/, '');
  if (relative === '') return null;

  for (const root of renderRoots) {
    const candidate = path.resolve(root, relative);
    if (!candidate.startsWith(root + path.sep)) continue;
    try {
      if (fs.statSync(candidate).isFile()) return candidate;
    } catch {
      // Not in this root: try the next one.
    }
  }

  return null;
}

/**
 * Renders `.scss` and `.md` files on the fly, no matter which folder they
 * live in. Must be registered before the static handler so the raw file never
 * reaches the browser.
 */
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return next();

  const renderer = renderers.get(path.extname(req.path).toLowerCase());
  if (!renderer) return next();

  const filePath = resolveRenderTarget(req.path);
  if (!filePath) return next();

  disableCache(res);
  Promise.resolve(renderer(filePath, path.relative(projectRoot, filePath), req, res)).catch(next);
});

app.use(
  expressStatic(publicDir, {
    etag: false,
    lastModified: false,
    cacheControl: false,
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    },
  }),
);

// Custom middleware for .mjs
const sources = ['src', 'dist'];
const versions = ['legacy', '_', 'v1'];
for (const src of sources) {
  for (const v of versions) {
    const tinyRegex = new RegExp(`^\\/${src}\\/${v}\\/(.*)$`);
    const where = `./${src}/${v}`;
    app.get(tinyRegex, readFileUrl('application/javascript', ['.mjs', '.js'], where, jsLoader));
    app.get(tinyRegex, readFileUrl('text/css', ['.css'], where));
    app.get(tinyRegex, readFileUrl('text/css', ['.scss'], where, readScss));
    app.get(tinyRegex, readFileUrl('text/markdown', ['.md'], where, mdLoader));
  }
}

// Install external modules
/**
 * @param {string[]} modNames
 * @param {string[]} globalNames
 * @param {string[]} globalResults
 */
const installNodeModules = (modNames, globalNames, globalResults) => async (req, res, next) => {
  try {
    const jsList = [];
    const promises = [];
    for (const index in modNames) {
      const modName = modNames[index];
      promises.push(
        new Promise(async (resolve, reject) => {
          try {
            const result = await build({
              entryPoints: [modName],
              bundle: true,
              write: false,
              format: 'iife',
              globalName: globalNames[index],
              platform: 'browser',
              external: [...modNames, 'window', 'global'],
            });

            if (result.errors.length > 0) {
              for (const err of result.errors) console.error(err);
              throw new Error(`Failed to bundle ${modName}`);
            }

            if (result.warnings.length > 0) {
              for (const warn of result.warnings) console.warn(warn);
            }

            jsList.push({
              data: `${result.outputFiles[0].text}${typeof globalResults[index] === 'string' ? `\n${globalResults[index]}\n` : ''}`,
              index,
            });
            resolve();
          } catch (err) {
            reject(err);
          }
        }),
      );
    }

    await Promise.all(promises);
    jsList.sort(arraySortPositions('index'));

    const final = `
      // Polyfill: require('${modNames[0]}') e ${globalNames[0]} global
      (function () {
        ${jsList.map((js) => js.data).join('\n')}
      })();
    `;

    res.type('application/javascript');
    res.send(final);
  } catch (err) {
    console.error(err);
    res.status(500).send(`Failed to bundle ${modNames[0]}`);
  }
};

/**
 * Streams a file from the public directory at a controlled pace.
 *
 * Throttling is what makes streaming and abort observable: a local file loads
 * in a couple of milliseconds, so without it the progress bar jumps from 0 to
 * 100 and `abort()` has no window to run in.
 *
 * Query parameters:
 * - `src`   (required) Path relative to the public directory.
 * - `chunk` (default 65536) Bytes per read.
 * - `delay` (default 0) Milliseconds to wait between chunks.
 * - `type`  (optional) Overrides the Content-Type header.
 */
app.get('/__slow', async (req, res) => {
  disableCache(res);

  const target = String(req.query.src || '');
  const chunkSize = Math.max(1, Number(req.query.chunk) || 65536);
  const delay = Math.max(0, Number(req.query.delay) || 0);

  const filePath = resolveMedia(target);
  if (!filePath) {
    return res.status(404).send(`Not found: ${target}`);
  }

  /** @type {fs.Stats} */
  let stats;
  try {
    stats = await fs.promises.stat(filePath);
  } catch {
    return res.status(404).send(`Not found: ${target}`);
  }

  const fileSize = stats.size;
  const rangeHeader = req.headers.range;
  const ifRange = req.headers['if-range'];
  const etag = `W/"${fileSize}-${stats.mtime.getTime()}"`;

  res.setHeader('ETag', etag);
  res.setHeader('Last-Modified', stats.mtime.toUTCString());
  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Cache-Control', 'no-store'); // Prevent strict caching for development simulation
  res.type(getContentTypeNative(filePath));

  let start = 0;
  let end = fileSize - 1;
  let statusCode = 200;

  let useRange = !!rangeHeader && rangeHeader.startsWith('bytes=');

  // Handle If-Range (Avoid sending incorrect parts if the file changed on the server)
  if (useRange && ifRange) {
    if (ifRange.startsWith('W/') || ifRange.startsWith('"')) {
      if (ifRange !== etag) useRange = false;
    } else {
      if (new Date(ifRange).getTime() !== stats.mtime.getTime()) useRange = false;
    }
  }

  // RFC-compliant HTTP Range parsing logic
  if (useRange) {
    const rangeStr = rangeHeader.replace(/bytes=/i, '').trim();
    // Get the first range if it's a multipart (browsers handle the first part well)
    const firstRange = rangeStr.split(',')[0].trim();

    if (firstRange.startsWith('-')) {
      // Suffix byte range (e.g., "-500" requests the last 500 bytes)
      const bytes = parseInt(firstRange.slice(1), 10);
      if (!isNaN(bytes)) {
        start = Math.max(0, fileSize - bytes);
        end = fileSize - 1;
      } else {
        useRange = false;
      }
    } else {
      const parts = firstRange.split('-');
      const parsedStart = parseInt(parts[0], 10);
      const parsedEnd = parseInt(parts[1], 10);

      if (!isNaN(parsedStart)) {
        start = parsedStart;
        end = !isNaN(parsedEnd) ? Math.min(parsedEnd, fileSize - 1) : fileSize - 1;
      } else {
        useRange = false; // Invalid
      }
    }

    if (useRange) {
      if (start >= fileSize || start > end) {
        res.status(416).setHeader('Content-Range', `bytes */${fileSize}`);
        return res.end();
      }
      statusCode = 206;
    }
  }

  const contentLength = Number(end - start) + 1;

  res.status(statusCode);
  res.setHeader('Content-Length', String(contentLength));

  if (statusCode === 206) {
    res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
  }

  // If the request is HEAD, we end it immediately!
  // This skips the entire file reading process and simulated delays.
  if (req.method === 'HEAD') {
    return res.end();
  }

  // The stream and slow loop continue only if it's a real GET
  const stream = fs.createReadStream(filePath, { start, end, highWaterMark: chunkSize });
  let closed = false;
  const cleanup = () => {
    if (closed) return;
    closed = true;
    stream.destroy();
  };

  // Clean up the stream if the connection drops or a read error occurs
  req.on('close', cleanup);
  res.on('close', cleanup);
  stream.on('error', cleanup);

  try {
    for await (const chunk of stream) {
      if (closed) break; // Para o loop se o navegador cancelar o carregamento
      if (!res.write(chunk)) {
        await new Promise((resolve) => res.once('drain', resolve));
      }
      if (delay > 0 && !closed) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    if (!closed) res.end();
  } catch {
    if (!res.writableEnded) res.end();
  }
});

/**
 * Lists the media files available under the public directory so the harness can
 * populate its presets without hardcoding paths.
 */
app.get('/__fixtures', async (req, res) => {
  disableCache(res);
  const extensions = new Set([
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
    '.avif',
    '.svg',
    '.mp4',
    '.webm',
    '.mov',
    '.mp3',
    '.wav',
    '.ogg',
    '.m4a',
    '.flac',
  ]);
  const found = [];
  const walk = async (dir) => {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
        await walk(full);
      } else if (extensions.has(path.extname(entry.name).toLowerCase())) {
        const relative = path.relative(publicDir, full);
        found.push('/' + relative.split(path.sep).join('/'));
      }
    }
  };
  try {
    for (const root of mediaRoots) {
      await walk(root);
    }
    res.json(found);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Serve global buffer for the browser
app.get(
  '/__buffer.js',
  installNodeModules(['buffer'], ['Buffer'], ['window.Buffer = Buffer.Buffer;']),
);
app.get(
  '/__jquery.js',
  installNodeModules(['jquery'], ['jQuery'], ['window.jQuery = jQuery; window.$ = jQuery;']),
);

// Middleware to serve static files
app.use(expressStatic(publicDir));
app.use(expressStatic(imgDir));
app.use(expressStatic(errorsDir));
app.use('/node_modules', expressStatic(path.join(__dirname, '../node_modules')));

/**
 * Middleware to serve index.html if the requested path is a directory.
 * This is placed before the 404 handler to catch requests that didn't match
 * any specific file or static route.
 */
app.use(async (req, res, next) => {
  // We only want to intercept GET requests
  if (req.method !== 'GET') return next();

  // Construct the path to the requested directory relative to the project root
  const targetPath = path.join(publicDir, req.path);
  const indexPath = path.join(targetPath, 'index.html');

  try {
    // Check if the requested path is a directory
    const stats = await fs.promises.stat(targetPath);

    if (stats.isDirectory()) {
      // Check if index.html exists inside that directory
      try {
        await fs.promises.access(indexPath);
        // If index.html exists, serve it
        return res.sendFile(indexPath);
      } catch (err) {
        // index.html does not exist in this directory, move to the next middleware (404)
        return next();
      }
    }
  } catch (err) {
    // The path is not a directory or doesn't exist, move to the next middleware
    return next();
  }
});

// ---------------------
// Catch 404 and forward to error handler
// ---------------------
app.use((req, res, next) => {
  res.status(404);
  res.sendFile(path.join(__dirname, 'errors/404.html'));
});

// ---------------------
// Error handler (500 and others)
// ---------------------
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500);
  res.sendFile(path.join(__dirname, 'errors/500.html'));
});

// Start the server
app.listen(port, '127.0.0.1', () => {
  console.log(`Static server running at http://localhost:${port}`);
});
