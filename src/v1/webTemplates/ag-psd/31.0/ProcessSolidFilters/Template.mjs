/**
 * Describes a single filter that claims layers by matching their names.
 * @typedef {Object} FilterConfig
 * @property {string} id - Filter identifier (e.g., 'artist1').
 * @property {string} color - Color in HEX format (e.g., '#ffffff').
 * @property {string|string[]} [startsWith] - Prefix(es) the layer name must start with.
 * @property {string|string[]} [endsWith] - Suffix(es) the layer name must end with.
 * @property {string|string[]} [contains] - Substring(s) the layer name must contain.
 * @property {string|string[]} [equals] - Exact value(s) the layer name must be equal to.
 * @property {RegExp|RegExp[]} [matches] - Regular expression(s) the layer name must satisfy. Avoid the global (g) flag, as it makes the RegExp stateful.
 * @property {(layerName: string) => boolean} [test] - Custom predicate for advanced matching.
 * @property {boolean|FolderOptions} [folder] - When enabled, the filter also matches folders, claiming every layer inside them.
 */

/**
 * Describes how the layers nested inside a claimed folder must be handled.
 * @typedef {Object} FolderOptions
 * @property {'inherit'|'exclude'|'custom'} [subfolders='inherit'] - How nested folders are handled. 'inherit' applies the parent filter to every subfolder, 'exclude' leaves subfolders untouched, and 'custom' delegates to 'childFilter'.
 * @property {FilterConfig|FilterConfig[]} [childFilter] - Filter(s) matched against nested folders when 'subfolders' is 'custom'.
 */

/**
 * Describes the fallback configuration applied to layers that no filter claims.
 * @typedef {Object} DefaultConfig
 * @property {string} color - Color in HEX format for layers that do not match filters.
 */

/**
 * Describes the complete result produced by processing a PSD file.
 * @template {Buffer|Blob} Data
 * @typedef {Object} ProcessedPsdResult
 * @property {Data} fullImageBuffer - PNG Buffer or Blob of the complete reconstructed image.
 * @property {Array<{ id: string, buffer: Data }>} separatedImages - Array containing the results of each isolated color.
 * @property {Record<string, number>} stats - Object reporting the integer number of pixels claimed by each filter.
 * @property {LayerVectorData[]} vectorData - Vector representation of every layer that was processed, in painting order.
 */

/**
 * Describes the position and size of a layer inside the document.
 * @typedef {Object} VectorBounds
 * @property {number} x - The horizontal offset of the layer inside the document, in pixels.
 * @property {number} y - The vertical offset of the layer inside the document, in pixels.
 * @property {number} width - The width of the layer, in pixels.
 * @property {number} height - The height of the layer, in pixels.
 */

/**
 * Describes the vector representation of a single processed layer.
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
 * Normalizes a value into an array so it can be iterated uniformly.
 * @template T
 * @param {T|T[]} value - A single value or an array of values.
 * @returns {T[]} The value wrapped in an array when it is not one already.
 */
function toArray(value) {
  return Array.isArray(value) ? value : [value];
}

/**
 * Compiles a single filter configuration into a reusable predicate.
 * All criteria declared in the filter are combined with a logical AND.
 * Values inside a single criterion are combined with a logical OR.
 * @param {FilterConfig} filter - The filter configuration to compile.
 * @returns {(layerName: string) => boolean} A predicate that returns true when a layer name matches.
 * @throws {TypeError} If the filter or any of its properties are invalid.
 */
