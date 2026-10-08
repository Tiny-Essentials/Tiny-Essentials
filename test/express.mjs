import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { marked } from 'marked';
import * as sass from 'sass';
import { build } from 'esbuild';

import { arraySortPositions } from '../src/v1/index.mjs';

const app = express();
const port = 3145;

// Resolve __dirname (já que estamos usando ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIME_TYPES = {
  // === TEXTO ===
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.txt': 'text/plain; charset=utf-8',
  '.csv': 'text/csv',
  '.md': 'text/markdown',
  '.xml': 'application/xml',

  // === IMAGENS ===
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

  // === ÁUDIO ===
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/x-m4a',
  '.aac': 'audio/aac',
  '.flac': 'audio/flac',
  '.mid': 'audio/midi',
  '.midi': 'audio/midi',

  // === VÍDEO ===
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogv': 'video/ogg',
  '.avi': 'video/x-msvideo',
  '.mov': 'video/quicktime',
  '.mpeg': 'video/mpeg',
  '.mkv': 'video/x-matroska',

  // === DOCUMENTOS / OFFICE ===
  '.pdf': 'application/pdf',
  '.json': 'application/json',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.odt': 'application/vnd.oasis.opendocument.text',
  '.ods': 'application/vnd.oasis.opendocument.spreadsheet',

  // === COMPACTADOS / ARQUIVOS ===
  '.zip': 'application/zip',
  '.rar': 'application/x-rar-compressed',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
  '.7z': 'application/x-7z-compressed',

  // === FONTES ===
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.eot': 'application/vnd.ms-fontobject',

  // === OUTROS / BINÁRIOS ===
  '.exe': 'application/octet-stream',
  '.bin': 'application/octet-stream',
  '.wasm': 'application/wasm',
};

function getContentTypeNative(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

// Define a pasta pública
const publicDir = path.join(__dirname, './html');
const imgDir = path.join(__dirname, './img');
const errorsDir = path.join(__dirname, './errors');
const projectRoot = path.join(__dirname, '../');

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
  // Website you wish to allow to connect
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Request methods you wish to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  next();
});

app.use(
  express.static(publicDir, {
    etag: false,
    lastModified: false,
    maxAge: 0,
    cacheControl: false,
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    },
  }),
);

function disableCache(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
}

/**
 * @typedef {(filePath: string, fileName: string, req: import('express').Request, res: import('express').Response, next?: import('express').NextFunction) => void} ReadFileUrl
 */

/**
 * @param {string} mimetype
 * @param {string[]} formats
 * @param {string} folder
 * @param {ReadFileUrl} [response]
 * @returns {import('express').Application}
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

    // Detecta imports de módulos Node e substitui por mocks
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

    // Envolve o HTML em um template básico
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
    const result = sass.compile(filePath, {
      style: 'expanded',
      loadPaths: [path.dirname(filePath)],
    });
    res.send(result.css);
  } catch (err) {
    console.error(err);
    res.status(500).send(`SCSS compilation error:\n${err.message}`);
  }
};

// Middleware personalizado para .mjs
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

// Instalar modulos externos
/** @type {(modNames: string[], globalNames: string[], globalResults: string[]) => import('express').Application} */
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

  res.type(getContentTypeNative(filePath));
  res.setHeader('Content-Length', String(stats.size));
  res.setHeader('Accept-Ranges', 'none');
  res.setHeader('Cache-Control', 'no-store');

  const stream = fs.createReadStream(filePath, { highWaterMark: chunkSize });
  let closed = false;
  const cleanup = () => {
    closed = true;
    stream.destroy();
  };
  req.on('close', cleanup);
  res.on('close', cleanup);

  try {
    for await (const chunk of stream) {
      if (closed) return;
      if (!res.write(chunk)) {
        await new Promise((resolve) => res.once('drain', resolve));
      }
      if (delay > 0) {
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

// Serve buffer global para o navegador
app.get(
  '/__buffer.js',
  installNodeModules(['buffer'], ['Buffer'], ['window.Buffer = Buffer.Buffer;']),
);
app.get(
  '/__jquery.js',
  installNodeModules(['jquery'], ['jQuery'], ['window.jQuery = jQuery; window.$ = jQuery;']),
);

// Middleware para servir arquivos estáticos
app.use(express.static(publicDir));
app.use(express.static(imgDir));
app.use(express.static(errorsDir));
app.use('/node_modules', express.static(path.join(__dirname, '../node_modules')));

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

// Inicia o servidor
app.listen(port, '127.0.0.1', () => {
  console.log(`Static server running at http://localhost:${port}`);
});
