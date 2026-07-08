import { EventEmitter } from 'events';
import TinyHtml from './TinyHtml.mjs';
import * as TinyCollision from '../basics/collision.mjs';

/**
 * Represents the dimensions of a DOM element.
 *
 * @typedef {Object} NodeSizes
 * @property {number} height - The height of the element in pixels.
 * @property {number} width - The width of the element in pixels.
 */

/**
 * A callback function that receives node size change data and optionally returns a modified NodeSizes object.
 *
 * @callback NodeSizesEvent
 * @param {Element} elem - The DOM element whose size is being tracked.
 * @param {{ old: NodeSizes, now: NodeSizes }} sizes - The old and new size measurements of the element.
 * @param {{ old: number, now: number }} elemAmount - The number of matching elements before and after the update.
 * @returns {NodeSizes|undefined} A modified NodeSizes object to override the default measurement, or undefined to use the original.
 */

/**
 * A generic scroll-related event listener callback function.
 *
 * @callback ScrollListenersFunc
 * @param {any} payload - The data payload passed when the scroll event is triggered. The type may vary depending on the event.
 * @returns {void}
 */

/**
 * TinySmartScroller is a utility class designed to enhance and manage scroll behaviors within containers or the window.
 *
 * It enables advanced scroll monitoring, auto-scrolling to bottom, preserving scroll position during DOM changes,
 * and detecting visibility changes of elements. This is particularly useful for dynamic UIs like chat applications,
 * feed viewers, or live content containers.
 *
 * Features:
 * - Detects when the scroll reaches the top, bottom, or custom boundaries
 * - Supports automatic scrolling to the bottom unless the user scrolls away
 * - Observes DOM mutations and resizes, and adapts scroll position accordingly
 * - Emits scroll-related events such as 'onScrollBoundary', 'onAutoScroll', and 'onScrollPause'
 * - Includes customizable scroll correction filters for layout shift mitigation
 * - Handles media element load events (e.g. `<img>`, `<iframe>`, `<video>`) to prevent sudden scroll jumps
 *
 * This class is **not framework-dependent** and works with vanilla DOM elements and the window object.
 * @template {Element|Window} HTMLTarget
 */
class TinySmartScroller extends EventEmitter {
  static Utils = { ...TinyCollision, TinyHtml };

  /** @type {WeakMap<Element, NodeSizes>} */
  #oldSizes = new WeakMap();
  /** @type {WeakMap<Element, NodeSizes>} */
  #newSizes = new WeakMap();

  /** @type {WeakMap<Element, boolean>} */
  #newVisibles = new WeakMap();
  /** @type {WeakMap<Element, boolean>} */
  #oldVisibles = new WeakMap();

  /** @type {WeakMap<Element, boolean>} */
  #newVisiblesByTime = new WeakMap();
  /** @type {WeakMap<Element, boolean>} */
  #oldVisiblesByTime = new WeakMap();

  /** @type {ResizeObserver|null} */
  #resizeObserver = null;
  /** @type {MutationObserver|null} */
  #mutationObserver = null;

  /** @type {Set<string>} */
  #loadTags = new Set(['IMG', 'IFRAME', 'VIDEO']);

  /** @type {null|EventListenerOrEventListenerObject} */
  #handler = null;

  #isPastAtBottom = false;
  #isPastAtTop = false;
  #isPastAtCustomTop = false;
  #isPastAtCustomBottom = false;

  #isAtBottom = false;
  #isAtTop = false;
  #isAtCustomTop = false;
  #isAtCustomBottom = false;

  #querySelector = '';
  #useWindow = false;
  #destroyed = false;
  #scrollPaused = false;
  #autoScrollBottom = false;
  #observeMutations = false;
  #preserveScrollOnLayoutShift = false;
  #debounceTime = 0;
  #elemAmount = 0;
  #elemOldAmount = 0;
  #lastKnownScrollBottomOffset = 0;
  #extraScrollBoundary = 0;

  /** @type {Set<string>} */
  #attributeFilter;

