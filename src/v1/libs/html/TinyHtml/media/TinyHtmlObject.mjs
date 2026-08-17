import TinyHtmlTemplate from '../TinyHtmlTemplate.mjs';

/**
 * TinyHtmlObject is a lightweight helper class for managing <object> elements.
 * It allows configuring attributes such as `data`, `type`, `form`, `height`, `width`, and `name`
 * with built-in validation.
 *
 * @example
 * const object = new TinyHtmlObject({
 *   data: 'document.pdf',
 *   type: 'application/pdf',
 *   width: 800,
 *   height: 600
 * });
 *
 * @extends TinyHtmlTemplate<HTMLObjectElement>
 */
class TinyHtmlObject extends TinyHtmlTemplate {
  /**
   * Creates a new TinyHtmlObject instance.
   *
   * @param {Object} config - Configuration object.
   * @param {string} [config.data=""] - The URL of the resource to embed.
   * @param {string} [config.type=""] - The MIME type of the resource.
   * @param {string} [config.form] - The ID of a <form> element in the same document.
   * @param {number} [config.height] - Height of the displayed resource, in CSS pixels (positive integer).
   * @param {number} [config.width] - Width of the displayed resource, in CSS pixels (positive integer).
   * @param {string} [config.name] - Name of the browsing context or control.
   * @param {string|string[]|Set<string>} [config.tags=[]] - Initial CSS classes.
   * @param {string} [config.mainClass=""] - Main CSS class.
   *
   * @throws {Error} If neither `data` nor `type` is provided.
   * @throws {TypeError} If any attribute is of the wrong type.
   */
  constructor({ data = '', type = '', form, height, width, name, tags = [], mainClass = '' } = {}) {
    super(document.createElement('object'), tags, mainClass);

    // At least one of "data" or "type" must be provided
    if (!data && !type)
      throw new Error('TinyHtmlObject: At least one of "data" or "type" must be provided.');

    // --- Apply attributes if defined ---
    if (data) this.elData = data;
    if (type) this.type = type;
    if (form !== undefined) this.form = form;
    if (height !== undefined) this.height = height;
    if (width !== undefined) this.width = width;
    if (name !== undefined) this.name = name;
  }

  /** @param {string} data */
  set elData(data) {
    if (typeof data !== 'string') throw new TypeError('TinyHtmlObject: "data" must be a string.');
    this.setAttr('data', data);
  }

  /** @returns {string|null} */
  get elData() {
    return this.attrString('data');
  }

  /** @param {string} type */
  set type(type) {
    if (typeof type !== 'string') throw new TypeError('TinyHtmlObject: "type" must be a string.');
    this.setAttr('type', type);
  }

  /** @returns {string|null} */
  get type() {
    return this.attrString('type');
  }

  /** @param {string} form */
  set form(form) {
    if (typeof form !== 'string' || !form.trim())
      throw new TypeError('TinyHtmlObject: "form" must be a non-empty string.');
    this.setAttr('form', form);
  }

  /** @returns {string|null} */
  get form() {
    return this.attrString('form');
  }

  /** @param {string} name */
  set name(name) {
    if (typeof name !== 'string' || !name.trim())
      throw new TypeError('TinyHtmlObject: "name" must be a non-empty string.');
    this.setAttr('name', name);
  }

  /** @returns {string|null} */
  get name() {
    return this.attrString('name');
  }
}

export default TinyHtmlObject;
