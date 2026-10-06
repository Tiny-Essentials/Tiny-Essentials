/**
 * @typedef {Object} FilterConfig
 * @property {string} id - Filter identifier (e.g., 'artist1').
 * @property {string} color - Color in HEX format (e.g., '#ffffff').
 * @property {string} startsWith - Prefix to capture the layer (e.g., 'artist-layer-').
 */

/**
 * @typedef {Object} DefaultConfig
 * @property {string} color - Color in HEX format for layers that do not match filters.
 */

/**
 * @template {Buffer|Blob} Data
 * @typedef {Object} ProcessedPsdResult
 * @property {Data} fullImageBuffer - PNG Buffer or Blob of the complete reconstructed image.
 * @property {Array<{ id: string, buffer: Data }>} separatedImages - Array containing the results of each isolated color.
 * @property {Record<string, number>} stats - Object reporting the integer number of pixels claimed by each filter.
 * @property {LayerVectorData[]} vectorData - Vector representation of every layer that was processed, in painting order.
 */

/**
 * @typedef {Object} VectorBounds
 * @property {number} x - The horizontal offset of the layer inside the document, in pixels.
 * @property {number} y - The vertical offset of the layer inside the document, in pixels.
 * @property {number} width - The width of the layer, in pixels.
 * @property {number} height - The height of the layer, in pixels.
 */

/**
 * @typedef {Object} LayerVectorData
 * @property {string} name - The original name of the layer inside the PSD file.
 * @property {string} filterId - The ID of the filter that claimed this layer, or 'unfiltered'.
 * @property {number} opacity - The effective opacity of the layer, from 0 to 1.
 * @property {VectorBounds} bounds - The bounding box of the layer in the document space.
 */

/**
 * Converts a hexadecimal color to a strict RGBA array.
 * @param {string} hex - Hexadecimal color.
 * @returns {number[]} Array containing [R, G, B, A].
 * @throws {Error} If the color is not a valid HEX string.
 */
function hexToRgba(hex) {
  if (typeof hex !== 'string' || !hex.startsWith('#')) {
    throw new Error(`Invalid color received: ${hex}. You must use a HEX string starting with #.`);
  }
  const cleanHex = hex.replace('#', '');
  const normalizedHex =
    cleanHex.length === 3
      ? cleanHex
          .split('')
          .map((c) => c + c)
          .join('')
      : cleanHex;

  const bigint = parseInt(normalizedHex, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255, 255];
}

/**
 * Flattens the PSD hierarchy to simulate the actual painting order (bottom-to-top).
 * @param {any[]} children - Children of a PSD node.
 * @param {boolean} [parentVisible=true] - Whether the parent group is visible.
 * @returns {any[]} Flat array containing only visible layers in overlapping order.
 */
function getPaintingOrderLayers(children, parentVisible = true) {
  /** @type {any[]} */
  let result = [];
  // ag-psd usually stores layers from bottom to top in the children array.
  for (let i = 0; i < children.length; i++) {
    const layer = children[i];
    const isVisible = parentVisible && layer.hidden !== true;

    if (layer.children) {
      result = result.concat(getPaintingOrderLayers(layer.children, isVisible));
    } else if (isVisible) {
      result.push(layer);
    }
  }
  return result;
}

/**
 * Builds the vector representation of a single PSD layer.
 * @param {any} layer - The raw ag-psd layer node.
 * @param {string} filterId - The ID of the filter that claimed this layer.
 * @param {number} opacity - The effective opacity of the layer, from 0 to 1.
 * @returns {LayerVectorData} The vector data describing the layer geometry.
 * @throws {TypeError} If the layer, filterId, or opacity are invalid.
 */
function buildLayerVectorData(layer, filterId, opacity) {
  if (layer === null || typeof layer !== 'object') {
    throw new TypeError("The 'layer' argument must be a valid PSD layer object.");
  }
  if (typeof filterId !== 'string') {
    throw new TypeError("The 'filterId' argument must be a string.");
  }
  if (typeof opacity !== 'number' || Number.isNaN(opacity)) {
    throw new TypeError("The 'opacity' argument must be a valid number.");
  }

  return {
    name: typeof layer.name === 'string' ? layer.name : '',
    filterId: filterId,
    opacity: opacity,
    bounds: {
      x: typeof layer.left === 'number' ? layer.left : 0,
      y: typeof layer.top === 'number' ? layer.top : 0,
      width: layer.canvas ? layer.canvas.width : 0,
      height: layer.canvas ? layer.canvas.height : 0,
    },
  };
}

/**
 * @template {Buffer | ArrayBuffer} ValidatorResult
 * @template {Buffer|Blob} Data
 * @template {string | Blob | HTMLInputElement} PsdInput
 * @template {import('canvas').Canvas | HTMLCanvasElement} UniversalCanvas
 * @template {import('canvas').CanvasRenderingContext2D | CanvasRenderingContext2D} UniversalCanvasRenderingContext2D
 * @template {import('canvas').ImageData | ImageData} UniversalImageData
 *
 * @param {(psdInput: PsdInput) => Promise<ValidatorResult>} validator
 * @param {(width: number, height: number) => UniversalCanvas} createCanvas
 * @param {typeof import('ag-psd').readPsd} readPsd
 * @param {(canvas: UniversalCanvas) => Promise<Data>} exportCanvas - Injected function to handle environment-specific export.
 */