function buildFilterPredicate(filter) {
  if (filter === null || typeof filter !== 'object') {
    throw new TypeError('Each filter must be a valid object.');
  }
  if (typeof filter.id !== 'string' || filter.id.length === 0) {
    throw new TypeError("Each filter must declare a non-empty string 'id'.");
  }

  /** @type {Array<(layerName: string) => boolean>} */
  const criteria = [];

  if (filter.startsWith !== undefined) {
    const patterns = toArray(filter.startsWith);
    criteria.push((name) => patterns.some((pattern) => name.startsWith(pattern)));
  }
  if (filter.endsWith !== undefined) {
    const patterns = toArray(filter.endsWith);
    criteria.push((name) => patterns.some((pattern) => name.endsWith(pattern)));
  }
  if (filter.contains !== undefined) {
    const patterns = toArray(filter.contains);
    criteria.push((name) => patterns.some((pattern) => name.includes(pattern)));
  }
  if (filter.equals !== undefined) {
    const patterns = toArray(filter.equals);
    criteria.push((name) => patterns.some((pattern) => name === pattern));
  }
  if (filter.matches !== undefined) {
    const patterns = toArray(filter.matches);
    criteria.push((name) => patterns.some((pattern) => pattern.test(name)));
  }
  if (filter.test !== undefined) {
    if (typeof filter.test !== 'function') {
      throw new TypeError("The 'test' property must be a function.");
    }
    const customTest = filter.test;
    criteria.push((name) => customTest(name) === true);
  }

  if (criteria.length === 0) {
    throw new TypeError(`The filter '${filter.id}' must declare at least one matching criterion.`);
  }

  return (layerName) => criteria.every((criterion) => criterion(layerName));
}

/**
 * Normalizes the 'folder' option of a filter into a consistent object.
 * @param {boolean|FolderOptions|undefined} folder - The raw folder option.
 * @returns {{ subfolders: 'inherit'|'exclude'|'custom', childFilter: FilterConfig[] }|null} The normalized options, or null when folder mode is disabled.
 * @throws {TypeError} If the folder option is invalid.
 */
function normalizeFolderOptions(folder) {
  if (folder === undefined || folder === false) {
    return null;
  }
  if (folder === true) {
    return { subfolders: 'inherit', childFilter: [] };
  }
  if (typeof folder !== 'object' || folder === null) {
    throw new TypeError("The 'folder' option must be a boolean or an object.");
  }
  const subfolders = folder.subfolders ?? 'inherit';
  if (!['inherit', 'exclude', 'custom'].includes(subfolders)) {
    throw new TypeError("The 'subfolders' option must be 'inherit', 'exclude', or 'custom'.");
  }
  return {
    subfolders,
    childFilter: folder.childFilter ? toArray(folder.childFilter) : [],
  };
}

/**
 * Compiles an array of filter configurations into reusable matchers.
 * @param {FilterConfig[]} filters - The filter configurations to compile.
 * @returns {Array<{ id: string, predicate: (layerName: string) => boolean, folder: { subfolders: string, childFilter: FilterConfig[] }|null }>} The compiled matchers.
 */
function buildMatchers(filters) {
  return filters.map((filter) => ({
    id: filter.id,
    predicate: buildFilterPredicate(filter),
    folder: normalizeFolderOptions(filter.folder),
  }));
}

/**
 * Recursively collects every filter, including the ones nested inside folder options.
 * @param {FilterConfig[]} filters - The filters to expand.
 * @param {FilterConfig[]} [acc] - The accumulator used during recursion.
 * @returns {FilterConfig[]} Every filter, flattened.
 */
function flattenFilters(filters, acc = []) {
  for (const filter of filters) {
    acc.push(filter);
    if (filter.folder && typeof filter.folder === 'object' && filter.folder.childFilter) {
      flattenFilters(toArray(filter.folder.childFilter), acc);
    }
  }
  return acc;
}

/**
 * Resolves the filter id for a single layer name.
 * @param {string} layerName - The name of the layer.
 * @param {ReturnType<typeof buildMatchers>} matchers - The active matchers.
 * @returns {string} The id of the first matching filter, or 'unfiltered'.
 */
function resolveLayerFilterId(layerName, matchers) {
  if (typeof layerName !== 'string') {
    return 'unfiltered';
  }
  for (const matcher of matchers) {
    if (matcher.predicate(layerName)) {
      return matcher.id;
    }
  }
  return 'unfiltered';
}

/**
 * Finds the first folder matcher that claims the given folder name.
 * @param {string} folderName - The name of the folder.
 * @param {ReturnType<typeof buildMatchers>} matchers - The active matchers.
 * @returns {ReturnType<typeof buildMatchers>[number]|null} The matching matcher, or null when no folder matcher applies.
 */
function findFolderMatcher(folderName, matchers) {
  if (typeof folderName !== 'string') {
    return null;
  }
  for (const matcher of matchers) {
    if (matcher.folder && matcher.predicate(folderName)) {
      return matcher;
    }
  }
  return null;
}

