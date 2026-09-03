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

// Define a pasta pública
const publicDir = path.join(__dirname, './html');
const imgDir = path.join(__dirname, './img');
const errorsDir = path.join(__dirname, './errors');
const projectRoot = path.join(__dirname, '../');

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

    // Normalização de export default
    code = code.replace(/export\s+default\s+([a-zA-Z0-9_$]+)\s*;?/g, 'export { $1 };');

    // Conversão de 'import something from "module";' para 'import { something } from "module";'
    code = code.replace(
      /import\s+([a-zA-Z0-9_$]+)\s+from\s+(['"][^'"]+['"]);?/g,
      'import { $1 } from $2;',
    );

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
