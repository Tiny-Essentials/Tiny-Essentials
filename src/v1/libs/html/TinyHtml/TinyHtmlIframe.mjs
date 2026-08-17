import TinyHtmlTemplate from './TinyHtmlTemplate.mjs';

/**
 * TinyHtmlIframe is a helper class for managing <iframe> elements.
 * It supports all standard attributes with validation and type safety.
 *
 * @example
 * const iframe = new TinyHtmlIframe({
 *   src: 'https://example.com',
 *   width: 600,
 *   height: 400,
 *   loading: 'lazy',
 *   sandbox: 'allow-scripts allow-same-origin',
 *   referrerpolicy: 'no-referrer',
 * });
 *
 * @extends TinyHtmlTemplate<HTMLIFrameElement>
 */
class TinyHtmlIframe extends TinyHtmlTemplate {
  /**
   * Creates a new TinyHtmlIframe instance with the specified configuration options.
   *
   * @param {Object} [config={}] - Configuration object for the iframe element.
   * @param {string} [config.src] - The URL of the page to embed inside the iframe.
   * @param {string} [config.srcdoc] - Inline HTML content to display inside the iframe (overrides `src` if provided).
   * @param {string} [config.name] - A name for the browsing context (used as the target for links or forms).
   * @param {string} [config.allow] - Permissions policy for the iframe (e.g., `"fullscreen; autoplay"`).
   * @param {boolean} [config.allowFullScreen=false] - Whether the iframe is allowed to display content in fullscreen mode.
   * @param {boolean} [config.browsingtopics] - Enables the Browsing Topics API.
   * @param {boolean} [config.credentialless] - Enables credentialless mode for cross-origin iframes.
   * @param {string} [config.csp] - Content Security Policy applied specifically to the iframe's content.
   * @param {string} [config.sandbox] - A space-separated list of sandboxing flags that restrict iframe capabilities.
   * @param {'no-referrer'|'no-referrer-when-downgrade'|'origin'|'origin-when-cross-origin'|'same-origin'|'strict-origin'|'strict-origin-when-cross-origin'|'unsafe-url'} [config.referrerpolicy] - Referrer policy to control the amount of referrer information sent.
   * @param {number|string} [config.width] - Width of the iframe in pixels or as a CSS dimension string (e.g., `"100%"`).
   * @param {number|string} [config.height] - Height of the iframe in pixels or as a CSS dimension string (e.g., `"500px"`).
   * @param {string} [config.title] - Accessible title for the iframe content.
   * @param {'lazy'|'eager'} [config.loading] - Loading strategy for the iframe. `"lazy"` defers loading until visible in the viewport.
   * @param {string|string[]|Set<string>} [config.tags=[]] - Additional tags or identifiers for this instance.
   * @param {string} [config.mainClass=''] - A main CSS class applied to the iframe element.
   */
  constructor({
    src,
    srcdoc,
    name,
    allow,
    allowFullScreen = false,
    browsingtopics,
    credentialless,
    csp,
    sandbox,
    referrerpolicy,
    width,
    height,
    title,
    loading,
    tags = [],
    mainClass = '',
  } = {}) {
    super(document.createElement('iframe'), tags, mainClass);

    if (src !== undefined) this.src = src;
    if (srcdoc !== undefined) this.srcdoc = srcdoc;
    if (name !== undefined) this.name = name;
    if (allow !== undefined) this.allow = allow;
    this.allowFullScreen = allowFullScreen;
    if (browsingtopics !== undefined) this.browsingtopics = browsingtopics;
    if (credentialless !== undefined) this.credentialless = credentialless;
    if (csp !== undefined) this.csp = csp;
    if (sandbox !== undefined) this.sandbox = sandbox;
    if (referrerpolicy !== undefined) this.referrerpolicy = referrerpolicy;
    if (width !== undefined) this.setWidth(width);
    if (height !== undefined) this.setHeight(height);
    if (title !== undefined) this.title = title;
    if (loading !== undefined) this.loading = loading;
  }

  // --- attributes ---

  /** @param {string} src */
  set src(src) {
    if (typeof src !== 'string') throw new TypeError('TinyIframe: "src" must be a string.');
    this.setAttr('src', src);
  }
  /** @returns {string|null} */
  get src() {
    return this.attrString('src');
  }