  /** @type {Element} */
  #targetElement;

  /** @type {HTMLTarget} */
  #target;

  /** @type {Set<NodeSizesEvent>} */
  #sizeFilter = new Set();

  /**
   * Creates a new instance of TinySmartScroller, attaching scroll and resize observers to manage
   * automatic scroll behaviors, layout shift correction, and visibility tracking.
   *
   * @param {HTMLTarget} target - The scroll container to monitor. Can be an element or `window`.
   * @param {Object} [options={}] - Optional settings to configure scroll behavior.
   * @param {number} [options.extraScrollBoundary=0] - Extra margin in pixels to extend scroll boundary detection.
   * @param {boolean} [options.autoScrollBottom=true] - Whether to auto-scroll to bottom on layout updates.
   * @param {boolean} [options.observeMutations=true] - Enables MutationObserver to detect DOM changes.
   * @param {boolean} [options.preserveScrollOnLayoutShift=true] - Prevents scroll jumps when layout changes.
   * @param {number} [options.debounceTime=100] - Debounce time in milliseconds for scroll events.
   * @param {string|null} [options.querySelector=null] - Optional CSS selector to filter observed child nodes.
   * @param {string[]|Set<string>|null} [options.attributeFilter=['class', 'style', 'src', 'data-*', 'height', 'width']]
   *     - Which attributes to observe for changes.
   */
  constructor(
    target,
    {
      extraScrollBoundary = 0,
      autoScrollBottom = true,
      observeMutations = true,
      preserveScrollOnLayoutShift = true,
      debounceTime = 100,
      querySelector = null,
      attributeFilter = ['class', 'style', 'src', 'data-*', 'height', 'width'],
    } = {},
  ) {
    super();
    // === target ===
    if (!(
      target instanceof Element ||
      // @ts-ignore
      target === window
    ))
      throw new TypeError(
        `TinySmartScroller: 'target' must be a DOM Element or 'window', but got ${typeof target}`,
      );
    // === extraScrollBoundary ===
    if (typeof extraScrollBoundary !== 'number' || Number.isNaN(extraScrollBoundary))
      throw new TypeError(
        `TinySmartScroller: 'extraScrollBoundary' must be a valid number, received ${extraScrollBoundary}`,
      );
    // === autoScrollBottom ===
    if (typeof autoScrollBottom !== 'boolean')
      throw new TypeError(
        `TinySmartScroller: 'autoScrollBottom' must be a boolean, received ${typeof autoScrollBottom}`,
      );
    // === observeMutations ===
    if (typeof observeMutations !== 'boolean')
      throw new TypeError(
        `TinySmartScroller: 'observeMutations' must be a boolean, received ${typeof observeMutations}`,
      );
    // === preserveScrollOnLayoutShift ===
    if (typeof preserveScrollOnLayoutShift !== 'boolean')
      throw new TypeError(
        `TinySmartScroller: 'preserveScrollOnLayoutShift' must be a boolean, received ${typeof preserveScrollOnLayoutShift}`,
      );
    // === debounceTime ===
    if (typeof debounceTime !== 'number' || debounceTime < 0 || Number.isNaN(debounceTime))
      throw new TypeError(
        `TinySmartScroller: 'debounceTime' must be a non-negative number, received ${debounceTime}`,
      );
    // === querySelector ===
    if (querySelector !== null && typeof querySelector !== 'string')
      throw new TypeError(
        `TinySmartScroller: 'querySelector' must be a string or null, received ${typeof querySelector}`,
      );
    // === attributeFilter ===
    const isValidAttrList =
      attributeFilter === null || Array.isArray(attributeFilter) || attributeFilter instanceof Set;
    if (!isValidAttrList)
      throw new TypeError(
        `TinySmartScroller: 'attributeFilter' must be an array, Set, or null. Got ${typeof attributeFilter}`,
      );

    // Start values
    this.#target = target;
    this.#targetElement = target instanceof Window ? document.documentElement : target;
    this.#useWindow = target instanceof Window;
    this.#autoScrollBottom = autoScrollBottom;
    this.#observeMutations = observeMutations;
    this.#preserveScrollOnLayoutShift = preserveScrollOnLayoutShift;
    this.#debounceTime = debounceTime;
    this.#extraScrollBoundary = extraScrollBoundary;
    this.#querySelector = querySelector || '';
    this.#attributeFilter = new Set(attributeFilter || undefined);

    // Bind scroll
    /** @type {NodeJS.Timeout} */
    let timeout;
    this.#handler = () => {
      this._scrollDataUpdater();
      clearTimeout(timeout);
      timeout = setTimeout(() => this._onScroll(), this.#debounceTime);
    };
    (this.#useWindow ? window : this.#targetElement).addEventListener('scroll', this.#handler, {
      passive: true,
    });

