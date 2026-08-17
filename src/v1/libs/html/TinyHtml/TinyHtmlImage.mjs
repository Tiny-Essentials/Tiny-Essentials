import TinyHtmlTemplate from './TinyHtmlTemplate.mjs';

/**
 * {boolean} [config.fetchMode=TinyHtmlImage.#defaultFetchMode] - Whether to enable or disable fetch mode. Must be a boolean.
 */

/**
 * TinyImage is a helper class for managing <img> elements.
 * It supports modern attributes like srcset, sizes, decoding, fetchpriority,
 * as well as width, height, alt, crossorigin, loading, and more.
 *
 * @example
 * const img = new TinyHtmlImage({
 *   src: '/logo.png',
 *   alt: 'Logo',
 *   width: 200,
 *   height: 100,
 *   loading: 'lazy',
 *   decoding: 'async',
 * });
 *
 * @extends TinyHtmlTemplate<HTMLImageElement>
 */
class TinyHtmlImage extends TinyHtmlTemplate {
  /** @type {boolean} */
  // static #defaultFetchMode = false;

  /** @returns {boolean} */
  // static get defaultFetchMode() {
  //   return TinyHtmlImage.#defaultFetchMode;
  // }

  /** @param {boolean} value */
  // static set defaultFetchMode(value) {
  //   if (typeof value !== 'boolean')
  //     throw new TypeError('Expected a boolean value for defaultFetchMode');
  //   TinyHtmlImage.#defaultFetchMode = value;
  // }

  /** @type {boolean} */
  // #fetchMode;

  /** @returns {boolean} */
  // get fetchMode() {
  //   return this.#fetchMode;
  // }

  /**
   * Creates a new TinyHtmlImage instance wrapping an <img> element.
   * This class simplifies working with images by providing a structured API
   * for common attributes and configuration options.
   *
   * @param {Object} config - Image configuration object.
   * @param {string} config.src - Image source URL (**required**).
   * @param {string} [config.alt=""] - Alternate text for the image. Defaults to an empty string.
   * @param {number} [config.width] - Width of the image in pixels.
   * @param {number} [config.height] - Height of the image in pixels.
   * @param {string|string[]|Set<string>} [config.tags=[]] - Initial CSS classes to apply.
   * @param {string} [config.mainClass=""] - Main CSS class applied to the element.
   * @param {"anonymous"|"use-credentials"} [config.crossorigin] - Cross-origin policy for loading the image.
   * @param {"sync"|"async"|"auto"} [config.decoding] - Decoding mode for the image.
   * @param {string} [config.elementtiming] - Name used for performance timing attribution.
   * @param {"high"|"low"|"auto"} [config.fetchpriority] - Fetch priority for the image resource.
   * @param {boolean} [config.ismap=false] - Whether the image is part of a server-side image map.
   * @param {"eager"|"lazy"} [config.loading] - Loading behavior hint (`"lazy"` defers off-screen images).
   * @param {string} [config.referrerpolicy] - Referrer policy when fetching the image.
   * @param {string} [config.sizes] - Sizes attribute, used with `srcset` for responsive images.
   * @param {string} [config.srcset] - List of image sources for responsive loading.
   * @param {string} [config.usemap] - Name of an associated image map to use.
   */
  constructor({
    src,
    alt,
    width,
    height,
    tags = [],
    mainClass = '',
    // fetchMode = TinyHtmlImage.#defaultFetchMode,
    crossorigin,
    decoding,
    elementtiming,
    fetchpriority,
    ismap = false,
    loading,
    referrerpolicy,
    sizes,
    srcset,
    usemap,
  }) {
    super(document.createElement('img'), tags, mainClass);

    // required
    this.src = src;

    if (alt !== undefined) this.alt = alt;
    if (width !== undefined) this.setWidth(width);
    if (height !== undefined) this.setHeight(height);
    if (crossorigin !== undefined) this.crossorigin = crossorigin;
    if (decoding !== undefined) this.decoding = decoding;
    if (elementtiming !== undefined) this.elementtiming = elementtiming;
    if (fetchpriority !== undefined) this.fetchpriority = fetchpriority;
    this.ismap = ismap;
    if (loading !== undefined) this.loading = loading;
    if (referrerpolicy !== undefined) this.referrerpolicy = referrerpolicy;
    if (sizes !== undefined) this.sizes = sizes;
    if (srcset !== undefined) this.srcset = srcset;
    if (usemap !== undefined) this.usemap = usemap;

    // if (typeof fetchMode !== 'boolean')
    //   throw new TypeError('TinyImage: "fetchMode" must be a boolean.');
    // this.#fetchMode = fetchMode;
  }