/**
 * Traverses the PSD tree, resolving the filter id of every visible layer.
 * @param {any[]} children - The PSD nodes to traverse.
 * @param {ReturnType<typeof buildMatchers>} matchers - The matchers active in the current scope.
 * @param {boolean} parentVisible - Whether the parent node is visible.
 * @param {Array<{ layer: any, filterId: string }>} result - The output array, in painting order.
 * @returns {void} This function mutates the 'result' array instead of returning a value.
 */
function collectLayers(children, matchers, parentVisible, result) {
  for (const layer of children) {
    const isVisible = parentVisible && layer.hidden !== true;
    if (!isVisible) {
      continue;
    }

    if (layer.children) {
      const matcher = findFolderMatcher(layer.name, matchers);
      if (matcher) {
        collectClaimedLayers(layer, matcher, matchers, result);
      } else {
        collectLayers(layer.children, matchers, isVisible, result);
      }
    } else {
      result.push({ layer, filterId: resolveLayerFilterId(layer.name, matchers) });
    }
  }
}

/**
 * Claims every layer inside a folder for a given matcher, honoring the subfolder strategy.
 * @param {any} folder - The folder node that was claimed.
 * @param {ReturnType<typeof buildMatchers>[number]} matcher - The matcher that claimed the folder.
 * @param {ReturnType<typeof buildMatchers>} matchers - The matchers active in the parent scope.
 * @param {Array<{ layer: any, filterId: string }>} result - The output array, in painting order.
 * @returns {void} This function mutates the 'result' array instead of returning a value.
 */
function collectClaimedLayers(folder, matcher, matchers, result) {
  const options = matcher.folder;
  for (const child of folder.children) {
    if (child.hidden === true) {
      continue;
    }

    if (!child.children) {
      result.push({ layer: child, filterId: matcher.id });
      continue;
    }

    const subfolders = options?.subfolders;
    if (subfolders === 'inherit') {
      collectClaimedLayers(child, matcher, matchers, result);
    } else if (subfolders === 'exclude') {
      collectLayers([child], matchers, true, result);
    } else if (subfolders === 'custom') {
      const childMatchers = buildMatchers(options?.childFilter ?? []);
      collectLayers([child], childMatchers, true, result);
    }
  }
}

/**
 * Creates a PSD processing function bound to a specific runtime environment.
 * The returned function extracts solid colors, resolves which filter claims each pixel,
 * and produces both a composite image and one image per filter.
 * @template {Buffer | ArrayBuffer} ValidatorResult
 * @template {Buffer|Blob} Data
 * @template {string | Blob | HTMLInputElement} PsdInput
 * @template {import('canvas').Canvas | HTMLCanvasElement} UniversalCanvas
 * @template {import('canvas').CanvasRenderingContext2D | CanvasRenderingContext2D} UniversalCanvasRenderingContext2D
 * @template {import('canvas').ImageData | ImageData} UniversalImageData
 *
 * @param {(psdInput: PsdInput) => Promise<ValidatorResult>} validator - Loads the PSD source and returns its raw bytes for the current environment.
 * @param {(width: number, height: number) => UniversalCanvas} createCanvas - Factory that allocates a canvas compatible with the current environment.
 * @param {typeof import('ag-psd').readPsd} readPsd - The ag-psd parser used to decode the raw bytes into a PSD tree.
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

    const allFilters = flattenFilters(filters);

    const colorMap = new Map();
    for (const f of allFilters) {
      colorMap.set(f.id, hexToRgba(f.color));
    }
    colorMap.set('unfiltered', hexToRgba(defaultConfig.color));

    // 1D array to store which ID dominates each pixel in the space (W * H)
    const ownerMap = new Array(W * H).fill(null);
    const matchers = buildMatchers(filters);
    /** @type {Array<{ layer: any, filterId: string }>} */
    const resolvedLayers = [];
    collectLayers(psd.children || [], matchers, true, resolvedLayers);

    /** @type {LayerVectorData[]} */
    const vectorData = [];

    // 2. Pixel-by-Pixel Processing (Bottom-Up)
    for (const { layer, filterId } of resolvedLayers) {
      if (!layer.canvas) continue; // Ignores layers that do not have image data

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
    const ids = ['unfiltered', ...new Set(allFilters.map((f) => f.id))];

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
