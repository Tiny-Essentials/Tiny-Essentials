import { readFile, mkdir, writeFile } from 'fs/promises';
import { resolve, sep, join, dirname, relative, posix } from 'path';
import { createRequire } from 'module';

// Enables resolving paths inside node_modules natively
const require = createRequire(import.meta.url);

/**
 * @typedef {Object} RootReplacement
 * @property {string} from - The directory name to replace (e.g., 'src').
 * @property {string} to - The directory name to insert (e.g., 'dist').
 */

/**
 * @typedef {Object} InlinerConfig
 * @property {string} entryPoint - The absolute or relative path to the entry file.
 * @property {string} outDir - The absolute or relative path to the output directory.
 * @property {string} outFileName - The name of the generated bundle file.
 * @property {RootReplacement} [rootReplacement] - Optional customization to remap project import roots.
 */

class TinyPluginInliner {
  /**
   * Creates an instance of the TinyPluginInliner.
   *
   * @param {InlinerConfig} config - The configuration object for the build process.
   */
  constructor(config) {
    this.config = config;
    this.entryFile = resolve(config.entryPoint);
    this.outDir = resolve(config.outDir);
    this.outFile = join(this.outDir, config.outFileName);
    this.entryDir = dirname(this.entryFile);

    this.hoistedImports = new Set();
    this.hoistedTypedefs = new Set();
  }

  /**
   * Rewrites all import paths (both standard and inside JSDocs) in a given code string.
   * Handles local path root replacements and NPM package absolute path conversion.
   *
   * @private
   * @param {string} code - The source code containing imports.
   * @param {string} sourceDir - The absolute directory of the file being processed.
   * @param {boolean} isNpm - Whether this code comes from an external NPM package.
   * @param {string|null} npmPackageName - The name of the NPM package, if applicable.
   * @returns {string} The code with all paths corrected.
   */
  _rewritePathsInString(code, sourceDir, isNpm, npmPackageName) {
    /**
     * @param {string} match
     * @param {string} prefix
     * @param {string} importPath
     * @param {string} suffix
     */
    const replacer = (match, prefix, importPath, suffix) => {
      // Ignore absolute external imports (e.g., 'discord.js')
      if (!importPath.startsWith('.')) return match;

      const absoluteTarget = resolve(sourceDir, importPath);

      if (isNpm) {
        // If it's a relative import inside an NPM package, map it back to an absolute NPM path
        const packageRootMarker = `node_modules${sep}${npmPackageName}`;
        const markerIndex = absoluteTarget.lastIndexOf(packageRootMarker);

        if (markerIndex !== -1) {
          const packageRootPath = absoluteTarget.substring(
            0,
            markerIndex + packageRootMarker.length,
          );
          let subPath = relative(packageRootPath, absoluteTarget);
          subPath = subPath.split(sep).join(posix.sep);
          const finalNpmImport = `${npmPackageName}/${subPath}`;

          return `${prefix}${finalNpmImport}${suffix}`;
        }
        return match; // Fallback
      } else {
        // Local project file
        let modifiedTarget = absoluteTarget;

        // Applies the customizable project root replacement (e.g., 'src' to 'dist')
        if (this.config.rootReplacement) {
          const fromStr = `${sep}${this.config.rootReplacement.from}${sep}`;
          const toStr = `${sep}${this.config.rootReplacement.to}${sep}`;
          modifiedTarget = modifiedTarget.replace(fromStr, toStr);
        }

        // Calculate relative path from the new output directory
        let newRelativePath = relative(this.outDir, modifiedTarget);
        newRelativePath = newRelativePath.split(sep).join(posix.sep);

        // Ensure it starts with './' if it's in the same directory
        if (!newRelativePath.startsWith('.')) {
          newRelativePath = `./${newRelativePath}`;
        }

        return `${prefix}${newRelativePath}${suffix}`;
      }
    };

    // Corrects standard imports: from '../path'
    let result = code.replace(/(from\s+['"])([^'"]+)(['"])/g, replacer);

    // Corrects JSDoc typedef imports: import('../path')
    result = result.replace(/(import\s*\(\s*['"])([^'"]+)(['"]\s*\))/g, replacer);

    return result;
  }

  /**
   * Extracts and hoists already-corrected imports and typedefs.
   *
   * @private
   * @param {string} code - The source code to parse.
   * @returns {string} The code with imports and typedefs removed.
   */
  _extractAndHoist(code) {
    let processedCode = code;

    // Hoist imports
    const importRegex = /^import\s+[^;]+;/gm;
    const imports = processedCode.match(importRegex) || [];
    for (const imp of imports) this.hoistedImports.add(imp.trim());
    processedCode = processedCode.replace(importRegex, '').trim();

    // Hoist typedefs
    const typedefRegex = /\/\*\*[\s\S]*?@typedef[\s\S]*?\*\//g;
    const typedefs = processedCode.match(typedefRegex) || [];
    for (const def of typedefs) this.hoistedTypedefs.add(def.trim());
    processedCode = processedCode.replace(typedefRegex, '').trim();

    return processedCode;
  }