    // Mutations
    if (this.#observeMutations) {
      this._observeMutations();
      this._observeResizes(this.#targetElement.children);
    }

    this._scrollDataUpdater();
  }

  /**
   * Returns a size difference callback that only reacts when height changes, filtered by tag name.
   *
   * @param {string[]} filter - List of tag names to allow. If empty, all tags are accepted.
   * @returns {NodeSizesEvent} A function that compares previous and current height, returning height delta.
   */
  getSimpleOnHeight(filter = []) {
    if (!Array.isArray(filter))
      throw new TypeError('getSimpleOnHeight(filter): filter must be an array of tag names');
    return (elem, sizes, amounts) => {
      if ((filter.length > 0 && !filter.includes(elem.tagName)) || amounts.now !== amounts.old)
        return;
      const oldSize = sizes.old;
      const newSize = sizes.now;
      const height = newSize.height - oldSize.height;
      return { height, width: 0 };
    };
  }

  /**
   * Adds a height difference callback to the size filter system.
   *
   * @param {string[]} filter - List of tag names to allow.
   * @returns {NodeSizesEvent} The added size difference callback.
   */
  addSimpleOnHeight(filter) {
    if (!Array.isArray(filter))
      throw new TypeError('addSimpleOnHeight(filter): filter must be an array of tag names');
    const result = this.getSimpleOnHeight(filter);
    this.onSize(result);
    return result;
  }

