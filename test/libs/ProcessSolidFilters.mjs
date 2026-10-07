import { TestRunner, section, color } from './_helpers.mjs';

/**
 * Node.js port of the browser based ProcessSolidFilters test environment
 * (`test/html/webTemplates/ag-psd/31.0/ProcessSolidFilters`).
 *
 * The `createProcessPsdSolidFilters` factory is exercised directly with a fake
 * PSD tree and an in-memory canvas implementation, so the whole pipeline runs
 * without a real PSD file or the native `canvas` dependency.
 *
 * @returns {Promise<void>}
 */

// ---------------------------------------------------------------------------
// Minimal in-memory canvas implementation
// ---------------------------------------------------------------------------
class FakeImageData {
  constructor(width, height, opaque = false) {
    this.width = width;
    this.height = height;
    this.data = new Uint8ClampedArray(width * height * 4);
    if (opaque) {
      for (let i = 3; i < this.data.length; i += 4) this.data[i] = 255;
    }
  }
}

class FakeContext {
  constructor(canvas) {
    this.canvas = canvas;
  }
  createImageData(width, height) {
    return new FakeImageData(width, height);
  }
  getImageData() {
    return this.canvas._imageData;
  }
  putImageData(imageData) {
    this.canvas._imageData = imageData;
  }
}

class FakeCanvas {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this._imageData = new FakeImageData(width, height, true);
    this._ctx = new FakeContext(this);
  }
  getContext() {
    return this._ctx;
  }
  toBuffer() {
    return Buffer.from('png');
  }
}

const createCanvas = (width, height) => new FakeCanvas(width, height);

/**
 * Builds a fake PSD layer with a solid canvas of the given size.
 * @param {string} name - The layer name.
 * @param {number} [left] - The layer X offset.
 * @param {number} [top] - The layer Y offset.
 * @param {number} [size] - The layer size (square).
 * @returns {object} A fake PSD layer.
 */
const layer = (name, left = 0, top = 0, size = 2) => ({
  name,
  left,
  top,
  canvas: createCanvas(size, size),
});

const { createProcessPsdSolidFilters } =
  await import('../../dist/v1/webTemplates/ag-psd/31.0/ProcessSolidFilters/Template.mjs');

/**
 * Node.js port of the browser ProcessSolidFilters test environment.
 * @returns {Promise<number>}
 */
const testProcessSolidFilters = async () => {
  const t = new TestRunner('ProcessSolidFilters');

  const psd = {
    width: 4,
    height: 4,
    children: [layer('bg', 0, 0, 4), layer('hero', 0, 0, 2), layer('enemy', 2, 0, 2)],
  };

  const process = createProcessPsdSolidFilters(
    async () => Buffer.from('psd'),
    createCanvas,
    () => psd,
    async (canvas) => canvas.toBuffer(),
  );

  // -------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------
  section('ProcessSolidFilters - validation', '🎨');
  await t.ok(
    await process('file.psd', [], { color: '#000000' })
      .then(() => true)
      .catch(() => false),
    'Resolves with a valid configuration',
  );
  await t.ok(
    await process('file.psd', 'nope', { color: '#000000' })
      .then(() => false)
      .catch(() => true),
    'Rejects a non-array filters argument',
  );
  await t.ok(
    await process('file.psd', [], {})
      .then(() => false)
      .catch(() => true),
    'Rejects a missing default color',
  );

  // -------------------------------------------------------------------
  // Processing
  // -------------------------------------------------------------------
  section('ProcessSolidFilters - processing', '🖌️');
  const result = await process(
    'file.psd',
    [
      { id: 'hero', color: '#ff0000', equals: 'hero' },
      { id: 'enemy', color: '#00ff00', equals: 'enemy' },
    ],
    { color: '#0000ff' },
  );

  t.ok(Buffer.isBuffer(result.fullImageBuffer), 'Returns the full image buffer');
  t.ok(Array.isArray(result.separatedImages), 'Returns the separated images');
  t.equal(result.separatedImages.length, 3, 'Returns one image per filter plus unfiltered');
  t.ok(typeof result.stats === 'object', 'Returns the pixel statistics');
  t.equal(result.stats.hero, 4, 'Counts the pixels claimed by the hero filter');
  t.equal(result.stats.enemy, 4, 'Counts the pixels claimed by the enemy filter');
  t.equal(result.stats.unfiltered, 8, 'Counts the unfiltered pixels');
  t.ok(Array.isArray(result.vectorData), 'Returns the vector data');
  t.equal(result.vectorData.length, 3, 'Includes every processed layer in the vector data');
  t.equal(result.vectorData[0].filterId, 'unfiltered', 'Resolves the filter id of each layer');

  console.log(`\n${color('gray', 'ProcessSolidFilters test-suite finished.')}`);

  return t.summary();
};

export default testProcessSolidFilters;
