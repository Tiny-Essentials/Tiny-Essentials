/**
 * Minimal DOM implementation used by the Node.js test-suite.
 *
 * The library ships several browser only helpers (drag & drop, notifications,
 * templates, ...). Instead of pulling a full DOM implementation (jsdom) into the
 * dependency tree, the test-suite ships this tiny, dependency free, DOM subset
 * that is just good enough to exercise the public API of those helpers.
 *
 * It intentionally implements only what the components under test actually use:
 * a small element tree, a `classList`, an event system, `style`, attributes and
 * a very small `querySelector`/`querySelectorAll` supporting `tag`, `.class`,
 * `#id`, `tag.class` and `[attr=value]` selectors.
 */

/** @type {number} */
let uid = 0;

/**
 * Very small `classList` implementation.
 */
export class TinyClassList {
  /** @type {Set<string>} */
  #classes = new Set();

  /** @param {string} [value] */
  constructor(value = '') {
    this.value = value;
  }

  /** @returns {string} */
  get value() {
    return [...this.#classes].join(' ');
  }

  /** @param {string} value */
  set value(value) {
    this.#classes = new Set(String(value).split(/\s+/).filter(Boolean));
  }

  /** @param {...string} names */
  add(...names) {
    for (const name of names) if (name) this.#classes.add(String(name));
  }

  /** @param {...string} names */
  remove(...names) {
    for (const name of names) this.#classes.delete(String(name));
  }

  /** @param {string} name */
  contains(name) {
    return this.#classes.has(String(name));
  }

  /**
   * @param {string} name
   * @param {boolean} [force]
   */
  toggle(name, force) {
    const has = this.#classes.has(String(name));
    const shouldAdd = force === undefined ? !has : force;
    if (shouldAdd) this.#classes.add(String(name));
    else this.#classes.delete(String(name));
    return shouldAdd;
  }

  get length() {
    return this.#classes.size;
  }

  /** @param {number} index */
  item(index) {
    return [...this.#classes][index] ?? null;
  }

  toString() {
    return this.value;
  }

  [Symbol.iterator]() {
    return this.#classes[Symbol.iterator]();
  }
}

/**
 * Minimal `style` bag that also behaves like a string map.
 */
export class TinyStyle {
  constructor() {
    return new Proxy(/** @type {any} */ (this), {
      get: (target, prop) => {
        if (typeof prop !== 'string') return target[prop];
        if (prop === 'setProperty') {
          return (name, value) => {
            target[name] = value;
          };
        }
        if (prop === 'getPropertyValue') return (name) => target[name] ?? '';
        if (prop === 'removeProperty') {
          return (name) => {
            delete target[name];
          };
        }
        if (prop === 'cssText') return '';
        return target[prop] ?? '';
      },
      set: (target, prop, value) => {
        target[prop] = value;
        return true;
      },
    });
  }
}

/**
 * Minimal DOM element.
 */
export class TinyElement {
  /** @param {string} tagName */
  constructor(tagName) {
    this.tagName = String(tagName).toUpperCase();
    this.nodeName = this.tagName;
    this.nodeType = 1;
    this.uid = ++uid;
    /** @type {TinyElement[]} */
    this.childNodes = [];
    /** @type {TinyElement|null} */
    this.parentNode = null;
    this.classList = new TinyClassList();
    this.style = new TinyStyle();
    /** @type {Record<string, string>} */
    this.attributes = {};
    /** @type {Record<string, Set<Function>>} */
    this._listeners = {};
    this._innerHTML = '';
    this._textContent = '';
    this.value = '';
    this.checked = false;
    this.disabled = false;
    this.name = '';
    this.type = '';
    this.href = '';
    this.src = '';
    this.id = '';
    this.dataset = {};
    this.scrollTop = 0;
    this.scrollHeight = 0;
    this.scrollWidth = 0;
    this.clientHeight = 0;
    this.clientWidth = 0;
    this.offsetHeight = 0;
    this.offsetWidth = 0;
    this.offsetTop = 0;
    this.offsetLeft = 0;
  }

  /** @returns {any} */
  get children() {
    const nodes = this.childNodes;
    return new Proxy(nodes, {
      get: (target, prop) => {
        if (prop === 'item') return (index) => target[index] ?? null;
        const value = target[prop];
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
  }

  get className() {
    return this.classList.value;
  }

  set className(value) {
    this.classList = new TinyClassList(value);
  }

  get innerHTML() {
    return this._innerHTML;
  }

  set innerHTML(value) {
    this._innerHTML = String(value);
    this.childNodes = [];
    for (const child of parseHTML(this._innerHTML).slice()) this.appendChild(child);
  }

  get textContent() {
    return this._textContent;
  }

  set textContent(value) {
    this._textContent = String(value);
    this.childNodes = [];
  }

  get innerText() {
    return this._textContent;
  }

  set innerText(value) {
    this._textContent = String(value);
  }

  get firstChild() {
    return this.childNodes[0] ?? null;
  }

  get lastChild() {
    return this.childNodes[this.childNodes.length - 1] ?? null;
  }

  get parentElement() {
    return this.parentNode;
  }

  /** @param {TinyElement} child */
  appendChild(child) {
    if (!child) return child;
    if (child.parentNode) child.parentNode.removeChild(child);
    child.parentNode = this;
    this.childNodes.push(child);
    return child;
  }

  /** @param {...any} children */
  append(...children) {
    for (const child of children) {
      if (child instanceof TinyElement) this.appendChild(child);
      else if (child !== null && child !== undefined) {
        const text = new TinyElement('span');
        text.textContent = String(child);
        this.appendChild(text);
      }
    }
  }

  /** @param {...any} children */
  prepend(...children) {
    for (const child of children.reverse()) {
      if (child instanceof TinyElement) {
        if (child.parentNode) child.parentNode.removeChild(child);
        child.parentNode = this;
        this.childNodes.unshift(child);
      }
    }
  }

  /** @param {TinyElement} child */
  removeChild(child) {
    const index = this.childNodes.indexOf(child);
    if (index !== -1) {
      this.childNodes.splice(index, 1);
      child.parentNode = null;
    }
    return child;
  }

  remove() {
    if (this.parentNode) this.parentNode.removeChild(this);
  }

  /** @param {TinyElement} node */
  contains(node) {
    if (node === this) return true;
    return this.childNodes.some((child) => child.contains(node));
  }

  /** @param {TinyElement} node @param {TinyElement} ref */
  insertBefore(node, ref) {
    if (!ref) return this.appendChild(node);
    const index = this.childNodes.indexOf(ref);
    if (index === -1) return this.appendChild(node);
    if (node.parentNode) node.parentNode.removeChild(node);
    node.parentNode = this;
    this.childNodes.splice(index, 0, node);
    return node;
  }

  /** @param {string} name @param {string} [value] */
  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name === 'class') this.className = String(value);
    if (name === 'id') this.id = String(value);
    if (name === 'type') this.type = String(value);
    if (name === 'name') this.name = String(value);
    if (name === 'value') this.value = String(value);
  }

  /** @param {string} name */
  getAttribute(name) {
    if (name === 'class') return this.className;
    if (name === 'id') return this.id;
    return this.attributes[name] ?? null;
  }

  /** @param {string} name */
  hasAttribute(name) {
    return name in this.attributes || (name === 'class' && !!this.className);
  }

  /** @param {string} name */
  removeAttribute(name) {
    delete this.attributes[name];
  }

  /** @param {string} name */
  closest(name) {
    let node = /** @type {TinyElement|null} */ (this);
    while (node) {
      if (node.matches(name)) return node;
      node = node.parentNode;
    }
    return null;
  }

  /** @param {string} selector */
  matches(selector) {
    return matchesSelector(this, selector);
  }

  /** @param {string} selector */
  querySelector(selector) {
    return this.querySelectorAll(selector)[0] ?? null;
  }

  /** @param {string} selector */
  querySelectorAll(selector) {
    /** @type {TinyElement[]} */
    const result = [];
    const walk = (/** @type {TinyElement} */ node) => {
      for (const child of node.childNodes) {
        if (matchesSelector(child, selector)) result.push(child);
        walk(child);
      }
    };
    walk(this);
    return result;
  }

  /** @param {string} type @param {Function} handler */
  addEventListener(type, handler) {
    if (!this._listeners[type]) this._listeners[type] = new Set();
    this._listeners[type].add(handler);
  }

  /** @param {string} type @param {Function} handler */
  removeEventListener(type, handler) {
    this._listeners[type]?.delete(handler);
  }

  /** @param {any} event */
  dispatchEvent(event) {
    const type = typeof event === 'string' ? event : event.type;
    const evt = typeof event === 'string' ? { type, target: this } : event;
    if (!evt.target) evt.target = this;
    if (typeof evt.preventDefault !== 'function') evt.preventDefault = () => {};
    if (typeof evt.stopPropagation !== 'function') evt.stopPropagation = () => {};
    const handlers = this._listeners[type];
    if (handlers) for (const handler of [...handlers]) handler.call(this, evt);
    return true;
  }

  getBoundingClientRect() {
    return {
      top: this.offsetTop,
      left: this.offsetLeft,
      width: this.offsetWidth,
      height: this.offsetHeight,
      right: this.offsetLeft + this.offsetWidth,
      bottom: this.offsetTop + this.offsetHeight,
      x: this.offsetLeft,
      y: this.offsetTop,
    };
  }

  focus() {
    if (globalThis.document) globalThis.document.activeElement = this;
  }

  blur() {}
  click() {
    this.dispatchEvent({ type: 'click' });
  }
  setSelectionRange() {}
  scrollIntoView() {}
  getContext() {
    return null;
  }
}

/**
 * @param {TinyElement} element
 * @param {string} selector
 * @returns {boolean}
 */
function matchesSelector(element, selector) {
  return String(selector)
    .split(',')
    .map((part) => part.trim())
    .some((part) => matchesSimple(element, part));
}

/**
 * @param {TinyElement} element
 * @param {string} selector
 * @returns {boolean}
 */
function matchesSimple(element, selector) {
  if (!selector) return false;
  // Attribute selector: tag[attr=value] or [attr=value]
  const attrMatch = selector.match(/^([a-zA-Z0-9]*)\[([\w-]+)(?:=([^\]]+))?\]$/);
  if (attrMatch) {
    const [, tag, attr, rawValue] = attrMatch;
    if (tag && element.tagName !== tag.toUpperCase()) return false;
    const value = rawValue ? rawValue.replace(/^['"]|['"]$/g, '') : undefined;
    const actual = element.getAttribute(attr);
    if (value === undefined) return actual !== null;
    return actual === value;
  }

  // tag.class#id combinations
  const tagMatch = selector.match(/^[a-zA-Z0-9]+/);
  if (tagMatch && element.tagName !== tagMatch[0].toUpperCase()) return false;

  const idMatch = selector.match(/#([\w-]+)/);
  if (idMatch && element.id !== idMatch[1]) return false;

  const classMatches = [...selector.matchAll(/\.([\w-]+)/g)].map((m) => m[1]);
  for (const cls of classMatches) {
    if (!element.classList.contains(cls)) return false;
  }

  return true;
}

/**
 * Minimal HTML parser used by {@link TinyElement.innerHTML}.
 * Only supports the subset of HTML used by the components under test.
 * @param {string} html
 * @returns {TinyElement[]}
 */
function parseHTML(html) {
  const root = new TinyElement('div');
  const stack = [root];
  const tagRegex = /<\/([a-zA-Z0-9-]+)\s*>|<([a-zA-Z0-9-]+)((?:\s+[^>]*?)?)(\/?)>/g;
  let lastIndex = 0;
  let match;
  while ((match = tagRegex.exec(html)) !== null) {
    const text = html.slice(lastIndex, match.index);
    if (text.trim()) stack[stack.length - 1]._textContent += text;
    lastIndex = tagRegex.lastIndex;
    if (match[1]) {
      if (stack.length > 1) stack.pop();
    } else {
      const el = new TinyElement(match[2]);
      const attrs = match[3] || '';
      const attrRegex = /([\w-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
      let attr;
      while ((attr = attrRegex.exec(attrs)) !== null) {
        el.setAttribute(attr[1], attr[2] ?? attr[3] ?? attr[4] ?? '');
      }
      stack[stack.length - 1].appendChild(el);
      if (!match[4]) stack.push(el);
    }
  }
  return root.childNodes;
}

/**
 * Installs a minimal `document`/`window` on the global scope.
 * @returns {{ document: any, window: any }}
 */
export function installDOM() {
  const document = {
    body: new TinyElement('body'),
    head: new TinyElement('head'),
    documentElement: new TinyElement('html'),
    activeElement: null,
    createElement: (/** @type {string} */ tag) => new TinyElement(tag),
    createTextNode: (/** @type {string} */ text) => {
      const node = new TinyElement('#text');
      node.textContent = text;
      return node;
    },
    getElementById: (/** @type {string} */ id) => document.body.querySelector(`#${id}`),
    querySelector: (/** @type {string} */ selector) => document.body.querySelector(selector),
    querySelectorAll: (/** @type {string} */ selector) => document.body.querySelectorAll(selector),
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
  };

  const window = {
    document,
    location: { href: 'http://localhost/', origin: 'http://localhost', search: '' },
    navigator: { userAgent: 'node' },
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => true,
    getComputedStyle: () => ({}),
    requestAnimationFrame: (/** @type {Function} */ cb) => setTimeout(() => cb(Date.now()), 0),
    cancelAnimationFrame: (/** @type {any} */ id) => clearTimeout(id),
    matchMedia: () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  };

  globalThis.document = document;
  globalThis.window = Object.assign(globalThis.window ?? {}, window);
  globalThis.HTMLElement = TinyElement;
  globalThis.Element = TinyElement;
  globalThis.HTMLDivElement = TinyElement;
  globalThis.HTMLInputElement = TinyElement;
  globalThis.HTMLTextAreaElement = TinyElement;
  globalThis.Node = TinyElement;
  globalThis.requestAnimationFrame = window.requestAnimationFrame;
  globalThis.cancelAnimationFrame = window.cancelAnimationFrame;

  return { document, window };
}

export default { TinyElement, TinyClassList, TinyStyle, installDOM };
