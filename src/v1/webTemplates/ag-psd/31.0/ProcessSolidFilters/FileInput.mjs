import { readPsd } from 'ag-psd';
import { createProcessPsdSolidFilters } from './Template.mjs';

/**
 * Creates a native browser Canvas element.
 * @param {number} width - The width to assign to the new canvas, in pixels.
 * @param {number} height - The height to assign to the new canvas, in pixels.
 * @returns {HTMLCanvasElement} A new detached HTMLCanvasElement with the requested dimensions.
 */
const createBrowserCanvas = (width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

/**
 * Processes a PSD receiving a File, Blob, or directly an HTMLInputElement.
 * @param {HTMLInputElement} psdInput - The absolute path, URL, or Blob file of the PSD.
 * @param {HTMLCanvasElement[]} filters - The configurations to capture specific layers.
 * @param {import('./Template.mjs').DefaultConfig} defaultConfig - The fallback configuration for the remaining layers.
 * @returns {Promise<import('./Template.mjs').ProcessedPsdResult<Blob>>} Results of the separated and reconstructed images, and pixel statistics.
 * @throws {Error|TypeError} If the parameters or the file are invalid.
 * @beta
 */
export const processPsdSolidFiltersFromFile = createProcessPsdSolidFilters(
  async (fileInput) => {
    /** @type {File|HTMLInputElement|Blob} */
    // @ts-ignore
    let file = fileInput;

    // If the interface passes the HTML input element directly, we extract the file safely.
    if (fileInput instanceof HTMLInputElement) {
      if (!fileInput.files || fileInput.files.length === 0) {
        throw new Error('No PSD file was selected in the file input.');
      }
      file = fileInput.files[0];
    }

    // Strict runtime validation
    if (!(file instanceof File) && !(file instanceof Blob)) {
      throw new TypeError(
        "The 'fileInput' argument must be a File, Blob, or an HTMLInputElement containing a file.",
      );
    }

    return file.arrayBuffer();
  },
  createBrowserCanvas,
  readPsd,
  (canvas) => {
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