  // --- Attributes ---

  /** @param {string} value */
  set src(value) {
    if (typeof value !== 'string') throw new TypeError('TinyImage: "src" must be a string.');
    this.setAttr('src', value);
  }

  /** @returns {string|null} */
  get src() {
    return this.attrString('src');
  }

  /** @param {string} value */
  set alt(value) {
    if (typeof value !== 'string') throw new TypeError('TinyImage: "alt" must be a string.');
    this.setAttr('alt', value);
  }

  /** @returns {string|null} */
  get alt() {
    return this.attrString('alt');
  }

  /** @param {'anonymous'|'use-credentials'} value */
  set crossorigin(value) {
    if (!['anonymous', 'use-credentials'].includes(value))
      throw new TypeError('TinyImage: "crossorigin" must be "anonymous" or "use-credentials".');
    this.setAttr('crossorigin', value);
  }

  /** @returns {string|null} */
  get crossorigin() {
    return this.attrString('crossorigin');
  }

  /** @param {'sync'|'async'|'auto'} value */
  set decoding(value) {
    if (!['sync', 'async', 'auto'].includes(value))
      throw new TypeError('TinyImage: "decoding" must be "sync", "async" or "auto".');
    this.setAttr('decoding', value);
  }

  /** @returns {string|null} */
  get decoding() {
    return this.attrString('decoding');
  }

  /** @param {string} value */
  set elementtiming(value) {
    if (typeof value !== 'string')
      throw new TypeError('TinyImage: "elementtiming" must be a string.');
    this.setAttr('elementtiming', value);
  }

  /** @returns {string|null} */
  get elementtiming() {
    return this.attrString('elementtiming');
  }

  /** @param {'high'|'low'|'auto'} value */
  set fetchpriority(value) {
    if (!['high', 'low', 'auto'].includes(value))
      throw new TypeError('TinyImage: "fetchpriority" must be "high", "low" or "auto".');
    this.setAttr('fetchpriority', value);
  }

  /** @returns {string|null} */
  get fetchpriority() {
    return this.attrString('fetchpriority');
  }

  /** @param {boolean} value */
  set ismap(value) {
    if (typeof value !== 'boolean') throw new TypeError('TinyImage: "ismap" must be a boolean.');
    if (value) this.addProp('ismap');
    else this.removeProp('ismap');
  }

  /** @returns {boolean} */
  get ismap() {
    return this.hasProp('ismap');
  }

  /** @param {'eager'|'lazy'} value */
  set loading(value) {
    if (!['eager', 'lazy'].includes(value))
      throw new TypeError('TinyImage: "loading" must be "eager" or "lazy".');
    this.setAttr('loading', value);
  }

  /** @returns {string|null} */
  get loading() {
    return this.attrString('loading');
  }

  /** @param {string} value */
  set referrerpolicy(value) {
    if (typeof value !== 'string')
      throw new TypeError('TinyImage: "referrerpolicy" must be a string.');
    this.setAttr('referrerpolicy', value);
  }

  /** @returns {string|null} */
  get referrerpolicy() {
    return this.attrString('referrerpolicy');
  }

  /** @param {string} value */
  set sizes(value) {
    if (typeof value !== 'string') throw new TypeError('TinyImage: "sizes" must be a string.');
    this.setAttr('sizes', value);
  }

  /** @returns {string|null} */
  get sizes() {
    return this.attrString('sizes');
  }

  /** @param {string} value */
  set srcset(value) {
    if (typeof value !== 'string') throw new TypeError('TinyImage: "srcset" must be a string.');
    this.setAttr('srcset', value);
  }

  /** @returns {string|null} */
  get srcset() {
    return this.attrString('srcset');
  }

  /** @param {string} value */
  set usemap(value) {
    if (typeof value !== 'string') throw new TypeError('TinyImage: "usemap" must be a string.');
    this.setAttr('usemap', value);
  }

  /** @returns {string|null} */
  get usemap() {
    return this.attrString('usemap');
  }
}

export default TinyHtmlImage;