  /**
   * Returns a list of all currently tracked load tags.
   *
   * @returns {string[]} Array of tag names.
   */
  getLoadTags() {
    return Array.from(this.#loadTags);
  }

  /**
   * Adds a new tag to the set of load tags.
   *
   * @param {string} tag - The tag name to add (e.g., 'IMG').
   */
  addLoadTag(tag) {
    if (typeof tag !== 'string') throw new TypeError('addLoadTag(tag): tag must be a string');
    this.#loadTags.add(tag.toUpperCase());
  }

  /**
   * Removes a tag from the set of load tags.
   *
   * @param {string} tag - The tag name to remove.
   */
  removeLoadTag(tag) {
    if (typeof tag !== 'string') throw new TypeError('removeLoadTag(tag): tag must be a string');
    this.#loadTags.delete(tag.toUpperCase());
  }

  /**
   * Checks whether a tag is tracked as a load tag.
   *
   * @param {string} tag - The tag name to check.
   * @returns {boolean} True if the tag is being tracked.
   */
  hasLoadTag(tag) {
    if (typeof tag !== 'string') throw new TypeError('hasLoadTag(tag): tag must be a string');
    return this.#loadTags.has(tag.toUpperCase());
  }

  /**
   * Clears the set of load tags. If `addDefault` is true, it will reset to the default tags: 'IMG', 'IFRAME', and 'VIDEO'.
   *
   * @param {boolean} [addDefault=false] - Whether to restore the default tags after clearing.
   * @throws {TypeError} If `addDefault` is not a boolean.
   */
  resetLoadTags(addDefault = false) {
    if (typeof addDefault !== 'boolean')
      throw new TypeError('resetLoadTags(addDefault): addDefault must be a boolean');
    this.#loadTags.clear();
    if (!addDefault) return;
    this.#loadTags.add('IMG');
    this.#loadTags.add('IFRAME');
    this.#loadTags.add('VIDEO');
  }

  /**
   * Returns a list of all currently tracked attribute filters.
   *
   * @returns {string[]} Array of attribute names.
   */
  getAttributeFilters() {
    return Array.from(this.#attributeFilter);
  }

  /**
   * Adds an attribute to the filter list.
   *
   * @param {string} attr - The attribute name to add.
   */
  addAttributeFilter(attr) {
    if (typeof attr !== 'string')
      throw new TypeError('addAttributeFilter(attr): attr must be a string');
    this.#attributeFilter.add(attr);
  }

  /**
   * Removes an attribute from the filter list.
   *
   * @param {string} attr - The attribute name to remove.
   */
  removeAttributeFilter(attr) {
    if (typeof attr !== 'string')
      throw new TypeError('removeAttributeFilter(attr): attr must be a string');
    this.#attributeFilter.delete(attr);
  }

  /**
   * Checks whether a specific attribute is being filtered.
   *
   * @param {string} attr - The attribute name to check.
   * @returns {boolean} True if the attribute is being filtered.
   */
  hasAttributeFilter(attr) {
    if (typeof attr !== 'string')
      throw new TypeError('hasAttributeFilter(attr): attr must be a string');
    return this.#attributeFilter.has(attr);
  }

  /**
   * Clears the set of observed attribute filters. If `addDefault` is true, it will reset to the default attributes:
   * 'class', 'style', 'src', 'data-*', 'height', and 'width'.
   *
   * @param {boolean} [addDefault=false] - Whether to restore the default attribute filters after clearing.
   * @throws {TypeError} If `addDefault` is not a boolean.
   */
  resetAttributeFilters(addDefault = false) {
    if (typeof addDefault !== 'boolean')
      throw new TypeError('resetAttributeFilters(addDefault): addDefault must be a boolean');
    this.#attributeFilter.clear();
    if (!addDefault) return;
    ['class', 'style', 'src', 'data-*', 'height', 'width'].forEach((attr) =>
      this.#attributeFilter.add(attr),
    );
  }

  /**
   * Registers a custom node size change handler to the internal size filter set.
   *
   * @param {NodeSizesEvent} handler - Function that compares old and new sizes.
   */
  onSize(handler) {
    if (this.#destroyed) return;
    if (typeof handler !== 'function')
      throw new TypeError('onSize(handler): handler must be a function');
    this.#sizeFilter.add(handler);
  }

  /**
   * Unregisters a previously registered size handler from the internal filter set.
   *
   * @param {NodeSizesEvent} handler - The handler function to remove.
   */
  offSize(handler) {
    if (this.#destroyed) return;
    if (typeof handler !== 'function')
      throw new TypeError('offSize(handler): handler must be a function');
    this.#sizeFilter.delete(handler);
  }

  /**
   * Checks which elements inside the target are currently visible and updates internal maps.
   *
   * @returns {Map<Element, { oldIsVisible: boolean; isVisible: boolean }>} Visibility comparison results.
   */
  _scrollDataUpdater() {
    const results = new Map();
    this.#targetElement.querySelectorAll(this.#querySelector || '*').forEach((target) => {
      const oldIsVisible = this.#newVisibles.get(target) ?? false;
      this.#oldVisibles.set(target, oldIsVisible);

      const isVisible = TinyHtml.isInContainer(this.#targetElement, target);
      this.#newVisibles.set(target, isVisible);

      results.set(target, { oldIsVisible, isVisible });
    });
    return results;
  }

  /**
   * Handles scroll events, calculates position-related statuses, and emits appropriate events.
   */
  _onScroll() {
    if (this.#destroyed) return;
    // Get values
    const scrollCache = this._scrollDataUpdater();
    const el = this.#targetElement;
    const scrollTop = el.scrollTop;
    const scrollHeight = el.scrollHeight;
    const clientHeight = el.clientHeight;

    // Prepare sroll values
    const scrollResult = { scrollTop, scrollHeight, clientHeight };
    let atResult = null;
    let atCustomResult = null;

    const atTop = scrollTop === 0;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 1;

    const atCustomTop = scrollTop <= 0 + this.#extraScrollBoundary;
    const atCustomBottom = scrollTop + clientHeight >= scrollHeight - 1 - this.#extraScrollBoundary;

    // Scroll results
    if (atTop && atBottom) atResult = 'all';
    else if (atTop) atResult = 'top';
    else if (atBottom) atResult = 'bottom';

    if (atCustomTop && atCustomBottom) atCustomResult = 'all';
    else if (atCustomTop) atCustomResult = 'top';
    else if (atCustomBottom) atCustomResult = 'bottom';

    this.#isPastAtTop = this.#isAtTop ?? false;
    this.#isPastAtBottom = this.#isAtBottom ?? false;

    this.#isPastAtCustomTop = this.#isAtCustomTop ?? false;
    this.#isPastAtCustomBottom = this.#isAtCustomBottom ?? false;

    this.#isAtTop = atTop;
    this.#isAtBottom = atBottom;

    this.#isAtCustomTop = atCustomTop;
    this.#isAtCustomBottom = atCustomBottom;

    this.#scrollPaused = !(this.#autoScrollBottom && this.#isAtBottom);

    this.#lastKnownScrollBottomOffset = scrollHeight - scrollTop - clientHeight;

    // Send results
    this.emit('onScrollBoundary', { status: atResult, ...scrollResult, scrollCache });
    this.emit('onExtraScrollBoundary', { status: atCustomResult, ...scrollResult, scrollCache });

    if (!this.#scrollPaused) {
      this.emit('onAutoScroll', { ...scrollResult, scrollCache });
    } else {
      this.emit('onScrollPause', { ...scrollResult, scrollCache });
    }
  }

  /**
   * Attempts to correct the scroll position when layout shifts happen, preserving the user position if needed.
   *
   * @param {Element[]} [targets=[]] - List of elements involved in the size change.
   */
  _fixScroll(targets = []) {
    if (this.#destroyed) return;
    // === Validation ===
    if (!Array.isArray(targets))
      throw new TypeError('_fixScroll: targets must be an array of Elements');

    // Get Scroll data
    const prevScrollHeight = this.#targetElement.scrollHeight;
    const prevScrollTop = this.#targetElement.scrollTop;
    const prevBottomOffset =
      this.#targetElement.scrollHeight -
      this.#targetElement.scrollTop -
      this.#targetElement.clientHeight;

    // Get new size
    const newScrollHeight = this.#targetElement.scrollHeight;
    const heightDelta = newScrollHeight - prevScrollHeight;

    /** @type {() => NodeSizes} */
    const calculateScrollSize = () => {
      // Run size getter
      const scrollSize = { height: 0, width: 0 };
      for (const target of targets) {
        const tgOs = this.#oldSizes.get(target) || { height: 0, width: 0 };
        const tgNs = this.#newSizes.get(target) || { height: 0, width: 0 };
        this.#sizeFilter.forEach((fn) => {
          /** @type {NodeSizes| undefined} */
          const sizes = fn(
            target,
            { old: tgOs, now: tgNs },
            { old: this.#elemOldAmount, now: this.#elemAmount },
          );

          // Fix size
          if (this.#newVisibles.get(target) || this.#newVisiblesByTime.get(target)) {
            if (typeof sizes !== 'undefined' && typeof sizes !== 'object')
              throw new Error('_fixScroll: size filter must return an object or undefined');
            if (typeof sizes === 'undefined') return;
            scrollSize.height = sizes.height;
            scrollSize.width = sizes.width;
          }
        });
      }

      // Checker
      if (typeof scrollSize.height !== 'number' && scrollSize.height < 0)
        throw new Error('_fixScroll: invalid scrollSize.height value');
      if (typeof scrollSize.width !== 'number' && scrollSize.width < 0)
        throw new Error('_fixScroll: invalid scrollSize.width value');

      if (scrollSize.height !== 0 || scrollSize.width !== 0) {
        for (const target of targets) {
          this.#newVisiblesByTime.set(target, this.#newVisibles.get(target) ?? false);
          this.#oldVisiblesByTime.set(target, this.#oldVisibles.get(target) ?? false);
        }
      }

      return scrollSize;
    };

    // Fix scroll size
    if (
      this.#elemOldAmount > 0 &&
      TinyHtml.hasScroll(this.#targetElement).v &&
      this.#autoScrollBottom &&
      this.#preserveScrollOnLayoutShift &&
      !this.#isAtBottom &&
      !this.#isAtTop
    ) {
      const scrollSize = calculateScrollSize();
      // Complete
      this.#targetElement.scrollTop = prevScrollTop + heightDelta + scrollSize.height;
      if (scrollSize.width > 0)
        this.#targetElement.scrollLeft = this.#targetElement.scrollLeft + scrollSize.width;
    }

    // Normal stuff
    else if (!this.#scrollPaused && this.#autoScrollBottom) {
      calculateScrollSize();
      this.scrollToBottom();
    } else if (!this.#autoScrollBottom && !this.#isAtBottom) {
      calculateScrollSize();
      this.#targetElement.scrollTop =
        this.#targetElement.scrollHeight - this.#targetElement.clientHeight - prevBottomOffset;
    }
  }
  /**
   * Sets up a MutationObserver to watch for DOM changes and react accordingly to maintain scroll consistency.
   */
  _observeMutations() {
    this.#mutationObserver = new MutationObserver((mutations) => {
      if (this.#destroyed) return;
      this._scrollDataUpdater();
      this.#elemOldAmount = this.#elemAmount;
      this.#elemAmount = this.#targetElement.childElementCount;

      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element) || node.nodeType !== 1) return;

          this._observeResizes([node]);
          this._listenLoadEvents(node);

          if (this.#querySelector) {
            const children = node.querySelectorAll(this.#querySelector);
            this._observeResizes(children);
            this._listenLoadEvents(children);
          }
        });
      });

      this._fixScroll();
    });

