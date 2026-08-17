import TinyHtmlTemplate from './TinyHtmlTemplate.mjs';

/**
 * TinyHtmlLink is a lightweight helper class for managing <link> elements.
 * It provides a strict API for configuring preload, stylesheets, icons,
 * and other external resource references.
 *
 * @example
 * const link = new TinyHtmlLink({
 *   rel: 'stylesheet',
 *   href: '/styles/main.css',
 *   media: 'screen',
 *   blocking: 'render',
 * });
 *
 * document.head.appendChild(link.el);
 *
 * @extends TinyHtmlTemplate<HTMLLinkElement>
 */
class TinyHtmlLink extends TinyHtmlTemplate {
  /**
   * Creates a new TinyHtmlLink instance.
   * @param {Object} config - Configuration object.
   * @param {string} [config.as] - Type of content being loaded (valid only for preload/modulepreload).
   * @param {'render'} [config.blocking] - Blocking behavior (only "render").
   * @param {'anonymous'|'use-credentials'} [config.crossorigin] - CORS mode ("anonymous" or "use-credentials").
   * @param {boolean} [config.disabled=false] - Whether the stylesheet is disabled (rel=stylesheet only).
   * @param {'auto'|'high'|'low'} [config.fetchpriority="auto"] - Fetch priority ("high", "low", "auto").
   * @param {string} [config.href] - URL of the linked resource.
   * @param {string} [config.hreflang] - Language of the linked resource (RFC 5646).
   * @param {string} [config.imagesizes] - Sizes attribute for preload images.
   * @param {string} [config.imagesrcset] - Srcset attribute for preload images.
   * @param {string} [config.integrity] - Subresource Integrity metadata.
   * @param {string} [config.media="all"] - Media query (mainly for stylesheets).
   * @param {string} [config.referrerpolicy] - Referrer policy ("no-referrer", etc.).
   * @param {string} [config.rel] - Relationship (stylesheet, preload, icon, etc.).
   * @param {string} [config.sizes] - Icon sizes.
   * @param {string} [config.title] - Title (alternate stylesheet sets).
   * @param {string} [config.type] - MIME type of the resource (e.g., "text/css").
   * @param {string|string[]|Set<string>} [config.tags=[]] - Initial CSS classes.
   * @param {string} [config.mainClass=""] - Main CSS class.
   */
  constructor({
    as,
    blocking,
    crossorigin,
    disabled = false,
    fetchpriority = 'auto',
    href,
    hreflang,
    imagesizes,
    imagesrcset,
    integrity,
    media = 'all',
    referrerpolicy,
    rel,
    sizes,
    title,
    type,
    tags = [],
    mainClass = '',
  } = {}) {
    super(document.createElement('link'), tags, mainClass);

    if (rel !== undefined) this.rel = rel;
    if (as !== undefined) this.as = as;
    if (blocking !== undefined) this.blocking = blocking;
    if (crossorigin !== undefined) this.crossorigin = crossorigin;
    this.disabled = disabled;
    if (fetchpriority !== undefined) this.fetchpriority = fetchpriority;
    if (href !== undefined) this.href = href;
    if (hreflang !== undefined) this.hreflang = hreflang;
    if (imagesizes !== undefined) this.imagesizes = imagesizes;
    if (imagesrcset !== undefined) this.imagesrcset = imagesrcset;
    if (integrity !== undefined) this.integrity = integrity;
    if (media !== undefined) this.media = media;
    if (referrerpolicy !== undefined) this.referrerpolicy = referrerpolicy;
    if (sizes !== undefined) this.sizes = sizes;
    if (title !== undefined) this.title = title;
    if (type !== undefined) this.type = type;
  }

  /** @param {string} rel */
  set rel(rel) {
    if (typeof rel !== 'string' || !rel.trim())
      throw new TypeError('TinyHtmlLink: "rel" must be a non-empty string.');
    this.setAttr('rel', rel.trim());
  }
  /** @returns {string|null} */
  get rel() {
    return this.attrString('rel');
  }

  /** @param {string} as */
  set as(as) {
    const validAs = [
      'audio',
      'document',
      'embed',
      'fetch',
      'font',
      'image',
      'object',
      'script',
      'style',
      'track',
      'video',
      'worker',
    ];
    if (!validAs.includes(as))
      throw new TypeError(`TinyHtmlLink: "as" must be one of ${validAs.join(', ')}.`);
    this.setAttr('as', as);
  }
  /** @returns {string|null} */
  get as() {
    return this.attrString('as');
  }

  /** @param {'render'} blocking */
  set blocking(blocking) {
    if (blocking !== 'render')
      throw new TypeError('TinyHtmlLink: "blocking" only accepts "render".');
    this.setAttr('blocking', blocking);
  }
  /** @returns {string|null} */
  get blocking() {
    return this.attrString('blocking');
  }