export function createProcessPsdSolidFilters(validator, createCanvas, readPsd, exportCanvas) {
  /**
   * Extracts solid colors and calculates the area of each claimed filter in the PSD.
   * @param {PsdInput} psdInput - The absolute path, URL, or Blob file of the PSD.
   * @param {FilterConfig[]} filters - The configurations to capture specific layers.
   * @param {DefaultConfig} defaultConfig - The fallback configuration for the remaining layers.
   * @returns {Promise<ProcessedPsdResult<Data>>} Results of the separated and reconstructed images, and pixel statistics.
   * @throws {Error|TypeError} If the parameters or the file are invalid.
   */
  return async function processPsdSolidFilters(psdInput, filters, defaultConfig) {
    if (!Array.isArray(filters)) {
      throw new TypeError("The 'filters' argument must be an array.");
    }
    if (!defaultConfig || typeof defaultConfig.color !== 'string') {
      throw new Error("The 'defaultConfig' argument must have a 'color' property of type string.");
    }

    // 1. PSD Reading and Preparation
    const buffer = await validator(psdInput);
    const psd = readPsd(buffer);
    const W = psd.width;
    const H = psd.height;

    const colorMap = new Map();
    for (const f of filters) {
      colorMap.set(f.id, hexToRgba(f.color));
    }
    colorMap.set('unfiltered', hexToRgba(defaultConfig.color));

    // 1D array to store which ID dominates each pixel in the space (W * H)
    const ownerMap = new Array(W * H).fill(null);
    const flatLayers = getPaintingOrderLayers(psd.children || []);

    /** @type {LayerVectorData[]} */
    const vectorData = [];

    // 2. Pixel-by-Pixel Processing (Bottom-Up)
    for (const layer of flatLayers) {
      if (!layer.canvas) continue; // Ignores layers that do not have image data

      let filterId = 'unfiltered';
      for (const f of filters) {
        if (layer.name && layer.name.startsWith(f.startsWith)) {
          filterId = f.id;
          break;
        }
      }

      // Layer opacity affects pixel alpha
      const layerOpacity = layer.opacity !== undefined ? layer.opacity / 255 : 1;

      vectorData.push(buildLayerVectorData(layer, filterId, layerOpacity));

      const ctx = layer.canvas.getContext('2d');
      const imgData = ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height);
      const data = imgData.data;

      for (let y = 0; y < layer.canvas.height; y++) {
        for (let x = 0; x < layer.canvas.width; x++) {
          const idx = (y * layer.canvas.width + x) * 4;
          const alpha = data[idx + 3] * layerOpacity;

          // Threshold: If it is minimally visible, it captures the pixel.
          // This ensures that pure colors completely overlap what is behind.
          if (alpha > 1) {
            const globalX = layer.left + x;
            const globalY = layer.top + y;

            // Only renders if the pixel falls within the main document canvas
            if (globalX >= 0 && globalX < W && globalY >= 0 && globalY < H) {
              ownerMap[globalY * W + globalX] = filterId;
            }
          }
        }
      }
    }

    // 3. Final Image Generation and Data Counting
    /** @type {Record<string, number>} */
    const stats = { unclaimed: 0 };
    /** @type {Record<string, { canvas: UniversalCanvas; ctx: UniversalCanvasRenderingContext2D; imgData: UniversalImageData }>} */
    const separatedData = {};
    const ids = ['unfiltered', ...filters.map((f) => f.id)];

    ids.forEach((id) => {
      stats[id] = 0;
      const c = createCanvas(W, H);
      separatedData[id] = {
        canvas: c,
        // @ts-ignore
        ctx: c.getContext('2d'),
        // @ts-ignore
        imgData: c.getContext('2d').createImageData(W, H),
      };
    });

    const fullCanvas = createCanvas(W, H);
    const fullCtx = fullCanvas.getContext('2d');
    // @ts-ignore
    const fullImgData = fullCtx.createImageData(W, H);

    // Mapping the Winning Pixels
    for (let i = 0; i < ownerMap.length; i++) {
      const ownerId = ownerMap[i];
      if (ownerId === null) {
        stats.unclaimed++;
        continue;
      }

      stats[ownerId]++; // Increments filter INT

      const color = colorMap.get(ownerId);
      const pixelStart = i * 4;

      // Write to the Complete Composite Image
      fullImgData.data[pixelStart] = color[0]; // R
      fullImgData.data[pixelStart + 1] = color[1]; // G
      fullImgData.data[pixelStart + 2] = color[2]; // B
      fullImgData.data[pixelStart + 3] = 255; // 100% Solid Opacity

      // Write to the Specific Filter Image
      const targetData = separatedData[ownerId].imgData.data;
      targetData[pixelStart] = color[0];
      targetData[pixelStart + 1] = color[1];
      targetData[pixelStart + 2] = color[2];
      targetData[pixelStart + 3] = 255;
    }

    // 4. Finalization and Asynchronous Data Export
    // @ts-ignore
    fullCtx.putImageData(fullImgData, 0, 0);
    const fullBuffer = await exportCanvas(fullCanvas);

    const separatedImagesArray = [];
    for (const id of ids) {
      // @ts-ignore
      separatedData[id].ctx.putImageData(separatedData[id].imgData, 0, 0);
      separatedImagesArray.push({
        id: id,
        buffer: await exportCanvas(separatedData[id].canvas),
      });
    }

    return {
      fullImageBuffer: fullBuffer,
      separatedImages: separatedImagesArray,
      stats: stats,
      vectorData: vectorData,
    };
  };
}
