import TinyHtmlTemplate from './TinyHtmlTemplate.mjs';

/**
 * TinyHtmlCanvas is a helper for <canvas> elements,
 * providing a direct way to configure its size and retrieve the rendering context.
 *
 * @example
 * const canvas = new TinyHtmlCanvas({ width: 800, height: 600 });
 * const ctx = canvas.getContext('2d');
 *
 * @extends TinyHtmlTemplate<HTMLCanvasElement>
 */
class TinyHtmlCanvas extends TinyHtmlTemplate {
  /**
   * Creates a new TinyHtmlCanvas instance.
   * @param {Object} config
   * @param {number} [config.width] - Canvas width in pixels.
   * @param {number} [config.height] - Canvas height in pixels.
   * @param {string|string[]|Set<string>} [config.tags=[]] - Initial CSS classes.
   * @param {string} [config.mainClass=""] - Main CSS class.
   */
  constructor({ width, height, tags = [], mainClass = '' } = {}) {
    super(document.createElement('canvas'), tags, mainClass);

    if (width !== undefined) this.width = width;
    if (height !== undefined) this.height = height;
  }

  /**
   * Gets the rendering context of the canvas.
   * @param {string} [type="2d"] - Context type ("2d", "webgl", etc.).
   * @param {any} [options={}] - Context options.
   * @returns {RenderingContext|null}
   */
  getContext(type = '2d', options = {}) {
    if (typeof type !== 'string') {
      throw new TypeError(`getContext: "type" must be a string. Got: ${typeof type}`);
    }

    const el = this.get(0);
    if (!(el instanceof HTMLCanvasElement)) return null;
    return el.getContext(type, options);
  }
}

export default TinyHtmlCanvas;