  /**
   * Cleans up the plugin code to be safely injected into the .insert() method.
   *
   * @private
   * @param {string} code - The raw plugin code.
   * @param {string} pluginName - The name of the plugin class/variable.
   * @returns {string} The formatted plugin code.
   */
  _formatPluginCode(code, pluginName) {
    let cleanCode = code;

    // Remove exports and declarations
    cleanCode = cleanCode.replace(new RegExp(`export\\s+default\\s+${pluginName};`), '');
    cleanCode = cleanCode.replace(new RegExp(`const\\s+${pluginName}\\s*=\\s*`), '');

    // Remove the JSDoc block specifically targeting the (Base) => wrapper
    cleanCode = cleanCode.replace(/\/\*\*[\s\S]*?\*\/\s*(\(Base\)\s*=>)/, '$1');

    // Remove trailing semicolon
    cleanCode = cleanCode.trim();
    if (cleanCode.endsWith(';')) cleanCode = cleanCode.slice(0, -1);

    // Fix the @extends JSDoc
    cleanCode = cleanCode.replace(/@extends\s+\{[A-Za-z0-9_]+</g, '@extends {Base<');

    return cleanCode;
  }

  /**
   * Executes the build process.
   *
   * @returns {Promise<void>}
   */
  async build() {
    try {
      let entryContent = await readFile(this.entryFile, 'utf8');

      // Find all plugins being inserted
      const insertRegex = /\.insert\(\s*([a-zA-Z0-9_]+)\s*\)/g;
      const pluginsToInline = [...entryContent.matchAll(insertRegex)].map((m) => m[1]);

      if (pluginsToInline.length === 0) {
        console.log('No plugins found to inline.');
        return;
      }

      // 1. Identify original import paths for the plugins before any modifications
      const pluginTargets = [];
      const entryImportRegex = /^import\s+[^;]+;/gm;
      const entryImportsMatch = entryContent.match(entryImportRegex) || [];

      for (const pluginName of pluginsToInline) {
        const importLine = entryImportsMatch.find((imp) => imp.includes(` ${pluginName} `));
        if (importLine) {
          const pathMatch = importLine.match(/from\s+['"]([^'"]+)['"]/);
          if (pathMatch) {
            pluginTargets.push({
              name: pluginName,
              importPath: pathMatch[1],
              originalImportLine: importLine,
            });
            // Remove the plugin import line so it isn't rewritten and hoisted normally
            entryContent = entryContent.replace(importLine, '');
          }
        }
      }

      // 2. Rewrite paths and hoist from the main entry file
      entryContent = this._rewritePathsInString(entryContent, this.entryDir, false, null);
      entryContent = this._extractAndHoist(entryContent);

      // 3. Process each plugin using their original import paths
      for (const target of pluginTargets) {
        const isNpm = !target.importPath.startsWith('.');
        let pluginFullPath;
        let npmPackageName = null;

        if (isNpm) {
          // Identify NPM package name (handles @scope/package as well)
          const parts = target.importPath.split('/');
          npmPackageName = target.importPath.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];

          try {
            // Locate the physical file inside node_modules
            pluginFullPath = require.resolve(target.importPath, { paths: [this.entryDir] });
          } catch (e) {
            console.error(`Error: Could not resolve NPM module: ${target.importPath}`);
            throw e;
          }
        } else {
          pluginFullPath = resolve(this.entryDir, target.importPath);
        }

        const pluginSourceDir = dirname(pluginFullPath);
        let pluginCode = await readFile(pluginFullPath, 'utf8');

        // Rewrite internal paths (handles NPM isolation vs Local Root Replacement)
        pluginCode = this._rewritePathsInString(pluginCode, pluginSourceDir, isNpm, npmPackageName);

        // Hoist dependencies
        pluginCode = this._extractAndHoist(pluginCode);

        // Format and inject
        pluginCode = this._formatPluginCode(pluginCode, target.name);
        const insertTarget = new RegExp(`\\.insert\\(\\s*${target.name}\\s*\\)`, 'g');
        entryContent = entryContent.replace(insertTarget, `.insert(\n${pluginCode}\n)`);
      }

      // 4. Final Assembly
      const finalImports = [...this.hoistedImports].join('\n');
      const finalTypedefs = [...this.hoistedTypedefs].join('\n\n');
      const finalOutput = `${finalImports}\n\n${finalTypedefs}\n\n${entryContent}`;

      await mkdir(this.outDir, { recursive: true });
      await writeFile(this.outFile, finalOutput, 'utf8');

      console.log('Build successful! Imports corrected (including JSDoc and NPM modules).');
    } catch (error) {
      console.error('Build failed:', error);
      process.exit(1);
    }
  }
}

export default TinyPluginInliner;
