import { readPsd } from 'ag-psd';
import { createProcessPsdSolidFilters } from './Template.mjs';

/**
 * Creates a native browser Canvas element.
 * @param {number} width
 * @param {number} height
 * @returns {HTMLCanvasElement}
 */
const createBrowserCanvas = (width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

/**
 * Extracts solid colors and calculates the area of each claimed filter in the PSD.
 * @param {Blob} psdInput - The absolute path, URL, or Blob file of the PSD.
 * @param {HTMLCanvasElement[]} filters - The configurations to capture specific layers.
 * @param {import('./Template.mjs').DefaultConfig} defaultConfig - The fallback configuration for the remaining layers.
 * @returns {Promise<import('./Template.mjs').ProcessedPsdResult<Blob>>} Results of the separated and reconstructed images, and pixel statistics.
 * @throws {Error|TypeError} If the parameters or the file are invalid.
 */
export const processPsdSolidFilters = createProcessPsdSolidFilters(
  async (psdInput) => {
    // Allows fetching from a remote URL
    if (typeof psdInput === 'string') {
      const response = await fetch(psdInput);
      if (!response.ok) {
        throw new Error(`Failed to load the PSD file from the provided URL: ${psdInput}`);
      }
      return response.arrayBuffer();
    }
    // Allows reading files passed via File / Drag-and-drop inputs
    else if (psdInput instanceof Blob) {
      return psdInput.arrayBuffer();
    }

    throw new TypeError(
      "In the Browser environment, 'psdInput' must be a URL (string) or a File/Blob object.",
    );
  },
  createBrowserCanvas,
  readPsd,
  (canvas) => {
    // The browser natively exports images with toBlob, based on callbacks.
    // This encapsulates the callback into a clean Promise.
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to export the image from the browser Canvas element.'));
        }
      }, 'image/png');
    });
  },
);
