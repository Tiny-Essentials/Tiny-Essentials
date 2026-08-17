import { diffArrayList } from '../../basics/array.mjs';
import { diffObjList } from '../../basics/text.mjs';
import * as TinyCollision from '../../basics/collision.mjs';
import TinyElementObserver from './TinyElementObserver.mjs';

// TITLE: Introduction
const {
  areElsColliding,
  areElsPerfColliding,
  areElsCollTop,
  areElsCollBottom,
  areElsCollLeft,
  areElsCollRight,
} = TinyCollision;

/**
 * Represents a TinyHtml instance with any constructor element values.
 * @typedef {TinyHtml<ConstructorElValues>} TinyHtmlAny
 */

/**
 * Represents the valid values that can be appended to a TinyNode.
 *
 * @typedef {TinyNode | TinyNode[] | string | false | null | undefined} AppendCheckerTemplate
 */

/**
 * Represents the the collection of values that can be appended to a TinyNode.
 *
 * @typedef {AppendCheckerTemplate|AppendCheckerTemplate[]} AppendCheckerValues
 */

/**
 * Callback function used for hover events.
 * @callback HoverEventCallback
 * @param {MouseEvent} ev - The mouse event triggered on enter or leave.
 * @returns {void} Returns nothing.
 */

/**
 * Represents a collection of active style-based animations.
 *
 * Each HTMLElement is associated with an array of its currently running
 * `Animation` objects (from the Web Animations API).
 *
 * @typedef {Map<HTMLElement, Animation|null>} StyleFxResult
 */

/**
 * Represents a collection of animation keyframe data mapped by CSS property.
 *
 * - The **key** is the CSS property name (e.g. `"height"`, `"opacity"`).
 * - The **value** is an array of values representing the start and end
 *   states of the property during the animation.
 *
 * @typedef {Record<string, (string|number)[]>} AnimationSfxData
 */

/**
 * Function signature for style effects repeat detectors.
 *
 * @typedef {(effects: AnimationSfxData) => boolean} StyleEffectsRdFn
 */

/**
 * Function signature for style effect property handlers.
 *
 * @typedef {(
 *   el: HTMLElement,
 *   keyframes: AnimationSfxData,
 *   prop: string,
 *   style: CSSStyleDeclaration
 * ) => void} StyleEffectsFn
 */

/**
 * A collection of style effect property handlers.
 *
 * @typedef {Record<string, StyleEffectsFn>} StyleEffectsProps
 */

/**
 * Callback invoked on each animation frame with the current scroll position,
 * normalized animation time (`0` to `1`), and a completion flag.
 *
 * @typedef {(progress: { x: number, y: number, isComplete: boolean, time: number }) => void} OnScrollAnimation
 */

/**
 * A list of supported easing function names for smooth animations.
 *
 * @typedef {'linear' | 'easeInQuad' | 'easeOutQuad' | 'easeInOutQuad' | 'easeInCubic' | 'easeOutCubic' | 'easeInOutCubic'} Easings
 */

/**
 * Represents a raw Node element or an instance of TinyHtml.
 * This type is used to abstract interactions with both plain elements
 * and wrapped elements via the TinyHtml class.
 *
 * @typedef {Node|TinyHtmlAny|null} TinyNode
 */

/**
 * Represents a raw DOM element or an instance of TinyHtml.
 * This type is used to abstract interactions with both plain elements
 * and wrapped elements via the TinyHtml class.
 *
 * @typedef {Element|TinyHtmlAny} TinyElement
 */

/**
 * Represents a raw DOM html element or an instance of TinyHtml.
 * This type is used to abstract interactions with both plain elements
 * and wrapped elements via the TinyHtml class.
 *
 * @typedef {HTMLElement|TinyHtmlAny} TinyHtmlElement
 */

/**
 * Represents a raw DOM event target element or an instance of TinyHtml.
 * This type is used to abstract interactions with both plain elements
 * and wrapped elements via the TinyHtml class.
 *
 * @typedef {EventTarget|TinyHtmlAny} TinyEventTarget
 */

/**
 * Represents a raw DOM input element or an instance of TinyHtml.
 * This type is used to abstract interactions with both plain elements
 * and wrapped elements via the TinyHtml class.
 *
 * @typedef {InputElement|TinyHtmlAny} TinyInputElement
 */

/**
 * Represents a raw DOM element/window or an instance of TinyHtml.
 * This type is used to abstract interactions with both plain elements
 * and wrapped elements via the TinyHtml class.
 *
 * @typedef {ElementAndWindow|TinyHtmlAny} TinyElementAndWindow
 */

/**
 * Represents a value that can be either a DOM Element or the global Window object.
 * Useful for functions that operate generically on scrollable or measurable targets.
 *
 * @typedef {Element|Window} ElementAndWindow
 */

/**
 * Represents a raw DOM element/window/document or an instance of TinyHtml.
 * This type is used to abstract interactions with both plain elements
 * and wrapped elements via the TinyHtml class.
 *
 * @typedef {ElementAndWinAndDoc|TinyHtmlAny} TinyElementAndWinAndDoc
 */

/**
 * Represents a value that can be either a DOM Element, or the global Window object, or the document object.
 * Useful for functions that operate generically on scrollable or measurable targets.
 *
 * @typedef {Element|Window|Document} ElementAndWinAndDoc
 */

/**
 * Represents a raw DOM element with document or an instance of TinyHtml.
 * This type is used to abstract interactions with both plain elements
 * and wrapped elements via the TinyHtml class.
 *
 * @typedef {ElementWithDoc|TinyHtmlAny} TinyElementWithDoc
 */

/**
 * Represents a value that can be either a DOM Element, or the document object.
 * Useful for functions that operate generically on measurable targets.
 *
 * @typedef {Element|Document} ElementWithDoc
 */

/**
 * A parameter type used for filtering or matching elements.
 * It can be:
 * - A string (CSS selector),
 * - A raw DOM element,
 * - An array of raw DOM elements,
 * - A filtering function that receives an index and element,
 *   and returns true if it matches.
 *
 * @typedef {string|Element|Element[]|((index: number, el: Element) => boolean)} WinnowRequest
 */

/**
 * Elements accepted as constructor values for TinyHtml.
 * These include common DOM elements and root containers.
 *
 * @typedef {Window|Element|Document|Text} ConstructorElValues
 */

/**
 * Options passed to `addEventListener` or `removeEventListener`.
 * Can be a boolean or an object of type `AddEventListenerOptions`.
 *
 * @typedef {boolean|AddEventListenerOptions} EventRegistryOptions
 */

/**
 * Structure describing a registered event callback and its options.
 *
 * @typedef {Object} EventRegistryItem
 * @property {EventListenerOrEventListenerObject|null} handler - The function to be executed when the event is triggered.
 * @property {EventRegistryOptions} [options] - Optional configuration passed to the listener.
 */

/**
 * Maps event names (e.g., `"click"`, `"keydown"`) to a list of registered handlers and options.
 *
 * @typedef {Record<string, EventRegistryItem[]>} EventRegistryList
 */

/**
 * WeakMap storing all event listeners per element.
 * Each element has a registry mapping event names to their handler lists.
 *
 * @type {WeakMap<ConstructorElValues|EventTarget, EventRegistryList>}
 */
const __eventRegistry = new WeakMap();

/**
 * A key-value store associated with a specific DOM element.
 * Keys are strings, and values can be of any type.
 *
 * @typedef {Record<string, *>} ElementDataStore
 */

/**
 * WeakMap to hold private data for elements
 *
 * @type {WeakMap<ConstructorElValues, ElementDataStore>}
 */
const __elementDataMap = new WeakMap();

/**
 * Internal storage for animation-related data, associated with elements.
 * Used to remember original dimensions (height/width) and other properties
 * so that animations like `slideUp` and `slideDown` can restore or continue
 * smoothly, mimicking jQuery's behavior.
 *
 * Each element is mapped to a plain object with keys such as `origHeight`,
 * `origWidth`, etc.
 *
 * @type {WeakMap<HTMLElement, Record<string, string|number>>}
 */
const __elementAnimateData = new WeakMap();

/**
 * Stores the currently active animation for each element,
 * allowing cancellation or replacement of ongoing animations.
 *
 * @type {WeakMap<HTMLElement, { animation: Animation, id: string }>}
 */
const __elementCurrentAnimation = new WeakMap();

/**
 * Mapping of animation shortcuts to their effect definitions.
 * Similar to jQuery's predefined effects (slideDown, fadeIn, etc.).
 *
 * @typedef {Record<string, string|(string|number)[]>} StyleEffects
 */

/**
 * Stores directional collision locks separately.
 * Each direction has its own WeakMap to allow independent locking.
 *
 * @type {{
 *   top: WeakMap<Element, true>,
 *   bottom: WeakMap<Element, true>,
 *   left: WeakMap<Element, true>,
 *   right: WeakMap<Element, true>
 * }}
 */
const __elemCollision = {
  top: new WeakMap(),
  bottom: new WeakMap(),
  left: new WeakMap(),
  right: new WeakMap(),
};

/**
 * Possible directions from which a collision was detected and locked.
 *
 * @typedef {'top'|'bottom'|'left'|'right'} CollisionDirLock
 */

/**
 * @typedef {Object} HtmlElBoxSides
 * @property {number} x - Total horizontal size (left + right)
 * @property {number} y - Total vertical size (top + bottom)
 * @property {number} left
 * @property {number} right
 * @property {number} top
 * @property {number} bottom
 */

/**
 * @typedef {string | number | Date | boolean | null} SetValueBase - Primitive types accepted as input values.
 */

/**
 * @typedef {'string' | 'date' | 'number'} GetValueTypes
 * Types of value extractors supported by TinyHtml._valTypes.
 */

/**
 * @typedef {SetValueBase|SetValueBase[]} SetValueList - A single value or an array of values to be assigned to the input element.
 */

/**
 * A list of HTML form elements that can have a `.value` property used by TinyHtml.
 * Includes common input types used in forms.
 *
 * @typedef {HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement|HTMLOptionElement} InputElement
 */

/**
 * Represents a parsed HTML element in JSON-like array form.
 *
 * @typedef {[
 *   tagName: string, // The tag name of the element (e.g., 'div', 'img')
 *   attributes: Record<string, string>, // All element attributes as key-value pairs
 *   ...children: (string | HtmlParsed)[] // Text or nested elements
 * ]} HtmlParsed
 */

// TITLE: Class Intro

/**
 * Represents all possible inputs accepted by the TinyHtml constructor.
 * Can be a single element, an array of elements, array-like DOM collections,
 * or a CSS selector string.
 *
 * @typedef {(
 *   ConstructorElValues |
 *   ConstructorElValues[] |
 *   NodeListOf<Element> |
 *   HTMLCollectionOf<Element> |
 *   NodeListOf<HTMLElement> |
 *   string
 * )} TinyHtmlConstructor
 */

/**
 * TinyHtml is a utility class that provides static and instance-level methods
 * for precise dimension and position computations on HTML elements.
 * It mimics some jQuery functionalities while using native browser APIs.
 *
 * Inspired by the jQuery project's open source implementations of element dimension
 * and offset utilities. This class serves as a lightweight alternative using modern DOM APIs.
 *
 * @template {TinyHtmlConstructor} TinyHtmlT
 * @class
 */
class TinyHtml {
  /** @typedef {import('../../basics/collision.mjs').ObjRect} ObjRect */

  static Utils = { ...TinyCollision };

  /** @type {number} */
  static #version = 1;

  /** @returns {number} */
  static get version() {
    return this.#version;
  }

  /**
   * Controls whether TinyHtml emits detailed debug output to the console.
   * When enabled, helper methods print structured diagnostics for easier troubleshooting.
   * @type {boolean}
   */
  static #elemDebug = false;

  /**
   * Gets whether debug output is enabled.
   * @returns {boolean} True if debug output is enabled; otherwise, false.
   */
  static get elemDebug() {
    return TinyHtml.#elemDebug;
  }

  /**
   * Enables or disables debug output.
   * @param {boolean} value True to enable debug output; false to disable.
   * @throws {TypeError} Thrown if the provided value is not a boolean.
   */
  static set elemDebug(value) {
    if (typeof value !== 'boolean') throw new TypeError('Expected a boolean value for elemDebug');
    TinyHtml.#elemDebug = value;
  }

  /**
   * Logs a standardized debug error for element validation, including a console.table
   * with the involved elements. Use this when an element argument is invalid, unexpected,
   * or fails a guard/validation.
   *
   * The output includes:
   *  - A concise error header
   *  - A stack trace (when supported)
   *  - A table of elements (index, typeof, constructor, summary, value)
   *  - The specific problematic element, if provided
   *
   * @param {(ConstructorElValues | EventTarget | TinyElement | null)[]} elems
   *        A list of elements participating in the operation (may include nulls).
   * @param {ConstructorElValues | EventTarget | TinyElement | null} [elem]
   *        The specific element that triggered the error, if available.
   * @returns {void}
   */
  static _debugElemError(elems, elem) {
    if (!TinyHtml.#elemDebug) return;
    const header = '[TinyHtml Debug] Element validation error';

    console.groupCollapsed(`${header}${elem ? ' — details below' : ''}`);
    console.error(header);

    // Stack trace for call-site visibility
    if (typeof Error !== 'undefined' && typeof Error.captureStackTrace === 'function') {
      const err = new Error(header);
      Error.captureStackTrace(err, TinyHtml._debugElemError);
      console.error(err.stack);
    } else {
      console.trace(header);
    }

    // Tabular overview of provided elements
    if (Array.isArray(elems)) {
      const rows = elems.map((el, index) => {
        const typeOf = el === null ? 'null' : typeof el;
        const ctor = el?.constructor?.name ?? (el === null ? 'null' : 'primitive');
        const isDomEl = typeof Element !== 'undefined' && el instanceof Element;
        const summary = isDomEl
          ? `${el.tagName?.toLowerCase?.() ?? 'element'}#${el.id || ''}.${String(el.className || '')
              .trim()
              .replace(/\s+/g, '.')}`
          : el && typeof el === 'object' && 'nodeType' in el
            ? `nodeType:${/** @type {any} */ (el).nodeType}`
            : '';
        return { index, typeOf, constructor: ctor, summary, value: el };
      });
      console.table(rows);
    } else {
      console.warn('[TinyHtml Debug] "elems" is not an array:', elems);
    }

    // Highlight the specific problematic element, if any
    if (arguments.length > 1) {
      console.error('[TinyHtml Debug] Problematic element:', elem);
      if (elem && typeof elem === 'object') console.dir(elem);
    }

    console.groupEnd();
  }

  /**
   * Parse inline styles into an object.
   * @param {string} styleText
   * @returns {Record<string,string>}
   */
  static parseStyle(styleText) {
    /** @type {Record<string,string>}} */
    const styles = {};
    styleText.split(';').forEach((rule) => {
      const [prop, value] = rule.split(':').map((s) => s && s.trim());
      if (prop && value) {
        styles[prop] = value;
      }
    });
    return styles;
  }

  /////////////////////////////////////////////////////////////////////

  static #tinyObserver =
    typeof window !== 'undefined' && typeof window.document !== 'undefined'
      ? new TinyElementObserver(window.document.documentElement, {
          initDetectors: [
            // Style Detector
            [
              'tinyStyleEvent',
              (mutation) => {
                if (
                  mutation.type !== 'attributes' ||
                  mutation.attributeName !== 'style' ||
                  !(mutation.target instanceof HTMLElement)
                )
                  return;
                const oldVal = mutation.oldValue || '';
                const newVal = mutation.target.getAttribute('style') || '';

                const oldStyles = TinyHtml.parseStyle(oldVal);
                const newStyles = TinyHtml.parseStyle(newVal);

                const changes = diffObjList(oldStyles, newStyles);

                if (
                  Object.keys(changes.added).length ||
                  Object.keys(changes.removed).length ||
                  Object.keys(changes.modified).length
                ) {
                  mutation.target.dispatchEvent(
                    new CustomEvent('tinyhtml.stylechanged', {
                      detail: changes,
                    }),
                  );
                }
              },
            ],

            // Class Detector
            [
              'tinyClassEvent',
              (mutation) => {
                if (
                  mutation.type !== 'attributes' ||
                  mutation.attributeName !== 'class' ||
                  !(mutation.target instanceof HTMLElement)
                )
                  return;
                const oldVal = mutation.oldValue || '';
                const newVal = mutation.target.className || '';

                const oldClasses = oldVal.split(/\s+/).filter(Boolean);
                const newClasses = newVal.split(/\s+/).filter(Boolean);

                const changes = diffArrayList(oldClasses, newClasses);

                if (changes.added.length || changes.removed.length) {
                  mutation.target.dispatchEvent(
                    new CustomEvent('tinyhtml.classchanged', {
                      detail: changes,
                    }),
                  );
                }
              },
            ],
          ],
          initCfg: {
            attributeOldValue: true,
            attributes: true,
            subtree: true,
            attributeFilter: ['style', 'class'],
          },
        })
      : undefined;

  static get tinyObserver() {
    return TinyHtml.#tinyObserver;
  }

  ///////////////////////////////////////////////////////////////////

  // TITLE: Fetch Html List

  /**
   * Fetches an HTML file from the given URL, parses it to JSON.
   *
   * @param {string | URL | globalThis.Request} url - The URL of the HTML file.
   * @param {RequestInit} [ops] - Optional fetch configuration (e.g., method, headers, cache, etc).
   * @returns {Promise<HtmlParsed[]>} A promise that resolves with the parsed JSON representation of the HTML structure.
   */
  static async fetchHtmlFile(url, ops = { method: 'GET' }) {
    const res = await fetch(url, ops);

    const contentType = res.headers.get('Content-Type') || '';
    if (!res.ok) throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);

    // Only accept HTML responses
    if (!contentType.includes('text/html')) {
      throw new Error(`Invalid content type: ${contentType} (expected text/html)`);
    }

    const html = await res.text();
    return TinyHtml.htmlToJson(html);
  }

  /**
   * Fetches an HTML file from the given URL, parses it to JSON, then converts it to DOM nodes.
   *
   * @param {string} url - The URL of the HTML file.
   * @param {RequestInit} [ops] - Optional fetch configuration (e.g., method, headers, cache, etc).
   * @returns {Promise<(HTMLElement|Text)[]>} A promise that resolves with the DOM nodes.
   */
  static async fetchHtmlNodes(url, ops) {
    const json = await TinyHtml.fetchHtmlFile(url, ops);
    return TinyHtml.jsonToNodes(json);
  }

  /**
   * Fetches an HTML file from the given URL, parses it to JSON, then converts it to TinyHtml instances.
   *
   * @param {string} url - The URL of the HTML file.
   * @param {RequestInit} [ops] - Optional fetch configuration (e.g., method, headers, cache, etc).
   * Returns the promise that resolves with the TinyHtml instances.
   */
  static async fetchHtmlTinyElems(url, ops) {
    const nodes = await TinyHtml.fetchHtmlNodes(url, ops);
    return TinyHtml.toTinyElm(nodes);
  }

  // TITLE: Fetch Template List

  /**
   * Converts the content of a <template> to an array of HtmlParsed.
   *
   * @param {HTMLTemplateElement} nodes
   * @returns {HtmlParsed[]}
   */
  static templateToJson(nodes) {
    return TinyHtml.htmlToJson(
      [...nodes.content.childNodes]
        .map((node) =>
          node instanceof Element ? node.getHTML() : node instanceof Text ? node.textContent : '',
        )
        .join(''),
    );
  }

  /**
   * Converts the content of a <template> to real DOM nodes.
   *
   * @param {HTMLTemplateElement} nodes
   * @returns {(Element|Text)[]}
   */
  static templateToNodes(nodes) {
    /** @type {(Element|Text)[]} */
    const result = [];
    [...nodes.content.cloneNode(true).childNodes].map((node) => {
      if (!(node instanceof Element) && !(node instanceof Text) && !(node instanceof Comment))
        throw new Error(
          `Expected only Element nodes in <template>, but found: ${node.constructor.name}`,
        );
      if (!(node instanceof Comment)) result.push(node);
    });
    return result;
  }

  /**
   * Converts the content of a <template> to an array of TinyHtml elements.
   *
   * @param {HTMLTemplateElement} nodes
   * @returns {TinyHtml<Element|Text>[]}
   */
  static templateToTinyElems(nodes) {
    return TinyHtml.toTinyElm(TinyHtml.templateToNodes(nodes));
  }

  // TITLE: Fetch Json List

  /**
   * Parses a full HTML string into a JSON-like structure.
   *
   * @param {string} htmlString - Full HTML markup as a string.
   * @returns {HtmlParsed[]} An array of parsed HTML elements in structured format.
   */
  static htmlToJson(htmlString) {
    const container = document.createElement('div');
    container.innerHTML = htmlString.trim();

    const result = [];

    /**
     * @param {Node} el
     * @returns {*}
     */
    const parseElement = (el) => {
      if (el instanceof Comment) return null;
      if (el instanceof Text) {
        const text = el.textContent?.trim();
        return text ? text : null;
      }

      if (!(el instanceof Element)) return null;
      const tag = el.tagName.toLowerCase();

      /** @type {Record<string, string>} */
      const props = {};
      for (const attr of el.attributes) {
        props[TinyHtml.getPropName(attr.name)] = attr.value;
      }

      const children = Array.from(el.childNodes).map(parseElement).filter(Boolean);
      return children.length > 0 ? [tag, props, ...children] : [tag, props];
    };

    for (const child of container.childNodes) {
      const parsed = parseElement(child);
      if (parsed) result.push(parsed);
    }

    container.innerHTML = '';
    return result;
  }

  /**
   * Converts a JSON-like HTML structure back to DOM Elements.
   *
   * @param {HtmlParsed[]} jsonArray - Parsed JSON format of HTML.
   * @returns {(HTMLElement|Text)[]} List of DOM nodes.
   */
  static jsonToNodes(jsonArray) {
    /**
     * @param {HtmlParsed|string} nodeData
     * @returns {HTMLElement|Text}
     */
    const createElement = (nodeData) => {
      if (typeof nodeData === 'string') {
        return document.createTextNode(nodeData);
      }

      if (!Array.isArray(nodeData)) return document.createTextNode('');
      const [tag, props, ...children] = nodeData;
      const el = document.createElement(tag);

      for (const [key, value] of Object.entries(props)) {
        el.setAttribute(TinyHtml.getAttrName(key), value);
      }

      for (const child of children) {
        const childEl = createElement(child);
        if (childEl instanceof Comment) continue;
        el.appendChild(childEl);
      }

      return el;
    };

    return jsonArray.map(createElement).filter((node) => !(node instanceof Comment));
  }

  /**
   * Converts a JSON-like HTML structure back to TinyHtml instances.
   *
   * @param {HtmlParsed[]} jsonArray - Parsed JSON format of HTML.
   * @returns {TinyHtml<HTMLElement | Text>[]} List of TinyHtml instances.
   */
  static jsonToTinyElems(jsonArray) {
    return TinyHtml.toTinyElm(TinyHtml.jsonToNodes(jsonArray));
  }

  // TITLE: Element Creator

  /**
   * Creates a new TinyHtml element from a tag name and optional attributes.
   *
   * You can alias this method for convenience:
   * ```js
   * const createElement = TinyHtml.createFrom;
   * const myDiv = createElement('div', { class: 'box' });
   * ```
   *
   * @param {string} tagName - The HTML tag name (e.g., 'div', 'span', 'button').
   * @param {Record<string, string|number|null>} [attrs] - Optional key-value pairs representing HTML attributes.
   *                                                If the value is `null`, the attribute will still be set with an empty value.
   * @returns {TinyHtml<HTMLElement>} - A new instance of TinyHtml representing the created element.
   * @throws {TypeError} - If `tagName` is not a string, or `attrs` is not a plain object when defined.
   */
  static createFrom(tagName, attrs) {
    if (typeof tagName !== 'string') throw new TypeError('The "tagName" must be a string.');
    if (typeof attrs !== 'undefined' && typeof attrs !== 'object')
      throw new TypeError('The "attrs" must be a object.');
    const elem = TinyHtml.createElement(tagName);
    if (typeof attrs === 'object') {
      for (const attrName in attrs) {
        elem.setAttr(attrName, attrs[attrName]);
      }
    }
    return elem;
  }

  /**
   * Creates a new DOM element with the specified tag name and options, then wraps it in a TinyHtml instance.
   *
   * @param {string} tagName - The tag name of the element to create (e.g., 'div', 'span').
   * @param {ElementCreationOptions} [ops] - Optional settings for creating the element.
   * @returns {TinyHtml<HTMLElement>} A TinyHtml instance wrapping the newly created DOM element.
   * @throws {TypeError} If tagName is not a string or ops is not an object.
   */
  static createElement(tagName, ops) {
    if (typeof tagName !== 'string')
      throw new TypeError(`[TinyHtml] createElement(): The tagName must be a string.`);
    if (typeof ops !== 'undefined' && typeof ops !== 'object')
      throw new TypeError(`[TinyHtml] createElement(): The ops must be a object.`);
    return new TinyHtml(document.createElement(tagName, ops));
  }

  /**
   * Creates a new TinyHtml instance that wraps a DOM TextNode.
   *
   * This method is useful when you want to insert raw text content into the DOM
   * without it being interpreted as HTML. The returned instance behaves like any
   * other TinyHtml element and can be appended or manipulated as needed.
   *
   * @param {string} value - The plain text content to be wrapped in a TextNode.
   * @returns {TinyHtml<Text>} A TinyHtml instance wrapping the newly created DOM TextNode.
   * @throws {TypeError} If the provided value is not a string.
   */
  static createTextNode(value) {
    if (typeof value !== 'string')
      throw new TypeError(`[TinyHtml] createTextNode(): The value must be a string.`);
    return new TinyHtml(document.createTextNode(value));
  }

  /**
   * @deprecated Use the {@link createFromHTML} instead.
   *
   * Creates an HTMLElement or TextNode from an HTML string.
   * Supports both elements and plain text.
   *
   * @param {string} htmlString - The HTML string to convert.
   * @returns {TinyHtml<Element>} - A single HTMLElement or TextNode.
   */
  static createElementFromHTML(htmlString) {
    const template = document.createElement('template');
    htmlString = htmlString.trim();

    // If it's only text (e.g., no "<" tag), return a TextNode
    if (!htmlString.startsWith('<')) {
      return TinyHtml.createTextNode(htmlString);
    }

    template.innerHTML = htmlString;
    if (!(template.content.firstChild instanceof Element))
      throw new Error('The HTML string must contain a valid HTML element.');
    return new TinyHtml(template.content.firstChild);
  }

  /**
   * Creates an HTMLElement or TextNode from an HTML string.
   * Supports both elements and plain text.
   *
   * @param {string} htmlString - The HTML string to convert.
   * @returns {TinyHtml<Element>} - A single HTMLElement or TextNode.
   */
  static createFromHTML(htmlString) {
    const template = document.createElement('template');
    htmlString = htmlString.trim();

    template.innerHTML = htmlString;
    const elems = Array.from(template.content.childNodes);
    if (!elems.every((item) => item instanceof Element || item instanceof Text))
      throw new Error('The HTML string must contain a valid HTML element.');
    return new TinyHtml(elems);
  }

  /**
   * Creates an HTMLElement or TextNode from an HTML string.
   * Supports both elements and plain text.
   *
   * @param {string} htmlString - The HTML string to convert.
   * @returns {TinyHtml<Element>} - A single HTMLElement or TextNode.
   */
  static createFromHtml(htmlString) {
    return TinyHtml.createFromHTML(htmlString);
  }

  ///////////////////////////////////////////////////
  // TITLE: Query Script

  /**
   * Queries the document for the first element matching the CSS selector and wraps it in a TinyHtml instance.
   *
   * @param {string} selector - A valid CSS selector string.
   * @param {Document|Element} elem - Target element.
   * @returns {TinyHtml<Element>|null} A TinyHtml instance wrapping the matched element.
   */
  static query(selector, elem = document) {
    const newEl = elem.querySelector(selector);
    if (!newEl) return null;
    return new TinyHtml(newEl);
  }

  /**
   * Queries the element for the first element matching the CSS selector and wraps it in a TinyHtml instance.
   *
   * @param {string} selector - A valid CSS selector string.
   * @returns {TinyHtml<Element>|null} A TinyHtml instance wrapping the matched element.
   */
  querySelector(selector) {
    return TinyHtml.query(selector, TinyHtml._preElem(this, 'query'));
  }

  /**
   * Queries the document for all elements matching the CSS selector and wraps them in TinyHtml instances.
   *
   * @param {string} selector - A valid CSS selector string.
   * @param {Document|Element} elem - Target element.
   * @returns {TinyHtml<NodeListOf<Element>>} An array of TinyHtml instances wrapping the matched elements.
   */
  static queryAll(selector, elem = document) {
    return new TinyHtml(elem.querySelectorAll(selector));
  }

  /**
   * Queries the element for all elements matching the CSS selector and wraps them in TinyHtml instances.
   *
   * @param {string} selector - A valid CSS selector string.
   * @returns {TinyHtml<NodeListOf<Element>>} An array of TinyHtml instances wrapping the matched elements.
   */
  querySelectorAll(selector) {
    return TinyHtml.queryAll(selector, TinyHtml._preElem(this, 'queryAll'));
  }

  /**
   * Retrieves an element by its ID and wraps it in a TinyHtml instance.
   *
   * @param {string} selector - The ID of the element to retrieve.
   * @returns {TinyHtml<HTMLElement>|null} A TinyHtml instance wrapping the found element.
   */
  static getById(selector) {
    const newEl = document.getElementById(selector);
    if (!newEl) return null;
    return new TinyHtml(newEl);
  }

  /**
   * Retrieves all elements with the specified class name and wraps them in TinyHtml instances.
   *
   * @param {string} selector - The class name to search for.
   * @param {Document|Element} elem - Target element.
   * @returns {TinyHtml<HTMLCollectionOf<Element>>} An array of TinyHtml instances wrapping the found elements.
   */
  static getByClassName(selector, elem = document) {
    return new TinyHtml(elem.getElementsByClassName(selector));
  }

  /**
   * Retrieves all elements with the specified class name and wraps them in TinyHtml instances.
   *
   * @param {string} selector - The class name to search for.
   * @returns {TinyHtml<HTMLCollectionOf<Element>>} An array of TinyHtml instances wrapping the found elements.
   */
  getElementsByClassName(selector) {
    return TinyHtml.getByClassName(selector, TinyHtml._preElem(this, 'getByClassName'));
  }

  /**
   * Retrieves all elements with the specified name attribute and wraps them in TinyHtml instances.
   *
   * @param {string} selector - The name attribute to search for.
   * @returns {TinyHtml<NodeListOf<HTMLElement>>} An array of TinyHtml instances wrapping the found elements.
   */
  static getByName(selector) {
    return new TinyHtml(document.getElementsByName(selector));
  }

  /**
   * Retrieves all elements with the specified local tag name within the given namespace URI,
   * and wraps them in TinyHtml instances.
   *
   * @param {string} localName - The local name (tag) of the elements to search for.
   * @param {string|null} [namespaceURI='http://www.w3.org/1999/xhtml'] - The namespace URI to search within.
   * @param {Document|Element} elem - Target element.
   * @returns {TinyHtml<HTMLCollectionOf<Element>>} An array of TinyHtml instances wrapping the found elements.
   */
  static getByTagNameNS(localName, namespaceURI = 'http://www.w3.org/1999/xhtml', elem = document) {
    return new TinyHtml(elem.getElementsByTagNameNS(namespaceURI, localName));
  }

  /**
   * Retrieves all elements with the specified local tag name within the given namespace URI,
   * and wraps them in TinyHtml instances.
   *
   * @param {string} localName - The local name (tag) of the elements to search for.
   * @param {string|null} [namespaceURI='http://www.w3.org/1999/xhtml'] - The namespace URI to search within.
   * @returns {TinyHtml<HTMLCollectionOf<Element>>} An array of TinyHtml instances wrapping the found elements.
   */
  getElementsByTagNameNS(localName, namespaceURI = 'http://www.w3.org/1999/xhtml') {
    return TinyHtml.getByTagNameNS(
      localName,
      namespaceURI,
      TinyHtml._preElem(this, 'getByTagNameNS'),
    );
  }

  //////////////////////////////////////////////////////////////////

  // TITLE: Element getter

