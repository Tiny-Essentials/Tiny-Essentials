#!/usr/bin/env node

import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import parser from '@babel/parser';
import _traverse from '@babel/traverse';
import _generate from '@babel/generator';
import * as t from '@babel/types';

// Workaround for Babel ESM compatibility
const traverse = _traverse.default || _traverse;
const generate = _generate.default || _generate;

const LATEST_VERSION = 1;

/**
 * Defines the current execution paths.
 * @typedef {Object} AppPaths
 * @property {string} cliRoot - The root directory of tiny-essentials.
 * @property {string} userProjectRoot - The root directory of the user's project invoking the CLI.
 */
const PATHS = {
  cliRoot: path.dirname(fileURLToPath(import.meta.url)),
  userProjectRoot: process.cwd(),
  /**
   * Resolves the output directory.
   * @param {string|null} customPath - Optional custom path provided by the user.
   * @returns {string} The absolute path for the vendor directory.
   */
  getVendorDir(customPath) {
    return customPath
      ? path.resolve(this.userProjectRoot, customPath)
      : path.join(this.userProjectRoot, 'vendor', 'tiny-essentials');
  },
};

/**
 * Parses a single user input target into resolving segments.
 *
 * @param {string} rawTarget - The raw string input from CLI.
 * @returns {Object} Target descriptors.
 * @property {number|null} targetVersion - The explicit version if provided.
 * @property {string} basePath - The relative path requested.
 * @property {string[]} functionsToExtract - The specific functions to pull via Babel.
 */
