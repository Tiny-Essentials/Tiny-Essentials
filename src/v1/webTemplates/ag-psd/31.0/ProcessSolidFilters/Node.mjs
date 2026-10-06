import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { readPsd } from 'ag-psd';
// import 'ag-psd/initialize-canvas'; // Strict requirement of ag-psd to run in Node.js
import { createCanvas } from 'canvas';
import { createProcessPsdSolidFilters } from './Template.mjs';

/**
 * Extracts solid colors and calculates the area of each claimed filter in the PSD.
 * @param {string} psdInput - The absolute path, URL, or Blob file of the PSD.
 * @param {import('canvas').Canvas[]} filters - The configurations to capture specific layers.
 * @param {import('./Template.mjs').DefaultConfig} defaultConfig - The fallback configuration for the remaining layers.
 * @returns {Promise<import('./Template.mjs').ProcessedPsdResult<Buffer>>} Results of the separated and reconstructed images, and pixel statistics.
 * @throws {Error|TypeError} If the parameters or the file are invalid.
 */
export const processPsdSolidFilters = createProcessPsdSolidFilters(
  async (psdPath) => {
    if (typeof psdPath !== 'string') {
      throw new TypeError(
        "In the Node.js environment, 'psdPath' must be a string containing the file path.",
      );
    }
    if (!existsSync(psdPath)) {
      throw new Error(`PSD file not found at the specified path: ${psdPath}`);
    }
    return readFile(psdPath);
  },
  createCanvas,
  readPsd,
  async (canvas) => {
    // In Node.js with the 'canvas' package, toBuffer is synchronous.
    // We return it asynchronously to maintain API consistency.
    return canvas.toBuffer('image/png');
  },
);
