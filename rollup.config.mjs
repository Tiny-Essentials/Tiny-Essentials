import resolve from '@rollup/plugin-node-resolve';
import json from '@rollup/plugin-json';
import commonjs from '@rollup/plugin-commonjs';
import preserveDirectories from 'rollup-preserve-directives';

import fs from 'fs';
import path from 'path';

const pkg = JSON.parse(fs.readFileSync('./package.json'));

// Function to get all .mjs files from src/, skipping every node_modules folder.
// The webTemplates folder holds third-party projects with their own installed
// dependencies, and those files must never be used as Rollup entry points.
function getAllInputFiles(dir = 'src') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') return [];
      return getAllInputFiles(fullPath);
    }
    if (entry.isFile() && entry.name.endsWith('.mjs')) return fullPath;
    return [];
  });
  return files;
}

const inputFiles = getAllInputFiles();

// Prepare Plugins
const plugins = [resolve({ preferBuiltins: true }), json(), commonjs(), preserveDirectories()];

// Every bare specifier (a package or a Node.js builtin) is kept external.
// This is required because the projects inside src/v1/webTemplates ship their own
// node_modules (vite, canvas, ag-psd, ...) that are not listed in the root
// package.json. Without this, Rollup would try to bundle them and, with
// preserveModules enabled, would dump them into dist/node_modules.
const externalDependencies = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.devDependencies || {}),
];

// A specifier is a package/builtin only when it does not point to a real file
// inside this repository (Rollup also calls `external` with entry paths).
const isBareSpecifier = (id) => !id.startsWith('.') && !path.isAbsolute(id) && !fs.existsSync(id);

const isExternal = (id) =>
  isBareSpecifier(id) || externalDependencies.some((dep) => id === dep || id.startsWith(`${dep}/`));

export default [
  {
    external: isExternal,
    input: inputFiles,
    output: {
      dir: 'dist',
      format: 'cjs',
      sourcemap: false,
      preserveModules: true,
      preserveModulesRoot: 'src',
      entryFileNames: '[name].cjs',
    },
    plugins,
  },
];