  /** @param {string} srcdoc */
  set srcdoc(srcdoc) {
    if (typeof srcdoc !== 'string') throw new TypeError('TinyIframe: "srcdoc" must be a string.');
    this.setAttr('srcdoc', srcdoc);
  }
  /** @returns {string|null} */
  get srcdoc() {
    return this.attrString('srcdoc');
  }

  /** @param {string} name */
  set name(name) {
    if (typeof name !== 'string') throw new TypeError('TinyIframe: "name" must be a string.');
    this.setAttr('name', name);
  }
  /** @returns {string|null} */
  get name() {
    return this.attrString('name');
  }

  /** @param {string} allow */
  set allow(allow) {
    if (typeof allow !== 'string') throw new TypeError('TinyIframe: "allow" must be a string.');
    this.setAttr('allow', allow);
  }
  /** @returns {string|null} */
  get allow() {
    return this.attrString('allow');
  }

  /** @param {boolean} allowFullScreen */
  set allowFullScreen(allowFullScreen) {
    if (typeof allowFullScreen !== 'boolean')
      throw new TypeError('TinyIframe: "allowFullScreen" must be a boolean.');
    if (allowFullScreen) this.addProp('allowfullscreen');
    else this.removeProp('allowfullscreen');
  }
  /** @returns {boolean} */
  get allowFullScreen() {
    return this.hasProp('allowfullscreen');
  }

  /** @param {boolean} browsingtopics */
  set browsingtopics(browsingtopics) {
    if (typeof browsingtopics !== 'boolean')
      throw new TypeError('TinyIframe: "browsingtopics" must be a boolean.');
    if (browsingtopics) this.addProp('browsingtopics');
    else this.removeProp('browsingtopics');
  }
  /** @returns {boolean} */
  get browsingtopics() {
    return this.hasProp('browsingtopics');
  }

  /** @param {boolean} credentialless */
  set credentialless(credentialless) {
    if (typeof credentialless !== 'boolean')
      throw new TypeError('TinyIframe: "credentialless" must be a boolean.');
    if (credentialless) this.addProp('credentialless');
    else this.removeProp('credentialless');
  }
  /** @returns {boolean} */
  get credentialless() {
    return this.hasProp('credentialless');
  }

  /** @param {string} csp */
  set csp(csp) {
    if (typeof csp !== 'string') throw new TypeError('TinyIframe: "csp" must be a string.');
    this.setAttr('csp', csp);
  }
  /** @returns {string|null} */
  get csp() {
    return this.attrString('csp');
  }

  /** @param {string} sandbox */
  set sandbox(sandbox) {
    if (typeof sandbox !== 'string')
      throw new TypeError('TinyIframe: "sandbox" must be a string (space-separated tokens).');
    this.setAttr('sandbox', sandbox);
  }
  /** @returns {string|null} */
  get sandbox() {
    return this.attrString('sandbox');
  }

  /** @param {string} referrerpolicy */
  set referrerpolicy(referrerpolicy) {
    const valid = [
      'no-referrer',
      'no-referrer-when-downgrade',
      'origin',
      'origin-when-cross-origin',
      'same-origin',
      'strict-origin',
      'strict-origin-when-cross-origin',
      'unsafe-url',
    ];
    if (!valid.includes(referrerpolicy))
      throw new TypeError(`TinyIframe: "referrerpolicy" must be one of: ${valid.join(', ')}.`);
    this.setAttr('referrerpolicy', referrerpolicy);
  }
  /** @returns {string|null} */
  get referrerpolicy() {
    return this.attrString('referrerpolicy');
  }

  /** @param {string} title */
  set title(title) {
    if (typeof title !== 'string') throw new TypeError('TinyIframe: "title" must be a string.');
    this.setAttr('title', title);
  }
  /** @returns {string|null} */
  get title() {
    return this.attrString('title');
  }

  /** @param {'lazy'|'eager'} loading */
  set loading(loading) {
    const valid = ['lazy', 'eager'];
    if (!valid.includes(loading))
      throw new TypeError(`TinyIframe: "loading" must be one of: ${valid.join(', ')}.`);
    this.setAttr('loading', loading);
  }
  /** @returns {string|null} */
  get loading() {
    return this.attrString('loading');
  }
}

export default TinyHtmlIframe;