    // Install observer
    this.#mutationObserver.observe(this.#targetElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter:
        this.#attributeFilter.size > 0 ? Array.from(this.#attributeFilter) : undefined,
    });
  }

  /**
   * Adds a ResizeObserver to monitor elements' size changes and trigger layout adjustments.
   *
   * @param {NodeListOf<Element>|Element[]|HTMLCollection} elements - Elements to observe.
   */
  _observeResizes(elements) {
    // Add resize observer
    if (!this.#resizeObserver) {
      this.#resizeObserver = new ResizeObserver((entries) => {
        if (this.#destroyed) return;
        this._scrollDataUpdater();
        /** @type {Element[]} */
        const targets = [];
        for (const entry of entries) {
          // Target
          const target = entry.target;

          // Update old size
          const oldSize = this.#newSizes.get(target);
          if (oldSize) this.#oldSizes.set(target, oldSize);

          // Set new size
          const { width, height } = entry.contentRect;
          this.#newSizes.set(target, { width, height });
          targets.push(target);
        }

        // Animation frame
        this._fixScroll(targets);
      });
    }

    // Execute observer
    Array.from(elements).forEach((el) => {
      if (!this.#resizeObserver)
        throw new Error('_observeResizes: ResizeObserver instance is not initialized');
      this.#resizeObserver.observe(el);
    });
  }

  /**
   * Listens for media/content load events (e.g., images, iframes, videos) to trigger scroll updates.
   *
   * @param {NodeListOf<Element>|Element} elements - Target element(s) to listen on.
   */
  _listenLoadEvents(elements) {
    if (this.#destroyed) return;
    const list = elements instanceof NodeList ? Array.from(elements) : [elements];

    list.forEach((el) => {
      if (this.#loadTags.has(el.tagName)) {
        // @ts-ignore
        if (!el.complete) {
          el.addEventListener('load', () => {
            this._scrollDataUpdater();
            if (!this.#scrollPaused && this.#autoScrollBottom) {
              this.scrollToBottom();
            }
          });
        }
      }
    });
  }

  get target() {
    return this.#target;
  }

  /**
   * Returns the internal scroll container element being monitored.
   */
  get targetElement() {
    return this.#targetElement;
  }

  /**
   * Returns the previous size of a given element, or undefined if not tracked.
   *
   * @param {Element} el - The DOM element to query.
   * @returns {NodeSizes|null} The old size, or undefined.
   */
  getOldSize(el) {
    return this.#oldSizes.get(el) ?? null;
  }

  /**
   * Returns the current size of a given element, or undefined if not tracked.
   *
   * @param {Element} el - The DOM element to query.
   * @returns {NodeSizes|null} The new size, or undefined.
   */
  getNewSize(el) {
    return this.#newSizes.get(el) ?? null;
  }

  /**
   * Returns whether the given element was visible in the last scroll update.
   *
   * @param {Element} el - The DOM element to check.
   * @returns {boolean} True if visible, false if not, or undefined if not tracked.
   */
  wasVisible(el) {
    return this.#oldVisibles.get(el) ?? false;
  }

  /**
   * Returns whether the given element is currently visible.
   *
   * @param {Element} el - The DOM element to check.
   * @returns {boolean} True if visible, false if not, or undefined if not tracked.
   */
  isVisible(el) {
    return this.#newVisibles.get(el) ?? false;
  }

  /**
   * Returns whether the element was visible in the last time-based visibility check.
   *
   * @param {Element} el - The DOM element to check.
   * @returns {boolean} Visibility state from the previous timed check.
   */
  wasTimedVisible(el) {
    return this.#oldVisiblesByTime.get(el) ?? false;
  }

  /**
   * Returns whether the element is currently visible in the time-based check.
   *
   * @param {Element} el - The DOM element to check.
   * @returns {boolean} Visibility state from the current timed check.
   */
  isTimedVisible(el) {
    return this.#newVisiblesByTime.get(el) ?? false;
  }

  /**
   * Sets the extra scroll boundary margin used when determining if the user is at a "custom" bottom or top.
   *
   * @param {number} value - Pixels of additional margin to use.
   */
  setExtraScrollBoundary(value) {
    if (typeof value !== 'number' || Number.isNaN(value))
      throw new TypeError('setExtraScrollBoundary(value): value must be a valid number');
    this.#extraScrollBoundary = value;
  }

  /**
   * Returns the current extra scroll boundary setting.
   *
   * @returns {number}
   */
  getExtraScrollBoundary() {
    return this.#extraScrollBoundary;
  }

  /**
   * Returns the last known distance (in pixels) from the bottom of the scroll container.
   *
   * @returns {number}
   */
  getLastKnownScrollBottomOffset() {
    return this.#lastKnownScrollBottomOffset;
  }

  /**
   * Forces the scroll position to move to the very bottom of the target.
   */
  scrollToBottom() {
    this.#targetElement.scrollTop = this.#targetElement.scrollHeight;
  }

  /**
   * Forces the scroll position to move to the very top of the target.
   */
  scrollToTop() {
    this.#targetElement.scrollTop = 0;
  }

  /**
   * Checks if the user is within the defined extra scroll boundary from the bottom.
   *
   * @returns {boolean}
   */
  isAtCustomBottom() {
    return this.#isAtCustomBottom;
  }

  /**
   * Checks if the user is within the defined extra scroll boundary from the top.
   *
   * @returns {boolean}
   */
  isAtCustomTop() {
    return this.#isAtCustomTop;
  }

  /**
   * Returns true if the user is currently scrolled to the bottom of the element.
   *
   * @returns {boolean}
   */
  isAtBottom() {
    return this.#isAtBottom;
  }

  /**
   * Returns true if the user is currently scrolled to the top of the element.
   *
   * @returns {boolean}
   */
  isAtTop() {
    return this.#isAtTop;
  }

  /**
   * Returns true if the user has already passed beyond the bottom boundary at some point.
   *
   * @returns {boolean}
   */
  isPastAtBottom() {
    return this.#isPastAtBottom;
  }

  /**
   * Returns true if the user has already passed beyond the top boundary at some point.
   *
   * @returns {boolean}
   */
  isPastAtTop() {
    return this.#isPastAtTop;
  }

  /**
   * Returns true if the user has passed beyond the defined extra scroll boundary from the top at some point.
   *
   * @returns {boolean}
   */
  isPastAtCustomTop() {
    return this.#isPastAtCustomTop;
  }

  /**
   * Returns true if the user has passed beyond the defined extra scroll boundary from the bottom at some point.
   *
   * @returns {boolean}
   */
  isPastAtCustomBottom() {
    return this.#isPastAtCustomBottom;
  }

  /**
   * Returns true if automatic scrolling is currently paused.
   *
   * @returns {boolean}
   */
  isScrollPaused() {
    return this.#scrollPaused;
  }

  /**
   * Returns whether the target is the window object.
   *
   * @returns {boolean} True if the scroll target is window, false otherwise.
   */
  isWindow() {
    return this.#useWindow;
  }

  /**
   * Returns whether the instance has been destroyed.
   *
   * @returns {boolean} True if the instance is destroyed, false otherwise.
   */
  isDestroyed() {
    return this.#destroyed;
  }

  /**
   * Returns whether auto-scroll-to-bottom is enabled.
   *
   * @returns {boolean} True if auto-scroll is active, false otherwise.
   */
  getAutoScrollBottom() {
    return this.#autoScrollBottom;
  }

  /**
   * Returns whether MutationObserver is enabled.
   *
   * @returns {boolean} True if mutation observation is active, false otherwise.
   */
  getObserveMutations() {
    return this.#observeMutations;
  }

  /**
   * Returns whether layout shift protection is enabled.
   *
   * @returns {boolean} True if scroll preservation is active, false otherwise.
   */
  getPreserveScrollOnLayoutShift() {
    return this.#preserveScrollOnLayoutShift;
  }

  /**
   * Returns the debounce delay in milliseconds used for scroll events.
   *
   * @returns {number} Debounce delay time.
   */
  getDebounceTime() {
    return this.#debounceTime;
  }

  /**
   * Returns the current number of matching elements observed inside the scroll target.
   *
   * @returns {number} Current count of matching elements.
   */
  getElemAmount() {
    return this.#elemAmount;
  }

  /**
   * Returns the previous known count of matching elements from the last update.
   *
   * @returns {number} Previous count of matching elements.
   */
  getPrevElemAmount() {
    return this.#elemOldAmount;
  }

  /**
   * Returns the query selector string used to filter observed elements.
   *
   * @returns {string} The CSS selector string, or an empty string if none was provided.
   */
  getQuerySelector() {
    return this.#querySelector;
  }

  /**
   * Disconnects all listeners, observers, and clears memory structures.
   * Once destroyed, this instance should no longer be used.
   */
  destroy() {
    if (this.#destroyed) return;
    this.#destroyed = true;

    // Disconnects MutationObserver
    if (this.#mutationObserver) {
      this.#mutationObserver.disconnect();
      this.#mutationObserver = null;
    }

    // Disconnect ResizeObserver
    if (this.#resizeObserver) {
      this.#resizeObserver.disconnect();
      this.#resizeObserver = null;
    }

    // Removes scroll listener
    const target = this.#useWindow ? window : this.#targetElement;
    if (this.#handler) target.removeEventListener('scroll', this.#handler);

    // Clean the WeakMaps
    this.#oldSizes = new WeakMap();
    this.#newSizes = new WeakMap();
    this.#newVisibles = new WeakMap();
    this.#oldVisibles = new WeakMap();
    this.#newVisiblesByTime = new WeakMap();
    this.#oldVisiblesByTime = new WeakMap();

    // Cleans listeners and filters
    this.removeAllListeners();
    this.#sizeFilter.clear();
    this.#loadTags.clear();
  }
}

export default TinySmartScroller;