  /** @param {'anonymous'|'use-credentials'} crossorigin */
  set crossorigin(crossorigin) {
    const valid = ['anonymous', 'use-credentials'];
    if (!valid.includes(crossorigin))
      throw new TypeError(`TinyHtmlLink: "crossorigin" must be one of ${valid.join(', ')}.`);
    this.setAttr('crossorigin', crossorigin);
  }
  /** @returns {string|null} */
  get crossorigin() {
    return this.attrString('crossorigin');
  }

  /** @param {boolean} disabled */
  set disabled(disabled) {
    if (typeof disabled !== 'boolean') throw new TypeError('"disabled" must be a boolean.');
    if (disabled) this.addProp('disabled');
    else this.removeProp('disabled');
  }
  /** @returns {boolean} */
  get disabled() {
    return this.hasProp('disabled');
  }

  /** @param {'auto'|'high'|'low'} fetchpriority */
  set fetchpriority(fetchpriority) {
    const valid = ['auto', 'high', 'low'];
    if (!valid.includes(fetchpriority))
      throw new TypeError(`TinyHtmlLink: "fetchpriority" must be one of ${valid.join(', ')}.`);
    this.setAttr('fetchpriority', fetchpriority);
  }
  /** @returns {string|null} */
  get fetchpriority() {
    return this.attrString('fetchpriority');
  }

  /** @param {string} href */
  set href(href) {
    if (typeof href !== 'string') throw new TypeError('TinyHtmlLink: "href" must be a string.');
    this.setAttr('href', href);
  }
  /** @returns {string|null} */
  get href() {
    return this.attrString('href');
  }

  /** @param {string} hreflang */
  set hreflang(hreflang) {
    if (typeof hreflang !== 'string')
      throw new TypeError('TinyHtmlLink: "hreflang" must be a string.');
    this.setAttr('hreflang', hreflang);
  }
  /** @returns {string|null} */
  get hreflang() {
    return this.attrString('hreflang');
  }

  /** @param {string} imagesizes */
  set imagesizes(imagesizes) {
    if (typeof imagesizes !== 'string')
      throw new TypeError('TinyHtmlLink: "imagesizes" must be a string.');
    this.setAttr('imagesizes', imagesizes);
  }
  /** @returns {string|null} */
  get imagesizes() {
    return this.attrString('imagesizes');
  }

  /** @param {string} imagesrcset */
  set imagesrcset(imagesrcset) {
    if (typeof imagesrcset !== 'string')
      throw new TypeError('TinyHtmlLink: "imagesrcset" must be a string.');
    this.setAttr('imagesrcset', imagesrcset);
  }
  /** @returns {string|null} */
  get imagesrcset() {
    return this.attrString('imagesrcset');
  }

  /** @param {string} integrity */
  set integrity(integrity) {
    if (typeof integrity !== 'string')
      throw new TypeError('TinyHtmlLink: "integrity" must be a string.');
    this.setAttr('integrity', integrity);
  }
  /** @returns {string|null} */
  get integrity() {
    return this.attrString('integrity');
  }

  /** @param {string} media */
  set media(media) {
    if (typeof media !== 'string') throw new TypeError('TinyHtmlLink: "media" must be a string.');
    if (media.trim()) this.setAttr('media', media.trim());
  }
  /** @returns {string|null} */
  get media() {
    return this.attrString('media');
  }

  /** @param {string} referrerpolicy */
  set referrerpolicy(referrerpolicy) {
    const validPolicies = [
      'no-referrer',
      'no-referrer-when-downgrade',
      'origin',
      'origin-when-cross-origin',
      'unsafe-url',
    ];
    if (!validPolicies.includes(referrerpolicy))
      throw new TypeError(
        `TinyHtmlLink: "referrerpolicy" must be one of ${validPolicies.join(', ')}.`,
      );
    this.setAttr('referrerpolicy', referrerpolicy);
  }
  /** @returns {string|null} */
  get referrerpolicy() {
    return this.attrString('referrerpolicy');
  }

  /** @param {string} sizes */
  set sizes(sizes) {
    if (typeof sizes !== 'string') throw new TypeError('TinyHtmlLink: "sizes" must be a string.');
    this.setAttr('sizes', sizes);
  }
  /** @returns {string|null} */
  get sizes() {
    return this.attrString('sizes');
  }

  /** @param {string} title */
  set title(title) {
    if (typeof title !== 'string') throw new TypeError('TinyHtmlLink: "title" must be a string.');
    this.setAttr('title', title);
  }
  /** @returns {string|null} */
  get title() {
    return this.attrString('title');
  }

  /** @param {string} type */
  set type(type) {
    if (typeof type !== 'string') throw new TypeError('TinyHtmlLink: "type" must be a string.');
    this.setAttr('type', type);
  }
  /** @returns {string|null} */
  get type() {
    return this.attrString('type');
  }
}

export default TinyHtmlLink;
