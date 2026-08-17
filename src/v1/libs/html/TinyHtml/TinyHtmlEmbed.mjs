import TinyHtmlTemplate from './TinyHtmlTemplate.mjs';

/**
 * TinyHtmlEmbed is a helper class for creating and managing <embed> elements,
 * typically used to embed external interactive content or media such as PDFs or plugins.
 *
 * Supported attributes:
 * - `src`: The URL of the resource being embedded.
 * - `type`: The MIME type used to select the plug-in to instantiate.
 * - `width`: Display width in CSS pixels (absolute value, no percentages).
 * - `height`: Display height in CSS pixels (absolute value, no percentages).
 *
 * @example
 * const embed = new TinyHtmlEmbed({
 *   src: '/docs/sample.pdf',
 *   type: 'application/pdf',
 *   width: 800,
 *   height: 600,
 * });
 *
 * @extends TinyHtmlTemplate<HTMLEmbedElement>
 */
class TinyHtmlEmbed extends TinyHtmlTemplate {
  /**
   * Creates a new TinyHtmlEmbed instance.
   *
   * @param {Object} [config={}] - Configuration object.
   * @param {string} [config.src=""] - The resource URL to embed.
   * @param {string} [config.type=""] - The MIME type of the resource (e.g. "application/pdf").
   * @param {number|string} [config.width] - Width in CSS pixels. Must be an absolute value (no percentages).
   * @param {number|string} [config.height] - Height in CSS pixels. Must be an absolute value (no percentages).
   * @param {string|string[]|Set<string>} [config.tags=[]] - CSS classes to apply.
   * @param {string} [config.mainClass=""] - Main CSS class.
   *
   * @throws {TypeError} If `src` is not a string.
   * @throws {TypeError} If `type` is not a string.
   * @throws {TypeError} If `width` is not a number or string.
   * @throws {TypeError} If `height` is not a number or string.
   */
  constructor({ src = '', type = '', width, height, tags = [], mainClass = '' } = {}) {
    super(document.createElement('embed'), tags, mainClass);

    // src
    if (src) this.src = src;
    // type
    if (type) this.type = type;
    // width
    if (width !== undefined) this.setWidth(width);
    // height
    if (height !== undefined) this.setHeight(height);
  }

  /** @param {string} src */
  set src(src) {
    if (typeof src !== 'string')
      throw new TypeError(`TinyHtmlEmbed: "src" must be a string. Got: ${typeof src}`);
    this.setAttr('src', src);
  }

  /** @returns {string|null} */
  get src() {
    return this.attrString('src');
  }

  /** @param {string} type */
  set type(type) {
    if (typeof type !== 'string')
      throw new TypeError(`TinyHtmlEmbed: "type" must be a string. Got: ${typeof type}`);
    this.setAttr('type', type);
  }

  /** @returns {string|null} */
  get type() {
    return this.attrString('type');
  }
}

export default TinyHtmlEmbed;
