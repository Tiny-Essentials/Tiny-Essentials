import TinyHtmlTemplate from './TinyHtmlTemplate.mjs';

/**
 * TinyHtmlStyle is a lightweight helper class for managing <style> elements.
 * It provides a simple API to configure attributes like `media`, `nonce`,
 * `blocking`, and `title`, while extending TinyHtmlTemplate for DOM operations.
 *
 * @example
 * const style = new TinyHtmlStyle({
 *   media: 'screen and (max-width: 600px)',
 *   blocking: 'render',
 * });
 * style.content = 'body { background: pink; }';
 *
 * @extends TinyHtmlTemplate<HTMLStyleElement>
 */
class TinyHtmlStyle extends TinyHtmlTemplate {
  /**
   * Creates a new TinyHtmlStyle instance.
   * @param {Object} config - Configuration object.
   * @param {string} [config.blocking] - Space-separated list of blocking tokens (currently only `"render"` is valid).
   * @param {string} [config.media="all"] - Media query that the stylesheet applies to. Defaults to `"all"`.
   * @param {string} [config.nonce] - Cryptographic nonce used in Content-Security-Policy for inline styles.
   * @param {string} [config.title] - Specifies an alternate style sheet set.
   * @param {string|string[]|Set<string>} [config.tags=[]] - Initial CSS classes.
   * @param {string} [config.mainClass=""] - Main CSS class to apply.
   */
  constructor({ blocking, media = 'all', nonce, title, tags = [], mainClass = '' } = {}) {
    super(document.createElement('style'), tags, mainClass);

    if (blocking !== undefined) this.blocking = blocking;
    if (media !== undefined) this.media = media;
    if (nonce !== undefined) this.nonce = nonce;
    if (title !== undefined) this.title = title;
  }

  /** @param {string} blocking */
  set blocking(blocking) {
    if (typeof blocking !== 'string')
      throw new TypeError('TinyHtmlStyle: "blocking" must be a string.');
    const validTokens = ['render'];
    const tokens = blocking.trim().split(/\s+/).filter(Boolean);
    for (const token of tokens) {
      if (!validTokens.includes(token)) {
        throw new Error(
          `TinyHtmlStyle: invalid blocking token "${token}". Only "render" is allowed.`,
        );
      }
    }
    if (tokens.length) this.setAttr('blocking', tokens.join(' '));
    else this.removeAttr('blocking');
  }

  /** @returns {string|null} */
  get blocking() {
    return this.attrString('blocking');
  }

  /** @param {string} media */
  set media(media) {
    if (typeof media !== 'string') throw new TypeError('TinyHtmlStyle: "media" must be a string.');
    if (media.trim()) this.setAttr('media', media.trim());
    else this.removeAttr('media');
  }

  /** @returns {string|null} */
  get media() {
    return this.attrString('media');
  }

  /** @param {string} nonce */
  set nonce(nonce) {
    if (typeof nonce !== 'string') throw new TypeError('TinyHtmlStyle: "nonce" must be a string.');
    if (nonce.trim()) this.setAttr('nonce', nonce.trim());
    else this.removeAttr('nonce');
  }

  /** @returns {string|null} */
  get nonce() {
    return this.attrString('nonce');
  }

  /** @param {string} title */
  set title(title) {
    if (typeof title !== 'string') throw new TypeError('TinyHtmlStyle: "title" must be a string.');
    if (title.trim()) this.setAttr('title', title.trim());
    else this.removeAttr('title');
  }

  /** @returns {string|null} */
  get title() {
    return this.attrString('title');
  }

  /** @param {string} cssText */
  set content(cssText) {
    if (typeof cssText !== 'string')
      throw new TypeError('TinyHtmlStyle: "content" must be a string.');
    this.el.textContent = cssText;
  }

  /** @returns {string} */
  get content() {
    return this.el.textContent ?? '';
  }
}

export default TinyHtmlStyle;
