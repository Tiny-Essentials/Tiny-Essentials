import * as sass from 'sass';
import fs from 'fs';
import path from 'path';

/**
 * @file build-sass.js
 * @description Compiles multiple groups of Sass directories into compressed CSS files.
 */

/**
 * @typedef {Object} SassConfig
 * @property {string} input - The source directory containing .scss files.
 * @property {string} output - The destination directory for .min.css files.
 */

/**
 * Configuration: Add as many groups as needed here.
 * @type {SassConfig[]}
 */
const CONFIG = [
  {
    input: 'src/v1/scss',
    output: 'dist/v1/css',
  },
  // You can easily add more groups here:
  // { input: 'src/ui/scss', output: 'dist/ui/css' },
];

/**
 * Compiles a single Sass file to a compressed CSS file and generates a source map.
 *
 * @param {string} input - The source directory path where the .scss file is located.
 * @param {string} output - The destination directory path where the .min.css and .map files will be saved.
 * @param {string} file - The specific filename of the .scss file to be compiled.
 * @returns {Promise<void>} A promise that resolves when the compilation and file writing are complete.
 * @throws {TypeError} If the input, output, or file arguments are not valid non-empty strings.
 */
async function compileSingleFile(input, output, file) {
  const inputPath = path.join(input, file);
  const outputFileName = file.replace(/\.scss$/, '.min.css');
  const outputPath = path.join(output, outputFileName);

  // Strict runtime validation for input arguments
  if (typeof inputPath !== 'string' || inputPath.trim() === '') {
    throw new TypeError('The inputPath must be a non-empty string.');
  }
  if (typeof outputPath !== 'string' || outputPath.trim() === '') {
    throw new TypeError('The outputPath must be a non-empty string.');
  }

  // 1. Compile the Sass file
  const result = sass.compile(inputPath, {
    style: 'compressed',
    sourceMap: true,
    sourceMapIncludeSources: true,
  });

  // 2. Write the CSS file
  const mapPath = `${outputPath}.map`;
  fs.writeFileSync(outputPath, `${result.css}\n/* # sourceMappingURL=${path.basename(mapPath)} */`);

  // 3. Write the Source Map file if it was generated
  if (result.sourceMap) {
    const mapDir = path.dirname(outputPath);
    // Create a shallow copy to avoid mutating the original object
    const sanitizedMap = { ...result.sourceMap };

    if (Array.isArray(sanitizedMap.sources)) {
      sanitizedMap.sources = sanitizedMap.sources.map((sourcePath) => {
        const relativePath = path.relative(mapDir, path.dirname(inputPath));
        return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
      });
    }

    fs.writeFileSync(mapPath, JSON.stringify(sanitizedMap));
    console.log(`[Success] Map created (sanitized): ${path.basename(mapPath)}`);
  }

  console.log(`[Success] Compiled: ${path.basename(inputPath)} -> ${path.basename(outputPath)}`);
}

/**
 * Processes a single group of input/output directories.
 *
 * @param {SassConfig} group - An object containing the 'input' and 'output' directory paths for a compilation batch.
 * @returns {Promise<void>} A promise that resolves when all valid .scss files in the group have been processed.
 */
async function processFolderGroup(group) {
  const { input, output } = group;

  console.log(`\n[Processing Group] Input: ${input} | Output: ${output}`);

  try {
    // 1. Check if input directory exists
    if (!fs.existsSync(input)) {
      console.error(`[Error] Input directory not found: ${input}`);
      return;
    }

    // 2. Ensure output directory exists
    if (!fs.existsSync(output)) {
      fs.mkdirSync(output, { recursive: true });
      console.log(`[Info] Created directory: ${output}`);
    }

    // 3. Read all files in the input directory
    const files = fs.readdirSync(input);

    // 4. Filter files:
    // - Must end with '.scss'
    // - Must NOT start with '_' (to avoid compiling partials)
    const scssFiles = files.filter((file) => file.endsWith('.scss') && !file.startsWith('_'));

    if (scssFiles.length === 0) {
      console.log(`[Info] No main .scss files found in ${input}`);
      return;
    }

    console.log(`[Info] Found ${scssFiles.length} files. Compiling...`);

    // 5. Process each file
    const compilationPromises = scssFiles.map((file) => compileSingleFile(input, output, file));

    // Wait for all compilations to finish
    await Promise.all(compilationPromises);

    console.log('\n[Finished] All files processed successfully.');
  } catch (error) {
    // Specific error handling for compilation or file system failures
    console.error(`[Error] Failed to process group ${input}: ${error.message}`);
  }
}

/**
 * Orchestrates the compilation of all configured directory groups.
 *
 * @returns {Promise<void>} A promise that resolves once all directory groups defined in the CONFIG array have been processed.
 */
async function buildAllSass() {
  console.log('--- Starting Sass Build Process ---');
  const startTime = Date.now();

  // Process each group in the CONFIG array
  for (const group of CONFIG) {
    await processFolderGroup(group);
  }

  const duration = (Date.now() - startTime) / 1000;
  console.log(`\n--- Build Finished in ${duration}s ---`);
}

// Execute the build process
buildAllSass().catch((err) => {
  console.error(`[Fatal Error] ${err.name}: ${err.message}`);
  process.exit(1);
});