  /**
   * Returns the current targets held by this instance.
   *
   * @returns {ConstructorElValues[]} - The instance's targets element.
   */
  get elements() {
    return [...this.#el];
  }

  /**
   * Iterates over all elements, executing the provided callback on each.
   * @param {(element: TinyHtmlAny, index: number, items: TinyHtmlAny[]) => void} callback - Function invoked for each element.
   * @returns {this} The current instance for chaining.
   */
  forEach(callback) {
    const elems = this.elements.map((el, index) => this.extract(index));
    for (const index in elems) callback(elems[index], Number(index), elems);
    return this;
  }

  /**
   * Returns the current target held by this instance.
   *
   * @param {number} index - The index of the element to retrieve.
   * @returns {ConstructorElValues} - The instance's target element.
   */
  get(index) {
    if (typeof index !== 'number') throw new TypeError('The index must be a number.');
    if (!this.#el[index]) throw new Error(`No element found at index ${index}.`);
    return this.#el[index];
  }

  /**
   * Extracts a single DOM element from the internal list at the specified index.
   *
   * @param {number} index - The index of the element to extract.
   * @returns {TinyHtmlAny} A new TinyHtml instance wrapping the extracted element.
   */
  extract(index) {
    if (typeof index !== 'number') throw new TypeError('The index must be a number.');
    if (!this.#el[index]) throw new Error(`Cannot extract: no element exists at index ${index}.`);
    return new TinyHtml(this.#el[index]);
  }

  /**
   * Checks whether the element exists at the given index.
   *
   * @param {number} index - The index to check.
   * @returns {boolean} - True if the element exists; otherwise, false.
   */
  exists(index) {
    if (typeof index !== 'number') throw new TypeError('The index must be a number.');
    if (!this.#el[index]) return false;
    return true;
  }

  ////////////////////////////////////////////////

  // TITLE: Element Getter (Private) (Pt1)

  /**
   * Returns the current Element held by this instance.
   *
   * @param {string} where - The method name or context calling this.
   * @param {number} index - The index of the element to retrieve.
   * @returns {ConstructorElValues} - The instance's element.
   */
  _getElement(where, index) {
    if (
      !(this.#el[index] instanceof Element) &&
      !(this.#el[index] instanceof Window) &&
      !(this.#el[index] instanceof Document) &&
      !(this.#el[index] instanceof Text)
    ) {
      TinyHtml._debugElemError([...this.#el], this.#el[index]);
      throw new Error(`[TinyHtml] Invalid Element in ${where}().`);
    }
    return this.#el[index];
  }

  /**
   * Returns the current Elements held by this instance.
   *
   * @param {string} where - The method name or context calling this.
   * @returns {ConstructorElValues[]} - The instance's elements.
   */
  _getElements(where) {
    if (
      !this.#el.every(
        (el) =>
          el instanceof Element ||
          el instanceof Window ||
          el instanceof Document ||
          el instanceof Text,
      )
    ) {
      TinyHtml._debugElemError([...this.#el]);
      throw new Error(`[TinyHtml] Invalid Element in ${where}().`);
    }
    return [...this.#el];
  }

  //////////////////////////////////////////////////////

  // TITLE: Element Getter (Private) (Pt2)

  /**
   * Prepares and validates multiple elements against allowed types.
   *
   * @param {TinyElement | EventTarget | null | (TinyElement | EventTarget | null)[]} elems - The input elements to validate.
   * @param {string} where - The method name or context calling this.
   * @param {any[]} TheTinyElements - The list of allowed constructors (e.g., Element, Document).
   * @param {string[]} elemName - The list of expected element names for error reporting.
   * @returns {any[]} - A flat array of validated elements.
   * @throws {Error} - If any element is not an instance of one of the allowed types.
   */
  static _preElemsTemplate(elems, where, TheTinyElements, elemName) {
    /** @param {(TinyElement|EventTarget|null)[]} item */
    const checkElement = (item) => {
      /** @type {any[]} */
      const results = [];
      item.map((elem) =>
        (elem instanceof TinyHtml ? elem._getElements(where) : [elem]).map((result) => {
          let allowed = false;
          for (const TheTinyElement of TheTinyElements) {
            if (result instanceof TheTinyElement) {
              allowed = true;
              break;
            }
          }
          if (!allowed) {
            TinyHtml._debugElemError([...item], result);
            throw new Error(
              `[TinyHtml] Invalid element of the list "${elemName.join(',')}" in ${where}().`,
            );
          }
          results.push(result);
          return result;
        }),
      );
      return results;
    };
    if (!Array.isArray(elems)) return checkElement([elems]);
    return checkElement(elems);
  }

  /**
   * Prepares and validates multiple elements against allowed types.
   *
   * @param {string} where - The method name or context calling this.
   * @param {any[]} TheTinyElements - The list of allowed constructors (e.g., Element, Document).
   * @param {string[]} elemName - The list of expected element names for error reporting.
   * @returns {any[]} - A flat array of validated elements.
   * @throws {Error} - If any element is not an instance of one of the allowed types.
   */
  _preElemsTemplate(where, TheTinyElements, elemName) {
    return TinyHtml._preElemsTemplate(this, where, TheTinyElements, elemName);
  }

  /**
   * Prepares and validates a single element against allowed types.
   *
   * @param {TinyElement | EventTarget | null | (TinyElement | EventTarget | null)[]} elems - The input element or list to validate.
   * @param {string} where - The method name or context calling this.
   * @param {any[]} TheTinyElements - The list of allowed constructors (e.g., Element, Document).
   * @param {string[]} elemName - The list of expected element names for error reporting.
   * @param {boolean} [canNull=false] - Whether `null` is allowed as a valid value.
   * @returns {any} - The validated element or `null` if allowed.
   * @throws {Error} - If the element is not valid or if multiple elements are provided.
   */
  static _preElemTemplate(elems, where, TheTinyElements, elemName, canNull = false) {
    /** @param {(TinyElement|EventTarget|null)[]} item */
    const checkElement = (item) => {
      const elem = item[0];
      const result = elem instanceof TinyHtml ? elem._getElements(where) : [elem];
      if (result.length > 1) {
        TinyHtml._debugElemError([...item]);
        throw new Error(
          `[TinyHtml] Invalid element amount in ${where}() (Received ${result.length}/1).`,
        );
      }

      let allowed = false;
      for (const TheTinyElement of TheTinyElements) {
        if (result[0] instanceof TheTinyElement) {
          allowed = true;
          break;
        }
      }

      if (canNull && (result[0] === null || typeof result[0] === 'undefined')) {
        result[0] = null;
        allowed = true;
      }

      if (!allowed) {
        TinyHtml._debugElemError([...item], result[0]);
        throw new Error(
          `[TinyHtml] Invalid element of the list "${elemName.join(',')}" in ${where}().`,
        );
      }
      return result[0];
    };
    if (!Array.isArray(elems)) return checkElement([elems]);
    if (elems.length > 1) {
      TinyHtml._debugElemError([...elems]);
      throw new Error(
        `[TinyHtml] Invalid element amount in ${where}() (Received ${elems.length}/1).`,
      );
    }
    return checkElement(elems);
  }

  /**
   * Prepares and validates a single element against allowed types.
   *
   * @param {string} where - The method name or context calling this.
   * @param {any[]} TheTinyElements - The list of allowed constructors (e.g., Element, Document).
   * @param {string[]} elemName - The list of expected element names for error reporting.
   * @param {boolean} [canNull=false] - Whether `null` is allowed as a valid value.
   * @returns {any} - The validated element or `null` if allowed.
   * @throws {Error} - If the element is not valid or if multiple elements are provided.
   */
  _preElemTemplate(where, TheTinyElements, elemName, canNull = false) {
    return TinyHtml._preElemTemplate(this, where, TheTinyElements, elemName, canNull);
  }

  /**
   * Ensures the input is returned as an array.
   * Useful to normalize operations across multiple or single elements.
   *
   * @param {TinyElement|TinyElement[]} elems - A single element or array of elements.
   * @param {string} where - The method or context name where validation is being called.
   * @returns {Element[]} - Always returns an array of elements.
   */
  static _preElems(elems, where) {
    return TinyHtml._preElemsTemplate(elems, where, [Element], ['Element']);
  }

  /**
   * Ensures the input is returned as an array.
   * Useful to normalize operations across multiple or single elements.
   *
   * @param {string} where - The method or context name where validation is being called.
   * @returns {Element[]} - Always returns an array of elements.
   */
  _preElems(where) {
    return TinyHtml._preElems(this, where);
  }

  /**
   * Ensures the input is returned as an single element.
   * Useful to normalize operations across multiple or single elements.
   *
   * @param {TinyElement|TinyElement[]} elems - A single element or array of elements.
   * @param {string} where - The method or context name where validation is being called.
   * @returns {Element} - Always returns an single element.
   */
  static _preElem(elems, where) {
    return TinyHtml._preElemTemplate(elems, where, [Element], ['Element']);
  }

  /**
   * Ensures the input is returned as an single element.
   * Useful to normalize operations across multiple or single elements.
   *
   * @param {string} where - The method or context name where validation is being called.
   * @returns {Element} - Always returns an single element.
   */
  _preElem(where) {
    return TinyHtml._preElem(this, where);
  }

  /**
   * Ensures the input is returned as an array.
   * Useful to normalize operations across multiple or single nodes.
   *
   * @param {TinyNode|TinyNode[]} elems - A single node or array of nodes.
   * @param {string} where - The method or context name where validation is being called.
   * @returns {Node[]} - Always returns an array of nodes.
   */
  static _preNodeElems(elems, where) {
    return TinyHtml._preElemsTemplate(elems, where, [Node], ['Node']);
  }

  /**
   * Ensures the input is returned as an array.
   * Useful to normalize operations across multiple or single nodes.
   *
   * @param {string} where - The method or context name where validation is being called.
   * @returns {Node[]} - Always returns an array of nodes.
   */
  _preNodeElems(where) {
    return TinyHtml._preNodeElems(this, where);
  }

  /**
   * Ensures the input is returned as an single node.
   * Useful to normalize operations across multiple or single nodes.
   *
   * @param {TinyNode|TinyNode[]} elems - A single node or array of nodes.
   * @param {string} where - The method or context name where validation is being called.
   * @returns {Node} - Always returns an single node.
   */
  static _preNodeElem(elems, where) {
    return TinyHtml._preElemTemplate(elems, where, [Node], ['Node']);
  }

  /**
   * Ensures the input is returned as an single node.
   * Useful to normalize operations across multiple or single nodes.
   *
   * @param {string} where - The method or context name where validation is being called.
   * @returns {Node} - Always returns an single node.
   */
  _preNodeElem(where) {
    return TinyHtml._preNodeElem(this, where);
  }

  /**
   * Ensures the input is returned as an single node.
   * Useful to normalize operations across multiple or single nodes.
   *
   * @param {TinyNode|TinyNode[]} elems - A single node or array of nodes.
   * @param {string} where - The method or context name where validation is being called.
   * @returns {Node|null} - Always returns an single node or null.
   */
  static _preNodeElemWithNull(elems, where) {
    return TinyHtml._preElemTemplate(elems, where, [Node], ['Node'], true);
  }

  /**
   * Ensures the input is returned as an single node.
   * Useful to normalize operations across multiple or single nodes.
   *
   * @param {string} where - The method or context name where validation is being called.
   * @returns {Node|null} - Always returns an single node or null.
   */
  _preNodeElemWithNull(where) {
    return TinyHtml._preNodeElemWithNull(this, where);
  }

  /**
   * Ensures the input is returned as an array.
   * Useful to normalize operations across multiple or single html elements.
   *
   * @param {TinyElement|TinyElement[]} elems - A single html element or array of html elements.
   * @param {string} where - The method or context name where validation is being called.
   * @returns {HTMLElement[]} - Always returns an array of html elements.
   */
  static _preHtmlElems(elems, where) {
    return TinyHtml._preElemsTemplate(elems, where, [HTMLElement], ['HTMLElement']);
  }

  /**
   * Ensures the input is returned as an array.
   * Useful to normalize operations across multiple or single html elements.
   *
   * @param {string} where - The method or context name where validation is being called.
   * @returns {HTMLElement[]} - Always returns an array of html elements.
   */
  _preHtmlElems(where) {
    return TinyHtml._preHtmlElems(this, where);
  }

  /**
   * Ensures the input is returned as an single html element.
   * Useful to normalize operations across multiple or single html elements.
   *
   * @param {TinyElement|TinyElement[]} elems - A single html element or array of html elements.
   * @param {string} where - The method or context name where validation is being called.
   * @returns {HTMLElement} - Always returns an single html element.
   */
  static _preHtmlElem(elems, where) {
    return TinyHtml._preElemTemplate(elems, where, [HTMLElement], ['HTMLElement']);
  }

  /**
   * Ensures the input is returned as an single html element.
   * Useful to normalize operations across multiple or single html elements.
   *
   * @param {string} where - The method or context name where validation is being called.
   * @returns {HTMLElement} - Always returns an single html element.
   */
  _preHtmlElem(where) {
    return TinyHtml._preHtmlElem(this, where);
  }

  /**
   * Ensures the input is returned as an array.
   * Useful to normalize operations across multiple or single event target elements.
   *
   * @param {TinyInputElement|TinyInputElement[]} elems - A single event target element or array of html elements.
   * @param {string} where - The method or context name where validation is being called.
   * @returns {InputElement[]} - Always returns an array of event target elements.
   */
  static _preInputElems(elems, where) {
    return TinyHtml._preElemsTemplate(
      elems,
      where,
      [HTMLInputElement, HTMLSelectElement, HTMLTextAreaElement, HTMLOptionElement],
      ['HTMLInputElement', 'HTMLSelectElement', 'HTMLTextAreaElement', 'HTMLOptionElement'],
    );
  }

  /**
   * Ensures the input is returned as an array.
   * Useful to normalize operations across multiple or single event target elements.
   *
   * @param {string} where - The method or context name where validation is being called.
   * @returns {InputElement[]} - Always returns an array of event target elements.
   */
  _preInputElems(where) {
    return TinyHtml._preInputElems(this, where);
  }

  /**
   * Ensures the input is returned as an single event target element.
   * Useful to normalize operations across multiple or single event target elements.
   *
   * @param {TinyInputElement|TinyInputElement[]} elems - A single event target element or array of html elements.
   * @param {string} where - The method or context name where validation is being called.
   * @returns {InputElement} - Always returns an single event target element.
   */
  static _preInputElem(elems, where) {
    return TinyHtml._preElemTemplate(
      elems,
      where,
      [HTMLInputElement, HTMLSelectElement, HTMLTextAreaElement, HTMLOptionElement],
      ['HTMLInputElement', 'HTMLSelectElement', 'HTMLTextAreaElement', 'HTMLOptionElement'],
    );
  }

  /**
   * Ensures the input is returned as an single event target element.
   * Useful to normalize operations across multiple or single event target elements.
   *
   * @param {string} where - The method or context name where validation is being called.
   * @returns {InputElement} - Always returns an single event target element.
   */
  _preInputElem(where) {
    return TinyHtml._preInputElem(this, where);
  }

  /**
   * Ensures the input is returned as an array.
   * Useful to normalize operations across multiple or single event target elements.
   *
   * @param {TinyEventTarget|TinyEventTarget[]} elems - A single event target element or array of html elements.
   * @param {string} where - The method or context name where validation is being called.
   * @returns {EventTarget[]} - Always returns an array of event target elements.
   */
  static _preEventTargetElems(elems, where) {
    return TinyHtml._preElemsTemplate(elems, where, [EventTarget], ['EventTarget']);
  }

  /**
   * Ensures the input is returned as an array.
   * Useful to normalize operations across multiple or single event target elements.
   *
   * @param {string} where - The method or context name where validation is being called.
   * @returns {EventTarget[]} - Always returns an array of event target elements.
   */
  _preEventTargetElems(where) {
    return TinyHtml._preEventTargetElems(this, where);
  }

  /**
   * Ensures the input is returned as an single event target element.
   * Useful to normalize operations across multiple or single event target elements.
   *
   * @param {TinyEventTarget|TinyEventTarget[]} elems - A single event target element or array of html elements.
   * @param {string} where - The method or context name where validation is being called.
   * @returns {EventTarget} - Always returns an single event target element.
   */
  static _preEventTargetElem(elems, where) {
    return TinyHtml._preElemTemplate(elems, where, [EventTarget], ['EventTarget']);
  }

  /**
   * Ensures the input is returned as an single event target element.
   * Useful to normalize operations across multiple or single event target elements.
   *
   * @param {string} where - The method or context name where validation is being called.
   * @returns {EventTarget} - Always returns an single event target element.
   */
  _preEventTargetElem(where) {
    return TinyHtml._preEventTargetElem(this, where);
  }

  /**
   * Ensures the input is returned as an array.
   * Useful to normalize operations across multiple or single element/window elements.
   *
   * @param {TinyElementAndWindow|TinyElementAndWindow[]} elems - A single element/window element or array of html elements.
   * @param {string} where - The method or context name where validation is being called.
   * @returns {ElementAndWindow[]} - Always returns an array of element/window elements.
   */
  static _preElemsAndWindow(elems, where) {
    return TinyHtml._preElemsTemplate(elems, where, [Element, Window], ['Element', 'Window']);
  }

  /**
   * Ensures the input is returned as an array.
   * Useful to normalize operations across multiple or single element/window elements.
   *
   * @param {string} where - The method or context name where validation is being called.
   * @returns {ElementAndWindow[]} - Always returns an array of element/window elements.
   */
  _preElemsAndWindow(where) {
    return TinyHtml._preElemsAndWindow(this, where);
  }

  /**
   * Ensures the input is returned as an single element/window element.
   * Useful to normalize operations across multiple or single element/window elements.
   *
   * @param {TinyElementAndWindow|TinyElementAndWindow[]} elems - A single element/window element or array of html elements.
   * @param {string} where - The method or context name where validation is being called.
   * @returns {ElementAndWindow} - Always returns an single element/window element.
   */
  static _preElemAndWindow(elems, where) {
    return TinyHtml._preElemTemplate(elems, where, [Element, Window], ['Element', 'Window']);
  }

  /**
   * Ensures the input is returned as an single element/window element.
   * Useful to normalize operations across multiple or single element/window elements.
   *
   * @param {string} where - The method or context name where validation is being called.
   * @returns {ElementAndWindow} - Always returns an single element/window element.
   */
  _preElemAndWindow(where) {
    return TinyHtml._preElemAndWindow(this, where);
  }

  /**
   * Ensures the input is returned as an array.
   * Useful to normalize operations across multiple or single element/window/document elements.
   *
   * @param {TinyElementAndWinAndDoc|TinyElementAndWinAndDoc[]} elems - A single element/document/window element or array of html elements.
   * @param {string} where - The method or context name where validation is being called.
   * @returns {ElementAndWindow[]} - Always returns an array of element/document/window elements.
   */
  static _preElemsAndWinAndDoc(elems, where) {
    const result = TinyHtml._preElemsTemplate(
      elems,
      where,
      [Element, Window, Document],
      ['Element', 'Window', 'Document'],
    );
    return result.map((elem) => (!(elem instanceof Document) ? elem : elem.documentElement));
  }

  /**
   * Ensures the input is returned as an array.
   * Useful to normalize operations across multiple or single element/window/document elements.
   *
   * @param {string} where - The method or context name where validation is being called.
   * @returns {ElementAndWindow[]} - Always returns an array of element/document/window elements.
   */
  _preElemsAndWinAndDoc(where) {
    return TinyHtml._preElemsAndWinAndDoc(this, where);
  }

  /**
   * Ensures the input is returned as an single element/window/document element.
   * Useful to normalize operations across multiple or single element/window/document elements.
   *
   * @param {TinyElementAndWinAndDoc|TinyElementAndWinAndDoc[]} elems - A single element/document/window element or array of html elements.
   * @param {string} where - The method or context name where validation is being called.
   * @returns {ElementAndWindow} - Always returns an single element/document/window element.
   */
  static _preElemAndWinAndDoc(elems, where) {
    const result = TinyHtml._preElemTemplate(
      elems,
      where,
      [Element, Window, Document],
      ['Element', 'Window', 'Document'],
    );
    if (result instanceof Document) return result.documentElement;
    return result;
  }

  /**
   * Ensures the input is returned as an single element/window/document element.
   * Useful to normalize operations across multiple or single element/window/document elements.
   *
   * @param {string} where - The method or context name where validation is being called.
   * @returns {ElementAndWindow} - Always returns an single element/document/window element.
   */
  _preElemAndWinAndDoc(where) {
    return TinyHtml._preElemAndWinAndDoc(this, where);
  }

  /**
   * Ensures the input is returned as an array.
   * Useful to normalize operations across multiple or single element with document elements.
   *
   * @param {TinyElementWithDoc|TinyElementWithDoc[]} elems - A single element with document element or array of html elements.
   * @param {string} where - The method or context name where validation is being called.
   * @returns {ElementWithDoc[]} - Always returns an array of element with document elements.
   */
  static _preElemsWithDoc(elems, where) {
    return TinyHtml._preElemsTemplate(elems, where, [Element, Document], ['Element', 'Document']);
  }

  /**
   * Ensures the input is returned as an array.
   * Useful to normalize operations across multiple or single element with document elements.
   *
   * @param {string} where - The method or context name where validation is being called.
   * @returns {ElementWithDoc[]} - Always returns an array of element with document elements.
   */
  _preElemsWithDoc(where) {
    return TinyHtml._preElemsWithDoc(this, where);
  }

  /**
   * Ensures the input is returned as an single element with document element.
   * Useful to normalize operations across multiple or single element with document elements.
   *
   * @param {TinyElementWithDoc|TinyElementWithDoc[]} elems - A single element/window element or array of html elements.
   * @param {string} where - The method or context name where validation is being called.
   * @returns {ElementWithDoc} - Always returns an single element/window element.
   */
  static _preElemWithDoc(elems, where) {
    return TinyHtml._preElemTemplate(elems, where, [Element, Document], ['Element', 'Document']);
  }

  /**
   * Ensures the input is returned as an single element with document element.
   * Useful to normalize operations across multiple or single element with document elements.
   *
   * @param {string} where - The method or context name where validation is being called.
   * @returns {ElementWithDoc} - Always returns an single element/window element.
   */
  _preElemWithDoc(where) {
    return TinyHtml._preElemWithDoc(this, where);
  }

  //////////////////////////////////////////////////////

  // TITLE: Converter DOM <--> TinyHtml

  /**
   * Normalizes and converts one or more DOM elements (or TinyHtml instances)
   * into an array of `TinyHtml` instances.
   *
   * - If a plain DOM element is passed, it is wrapped into a `TinyHtml` instance.
   * - If a `TinyHtml` instance is already passed, it is preserved.
   * - If an array is passed, all elements inside are converted accordingly.
   *
   * This ensures consistent access to methods of the `TinyHtml` class regardless
   * of the input form.
   *
   * @param {TinyElement|Text|(TinyElement|Text)[]} elems - A single element or an array of elements (DOM or TinyHtml).
   * Returns the array of TinyHtml instances corresponding to the input elements.
   */
  static toTinyElm(elems) {
    /** @param {(TinyElement|Text)[]} item */
    const checkElement = (item) =>
      item.map((elem) => (!(elem instanceof TinyHtml) ? new TinyHtml(elem) : elem));
    if (!Array.isArray(elems)) return checkElement([elems]);
    return checkElement(elems);
  }

  /**
   * Extracts native `Element` instances from one or more elements,
   * which can be either raw DOM elements or wrapped in `TinyHtml`.
   *
   * - If a `TinyHtml` instance is passed, its internal DOM element is extracted.
   * - If a raw DOM element is passed, it is returned as-is.
   * - If an array is passed, each element is processed accordingly.
   *
   * This function guarantees that the return value is always an array of
   * raw `Element` objects, regardless of whether the input was
   * a mix of `TinyHtml` or native DOM elements.
   *
   * @param {TinyElement|TinyElement[]} elems - A single element or an array of elements (DOM or TinyHtml`).
   * @returns {Element[]} An array of Element instances extracted from the input.
   */
  static fromTinyElm(elems) {
    /** @param {TinyElement[]} item */
    const checkElement = (item) => {
      /** @type {Element[]} */
      const result = [];
      item.map((elem) =>
        /** @type {Element[]} */ (
          elem instanceof TinyHtml ? elem._getElements('fromTinyElm') : [elem]
        ).map((elem) => result.push(elem)),
      );
      return result;
    };
    if (!Array.isArray(elems)) return checkElement([elems]);
    return checkElement(elems);
  }

  //////////////////////////////////////////////////

  // TITLE: DOM Getter

  /**
   * Filters an array of elements based on a selector, function, element, or array of elements.
   *
   * @param {TinyElement|TinyElement[]} elems
   * @param {WinnowRequest} qualifier
   * @param {string} where - The context/method name using this validation.
   * @param {boolean} not Whether to invert the result (used for .not())
   * @returns {Element[]}
   */
  static winnow(elems, qualifier, where, not = false) {
    if (typeof not !== 'boolean') throw new TypeError('The "not" must be a boolean.');
    if (typeof qualifier === 'function') {
      return TinyHtml._preElems(elems, where).filter(
        (el, i) => !!qualifier.call(el, i, el) !== not,
      );
    }

    if (qualifier instanceof Element) {
      return TinyHtml._preElems(elems, where).filter((el) => (el === qualifier) !== not);
    }

    if (
      Array.isArray(qualifier) ||
      (typeof qualifier !== 'string' &&
        // @ts-ignore
        qualifier.length != null)
    ) {
      return TinyHtml._preElems(elems, where).filter((el) => qualifier.includes(el) !== not);
    }

    // Assume it's a selector string
    let selector = qualifier;
    if (not) selector = `:not(${selector})`;
    return TinyHtml._preElems(elems, where).filter(
      (el) => el.nodeType === 1 && el.matches(selector),
    );
  }

  /**
   * Filters a set of elements by a CSS selector.
   *
   * @param {TinyElement|TinyElement[]} elems
   * @param {string} selector
   * @param {boolean} not
   * @returns {Element[]}
   */
  static filter(elems, selector, not = false) {
    if (not) selector = `:not(${selector})`;
    return TinyHtml._preElems(elems, 'filter').filter(
      (el) => el.nodeType === 1 && el.matches(selector),
    );
  }

  /**
   * Returns only the elements matching the given selector or function.
   *
   * @param {TinyElement|TinyElement[]} elems
   * @param {WinnowRequest} selector
   * @returns {Element[]}
   */
  static filterOnly(elems, selector) {
    return TinyHtml.winnow(elems, selector, 'filterOnly', false);
  }

  /**
   * Returns only the elements **not** matching the given selector or function.
   *
   * @param {TinyElement|TinyElement[]} elems
   * @param {WinnowRequest} selector
   * @returns {Element[]}
   */
  static not(elems, selector) {
    return TinyHtml.winnow(elems, selector, 'not', true);
  }

  /**
   * Returns only the elements **not** matching the given selector or function.
   *
   * @param {WinnowRequest} selector
   * @returns {Element[]}
   */
  not(selector) {
    return TinyHtml.not(this, selector);
  }

  /**
   * Finds elements matching a selector within a context.
   *
   * @param {TinyElement|TinyElement[]} context
   * @param {string} selector
   * @returns {Element[]}
   */
  static find(context, selector) {
    const result = [];
    for (const el of TinyHtml._preElems(context, 'find')) {
      result.push(...el.querySelectorAll(selector));
    }
    return [...new Set(result)];
  }

  /**
   * Finds elements in your element matching a selector within a context.
   *
   * @param {string} selector
   * @returns {Element[]}
   */
  find(selector) {
    return TinyHtml.find(this, selector);
  }

  /**
   * Checks if at least one element matches the selector.
   *
   * @param {TinyElement|TinyElement[]} elems
   * @param {WinnowRequest} selector
   * @returns {boolean}
   */
  static is(elems, selector) {
    return TinyHtml.winnow(elems, selector, 'is', false).length > 0;
  }

  /**
   * Checks if the element matches the selector.
   *
   * @param {WinnowRequest} selector
   * @returns {boolean}
   */
  is(selector) {
    return TinyHtml.is(this, selector);
  }

  /**
   * Returns elements from the current list that contain the given target(s).
   * @param {TinyElement|TinyElement[]} roots - A single element or an array of elements (DOM or TinyHtml).
   * @param {string|TinyElement|TinyElement[]} target - Selector or DOM element(s).
   * @returns {Element[]} Elements that contain the target.
   */
  static has(roots, target) {
    const targets =
      typeof target === 'string'
        ? [...document.querySelectorAll(target)]
        : TinyHtml._preElems(target, 'has');

    return TinyHtml._preElems(roots, 'has').filter((root) =>
      targets.some((t) => root && root.contains(t)),
    );
  }

  /**
   * Returns elements from the current list that contain the given target(s).
   * @param {string|TinyElement|TinyElement[]} target - Selector or DOM element(s).
   * @returns {Element[]} Elements that contain the target.
   */
  has(target) {
    return TinyHtml.has(this, target);
  }

  /**
   * Finds the closest ancestor (including self) that matches the selector.
   *
   * @param {TinyElement|TinyElement[]} els - A single element or an array of elements (DOM or TinyHtml).
   * @param {string|Element} selector - A selector string or DOM element to match.
   * @param {Element|null} [context] - An optional context to stop searching.
   * @returns {Element[]}
   */
  static closest(els, selector, context) {
    const matched = [];

    for (const el of TinyHtml._preElems(els, 'closest')) {
      /** @type {Element | null} */
      let current = el;
      while (current && current !== context) {
        if (
          current.nodeType === 1 &&
          (typeof selector === 'string' ? current.matches(selector) : current === selector)
        ) {
          matched.push(current);
          break;
        }
        current = current.parentElement;
      }
    }

    return [...new Set(matched)];
  }

  /**
   * Finds the closest ancestor (including self) that matches the selector.
   *
   * @param {string|Element} selector - A selector string or DOM element to match.
   * @param {Element|null} [context] - An optional context to stop searching.
   * @returns {Element[]}
   */
  closest(selector, context) {
    return TinyHtml.closest(this, selector, context);
  }

  /**
   * Compares two DOM elements to determine if they refer to the same node in the document.
   *
   * This performs a strict equality check (`===`) between the two elements.
   *
   * @param {TinyNode} elem - The first DOM element to compare.
   * @param {TinyNode} otherElem - The second DOM element to compare.
   * @returns {boolean} `true` if both elements are the same DOM node; otherwise, `false`.
   */
  static isSameDom(elem, otherElem) {
    return (
      TinyHtml._preNodeElem(elem, 'isSameDom') === TinyHtml._preNodeElem(otherElem, 'isSameDom')
    );
  }

  /**
   * Compares two DOM elements to determine if they refer to the same node in the document.
   *
   * This performs a strict equality check (`===`) between the two elements.
   *
   * @param {TinyNode} elem - The DOM element to compare.
   * @returns {boolean} `true` if both elements are the same DOM node; otherwise, `false`.
   */
  isSameDom(elem) {
    return TinyHtml.isSameDom(this, elem);
  }

  //////////////////////////////////////////////////////////////////

  // TITLE: Data Manager

  /**
   * Internal data storage for element information.
   * @type {ElementDataStore}
   */
  #data = {};

  /**
   * Returns a shallow copy of the internal data.
   * @type {ElementDataStore}
   */
  get _data() {
    return { ...this.#data };
  }

  /**
   * Replaces the internal data with a new object.
   * @param {ElementDataStore} value - Must be a non-null object.
   * @throws {Error} If the value is not a valid object.
   */
  set _data(value) {
    if (typeof value !== 'object' || value === null || Array.isArray(value))
      throw new Error('value must be a non-null object.');
    this.#data = value;
  }

  /**
   * Internal data selectors for accessing public or private data stores.
   *
   * @type {Record<string, (where: string, elem: TinyElement) => ElementDataStore>}
   */
  static _dataSelector = {
    public: (where, el) => {
      const elem = TinyHtml._preElem(el, where);
      let data = __elementDataMap.get(elem);
      if (!data) {
        data = {};
        __elementDataMap.set(elem, data);
      }
      return data;
    },
    private: (where, el) => {
      if (!(el instanceof TinyHtml))
        throw new Error(`Element must be a TinyHtml instance to execute ${where}().`);
      return el.#data;
    },
  };

  /**
   * Retrieves data associated with a DOM element.
   *
   * If a `key` is provided, the corresponding value is returned.
   * If no `key` is given, a shallow copy of all stored data is returned.
   *
   * @param {TinyElement} el - The DOM element.
   * @param {string|null} [key] - The specific key to retrieve from the data store.
   * @param {boolean} [isPrivate=false] - Whether to access the private data store.
   * @returns {ElementDataStore|undefined|any} - The stored value, all data, or undefined if the key doesn't exist.
   */
  static data(el, key, isPrivate = false) {
    // Get or initialize the data object
    const data = TinyHtml._dataSelector[!isPrivate ? 'public' : 'private']('data', el);

    // Getter for all
    if (key === undefined || key === null) return { ...data };

    // Getter for specific key
    if (typeof key !== 'string') throw new TypeError('The key must be a string.');
    return data.hasOwnProperty(key) ? data[key] : undefined;
  }

  /**
   * Retrieves data associated with a DOM element.
   *
   * If a `key` is provided, the corresponding value is returned.
   * If no `key` is given, a shallow copy of all stored data is returned.
   *
   * @param {string} [key] - The specific key to retrieve from the data store.
   * @param {boolean} [isPrivate=false] - Whether to access the private data store.
   * @returns {ElementDataStore|undefined|any} - The stored value, all data, or undefined if the key doesn't exist.
   */
  data(key, isPrivate) {
    return TinyHtml.data(this, key, isPrivate);
  }

  /**
   * Stores a value associated with a specific key for a DOM element.
   *
   * @template {TinyElement} T
   * @param {T} el - The DOM element.
   * @param {string} key - The key under which the data will be stored.
   * @param {any} value - The value to store.
   * @param {boolean} [isPrivate=false] - Whether to store the data in the private store.
   * @returns {T}
   */
  static setData(el, key, value, isPrivate = false) {
    const data = TinyHtml._dataSelector[!isPrivate ? 'public' : 'private']('setData', el);
    if (typeof key !== 'string') throw new TypeError('The key must be a string.');
    if (typeof value !== 'undefined') data[key] = value;
    else TinyHtml.removeData(el, key);
    return el;
  }

  /**
   * Stores a value associated with a specific key for a DOM element.
   *
   * @param {string} key - The key under which the data will be stored.
   * @param {any} value - The value to store.
   * @param {boolean} [isPrivate=false] - Whether to store the data in the private store.
   * @returns {this}
   */
  setData(key, value, isPrivate = false) {
    return TinyHtml.setData(this, key, value, isPrivate);
  }

  /**
   * Checks if a specific key exists in the data store of a DOM element.
   *
   * @template {TinyElement} T
   * @param {T} el - The DOM element.
   * @param {string} key - The key to check.
   * @param {boolean} [isPrivate=false] - Whether to check the private store.
   * @returns {boolean}
   */
  static hasData(el, key, isPrivate = false) {
    if (typeof key !== 'string') throw new TypeError('The key must be a string.');
    const data = TinyHtml._dataSelector[!isPrivate ? 'public' : 'private']('hasData', el);
    return Object.prototype.hasOwnProperty.call(data, key);
  }

  /**
   * Checks if a specific key exists in the data store of this element.
   *
   * @param {string} key - The key to check.
   * @param {boolean} [isPrivate=false] - Whether to check the private store.
   * @returns {boolean}
   */
  hasData(key, isPrivate = false) {
    return TinyHtml.hasData(this, key, isPrivate);
  }

  /**
   * Removes a value associated with a specific key from the data store of a DOM element.
   *
   * @param {TinyElement} el - The DOM element.
   * @param {string} key - The key to remove.
   * @param {boolean} [isPrivate=false] - Whether to remove from the private store.
   * @returns {boolean}
   */
  static removeData(el, key, isPrivate = false) {
    if (typeof key !== 'string') throw new TypeError('The key must be a string.');
    const data = TinyHtml._dataSelector[!isPrivate ? 'public' : 'private']('removeData', el);
    return delete data[key];
  }

  /**
   * Removes a value associated with a specific key from the data store of this element.
   *
   * @param {string} key - The key to remove.
   * @param {boolean} [isPrivate=false] - Whether to remove from the private store.
   * @returns {boolean}
   */
  removeData(key, isPrivate = false) {
    return TinyHtml.removeData(this, key, isPrivate);
  }

  //////////////////////////////////////////////////////

  // TITLE: DOM Getter 2

  /**
   * Get the sibling element in a given direction.
   *
   * @param {TinyNode} el
   * @param {"previousSibling"|"nextSibling"} direction
   * @param {string} where
   * @returns {ChildNode|null}
   */
  static _getSibling(el, direction, where) {
    /** @type {Node|null} */
    let newCurrent = TinyHtml._preNodeElemWithNull(el, where);
    while (newCurrent && (newCurrent = newCurrent[direction]) && newCurrent.nodeType !== 1) {}
    if (!(newCurrent instanceof Node)) return null;
    return /** @type {ChildNode} */ (newCurrent);
  }

  /**
   * Get all sibling elements excluding the given one.
   *
   * @param {Node|null} start
   * @param {Node|null} [exclude]
   * @returns {ChildNode[]}
   */
  static _getSiblings(start, exclude) {
    /** @type {Node|null} */
    let st = start;
    const siblings = [];
    for (; st; st = st.nextSibling) {
      if (st.nodeType === 1 && st !== exclude) {
        siblings.push(st);
      }
    }
    return /** @type {ChildNode[]} */ (siblings);
  }

  /**
   * Traverse DOM in a direction collecting elements.
   *
   * @param {TinyNode} el
   * @param {"parentNode"|"nextSibling"|"previousSibling"} direction
   * @param {TinyNode|string} [until]
   * @param {string} [where='domDir']
   * @returns {ChildNode[]}
   */
  static domDir(el, direction, until, where = 'domDir') {
    if (typeof direction !== 'string') throw new TypeError('The "direction" must be a string.');
    let elem = TinyHtml._preNodeElemWithNull(el, where);
    const matched = [];
    // @ts-ignore
    while (elem && (elem = elem[direction])) {
      if (elem.nodeType !== 1) continue;
      if (
        until &&
        (typeof until === 'string'
          ? // @ts-ignore
            elem.matches(until)
          : elem === until)
      )
        break;
      matched.push(elem);
    }
    return /** @type {ChildNode[]} */ (matched);
  }

  /**
   * Returns the direct parent node of the given element, excluding document fragments.
   *
   * @param {TinyNode} el - The DOM node to find the parent of.
   * @returns {ParentNode|null} The parent node or null if not found.
   */
  static parent(el) {
    let elem = TinyHtml._preNodeElemWithNull(el, 'parent');
    const parent = elem ? elem.parentNode : null;
    return parent && parent.nodeType !== 11 ? parent : null;
  }

  /**
   * Returns the direct parent node of the given element, excluding document fragments.
   *
   * @returns {ParentNode|null} The parent node or null if not found.
   */
  parent() {
    return TinyHtml.parent(this);
  }

  /**
   * Returns all ancestor nodes of the given element, optionally stopping before a specific ancestor.
   *
   * @param {TinyNode} el - The DOM node to start from.
   * @param {TinyNode|string} [until] - A node or selector to stop before.
   * @returns {ChildNode[]} An array of ancestor nodes.
   */
  static parents(el, until) {
    return TinyHtml.domDir(el, 'parentNode', until, 'parents');
  }

  /**
   * Returns all ancestor nodes of the given element, optionally stopping before a specific ancestor.
   *
   * @param {TinyNode|string} [until] - A node or selector to stop before.
   * @returns {ChildNode[]} An array of ancestor nodes.
   */
  parents(until) {
    return TinyHtml.parents(this, until);
  }

  /**
   * Returns the next sibling of the given element.
   *
   * @param {TinyNode} el - The DOM node to start from.
   * @returns {ChildNode|null} The next sibling or null if none found.
   */
  static next(el) {
    return TinyHtml._getSibling(el, 'nextSibling', 'next');
  }

  /**
   * Returns the next sibling of the given element.
   *
   * @returns {ChildNode|null} The next sibling or null if none found.
   */
  next() {
    return TinyHtml.next(this);
  }

  /**
   * Returns the previous sibling of the given element.
   *
   * @param {TinyNode} el - The DOM node to start from.
   * @returns {ChildNode|null} The previous sibling or null if none found.
   */
  static prev(el) {
    return TinyHtml._getSibling(el, 'previousSibling', 'prev');
  }

  /**
   * Returns the previous sibling of the given element.
   *
   * @returns {ChildNode|null} The previous sibling or null if none found.
   */
  prev() {
    return TinyHtml.prev(this);
  }

  /**
   * Returns all next sibling nodes after the given element.
   *
   * @param {TinyNode} el - The DOM node to start from.
   * @returns {ChildNode[]} An array of next sibling nodes.
   */
  static nextAll(el) {
    return TinyHtml.domDir(el, 'nextSibling', undefined, 'nextAll');
  }

  /**
   * Returns all next sibling nodes after the given element.
   *
   * @returns {ChildNode[]} An array of next sibling nodes.
   */
  nextAll() {
    return TinyHtml.nextAll(this);
  }

  /**
   * Returns all previous sibling nodes before the given element.
   *
   * @param {TinyNode} el - The DOM node to start from.
   * @returns {ChildNode[]} An array of previous sibling nodes.
   */
  static prevAll(el) {
    return TinyHtml.domDir(el, 'previousSibling', undefined, 'prevAll');
  }

  /**
   * Returns all previous sibling nodes before the given element.
   *
   * @returns {ChildNode[]} An array of previous sibling nodes.
   */
  prevAll() {
    return TinyHtml.prevAll(this);
  }

  /**
   * Returns all next sibling nodes up to (but not including) the node matched by a selector or element.
   *
   * @param {TinyNode} el - The DOM node to start from.
   * @param {TinyNode|string} [until] - A node or selector to stop before.
   * @returns {ChildNode[]} An array of next sibling nodes.
   */
  static nextUntil(el, until) {
    return TinyHtml.domDir(el, 'nextSibling', until, 'nextUtil');
  }

  /**
   * Returns all next sibling nodes up to (but not including) the node matched by a selector or element.
   *
   * @param {TinyNode|string} [until] - A node or selector to stop before.
   * @returns {ChildNode[]} An array of next sibling nodes.
   */
  nextUntil(until) {
    return TinyHtml.nextUntil(this, until);
  }

  /**
   * Returns all previous sibling nodes up to (but not including) the node matched by a selector or element.
   *
   * @param {TinyNode} el - The DOM node to start from.
   * @param {TinyNode|string} [until] - A node or selector to stop before.
   * @returns {ChildNode[]} An array of previous sibling nodes.
   */
  static prevUntil(el, until) {
    return TinyHtml.domDir(el, 'previousSibling', until, 'prevUtil');
  }

  /**
   * Returns all previous sibling nodes up to (but not including) the node matched by a selector or element.
   *
   * @param {TinyNode|string} [until] - A node or selector to stop before.
   * @returns {ChildNode[]} An array of previous sibling nodes.
   */
  prevUntil(until) {
    return TinyHtml.prevUntil(this, until);
  }

  /**
   * Returns all sibling nodes of the given element, excluding itself.
   *
   * @param {TinyNode} el - The DOM node to find siblings of.
   * @returns {ChildNode[]} An array of sibling nodes.
   */
  static siblings(el) {
    const elem = TinyHtml._preNodeElemWithNull(el, 'siblings');
    return TinyHtml._getSiblings(elem && elem.parentNode ? elem.parentNode.firstChild : null, elem);
  }

  /**
   * Returns all sibling nodes of the given element, excluding itself.
   *
   * @returns {ChildNode[]} An array of sibling nodes.
   */
  siblings() {
    return TinyHtml.siblings(this);
  }

  /**
   * Returns all child nodes of the given element.
   *
   * @param {TinyNode} el - The DOM node to get children from.
   * @returns {ChildNode[]} An array of child nodes.
   */
  static children(el) {
    const elem = TinyHtml._preNodeElemWithNull(el, 'children');
    return TinyHtml._getSiblings(elem ? elem.firstChild : null);
  }

  /**
   * Returns all child nodes of the given element.
   *
   * @returns {ChildNode[]} An array of child nodes.
   */
  children() {
    return TinyHtml.children(this);
  }

  /**
   * Returns the contents of the given node. For `<template>` it returns its content; for `<iframe>`, the document.
   *
   * @param {TinyNode} el - The DOM node to get contents from.
   * @returns {(ChildNode|DocumentFragment)[]|Document[]} An array of child nodes or the content document of an iframe.
   */
  static contents(el) {
    const elem = TinyHtml._preNodeElemWithNull(el, 'contents');
    if (
      elem instanceof HTMLIFrameElement &&
      elem.contentDocument != null &&
      Object.getPrototypeOf(elem.contentDocument)
    ) {
      return [elem.contentDocument];
    }

    if (elem instanceof HTMLTemplateElement) {
      return Array.from((elem.content || elem).childNodes);
    }

    if (elem) return Array.from(elem.childNodes);
    return [];
  }

  /**
   * Returns the contents of the given node. For `<template>` it returns its content; for `<iframe>`, the document.
   *
   * @returns {(ChildNode|DocumentFragment)[]|Document[]} An array of child nodes or the content document of an iframe.
   */
  contents() {
    return TinyHtml.contents(this);
  }

  ////////////////////////////////////////////

  // TITLE: Clone Dom

  /**
   * Clone each element.
   * @param {TinyNode|TinyNode[]} el
   * @param {boolean} [deep=true]
   * @returns {Node[]}
   */
  static clone(el, deep = true) {
    if (typeof deep !== 'boolean') throw new TypeError('The "deep" must be a boolean.');
    return TinyHtml._preNodeElems(el, 'clone').map((el) => el.cloneNode(deep));
  }

  /**
   * Clone the element.
   * @param {boolean} [deep=true]
   * @returns {Node}
   */
  clone(deep) {
    return TinyHtml.clone(this, deep)[0];
  }

  //////////////////////////////////////////////////

  // TITLE: Append Content

  /**
   * Normalize and validate nodes before DOM insertion.
   * Converts TinyNode-like structures or strings into DOM-compatible nodes.
   * @type {(where: string, ...nodes: (AppendCheckerValues|Record<string, AppendCheckerValues>)[]) => (Node | string)[]}
   */
  static _appendChecker(where, ...nodes) {
    /** @type {(string | Node)[]} */
    const results = [];
    for (const item of nodes) {
      if (typeof item === 'undefined' || item === null || item === false) continue;
      if (typeof item !== 'string' && typeof item !== 'number') {
        if (item instanceof Node || item instanceof TinyHtml)
          results.push(...TinyHtml._preNodeElems(item, where));
        else if (Array.isArray(item)) results.push(...TinyHtml._appendChecker(where, ...item));
        else {
          for (const name in item) {
            const elems = item[name];
            results.push(...TinyHtml._appendChecker(where, elems));
          }
        }
      } else results.push(item);
    }
    return results;
  }

  /**
   * Appends child elements or strings to the end of the target element(s).
   *
   * @template {TinyElement} T
   * @param {T} el - The target element(s) to receive children.
   * @param {...(AppendCheckerValues|Record<string, AppendCheckerValues>)} children - The child elements or text to append.
   * @returns {T}
   */
  static append(el, ...children) {
    const elem = TinyHtml._preElem(el, 'append');
    elem.append(...TinyHtml._appendChecker('append', ...children));
    return el;
  }

  /**
   * Appends child elements or strings to the end of the target element(s).
   *
   * @param {...(AppendCheckerValues|Record<string, AppendCheckerValues>)} children - The child elements or text to append.
   * @returns {this}
   */
  append(...children) {
    return TinyHtml.append(this, ...children);
  }

  /**
   * Prepends child elements or strings to the beginning of the target element(s).
   *
   * @template {TinyElement} T
   * @param {T} el - The target element(s) to receive children.
   * @param {...(AppendCheckerValues|Record<string, AppendCheckerValues>)} children - The child elements or text to prepend.
   * @returns {T}
   */
  static prepend(el, ...children) {
    const elem = TinyHtml._preElem(el, 'prepend');
    elem.prepend(...TinyHtml._appendChecker('prepend', ...children));
    return el;
  }

  /**
   * Prepends child elements or strings to the beginning of the target element(s).
   *
   * @param {...(AppendCheckerValues|Record<string, AppendCheckerValues>)} children - The child elements or text to prepend.
   * @returns {this}
   */
  prepend(...children) {
    return TinyHtml.prepend(this, ...children);
  }

  /**
   * Inserts elements or strings immediately before the target element(s) in the DOM.
   *
   * @template {TinyElement} T
   * @param {T} el - The target element(s) before which new content is inserted.
   * @param {...(AppendCheckerValues|Record<string, AppendCheckerValues>)} children - Elements or text to insert before the target.
   * @returns {T}
   */
  static before(el, ...children) {
    const elem = TinyHtml._preElem(el, 'before');
    elem.before(...TinyHtml._appendChecker('before', ...children));
    return el;
  }

  /**
   * Inserts elements or strings immediately before the target element(s) in the DOM.
   *
   * @param {...(AppendCheckerValues|Record<string, AppendCheckerValues>)} children - Elements or text to insert before the target.
   * @returns {this}
   */
  before(...children) {
    return TinyHtml.before(this, ...children);
  }

  /**
   * Inserts elements or strings immediately after the target element(s) in the DOM.
   *
   * @template {TinyElement} T
   * @param {T} el - The target element(s) after which new content is inserted.
   * @param {...(AppendCheckerValues|Record<string, AppendCheckerValues>)} children - Elements or text to insert after the target.
   * @returns {T}
   */
  static after(el, ...children) {
    const elem = TinyHtml._preElem(el, 'after');
    elem.after(...TinyHtml._appendChecker('after', ...children));
    return el;
  }

  /**
   * Inserts elements or strings immediately after the target element(s) in the DOM.
   *
   * @param {...(AppendCheckerValues|Record<string, AppendCheckerValues>)} children - Elements or text to insert after the target.
   * @returns {this}
   */
  after(...children) {
    return TinyHtml.after(this, ...children);
  }

  /**
   * Replaces the target element(s) in the DOM with new elements or text.
   *
   * @template {TinyElement} T
   * @param {T} el - The element(s) to be replaced.
   * @param {...(AppendCheckerValues|Record<string, AppendCheckerValues>)} newNodes - New elements or text to replace the target.
   * @returns {T}
   */
  static replaceWith(el, ...newNodes) {
    const elem = TinyHtml._preElem(el, 'replaceWith');
    elem.replaceWith(...TinyHtml._appendChecker('replaceWith', ...newNodes));
    return el;
  }

  /**
   * Replaces the target element(s) in the DOM with new elements or text.
   *
   * @param {...(AppendCheckerValues|Record<string, AppendCheckerValues>)} newNodes - New elements or text to replace the target.
   * @returns {this}
   */
  replaceWith(...newNodes) {
    return TinyHtml.replaceWith(this, ...newNodes);
  }

  /**
   * Appends the given element(s) to each target element in sequence.
   *
   * @template {TinyNode | TinyNode[]} T
   * @param {T} el - The element(s) to append.
   * @param {TinyNode | TinyNode[]} targets - Target element(s) where content will be appended.
   * @returns {T}
   */
  static appendTo(el, targets) {
    const elems = TinyHtml._preNodeElems(el, 'appendTo');
    const tars = TinyHtml._preNodeElems(targets, 'appendTo');
    tars.forEach((target, i) => {
      elems.forEach((elem) =>
        target.appendChild(i === tars.length - 1 ? elem : elem.cloneNode(true)),
      );
    });
    return el;
  }

  /**
   * Appends the given element(s) to each target element in sequence.
   *
   * @param {TinyNode | TinyNode[]} targets - Target element(s) where content will be appended.
   * @returns {this}
   */
  appendTo(targets) {
    return TinyHtml.appendTo(this, targets);
  }

  /**
   * Prepends the given element(s) to each target element in sequence.
   *
   * @template {TinyElement | TinyElement[]} T
   * @param {T} el - The element(s) to prepend.
   * @param {TinyElement | TinyElement[]} targets - Target element(s) where content will be prepended.
   * @returns {T}
   */
  static prependTo(el, targets) {
    const elems = TinyHtml._preElems(el, 'prependTo');
    const tars = TinyHtml._preElems(targets, 'prependTo');
    tars.forEach((target, i) => {
      elems
        .slice()
        .reverse()
        .forEach((elem) => target.prepend(i === tars.length - 1 ? elem : elem.cloneNode(true)));
    });
    return el;
  }

  /**
   * Prepends the given element(s) to each target element in sequence.
   *
   * @param {TinyElement | TinyElement[]} targets - Target element(s) where content will be prepended.
   * @returns {this}
   */
  prependTo(targets) {
    return TinyHtml.prependTo(this, targets);
  }

  /**
   * Inserts the element before a child of a given target, or before the target itself.
   *
   * @template {TinyNode | TinyNode[]} T
   * @param {T} el - The element(s) to insert.
   * @param {TinyNode | TinyNode[]} target - The reference element where insertion happens.
   * @param {TinyNode | TinyNode[] | null} [child=null] - Optional child to insert before, defaults to target.
   * @returns {T}
   */
  static insertBefore(el, target, child = null) {
    const elem = TinyHtml._preNodeElem(el, 'insertBefore');
    const targ = TinyHtml._preNodeElem(target, 'insertBefore');
    const childNode = TinyHtml._preNodeElemWithNull(child, 'insertBefore');
    if (!targ.parentNode)
      throw new Error('The target element has no parent node to insert before.');
    targ.parentNode.insertBefore(elem, childNode || targ);
    return el;
  }

  /**
   * Inserts the element before a child of a given target, or before the target itself.
   *
   * @param {TinyNode | TinyNode[]} target - The reference element where insertion happens.
   * @param {TinyNode | TinyNode[] | null} [child=null] - Optional child to insert before, defaults to target.
   * @returns {this}
   */
  insertBefore(target, child) {
    return TinyHtml.insertBefore(this, target, child);
  }

  /**
   * Inserts the element after a child of a given target, or after the target itself.
   *
   * @template {TinyNode | TinyNode[]} T
   * @param {T} el - The element(s) to insert.
   * @param {TinyNode | TinyNode[]} target - The reference element where insertion happens.
   * @param {TinyNode | TinyNode[] | null} [child=null] - Optional child to insert after, defaults to target.
   * @returns {T}
   */
  static insertAfter(el, target, child = null) {
    const elem = TinyHtml._preNodeElem(el, 'insertAfter');
    const targ = TinyHtml._preNodeElem(target, 'insertBefore');
    const childNode = TinyHtml._preNodeElemWithNull(child, 'insertBefore');
    if (!targ.parentNode) throw new Error('The target element has no parent node to insert after.');
    targ.parentNode.insertBefore(elem, childNode || targ.nextSibling);
    return el;
  }

  /**
   * Inserts the element after a child of a given target, or after the target itself.
   *
   * @param {TinyNode | TinyNode[]} target - The reference element where insertion happens.
   * @param {TinyNode | TinyNode[] | null} [child=null] - Optional child to insert after, defaults to target.
   * @returns {this}
   */
  insertAfter(target, child) {
    return TinyHtml.insertAfter(this, target, child);
  }

  /**
   * Replaces all target elements with the provided element(s).
   * If multiple targets exist, the inserted elements are cloned accordingly.
   *
   * @template {TinyNode | TinyNode[]} T
   * @param {T} el - The new element(s) to insert.
   * @param {TinyNode | TinyNode[]} targets - The elements to be replaced.
   * @returns {T}
   */
  static replaceAll(el, targets) {
    const elems = TinyHtml._preNodeElems(el, 'replaceAll');
    const tars = TinyHtml._preNodeElems(targets, 'replaceAll');
    tars.forEach((target, i) => {
      const parent = target.parentNode;
      elems.forEach((elem) => {
        if (parent)
          parent.replaceChild(i === tars.length - 1 ? elem : elem.cloneNode(true), target);
      });
    });
    return el;
  }

  /**
   * Replaces all target elements with the provided element(s).
   * If multiple targets exist, the inserted elements are cloned accordingly.
   *
   * @param {TinyNode | TinyNode[]} targets - The elements to be replaced.
   * @returns {this}
   */
  replaceAll(targets) {
    return TinyHtml.replaceAll(this, targets);
  }

  //////////////////////////////////////////////////////

  // TITLE: Constructor Base

  /**
   * The target HTML element for instance-level operations.
   * @type {ConstructorElValues[]}
   */
  #el;

  /**
   * Returns the number of elements currently stored in the internal element list.
   *
   * @returns {number} The total count of elements.
   */
  get size() {
    return this.#el.length;
  }

  /**
   * Validates if all provided items are acceptable constructor values.
   *
   * @param {any[]|NodeListOf<Element>|HTMLCollectionOf<Element>|NodeListOf<HTMLElement>} els - The elements to validate.
   * @throws {Error} If any element is not a valid target.
   */
  static _elCheck(els) {
    for (const item of els) {
      if (
        !(item instanceof Element) &&
        !(item instanceof Window) &&
        !(item instanceof Document) &&
        !(item instanceof Text)
      )
        throw new Error(`[TinyHtml] Invalid Target in constructor.`);
    }
  }

  /**
   * A new TinyHtml object containing the combined elements.
   *
   * @template {TinyHtmlConstructor} T
   * @param {T} el - The elements to add.
   * @returns {TinyHtml<TinyHtmlT|T>} The new length of the internal collection.
   */
  add(el) {
    return new TinyHtml([...this.#el, ...TinyHtml._selector(el)]);
  }

  /**
   * Resolves the given constructor input into a normalized array of elements.
   *
   * @param {TinyHtmlConstructor} el - A selector string, element, array-like collection, or array of constructor values.
   * @returns {ConstructorElValues[]} A normalized array of DOM elements/values.
   * @throws {Error} If a TinyHtml instance is passed (nesting TinyHtml inside TinyHtml is not allowed).
   * @throws {Error} If the resolved elements are not valid constructor values.
   */
  static _selector(el) {
    if (el instanceof TinyHtml)
      throw new Error(
        `[TinyHtml] You are trying to put a TinyHtml inside another TinyHtml in constructor.`,
      );

    /** @type {(list: any[]) => any[]} */
    const fixItemList = (list) => Array.from(new Set(list));
    const selector = typeof el !== 'string' ? el : document.querySelectorAll(el);
    if (Array.isArray(selector)) {
      TinyHtml._elCheck(selector);
      return fixItemList(selector);
    } else if (selector instanceof NodeList || selector instanceof HTMLCollection) {
      const els = [...selector];
      TinyHtml._elCheck(els);
      return fixItemList(els);
    } else {
      const els = [selector];
      TinyHtml._elCheck(els);
      // @ts-ignore
      return fixItemList(els);
    }
  }

  /**
   * Creates an instance of TinyHtml for a specific Element.
   * Useful when you want to operate repeatedly on the same element using instance methods.
   * @param {TinyHtmlT} el - The element to wrap and manipulate.
   */
  constructor(el) {
    this.#el = TinyHtml._selector(el);
    this.#mainDisplay = TinyHtml.#defaultDisplay;
  }

  /**
   * Checks whether the given object is a window.
   * @param {*} obj - The object to test.
   * @returns {obj is Window} - True if it's a Window.
   */
  static isWindow(obj) {
    return obj != null && obj === obj.window;
  }

  /////////////////////////////////////////////////////

  // TITLE: CSS Stuff

  /**
   * Returns the full computed CSS styles for the given element.
   *
   * @param {TinyElement} el - The element to retrieve styles from.
   * @returns {CSSStyleDeclaration} The computed style object for the element.
   */
  static css(el) {
    const elem = TinyHtml._preElem(el, 'css');
    return window.getComputedStyle(elem);
  }

  /**
   * Returns the full computed CSS styles for the given element.
   *
   * @returns {CSSStyleDeclaration} The computed style object for the element.
   */
  css() {
    return TinyHtml.css(this);
  }

  /**
   * Returns the value of a specific computed CSS property from the given element as a string.
   *
   * @param {TinyElement} el - The element to retrieve the style property from.
   * @param {string} prop - The name of the CSS property (camelCase or kebab-case).
   * @returns {string|null} The value of the CSS property as a string, or null if not found or invalid.
   */
  static cssString(el, prop) {
    const elem = TinyHtml._preElem(el, 'cssString');
    if (typeof prop !== 'string') throw new TypeError('The prop must be a string.');
    // @ts-ignore
    const val = window.getComputedStyle(elem)[prop];
    return typeof val === 'string' ? val : typeof val === 'number' ? val.toString() : null;
  }

  /**
   * Returns the value of a specific computed CSS property from the given element as a string.
   *
   * @param {string} prop - The name of the CSS property (camelCase or kebab-case).
   * @returns {string|null} The value of the CSS property as a string, or null if not found or invalid.
   */
  cssString(prop) {
    return TinyHtml.cssString(this, prop);
  }

  /**
   * Returns a subset of computed CSS styles based on the given list of properties.
   *
   * @param {TinyElement} el - The element to retrieve styles from.
   * @param {string[]} prop - An array of CSS property names to retrieve.
   * @returns {Partial<CSSStyleDeclaration>} An object containing the requested styles.
   */
  static cssList(el, prop) {
    const elem = TinyHtml._preElem(el, 'cssList');
    if (!Array.isArray(prop)) throw new TypeError('The prop must be an array of strings.');

    const css = window.getComputedStyle(elem);
    /** @type {Partial<CSSStyleDeclaration>} */
    const result = {};

    for (const p of prop) {
      if (typeof p !== 'undefined') {
        // @ts-ignore
        result[p] = css.getPropertyValue(p);
      }
    }

    return result;
  }

  /**
   * Returns a subset of computed CSS styles based on the given list of properties.
   *
   * @param {string[]} prop - An array of CSS property names to retrieve.
   * @returns {Partial<CSSStyleDeclaration>} An object containing the requested styles.
   */
  cssList(prop) {
    return TinyHtml.cssList(this, prop);
  }

  /**
   * Returns the computed CSS float value of a property.
   * @param {TinyElement} el - The element to inspect.
   * @param {string} prop - The CSS property.
   * @returns {number} - The parsed float value.
   */
  static cssFloat(el, prop) {
    const elem = TinyHtml._preElem(el, 'cssFloat');
    if (typeof prop !== 'string') throw new TypeError('The prop must be a string.');
    // @ts-ignore
    const val = window.getComputedStyle(elem)[prop];
    return parseFloat(val) || 0;
  }

  /**
   * Returns the computed CSS float value of a property.
   * @param {string} prop - The CSS property.
   * @returns {number} - The parsed float value.
   */
  cssFloat(prop) {
    return TinyHtml.cssFloat(this, prop);
  }

  /**
   * Returns computed float values of multiple CSS properties.
   * @param {TinyElement} el - The element to inspect.
   * @param {string[]} prop - An array of CSS properties.
   * @returns {Record<string, number>} - Map of property to float value.
   */
  static cssFloats(el, prop) {
    const elem = TinyHtml._preElem(el, 'cssFloats');
    if (!Array.isArray(prop)) throw new TypeError('The prop must be an array of strings.');
    const css = window.getComputedStyle(elem);
    /** @type {Record<string, number>} */
    const result = {};
    for (const name of prop) {
      // @ts-ignore
      result[name] = parseFloat(css[name]) || 0;
    }
    return result;
  }

  /**
   * Returns computed float values of multiple CSS properties.
   * @param {string[]} prop - An array of CSS properties.
   * @returns {Record<string, number>} - Map of property to float value.
   */
  cssFloats(prop) {
    return TinyHtml.cssFloats(this, prop);
  }

  //////////////////////////////////////////////////////////////////////

  // TITLE: Style Stuff

  /**
   * Stores camelCase to kebab-case CSS property aliases.
   *
   * Used to normalize property names when interacting with `element.style` or `getComputedStyle`.
   *
   * ⚠️ This object should not be modified directly. Use `TinyHtml.cssPropAliases` instead to ensure reverse mappings stay in sync.
   *
   * Example of how to add a new alias:
   *
   * ```js
   * TinyHtml.cssPropAliases.tinyPudding = 'tiny-pudding';
   * ```
   *
   * This will automatically update `TinyHtml.cssPropRevAliases['tiny-pudding']` with `'tinyPudding'`.
   *
   * @type {Record<string | symbol, string>}
   */
  static #cssPropAliases = {
    alignContent: 'align-content',
    alignItems: 'align-items',
    alignSelf: 'align-self',
    animationDelay: 'animation-delay',
    animationDirection: 'animation-direction',
    animationDuration: 'animation-duration',
    animationFillMode: 'animation-fill-mode',
    animationIterationCount: 'animation-iteration-count',
    animationName: 'animation-name',
    animationPlayState: 'animation-play-state',
    animationTimingFunction: 'animation-timing-function',
    backfaceVisibility: 'backface-visibility',
    backgroundAttachment: 'background-attachment',
    backgroundBlendMode: 'background-blend-mode',
    backgroundClip: 'background-clip',
    backgroundColor: 'background-color',
    backgroundImage: 'background-image',
    backgroundOrigin: 'background-origin',
    backgroundPosition: 'background-position',
    backgroundRepeat: 'background-repeat',
    backgroundSize: 'background-size',
    borderBottom: 'border-bottom',
    borderBottomColor: 'border-bottom-color',
    borderBottomLeftRadius: 'border-bottom-left-radius',
    borderBottomRightRadius: 'border-bottom-right-radius',
    borderBottomStyle: 'border-bottom-style',
    borderBottomWidth: 'border-bottom-width',
    borderCollapse: 'border-collapse',
    borderColor: 'border-color',
    borderImage: 'border-image',
    borderImageOutset: 'border-image-outset',
    borderImageRepeat: 'border-image-repeat',
    borderImageSlice: 'border-image-slice',
    borderImageSource: 'border-image-source',
    borderImageWidth: 'border-image-width',
    borderLeft: 'border-left',
    borderLeftColor: 'border-left-color',
    borderLeftStyle: 'border-left-style',
    borderLeftWidth: 'border-left-width',
    borderRadius: 'border-radius',
    borderRight: 'border-right',
    borderRightColor: 'border-right-color',
    borderRightStyle: 'border-right-style',
    borderRightWidth: 'border-right-width',
    borderSpacing: 'border-spacing',
    borderStyle: 'border-style',
    borderTop: 'border-top',
    borderTopColor: 'border-top-color',
    borderTopLeftRadius: 'border-top-left-radius',
    borderTopRightRadius: 'border-top-right-radius',
    borderTopStyle: 'border-top-style',
    borderTopWidth: 'border-top-width',
    borderWidth: 'border-width',
    boxDecorationBreak: 'box-decoration-break',
    boxShadow: 'box-shadow',
    boxSizing: 'box-sizing',
    breakAfter: 'break-after',
    breakBefore: 'break-before',
    breakInside: 'break-inside',
    captionSide: 'caption-side',
    caretColor: 'caret-color',
    clipPath: 'clip-path',
    columnCount: 'column-count',
    columnFill: 'column-fill',
    columnGap: 'column-gap',
    columnRule: 'column-rule',
    columnRuleColor: 'column-rule-color',
    columnRuleStyle: 'column-rule-style',
    columnRuleWidth: 'column-rule-width',
    columnSpan: 'column-span',
    columnWidth: 'column-width',
    counterIncrement: 'counter-increment',
    counterReset: 'counter-reset',
    emptyCells: 'empty-cells',
    flexBasis: 'flex-basis',
    flexDirection: 'flex-direction',
    flexFlow: 'flex-flow',
    flexGrow: 'flex-grow',
    flexShrink: 'flex-shrink',
    flexWrap: 'flex-wrap',
    fontFamily: 'font-family',
    fontFeatureSettings: 'font-feature-settings',
    fontKerning: 'font-kerning',
    fontLanguageOverride: 'font-language-override',
    fontSize: 'font-size',
    fontSizeAdjust: 'font-size-adjust',
    fontStretch: 'font-stretch',
    fontStyle: 'font-style',
    fontSynthesis: 'font-synthesis',
    fontVariant: 'font-variant',
    fontVariantAlternates: 'font-variant-alternates',
    fontVariantCaps: 'font-variant-caps',
    fontVariantEastAsian: 'font-variant-east-asian',
    fontVariantLigatures: 'font-variant-ligatures',
    fontVariantNumeric: 'font-variant-numeric',
    fontVariantPosition: 'font-variant-position',
    fontWeight: 'font-weight',
    gridArea: 'grid-area',
    gridAutoColumns: 'grid-auto-columns',
    gridAutoFlow: 'grid-auto-flow',
    gridAutoRows: 'grid-auto-rows',
    gridColumn: 'grid-column',
    gridColumnEnd: 'grid-column-end',
    gridColumnGap: 'grid-column-gap',
    gridColumnStart: 'grid-column-start',
    gridGap: 'grid-gap',
    gridRow: 'grid-row',
    gridRowEnd: 'grid-row-end',
    gridRowGap: 'grid-row-gap',
    gridRowStart: 'grid-row-start',
    gridTemplate: 'grid-template',
    gridTemplateAreas: 'grid-template-areas',
    gridTemplateColumns: 'grid-template-columns',
    gridTemplateRows: 'grid-template-rows',
    imageRendering: 'image-rendering',
    justifyContent: 'justify-content',
    letterSpacing: 'letter-spacing',
    lineBreak: 'line-break',
    lineHeight: 'line-height',
    listStyle: 'list-style',
    listStyleImage: 'list-style-image',
    listStylePosition: 'list-style-position',
    listStyleType: 'list-style-type',
    marginBottom: 'margin-bottom',
    marginLeft: 'margin-left',
    marginRight: 'margin-right',
    marginTop: 'margin-top',
    maskClip: 'mask-clip',
    maskComposite: 'mask-composite',
    maskImage: 'mask-image',
    maskMode: 'mask-mode',
    maskOrigin: 'mask-origin',
    maskPosition: 'mask-position',
    maskRepeat: 'mask-repeat',
    maskSize: 'mask-size',
    maskType: 'mask-type',
    maxHeight: 'max-height',
    maxWidth: 'max-width',
    minHeight: 'min-height',
    minWidth: 'min-width',
    mixBlendMode: 'mix-blend-mode',
    objectFit: 'object-fit',
    objectPosition: 'object-position',
    offsetAnchor: 'offset-anchor',
    offsetDistance: 'offset-distance',
    offsetPath: 'offset-path',
    offsetRotate: 'offset-rotate',
    outlineColor: 'outline-color',
    outlineOffset: 'outline-offset',
    outlineStyle: 'outline-style',
    outlineWidth: 'outline-width',
    overflowAnchor: 'overflow-anchor',
    overflowWrap: 'overflow-wrap',
    overflowX: 'overflow-x',
    overflowY: 'overflow-y',
    paddingBottom: 'padding-bottom',
    paddingLeft: 'padding-left',
    paddingRight: 'padding-right',
    paddingTop: 'padding-top',
    pageBreakAfter: 'page-break-after',
    pageBreakBefore: 'page-break-before',
    pageBreakInside: 'page-break-inside',
    perspectiveOrigin: 'perspective-origin',
    placeContent: 'place-content',
    placeItems: 'place-items',
    placeSelf: 'place-self',
    pointerEvents: 'pointer-events',
    rowGap: 'row-gap',
    scrollBehavior: 'scroll-behavior',
    scrollMargin: 'scroll-margin',
    scrollMarginBlock: 'scroll-margin-block',
    scrollMarginBlockEnd: 'scroll-margin-block-end',
    scrollMarginBlockStart: 'scroll-margin-block-start',
    scrollMarginBottom: 'scroll-margin-bottom',
    scrollMarginInline: 'scroll-margin-inline',
    scrollMarginInlineEnd: 'scroll-margin-inline-end',
    scrollMarginInlineStart: 'scroll-margin-inline-start',
    scrollMarginLeft: 'scroll-margin-left',
    scrollMarginRight: 'scroll-margin-right',
    scrollMarginTop: 'scroll-margin-top',
    scrollPadding: 'scroll-padding',
    scrollPaddingBlock: 'scroll-padding-block',
    scrollPaddingBlockEnd: 'scroll-padding-block-end',
    scrollPaddingBlockStart: 'scroll-padding-block-start',
    scrollPaddingBottom: 'scroll-padding-bottom',
    scrollPaddingInline: 'scroll-padding-inline',
    scrollPaddingInlineEnd: 'scroll-padding-inline-end',
    scrollPaddingInlineStart: 'scroll-padding-inline-start',
    scrollPaddingLeft: 'scroll-padding-left',
    scrollPaddingRight: 'scroll-padding-right',
    scrollPaddingTop: 'scroll-padding-top',
    scrollSnapAlign: 'scroll-snap-align',
    scrollSnapStop: 'scroll-snap-stop',
    scrollSnapType: 'scroll-snap-type',
    shapeImageThreshold: 'shape-image-threshold',
    shapeMargin: 'shape-margin',
    shapeOutside: 'shape-outside',
    tabSize: 'tab-size',
    tableLayout: 'table-layout',
    textAlign: 'text-align',
    textAlignLast: 'text-align-last',
    textCombineUpright: 'text-combine-upright',
    textDecoration: 'text-decoration',
    textDecorationColor: 'text-decoration-color',
    textDecorationLine: 'text-decoration-line',
    textDecorationStyle: 'text-decoration-style',
    textIndent: 'text-indent',
    textJustify: 'text-justify',
    textOrientation: 'text-orientation',
    textOverflow: 'text-overflow',
    textShadow: 'text-shadow',
    textTransform: 'text-transform',
    transformBox: 'transform-box',
    transformOrigin: 'transform-origin',
    transformStyle: 'transform-style',
    transitionDelay: 'transition-delay',
    transitionDuration: 'transition-duration',
    transitionProperty: 'transition-property',
    transitionTimingFunction: 'transition-timing-function',
    unicodeBidi: 'unicode-bidi',
    userSelect: 'user-select',
    verticalAlign: 'vertical-align',
    whiteSpace: 'white-space',
    willChange: 'will-change',
    wordBreak: 'word-break',
    wordSpacing: 'word-spacing',
    wordWrap: 'word-wrap',
    writingMode: 'writing-mode',
    zIndex: 'z-index',
    WebkitTransform: '-webkit-transform',
    WebkitTransition: '-webkit-transition',
    WebkitBoxShadow: '-webkit-box-shadow',
    MozBoxShadow: '-moz-box-shadow',
    MozTransform: '-moz-transform',
    MozTransition: '-moz-transition',
    msTransform: '-ms-transform',
    msTransition: '-ms-transition',
  };

  /**
   * Public proxy to manage camelCase ➝ kebab-case CSS property aliasing.
   *
   * Modifying this object ensures that the reverse mapping in `cssPropRevAliases` is updated accordingly.
   *
   * @type {Record<string | symbol, string>}
   */
  static cssPropAliases = new Proxy(TinyHtml.#cssPropAliases, {
    set(target, camelCaseKey, kebabValue) {
      target[camelCaseKey] = kebabValue;
      // @ts-ignore
      TinyHtml.cssPropRevAliases[kebabValue] = camelCaseKey;
      return true;
    },
  });

  /**
   * Reverse map of `cssPropAliases`, mapping kebab-case back to camelCase CSS property names.
   *
   * This enables consistent bidirectional lookups of style properties.
   *
   * @type {Record<string | symbol, string>}
   */
  static cssPropRevAliases = Object.fromEntries(
    Object.entries(TinyHtml.#cssPropAliases).map(([camel, kebab]) => [kebab, camel]),
  );

  /**
   * Converts a camelCase string to kebab-case
   * @param {string} str
   * @returns {string}
   */
  static toStyleKc(str) {
    if (typeof TinyHtml.cssPropAliases[str] === 'string') return TinyHtml.cssPropAliases[str];
    return str;
  }

  /**
   * Converts a kebab-case string to camelCase
   * @param {string} str
   * @returns {string}
   */
  static toStyleCc(str) {
    if (typeof TinyHtml.cssPropRevAliases[str] === 'string') return TinyHtml.cssPropRevAliases[str];
    return str;
  }

  /**
   * Sets one or more CSS inline style properties on the given element(s).
   *
   * - If `prop` is a string, the `value` will be applied to that property.
   * - If `prop` is an object, each key-value pair will be applied as a CSS property and value.
   *
   * @template {TinyHtmlElement|TinyHtmlElement[]} T
   * @param {T} el - The element to inspect.
   * @param {string|Object} prop - The property name or an object with key-value pairs
   * @param {string|null} [value=null] - The value to set (if `prop` is a string)
   * @returns {T}
   */
  static setStyle(el, prop, value = null) {
    TinyHtml._preHtmlElems(el, 'setStyle').forEach((elem) => {
      if (typeof prop === 'object') {
        for (const [k, v] of Object.entries(prop)) {
          elem.style.setProperty(
            TinyHtml.toStyleKc(k),
            typeof v === 'string' ? v : typeof v === 'number' ? `${v}px` : String(v),
          );
        }
      } else elem.style.setProperty(TinyHtml.toStyleKc(prop), value);
    });
    return el;
  }

  /**
   * Sets one or more CSS inline style properties on the given element(s).
   *
   * - If `prop` is a string, the `value` will be applied to that property.
   * - If `prop` is an object, each key-value pair will be applied as a CSS property and value.
   *
   * @param {string|Object} prop - The property name or an object with key-value pairs
   * @param {string|null} [value=null] - The value to set (if `prop` is a string)
   * @returns {this}
   */
  setStyle(prop, value) {
    return TinyHtml.setStyle(this, prop, value);
  }

  /**
   * Gets the value of a specific inline style property.
   *
   * Returns only the value set directly via the `style` attribute.
   *
   * @param {TinyHtmlElement|TinyHtmlElement[]} el - A single element to inspect.
   * @param {string} prop - The style property name to retrieve.
   * @returns {string} The style value of the specified property.
   */
  static getStyle(el, prop) {
    return TinyHtml._preHtmlElem(el, 'getStyle').style.getPropertyValue(TinyHtml.toStyleKc(prop));
  }

  /**
   * Gets the value of a specific inline style property.
   *
   * Returns only the value set directly via the `style` attribute.
   *
   * @param {string} prop - The style property name to retrieve.
   * @returns {string} The style value of the specified property.
   */
  getStyle(prop) {
    return TinyHtml.getStyle(this, prop);
  }

  /**
   * Gets all inline styles defined directly on the element (`style` attribute).
   *
   * Returns an object with all property-value pairs in kebab-case format.
   *
   * @param {TinyHtmlElement|TinyHtmlElement[]} el - A single element to inspect.
   * @param {Object} [settings={}] - Optional configuration settings.
   * @param {boolean} [settings.camelCase=false] - If `true`, the property names will be converted to camelCase.
   * @param {boolean} [settings.rawAttr=false] - If `true`, reads the style string from the `style` attribute instead of using the style object.
   * @returns {Record<string, string>} All inline styles as an object.
   *
   * @throws {TypeError} If `camelCase` or `rawAttr` is not a boolean.
   */
  static style(el, { camelCase = false, rawAttr = false } = {}) {
    if (typeof camelCase !== 'boolean')
      throw new TypeError(`"camelCase" must be a boolean. Received: ${typeof camelCase}`);
    if (typeof rawAttr !== 'boolean')
      throw new TypeError(`"rawAttr" must be a boolean. Received: ${typeof rawAttr}`);

    const elem = TinyHtml._preHtmlElem(el, 'style');
    /** @type {Record<string, string>} */
    const result = {};

    if (rawAttr) {
      const raw = elem.getAttribute('style') || '';
      const entries = raw.split(';');
      for (const entry of entries) {
        const [rawProp, rawVal] = entry.split(':');
        if (!rawProp || !rawVal) continue;

        const prop = rawProp.trim();
        const value = rawVal.trim();
        result[camelCase ? TinyHtml.toStyleCc(prop) : prop] = value;
      }
    } else {
      const styles = elem.style;
      for (let i = 0; i < styles.length; i++) {
        const prop = styles[i]; // Already in kebab-case
        const value = styles.getPropertyValue(prop);
        result[camelCase ? TinyHtml.toStyleCc(prop) : prop] = value;
      }
    }

    return result;
  }

  /**
   * Gets all inline styles defined directly on the element (`style` attribute).
   *
   * Returns an object with all property-value pairs in kebab-case format.
   *
   * @param {Object} [settings={}] - Optional configuration settings.
   * @param {boolean} [settings.camelCase=false] - If `true`, the property names will be converted to camelCase.
   * @param {boolean} [settings.rawAttr=false] - If `true`, reads the style string from the `style` attribute instead of using the style object.
   * @returns {Record<string, string>} All inline styles as an object.
   */
  style(settings) {
    return TinyHtml.style(this, settings);
  }

  /**
   * Removes one or more inline CSS properties from the given element(s).
   *
   * @template {TinyHtmlElement|TinyHtmlElement[]} T
   * @param {T} el - A single element or an array of elements.
   * @param {string|string[]} prop - A property name or an array of property names to remove.
   * @returns {T}
   */
  static removeStyle(el, prop) {
    TinyHtml._preHtmlElems(el, 'removeStyle').forEach((elem) => {
      if (Array.isArray(prop)) {
        for (const p of prop) {
          elem.style.removeProperty(TinyHtml.toStyleKc(p));
        }
      } else elem.style.removeProperty(TinyHtml.toStyleKc(prop));
    });
    return el;
  }

  /**
   * Removes one or more inline CSS properties from the given element(s).
   *
   * @param {string|string[]} prop - A property name or an array of property names to remove.
   * @returns {this}
   */
  removeStyle(prop) {
    return TinyHtml.removeStyle(this, prop);
  }

  /**
   * Toggles a CSS property value between two given values.
   *
   * The current computed value is compared to `val1`. If it matches, the property is set to `val2`. Otherwise, it is set to `val1`.
   *
   * @template {TinyHtmlElement|TinyHtmlElement[]} T
   * @param {T} el - A single element or an array of elements.
   * @param {string} prop - The CSS property to toggle.
   * @param {string} val1 - The first value (used as "current" check).
   * @param {string} val2 - The second value (used as the "alternative").
   * @returns {T}
   */
  static toggleStyle(el, prop, val1, val2) {
    TinyHtml._preHtmlElems(el, 'toggleStyle').forEach((elem) => {
      const current = TinyHtml.getStyle(elem, prop).trim();
      const newVal = current === TinyHtml.toStyleKc(val1) ? val2 : val1;
      TinyHtml.setStyle(elem, prop, newVal);
    });
    return el;
  }

  /**
   * Toggles a CSS property value between two given values.
   *
   * The current computed value is compared to `val1`. If it matches, the property is set to `val2`. Otherwise, it is set to `val1`.
   *
   * @param {string} prop - The CSS property to toggle.
   * @param {string} val1 - The first value (used as "current" check).
   * @param {string} val2 - The second value (used as the "alternative").
   * @returns {this}
   */
  toggleStyle(prop, val1, val2) {
    return TinyHtml.toggleStyle(this, prop, val1, val2);
  }

  /**
   * Removes all inline styles (`style` attribute) from the given element(s).
   *
   * @template {TinyElement|TinyElement[]} T
   * @param {T} el - A single element or an array of elements.
   * @returns {T}
   */
  static clearStyle(el) {
    TinyHtml._preElems(el, 'clearStyle').forEach((elem) => elem.removeAttribute('style'));
    return el;
  }

  /**
   * Removes all inline styles (`style` attribute) from the given element(s).
   * @returns {this}
   */
  clearStyle() {
    return TinyHtml.clearStyle(this);
  }

  //////////////////////////////////////////////////////////////////////

  // TITLE: Focus/Blur

  /**
   * Focus the element.
   *
   * @template {TinyHtmlElement} T
   * @param {T} el - The element or a selector string.
   * @returns {T}
   */
  static focus(el) {
    const elem = TinyHtml._preHtmlElem(el, 'focus');
    elem.focus();
    return el;
  }

  /**
   * Focus the element.
   * @returns {this}
   */
  focus() {
    return TinyHtml.focus(this);
  }

  /**
   * Blur the element.
   *
   * @template {TinyHtmlElement} T
   * @param {T} el - The element or a selector string.
   * @returns {T}
   */
  static blur(el) {
    const elem = TinyHtml._preHtmlElem(el, 'blur');
    elem.blur();
    return el;
  }

  /**
   * Blur the element.
   * @returns {this}
   */
  blur() {
    return TinyHtml.blur(this);
  }

  /////////////////////////////////////////////////////////

  // TITLE: Select

  /**
   * Select the text content of an input or textarea element.
   *
   * @template {TinyHtmlAny|HTMLInputElement|HTMLTextAreaElement} T
   * @param {T} el - The element or a selector string.
   * @returns {T}
   */
  static select(el) {
    const elem = TinyHtml._preHtmlElem(el, 'select');
    if (elem instanceof HTMLInputElement || elem instanceof HTMLTextAreaElement) elem.select();
    else throw new Error('Element must be an <input> or <textarea> to use select().');
    return el;
  }

  /**
   * Select the text content of an input or textarea element.
   * @returns {this}
   */
  select() {
    return TinyHtml.select(this);
  }

  // TITLE: Bool Checker

  /**
   * Interprets a value as a boolean `true` if it matches a common truthy representation.
   *
   * This method checks if the input is any of the common forms used to represent `true`,
   * such as the string `'true'`, `'1'`, `'on'`, the boolean `true`, or the number `1`.
   *
   * @param {string|boolean|number} [value] - The value to interpret as boolean.
   * @returns {boolean} `true` if the value represents a truthy state, otherwise `false`.
   */
  static boolCheck(value) {
    if (
      typeof value !== 'undefined' &&
      (value === 'true' ||
        value === '1' ||
        value === true ||
        value === 'on' ||
        (typeof value === 'number' && value > 0))
    ) {
      return true;
    } else {
      return false;
    }
  }

  //////////////////////////////////////////////////////////////////////

  // TITLE: Window Getter/Setter

  /**
   * Sets the vertical scroll position of the window.
   * @param {number} value - Sets the scroll position.
   */
  static setWinScrollTop(value) {
    if (typeof value !== 'number') throw new TypeError('The value must be a number.');
    TinyHtml.setScrollTop(window, value);
  }

  /**
   * Sets the horizontal scroll position of the window.
   * @param {number} value - Sets the scroll position.
   */
  static setWinScrollLeft(value) {
    if (typeof value !== 'number') throw new TypeError('The value must be a number.');
    TinyHtml.setScrollLeft(window, value);
  }

  /**
   * Gets the vertical scroll position of the window.
   * @returns {number} - The current scroll top value.
   */
  static winScrollTop() {
    return window.scrollY || document.documentElement.scrollTop;
  }

  /**
   * Gets the horizontal scroll position of the window.
   * @returns {number} - The current scroll left value.
   */
  static winScrollLeft() {
    return window.scrollX || document.documentElement.scrollLeft;
  }

  /**
   * Returns the current height of the viewport.
   * @returns {number} - Viewport height in pixels.
   */
  static winInnerHeight() {
    return window.innerHeight || document.documentElement.clientHeight;
  }

  /**
   * Returns the current width of the viewport.
   * @returns {number} - Viewport width in pixels.
   */
  static winInnerWidth() {
    return window.innerWidth || document.documentElement.clientWidth;
  }

  /**
   * Checks if the page is currently scrolled to the very top.
   *
   * This method compares the current vertical scroll position with the total document height.
   * It's useful for detecting if the user has reached the top of the page.
   *
   * @returns {boolean} `true` if the page is scrolled to the top, otherwise `false`.
   */
  static isPageTop() {
    return window.scrollY === 0;
  }

  /**
   * Checks if the page is currently scrolled to the very bottom.
   *
   * This method uses the `scrollY` and `innerHeight` properties to determine if the
   * user has reached the end of the document.
   *
   * @returns {boolean} `true` if the page is scrolled to the bottom, otherwise `false`.
   */
  static isPageBottom() {
    return window.innerHeight + window.scrollY >= document.body.offsetHeight;
  }

  /**
   * Gets the width or height of an element based on the box model.
   * @param {TinyElementAndWinAndDoc} el - The element or window.
   * @param {"width"|"height"} type - Dimension type.
   * @param {"content"|"padding"|"border"|"margin"} [extra='content'] - Box model context.
   * @returns {number} - Computed dimension.
   * @throws {TypeError} If `type` or `extra` is not a string.
   */
  static getDimension(el, type, extra = 'content') {
    const elem = TinyHtml._preElemAndWinAndDoc(el, 'getDimension');
    if (typeof type !== 'string') throw new TypeError('The type must be a string.');
    if (typeof extra !== 'string') throw new TypeError('The extra must be a string.');

    const name = type === 'width' ? 'Width' : 'Height';

    if (TinyHtml.isWindow(elem)) {
      return extra === 'margin'
        ? // @ts-ignore
          elem['inner' + name]
        : // @ts-ignore
          elem.document.documentElement['client' + name];
    }
    /** @type {Element} */
    const elHtml = elem;

    if (elHtml.nodeType === 9) {
      // @ts-ignore
      const doc = elHtml.documentElement;
      return Math.max(
        // @ts-ignore
        elHtml.body['scroll' + name],
        doc['scroll' + name],
        // @ts-ignore
        elHtml.body['offset' + name],
        doc['offset' + name],
        doc['client' + name],
      );
    }

    let size = elHtml.getBoundingClientRect()[type];

    /**
     * Auxiliary function to add measures on one side and the other
     * @param {string} prefix
     */
    function sumSides(prefix) {
      if (type === 'width') {
        return (
          TinyHtml.cssFloat(elHtml, prefix + 'Left') + TinyHtml.cssFloat(elHtml, prefix + 'Right')
        );
      } else {
        return (
          TinyHtml.cssFloat(elHtml, prefix + 'Top') + TinyHtml.cssFloat(elHtml, prefix + 'Bottom')
        );
      }
    }

    switch (extra) {
      case 'content':
        // remove padding + border
        size -= sumSides('padding');
        size -= sumSides('border');
        break;

      case 'padding':
        // remove border only (padding included in the bounding rect)
        size -= sumSides('border');
        break;

      case 'border':
        // bounding rect already includes border + padding, so do not move the size
        break;

      case 'margin':
        // adds margin (margin is out of bounding rect)
        size += sumSides('margin');
        break;
    }

    return size;
  }

  /**
   * Gets the width or height of an element based on the box model.
   * @param {"width"|"height"} type - Dimension type.
   * @param {"content"|"padding"|"border"|"margin"} extra - Box model context.
   * @returns {number} - Computed dimension.
   */
  getDimension(type, extra) {
    return TinyHtml.getDimension(this, type, extra);
  }

  /**
   * Sets the height of the element.
   * @template {TinyHtmlElement} T
   * @param {T} el - Target element.
   * @param {string|number} value - Height value.
   * @throws {TypeError} If `value` is neither a string nor number.
   * @returns {T}
   */
  static setHeight(el, value) {
    const elem = TinyHtml._preHtmlElem(el, 'setHeight');
    if (typeof value !== 'number' && typeof value !== 'string')
      throw new TypeError('The value must be a string or number.');
    elem.style.height = typeof value === 'number' ? `${value}px` : value;
    return el;
  }

  /**
   * Sets the height of the element.
   * @param {string|number} value - Height value.
   * @returns {this}
   */
  setHeight(value) {
    return TinyHtml.setHeight(this, value);
  }

  /**
   * Sets the height of the element.
   * @param {string|number} value - Height value.
   */
  set height(value) {
    TinyHtml.setHeight(this, value);
  }

  /**
   * Sets the width of the element.
   * @template {TinyHtmlElement} T
   * @param {T} el - Target element.
   * @param {string|number} value - Width value.
   * @throws {TypeError} If `value` is neither a string nor number.
   * @returns {T}
   */
  static setWidth(el, value) {
    const elem = TinyHtml._preHtmlElem(el, 'setWidth');
    if (typeof value !== 'number' && typeof value !== 'string')
      throw new TypeError('The value must be a string or number.');
    elem.style.width = typeof value === 'number' ? `${value}px` : value;
    return el;
  }

  /**
   * Sets the width of the element.
   * @param {string|number} value - Width value.
   * @returns {this}
   */
  setWidth(value) {
    return TinyHtml.setWidth(this, value);
  }

  /**
   * Sets the width of the element.
   * @param {string|number} value - Width value.
   */
  set width(value) {
    TinyHtml.setWidth(this, value);
  }

  /**
   * Returns content box height.
   * @param {TinyElementAndWinAndDoc} el - Target element.
   * @returns {number}
   */
  static height(el) {
    const elem = TinyHtml._preElemAndWinAndDoc(el, 'height');
    return TinyHtml.getDimension(elem, 'height', 'content');
  }

  /**
   * Returns content box height.
   * @returns {number}
   */
  get height() {
    return TinyHtml.height(this);
  }

  /**
   * Returns content box width.
   * @param {TinyElementAndWinAndDoc} el - Target element.
   * @returns {number}
   */
  static width(el) {
    const elem = TinyHtml._preElemAndWinAndDoc(el, 'width');
    return TinyHtml.getDimension(elem, 'width', 'content');
  }

  /**
   * Returns content box width.
   * @returns {number}
   */
  get width() {
    return TinyHtml.width(this);
  }

  /**
   * Returns padding box height.
   * @param {TinyElementAndWinAndDoc} el - Target element.
   * @returns {number}
   */
  static innerHeight(el) {
    const elem = TinyHtml._preElemAndWinAndDoc(el, 'innerHeight');
    return TinyHtml.getDimension(elem, 'height', 'padding');
  }

  /**
   * Returns padding box height.
   * @returns {number}
   */
  innerHeight() {
    return TinyHtml.innerHeight(this);
  }

  /**
   * Returns padding box width.
   * @param {TinyElementAndWinAndDoc} el - Target element.
   * @returns {number}
   */
  static innerWidth(el) {
    const elem = TinyHtml._preElemAndWinAndDoc(el, 'innerWidth');
    return TinyHtml.getDimension(elem, 'width', 'padding');
  }

  /**
   * Returns padding box width.
   * @returns {number}
   */
  innerWidth() {
    return TinyHtml.innerWidth(this);
  }

  /**
   * Returns outer height of the element, optionally including margin.
   * @param {TinyElementAndWinAndDoc} el - Target element.
   * @param {boolean} [includeMargin=false] - Whether to include margin.
   * @returns {number}
   */
  static outerHeight(el, includeMargin = false) {
    if (typeof includeMargin !== 'boolean')
      throw new TypeError('The "includeMargin" must be a boolean.');
    const elem = TinyHtml._preElemAndWinAndDoc(el, 'outerHeight');
    return TinyHtml.getDimension(elem, 'height', includeMargin ? 'margin' : 'border');
  }

  /**
   * Returns outer height of the element, optionally including margin.
   * @param {boolean} [includeMargin=false] - Whether to include margin.
   * @returns {number}
   */
  outerHeight(includeMargin) {
    return TinyHtml.outerHeight(this, includeMargin);
  }

  /**
   * Returns outer width of the element, optionally including margin.
   * @param {TinyElementAndWinAndDoc} el - Target element.
   * @param {boolean} [includeMargin=false] - Whether to include margin.
   * @returns {number}
   */
  static outerWidth(el, includeMargin = false) {
    if (typeof includeMargin !== 'boolean')
      throw new TypeError('The "includeMargin" must be a boolean.');
    const elem = TinyHtml._preElemAndWinAndDoc(el, 'outerWidth');
    return TinyHtml.getDimension(elem, 'width', includeMargin ? 'margin' : 'border');
  }

  /**
   * Returns outer width of the element, optionally including margin.
   * @param {boolean} [includeMargin=false] - Whether to include margin.
   * @returns {number}
   */
  outerWidth(includeMargin) {
    return TinyHtml.outerWidth(this, includeMargin);
  }

  //////////////////////////////////////////////////

  // TITLE: Animate DOM (Data)

  /** @type {string} */
  #mainDisplay = '';

  /**
   * Gets the current display value.
   * @returns {string}
   */
  get mainDisplay() {
    return this.#mainDisplay;
  }

  /**
   * Sets the display value.
   * @param {string} value
   * @throws {TypeError} If the value is not a string.
   */
  set mainDisplay(value) {
    if (typeof value !== 'string') throw new TypeError('mainDisplay must be a string.');
    this.#mainDisplay = value;
  }

  /** @type {string} */
  static #defaultDisplay = 'block';

  /**
   * Gets the default display value.
   * @returns {string}
   */
  static get defaultDisplay() {
    return TinyHtml.#defaultDisplay;
  }

  /**
   * Sets the default display value.
   * @param {string} value
   * @throws {TypeError} If the value is not a string.
   */
  static set defaultDisplay(value) {
    if (typeof value !== 'string') throw new TypeError('defaultDisplay must be a string.');
    TinyHtml.#defaultDisplay = value;
  }

  /**
   * Retrieves stored animation data for a given element and key.
   * If no data exists yet, initializes storage for that element.
   *
   * @param {HTMLElement} el - The element whose data should be retrieved.
   * @param {string} where - The key to read (e.g., "origHeight").
   * @returns {string|number|undefined} - The stored value, or undefined.
   */
  static getAnimateData(el, where) {
    let dataset = __elementAnimateData.get(el);
    if (!dataset) {
      dataset = {};
      __elementAnimateData.set(el, dataset);
    }
    return dataset[where];
  }

  /**
   * Stores animation data for a given element and key.
   * Used to cache original size/values for animations.
   *
   * @param {HTMLElement} el - The element whose data should be set.
   * @param {string} where - The key to store under (e.g., "origHeight").
   * @param {string|number} value - The value to store.
   */
  static setAnimateData(el, where, value) {
    if (!(el instanceof HTMLElement))
      throw new TypeError('setAnimateData: el must be an HTMLElement.');
    if (typeof where !== 'string') throw new TypeError('setAnimateData: where must be a string.');
    if (!(typeof value === 'string' || typeof value === 'number'))
      throw new TypeError('setAnimateData: value must be a string or number.');

    let dataset = __elementAnimateData.get(el);
    if (!dataset) {
      dataset = {};
      __elementAnimateData.set(el, dataset);
    }
    dataset[where] = value;
  }

  // TITLE: Animate DOM (cancelOldStyleFx)

  /**
   * Global configuration flag controlling whether old style-based animations
   * are cancelled before a new one starts. Defaults to true.
   *
   * @type {boolean}
   */
  static #cancelOldStyleFx = true;

  /**
   * Returns the current global setting for cancelling old style-based animations.
   *
   * @returns {boolean} True if old animations are cancelled by default, false otherwise.
   */
  static get cancelOldStyleFx() {
    return TinyHtml.#cancelOldStyleFx;
  }

  /**
   * Updates the global setting that determines whether old style-based animations
   * are cancelled before new ones start.
   *
   * @param {boolean} value - True to cancel old animations by default, false to keep them running.
   * @throws {TypeError} If the value is not a boolean.
   */
  static set cancelOldStyleFx(value) {
    if (typeof value !== 'boolean') throw new TypeError('Expected a boolean value.');
    TinyHtml.#cancelOldStyleFx = value;
  }

  // TITLE: Animate DOM (styleFxSpeeds)

  /**
   * Predefined animation speed options, inspired by jQuery.fx.speeds.
   * Each entry can be either a number (duration in ms) or a KeyframeAnimationOptions object.
   *
   * Usage example:
   *   TinyHtml.animate(el, keyframes, TinyHtml.#fxSpeeds.fast);
   *   TinyHtml.slideDown(el, TinyHtml.#fxSpeeds.slow);
   *
   * @type {Record<string, number | KeyframeAnimationOptions>}
   */
  static #styleFxSpeeds = {
    slow: { duration: 600, easing: 'ease' },
    fast: { duration: 200, easing: 'ease-out' },
    _default: { duration: 400, easing: 'linear' },
  };

  /**
   * Get a cloned copy of predefined animation speeds.
   * @returns {Record<string, number | KeyframeAnimationOptions>}
   */
  static get styleFxSpeeds() {
    /** @type {Record<string, number | KeyframeAnimationOptions>} */
    const data = {};
    for (const name in TinyHtml.#styleFxSpeeds) {
      const info = TinyHtml.#styleFxSpeeds[name];
      data[name] = typeof info === 'object' ? { ...info } : info;
    }
    return data;
  }

  /**
   * Replace the predefined animation speeds.
   * @param {Record<string, number | KeyframeAnimationOptions>} speeds
   * @throws {TypeError} If input is not a valid object of speed definitions.
   */
  static set styleFxSpeeds(speeds) {
    if (typeof speeds !== 'object' || speeds === null || Array.isArray(speeds))
      throw new TypeError('styleFxSpeeds must be an object.');

    for (const [k, v] of Object.entries(speeds)) {
      if (!(typeof v === 'number' || typeof v === 'object'))
        throw new TypeError(`styleFxSpeeds["${k}"] must be a number or KeyframeAnimationOptions.`);
    }

    TinyHtml.#styleFxSpeeds = {};
    for (const [k, v] of Object.entries(speeds)) TinyHtml.setStyleFxSpeed(k, v);
  }

  /**
   * Get a predefined animation speed by name.
   *
   * @param {string} name - The name of the speed entry.
   * @returns {number | KeyframeAnimationOptions | undefined} A cloned value of the speed entry, or undefined if not found.
   */
  static getStyleFxSpeed(name) {
    if (typeof name !== 'string') throw new TypeError('The "name" parameter must be a string.');
    const spd = TinyHtml.#styleFxSpeeds[name];
    return typeof spd === 'object' ? { ...spd } : spd;
  }

  /**
   * Set or overwrite a predefined animation speed.
   *
   * @param {string} name - The name of the speed entry.
   * @param {number | KeyframeAnimationOptions} value - The value to store.
   * @throws {TypeError} If value is not a number or KeyframeAnimationOptions object.
   */
  static setStyleFxSpeed(name, value) {
    if (typeof name !== 'string') throw new TypeError('The "name" parameter must be a string.');
    if (!(typeof value === 'number' || typeof value === 'object'))
      throw new TypeError('styleFxSpeed must be a number or KeyframeAnimationOptions');
    TinyHtml.#styleFxSpeeds[name] = typeof value === 'object' ? { ...value } : value;
  }

  /**
   * Delete a predefined animation speed by name.
   *
   * @param {string} name - The name of the speed entry to delete.
   * @returns {boolean} True if the property was deleted, false otherwise.
   */
  static deleteStyleFxSpeed(name) {
    if (typeof name !== 'string') throw new TypeError('The "name" parameter must be a string.');
    return delete TinyHtml.#styleFxSpeeds[name];
  }

  /**
   * Check if a predefined animation speed exists.
   *
   * @param {string} name - The name of the speed entry to check.
   * @returns {boolean} True if the speed entry exists, false otherwise.
   */
  static hasStyleFxSpeed(name) {
    if (typeof name !== 'string') throw new TypeError('The "name" parameter must be a string.');
    return Object.prototype.hasOwnProperty.call(TinyHtml.#styleFxSpeeds, name);
  }

  // TITLE: Animate DOM (cssExpand)

  /**
   * CSS expansion shorthand used by genStyleFx to include margin/padding values.
   * @type {['Top', 'Right', 'Bottom', 'Left']}
   */
  static #cssExpand = ['Top', 'Right', 'Bottom', 'Left'];

  // TITLE: Animate DOM (styleEffects)

  /**
   * Generate shortcuts
   * @type {Record<string, StyleEffects>}
   */
  static #styleEffects = {
    slideDown: TinyHtml.genStyleFx('show'),
    slideUp: TinyHtml.genStyleFx('hide'),
    fadeIn: { opacity: 'show' },
    fadeOut: { opacity: 'hide' },
  };

  /**
   * Returns a deep-cloned copy of the registered style effects.
   *
   * @returns {Record<string, StyleEffects>}
   */
  static get styleEffects() {
    return JSON.parse(JSON.stringify(TinyHtml.#styleEffects));
  }

  /**
   * Replace the entire styleEffects map with a new one.
   *
   * @param {Record<string, StyleEffects>} value
   */
  static set styleEffects(value) {
    if (typeof value !== 'object' || value === null || Array.isArray(value))
      throw new TypeError('styleEffects must be an object');
    for (const name in value) {
      for (const [prop, mode] of Object.entries(value[name])) {
        if (
          typeof mode !== 'string' &&
          (!Array.isArray(mode) ||
            !mode.every((v) => typeof v === 'string' || typeof v === 'number'))
        )
          throw new TypeError(`Invalid styleEffect["${prop}"]`);
      }
    }

    TinyHtml.#styleEffects = {};
    for (const name in value) TinyHtml.setStyleEffect(name, value[name]);
  }

  /**
   * Get a deep-cloned style effect by name.
   * @param {string} name
   * @returns {StyleEffects|undefined}
   */
  static getStyleEffect(name) {
    if (typeof name !== 'string') throw new TypeError('The "name" parameter must be a string.');
    const eff = TinyHtml.#styleEffects[name];
    return eff ? JSON.parse(JSON.stringify(eff)) : undefined;
  }

  /**
   * Set or replace a style effect.
   * @param {string} name
   * @param {StyleEffects} value
   */
  static setStyleEffect(name, value) {
    if (typeof name !== 'string') throw new TypeError('The "name" parameter must be a string.');
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      throw new TypeError('styleEffect must be an object');
    }
    /** @type {StyleEffects} */
    const copy = {};
    for (const [prop, mode] of Object.entries(value)) {
      if (typeof mode === 'string') {
        copy[prop] = mode;
      } else if (
        Array.isArray(mode) &&
        mode.every((v) => typeof v === 'string' || typeof v === 'number')
      ) {
        copy[prop] = [...mode];
      } else {
        throw new TypeError(`Invalid styleEffect["${prop}"]`);
      }
    }
    TinyHtml.#styleEffects[name] = copy;
  }

  /**
   * Delete a style effect.
   * @param {string} name
   * @returns {boolean} True if deleted.
   */
  static deleteStyleEffect(name) {
    if (typeof name !== 'string') throw new TypeError('The "name" parameter must be a string.');
    return delete TinyHtml.#styleEffects[name];
  }

  /**
   * Check if a style effect exists.
   * @param {string} name
   * @returns {boolean}
   */
  static hasStyleEffect(name) {
    if (typeof name !== 'string') throw new TypeError('The "name" parameter must be a string.');
    return Object.prototype.hasOwnProperty.call(TinyHtml.#styleEffects, name);
  }

  // TITLE: Animate DOM (styleEffectInverse)

  /**
   * Style Effect Inverse Values
   * @type {Record<string, string>}
   */
  static #styleEffectInverse = {
    slideDown: 'slideUp',
    slideUp: 'slideDown',
    fadeIn: 'fadeOut',
    fadeOut: 'fadeIn',
    fadeTo: 'fadeIn',
  };

  /**
   * Get a cloned copy of style inverse values.
   * @returns {Record<string, string>}
   */
  static get styleEffectInverse() {
    return { ...TinyHtml.#styleEffectInverse };
  }

  /**
   * Replace the style inverse values.
   * @param {Record<string, string>} values
   * @throws {TypeError} If not a valid object with functions as values.
   */
  static set styleEffectInverse(values) {
    if (typeof values !== 'object' || values === null)
      throw new TypeError('styleEffectInverse must be an object.');

    for (const [k, v] of Object.entries(values)) {
      if (typeof v !== 'string')
        throw new TypeError(`styleEffectInverse["${k}"] must be a string.`);
    }

    TinyHtml.#styleEffectInverse = {};
    for (const [k, v] of Object.entries(values)) TinyHtml.setStyleEffectInverse(k, v);
  }

  /**
   * Get a registered inverse values.
   *
   * @param {string} name - The detector name.
   * @returns {string | null} The value if found, otherwise undefined.
   */
  static getStyleEffectInverse(name) {
    if (typeof name !== 'string') throw new TypeError('The "name" parameter must be a string.');
    return TinyHtml.#styleEffectInverse[name] || null;
  }

  /**
   * Register or overwrite a inverse value.
   *
   * @param {string} name - The detector name.
   * @param {string} value - The inverse value.
   * @throws {TypeError} If fn is not a string.
   */
  static setStyleEffectInverse(name, value) {
    if (typeof name !== 'string') throw new TypeError('The "name" parameter must be a string.');
    if (typeof value !== 'string')
      throw new TypeError(`styleEffectInverse["${name}"] must be a string.`);
    TinyHtml.#styleEffectInverse[name] = value;
  }

  /**
   * Delete a inverse value by name.
   *
   * @param {string} name - The inverse value name to delete.
   * @returns {boolean} True if deleted, false otherwise.
   */
  static deleteStyleEffectInverse(name) {
    if (typeof name !== 'string') throw new TypeError('The "name" parameter must be a string.');
    return delete TinyHtml.#styleEffectInverse[name];
  }

  /**
   * Check if a inverse value is registered.
   *
   * @param {string} name - The inverse value name to check.
   * @returns {boolean} True if registered, false otherwise.
   */
  static hasStyleEffectInverse(name) {
    if (typeof name !== 'string') throw new TypeError('The "name" parameter must be a string.');
    return Object.prototype.hasOwnProperty.call(TinyHtml.#styleEffectInverse, name);
  }

  // TITLE: Animate DOM (styleEffectsRd)

  /**
   * Style Effect Repeat Detector
   * @type {Record<string, StyleEffectsRdFn>}
   */
  static #styleEffectsRd = {
    slideDown: (effects) =>
      effects.height[0] === effects.height[1] &&
      (!effects.width || effects.width[0] === effects.width[1]),
    slideUp: (effects) =>
      effects.height[0] === effects.height[1] &&
      (!effects.width || effects.width[0] === effects.width[1]),
    fadeIn: (effects) => Number(effects.opacity[0]) === Number(effects.opacity[1]),
    fadeOut: (effects) => Number(effects.opacity[0]) === Number(effects.opacity[1]),
  };

  /**
   * Get a cloned copy of style effects repeat detectors.
   * @returns {Record<string, StyleEffectsRdFn>}
   */
  static get styleEffectsRd() {
    return { ...TinyHtml.#styleEffectsRd };
  }

  /**
   * Replace the style effects repeat detectors.
   * @param {Record<string, StyleEffectsRdFn>} detectors
   * @throws {TypeError} If not a valid object with functions as values.
   */
  static set styleEffectsRd(detectors) {
    if (typeof detectors !== 'object' || detectors === null)
      throw new TypeError('styleEffectsRd must be an object.');

    for (const [k, v] of Object.entries(detectors)) {
      if (typeof v !== 'function')
        throw new TypeError(`styleEffectsRd["${k}"] must be a function.`);
    }

    TinyHtml.#styleEffectsRd = {};
    for (const [k, v] of Object.entries(detectors)) TinyHtml.setStyleEffectRd(k, v);
  }

  /**
   * Get a registered repeat detector function by name.
   *
   * @param {string} name - The detector name.
   * @returns {StyleEffectsRdFn | null} The function if found, otherwise undefined.
   */
  static getStyleEffectRd(name) {
    if (typeof name !== 'string') throw new TypeError('The "name" parameter must be a string.');
    return TinyHtml.#styleEffectsRd[name] || null;
  }

  /**
   * Register or overwrite a repeat detector function.
   *
   * @param {string} name - The detector name.
   * @param {StyleEffectsRdFn} fn - The detector function.
   * @throws {TypeError} If fn is not a function.
   */
  static setStyleEffectRd(name, fn) {
    if (typeof name !== 'string') throw new TypeError('The "name" parameter must be a string.');
    if (typeof fn !== 'function')
      throw new TypeError(`styleEffectsRd["${name}"] must be a function.`);
    TinyHtml.#styleEffectsRd[name] = fn;
  }

  /**
   * Delete a repeat detector function by name.
   *
   * @param {string} name - The detector name to delete.
   * @returns {boolean} True if deleted, false otherwise.
   */
  static deleteStyleEffectRd(name) {
    if (typeof name !== 'string') throw new TypeError('The "name" parameter must be a string.');
    return delete TinyHtml.#styleEffectsRd[name];
  }

  /**
   * Check if a repeat detector function is registered.
   *
   * @param {string} name - The detector name to check.
   * @returns {boolean} True if registered, false otherwise.
   */
  static hasStyleEffectRd(name) {
    if (typeof name !== 'string') throw new TypeError('The "name" parameter must be a string.');
    return Object.prototype.hasOwnProperty.call(TinyHtml.#styleEffectsRd, name);
  }

  // TITLE: Animate DOM (styleEffectsPromps)

  /**
   * Effect property handlers for show, hide, and toggle.
   * Each function builds keyframes depending on the property being animated.
   *
   * @type {StyleEffectsProps}
   */
  static #styleEffectsProps = {
    show: (el, keyframes, prop, style) => {
      if (prop === 'height' || prop === 'width') {
        const targetSize = TinyHtml.getAnimateData(el, `orig${prop}`) || el.scrollHeight + 'px';
        TinyHtml.setAnimateData(el, `orig${prop}`, targetSize);

        const current = style[prop]; // pega valor atual
        keyframes[prop] = [current, targetSize];
      } else if (prop.startsWith('margin') || prop.startsWith('padding')) {
        // @ts-ignore
        const orig = TinyHtml.getAnimateData(el, prop) || style[prop];
        TinyHtml.setAnimateData(el, prop, orig);
        keyframes[prop] = ['0px', orig];
      } else if (prop === 'opacity') {
        const current = style.opacity;
        keyframes[prop] = [current, 1];
      } else {
        // @ts-ignore
        const current = TinyHtml.getAnimateData(el, prop) || style[prop];
        TinyHtml.setAnimateData(el, prop, current);
        // @ts-ignore
        keyframes[prop] = [current, style[prop] || 1];
      }
    },
    hide: (el, keyframes, prop, style) => {
      if (prop === 'height' || prop === 'width') {
        const targetSize = TinyHtml.getAnimateData(el, `orig${prop}`) || style[prop];
        TinyHtml.setAnimateData(el, `orig${prop}`, targetSize);

        const current = style[prop]; // pega valor atual
        keyframes[prop] = [current, 0];
      } else if (prop.startsWith('margin') || prop.startsWith('padding')) {
        // @ts-ignore
        const orig = TinyHtml.getAnimateData(el, prop) || style[prop];
        TinyHtml.setAnimateData(el, prop, orig);

        // @ts-ignore
        keyframes[prop] = [style[prop], '0px'];
      } else if (prop === 'opacity') {
        const current = style.opacity;
        keyframes[prop] = [current, 0];
      } else {
        // @ts-ignore
        const current = TinyHtml.getAnimateData(el, prop) || style[prop];
        TinyHtml.setAnimateData(el, prop, current);
        keyframes[prop] = [current, 0];
      }
    },
  };

  /**
   * Returns a shallow-cloned copy of the property effect handlers.
   *
   * @returns {StyleEffectsProps}
   */
  static get styleEffectsProps() {
    return { ...TinyHtml.#styleEffectsProps };
  }

  /**
   * Replace the entire styleEffectsProps map with a new one.
   *
   * @param {StyleEffectsProps} value
   */
  static set styleEffectsProps(value) {
    if (typeof value !== 'object' || value === null || Array.isArray(value))
      throw new TypeError('styleEffectsProps must be an object');

    for (const [k, fn] of Object.entries(value)) {
      if (typeof fn !== 'function')
        throw new TypeError(`styleEffectsProps["${k}"] must be a function`);
    }

    TinyHtml.#styleEffectsProps = {};
    for (const [k, fn] of Object.entries(value)) TinyHtml.setStyleEffectProp(k, fn);
  }

  /**
   * Get a style effect property handler by name.
   *
   * @param {string} name - The property handler name.
   * @returns {StyleEffectsFn | null} The handler function, or undefined if not found.
   */
  static getStyleEffectProp(name) {
    if (typeof name !== 'string') throw new TypeError('The "name" parameter must be a string.');
    return TinyHtml.#styleEffectsProps[name] || null;
  }

  /**
   * Register or overwrite a style effect property handler.
   *
   * @param {string} name - The property handler name.
   * @param {StyleEffectsFn} fn - The handler function.
   * @throws {TypeError} If fn is not a function.
   */
  static setStyleEffectProp(name, fn) {
    if (typeof name !== 'string') throw new TypeError('The "name" parameter must be a string.');
    if (typeof fn !== 'function')
      throw new TypeError(`styleEffectsProps["${name}"] must be a function`);
    TinyHtml.#styleEffectsProps[name] = fn;
  }

  /**
   * Delete a style effect property handler by name.
   *
   * @param {string} name - The property handler name to delete.
   * @returns {boolean} True if deleted, false otherwise.
   */
  static deleteStyleEffectProp(name) {
    if (typeof name !== 'string') throw new TypeError('The "name" parameter must be a string.');
    return delete TinyHtml.#styleEffectsProps[name];
  }

  /**
   * Check if a style effect property handler exists.
   *
   * @param {string} name - The property handler name to check.
   * @returns {boolean} True if the handler exists, false otherwise.
   */
  static hasStyleEffectProp(name) {
    if (typeof name !== 'string') throw new TypeError('The "name" parameter must be a string.');
    return Object.prototype.hasOwnProperty.call(TinyHtml.#styleEffectsProps, name);
  }

  // TITLE: Gen Style FX Manager

  /**
   * Generates effect parameters to create standard animations.
   *
   * @param {string} type - The effect type.
   * @param {boolean} [includeWidth=false] - Whether width (and opacity) should be included.
   * @returns {Record<string, string>} - A mapping of CSS properties to effect type.
   */
  static genStyleFx(type, includeWidth = false) {
    if (typeof type !== 'string') throw new TypeError('genStyleFx: type must be a string.');
    if (typeof includeWidth !== 'boolean')
      throw new TypeError('genStyleFx: includeWidth must be a boolean.');

    /** @type {string} */
    let which;
    /** @type {number} */
    let i = 0;
    /** @type {Record<string, string>} */
    const attrs = { height: type };

    const includeWidthNb = includeWidth ? 1 : 0;
    for (; i < 4; i += 2 - includeWidthNb) {
      which = TinyHtml.#cssExpand[i];
      attrs['margin' + which] = type;
      attrs['padding' + which] = type;
    }

    if (includeWidth) {
      attrs.opacity = type;
      attrs.width = type;
    }

    return attrs;
  }

  /**
   * Applies style-based effects (slide, fade) to one or more elements.
   * Converts abstract effect definitions (e.g., `{ height: "show" }`)
   * into concrete Web Animations API keyframes.
   *
   * @param {TinyHtmlElement|TinyHtmlElement[]} el - A single element or an array of elements.
   * @param {string} id - The style effect id.
   * @param {StyleEffects} props - The style effect definition.
   * @param {number | KeyframeAnimationOptions | string} [ops] - Timing options.
   * @returns {StyleFxResult}
   */
  static applyStyleFx(el, id, props, ops) {
    if (typeof id !== 'string') throw new TypeError('applyStyleFx: id must be a string.');
    if (typeof props !== 'object' || props === null)
      throw new TypeError('applyStyleFx: props must be a non-null object.');
    if (
      ops !== undefined &&
      !(
        typeof ops === 'number' ||
        typeof ops === 'string' ||
        (typeof ops === 'object' && ops !== null)
      )
    )
      throw new TypeError(
        'applyStyleFx: ops must be a number, string, KeyframeAnimationOptions, or undefined.',
      );

    /** @type {StyleFxResult} */
    const results = new Map();
    TinyHtml._preHtmlElems(el, 'applyStyleFx').forEach((first) => {
      /**
       * Generate keyframes based on props
       * @type {AnimationSfxData}
       */
      const keyframes = {};
      for (const [prop, action] of Object.entries(props)) {
        if (typeof action === 'string' && this.#styleEffectsProps[action]) {
          const style = getComputedStyle(first);
          this.#styleEffectsProps[action](first, keyframes, prop, style);
        } else if (typeof action === 'object') {
          keyframes[prop] = action;
        } else {
          throw new TypeError(
            `applyStyleFx: invalid action for prop "${prop}". Must be string or array.`,
          );
        }
      }

      const isRepeat =
        typeof TinyHtml.#styleEffectsRd[id] === 'function'
          ? TinyHtml.#styleEffectsRd[id](keyframes)
          : false;
      if (isRepeat) {
        results.set(first, null);
        return;
      }

      /**
       *  Build Web Animations keyframe objects
       * @type {Keyframe[]}
       */
      const kf = [];
      const numFrames = keyframes[Object.keys(keyframes)[0]].length; // assume que todos têm o mesmo tamanho
      for (let i = 0; i < numFrames; i++) {
        /** @type {Keyframe} */
        const frame = {};
        for (const prop in keyframes) {
          frame[prop] = keyframes[prop][i];
        }
        kf.push(frame);
      }

      results.set(first, TinyHtml.animate(el, kf, ops, id)[0]);
    });
    return results;
  }

  /**
   * Applies style-based effects (slide, fade) to one or more elements.
   * Converts abstract effect definitions (e.g., `{ height: "show" }`)
   * into concrete Web Animations API keyframes.
   *
   * @param {string} id - The style effect id.
   * @param {StyleEffects} props - The style effect definition.
   * @param {number | KeyframeAnimationOptions} [ops] - Timing options.
   * @returns {StyleFxResult}
   */
  applyStyleFx(id, props, ops) {
    return TinyHtml.applyStyleFx(this, id, props, ops);
  }

  // TITLE: Animate Stuff

  /**
   * Get the current animation entry for a given element.
   * @param {HTMLElement} el - The target element.
   * @returns {string|null|undefined} Returns string or null to animation.
   */
  static getCurrentAnimationId(el) {
    if (!(el instanceof HTMLElement)) throw new TypeError('Expected an HTMLElement.');
    return __elementCurrentAnimation.get(el)?.id ?? undefined;
  }

  /**
   * Applies an animation to one or multiple TinyElement instances.
   *
   * If `cancelOldAnim` is true, any currently running animation on the same element
   * will be cancelled before the new one starts.
   *
   * @param {TinyHtmlElement|TinyHtmlElement[]} el - A single TinyElement or an array of TinyElements to animate.
   * @param {Keyframe[] | PropertyIndexedKeyframes | null} keyframes - Keyframes that define the animation.
   * @param {number | KeyframeAnimationOptions | string} [ops] - Timing or configuration options for the animation.
   * @param {string|null} [id] - The style effect id.
   * @param {boolean} [cancelOldAnim=TinyHtml.cancelOldStyleFx] - Whether to cancel previous animations on the same element.
   * @returns {Animation[]}
   */
  static animate(
    el,
    keyframes,
    ops = TinyHtml.#styleFxSpeeds._default,
    id = null,
    cancelOldAnim = TinyHtml.#cancelOldStyleFx,
  ) {
    /** @type {number | KeyframeAnimationOptions}  */
    const fxSpeed =
      typeof ops === 'string'
        ? (TinyHtml.#styleFxSpeeds[ops] ?? undefined)
        : typeof ops !== 'number'
          ? { ...ops }
          : ops;

    if (typeof fxSpeed === 'object' && typeof fxSpeed.fill === 'undefined') {
      fxSpeed.fill = 'forwards';
    }

    /** @type {Animation[]} */
    const results = [];
    TinyHtml._preHtmlElems(el, 'animate').forEach((elem) => {
      if (cancelOldAnim) {
        const prevAnim = __elementCurrentAnimation.get(elem);
        if (prevAnim) prevAnim.animation.cancel();
      }

      const anim = elem.animate(keyframes, fxSpeed);
      results.push(anim);
      __elementCurrentAnimation.set(elem, { animation: anim, id: id ?? '' });
      anim.addEventListener('finish', () => {
        if (__elementCurrentAnimation.get(elem)?.animation === anim)
          __elementCurrentAnimation.delete(elem);
      });
    });

    return results;
  }

  /**
   * Applies an animation to one or multiple TinyElement instances.
   *
   * If `cancelOldAnim` is true, any currently running animation on the same element
   * will be cancelled before the new one starts.
   *
   * @param {Keyframe[] | PropertyIndexedKeyframes | null} keyframes - Keyframes that define the animation.
   * @param {number | KeyframeAnimationOptions | string} [ops] - Timing or configuration options for the animation.
   * @param {string|null} [id] - The style effect id.
   * @param {boolean} [cancelOldAnim=TinyHtml.cancelOldStyleFx] - Whether to cancel previous animations on the same element.
   * @returns {Animation[]}
   */
  animate(keyframes, ops, id, cancelOldAnim) {
    return TinyHtml.animate(this, keyframes, ops, id, cancelOldAnim);
  }

  /**
   * Stops the current animation(s) on one or multiple TinyElement instances.
   *
   * If an animation is running on the element(s), it will be cancelled immediately.
   *
   * @param {TinyHtmlElement|TinyHtmlElement[]} el - A single TinyElement or an array of TinyElements.
   * @returns {boolean[]} The same element(s) provided as input, for chaining.
   */
  static stop(el) {
    /** @type {boolean[]} */
    const results = [];
    TinyHtml._preHtmlElems(el, 'stop').forEach((elem) => {
      const anim = __elementCurrentAnimation.get(elem);
      if (anim) {
        anim.animation.cancel();
        __elementCurrentAnimation.delete(elem);
        results.push(true);
      } else results.push(false);
    });
    return results;
  }

  /**
   * Stops the current animation(s) on this TinyElement instance.
   *
   * @returns {boolean[]}
   */
  stop() {
    return TinyHtml.stop(this);
  }

  // TITLE: Animate FXs

  /**
   * Show animation (slideDown).
   * @param {TinyHtmlElement|TinyHtmlElement[]} el
   * @param {number | KeyframeAnimationOptions | string} [ops]
   * @returns {StyleFxResult}
   */
  static slideDown(el, ops) {
    return TinyHtml.applyStyleFx(
      el,
      'slideDown',
      this.#styleEffects['slideDown'],
      ops ?? { duration: 500, easing: 'ease-out' },
    );
  }

  /**
   * Show animation (slideDown).
   * @param {number | KeyframeAnimationOptions | string} [ops]
   * @returns {StyleFxResult}
   */
  slideDown(ops) {
    return TinyHtml.slideDown(this, ops);
  }

  /**
   * Hide animation (slideUp).
   * @param {TinyHtmlElement|TinyHtmlElement[]} el
   * @param {number | KeyframeAnimationOptions | string} [ops]
   * @returns {StyleFxResult}
   */
  static slideUp(el, ops) {
    return TinyHtml.applyStyleFx(
      el,
      'slideUp',
      this.#styleEffects['slideUp'],
      ops ?? { duration: 500, easing: 'ease-out' },
    );
  }

  /**
   * Hide animation (slideUp).
   * @param {number | KeyframeAnimationOptions | string} [ops]
   * @returns {StyleFxResult}
   */
  slideUp(ops) {
    return TinyHtml.slideUp(this, ops);
  }

  /**
   * Toggle slide animation.
   * @param {TinyHtmlElement|TinyHtmlElement[]} el
   * @param {number | KeyframeAnimationOptions | string} [ops]
   * @returns {StyleFxResult}
   */
  static slideToggle(el, ops) {
    const first = TinyHtml._preHtmlElem(el, 'slideToggle');
    const style = getComputedStyle(first);
    const id = TinyHtml.getCurrentAnimationId(first);
    const isHidden = style.display === 'none' || first.offsetHeight === 0;
    return (typeof id === 'string' ? id === 'slideUp' : isHidden)
      ? TinyHtml.slideDown(el, ops)
      : TinyHtml.slideUp(el, ops);
  }

  /**
   * Toggle slide animation.
   * @param {number | KeyframeAnimationOptions | string} [ops]
   * @returns {StyleFxResult}
   */
  slideToggle(ops) {
    return TinyHtml.slideToggle(this, ops);
  }

  /**
   * Fade in animation.
   * @param {TinyHtmlElement|TinyHtmlElement[]} el
   * @param {number | KeyframeAnimationOptions | string} [ops]
   * @returns {StyleFxResult}
   */
  static fadeIn(el, ops) {
    return TinyHtml.applyStyleFx(el, 'fadeIn', this.#styleEffects['fadeIn'], ops);
  }

  /**
   * Fade in animation.
   * @param {number | KeyframeAnimationOptions | string} [ops]
   * @returns {StyleFxResult}
   */
  fadeIn(ops) {
    return TinyHtml.fadeIn(this, ops);
  }

  /**
   * Fade out animation.
   * @param {TinyHtmlElement|TinyHtmlElement[]} el
   * @param {number | KeyframeAnimationOptions | string} [ops]
   * @returns {StyleFxResult}
   */
  static fadeOut(el, ops) {
    return TinyHtml.applyStyleFx(el, 'fadeOut', this.#styleEffects['fadeOut'], ops);
  }

  /**
   * Fade out animation.
   * @param {number | KeyframeAnimationOptions | string} [ops]
   * @returns {StyleFxResult}
   */
  fadeOut(ops) {
    return TinyHtml.fadeOut(this, ops);
  }

  /**
   * Fade toggle animation.
   * @param {TinyHtmlElement|TinyHtmlElement[]} el
   * @param {number | KeyframeAnimationOptions | string} [ops]
   * @returns {StyleFxResult}
   */
  static fadeToggle(el, ops) {
    const first = TinyHtml._preHtmlElem(el, 'fadeToggle');
    const style = getComputedStyle(first);
    const id = TinyHtml.getCurrentAnimationId(first);
    const isHidden = style.opacity === '0' || first.offsetParent === null;
    return (typeof id === 'string' ? id === 'fadeOut' : isHidden)
      ? TinyHtml.fadeIn(el, ops)
      : TinyHtml.fadeOut(el, ops);
  }

  /**
   * Fade toggle animation.
   * @param {number | KeyframeAnimationOptions | string} [ops]
   * @returns {StyleFxResult}
   */
  fadeToggle(ops) {
    return TinyHtml.fadeToggle(this, ops);
  }

  /**
   * Animate the opacity of elements to a target value.
   * If the element is hidden (display:none), it will be made visible first
   * so the fade animation can occur.
   *
   * @param {TinyHtmlElement|TinyHtmlElement[]} el - Target element(s) to fade.
   * @param {number} opacity - Final opacity value (between 0 and 1).
   * @param {number | KeyframeAnimationOptions | string} [ops] - Duration or animation options.
   * @param {string} [mainDisplay=TinyHtml.#defaultDisplay] - Sets the main display value.
   * @returns {StyleFxResult}
   * @throws {TypeError} If opacity is not a number between 0 and 1.
   * @throws {TypeError} If ops is not number|string|object when provided.
   */
  static fadeTo(el, opacity, ops, mainDisplay = TinyHtml.#defaultDisplay) {
    if (typeof opacity !== 'number' || isNaN(opacity) || opacity < 0 || opacity > 1)
      throw new TypeError('fadeTo: opacity must be a number between 0 and 1.');

    if (
      ops !== undefined &&
      !(
        typeof ops === 'number' ||
        typeof ops === 'string' ||
        (typeof ops === 'object' && ops !== null)
      )
    ) {
      throw new TypeError(
        'fadeTo: ops must be a number, string, KeyframeAnimationOptions, or undefined.',
      );
    }

    /** @type {StyleFxResult} */
    const results = new Map();
    TinyHtml._preHtmlElems(el, 'fadeTo').forEach((elem) => {
      const style = getComputedStyle(elem);
      const isHidden = !(el instanceof Element)
        ? true
        : !(el.offsetWidth || el.offsetHeight || el.getClientRects().length);

      if (isHidden) {
        // Ensure element is visible (like jQuery does before fading)
        const display = TinyHtml.getAnimateData(elem, `origdisplay`);
        elem.style.display = typeof display === 'string' ? display : mainDisplay;
      }

      /** @type {AnimationSfxData} */
      const keyframes = {
        opacity: [style.opacity, opacity],
      };

      // Build keyframe objects for Web Animations
      const kf = keyframes.opacity.map((val) => ({ opacity: val }));

      results.set(elem, TinyHtml.animate(elem, kf, ops, 'fadeTo')[0]);
    });

    return results;
  }

  /**
   * Animate the opacity of elements to a target value.
   * If the element is hidden (display:none), it will be made visible first
   * so the fade animation can occur.
   *
   * @param {number} opacity - Final opacity value (between 0 and 1).
   * @param {number | KeyframeAnimationOptions | string} [ops] - Duration or animation options.
   * @param {string} [mainDisplay=this.#mainDisplay] - Sets the main display value.
   * @returns {StyleFxResult}
   * @throws {TypeError} If opacity is not a number between 0 and 1.
   * @throws {TypeError} If ops is not number|string|object when provided.
   */
  fadeTo(opacity, ops, mainDisplay = this.#mainDisplay) {
    return TinyHtml.fadeTo(this, opacity, ops, mainDisplay);
  }

  ///////////////////////////////////////////////////////////////

  // TITLE: DOM Positions

  /**
   * Gets the offset of the element relative to the document.
   * @param {TinyElement} el - Target element.
   * @returns {{top: number, left: number}}
   */
  static offset(el) {
    const elem = TinyHtml._preElem(el, 'offset');
    const rect = elem.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollLeft = window.scrollX || document.documentElement.scrollLeft;

    return {
      top: rect.top + scrollTop,
      left: rect.left + scrollLeft,
    };
  }

  /**
   * Gets the offset of the element relative to the document.
   * @returns {{top: number, left: number}}
   */
  offset() {
    return TinyHtml.offset(this);
  }

  /**
   * Gets the position of the element relative to its offset parent.
   * @param {TinyHtmlElement} el - Target element.
   * @returns {{top: number, left: number}}
   */
  static position(el) {
    const elem = TinyHtml._preHtmlElem(el, 'position');

    let offsetParent;
    let offset;
    let parentOffset = { top: 0, left: 0 };

    const computedStyle = window.getComputedStyle(elem);

    if (computedStyle.position === 'fixed') {
      offset = elem.getBoundingClientRect();
    } else {
      offset = TinyHtml.offset(elem);

      offsetParent = elem.offsetParent || document.documentElement;
      const { position } = window.getComputedStyle(offsetParent);

      while (
        offsetParent instanceof HTMLElement &&
        (offsetParent === document.body || offsetParent === document.documentElement) &&
        position === 'static'
      ) {
        offsetParent = offsetParent.parentNode;
      }

      if (
        offsetParent instanceof HTMLElement &&
        offsetParent !== elem &&
        offsetParent.nodeType === 1
      ) {
        const { borderTopWidth, borderLeftWidth } = TinyHtml.cssFloats(offsetParent, [
          'borderTopWidth',
          'borderLeftWidth',
        ]);
        parentOffset = TinyHtml.offset(offsetParent);
        parentOffset.top += borderTopWidth;
        parentOffset.left += borderLeftWidth;
      }
    }

    return {
      top: offset.top - parentOffset.top - TinyHtml.cssFloat(elem, 'marginTop'),
      left: offset.left - parentOffset.left - TinyHtml.cssFloat(elem, 'marginLeft'),
    };
  }

  /**
   * Gets the position of the element relative to its offset parent.
   * @returns {{top: number, left: number}}
   */
  position() {
    return TinyHtml.position(this);
  }

  /**
   * Gets the closest positioned ancestor element.
   * @param {TinyHtmlElement} el - Target element.
   * @returns {HTMLElement} - Offset parent element.
   */
  static offsetParent(el) {
    const elem = TinyHtml._preHtmlElem(el, 'offsetParent');
    let offsetParent = elem.offsetParent;

    while (
      offsetParent instanceof HTMLElement &&
      window.getComputedStyle(offsetParent).position === 'static'
    ) {
      offsetParent = offsetParent.offsetParent;
    }

    // Fallback to document.documentElement
    return offsetParent instanceof HTMLElement ? offsetParent : document.documentElement;
  }

  /**
   * Gets the closest positioned ancestor element.
   * @returns {HTMLElement} - Offset parent element.
   */
  offsetParent() {
    return TinyHtml.offsetParent(this);
  }

  /////////////////////////////////////////////////

  // TITLE: Scroll Stuff

  /**
   * Gets the vertical scroll position.
   * @param {TinyElementAndWindow} el - Element or window.
   * @returns {number}
   */
  static scrollTop(el) {
    const elem = TinyHtml._preElemAndWindow(el, 'scrollTop');
    if (TinyHtml.isWindow(elem)) return elem.pageYOffset;
    // @ts-ignore
    if (elem.nodeType === 9) return elem.defaultView.pageYOffset;
    return elem.scrollTop;
  }

  /**
   * Gets the vertical scroll position.
   * @returns {number}
   */
  scrollTop() {
    return TinyHtml.scrollTop(this);
  }

  /**
   * Gets the horizontal scroll position.
   * @param {TinyElementAndWindow} el - Element or window.
   * @returns {number}
   */
  static scrollLeft(el) {
    const elem = TinyHtml._preElemAndWindow(el, 'scrollLeft');
    if (TinyHtml.isWindow(elem)) return elem.pageXOffset;
    // @ts-ignore
    if (elem.nodeType === 9) return elem.defaultView.pageXOffset;
    return elem.scrollLeft;
  }

  /**
   * Gets the horizontal scroll position.
   * @returns {number}
   */
  scrollLeft() {
    return TinyHtml.scrollLeft(this);
  }

  /**
   * Collection of easing functions used for scroll and animation calculations.
   * Each function receives a normalized time value (`t` from 0 to 1) and returns the eased progress.
   *
   * @type {Record<string, (t: number) => number>}
   */
  static easings = {
    linear: (t) => t,
    easeInQuad: (t) => t * t,
    easeOutQuad: (t) => t * (2 - t),
    easeInOutQuad: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
    easeInCubic: (t) => t * t * t,
    easeOutCubic: (t) => --t * t * t + 1,
    easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
  };

  /**
   * Smoothly scrolls one or more elements (or the window) to the specified X and Y coordinates
   * using a custom duration and easing function.
   *
   * If `duration` or a valid `easing` is not provided, the scroll will be performed immediately.
   *
   * @template {TinyElementAndWindow|TinyElementAndWindow[]} T
   * @param {T} el - A single element, array of elements, or the window to scroll.
   * @param {Object} [settings={}] - Configuration object for the scroll animation.
   * @param {number} [settings.targetX] - The horizontal scroll target in pixels.
   * @param {number} [settings.targetY] - The vertical scroll target in pixels.
   * @param {number} [settings.duration] - The duration of the animation in milliseconds.
   * @param {Easings} [settings.easing] - The easing function name to use for the scroll animation.
   * @param {OnScrollAnimation} [settings.onAnimation] - Optional callback invoked on each animation
   *   frame with the current scroll position, normalized animation time (`0` to `1`), and a completion flag.
   * @returns {T}
   * @throws {TypeError} If `el` is not a valid element, array, or window.
   * @throws {TypeError} If `targetX` or `targetY` is defined but not a number.
   * @throws {TypeError} If `duration` is defined but not a number.
   * @throws {TypeError} If `easing` is defined but not a valid easing function name.
   * @throws {TypeError} If `onAnimation` is defined but not a function.
   */
  static scrollToXY(el, { targetX, targetY, duration, easing, onAnimation } = {}) {
    if (targetX !== undefined && typeof targetX !== 'number')
      throw new TypeError('`targetX` must be a number if provided.');
    if (targetY !== undefined && typeof targetY !== 'number')
      throw new TypeError('`targetY` must be a number if provided.');
    if (duration !== undefined && typeof duration !== 'number')
      throw new TypeError('`duration` must be a number if provided.');
    if (easing !== undefined && typeof easing !== 'string')
      throw new TypeError('`easing` must be a string if provided.');
    if (easing !== undefined && typeof TinyHtml.easings[easing] !== 'function')
      throw new TypeError(`Unknown easing function: "${easing}".`);
    if (onAnimation !== undefined && typeof onAnimation !== 'function')
      throw new TypeError('`onAnimation` must be a function if provided.');

    /**
     * Performs an instant scroll to the given coordinates.
     *
     * @param {ElementAndWindow} elem - The element or window to scroll.
     * @param {number} newX - The final horizontal scroll position.
     * @param {number} newY - The final vertical scroll position.
     * @param {number} time - Normalized progress value.
     */
    const executeScroll = (elem, newX, newY, time) => {
      if (elem instanceof Window) {
        window.scrollTo(newX, newY);
      } else if (elem.nodeType === 9) {
        // @ts-ignore
        elem.defaultView.scrollTo(newX, newY);
      } else {
        const startX = elem instanceof Window ? window.scrollX : elem.scrollLeft;
        const startY = elem instanceof Window ? window.scrollY : elem.scrollTop;
        if (startX !== newX) elem.scrollLeft = newX;
        if (startY !== newY) elem.scrollTop = newY;
      }
      if (typeof onAnimation === 'function')
        onAnimation({ x: newX, y: newY, isComplete: time >= 1, time });
    };

    TinyHtml._preElemsAndWindow(el, 'scrollToXY').forEach((elem) => {
      const startX = elem instanceof Window ? window.scrollX : elem.scrollLeft;
      const startY = elem instanceof Window ? window.scrollY : elem.scrollTop;
      const targX = targetX ?? startX;
      const targY = targetY ?? startY;

      const changeX = targX - startX;
      const changeY = targY - startY;

      const ease = (typeof easing === 'string' && TinyHtml.easings[easing]) || null;
      if (typeof duration !== 'number' || typeof ease !== 'function')
        return executeScroll(elem, targX, targY, 1);
      const startTime = performance.now();
      const dur = duration ?? 0;

      /**
       * Animates the scroll position based on easing and time.
       *
       * @param {number} currentTime - Timestamp provided by requestAnimationFrame.
       */
      function animateScroll(currentTime) {
        if (typeof ease !== 'function') return;
        const time = Math.min(1, (currentTime - startTime) / dur);
        const easedTime = ease(time);

        const newX = startX + changeX * easedTime;
        const newY = startY + changeY * easedTime;
        executeScroll(elem, newX, newY, time);

        if (time < 1) requestAnimationFrame(animateScroll);
      }

      requestAnimationFrame(animateScroll);
    });
    return el;
  }

  /**
   * Smoothly scrolls one or more elements (or the window) to the specified X and Y coordinates
   * using a custom duration and easing function.
   *
   * If `duration` or a valid `easing` is not provided, the scroll will be performed immediately.
   *
   * @param {Object} [settings={}] - Configuration object for the scroll animation.
   * @param {number} [settings.targetX] - The horizontal scroll target in pixels.
   * @param {number} [settings.targetY] - The vertical scroll target in pixels.
   * @param {number} [settings.duration] - The duration of the animation in milliseconds.
   * @param {Easings} [settings.easing] - The easing function name to use for the scroll animation.
   * @param {OnScrollAnimation} [settings.onAnimation] - Optional callback invoked on each animation
   *   frame with the current scroll position, normalized animation time (`0` to `1`), and a completion flag.
   * @returns {this}
   */
  scrollToXY({ targetX, targetY, duration, easing, onAnimation } = {}) {
    return TinyHtml.scrollToXY(this, { targetX, targetY, duration, easing, onAnimation });
  }

  /**
   * Sets the vertical scroll position.
   * @template {TinyElementAndWindow|TinyElementAndWindow[]} T
   * @param {T} el - Element or window.
   * @param {number} value - Scroll top value.
   * @returns {T}
   */
  static setScrollTop(el, value) {
    if (typeof value !== 'number') throw new TypeError('ScrollTop value must be a number.');
    return TinyHtml.scrollToXY(el, { targetY: value });
  }

  /**
   * Sets the vertical scroll position.
   * @param {number} value - Scroll top value.
   * @returns {this}
   */
  setScrollTop(value) {
    return TinyHtml.setScrollTop(this, value);
  }

  /**
   * Sets the horizontal scroll position.
   * @template {TinyElementAndWindow|TinyElementAndWindow[]} T
   * @param {T} el - Element or window.
   * @param {number} value - Scroll left value.
   * @returns {T}
   */
  static setScrollLeft(el, value) {
    if (typeof value !== 'number') throw new TypeError('ScrollLeft value must be a number.');
    return TinyHtml.scrollToXY(el, { targetX: value });
  }

  /**
   * Sets the horizontal scroll position.
   * @param {number} value - Scroll left value.
   * @returns {this}
   */
  setScrollLeft(value) {
    return TinyHtml.setScrollLeft(this, value);
  }

  ///////////////////////////////////////////

  // TITLE: Border Stuff

  /**
   * Returns the total border width and individual sides from `border{Side}Width` CSS properties.
   *
   * @param {TinyElement} el - The target DOM element.
   * @returns {HtmlElBoxSides} - Total horizontal (x) and vertical (y) border widths, and each side individually.
   */
  static borderWidth(el) {
    const elem = TinyHtml._preElem(el, 'borderWidth');
    const {
      borderLeftWidth: left,
      borderRightWidth: right,
      borderTopWidth: top,
      borderBottomWidth: bottom,
    } = TinyHtml.cssFloats(elem, [
      'borderLeftWidth',
      'borderRightWidth',
      'borderTopWidth',
      'borderBottomWidth',
    ]);
    const x = left + right;
    const y = top + bottom;

    return { x, y, left, right, top, bottom };
  }

  /**
   * Returns the total border width and individual sides from `border{Side}Width` CSS properties.
   *
   * @returns {HtmlElBoxSides} - Total horizontal (x) and vertical (y) border widths, and each side individually.
   */
  borderWidth() {
    return TinyHtml.borderWidth(this);
  }

  /**
   * Returns the total border size and individual sides from `border{Side}` CSS properties.
   *
   * @param {TinyElement} el - The target DOM element.
   * @returns {HtmlElBoxSides} - Total horizontal (x) and vertical (y) border sizes, and each side individually.
   */
  static border(el) {
    const elem = TinyHtml._preElem(el, 'border');
    const {
      borderLeft: left,
      borderRight: right,
      borderTop: top,
      borderBottom: bottom,
    } = TinyHtml.cssFloats(elem, ['borderLeft', 'borderRight', 'borderTop', 'borderBottom']);
    const x = left + right;
    const y = top + bottom;

    return { x, y, left, right, top, bottom };
  }

  /**
   * Returns the total border size and individual sides from `border{Side}` CSS properties.
   *
   * @returns {HtmlElBoxSides} - Total horizontal (x) and vertical (y) border sizes, and each side individually.
   */
  border() {
    return TinyHtml.border(this);
  }

  /**
   * Returns the total margin and individual sides from `margin{Side}` CSS properties.
   *
   * @param {TinyElement} el - The target DOM element.
   * @returns {HtmlElBoxSides} - Total horizontal (x) and vertical (y) margins, and each side individually.
   */
  static margin(el) {
    const elem = TinyHtml._preElem(el, 'margin');
    const {
      marginLeft: left,
      marginRight: right,
      marginTop: top,
      marginBottom: bottom,
    } = TinyHtml.cssFloats(elem, ['marginLeft', 'marginRight', 'marginTop', 'marginBottom']);
    const x = left + right;
    const y = top + bottom;

    return { x, y, left, right, top, bottom };
  }

  /**
   * Returns the total margin and individual sides from `margin{Side}` CSS properties.
   *
   * @returns {HtmlElBoxSides} - Total horizontal (x) and vertical (y) margins, and each side individually.
   */
  margin() {
    return TinyHtml.margin(this);
  }

  /**
   * Returns the total padding and individual sides from `padding{Side}` CSS properties.
   *
   * @param {TinyElement} el - The target DOM element.
   * @returns {HtmlElBoxSides} - Total horizontal (x) and vertical (y) paddings, and each side individually.
   */
  static padding(el) {
    const elem = TinyHtml._preElem(el, 'padding');
    const {
      paddingLeft: left,
      paddingRight: right,
      paddingTop: top,
      paddingBottom: bottom,
    } = TinyHtml.cssFloats(elem, ['paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom']);
    const x = left + right;
    const y = top + bottom;

    return { x, y, left, right, top, bottom };
  }

  /**
   * Returns the total padding and individual sides from `padding{Side}` CSS properties.
   *
   * @returns {HtmlElBoxSides} - Total horizontal (x) and vertical (y) paddings, and each side individually.
   */
  padding() {
    return TinyHtml.padding(this);
  }

  /////////////////////////////////////////////

  // TITLE: Class Stuff

  /** @type {boolean} */
  static #classCanWhitespace = false;

  /**
   * Gets the value of classCanWhitespace.
   * @returns {boolean}
   */
  static get classCanWhitespace() {
    return this.#classCanWhitespace;
  }

  /**
   * Sets the value of classCanWhitespace.
   * @param {boolean} value
   */
  static set classCanWhitespace(value) {
    if (typeof value !== 'boolean') throw new TypeError('classCanWhitespace must be a boolean');
    this.#classCanWhitespace = value;
  }

  /**
   * Adds one or more CSS class names to the element.
   * @template {TinyElement|TinyElement[]} T
   * @param {T} el
   * @param {...string} args - One or more class names to add.
   * @returns {T}
   */
  static addClass(el, ...args) {
    /** @type {string[]} */
    const classes = [];
    for (const name of args) {
      if (!TinyHtml.#classCanWhitespace) classes.push(name);
      else {
        const classesList = name.split(' ');
        for (const name2 of classesList) classes.push(name2);
      }
    }

    TinyHtml._preElems(el, 'addClass').forEach((elem) => elem.classList.add(...classes));
    return el;
  }

  /**
   * Adds one or more CSS class names to the element.
   * @param {...string} args - One or more class names to add.
   * @returns {this}
   */
  addClass(...args) {
    return TinyHtml.addClass(this, ...args);
  }

  /**
   * Removes one or more CSS class names from the element.
   * @template {TinyElement|TinyElement[]} T
   * @param {T} el
   * @param {...string} args - One or more class names to remove.
   * @returns {T}
   */
  static removeClass(el, ...args) {
    /** @type {string[]} */
    const classes = [];
    for (const name of args) {
      if (!TinyHtml.#classCanWhitespace) classes.push(name);
      else {
        const classesList = name.split(' ');
        for (const name2 of classesList) classes.push(name2);
      }
    }

    TinyHtml._preElems(el, 'removeClass').forEach((elem) => elem.classList.remove(...classes));
    return el;
  }

  /**
   * Removes one or more CSS class names from the element.
   * @param {...string} args - One or more class names to remove.
   * @returns {this}
   */
  removeClass(...args) {
    return TinyHtml.removeClass(this, ...args);
  }

  /**
   * Replaces an existing class name with a new one.
   * @param {TinyElement|TinyElement[]} el - Target element.
   * @param {string} token - The class name to be replaced.
   * @param {string} newToken - The new class name to apply.
   * @returns {boolean[]} Whether the replacement was successful.
   * @throws {TypeError} If either argument is not a string.
   */
  static replaceClass(el, token, newToken) {
    if (typeof token !== 'string') throw new TypeError('The "token" parameter must be a string.');
    if (typeof newToken !== 'string')
      throw new TypeError('The "newToken" parameter must be a string.');
    /** @type {boolean[]} */
    const result = [];
    TinyHtml._preElems(el, 'replaceClass').forEach((elem) =>
      result.push(elem.classList.replace(token, newToken)),
    );
    return result;
  }

  /**
   * Replaces an existing class name with a new one.
   * @param {string} token - The class name to be replaced.
   * @param {string} newToken - The new class name to apply.
   * @returns {boolean} Whether the replacement was successful.
   * @throws {TypeError} If either argument is not a string.
   */
  replaceClass(token, newToken) {
    return TinyHtml.replaceClass(this, token, newToken)[0];
  }

  /**
   * Returns the class name at the specified index.
   * @param {TinyElement} el - Target element.
   * @param {number} index - The index of the class name.
   * @returns {string|null} The class name at the index or null if not found.
   * @throws {TypeError} If the index is not a number.
   */
  static classItem(el, index) {
    const elem = TinyHtml._preElem(el, 'classItem');
    if (typeof index !== 'number') throw new TypeError('The "index" parameter must be a number.');
    return elem.classList.item(index);
  }

  /**
   * Returns the class name at the specified index.
   * @param {number} index - The index of the class name.
   * @returns {string|null} The class name at the index or null if not found.
   * @throws {TypeError} If the index is not a number.
   */
  classItem(index) {
    return TinyHtml.classItem(this, index);
  }

  /**
   * Toggles a class name on the element with an optional force boolean.
   * @param {TinyElement|TinyElement[]} el - Target element.
   * @param {string} token - The class name to toggle.
   * @param {boolean} [force] - If true, adds the class; if false, removes it.
   * @returns {boolean[]} Whether the class is present after the toggle.
   * @throws {TypeError} If token is not a string or force is not a boolean.
   */
  static toggleClass(el, token, force) {
    if (typeof token !== 'string') throw new TypeError('The "token" parameter must be a string.');
    if (typeof force !== 'undefined' && typeof force !== 'boolean')
      throw new TypeError('The "force" parameter must be a boolean.');
    /** @type {boolean[]} */
    const result = [];
    TinyHtml._preElems(el, 'toggleClass').forEach((elem) =>
      result.push(elem.classList.toggle(token, force)),
    );
    return result;
  }

  /**
   * Toggles a class name on the element with an optional force boolean.
   * @param {string} token - The class name to toggle.
   * @param {boolean} force - If true, adds the class; if false, removes it.
   * @returns {boolean} Whether the class is present after the toggle.
   * @throws {TypeError} If token is not a string or force is not a boolean.
   */
  toggleClass(token, force) {
    return TinyHtml.toggleClass(this, token, force)[0];
  }

  /**
   * Checks if the element contains the given class name.
   * @param {TinyElement} el - Target element.
   * @param {string} token - The class name to check.
   * @returns {boolean} True if the class is present, false otherwise.
   * @throws {TypeError} If token is not a string.
   */
  static hasClass(el, token) {
    const elem = TinyHtml._preElem(el, 'hasClass');
    if (typeof token !== 'string') throw new TypeError('The "token" parameter must be a string.');
    return elem.classList.contains(token);
  }

  /**
   * Checks if the element contains the given class name.
   * @param {string} token - The class name to check.
   * @returns {boolean} True if the class is present, false otherwise.
   * @throws {TypeError} If token is not a string.
   */
  hasClass(token) {
    return TinyHtml.hasClass(this, token);
  }

  /**
   * Returns the number of classes applied to the element.
   * @param {TinyElement} el - Target element.
   * @returns {number} The number of classes.
   */
  static classLength(el) {
    const elem = TinyHtml._preElem(el, 'classLength');
    return elem.classList.length;
  }

  /**
   * Returns the number of classes applied to the element.
   * @returns {number} The number of classes.
   */
  classLength() {
    return TinyHtml.classLength(this);
  }

  /**
   * Returns all class names as an array of strings.
   * @param {TinyElement} el - Target element.
   * @returns {string[]} An array of class names.
   */
  static classList(el) {
    const elem = TinyHtml._preElem(el, 'classList');
    return elem.classList.values().toArray();
  }

  /**
   * Returns all class names as an array of strings.
   * @returns {string[]} An array of class names.
   */
  classList() {
    return TinyHtml.classList(this);
  }

  /////////////////////////////////////////

  // TITLE: Tag Stuff

  /**
   * Returns the tag name of the element.
   * @param {TinyElement} el - Target element.
   * @returns {string} The tag name in uppercase.
   */
  static tagName(el) {
    const elem = TinyHtml._preElem(el, 'tagName');
    return elem.tagName;
  }

  /**
   * Returns the tag name of the element.
   * @returns {string} The tag name in uppercase.
   */
  tagName() {
    return TinyHtml.tagName(this);
  }

  /**
   * Returns the ID of the element.
   * @param {TinyElement} el - Target element.
   * @returns {string} The element's ID.
   */
  static id(el) {
    const elem = TinyHtml._preElem(el, 'id');
    return elem.id;
  }

  /**
   * Returns the ID of the element.
   * @returns {string} The element's ID.
   */
  get id() {
    return TinyHtml.id(this);
  }

  /**
   * Set the id on an element.
   * @param {string} value - Id name.
   */
  set id(value) {
    TinyHtml.setAttr(this, 'id', value);
  }

  //////////////////////////////////////////////////////////////

  // TITLE: DOM Content Stuff

  /**
   * Returns the BigInt content of the element.
   * @param {TinyElement} el - Target element.
   * @returns {bigint|null} The BigInt content or null if none.
   */
  static toBigInt(el) {
    const elem = TinyHtml._preElem(el, 'toBigInt');
    const txt = elem.textContent?.trim();
    let value = null;
    try {
      value = BigInt(txt ?? '');
    } catch {
      value = null;
    }
    return value;
  }

  /**
   * Returns the BigInt content of the element.
   * @returns {bigint|null}
   */
  toBigInt() {
    return TinyHtml.toBigInt(this);
  }

  /**
   * Set BigInt content of elements.
   * @template {TinyElement|TinyElement[]} T
   * @param {T} el
   * @param {bigint} value
   * @returns {T}
   */
  static setBigInt(el, value) {
    if (typeof value !== 'bigint') throw new Error('Value is not a valid BigInt.');
    const data = value.toString();
    TinyHtml._preElems(el, 'setBigInt').forEach((el) => (el.textContent = data));
    return el;
  }

  /**
   * Set BigInt content of the element.
   * @param {bigint} value
   * @returns {this}
   */
  setBigInt(value) {
    return TinyHtml.setBigInt(this, value);
  }

  /**
   * Returns the Date content of the element.
   * @param {TinyElement} el - Target element.
   * @returns {Date|null} The Date content or null if invalid.
   */
  static toDate(el) {
    const elem = TinyHtml._preElem(el, 'toDate');
    const txt = elem.textContent?.trim();
    if (!txt) return null;
    const d = new Date(txt);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  /**
   * Returns the Date content of the element.
   * @returns {Date|null}
   */
  toDate() {
    return TinyHtml.toDate(this);
  }

  /**
   * Set Date content of elements.
   * @template {TinyElement|TinyElement[]} T
   * @param {T} el
   * @param {Date} value
   * @returns {T}
   */
  static setDate(el, value) {
    if (!(value instanceof Date) || Number.isNaN(value.getTime()))
      throw new Error('Value is not a valid Date.');
    const data = value.toISOString();
    TinyHtml._preElems(el, 'setDate').forEach((el) => (el.textContent = data));
    return el;
  }

  /**
   * Set Date content of the element.
   * @param {Date} value
   * @returns {this}
   */
  setDate(value) {
    return TinyHtml.setDate(this, value);
  }

  /**
   * Returns the JSON content of the element.
   * @param {TinyElement} el - Target element.
   * @returns {any|null} The parsed JSON content or null if invalid.
   */
  static toJson(el) {
    const elem = TinyHtml._preElem(el, 'toJson');
    const txt = elem.textContent?.trim();
    if (!txt) return null;
    try {
      return JSON.parse(txt);
    } catch {
      return null;
    }
  }

  /**
   * Returns the JSON content of the element.
   * @returns {any|null}
   */
  toJson() {
    return TinyHtml.toJson(this);
  }

  /**
   * Set JSON content of elements.
   * @template {TinyElement|TinyElement[]} T
   * @param {T} el
   * @param {any} value - A JavaScript value, usually an object or array, to be converted.
   * @param {(this: any, key: string, value: any) => any} [replacer] - A function that transforms the results.
   * @param {number|string} [space] - Indentation level or string for formatting.
   * @returns {T}
   */
  static setJson(el, value, replacer, space) {
    const data = JSON.stringify(value, replacer, space);
    TinyHtml._preElems(el, 'setJson').forEach((el) => (el.textContent = data));
    return el;
  }

  /**
   * Set JSON content of the element.
   * @param {any} value - A JavaScript value, usually an object or array, to be converted.
   * @param {(this: any, key: string, value: any) => any} [replacer] - A function that transforms the results.
   * @param {number|string} [space] - Indentation level or string for formatting.
   * @returns {this}
   */
  setJson(value, replacer, space) {
    return TinyHtml.setJson(this, value, replacer, space);
  }

  /**
   * Returns the number content of the element.
   * @param {TinyElement} el - Target element.
   * @returns {number|null} The text content or null if none.
   */
  static toNumber(el) {
    const elem = TinyHtml._preElem(el, 'toNumber');
    return typeof elem.textContent === 'string' ? parseFloat(elem.textContent.trim()) : null;
  }

  /**
   * Returns the number content of the element.
   * @returns {number|null} The text content or null if none.
   */
  toNumber() {
    return TinyHtml.toNumber(this);
  }

  /**
   * Set number content of elements.
   * @template {TinyElement|TinyElement[]} T
   * @param {T} el
   * @param {number} value
   * @returns {T}
   */
  static setNumber(el, value) {
    if (typeof value !== 'number') throw new Error('Value is not a valid number.');
    const data = value.toString();
    TinyHtml._preElems(el, 'setNumber').forEach((el) => (el.textContent = data));
    return el;
  }

  /**
   * Set number content of the element.
   * @param {number} value
   * @returns {this}
   */
  setNumber(value) {
    return TinyHtml.setNumber(this, value);
  }

  /**
   * Returns the boolean content of the element.
   * @param {TinyElement} el - Target element.
   * @returns {boolean|null} The boolean value or null if empty.
   */
  static toBoolean(el) {
    const elem = TinyHtml._preElem(el, 'toBoolean');
    const txt = elem.textContent?.trim();
    if (txt === undefined || txt === null || (txt !== 'true' && txt !== 'false')) return null;
    return /^true$/i.test(txt);
  }

  /**
   * Returns the boolean content of the element.
   * @returns {boolean|null}
   */
  toBoolean() {
    return TinyHtml.toBoolean(this);
  }

  /**
   * Set boolean content of elements.
   * @template {TinyElement|TinyElement[]} T
   * @param {T} el
   * @param {boolean} value
   * @returns {T}
   */
  static setBoolean(el, value) {
    if (typeof value !== 'boolean') throw new Error('Value is not a valid boolean.');
    const data = value.toString();
    TinyHtml._preElems(el, 'setBoolean').forEach((el) => (el.textContent = data));
    return el;
  }

  /**
   * Set boolean content of the element.
   * @param {boolean} value
   * @returns {this}
   */
  setBoolean(value) {
    return TinyHtml.setBoolean(this, value);
  }

  /**
   * Returns the string content of the element.
   * @param {TinyElement} el - Target element.
   * @returns {string|null} The string content or null if none.
   */
  static toString(el) {
    const elem = TinyHtml._preElem(el, 'toString');
    return typeof elem.textContent === 'string' ? elem.textContent : null;
  }

  /**
   * Returns the string content of the element.
   * @returns {string|null} The string content or null if none.
   */
  toString() {
    return TinyHtml.toString(this);
  }

  /**
   * Set string content of elements.
   * @template {TinyElement|TinyElement[]} T
   * @param {T} el
   * @param {string} value
   * @returns {T}
   */
  static setString(el, value) {
    if (typeof value !== 'string') throw new Error('Value is not a valid string.');
    TinyHtml._preElems(el, 'setString').forEach((el) => (el.textContent = value));
    return el;
  }

  /**
   * Set string content of the element.
   * @param {string} value
   * @returns {this}
   */
  setString(value) {
    return TinyHtml.setString(this, value);
  }

  /**
   * Returns the text content of the element.
   * @param {TinyElement} el - Target element.
   * @returns {string|null} The text content or null if none.
   */
  static text(el) {
    const elem = TinyHtml._preElem(el, 'text');
    return elem.textContent;
  }

  /**
   * Returns the text content of the element.
   * @returns {string|null} The text content or null if none.
   */
  text() {
    return TinyHtml.text(this);
  }

  /**
   * Set text content of elements.
   * @template {TinyElement|TinyElement[]} T
   * @param {T} el
   * @param {*} value
   * @returns {T}
   */
  static setText(el, value) {
    const data = typeof value !== 'undefined' && value !== null ? String(value) : '';
    TinyHtml._preElems(el, 'setText').forEach((el) => (el.textContent = data));
    return el;
  }

  /**
   * Set text content of the element.
   * @param {*} value
   * @returns {this}
   */
  setText(value) {
    return TinyHtml.setText(this, value);
  }

  //////////////////////////////////////////////////////

  // TITLE: DOM Content Stuff (Part 2)

  /**
   * Remove all child nodes from each element.
   * @template {TinyElement|TinyElement[]} T
   * @param {T} el
   * @returns {T}
   */
  static empty(el) {
    TinyHtml._preElems(el, 'empty').forEach((el) => (el.textContent = ''));
    return el;
  }

  /**
   * Remove all child nodes of the element.
   * @returns {this}
   */
  empty() {
    return TinyHtml.empty(this);
  }

  /**
   * Get the innerHTML of the element.
   * @param {TinyElement} el
   * @param {GetHTMLOptions} [ops]
   * @returns {string}
   */
  static html(el, ops) {
    const elem = TinyHtml._preElem(el, 'html');
    return elem.getHTML(ops);
  }

  /**
   * Get the innerHTML of the element.
   * @param {GetHTMLOptions} [ops]
   * @returns {string}
   */
  html(ops) {
    return TinyHtml.html(this, ops);
  }

  /**
   * Set the innerHTML of each element.
   * @template {TinyElement|TinyElement[]} T
   * @param {T} el
   * @param {string} value
   * @returns {T}
   */
  static setHtml(el, value) {
    if (typeof value !== 'string') throw new Error('Value is not a valid string.');
    TinyHtml._preElems(el, 'setHtml').forEach((el) => (el.innerHTML = value));
    return el;
  }

  /**
   * Set the innerHTML of the element.
   * @param {string} value
   * @returns {this}
   */
  setHtml(value) {
    return TinyHtml.setHtml(this, value);
  }

  ///////////////////////////////////////////////

  // TITLE: Value Stuff

  static _valHooks = {
    option: {
      /**
       * @param {HTMLOptionElement} elem
       * @returns {string|null}
       */
      get: (elem) => {
        const val = elem.getAttribute('value');
        return val != null ? val : elem.textContent;
      },
    },

    select: {
      /**
       * @param {HTMLSelectElement} elem
       * @returns {(string | null)[] | string | null}
       */
      get: (elem) => {
        const options = elem.options;
        const index = elem.selectedIndex;
        const isSingle = elem.type === 'select-one';
        const max = isSingle ? index + 1 : options.length;

        /** @type {(string | null)[] | null} */
        const values = [];
        let i = index < 0 ? max : isSingle ? index : 0;

        for (; i < max; i++) {
          const option = options[i];
          /** @type {HTMLSelectElement|null} */
          // @ts-ignore
          const parentNode = option.parentNode;
          if (
            (option.selected || i === index) &&
            !option.disabled &&
            (!parentNode || !parentNode.disabled || parentNode.tagName !== 'OPTGROUP')
          ) {
            const val = TinyHtml._valHooks.option.get(option);
            if (isSingle) return val;
            values.push(val);
          }
        }

        return values;
      },

      /**
       * @param {HTMLSelectElement} elem
       * @param {string[]|string} value
       */
      set: (elem, value) => {
        const options = elem.options;
        const values = Array.isArray(value) ? value.map(String) : [String(value)];
        let optionSet = false;

        for (let i = 0; i < options.length; i++) {
          const option = options[i];
          const optionVal = TinyHtml._valHooks.option.get(option);
          if (typeof optionVal === 'string' && (option.selected = values.includes(optionVal))) {
            optionSet = true;
          }
        }

        if (!optionSet) {
          elem.selectedIndex = -1;
        }

        return values;
      },
    },

    radio: {
      /**
       * @param {HTMLInputElement} elem
       * @returns {string}
       */
      get(elem) {
        return elem.checked ? 'on' : 'off';
      },
      /**
       * @param {HTMLInputElement} elem
       * @param {string[]} value
       */
      set(elem, value) {
        if (typeof value === 'boolean') {
          const label = elem.closest('label');
          if (value && label) {
            const otherRadios = label.querySelectorAll('input[type="radio"]');
            otherRadios.forEach((otherRadio) => {
              if (otherRadio instanceof HTMLInputElement && otherRadio !== elem)
                otherRadio.checked = false;
            });
          }
          elem.checked = value;
          return value;
        }
      },
    },

    checkbox: {
      /**
       * @param {HTMLInputElement} elem
       * @returns {string}
       */
      get(elem) {
        return elem.checked ? 'on' : 'off';
      },
      /**
       * @param {HTMLInputElement} elem
       * @param {boolean} value
       */
      set(elem, value) {
        if (typeof value === 'boolean') {
          elem.checked = value;
          return value;
        }
      },
    },
  };

  /**
   * Sets the value of the current HTML value element (input, select, textarea, etc.).
   * Accepts strings, numbers, booleans or arrays of these values, or a callback function that computes them.
   *
   * @template {TinyInputElement|TinyInputElement[]} T
   * @param {T} el - Target element.
   * @param {SetValueList|((el: InputElement, val: SetValueList) => SetValueList)} value - The value to assign or a function that returns it.
   * @throws {Error} If the computed value is not a valid string or boolean.
   * @returns {T}
   */
  static setVal(el, value) {
    TinyHtml._preInputElems(el, 'setVal').forEach((elem) => {
      /**
       * @param {SetValueBase[]} array
       * @param {(v: SetValueBase, i: number) => SetValueBase} callback
       */
      const mapArray = (array, callback) => {
        const result = [];
        for (let i = 0; i < array.length; i++) {
          result.push(callback(array[i], i));
        }
        return result;
      };

      if (elem.nodeType !== 1) return;
      /** @type {SetValueList} */
      let valToSet = typeof value === 'function' ? value(elem, TinyHtml.val(elem)) : value;

      if (valToSet == null) {
        valToSet = '';
      } else if (typeof valToSet === 'number') {
        valToSet = String(valToSet);
      } else if (Array.isArray(valToSet)) {
        valToSet = mapArray(valToSet, (v) => (v == null ? '' : String(v)));
      }

      // @ts-ignore
      const hook = TinyHtml._valHooks[elem.type] || TinyHtml._valHooks[elem.nodeName.toLowerCase()];
      if (
        !hook ||
        typeof hook.set !== 'function' ||
        hook.set(elem, valToSet, 'value') === undefined
      ) {
        if (typeof valToSet !== 'string' && typeof valToSet !== 'boolean')
          throw new Error(`Invalid setValue "${typeof valToSet}" value.`);
        if (typeof valToSet === 'string') elem.value = valToSet;
      }
    });
    return el;
  }

  /**
   * Sets the value of the current HTML value element (input, select, textarea, etc.).
   * Accepts strings, numbers, booleans or arrays of these values, or a callback function that computes them.
   *
   * @param {SetValueList|((el: InputElement, val: SetValueList) => SetValueList)} value - The value to assign or a function that returns it.
   * @returns {this}
   * @throws {Error} If the computed value is not a valid string or boolean.
   */
  setVal(value) {
    return TinyHtml.setVal(this, value);
  }

  /**
   * Maps value types to their corresponding getter functions.
   * Each function extracts a value of a specific type from a compatible HTMLInputElement.
   */
  static _valTypes = {
    /**
     * Gets the string value from any HTMLInputElement.
     * @type {(elem: HTMLInputElement) => string}
     */
    string: (elem) => elem.value,

    /**
     * Gets the value as a Date object from supported input types.
     * Valid only for types: "date", "datetime-local", "month", "time", "week".
     * Returns `null` if the field is empty or invalid.
     * @type {(elem: HTMLInputElement & { type: "date" | "datetime-local" | "month" | "time" | "week" }) => Date | null}
     */
    date: (elem) => elem.valueAsDate,

    /**
     * Gets the numeric value from supported input types.
     * Valid for types: "number", "range", "date", "time".
     * Returns `NaN` if the value is invalid or empty.
     * @type {(elem: HTMLInputElement & { type: "number" | "range" | "date" | "time" }) => number}
     */
    number: (elem) => elem.valueAsNumber,
  };

  /**
   * Gets the value of an input element according to the specified type.
   *
   * @param {InputElement} elem - The input element to extract the value from.
   * @param {GetValueTypes} type - The type of value to retrieve ("string", "date", or "number").
   * @param {string} where - The context/method name using this validation.
   * @returns {any} The extracted value, depending on the type.
   * @throws {Error} If the element is not an HTMLInputElement or if the type handler is invalid.
   */
  static _getValByType(elem, type, where) {
    if (typeof type !== 'string') throw new TypeError('The "type" must be a string.');
    if (typeof where !== 'string') throw new TypeError('The "where" must be a string.');
    if (!(elem instanceof HTMLInputElement) && !(elem instanceof HTMLTextAreaElement))
      throw new Error(`Provided element is not an HTMLInputElement in ${where}().`);
    if (typeof TinyHtml._valTypes[type] !== 'function')
      throw new Error(`No handler found for type "${type}" in ${where}().`);
    // @ts-ignore
    return TinyHtml._valTypes[type](elem);
  }

  /**
   * Retrieves the raw value from the HTML input element.
   * If a custom value hook exists, it will be used first.
   *
   * @param {TinyInputElement} el - Target element.
   * @param {GetValueTypes} type - The type of value to retrieve ("string", "date", or "number").
   * @param {string} where - The context/method name using this validation.
   * @returns {any} The raw value retrieved from the element or hook.
   */
  static _val(el, where, type) {
    const elem = TinyHtml._preInputElem(el, where);
    // @ts-ignore
    const hook = TinyHtml._valHooks[elem.type] || TinyHtml._valHooks[elem.nodeName.toLowerCase()];
    if (hook && typeof hook.get === 'function') {
      const ret = hook.get(elem, 'value', type);
      if (ret !== undefined) return typeof ret === 'string' ? ret.replace(/\r/g, '') : ret;
    }

    return TinyHtml._getValByType(elem, type, where);
  }

  /**
   * Retrieves the raw value from the HTML input element.
   * If a custom value hook exists, it will be used first.
   *
   * @param {GetValueTypes} type - The type of value to retrieve ("string", "date", or "number").
   * @param {string} where - The context/method name using this validation.
   * @returns {any} The raw value retrieved from the element or hook.
   */
  _val(where, type) {
    return TinyHtml._val(this, where, type);
  }

  /**
   * Gets the value of the current HTML value element.
   *
   * @param {TinyInputElement} el - Target element.
   * @returns {SetValueList} The normalized value, with carriage returns removed.
   */
  static val(el) {
    return /** @type {SetValueList} */ (TinyHtml._val(el, 'val', 'string'));
  }

  /**
   * Gets the value of the current HTML value element.
   *
   * @returns {SetValueList} The normalized value, with carriage returns removed.
   */
  val() {
    return TinyHtml.val(this);
  }

  /**
   * Gets the text of the current HTML value element (for text).
   *
   * @param {TinyInputElement} el - Target element.
   * @returns {string} The text value.
   * @throws {Error} If the element is not a string value.
   */
  static valTxt(el) {
    /** @type {string} */
    const ret = TinyHtml._val(el, 'valTxt', 'string');
    if (typeof ret !== 'string' && ret !== null) throw new Error('Value is not a valid string.');
    return ret == null ? '' : typeof ret === 'string' ? ret.replace(/\r/g, '') : ret;
  }

  /**
   * Gets the text of the current HTML value element (for text).
   *
   * @returns {string} The text value.
   * @throws {Error} If the element is not a string value.
   */
  valTxt() {
    return TinyHtml.valTxt(this);
  }

  /**
   * Internal helper to get a value from an input expected to return an array.
   *
   * @param {TinyInputElement} el - Target element.
   * @param {string} where - The method name or context using this validation (for error reporting).
   * @param {GetValueTypes} type - The type of value to retrieve ("string", "date", or "number").
   * @returns {SetValueBase[]} - The validated value as an array.
   * @throws {Error} If the returned value is not an array.
   */
  static _valArr(el, where, type) {
    /** @type {SetValueBase[]} */
    const ret = TinyHtml._val(el, where, type);
    if (!Array.isArray(ret)) throw new Error(`Value expected an array but got ${typeof ret}.`);
    return ret;
  }

  /**
   * Internal helper to get a value from an input expected to return an array.
   *
   * @param {string} where - The method name or context using this validation (for error reporting).
   * @param {GetValueTypes} type - The type of value to retrieve ("string", "date", or "number").
   * @returns {SetValueBase[]} - The validated value as an array.
   * @throws {Error} If the returned value is not an array.
   */
  _valArr(where, type) {
    return TinyHtml._valArr(this, where, type);
  }

  /**
   * Gets the raw value as a generic array of the current HTML value element (for select).
   *
   * @param {TinyInputElement} el - Target element.
   * @returns {SetValueBase[]} - The value cast as a generic array.
   * @throws {Error} If the value is not a valid array.
   */
  static valArr(el) {
    return TinyHtml._valArr(el, 'valArr', 'string');
  }

  /**
   * Gets the raw value as a generic array of the current HTML value element (for select).
   *
   * @returns {SetValueBase[]} - The value cast as a generic array.
   * @throws {Error} If the value is not a valid array.
   */
  valArr() {
    return TinyHtml.valArr(this);
  }

  /**
   * Gets the current value parsed as a number (for number/text).
   *
   * @param {TinyInputElement} el - Target element.
   * @returns {number} The numeric value.
   * @throws {Error} If the element is not a number-compatible input or value is NaN.
   */
  static valNb(el) {
    const elem = TinyHtml._preInputElem(el, 'valNb');
    if (!(elem instanceof HTMLInputElement)) throw new Error('Element must be an input element.');
    /** @type {number} */
    const result = TinyHtml._val(el, 'valNb', 'number');
    if (Number.isNaN(result)) throw new Error('Value is not a valid number.');
    return result;
  }

  /**
   * Gets the current value parsed as a number (for number/text).
   *
   * @returns {number} The numeric value.
   * @throws {Error} If the element is not a number-compatible input or value is NaN.
   */
  valNb() {
    return TinyHtml.valNb(this);
  }

  /**
   * Gets the current value parsed as a Date (for time/date).
   *
   * @param {TinyInputElement} el - Target element.
   * @returns {Date} The date value.
   * @throws {Error} If the element is not a date-compatible input.
   */
  static valDate(el) {
    const elem = TinyHtml._preInputElem(el, 'valDate');
    if (!(elem instanceof HTMLInputElement)) throw new Error('Element must be an input element.');
    /** @type {Date} */
    const result = TinyHtml._val(el, 'valDate', 'date');
    if (!(result instanceof Date)) throw new Error('Value is not a valid date.');
    return result;
  }

  /**
   * Gets the current value parsed as a Date (for time/date).
   *
   * @returns {Date} The date value.
   * @throws {Error} If the element is not a date-compatible input.
   */
  valDate() {
    return TinyHtml.valDate(this);
  }

  /**
   * Checks if the input element is boolean (for checkboxes/radios).
   *
   * @param {TinyInputElement} el - Target element.
   * @returns {boolean} True if the input is considered checked (value === "on"), false otherwise.
   * @throws {Error} If the element is not a checkbox/radio input.
   */
  static valBool(el) {
    const elem = TinyHtml._preInputElem(el, 'valBool');
    if (!(elem instanceof HTMLInputElement)) throw new Error('Element must be an input element.');
    return TinyHtml.val(elem) === 'on' ? true : false;
  }

  /**
   * Checks if the input element is boolean (for checkboxes/radios).
   *
   * @returns {boolean} True if the input is considered checked (value === "on"), false otherwise.
   * @throws {Error} If the element is not a checkbox/radio input.
   */
  valBool() {
    return TinyHtml.valBool(this);
  }

  ////////////////////////////////////////////

  // TITLE: Listen for Paste

  /**
   * Registers a listener for the "paste" event to extract files and text from the clipboard (e.g., when the user presses Ctrl+V).
   *
   * This method allows reacting to pasted content by providing separate callbacks for files and plain text.
   * Useful for building file upload areas, rich-text editors, or input enhancements.
   *
   * @param {TinyElementWithDoc|TinyElementWithDoc[]} el - The target element(s) where the "paste" event will be listened.
   * @param {Object} [settings={}] - Optional callbacks to handle clipboard content.
   * @param {(data: DataTransferItem, file: File) => void} [settings.onFilePaste] - Called for each file pasted from the clipboard (e.g., images).
   * @param {(data: DataTransferItem, text: string) => void} [settings.onTextPaste] - Called when plain text is pasted from the clipboard.
   * @returns {EventListenerOrEventListenerObject} The internal "paste" event handler used.
   */
  static listenForPaste(el, { onFilePaste, onTextPaste } = {}) {
    if (typeof onFilePaste !== 'undefined' && typeof onFilePaste !== 'function')
      throw new TypeError('onFilePaste must be a function.');
    if (typeof onTextPaste !== 'undefined' && typeof onTextPaste !== 'function')
      throw new TypeError('onTextPaste must be a function.');

    /** @type {EventListenerOrEventListenerObject} */
    const pasteEvent = (event) => {
      if (!(event instanceof ClipboardEvent)) return;
      const items = event.clipboardData?.items || [];
      for (const item of items) {
        if (item.kind === 'file') {
          if (typeof onFilePaste === 'function') {
            const file = item.getAsFile();
            if (file) onFilePaste(item, file);
          }
        } else if (item.kind === 'string') {
          if (typeof onTextPaste === 'function')
            item.getAsString((text) => onTextPaste(item, text));
        }
      }
    };

    TinyHtml._preElemsWithDoc(el, 'listenForPaste').forEach((elem) =>
      TinyHtml.on(elem, 'paste', pasteEvent),
    );
    return pasteEvent;
  }

  /**
   * Registers a listener for the "paste" event to extract files and text from the clipboard (e.g., when the user presses Ctrl+V).
   *
   * This method allows reacting to pasted content by providing separate callbacks for files and plain text.
   * Useful for building file upload areas, rich-text editors, or input enhancements.
   *
   * @param {Object} [settings={}] - Optional callbacks to handle clipboard content.
   * @param {(data: DataTransferItem, file: File) => void} [settings.onFilePaste] - Called for each file pasted from the clipboard (e.g., images).
   * @param {(data: DataTransferItem, text: string) => void} [settings.onTextPaste] - Called when plain text is pasted from the clipboard.
   * @returns {EventListenerOrEventListenerObject} The internal "paste" event handler used.
   */
  listenForPaste({ onFilePaste, onTextPaste } = {}) {
    return TinyHtml.listenForPaste(this, { onFilePaste, onTextPaste });
  }

  /////////////////////////////////////////////////////

  // TITLE: Events Stuff

  /**
   * Checks if the element has a listener for a specific event.
   *
   * @param {TinyEventTarget} el - The element to check.
   * @param {string} event - The event name to check.
   * @returns {boolean}
   */
  static hasEventListener(el, event) {
    const elem = TinyHtml._preEventTargetElem(el, 'hasEventListener');
    if (!__eventRegistry.has(elem)) return false;
    const events = __eventRegistry.get(elem);
    return !!(events && Array.isArray(events[event]) && events[event].length > 0);
  }

  /**
   * Checks if the element has a listener for a specific event.
   *
   * @param {string} event - The event name to check.
   * @returns {boolean}
   */
  hasEventListener(event) {
    return TinyHtml.hasEventListener(this, event);
  }

  /**
   * Checks if the element has the exact handler registered for a specific event.
   *
   * @param {TinyEventTarget} el - The element to check.
   * @param {string} event - The event name to check.
   * @param {EventListenerOrEventListenerObject} handler - The handler function to check.
   * @returns {boolean}
   */
  static hasExactEventListener(el, event, handler) {
    const elem = TinyHtml._preEventTargetElem(el, 'hasExactEventListener');
    if (typeof handler !== 'function') throw new TypeError('The "handler" must be a function.');
    if (!__eventRegistry.has(elem)) return false;
    const events = __eventRegistry.get(elem);
    if (!events || !Array.isArray(events[event])) return false;
    return events[event].some((item) => item.handler === handler);
  }

  /**
   * Checks if the element has the exact handler registered for a specific event.
   *
   * @param {string} event - The event name to check.
   * @param {EventListenerOrEventListenerObject} handler - The handler function to check.
   * @returns {boolean}
   */
  hasExactEventListener(event, handler) {
    return TinyHtml.hasExactEventListener(this, event, handler);
  }

  /**
   * Hover event shortcut.
   *
   * Adds `mouseenter` and `mouseleave` event listeners to the target.
   *
   * @template {TinyEventTarget|TinyEventTarget[]} T
   * @param {T} el - The target element(s) to attach the hover handlers.
   * @param {HoverEventCallback} fnOver - Callback executed when the mouse enters the target.
   * @param {HoverEventCallback|null} [fnOut] - Optional callback executed when the mouse leaves
   * the target. If not provided, `fnOver` will be used for both events.
   * @param {EventRegistryOptions} [options] - Optional event listener options.
   * @returns {T}
   */
  static hover(el, fnOver, fnOut, options) {
    // @ts-ignore
    TinyHtml.on(el, 'mouseenter', fnOver, options);
    // @ts-ignore
    TinyHtml.on(el, 'mouseleave', fnOut || fnOver, options);
    return el;
  }

  /**
   * Hover event shortcut.
   *
   * Adds `mouseenter` and `mouseleave` event listeners to the target.
   *
   * @param {HoverEventCallback} fnOver - Callback executed when the mouse enters the target.
   * @param {HoverEventCallback|null} [fnOut] - Optional callback executed when the mouse leaves
   * the target. If not provided, `fnOver` will be used for both events.
   * @param {EventRegistryOptions} [options] - Optional event listener options.
   * @returns {this}
   */
  hover(fnOver, fnOut, options) {
    return TinyHtml.hover(this, fnOver, fnOut, options);
  }

  /**
   * Registers an event listener on the specified element.
   *
   * @template {TinyEventTarget|TinyEventTarget[]} T
   * @param {T} el - The target to listen on.
   * @param {string|string[]} events - The event type (e.g. 'click', 'keydown').
   * @param {EventListenerOrEventListenerObject|null} handler - The callback function to run on event.
   * @param {EventRegistryOptions} [options] - Optional event listener options.
   * @returns {T}
   */
  static on(el, events, handler, options) {
    if (
      typeof events !== 'string' &&
      (!Array.isArray(events) || !events.every((event) => typeof event === 'string'))
    )
      throw new TypeError('The events must be a string or array of strings.');
    for (const event of Array.isArray(events) ? Array.from(new Set(events)) : [events]) {
      if (typeof event !== 'string') throw new TypeError('The event name must be a string.');
      TinyHtml._preEventTargetElems(el, 'on').forEach((elem) => {
        elem.addEventListener(event, handler, options);

        if (!__eventRegistry.has(elem)) __eventRegistry.set(elem, {});
        const events = __eventRegistry.get(elem);
        if (!events) return;
        if (!Array.isArray(events[event])) events[event] = [];
        events[event].push({ handler, options });
      });
    }
    return el;
  }

  /**
   * Registers an event listener on the specified element.
   *
   * @param {string|string[]} events - The event type (e.g. 'click', 'keydown').
   * @param {EventListenerOrEventListenerObject|null} handler - The callback function to run on event.
   * @param {EventRegistryOptions} [options] - Optional event listener options.
   * @returns {this}
   */
  on(events, handler, options) {
    return TinyHtml.on(this, events, handler, options);
  }

  /**
   * Registers an event listener that runs only once, then is removed.
   *
   * @template {TinyEventTarget|TinyEventTarget[]} T
   * @param {T} el - The target to listen on.
   * @param {string|string[]} events - The event type (e.g. 'click', 'keydown').
   * @param {EventListenerOrEventListenerObject} handler - The callback function to run on event.
   * @param {EventRegistryOptions} [options={}] - Optional event listener options.
   * @returns {T}
   */
  static once(el, events, handler, options = {}) {
    if (
      typeof events !== 'string' &&
      (!Array.isArray(events) || !events.every((event) => typeof event === 'string'))
    )
      throw new TypeError('The events must be a string or array of strings.');
    for (const event of Array.isArray(events) ? Array.from(new Set(events)) : [events]) {
      if (typeof event !== 'string') throw new TypeError('The event name must be a string.');
      TinyHtml._preEventTargetElems(el, 'once').forEach((elem) => {
        /** @type {EventListenerOrEventListenerObject} */
        const wrapped = (e) => {
          TinyHtml.off(elem, event, wrapped);
          if (typeof handler === 'function') handler(e);
        };

        TinyHtml.on(
          elem,
          event,
          wrapped,
          typeof options === 'boolean' ? options : { ...options, once: true },
        );
      });
    }
    return el;
  }

  /**
   * Registers an event listener that runs only once, then is removed.
   *
   * @param {string|string[]} events - The event type (e.g. 'click', 'keydown').
   * @param {EventListenerOrEventListenerObject} handler - The callback function to run on event.
   * @param {EventRegistryOptions} [options={}] - Optional event listener options.
   * @returns {this}
   */
  once(events, handler, options = {}) {
    return TinyHtml.once(this, events, handler, options);
  }

  /**
   * Removes a specific event listener from an element.
   *
   * @template {TinyEventTarget|TinyEventTarget[]} T
   * @param {T} el - The target element.
   * @param {string|string[]} events - The event type.
   * @param {EventListenerOrEventListenerObject|null} handler - The function originally bound to the event.
   * @param {boolean|EventListenerOptions} [options] - Optional listener options.
   * @returns {T}
   */
  static off(el, events, handler, options) {
    if (
      typeof events !== 'string' &&
      (!Array.isArray(events) || !events.every((event) => typeof event === 'string'))
    )
      throw new TypeError('The events must be a string or array of strings.');
    for (const event of Array.isArray(events) ? Array.from(new Set(events)) : [events]) {
      if (typeof event !== 'string') throw new TypeError('The event name must be a string.');
      TinyHtml._preEventTargetElems(el, 'off').forEach((elem) => {
        elem.removeEventListener(event, handler, options);

        const events = __eventRegistry.get(elem);
        if (events && events[event]) {
          events[event] = events[event].filter((entry) => entry.handler !== handler);
          if (events[event].length === 0) delete events[event];
        }
      });
    }
    return el;
  }

  /**
   * Removes a specific event listener from an element.
   *
   * @param {string|string[]} events - The event type.
   * @param {EventListenerOrEventListenerObject|null} handler - The function originally bound to the event.
   * @param {boolean|EventListenerOptions} [options] - Optional listener options.
   * @returns {this}
   */
  off(events, handler, options) {
    return TinyHtml.off(this, events, handler, options);
  }

  /**
   * Removes all event listeners of a specific type from the element.
   *
   * @template {TinyEventTarget|TinyEventTarget[]} T
   * @param {T} el - The target element.
   * @param {string|string[]} events - The event type to remove (e.g. 'click').
   * @returns {T}
   */
  static offAll(el, events) {
    if (
      typeof events !== 'string' &&
      (!Array.isArray(events) || !events.every((event) => typeof event === 'string'))
    )
      throw new TypeError('The events must be a string or array of strings.');
    for (const event of Array.isArray(events) ? Array.from(new Set(events)) : [events]) {
      if (typeof event !== 'string') throw new TypeError('The event name must be a string.');
      TinyHtml._preEventTargetElems(el, 'offAll').forEach((elem) => {
        const events = __eventRegistry.get(elem);
        if (events && events[event]) {
          for (const entry of events[event]) {
            elem.removeEventListener(event, entry.handler, entry.options);
          }
          delete events[event];
        }
      });
    }
    return el;
  }

  /**
   * Removes all event listeners of a specific type from the element.
   *
   * @param {string|string[]} events - The event type to remove (e.g. 'click').
   * @returns {this}
   */
  offAll(events) {
    return TinyHtml.offAll(this, events);
  }

  /**
   * Removes all event listeners of all types from the element.
   *
   * @template {TinyEventTarget|TinyEventTarget[]} T
   * @param {T} el - The target element.
   * @param {((handler: EventListenerOrEventListenerObject|null, event: string) => boolean)|null} [filterFn=null] -
   *        Optional filter function to selectively remove specific handlers.
   * @returns {T}
   */
  static offAllTypes(el, filterFn = null) {
    if (filterFn !== null && typeof filterFn !== 'function')
      throw new TypeError('The "filterFn" must be a function.');
    TinyHtml._preEventTargetElems(el, 'offAllTypes').forEach((elem) => {
      const events = __eventRegistry.get(elem);
      if (!events) return;

      for (const event in events) {
        for (const entry of events[event]) {
          if (typeof filterFn !== 'function' || filterFn(entry.handler, event)) {
            elem.removeEventListener(event, entry.handler, entry.options);
          }
        }
      }

      __eventRegistry.delete(elem);
    });
    return el;
  }

  /**
   * Removes all event listeners of all types from the element.
   *
   * @param {((handler: EventListenerOrEventListenerObject|null, event: string) => boolean)|null} [filterFn=null] -
   *        Optional filter function to selectively remove specific handlers.
   * @returns {this}
   */
  offAllTypes(filterFn = null) {
    return TinyHtml.offAllTypes(this, filterFn);
  }

  /**
   * Triggers all handlers associated with a specific event on the given element.
   *
   * @template {TinyEventTarget|TinyEventTarget[]} T
   * @param {T} el - Target element where the event should be triggered.
   * @param {string|string[]} events - Name of the event to trigger.
   * @param {Event|CustomEvent|CustomEventInit} [payload] - Optional event object or data to pass.
   * @returns {T}
   */
  static trigger(el, events, payload = {}) {
    if (
      typeof events !== 'string' &&
      (!Array.isArray(events) || !events.every((event) => typeof event === 'string'))
    )
      throw new TypeError('The events must be a string or array of strings.');
    for (const event of Array.isArray(events) ? Array.from(new Set(events)) : [events]) {
      if (typeof event !== 'string') throw new TypeError('The event name must be a string.');
      TinyHtml._preEventTargetElems(el, 'trigger').forEach((elem) => {
        const evt =
          payload instanceof Event || payload instanceof CustomEvent
            ? payload
            : new CustomEvent(event, {
                bubbles: true,
                cancelable: true,
                detail: payload,
              });

        elem.dispatchEvent(evt);
      });
    }
    return el;
  }

  /**
   * Triggers all handlers associated with a specific event on the given element.
   *
   * @param {string|string[]} events - Name of the event to trigger.
   * @param {Event|CustomEvent|CustomEventInit} [payload] - Optional event object or data to pass.
   * @returns {this}
   */
  trigger(events, payload = {}) {
    return TinyHtml.trigger(this, events, payload);
  }

  ///////////////////////////////////////////////////////////////

  // TITLE: ProFix Manager

  /**
   * Internal property name normalization map (similar to jQuery's `propFix`).
   * Maps attribute-like names to their JavaScript DOM property equivalents.
   *
   * Example: `'for'` ➝ `'htmlFor'`, `'class'` ➝ `'className'`.
   *
   * ⚠️ Do not modify this object directly. Use `TinyHtml.propFix` to ensure reverse mapping (`attrFix`) remains in sync.
   *
   * @type {Record<string | symbol, string>}
   */
  static #propFix = {
    for: 'htmlFor',
    class: 'className',
  };

  /**
   * Public proxy for normalized DOM property names.
   *
   * Setting a new entry here will also automatically update the reverse map in `TinyHtml.attrFix`.
   *
   * @type {Record<string | symbol, string>}
   */
  static propFix = new Proxy(TinyHtml.#propFix, {
    set(target, val1, val2) {
      target[val1] = val2;
      // @ts-ignore
      TinyHtml.attrFix[val2] = val1;
      return true;
    },
  });

  /**
   * Reverse map of `propFix`, mapping property names back to their attribute equivalents.
   *
   * Used when converting DOM property names into HTML attribute names.
   *
   * @type {Record<string | symbol, string>}
   */
  static attrFix = Object.fromEntries(
    Object.entries(TinyHtml.#propFix).map(([val1, val2]) => [val2, val1]),
  );

  /**
   * Normalizes an attribute name to its corresponding DOM property name.
   *
   * Example: `'class'` ➝ `'className'`, `'for'` ➝ `'htmlFor'`.
   * If the name is not mapped, it returns the original name.
   *
   * @param {string} name - The attribute name to normalize.
   * @returns {string} - The corresponding property name.
   */
  static getPropName(name) {
    // @ts-ignore
    const propName = typeof TinyHtml.propFix[name] === 'string' ? TinyHtml.propFix[name] : name;
    return propName;
  }

  /**
   * Converts a DOM property name back to its corresponding attribute name.
   *
   * Example: `'className'` ➝ `'class'`, `'htmlFor'` ➝ `'for'`.
   * If the name is not mapped, it returns the original name.
   *
   * @param {string} name - The property name to convert.
   * @returns {string} - The corresponding attribute name.
   */
  static getAttrName(name) {
    // @ts-ignore
    const propName = typeof TinyHtml.attrFix[name] === 'string' ? TinyHtml.attrFix[name] : name;
    return propName;
  }

  ////////////////////////////////////////////////////////////////////

  /**
   * Returns the BigInt value of an attribute.
   * @param {TinyElement} el
   * @param {string} name
   * @returns {bigint|null}
   */
  static attrBigInt(el, name) {
    const elem = TinyHtml._preElem(el, 'attrBigInt');
    const val = elem.getAttribute(TinyHtml.getAttrName(name));
    if (val == null) return null;
    try {
      return BigInt(val);
    } catch {
      return null;
    }
  }

  /**
   * Returns the BigInt value of an attribute.
   * @param {string} name
   * @returns {bigint|null}
   */
  attrBigInt(name) {
    return TinyHtml.attrBigInt(this, name);
  }

  /**
   * Set a BigInt attribute.
   * @template {TinyElement|TinyElement[]} T
   * @param {T} el
   * @param {string} name
   * @param {bigint} value
   * @returns {T}
   */
  static setAttrBigInt(el, name, value) {
    if (typeof value !== 'bigint') throw new Error('Value is not a valid BigInt.');
    return TinyHtml.setAttr(el, name, value.toString());
  }

  /**
   * Set a BigInt attribute.
   * @param {string} name
   * @param {bigint} value
   * @returns {this}
   */
  setAttrBigInt(name, value) {
    return TinyHtml.setAttrBigInt(this, name, value);
  }

  /**
   * Returns the Date value of an attribute.
   * @param {TinyElement} el
   * @param {string} name
   * @returns {Date|null}
   */
  static attrDate(el, name) {
    const elem = TinyHtml._preElem(el, 'attrDate');
    const val = elem.getAttribute(TinyHtml.getAttrName(name));
    if (!val) return null;
    const d = new Date(val);
    return Number.isNaN(d.getTime()) ? null : d;
  }

  /**
   * Returns the Date value of an attribute.
   * @param {string} name
   * @returns {Date|null}
   */
  attrDate(name) {
    return TinyHtml.attrDate(this, name);
  }

  /**
   * Set a Date attribute.
   * @template {TinyElement|TinyElement[]} T
   * @param {T} el
   * @param {string} name
   * @param {Date} value
   * @returns {T}
   */
  static setAttrDate(el, name, value) {
    if (!(value instanceof Date) || Number.isNaN(value.getTime()))
      throw new Error('Value is not a valid Date.');
    return TinyHtml.setAttr(el, name, value.toISOString());
  }

  /**
   * Set a Date attribute.
   * @param {string} name
   * @param {Date} value
   * @returns {this}
   */
  setAttrDate(name, value) {
    return TinyHtml.setAttrDate(this, name, value);
  }

  /**
   * Returns the JSON value of an attribute.
   * @param {TinyElement} el
   * @param {string} name
   * @returns {any|null}
   */
  static attrJson(el, name) {
    const elem = TinyHtml._preElem(el, 'attrJson');
    const val = elem.getAttribute(TinyHtml.getAttrName(name));
    if (!val) return null;
    try {
      return JSON.parse(val);
    } catch {
      return null;
    }
  }

  /**
   * Returns the JSON value of an attribute.
   * @param {string} name
   * @returns {any|null}
   */
  attrJson(name) {
    return TinyHtml.attrJson(this, name);
  }

  /**
   * Set a JSON attribute.
   * @template {TinyElement|TinyElement[]} T
   * @param {T} el
   * @param {string} name
   * @param {any} value
   * @param {(this: any, key: string, value: any) => any} [replacer]
   * @param {number|string} [space]
   * @returns {T}
   */
  static setAttrJson(el, name, value, replacer, space) {
    const data = JSON.stringify(value, replacer, space);
    return TinyHtml.setAttr(el, name, data);
  }

  /**
   * Set a JSON attribute.
   * @param {string} name
   * @param {any} value
   * @param {(this: any, key: string, value: any) => any} [replacer]
   * @param {number|string} [space]
   * @returns {this}
   */
  setAttrJson(name, value, replacer, space) {
    return TinyHtml.setAttrJson(this, name, value, replacer, space);
  }

  /**
   * Returns the number value of an attribute.
   * @param {TinyElement} el
   * @param {string} name
   * @returns {number|null}
   */
  static attrNumber(el, name) {
    const elem = TinyHtml._preElem(el, 'attrNumber');
    const val = elem.getAttribute(TinyHtml.getAttrName(name));
    return val != null ? parseFloat(val) : null;
  }

  /**
   * Returns the number value of an attribute.
   * @param {string} name
   * @returns {number|null}
   */
  attrNumber(name) {
    return TinyHtml.attrNumber(this, name);
  }

  /**
   * Set a number attribute.
   * @template {TinyElement|TinyElement[]} T
   * @param {T} el
   * @param {string} name
   * @param {number} value
   * @returns {T}
   */
  static setAttrNumber(el, name, value) {
    if (typeof value !== 'number') throw new Error('Value is not a valid number.');
    return TinyHtml.setAttr(el, name, value.toString());
  }

  /**
   * Set a number attribute.
   * @param {string} name
   * @param {number} value
   * @returns {this}
   */
  setAttrNumber(name, value) {
    return TinyHtml.setAttrNumber(this, name, value);
  }

  /**
   * Returns the boolean value of an attribute.
   * @param {TinyElement} el
   * @param {string} name
   * @returns {boolean|null}
   */
  static attrBoolean(el, name) {
    const elem = TinyHtml._preElem(el, 'attrBoolean');
    const val = elem.getAttribute(TinyHtml.getAttrName(name));
    if (val === null) return null;
    if (val !== 'true' && val !== 'false') return null;
    return /^true$/i.test(val);
  }

  /**
   * Returns the boolean value of an attribute.
   * @param {string} name
   * @returns {boolean|null}
   */
  attrBoolean(name) {
    return TinyHtml.attrBoolean(this, name);
  }

  /**
   * Set a boolean attribute.
   * @template {TinyElement|TinyElement[]} T
   * @param {T} el
   * @param {string} name
   * @param {boolean} value
   * @returns {T}
   */
  static setAttrBoolean(el, name, value) {
    if (typeof value !== 'boolean') throw new Error('Value is not a valid boolean.');
    return TinyHtml.setAttr(el, name, value.toString());
  }

  /**
   * Set a boolean attribute.
   * @param {string} name
   * @param {boolean} value
   * @returns {this}
   */
  setAttrBoolean(name, value) {
    return TinyHtml.setAttrBoolean(this, name, value);
  }

  /**
   * Returns the string value of an attribute.
   * @param {TinyElement} el
   * @param {string} name
   * @returns {string|null}
   */
  static attrString(el, name) {
    const elem = TinyHtml._preElem(el, 'attrString');
    const value = elem.getAttribute(TinyHtml.getAttrName(name));
    return typeof value === 'string' ? value : null;
  }

  /**
   * Returns the string value of an attribute.
   * @param {string} name
   * @returns {string|null}
   */
  attrString(name) {
    return TinyHtml.attrString(this, name);
  }

  /**
   * Set a string attribute.
   * @template {TinyElement|TinyElement[]} T
   * @param {T} el
   * @param {string} name
   * @param {string} value
   * @returns {T}
   */
  static setAttrString(el, name, value) {
    if (typeof value !== 'string') throw new Error('Value is not a valid string.');
    return TinyHtml.setAttr(el, name, value);
  }

  /**
   * Set a string attribute.
   * @param {string} name
   * @param {string} value
   * @returns {this}
   */
  setAttrString(name, value) {
    return TinyHtml.setAttrString(this, name, value);
  }

  /**
   * Get an attribute on an element.
   * @param {TinyElement} el
   * @param {string} name
   * @returns {string|null}
   */
  static attr(el, name) {
    if (typeof name !== 'string') throw new TypeError('The "name" must be a string.');
    const elem = TinyHtml._preElem(el, 'attr');
    return elem.getAttribute(TinyHtml.getAttrName(name));
  }

  /**
   * Get an attribute on an element.
   * @param {string} name
   * @returns {string|null}
   */
  attr(name) {
    return TinyHtml.attr(this, name);
  }

  /**
   * Set one or multiple attributes on an element.
   * @template {TinyElement|TinyElement[]} T
   * @param {T} el - Target element(s).
   * @param {string|Record<string, any>} name - Attribute name or an object of attributes.
   * @param {any} [value=null] - Attribute value (ignored if "name" is an object).
   * @returns {T}
   */
  static setAttr(el, name, value = null) {
    const elems = TinyHtml._preElems(el, 'setAttr');

    // Multiple attributes at once
    if (typeof name === 'object' && name !== null) {
      Object.entries(name).forEach(([attr, val]) =>
        elems.forEach((elem) => {
          if (val === null) elem.removeAttribute(TinyHtml.getAttrName(attr));
          else elem.setAttribute(TinyHtml.getAttrName(attr), String(val));
        }),
      );
      return el;
    }

    // Single attribute
    if (typeof name !== 'string') throw new TypeError('The "name" must be a string.');
    elems.forEach((elem) => {
      if (value === null) elem.removeAttribute(TinyHtml.getAttrName(name));
      else elem.setAttribute(TinyHtml.getAttrName(name), String(value));
    });

    return el;
  }

  /**
   * Set one or multiple attributes on an element.
   * @param {string|Record<string, any>} name - Attribute name or an object of attributes.
   * @param {any} [value=null] - Attribute value (ignored if "name" is an object).
   * @returns {this}
   */
  setAttr(name, value) {
    return TinyHtml.setAttr(this, name, value);
  }

  /**
   * Remove attribute(s) from an element.
   * @template {TinyElement|TinyElement[]} T
   * @param {T} el
   * @param {string} name Space-separated list of attributes.
   * @returns {T}
   */
  static removeAttr(el, name) {
    if (typeof name !== 'string') throw new TypeError('The "name" must be a string.');
    TinyHtml._preElems(el, 'removeAttr').forEach((elem) =>
      elem.removeAttribute(TinyHtml.getAttrName(name)),
    );
    return el;
  }

  /**
   * Remove attribute(s) from an element.
   * @param {string} name Space-separated list of attributes.
   * @returns {this}
   */
  removeAttr(name) {
    return TinyHtml.removeAttr(this, name);
  }

  /**
   * Check if an attribute exists on an element.
   * @param {TinyElement} el
   * @param {string} name
   * @returns {boolean}
   */
  static hasAttr(el, name) {
    if (typeof name !== 'string') throw new TypeError('The "name" must be a string.');
    const elem = TinyHtml._preElem(el, 'hasAttr');
    return elem.hasAttribute(TinyHtml.getAttrName(name));
  }

  /**
   * Check if an attribute exists on an element.
   * @param {string} name
   * @returns {boolean}
   */
  hasAttr(name) {
    return TinyHtml.hasAttr(this, name);
  }

  /**
   * Check if a property exists.
   * @param {TinyElement} el
   * @param {string} name
   * @returns {boolean}
   */
  static hasProp(el, name) {
    if (typeof name !== 'string') throw new TypeError('The "name" must be a string.');
    const elem = TinyHtml._preElem(el, 'hasProp');
    // @ts-ignore
    return !!elem[TinyHtml.getPropName(name)];
  }

  /**
   * Check if a property exists.
   * @param {string} name
   * @returns {boolean}
   */
  hasProp(name) {
    return TinyHtml.hasProp(this, name);
  }

  /**
   * Set one or multiple properties on an element.
   * @template {TinyElement|TinyElement[]} T
   * @param {T} el - Target element(s).
   * @param {...string} names - Property name(s).
   * @returns {T}
   */
  static addProp(el, ...names) {
    TinyHtml._preElems(el, 'addProp').forEach((elem) => {
      names.forEach((name) => {
        if (typeof name !== 'string') throw new TypeError('Each "name" must be a string.');
        // @ts-ignore
        elem[TinyHtml.getPropName(name)] = true;
      });
    });
    return el;
  }

  /**
   * Set a property on an element.
   * @param {...string} names - Property name(s).
   * @returns {this}
   */
  addProp(...names) {
    return TinyHtml.addProp(this, ...names);
  }

  /**
   * Remove one or multiple properties from an element.
   * @template {TinyElement|TinyElement[]} T
   * @param {T} el - Target element(s).
   * @param {...string} names - Property name(s).
   * @returns {T}
   */
  static removeProp(el, ...names) {
    TinyHtml._preElems(el, 'removeProp').forEach((elem) => {
      names.forEach((name) => {
        if (typeof name !== 'string') throw new TypeError('Each "name" must be a string.');
        // @ts-ignore
        elem[TinyHtml.getPropName(name)] = false;
      });
    });
    return el;
  }

  /**
   * Remove a property from an element.
   * @param {...string} names - Property name(s).
   * @returns {this}
   */
  removeProp(...names) {
    return TinyHtml.removeProp(this, ...names);
  }

  /**
   * Toggle one or multiple boolean properties.
   * @template {TinyElement|TinyElement[]} T
   * @param {T} el - Target element(s).
   * @param {string|string[]} name - Property name or a list of property names.
   * @param {boolean} [force] - Force true/false instead of toggling.
   * @returns {T}
   */
  static toggleProp(el, name, force) {
    const elems = TinyHtml._preElems(el, 'toggleProp');
    if (typeof force !== 'undefined' && typeof force !== 'boolean')
      throw new TypeError('The "force" must be a boolean.');

    // Normalize list of properties
    const props = Array.isArray(name) ? name : [name];

    props.forEach((prop) => {
      if (typeof prop !== 'string') throw new TypeError('Each property name must be a string.');
      elems.forEach((elem) => {
        // @ts-ignore
        const shouldEnable = force === undefined ? !elem[TinyHtml.getPropName(prop)] : force;
        if (shouldEnable) TinyHtml.addProp(elem, prop);
        else TinyHtml.removeProp(elem, prop);
      });
    });

    return el;
  }

  /**
   * Toggle one or multiple boolean properties.
   * @param {string|string[]} name - Property name or a list of property names.
   * @param {boolean} [force] - Force true/false instead of toggling.
   * @returns {this}
   */
  toggleProp(name, force) {
    return TinyHtml.toggleProp(this, name, force);
  }

  /**
   * Get properties on an element.
   *
   * @param {TinyHtmlElement} el - Target element.
   * @param {string} name - Property name.
   * @returns {any} - Property value if getting, otherwise `undefined`.
   */
  static prop(el, name) {
    if (typeof name !== 'string')
      throw new TypeError('Invalid arguments passed to prop(). Expected string for "name".');
    const elem = TinyHtml._preElem(el, 'prop');
    // @ts-ignore
    return elem[name];
  }

  /**
   * Get properties on an element.
   *
   * @param {string} name - Property name.
   * @returns {any} - Property value if getting, otherwise `undefined`.
   */
  prop(name) {
    return TinyHtml.prop(this, name);
  }

  /**
   * Set a property on elements.
   * @template {TinyElement|TinyElement[]} T
   * @param {T} el - Target element(s).
   * @param {string} name - Property name.
   * @param {any} value - Value to set.
   * @returns {T}
   */
  static setProp(el, name, value) {
    if (typeof name !== 'string' || name.trim() === '')
      throw new Error('Property name must be a non-empty string.');
    TinyHtml._preElems(el, 'setProp').forEach((elem) => {
      // @ts-ignore
      elem[name] = value;
    });
    return el;
  }

  /**
   * Set a property on this element.
   * @param {string} name - Property name.
   * @param {any} value - Value to set.
   * @returns {this} The same element.
   */
  setProp(name, value) {
    return TinyHtml.setProp(this, name, value);
  }

  /////////////////////////////////////////////////////

  // TITLE: Remove Element

  /**
   * Removes an element from the DOM.
   * @template {TinyElement|TinyElement[]} T
   * @param {T} el - The DOM element or selector to remove.
   * @returns {T}
   */
  static remove(el) {
    TinyHtml._preElems(el, 'remove').forEach((elem) => elem.remove());
    return el;
  }

  /**
   * Removes the element from the DOM.
   * @returns {this}
   */
  remove() {
    return TinyHtml.remove(this);
  }

  ///////////////////////////////////////////////////

  // TITLE: Index Manager

  /**
   * Returns the index of the first element within its parent or relative to a selector/element.
   *
   * @param {TinyElement} el - The element target
   * @param {string|TinyElement|null} [el2] - Optional target to compare index against.
   * @returns {number}
   */
  static index(el, el2 = null) {
    const elem = TinyHtml._preElem(el, 'index');
    if (!elem) return -1;

    if (!el2) {
      return Array.prototype.indexOf.call(elem.parentNode?.children || [], elem);
    }

    if (el2) {
      const matchEls =
        typeof el2 === 'string' ? document.querySelectorAll(el2) : TinyHtml._preElems(el2, 'index');
      return Array.prototype.indexOf.call(matchEls, elem);
    }

    return -1;
  }

  /**
   * Returns the index of the first element within its parent or relative to a selector/element.
   *
   * @param {string|TinyElement|null} [elem] - Optional target to compare index against.
   * @returns {number}
   */
  index(elem) {
    return TinyHtml.index(this, elem);
  }

  ////////////////////////////////////////////////////////////////////

  // TITLE: Collision Stuff

  /**
   * Creates a new DOMRect object by copying the base rect and applying optional additional dimensions.
   *
   * @param {DOMRect} rect - The base rectangle to be cloned and extended.
   * @param {Partial<DOMRect>} extraRect - Additional dimensions to apply to the base rect (e.g., extra padding or offset).
   * @returns {DOMRect} - A new DOMRect object with the combined dimensions.
   */
  static _getCustomRect(rect, extraRect) {
    /** @type {DOMRect} */
    const result = {
      height: 0,
      width: 0,
      x: 0,
      y: 0,
      bottom: 0,
      left: 0,
      right: 0,
      top: 0,
      toJSON: function () {
        throw new Error('Function not implemented.');
      },
    };
    for (const name in rect) {
      // @ts-ignore
      if (typeof rect[name] === 'number')
        // @ts-ignore
        result[name] = rect[name];
    }

    if (typeof extraRect !== 'object' || extraRect === null || Array.isArray(extraRect))
      throw new Error('extraRect must be a non-null object.');
    const { height = 0, width = 0, top = 0, bottom = 0, left = 0, right = 0 } = extraRect;
    if (typeof height !== 'number') throw new Error('extraRect.height must be a number.');
    if (typeof width !== 'number') throw new Error('extraRect.width must be a number.');
    if (typeof top !== 'number') throw new Error('extraRect.top must be a number.');
    if (typeof bottom !== 'number') throw new Error('extraRect.bottom must be a number.');
    if (typeof left !== 'number') throw new Error('extraRect.left must be a number.');
    if (typeof right !== 'number') throw new Error('extraRect.right must be a number.');

    // @ts-ignore
    result.height += height;
    // @ts-ignore
    result.width += width;
    // @ts-ignore
    result.top += top;
    // @ts-ignore
    result.bottom += bottom;
    // @ts-ignore
    result.left += left;
    // @ts-ignore
    result.right += right;
    return result;
  }

  /**
   * Determines if two HTML elements are colliding, using a simple bounding box comparison.
   *
   * @param {TinyElement} el1 - The first element to compare.
   * @param {TinyElement} el2 - The second element to compare.
   * @param {Partial<ObjRect>} [extraRect] - Optional values to expand the size of the first element's rect.
   * @returns {boolean} - `true` if the elements are colliding, `false` otherwise.
   */
  static isCollWith(el1, el2, extraRect = {}) {
    const rect1 = TinyHtml._getCustomRect(
      TinyHtml._preElem(el1, 'isCollWith').getBoundingClientRect(),
      extraRect,
    );
    const rect2 = TinyHtml._preElem(el2, 'isCollWith').getBoundingClientRect();
    return areElsColliding(rect1, rect2);
  }

  /**
   * Determines if two HTML elements are colliding, using a simple bounding box comparison.
   *
   * @param {TinyElement} el2 - The second element to compare.
   * @param {Partial<ObjRect>} [extraRect] - Optional values to expand the size of the first element's rect.
   * @returns {boolean} - `true` if the elements are colliding, `false` otherwise.
   */
  isCollWith(el2, extraRect) {
    return TinyHtml.isCollWith(this, el2, extraRect);
  }

  /**
   * Determines if two HTML elements are colliding using a pixel-perfect collision algorithm.
   *
   * @param {TinyElement} el1 - The first element to compare.
   * @param {TinyElement} el2 - The second element to compare.
   * @param {Partial<ObjRect>} [extraRect] - Optional values to expand the size of the first element's rect.
   * @returns {boolean} - `true` if the elements are colliding with higher precision, `false` otherwise.
   */
  static isCollPerfWith(el1, el2, extraRect = {}) {
    const rect1 = TinyHtml._getCustomRect(
      TinyHtml._preElem(el1, 'isCollPerfWith').getBoundingClientRect(),
      extraRect,
    );
    const rect2 = TinyHtml._preElem(el2, 'isCollPerfWith').getBoundingClientRect();
    return areElsPerfColliding(rect1, rect2);
  }

  /**
   * Determines if two HTML elements are colliding using a pixel-perfect collision algorithm.
   *
   * @param {TinyElement} el2 - The second element to compare.
   * @param {Partial<ObjRect>} [extraRect] - Optional values to expand the size of the first element's rect.
   * @returns {boolean} - `true` if the elements are colliding with higher precision, `false` otherwise.
   */
  isCollPerfWith(el2, extraRect) {
    return TinyHtml.isCollPerfWith(this, el2, extraRect);
  }

  /**
   * Determines whether two elements are colliding with a directional lock mechanism.
   *
   * This function tracks the direction from which an element (`elem1`) initially collided with another,
   * and keeps the collision "locked" until the element exits the collision from the same direction.
   *
   * - If `isColliding` is true and no lock is stored yet, it saves the direction of entry.
   * - If `isColliding` is false but a previous lock exists, it checks if the element has exited
   *   in the same direction it entered to remove the lock.
   *
   * @param {boolean} isColliding - Indicates whether `rect1` and `rect2` are currently colliding.
   * @param {DOMRect} rect1 - The bounding box of the first element.
   * @param {DOMRect} rect2 - The bounding box of the second element.
   * @param {Element} elem1 - The element to track collision state for.
   * @param {CollisionDirLock} lockDirection - The direction from which the collision was first detected.
   * @returns {boolean} Returns `true` if the element is still considered colliding (locked), otherwise `false`.
   */
  static _isCollWithLock(isColliding, rect1, rect2, elem1, lockDirection) {
    const lockMap = __elemCollision[lockDirection];

    if (isColliding) {
      // Save entry direction
      if (!lockMap.has(elem1)) {
        lockMap.set(elem1, true);
      }
      return true;
    }

    // Handle unlock logic
    if (lockMap.has(elem1)) {
      let shouldUnlock = false;

      switch (lockDirection) {
        case 'top':
          shouldUnlock = areElsCollTop(rect1, rect2);
          break;
        case 'bottom':
          shouldUnlock = areElsCollBottom(rect1, rect2);
          break;
        case 'left':
          shouldUnlock = areElsCollLeft(rect1, rect2);
          break;
        case 'right':
          shouldUnlock = areElsCollRight(rect1, rect2);
          break;
      }

      if (shouldUnlock) lockMap.delete(elem1);

      return lockMap.has(elem1); // still colliding (locked)
    }

    return false;
  }

  /**
   * Checks if two DOM elements are colliding on the screen, and locks the collision
   * until the element exits through the same side it entered.
   *
   * @param {TinyElement} el1 - First DOM element (e.g. draggable or moving element).
   * @param {TinyElement} el2 - Second DOM element (e.g. a container or boundary element).
   * @param {CollisionDirLock} lockDirection - Direction that must be respected to unlock the collision.
   * @param {Partial<ObjRect>} [extraRect] - Optional values to expand the size of the first element's rect.
   * @returns {boolean} True if collision is still active.
   */
  static isCollWithLock(el1, el2, lockDirection, extraRect = {}) {
    const elem1 = TinyHtml._preElem(el1, 'isCollWithLock');
    const elem2 = TinyHtml._preElem(el2, 'isCollWithLock');
    const rect1 = TinyHtml._getCustomRect(elem1.getBoundingClientRect(), extraRect);
    const rect2 = elem2.getBoundingClientRect();
    const isColliding = areElsColliding(rect1, rect2);
    return TinyHtml._isCollWithLock(isColliding, rect1, rect2, elem1, lockDirection);
  }

  /**
   * Checks if two DOM elements are colliding on the screen, and locks the collision
   * until the element exits through the same side it entered.
   *
   * @param {TinyElement} el2 - Second DOM element (e.g. a container or boundary element).
   * @param {CollisionDirLock} lockDirection - Direction that must be respected to unlock the collision.
   * @param {Partial<ObjRect>} [extraRect] - Optional values to expand the size of the first element's rect.
   * @returns {boolean} True if collision is still active.
   */
  isCollWithLock(el2, lockDirection, extraRect) {
    return TinyHtml.isCollWithLock(this, el2, lockDirection, extraRect);
  }

  /**
   * Checks if two DOM elements are colliding on the screen, and locks the collision
   * until the element exits through the same side it entered.
   *
   * @param {TinyElement} el1 - First DOM element (e.g. draggable or moving element).
   * @param {TinyElement} el2 - Second DOM element (e.g. a container or boundary element).
   * @param {CollisionDirLock} lockDirection - Direction that must be respected to unlock the collision.
   * @param {Partial<ObjRect>} [extraRect] - Optional values to expand the size of the first element's rect.
   * @returns {boolean} True if collision is still active.
   */
  static isCollPerfWithLock(el1, el2, lockDirection, extraRect = {}) {
    const elem1 = TinyHtml._preElem(el1, 'isCollPerfWithLock');
    const elem2 = TinyHtml._preElem(el2, 'isCollPerfWithLock');
    const rect1 = TinyHtml._getCustomRect(elem1.getBoundingClientRect(), extraRect);
    const rect2 = elem2.getBoundingClientRect();
    const isColliding = areElsPerfColliding(rect1, rect2);
    return TinyHtml._isCollWithLock(isColliding, rect1, rect2, elem1, lockDirection);
  }

  /**
   * Checks if two DOM elements are colliding on the screen, and locks the collision
   * until the element exits through the same side it entered.
   *
   * @param {TinyElement} el2 - Second DOM element (e.g. a container or boundary element).
   * @param {CollisionDirLock} lockDirection - Direction that must be respected to unlock the collision.
   * @param {Partial<ObjRect>} [extraRect] - Optional values to expand the size of the first element's rect.
   * @returns {boolean} True if collision is still active.
   */
  isCollPerfWithLock(el2, lockDirection, extraRect) {
    return TinyHtml.isCollPerfWithLock(this, el2, lockDirection, extraRect);
  }

  /**
   * Resets all collision locks for a specific element (for all directions).
   *
   * @param {TinyElement} el - The element whose locks should be removed.
   * @returns {boolean} True if at least one lock was removed.
   */
  static resetCollLock(el) {
    const elem = TinyHtml._preElem(el, 'resetCollLock');
    let removed = false;

    for (const dir of /** @type {CollisionDirLock[]} */ (['top', 'bottom', 'left', 'right'])) {
      if (__elemCollision[dir].has(elem)) {
        __elemCollision[dir].delete(elem);
        removed = true;
      }
    }

    return removed;
  }

  /**
   * Resets the collision lock for a specific element.
   *
   * This removes any previously stored collision direction for the given element,
   * effectively unlocking its collision state.
   *
   * @returns {boolean} Returns `true` if a lock was removed, `false` if no lock was present.
   */
  resetCollLock() {
    return TinyHtml.resetCollLock(this);
  }

  /**
   * Resets the collision lock for a specific element and direction.
   *
   * @param {TinyElement} el - The element whose lock should be removed.
   * @param {CollisionDirLock} direction - The direction to clear the lock from.
   * @returns {boolean} True if the lock was removed.
   */
  static resetCollLockDir(el, direction) {
    const elem = TinyHtml._preElem(el, 'resetCollLockDir');
    const lockMap = __elemCollision[direction];

    if (lockMap.has(elem)) {
      lockMap.delete(elem);
      return true;
    }

    return false;
  }

  /**
   * Resets the collision lock for a specific element and direction.
   *
   * @param {CollisionDirLock} direction - The direction to clear the lock from.
   * @returns {boolean} True if the lock was removed.
   */
  resetCollLockDir(direction) {
    return TinyHtml.resetCollLockDir(this, direction);
  }

  //////////////////////////////////////////////////////////////////////////////

  // TITLE: Viewport Stuff

  /**
   * Checks if the given element is at least partially visible in the viewport.
   *
   * @param {TinyElement} el - The DOM element to check.
   * @returns {boolean} True if the element is partially in the viewport, false otherwise.
   */
  static isInViewport(el) {
    const elem = TinyHtml._preElem(el, 'isInViewport');
    if (
      !elem.checkVisibility({
        contentVisibilityAuto: false,
        opacityProperty: false,
        visibilityProperty: false,
      })
    )
      return false;
    const elementTop = TinyHtml.offset(elem).top;
    const elementBottom = elementTop + TinyHtml.outerHeight(elem);

    const viewportTop = TinyHtml.scrollTop(window);
    const viewportBottom = viewportTop + TinyHtml.height(window);

    return elementBottom > viewportTop && elementTop < viewportBottom;
  }

  /**
   * Checks if the given element is at least partially visible in the viewport.
   *
   * @returns {boolean} True if the element is partially in the viewport, false otherwise.
   */
  isInViewport() {
    return TinyHtml.isInViewport(this);
  }

  /**
   * Checks if the given element is fully visible in the viewport (top and bottom).
   *
   * @param {TinyElement} el - The DOM element to check.
   * @returns {boolean} True if the element is fully visible in the viewport, false otherwise.
   */
  static isScrolledIntoView(el) {
    const elem = TinyHtml._preElem(el, 'isScrolledIntoView');
    if (
      !elem.checkVisibility({
        contentVisibilityAuto: false,
        opacityProperty: false,
        visibilityProperty: false,
      })
    )
      return false;
    const docViewTop = TinyHtml.scrollTop(window);
    const docViewBottom = docViewTop + TinyHtml.height(window);

    const elemTop = TinyHtml.offset(elem).top;
    const elemBottom = elemTop + TinyHtml.height(elem);

    return elemBottom <= docViewBottom && elemTop >= docViewTop;
  }

  /**
   * Checks if the given element is fully visible in the viewport (top and bottom).
   *
   * @returns {boolean} True if the element is fully visible in the viewport, false otherwise.
   */
  isScrolledIntoView() {
    return TinyHtml.isScrolledIntoView(this);
  }

  /**
   * Checks if the given element is at least partially visible within the boundaries of a container.
   *
   * @param {TinyElement} el - The DOM element to check.
   * @param {TinyElement} cont - The container element acting as the viewport.
   * @returns {boolean} True if the element is partially visible within the container, false otherwise.
   */
  static isInContainer(el, cont) {
    const elem = TinyHtml._preElem(el, 'isInContainer');
    const container = TinyHtml._preElem(cont, 'isInContainer');

    if (
      !elem.checkVisibility({
        contentVisibilityAuto: false,
        opacityProperty: false,
        visibilityProperty: false,
      })
    )
      return false;
    const elemRect = elem.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const verticallyVisible =
      elemRect.bottom > containerRect.top && elemRect.top < containerRect.bottom;

    const horizontallyVisible =
      elemRect.right > containerRect.left && elemRect.left < containerRect.right;

    return verticallyVisible && horizontallyVisible;
  }

  /**
   * Checks if the given element is at least partially visible within the boundaries of a container.
   *
   * @param {TinyElement} cont - The container element acting as the viewport.
   * @returns {boolean} True if the element is partially visible within the container, false otherwise.
   */
  isInContainer(cont) {
    return TinyHtml.isInContainer(this, cont);
  }

  /**
   * Checks if the given element is fully visible within the boundaries of a container (top and bottom).
   *
   * @param {TinyElement} el - The DOM element to check.
   * @param {TinyElement} cont - The container element acting as the viewport.
   * @returns {boolean} True if the element is fully visible within the container, false otherwise.
   */
  static isFullyInContainer(el, cont) {
    const elem = TinyHtml._preElem(el, 'isScrolledIntoView');
    const container = TinyHtml._preElem(cont, 'isInContainer');

    if (
      !elem.checkVisibility({
        contentVisibilityAuto: false,
        opacityProperty: false,
        visibilityProperty: false,
      })
    )
      return false;
    const elemRect = elem.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    const isFullyVisible =
      elemRect.top >= containerRect.top &&
      elemRect.bottom <= containerRect.bottom &&
      elemRect.left >= containerRect.left &&
      elemRect.right <= containerRect.right;

    return isFullyVisible;
  }

  /**
   * Checks if the given element is fully visible within the boundaries of a container (top and bottom).
   *
   * @param {TinyElement} cont - The container element acting as the viewport.
   * @returns {boolean} True if the element is fully visible within the container, false otherwise.
   */
  isFullyInContainer(cont) {
    return TinyHtml.isFullyInContainer(this, cont);
  }

  // TITLE: Has Scroll

  /**
   * Checks if an element has scrollable content.
   *
   * @param {TinyElement} el - The DOM element to check.
   * @returns {{ v: boolean, h: boolean }} - True if scroll is needed in that direction.
   */
  static hasScroll(el) {
    const elem = TinyHtml._preElem(el, 'hasScroll');
    return {
      v: elem.scrollHeight > elem.clientHeight,
      h: elem.scrollWidth > elem.clientWidth,
    };
  }

  /**
   * Checks if an element has scrollable content.
   *
   * @returns {{ v: boolean, h: boolean }} - True if scroll is needed in that direction.
   */
  hasScroll() {
    return TinyHtml.hasScroll(this);
  }
}

export default TinyHtml;
