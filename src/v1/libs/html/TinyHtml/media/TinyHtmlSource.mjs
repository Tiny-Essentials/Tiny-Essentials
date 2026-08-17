import TinyHtmlTemplate from '../TinyHtmlTemplate.mjs';

/**
 * TinyHtmlSource is a helper class for creating and validating <source> elements.
 * The <source> tag has contextual rules depending on its parent:
 *
 * - If inside <audio> or <video>, `src` is required, and `srcset`, `sizes`, `height`, `width` are forbidden.
 * - If inside <picture>, `srcset` is required, `sizes` is allowed, and `src` is forbidden.
 *
 * @example
 * // For <video>
 * const sourceVideo = new TinyHtmlSource({
 *   src: 'movie.mp4',
 *   type: 'video/mp4',
 *   context: 'video'
 * });
 *
 * // For <picture>
 * const sourcePicture = new TinyHtmlSource({
 *   srcset: 'image-200.jpg 200w, image-400.jpg 400w',
 *   sizes: '(max-width: 600px) 200px, 400px',
 *   type: 'image/jpeg',
 *   context: 'picture'
 * });
 *
 * @extends TinyHtmlTemplate<HTMLSourceElement>
 */
class TinyHtmlSource extends TinyHtmlTemplate {
  /**
   * Creates a new TinyHtmlSource instance.
   * @param {Object} config - Configuration object.
   * @param {string} [config.type] - MIME type (optionally with codecs).
   * @param {string} [config.src] - Resource URL (required in audio/video, forbidden in picture).
   * @param {string} [config.srcset] - Comma-separated list of image candidates (required in picture).
   * @param {string} [config.sizes] - List of source sizes (only valid in picture with srcset).
   * @param {string} [config.media] - Media query for conditional loading.
   * @param {number} [config.height] - Intrinsic image height (only valid in picture).
   * @param {number} [config.width] - Intrinsic image width (only valid in picture).
   * @param {string|string[]|Set<string>} [config.tags=[]] - Initial CSS classes.
   * @param {string} [config.mainClass=""] - Main CSS class.
   * @param {"audio"|"video"|"picture"} [config.context] - Parent context type (used for validation).
   * @throws {TypeError|Error} If attributes are invalid or violate context rules.
   */
  constructor({
    type,
    src,
    srcset,
    sizes,
    media,
    height,
    width,
    tags = [],
    mainClass = '',
    context,
  } = {}) {
    super(document.createElement('source'), tags, mainClass);

    // Validate context
    if (context !== undefined && !['audio', 'video', 'picture'].includes(context)) {
      throw new Error(
        `TinyHtmlSource: "context" must be "audio", "video", or "picture". Got: ${context}`,
      );
    }

    // Context rules
    if (context === 'audio' || context === 'video') {
      if (!src) {
        throw new Error(`TinyHtmlSource: "src" is required for <${context}> context.`);
      }
      if (
        srcset !== undefined ||
        sizes !== undefined ||
        height !== undefined ||
        width !== undefined
      ) {
        throw new Error(
          `TinyHtmlSource: "srcset", "sizes", "height", and "width" are not allowed in <${context}> context.`,
        );
      }
    }
    if (context === 'picture') {
      if (!srcset) {
        throw new Error('TinyHtmlSource: "srcset" is required for <picture> context.');
      }
      if (src !== undefined) {
        throw new Error('TinyHtmlSource: "src" is not allowed in <picture> context.');
      }
    }

    // Assign attributes
    if (type !== undefined) this.type = type;
    if (src !== undefined) this.src = src;
    if (srcset !== undefined) this.srcset = srcset;
    if (sizes !== undefined) this.sizes = sizes;
    if (media !== undefined) this.media = media;
    if (height !== undefined) this.height = height;
    if (width !== undefined) this.width = width;
  }

  /** @param {string} type */
  set type(type) {
    if (typeof type !== 'string') throw new TypeError('TinyHtmlSource: "type" must be a string.');
    this.setAttr('type', type);
  }

  /** @returns {string|null} */
  get type() {
    return this.attrString('type');
  }

  /** @param {string} src */
  set src(src) {
    if (typeof src !== 'string') throw new TypeError('TinyHtmlSource: "src" must be a string.');
    this.setAttr('src', src);
  }

  /** @returns {string|null} */
  get src() {
    return this.attrString('src');
  }

  /** @param {string} srcset */
  set srcset(srcset) {
    if (typeof srcset !== 'string')
      throw new TypeError('TinyHtmlSource: "srcset" must be a string.');
    this.setAttr('srcset', srcset);
  }

  /** @returns {string|null} */
  get srcset() {
    return this.attrString('srcset');
  }

  /** @param {string} sizes */
  set sizes(sizes) {
    if (typeof sizes !== 'string') throw new TypeError('TinyHtmlSource: "sizes" must be a string.');
    this.setAttr('sizes', sizes);
  }

  /** @returns {string|null} */
  get sizes() {
    return this.attrString('sizes');
  }

  /** @param {string} media */
  set media(media) {
    if (typeof media !== 'string') throw new TypeError('TinyHtmlSource: "media" must be a string.');
    this.setAttr('media', media);
  }

  /** @returns {string|null} */
  get media() {
    return this.attrString('media');
  }
}

export default TinyHtmlSource;