function parseTarget(rawTarget) {
  let targetVersion = null;
  let cleanTarget = rawTarget;

  const versionMatch = rawTarget.match(/^v(\d+)\//);
  if (versionMatch) {
    targetVersion = parseInt(versionMatch[1], 10);
    cleanTarget = rawTarget.replace(versionMatch[0], '');
  }

  const hasFunctions = cleanTarget.includes(',');
  let functionsToExtract = [];
  let basePath = cleanTarget;

  if (hasFunctions) {
    const parts = cleanTarget.split('/');
    const lastPart = parts.pop();
    if (lastPart) {
      functionsToExtract = lastPart.split(',').map((f) => f.trim());
      basePath = parts.join('/');
    }
  }

  return { targetVersion, basePath, functionsToExtract };
}

/**
 * Searches for the requested module file across versions.
 *
 * @param {number|null} targetVersion - The optional hardcoded version.
 * @param {string} basePath - The module path.
 * @returns {Promise<{ filePath: string, ext: string, versionDir: string, interceptedFunction?: string }>} Resolved file info.
 */
async function resolveSourceFile(targetVersion, basePath) {
  if (basePath.includes('/build/')) {
    throw new Error('Forbidden extraction: Cannot export files from the build directory.');
  }

  const extensions = ['.mjs', '.js'];
  const startVersion = targetVersion || LATEST_VERSION;
  const endVersion = targetVersion ? targetVersion : 1;

  for (let v = startVersion; v >= endVersion; v--) {
    const versionDir = path.join(PATHS.cliRoot, 'dist', `v${v}`);

    // If it's a direct file path without functions (which means basePath might be the full path)
    for (const ext of extensions) {
      // First attempt: Treating basePath as the exact file (minus extension)
      const exactPath = path.join(versionDir, `${basePath}${ext}`);
      if (existsSync(exactPath)) return { filePath: exactPath, ext, versionDir };

      // Second attempt: Checking if the last folder segment in basePath was meant to be functions,
      // but didn't have commas. (e.g., folder/module/func1)
      const parts = basePath.split('/');
      if (parts.length > 1) {
        const funcNameCandidate = parts.pop();
        const modulePath = parts.join('/');
        const nestedPath = path.join(versionDir, `${modulePath}${ext}`);

        if (existsSync(nestedPath)) {
          // Returns the path, but caller needs to know it intercepted a single function
          return { filePath: nestedPath, ext, versionDir, interceptedFunction: funcNameCandidate };
        }
      }
    }
  }

  throw new Error(`Module not found: ${basePath}`);
}

/**
 * Advanced Multi-File Dependency Extractor.
 * Parses files, traces dependencies, and extracts everything mirroring the original structure.
 */
class MultiFileExtractor {
  /**
   * @param {string} outDir - The base output directory.
   */
  constructor(outDir) {
    this.outDir = outDir;
    this.fileRequests = new Map();
    this.processedFiles = new Map();
  }

  /**
   * Registers a file and the specific functions needed from it into the extraction queue.
   *
   * @param {string} filePath - Absolute path to the file.
   * @param {string[]} names - Specific exports to keep (empty array means full file).
   * @param {string} versionDir - The base version directory for structural mirroring.
   */
  requestExtraction(filePath, names, versionDir) {
    if (!this.fileRequests.has(filePath)) {
      this.fileRequests.set(filePath, { names: new Set(), versionDir, full: false });
    }
    const req = this.fileRequests.get(filePath);

    if (names.length === 0) {
      req.full = true;
    } else {
      names.forEach((n) => req.names.add(n));
    }
  }

  /**
   * Resolves local imports relative to the current file.
   *
   * @param {string} currentFilePath - The file importing the module.
   * @param {string} importStr - The import string.
   * @returns {string|null} Resolved absolute path or null if it's an external package.
   */
  resolveImportPath(currentFilePath, importStr) {
    if (!importStr.startsWith('.')) return null; // Ignore external/node_modules

    const dir = path.dirname(currentFilePath);
    let resolved = path.resolve(dir, importStr);

    if (!path.extname(resolved)) {
      for (const ext of ['.mjs', '.js']) {
        if (existsSync(resolved + ext)) return resolved + ext;
      }
    }
    return resolved;
  }

  async processQueue() {
    let processedCount = 0;

    // Use a while loop because tracing dependencies will dynamically add new files to the Map
    while (processedCount < this.fileRequests.size) {
      const entries = Array.from(this.fileRequests.entries());

      for (const [filePath, req] of entries) {
        if (this.processedFiles.has(filePath)) continue;

        const finalCode = await this.parseAndPrune(filePath, req);
        this.processedFiles.set(filePath, { code: finalCode, versionDir: req.versionDir });
        processedCount++;
      }
    }

    await this.writeFiles();
  }

  /**
   * Core AST manipulation: traces required imports and removes unused code.
   *
   * @param {string} filePath - Target file path.
   * @param {Object} req - Request object containing required export names.
   * @returns {Promise<string>} The minified and formatted generated source code.
   */
  async parseAndPrune(filePath, req) {
    const sourceCode = await fs.readFile(filePath, 'utf-8');
    const ast = parser.parse(sourceCode, { sourceType: 'module', plugins: ['classProperties'] });

    const localKeepNames = new Set();
    const requiredImports = new Map();

    // Phase 1: Deep traceability
    traverse(ast, {
      Program: (astPath) => {
        const bindings = astPath.scope.bindings;

        if (req.full) {
          Object.keys(bindings).forEach((name) => localKeepNames.add(name));
        }

        const queue = [];
        const addToKeep = (name) => {
          if (!localKeepNames.has(name)) {
            localKeepNames.add(name);
            queue.push(name);
          }
        };

        astPath.traverse({
          // Tracing Static Methods on any Class
          ClassDeclaration(classPath) {
            if (req.full) return;
            classPath.node.body.body.forEach((item) => {
              const keyName = t.isIdentifier(item.key) ? item.key.name : null;
              if (
                keyName &&
                item.static &&
                (t.isClassMethod(item) || t.isClassProperty(item)) &&
                req.names.has(keyName)
              ) {
                traverse(
                  item,
                  {
                    Identifier(idPath) {
                      if (idPath.isReferencedIdentifier() && bindings[idPath.node.name]) {
                        addToKeep(idPath.node.name);
                      }
                    },
                  },
                  astPath.scope,
                  astPath,
                );
              }
            });
          },
          CallExpression(callPath) {
            if (callPath.node.callee.type === 'Import') {
              const arg = callPath.node.arguments[0];
              if (t.isStringLiteral(arg)) {
                const source = arg.value;
                if (!requiredImports.has(source)) requiredImports.set(source, new Set());
                requiredImports.get(source).add({ local: '*', imported: '*' });
              }
            }
          },
          ImportDeclaration(expPath) {
            const source = expPath.node.source.value;
            if (!requiredImports.has(source)) requiredImports.set(source, new Set());

            if (req.full) {
              if (expPath.node.specifiers.length === 0) {
                requiredImports.get(source).add({ local: null, imported: null });
              } else {
                expPath.node.specifiers.forEach((spec) => {
                  const importedName = t.isImportDefaultSpecifier(spec)
                    ? 'default'
                    : t.isImportNamespaceSpecifier(spec)
                      ? '*'
                      : spec.imported.name;
                  requiredImports
                    .get(source)
                    .add({ local: spec.local.name, imported: importedName });
                });
              }
            }
          },
          // Catch re-exports (export * from './module')
          ExportAllDeclaration(expPath) {
            if (expPath.node.source) {
              const source = expPath.node.source.value;
              if (!requiredImports.has(source)) requiredImports.set(source, new Set());
              // Always request '*' to trace export everything if needed
              requiredImports.get(source).add({ local: '*', imported: '*', isExportAll: true });
            }
          },
          ExportNamedDeclaration(expPath) {
            if (expPath.node.source) {
              // Tracing specific re-exports: export { target } from './module'
              const source = expPath.node.source.value;
              if (!requiredImports.has(source)) requiredImports.set(source, new Set());

              expPath.node.specifiers.forEach((spec) => {
                const exportedName = spec.exported.name;
                if (req.full || req.names.has(exportedName)) {
                  const importedName = spec.local ? spec.local.name : exportedName;
                  requiredImports
                    .get(source)
                    .add({ local: null, imported: importedName, isReExport: true, exportedName });
                }
              });
            } else {
              const dec = expPath.node.declaration;
              if (dec) {
                if (t.isFunctionDeclaration(dec) && (req.full || req.names.has(dec.id.name))) {
                  addToKeep(dec.id.name);
                } else if (t.isVariableDeclaration(dec)) {
                  dec.declarations.forEach((d) => {
                    if (t.isIdentifier(d.id) && (req.full || req.names.has(d.id.name)))
                      addToKeep(d.id.name);
                  });
                }
              } else if (expPath.node.specifiers) {
                expPath.node.specifiers.forEach((spec) => {
                  if (req.full || req.names.has(spec.exported.name)) addToKeep(spec.local.name);
                });
              }
            }
          },
          ExportDefaultDeclaration(expPath) {
            const dec = expPath.node.declaration;
            if (req.full || req.names.has('default')) {
              if (t.isIdentifier(dec)) addToKeep(dec.name);
              else if (dec.id) addToKeep(dec.id.name);
            }
          },
        });

        // Trace local variables and imports inside the queue
        let i = 0;
        while (i < queue.length) {
          const currentName = queue[i++];
          const binding = bindings[currentName];

          if (binding) {
            // Namespace Specifier Fix Included!
            if (
              binding.path.isImportSpecifier() ||
              binding.path.isImportDefaultSpecifier() ||
              binding.path.isImportNamespaceSpecifier()
            ) {
              const importDecl = binding.path.parentPath.node;
              const source = importDecl.source.value;
              if (!requiredImports.has(source)) requiredImports.set(source, new Set());

              const importedName = binding.path.isImportDefaultSpecifier()
                ? 'default'
                : binding.path.isImportNamespaceSpecifier()
                  ? '*'
                  : binding.path.node.imported.name;
              requiredImports.get(source).add({ local: currentName, imported: importedName });
            } else {
              binding.path.traverse({
                Identifier(idPath) {
                  if (idPath.isReferencedIdentifier() && bindings[idPath.node.name]) {
                    addToKeep(idPath.node.name);
                  }
                },
              });
            }
          }
        }
      },
    });

    // Trigger extraction of all found deep dependencies
    for (const [source, specs] of requiredImports.entries()) {
      const resolvedPath = this.resolveImportPath(filePath, source);
      if (resolvedPath) {
        // If it's a full export dependency (like side-effect imports or export *), request full extraction
        const isFullDependency = Array.from(specs).some(
          (s) => s.imported === null || s.imported === '*',
        );
        const importedNamesToRequest = isFullDependency
          ? []
          : Array.from(specs).map((s) => s.imported);

        this.requestExtraction(resolvedPath, importedNamesToRequest, req.versionDir);
      }
    }

    // Phase 2: Surgical Pruning
    if (!req.full) {
      // Helper function to extract Class Methods AND Class Properties natively
      const extractStaticMethods = (classNode) => {
        const newNodes = [];
        classNode.body.body.forEach((item) => {
          const keyName = t.isIdentifier(item.key) ? item.key.name : null;
          if (
            keyName &&
            item.static &&
            (t.isClassMethod(item) || t.isClassProperty(item)) &&
            req.names.has(keyName)
          ) {
            if (t.isClassMethod(item)) {
              const func = t.functionDeclaration(
                t.identifier(keyName),
                item.params,
                item.body,
                item.generator,
                item.async,
              );
              if (item.leadingComments) func.leadingComments = item.leadingComments;
              newNodes.push(t.exportNamedDeclaration(func));
            } else if (t.isClassProperty(item)) {
              const variableDec = t.variableDeclaration('const', [
                t.variableDeclarator(t.identifier(keyName), item.value),
              ]);
              if (item.leadingComments) variableDec.leadingComments = item.leadingComments;
              newNodes.push(t.exportNamedDeclaration(variableDec));
            }
          }
        });
        return newNodes;
      };

      traverse(ast, {
        Program(astPath) {
          const body = astPath.get('body');
          for (const statement of body) {
            let keep = false;

            if (statement.isImportDeclaration()) {
              const source = statement.node.source.value;
              if (requiredImports.has(source)) {
                const neededSpecs = requiredImports.get(source);
                const neededLocalNames = new Set(
                  Array.from(neededSpecs)
                    .map((s) => s.local)
                    .filter(Boolean),
                );

                if (statement.node.specifiers.length > 0) {
                  statement.node.specifiers = statement.node.specifiers.filter((spec) =>
                    neededLocalNames.has(spec.local.name),
                  );
                  if (statement.node.specifiers.length > 0) keep = true;
                }
              }
            } else if (statement.isExportNamedDeclaration()) {
              if (statement.node.source) {
                const source = statement.node.source.value;
                if (requiredImports.has(source)) {
                  const neededSpecs = requiredImports.get(source);
                  const neededExportedNames = new Set(
                    Array.from(neededSpecs)
                      .filter((s) => s.isReExport)
                      .map((s) => s.exportedName),
                  );

                  statement.node.specifiers = statement.node.specifiers.filter((spec) =>
                    neededExportedNames.has(spec.exported.name),
                  );
                  if (statement.node.specifiers.length > 0) keep = true;
                }
              } else {
                const dec = statement.get('declaration');
                if (
                  dec &&
                  dec.isFunctionDeclaration() &&
                  (req.names.has(dec.node.id.name) || localKeepNames.has(dec.node.id.name))
                ) {
                  keep = true;
                } else if (dec && dec.isVariableDeclaration()) {
                  const keepers = dec.node.declarations.filter(
                    (d) =>
                      t.isIdentifier(d.id) &&
                      (req.names.has(d.id.name) || localKeepNames.has(d.id.name)),
                  );
                  if (keepers.length > 0) {
                    dec.node.declarations = keepers;
                    keep = true;
                  }
                } else if (dec && dec.isClassDeclaration()) {
                  if (req.names.has(dec.node.id.name) || localKeepNames.has(dec.node.id.name)) {
                    keep = true;
                  } else {
                    const extractedNodes = extractStaticMethods(dec.node);
                    if (extractedNodes.length > 0) {
                      statement.replaceWithMultiple(extractedNodes);
                      keep = true;
                      continue;
                    }
                  }
                } else if (statement.node.specifiers && statement.node.specifiers.length > 0) {
                  statement.node.specifiers = statement.node.specifiers.filter(
                    (spec) =>
                      req.names.has(spec.exported.name) || localKeepNames.has(spec.local.name),
                  );
                  if (statement.node.specifiers.length > 0) keep = true;
                }
              }
            } else if (statement.isExportAllDeclaration()) {
              const source = statement.node.source.value;
              if (requiredImports.has(source)) {
                const neededSpecs = requiredImports.get(source);
                if (Array.from(neededSpecs).some((s) => s.isExportAll)) keep = true;
              }
            } else if (statement.isExportDefaultDeclaration()) {
              if (req.names.has('default')) {
                keep = true;
              } else if (t.isClassDeclaration(statement.node.declaration)) {
                const extractedNodes = extractStaticMethods(statement.node.declaration);
                if (extractedNodes.length > 0) {
                  statement.replaceWithMultiple(extractedNodes);
                  keep = true;
                  continue;
                }
              }
            } else if (statement.isClassDeclaration()) {
              if (localKeepNames.has(statement.node.id.name)) {
                keep = true;
              } else {
                const extractedNodes = extractStaticMethods(statement.node);
                if (extractedNodes.length > 0) {
                  statement.replaceWithMultiple(extractedNodes);
                  keep = true;
                  continue;
                }
              }
            } else if (
              statement.isFunctionDeclaration() &&
              localKeepNames.has(statement.node.id.name)
            ) {
              keep = true;
            } else if (statement.isVariableDeclaration()) {
              const keepers = statement.node.declarations.filter(
                (d) => t.isIdentifier(d.id) && localKeepNames.has(d.id.name),
              );
              if (keepers.length > 0) {
                statement.node.declarations = keepers;
                keep = true;
              }
            }

            if (!keep) statement.remove();
          }
        },
      });
    }

    return generate(ast).code;
  }

  /**
   * Flushes processed files mapping onto the filesystem maintaining origin structure.
   */
  async writeFiles() {
    let filesSaved = 0;
    for (const [filePath, data] of this.processedFiles.entries()) {
      const relativeToVersion = path.relative(data.versionDir, filePath);
      const destPath = path.join(this.outDir, relativeToVersion);

      await fs.mkdir(path.dirname(destPath), { recursive: true });
      await fs.writeFile(destPath, data.code, 'utf-8');
      console.log(`> Created: ${relativeToVersion}`);
      filesSaved++;
    }
    console.log(`\nSuccessfully orchestrated and bundled ${filesSaved} isolated files!`);
  }
}

/**
 * Main execution function for the CLI tool.
 */
async function runCLI() {
  const args = process.argv.slice(2);

  const outDirArg = args.find((a) => a.startsWith('--out-dir='));
  const customOutDir = outDirArg ? outDirArg.split('=')[1] : null;

  // Filter out flags to get the raw target strings
  const rawTargets = args.filter((a) => !a.startsWith('--'));

  if (rawTargets.length === 0) {
    console.error('Usage: npx tiny-fork [--out-dir=custom/path] <target1> [target2] ...');
    console.error('Example: npx tiny-fork v1/basics/example/func1 v1/ui/button');
    process.exit(1);
  }

  try {
    const finalVendorDir = PATHS.getVendorDir(customOutDir);
    const extractor = new MultiFileExtractor(finalVendorDir);

    for (const rawTarget of rawTargets) {
      let { targetVersion, basePath, functionsToExtract } = parseTarget(rawTarget);
      const resolved = await resolveSourceFile(targetVersion, basePath);

      if (resolved.interceptedFunction && functionsToExtract.length === 0) {
        functionsToExtract.push(resolved.interceptedFunction);
      }

      extractor.requestExtraction(resolved.filePath, functionsToExtract, resolved.versionDir);
    }

    console.log(`Starting extraction to: ${finalVendorDir}\n`);
    await extractor.processQueue();
  } catch (error) {
    console.error('\nError extracting modules:');
    console.error(error.message);
    process.exit(1);
  }
}

runCLI();
