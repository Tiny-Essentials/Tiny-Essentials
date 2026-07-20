import TinyHtmlTemplate from './TinyHtmlTemplate.mjs';

/**
 * TinyHtmlScript is a helper class for creating and managing <script> elements.
 * Supports both inline and external scripts, with attributes for async, defer, modules, etc.
 *
 * @extends TinyHtmlTemplate<HTMLScriptElement>
 */
class TinyHtmlScript extends TinyHtmlTemplate {
  /**
   * Creates a new TinyHtmlScript instance.
   * @param {Object} config - Configuration object.
   * @param {string} [config.src] - URI of an external script.
   * @param {string} [config.type] - The type of script (e.g., "module", "importmap", "speculationrules", or JS MIME type).
   * @param {boolean} [config.async=false] - Whether the script should be executed asynchronously (requires src).
   * @param {boolean} [config.defer=false] - Whether the script should be deferred until after parsing (requires src).
   * @param {string|string[]|Set<string>} [config.tags=[]] - Initial CSS classes.
   * @param {string} [config.mainClass=""] - Main CSS class.
   * @param {string} [config.content=""] - Inline script content (ignored if src is provided).
   * @param {string[]} [config.blocking] - Space-separated list of blocking tokens (currently only "render").
   * @param {"anonymous" | "use-credentials"} [config.crossorigin] - CORS setting ("anonymous" or "use-credentials").
   * @param {"auto"|"high"|"low"} [config.fetchpriority="auto"] - Fetch priority.
   * @param {string} [config.integrity] - Subresource integrity hash (only valid with src).
   * @param {boolean} [config.nomodule=false] - Whether to prevent execution in browsers supporting modules.
   * @param {string} [config.nonce] - Cryptographic nonce for CSP.
   * @param {string} [config.referrerpolicy] - Referrer policy.
   */
  constructor({
    src,
    type,
    async = false,
    defer = false,
    tags = [],
    mainClass = '',
    content = '',
    blocking,
    crossorigin,
    fetchpriority = 'auto',
    integrity,
    nomodule = false,
    nonce,
    referrerpolicy,
  } = {}) {
    super(document.createElement('script'), tags, mainClass);

    if (src !== undefined) this.src = src;
    if (type !== undefined) this.type = type;
    this.async = async;
    this.defer = defer;
    if (blocking !== undefined) this.blocking = blocking;
    if (crossorigin !== undefined) this.crossorigin = crossorigin;
    this.fetchpriority = fetchpriority;
    if (integrity !== undefined) this.integrity = integrity;
    this.nomodule = nomodule;
    if (nonce !== undefined) this.nonce = nonce;
    if (referrerpolicy !== undefined) this.referrerpolicy = referrerpolicy;

    if (!src && content) this.content = content;
  }

  /** @param {string} src */
  set src(src) {
    if (typeof src !== 'string') throw new TypeError('TinyHtmlScript: "src" must be a string.');
    this.setAttr('src', src);
  }
  /** @returns {string|null} */
  get src() {
    return this.attrString('src');
  }

  /** @param {string} type */
  set type(type) {
    if (typeof type !== 'string') throw new TypeError('TinyHtmlScript: "type" must be a string.');
    this.setAttr('type', type);
  }
  /** @returns {string|null} */
  get type() {
    return this.attrString('type');
  }

  /** @param {boolean} async */
  set async(async) {
    if (typeof async !== 'boolean')
      throw new TypeError('TinyHtmlScript: "async" must be a boolean.');
    if (async && !this.src) throw new Error('TinyHtmlScript: "async" requires a "src" attribute.');
    this.toggleProp('async', async);
  }
  /** @returns {boolean} */
  get async() {
    return this.hasProp('async');
  }

  /** @param {boolean} defer */
  set defer(defer) {
    if (typeof defer !== 'boolean')
      throw new TypeError('TinyHtmlScript: "defer" must be a boolean.');
    if (defer && !this.src) throw new Error('TinyHtmlScript: "defer" requires a "src" attribute.');
    this.toggleProp('defer', defer);
  }
  /** @returns {boolean} */
  get defer() {
    return this.hasProp('defer');
  }

  /** @param {string[]} blocking */
  set blocking(blocking) {
    for (const v of blocking) {
      if (v !== 'render') throw new Error(`TinyHtmlScript: invalid blocking token "${v}".`);
    }
    this.setAttr('blocking', blocking.join(' '));
  }
  /** @returns {string[]|null} */
  get blocking() {
    const val = this.attrString('blocking');
    return val ? val.split(/\s+/) : null;
  }

  /** @param {"anonymous"|"use-credentials"} crossorigin */
  set crossorigin(crossorigin) {
    if (!['anonymous', 'use-credentials'].includes(crossorigin))
      throw new Error('TinyHtmlScript: "crossorigin" must be "anonymous" or "use-credentials".');
    this.setAttr('crossorigin', crossorigin);
  }
  /** @returns {string|null} */
  get crossorigin() {
    return this.attrString('crossorigin');
  }

  /** @param {"auto"|"high"|"low"} fetchpriority */
  set fetchpriority(fetchpriority) {
    if (!['auto', 'high', 'low'].includes(fetchpriority))
      throw new Error('TinyHtmlScript: "fetchpriority" must be "auto", "high", or "low".');
    this.setAttr('fetchpriority', fetchpriority);
  }
  /** @returns {string|null} */
  get fetchpriority() {
    return this.attrString('fetchpriority');
  }

  /** @param {string} integrity */
  set integrity(integrity) {
    if (!this.src) throw new Error('TinyHtmlScript: "integrity" requires "src".');
    if (typeof integrity !== 'string')
      throw new TypeError('TinyHtmlScript: "integrity" must be a string.');
    this.setAttr('integrity', integrity);
  }
  /** @returns {string|null} */
  get integrity() {
    return this.attrString('integrity');
  }

  /** @param {boolean} nomodule */
  set nomodule(nomodule) {
    if (typeof nomodule !== 'boolean')
      throw new TypeError('TinyHtmlScript: "nomodule" must be a boolean.');
    this.toggleProp('nomodule', nomodule);
  }
  /** @returns {boolean} */
  get nomodule() {
    return this.hasProp('nomodule');
  }

  /** @param {string} nonce */
  set nonce(nonce) {
    if (typeof nonce !== 'string') throw new TypeError('TinyHtmlScript: "nonce" must be a string.');
    this.setAttr('nonce', nonce);
  }
  /** @returns {string|null} */
  get nonce() {
    return this.attrString('nonce');
  }

  /** @param {string} referrerpolicy */
  set referrerpolicy(referrerpolicy) {
    if (typeof referrerpolicy !== 'string')
      throw new TypeError('TinyHtmlScript: "referrerpolicy" must be a string.');
    this.setAttr('referrerpolicy', referrerpolicy);
  }
  /** @returns {string|null} */
  get referrerpolicy() {
    return this.attrString('referrerpolicy');
  }

  /** @param {string} code */
  set content(code) {
    if (typeof code !== 'string')
      throw new TypeError('TinyHtmlScript: "content" must be a string.');
    if (this.src)
      throw new Error('TinyHtmlScript: Cannot set inline content when "src" is defined.');
    this._preHtmlElem('content').textContent = code;
  }
  /** @returns {string|null} */
  get content() {
    return this._preHtmlElem('content').textContent || null;
  }
}

export default TinyHtmlScript;
