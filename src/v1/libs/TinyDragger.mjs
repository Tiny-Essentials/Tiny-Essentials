import TinyHtml from './TinyHtml.mjs';
import * as TinyCollision from '../basics/collision.mjs';
import { isJsonObject } from '../basics/objChecker.mjs';

/**
 * @typedef {Object} VibrationPatterns
 * @property {number[]|false} start - Pattern to vibrate on start
 * @property {number[]|false} end - Pattern to vibrate on end
 * @property {number[]|false} collide - Pattern to vibrate on collision
 * @property {number[]|false} move - Pattern to vibrate while moving
 */

/**
 * TinyDragger enables drag-and-drop functionality for a DOM element.
 * It supports jail boundaries, optional collision detection, vibration feedback,
 * automatic reverting, proxy dragging, and event dispatching.
 * @template {HTMLElement} HTMLTarget
 */
class TinyDragger {
  static Utils = { ...TinyCollision, TinyHtml };

  #enabled = true;
  #destroyed = false;

  #offsetY = 0;
  #offsetX = 0;

  #mirrorElem = true;
  #multiCollision = false;
  #lockInsideJail = false;
  #revertOnDrop = false;
  #dragging = false;
  #collisionByMouse = false;
  #dropInJailOnly = false;

  /** @type {HTMLElement|null} */
  #lastCollision = null;

  /** @type {HTMLElement[]} */
  #collidables = [];

  /** @type {HTMLElement|null} */
  #dragProxy = null;

  /** @type {VibrationPatterns} */
  #vibration = { start: false, end: false, collide: false, move: false };

  /** @type {HTMLElement|null} */
  #jail = null;

  /** @type {HTMLTarget} */
  #target;

  #dragHiddenClass = 'drag-hidden';
  #classDragging = 'dragging';
  #classBodyDragging = 'drag-active';
  #classJailDragging = 'jail-drag-active';
  #classJailDragDisabled = 'jail-drag-disabled';
  #classDragCollision = 'dragging-collision';
  #defaultZIndex = 9999;

  /** @typedef {(event: TouchEvent) => void} TouchDragEvent */

  /**
   * @param {HTMLTarget} targetElement - The element to make draggable.
   * @param {Object} [options={}] - Configuration options.
   * @param {HTMLElement} [options.jail] - Optional container to restrict dragging within.
   * @param {boolean} [options.mirrorElem=true] - Use a visual clone instead of dragging the original element.
   * @param {number} [options.defaultZIndex] - Sets the z-index value applied when dragging starts.
   * @param {boolean} [options.collisionByMouse=false] - Use mouse position for collision instead of element rect.
   * @param {string} [options.classDragging='dragging'] - CSS class applied to the clone during dragging.
   * @param {string} [options.classBodyDragging='drag-active'] - CSS class applied to <body> during dragging.
   * @param {string} [options.classJailDragging='jail-drag-active'] - CSS class applied to jail element during drag.
   * @param {string} [options.classJailDragDisabled='jail-drag-disabled'] - CSS class applied to jail element disabled.
   * @param {string} [options.classDragCollision='dragging-collision'] - CSS class applied to collision element.
   * @param {boolean} [options.lockInsideJail=false] - Restrict movement within the jail container.
   * @param {boolean} [options.dropInJailOnly=false] - Restrict drop within the jail container.
   * @param {boolean} [options.multiCollision=false] - Enables returning multiple collided elements.
   * @param {VibrationPatterns|false} [options.vibration=false] - Vibration feedback configuration.
   * @param {boolean} [options.revertOnDrop=false] - Whether to return to original position on drop.
   * @param {string} [options.classHidden='drag-hidden'] - CSS class to hide original element during dragging.
   * @throws {Error} If any option has an invalid type.
   */
  constructor(targetElement, options = {}) {
    if (!(targetElement instanceof HTMLElement))
      throw new Error('TinyDragger requires a valid target HTMLElement to initialize.');

    this.#target = targetElement;

    // === Validations ===
    if (options.jail !== undefined && !(options.jail instanceof HTMLElement))
      throw new Error('The "jail" option must be an HTMLElement if provided.');
    if (options.defaultZIndex !== undefined) this.setDefaultZIndex(options.defaultZIndex);

    if (
      options.vibration !== undefined &&
      options.vibration !== false &&
      !isJsonObject(options.vibration)
    )
      throw new Error('The "vibration" option must be an object or false.');

    /**
     * @param {any} val
     * @param {string} name
     */
    const validateBoolean = (val, name) => {
      if (val !== undefined && typeof val !== 'boolean') {
        throw new Error(`The "${name}" option must be a boolean.`);
      }
    };

    /**
     * @param {any} val
     * @param {string} name
     */
    const validateString = (val, name) => {
      if (val !== undefined && typeof val !== 'string') {
        throw new Error(`The "${name}" option must be a string.`);
      }
    };

    validateBoolean(options.mirrorElem, 'mirrorElem');
    validateBoolean(options.collisionByMouse, 'collisionByMouse');
    validateBoolean(options.lockInsideJail, 'lockInsideJail');
    validateBoolean(options.dropInJailOnly, 'dropInJailOnly');
    validateBoolean(options.revertOnDrop, 'revertOnDrop');
    validateBoolean(options.multiCollision, 'multiCollision');

    validateString(options.classDragging, 'classDragging');
    validateString(options.classBodyDragging, 'classBodyDragging');
    validateString(options.classJailDragging, 'classJailDragging');
    validateString(options.classJailDragDisabled, 'classJailDragDisabled');
    validateString(options.classDragCollision, 'classDragCollision');
    validateString(options.classHidden, 'classHidden');

    if (options.jail instanceof HTMLElement) this.#jail = options.jail;

    /** @type {VibrationPatterns} */
    const vibrationTemplate = { start: false, end: false, collide: false, move: false };
    this.#vibration = Object.assign(
      vibrationTemplate,
      isJsonObject(options.vibration) ? options.vibration : {},
    );

    if (typeof options.classDragging === 'string') this.#classDragging = options.classDragging;
    if (typeof options.classBodyDragging === 'string')
      this.#classBodyDragging = options.classBodyDragging;
    if (typeof options.classJailDragging === 'string')
      this.#classJailDragging = options.classJailDragging;
    if (typeof options.classJailDragDisabled === 'string')
      this.#classJailDragDisabled = options.classJailDragDisabled;
    if (typeof options.classHidden === 'string') this.#dragHiddenClass = options.classHidden;
    if (typeof options.classDragCollision === 'string')
      this.#classDragCollision = options.classDragCollision;

    if (typeof options.collisionByMouse === 'boolean')
      this.#collisionByMouse = options.collisionByMouse;
    if (typeof options.mirrorElem === 'boolean') this.#mirrorElem = options.mirrorElem;
    if (typeof options.revertOnDrop === 'boolean') this.#revertOnDrop = options.revertOnDrop;
    if (typeof options.lockInsideJail === 'boolean') this.#lockInsideJail = options.lockInsideJail;
    if (typeof options.dropInJailOnly === 'boolean') this.#dropInJailOnly = options.dropInJailOnly;
    if (typeof options.multiCollision === 'boolean') this.#multiCollision = options.multiCollision;

    /** @private */
    this._onMouseDown = this.#startDrag.bind(this);
    /** @private */
    this._onMouseMove = this.#drag.bind(this);
    /** @private */
    this._onMouseUp = this.#endDrag.bind(this);

    /**
     * @type {TouchDragEvent}
     * @private
     */
    this._onTouchStart = (e) => this.#startDrag(e.touches[0]);

    /**
     * @type {TouchDragEvent}
     * @private
     */
    this._onTouchMove = (e) => this.#drag(e.touches[0]);

    /**
     * @type {TouchDragEvent}
     * @private
     */
    this._onTouchEnd = (e) => this.#endDrag(e.changedTouches[0]);

    this.#target.addEventListener('mousedown', this._onMouseDown);
    this.#target.addEventListener('touchstart', this._onTouchStart, { passive: false });
  }

  /**
   * Enables the drag functionality.
   */
  enable() {
    this.#checkDestroy();
    if (this.#jail) this.#jail.classList.add(this.#classJailDragDisabled);
    this.#enabled = true;
  }

  /**
   * Disables the drag functionality.
   */
  disable() {
    if (this.#jail) this.#jail.classList.remove(this.#classJailDragDisabled);
    this.#enabled = false;
  }

  /**
   * Adds an element to be considered for collision detection.
   * @param {HTMLElement} element - The element to track collisions with.
   * @throws {Error} If the element is not a valid HTMLElement.
   */
  addCollidable(element) {
    this.#checkDestroy();
    if (!(element instanceof HTMLElement))
      throw new Error('addCollidable expects an HTMLElement as argument.');
    if (!this.#collidables.includes(element)) this.#collidables.push(element);
  }

  /**
   * Removes a collidable element from the tracking list.
   * @param {HTMLElement} element - The element to remove.
   * @throws {Error} If the element is not a valid HTMLElement.
   */
  removeCollidable(element) {
    this.#checkDestroy();
    if (!(element instanceof HTMLElement))
      throw new Error('removeCollidable expects an HTMLElement as argument.');
    this.#collidables = this.#collidables.filter((el) => el !== element);
  }

  /**
   * Sets vibration patterns for drag events.
   * @param {Object} [param0={}] - Vibration pattern configuration.
   * @param {number[]|false} [param0.startPattern=false] - Vibration on drag start.
   * @param {number[]|false} [param0.endPattern=false] - Vibration on drag end.
   * @param {number[]|false} [param0.collidePattern=false] - Vibration on collision.
   * @param {number[]|false} [param0.movePattern=false] - Vibration during movement.
   * @throws {Error} If any pattern is not false or an array of numbers.
   */
  setVibrationPattern({
    startPattern = false,
    endPattern = false,
    collidePattern = false,
    movePattern = false,
  } = {}) {
    this.#checkDestroy();

    /** @param {any} value */
    const isValidPattern = (value) =>
      value === false || (Array.isArray(value) && value.every((n) => typeof n === 'number'));

    if (!isValidPattern(startPattern))
      throw new Error('Invalid "startPattern": must be false or an array of numbers.');
    if (!isValidPattern(endPattern))
      throw new Error('Invalid "endPattern": must be false or an array of numbers.');
    if (!isValidPattern(collidePattern))
      throw new Error('Invalid "collidePattern": must be false or an array of numbers.');
    if (!isValidPattern(movePattern))
      throw new Error('Invalid "movePattern": must be false or an array of numbers.');

    this.#vibration = {
      start: startPattern,
      end: endPattern,
      collide: collidePattern,
      move: movePattern,
    };
  }

  /**
   * Disables all vibration feedback.
   */
  disableVibration() {
    this.#checkDestroy();
    this.#vibration = { start: false, end: false, collide: false, move: false };
  }

  /**
   * Calculates the cursor offset relative to the top-left of the target element.
   * @param {MouseEvent|Touch} event - The mouse or touch event.
   * @returns {{x: number, y: number}} The offset in pixels.
   * @throws {Error} If event is not a MouseEvent or Touch with clientX/clientY.
   */
  getOffset(event) {
    this.#checkDestroy();
    if (
      (!(event instanceof MouseEvent) && !(event instanceof Touch)) ||
      typeof event.clientX !== 'number' ||
      typeof event.clientY !== 'number'
    )
      throw new Error('getOffset expects an event with valid clientX and clientY coordinates.');

    const targetRect = this.#target.getBoundingClientRect();
    const { left: borderLeft, top: borderTop } = TinyHtml.borderWidth(this.#target);
    return {
      x: event.clientX - targetRect.left + borderLeft,
      y: event.clientY - targetRect.top + borderTop,
    };
  }

  /**
   * Handles the start of a drag event.
   * @param {MouseEvent|Touch} event - The initiating event.
   */
  #startDrag(event) {
    if (event instanceof MouseEvent) event.preventDefault();
    if (this.#destroyed || !this.#enabled || !this.#target.parentElement) return;

    if (this.#mirrorElem) {
      const dragProxy = this.#target.cloneNode(true);
      if (!(dragProxy instanceof HTMLElement))
        throw new Error('[TinyDragger] INVALID DRAG ELEMENT!');
      this.#dragProxy = dragProxy;
    } else this.#dragProxy = this.#target;

    this.#dragging = true;

    const rect = this.#target.getBoundingClientRect();

    Object.assign(this.#dragProxy.style, {
      position: 'absolute',
      pointerEvents: 'none',
      left: `${this.#target.offsetLeft}px`,
      top: `${this.#target.offsetTop}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      zIndex: this.#defaultZIndex,
    });

    if (this.#mirrorElem) {
      this.#target.classList.add(this.#dragHiddenClass);
      this.#target.parentElement.appendChild(this.#dragProxy);
    }

    const { x: offsetX, y: offsetY } = this.getOffset(event);
    this.#offsetX = offsetX;
    this.#offsetY = offsetY;

    this.#dragProxy.classList.add(this.#classDragging);
    document.body.classList.add(this.#classBodyDragging);
    if (this.#jail) this.#jail.classList.add(this.#classJailDragging);

    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('mouseup', this._onMouseUp);

    document.addEventListener('touchmove', this._onTouchMove, { passive: false });
    document.addEventListener('touchend', this._onTouchEnd);

    if (navigator.vibrate && Array.isArray(this.#vibration.start)) {
      navigator.vibrate(this.#vibration.start);
    }

    this.checkDragCollision(event);
    this.#dispatchEvent('drag');
  }

  /** @type {HTMLElement[]} */
  #collisionsMarked = [];

  /**
   * Marks an element as currently collided by adding the collision CSS class.
   * The element is stored in an internal list for easy removal later.
   *
   * @param {HTMLElement|null} el - The element to mark as collided.
   */
  #addCollision(el) {
    if (!el) return;
    el.classList.add(this.#classDragCollision);
    this.#collisionsMarked.push(el);
  }

  /**
   * Removes the collision CSS class from all previously marked elements.
   * Also clears the last single collision element, if set.
   *
   */
  #removeCollision() {
    while (this.#collisionsMarked.length > 0) {
      const el = this.#collisionsMarked.shift();
      if (el) el.classList.remove(this.#classDragCollision);
    }
    if (!this.#lastCollision) return;
    this.#lastCollision.classList.remove(this.#classDragCollision);
  }

  /**
   * Handles dragging collision.
   * @param {MouseEvent|Touch} event - The drag event.
   */
  checkDragCollision(event) {
    const { collidedElements } = this.execCollision(event);
    const first = collidedElements[0] || null;

    // Removes old marking if necessary
    if (this.#lastCollision && !collidedElements.includes(this.#lastCollision)) {
      this.#removeCollision();
    }

    // Adds Marking for All Colluded
    collidedElements.forEach((el) => this.#addCollision(el));

    // Removes markings from who no longer collided
    this.#collidables.forEach((el) => {
      if (!collidedElements.includes(el)) {
        el.classList.remove(this.#classDragCollision);
      }
    });

    if (
      navigator.vibrate &&
      Array.isArray(this.#vibration.collide) &&
      collidedElements.length > 0
    ) {
      navigator.vibrate(this.#vibration.collide);
    }

    this.#lastCollision = first;
  }

  /**
   * Handles dragging movement.
   * @param {MouseEvent|Touch} event - The drag event.
   */
  #drag(event) {
    if (event instanceof MouseEvent) event.preventDefault();
    if (this.#destroyed || !this.#dragging || !this.#enabled || !this.#dragProxy) return;

    const parent = this.#dragProxy.offsetParent || document.body;
    const parentRect = parent.getBoundingClientRect();

    let x = event.clientX - parentRect.left - this.#offsetX;
    let y = event.clientY - parentRect.top - this.#offsetY;

    if (this.#lockInsideJail && this.#jail) {
      const jailRect = this.#jail.getBoundingClientRect();
      const targetRect = this.#dragProxy.getBoundingClientRect();

      const jailLeft = jailRect.left - parentRect.left;
      const jailTop = jailRect.top - parentRect.top;

      const { x: borderX, y: borderY } = TinyHtml.borderWidth(this.#jail);
      const maxX = jailLeft + jailRect.width - targetRect.width - borderY;
      const maxY = jailTop + jailRect.height - targetRect.height - borderX;

      x = Math.max(jailLeft, Math.min(x, maxX));
      y = Math.max(jailTop, Math.min(y, maxY));
    }

    this.#dragProxy.style.position = 'absolute';
    this.#dragProxy.style.left = `${x}px`;
    this.#dragProxy.style.top = `${y}px`;

    if (navigator.vibrate && Array.isArray(this.#vibration.move)) {
      navigator.vibrate(this.#vibration.move);
    }

    this.checkDragCollision(event);
    this.#dispatchEvent('dragging');
  }

  /**
   * Handles the collision of a drag.
   * @param {MouseEvent|Touch} event - The release event.
   * @returns {{ inJail: boolean; collidedElements: (HTMLElement | null)[] }}
   */
  execCollision(event) {
    if (this.#destroyed || !this.#dragProxy) return { inJail: false, collidedElements: [] };

    let collidedElements = [];
    let inJail = true;
    const jailRect = this.#jail?.getBoundingClientRect();

    if (this.#collisionByMouse) {
      const x = event.clientX;
      const y = event.clientY;

      if (this.#dropInJailOnly && this.#jail && jailRect) {
        inJail =
          x >= jailRect.left && x <= jailRect.right && y >= jailRect.top && y <= jailRect.bottom;
      }

      collidedElements = inJail
        ? this.#multiCollision
          ? this.getAllCollidedElements(x, y)
          : [this.getCollidedElement(x, y)].filter(Boolean)
        : [];
    } else {
      const rect = this.#dragProxy.getBoundingClientRect();

      if (this.#dropInJailOnly && this.#jail && jailRect) {
        inJail =
          rect.left >= jailRect.left &&
          rect.right <= jailRect.right &&
          rect.top >= jailRect.top &&
          rect.bottom <= jailRect.bottom;
      }

      collidedElements = inJail
        ? this.#multiCollision
          ? this.getAllCollidedElementsByRect(rect)
          : [this.getCollidedElementByRect(rect)].filter(Boolean)
        : [];
    }

    return { inJail, collidedElements };
  }

  /**
   * Handles the end of a drag.
   * @param {MouseEvent|Touch} event - The release event.
   */
  #endDrag(event) {
    if (event instanceof MouseEvent) event.preventDefault();
    if (this.#destroyed || !this.#dragging) return;

    this.#dragging = false;
    if (!this.#dragProxy) return;

    this.#target.classList.remove(this.#classDragging);
    document.body.classList.remove(this.#classBodyDragging);
    if (this.#jail) this.#jail.classList.remove(this.#classJailDragging);

    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mouseup', this._onMouseUp);

    document.removeEventListener('touchmove', this._onTouchMove);
    document.removeEventListener('touchend', this._onTouchEnd);
    const { collidedElements } = this.execCollision(event);

    if (navigator.vibrate && Array.isArray(this.#vibration.end)) {
      navigator.vibrate(this.#vibration.end);
    }

    const newX = this.#dragProxy.style.left;
    const newY = this.#dragProxy.style.top;
    if (this.#dragProxy) {
      if (this.#mirrorElem) this.#dragProxy.remove();
      else
        Object.assign(this.#dragProxy.style, {
          position: '',
          pointerEvents: '',
          left: '',
          top: '',
          width: '',
          height: '',
          zIndex: '',
        });

      this.#dragProxy = null;
    }

    if (this.#lastCollision) this.#removeCollision();
    this.#lastCollision = null;

    if (this.#mirrorElem) this.#target.classList.remove(this.#dragHiddenClass);
    if (!this.#revertOnDrop) {
      this.#target.style.left = newX;
      this.#target.style.top = newY;
    }

    const dropEvent = new CustomEvent('drop', {
      detail: {
        targets: collidedElements,
        first: collidedElements[0] || null,
      },
    });
    this.#target.dispatchEvent(dropEvent);
  }

  /**
   * Checks if the provided element intersects with the given bounding rectangle.
   *
   * @param {HTMLElement} el - The element to test for collision.
   * @param {DOMRect} rect - The bounding rectangle to check against.
   * @returns {boolean} True if the element intersects with the rectangle.
   */
  #getCollidedElementByRect(el, rect) {
    const elRect = el.getBoundingClientRect();
    return !(
      rect.right < elRect.left ||
      rect.left > elRect.right ||
      rect.bottom < elRect.top ||
      rect.top > elRect.bottom
    );
  }

  /**
   * Returns all elements currently colliding with the given rectangle.
   *
   * @param {DOMRect} rect - Bounding rectangle of the dragged proxy.
   * @returns {HTMLElement[]} A list of all collided elements.
   * @throws {Error} If the input is not a valid DOMRect with numeric bounds.
   */
  getAllCollidedElementsByRect(rect) {
    this.#checkDestroy();
    if (
      !(rect instanceof DOMRect) ||
      typeof rect.left !== 'number' ||
      typeof rect.right !== 'number' ||
      typeof rect.top !== 'number' ||
      typeof rect.bottom !== 'number'
    )
      throw new Error('getCollidedElementByRect expects a valid DOMRect object.');
    return this.#collidables.filter((el) => this.#getCollidedElementByRect(el, rect));
  }

  /**
   * Detects collision based on rectangle intersection.
   * @param {DOMRect} rect - Bounding rectangle of the dragged proxy.
   * @returns {HTMLElement|null} The collided element or null.
   * @throws {Error} If rect is not a DOMRect with valid numeric properties.
   */
  getCollidedElementByRect(rect) {
    this.#checkDestroy();
    if (
      !(rect instanceof DOMRect) ||
      typeof rect.left !== 'number' ||
      typeof rect.right !== 'number' ||
      typeof rect.top !== 'number' ||
      typeof rect.bottom !== 'number'
    )
      throw new Error('getCollidedElementByRect expects a valid DOMRect object.');
    return this.#collidables.find((el) => this.#getCollidedElementByRect(el, rect)) || null;
  }

  /**
   * Checks whether a given (x, y) coordinate is inside the bounding rectangle of an element.
   *
   * @param {HTMLElement} el - The element to test for collision.
   * @param {number} x - Horizontal screen coordinate.
   * @param {number} y - Vertical screen coordinate.
   * @returns {boolean} True if the point is within the element's bounds.
   */
  #getCollidedElement(el, x, y) {
    const rect = el.getBoundingClientRect();
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  }

  /**
   * @param {number} x - Horizontal screen coordinate.
   * @param {number} y - Vertical screen coordinate.
   * @returns {HTMLElement[]} The collided element or null.
   */
  getAllCollidedElements(x, y) {
    this.#checkDestroy();
    if (typeof x !== 'number' || typeof y !== 'number')
      throw new Error('getCollidedElement expects numeric x and y coordinates.');
    return this.#collidables.filter((el) => this.#getCollidedElement(el, x, y));
  }

  /**
   * Detects collision with a point using element bounding rectangles.
   * @param {number} x - Horizontal screen coordinate.
   * @param {number} y - Vertical screen coordinate.
   * @returns {HTMLElement|null} The collided element or null.
   */
  getCollidedElement(x, y) {
    this.#checkDestroy();
    if (typeof x !== 'number' || typeof y !== 'number')
      throw new Error('getCollidedElement expects numeric x and y coordinates.');
    return this.#collidables.find((el) => this.#getCollidedElement(el, x, y)) || null;
  }

  /**
   * Dispatches a custom event from the target element.
   * @param {string} type - The event name.
   */
  #dispatchEvent(type) {
    const event = new CustomEvent(type);
    this.#target.dispatchEvent(event);
  }

  /**
   * Gets whether dragging is currently active.
   * @returns {boolean}
   */
  getDragging() {
    return this.#dragging;
  }

  /**
   * Gets whether movement is restricted inside the jail container.
   * @returns {boolean}
   */
  getLockInsideJail() {
    return this.#lockInsideJail;
  }

  /**
   * Sets whether movement is restricted inside the jail container.
   * @param {boolean} value
   */
  setLockInsideJail(value) {
    if (typeof value !== 'boolean') throw new Error('lockInsideJail must be a boolean.');
    this.#lockInsideJail = value;
  }

  /**
   * Gets whether the element should revert to original position on drop.
   * @returns {boolean}
   */
  getRevertOnDrop() {
    return this.#revertOnDrop;
  }

  /**
   * Sets whether the element should revert to original position on drop.
   * @param {boolean} value
   */
  setRevertOnDrop(value) {
    if (typeof value !== 'boolean') throw new Error('revertOnDrop must be a boolean.');
    this.#revertOnDrop = value;
  }

  /**
   * Gets whether collision detection uses mouse position.
   * @returns {boolean}
   */
  getCollisionByMouse() {
    return this.#collisionByMouse;
  }

  /**
   * Sets whether collision detection uses mouse position.
   * @param {boolean} value
   */
  setCollisionByMouse(value) {
    if (typeof value !== 'boolean') throw new Error('collisionByMouse must be a boolean.');
    this.#collisionByMouse = value;
  }

  /**
   * Gets whether dropping is restricted inside the jail container.
   * @returns {boolean}
   */
  getDropInJailOnly() {
    return this.#dropInJailOnly;
  }

  /**
   * Sets whether dropping is restricted inside the jail container.
   * @param {boolean} value
   */
  setDropInJailOnly(value) {
    if (typeof value !== 'boolean') throw new Error('dropInJailOnly must be a boolean.');
    this.#dropInJailOnly = value;
  }

  /**
   * Returns the current default z-index used for draggable items.
   * @returns {number}
   */
  getDefaultZIndex() {
    return this.#defaultZIndex;
  }

  /**
   * Sets a new default z-index for draggable items.
   * @param {number} newZIndex
   */
  setDefaultZIndex(newZIndex) {
    if (typeof newZIndex !== 'number' || !Number.isFinite(newZIndex))
      throw new TypeError('Z-index must be a finite number.');
    this.#defaultZIndex = newZIndex;
  }

  /**
   * Returns whether the draggable element is mirrored or the original.
   * @returns {boolean}
   */
  isMirrorEnabled() {
    return this.#mirrorElem;
  }

  /**
   * Sets whether the draggable element should be a mirror or the original.
   * @param {boolean} useMirror
   */
  setMirrorEnabled(useMirror) {
    if (typeof useMirror !== 'boolean') throw new TypeError('Mirror setting must be a boolean.');

    this.#mirrorElem = useMirror;
  }

  /**
   * Returns the original target element being dragged.
   * @returns {HTMLElement}
   */
  getTarget() {
    return this.#target;
  }

  /**
   * Returns the current jail container (if any).
   * @returns {HTMLElement|null}
   */
  getJail() {
    return this.#jail;
  }

  /**
   * Returns the current proxy element being dragged (if any).
   * @returns {HTMLElement|null}
   */
  getDragProxy() {
    return this.#dragProxy;
  }

  /**
   * Returns the last collided element (if any).
   * @returns {HTMLElement|null}
   */
  getLastCollision() {
    return this.#lastCollision;
  }

  /**
   * Returns all registered collidable elements.
   * @returns {HTMLElement[]}
   */
  getCollidables() {
    return [...this.#collidables];
  }

  /**
   * Returns the CSS class used to hide the target during drag.
   * @returns {string}
   */
  getDragHiddenClass() {
    return this.#dragHiddenClass;
  }

  /**
   * Returns the CSS class applied to the clone during dragging.
   * @returns {string}
   */
  getClassDragging() {
    return this.#classDragging;
  }

  /**
   * Returns the CSS class applied to <body> during dragging.
   * @returns {string}
   */
  getClassBodyDragging() {
    return this.#classBodyDragging;
  }

  /**
   * Returns the CSS class applied to the jail during dragging.
   * @returns {string}
   */
  getClassJailDragging() {
    return this.#classJailDragging;
  }

  /**
   * Returns the CSS class applied to the jail when dragging is disabled.
   * @returns {string}
   */
  getClassJailDragDisabled() {
    return this.#classJailDragDisabled;
  }

  /**
   * Returns the CSS class applied to a collided element.
   * @returns {string}
   */
  getClassDragCollision() {
    return this.#classDragCollision;
  }

  /**
   * Returns the full vibration configuration.
   * @returns {VibrationPatterns}
   */
  getVibrations() {
    return { ...this.#vibration };
  }

  /**
   * Returns the vibration pattern for drag start.
   * @returns {number[]|boolean}
   */
  getStartVibration() {
    return this.#vibration.start;
  }

  /**
   * Returns the vibration pattern for drag end.
   * @returns {number[]|boolean}
   */
  getEndVibration() {
    return this.#vibration.end;
  }

  /**
   * Returns the vibration pattern for collisions.
   * @returns {number[]|boolean}
   */
  getCollideVibration() {
    return this.#vibration.collide;
  }

  /**
   * Returns the vibration pattern during movement.
   * @returns {number[]|boolean}
   */
  getMoveVibration() {
    return this.#vibration.move;
  }

  /**
   * Returns whether the dragger is currently enabled.
   * @returns {boolean}
   */
  isEnabled() {
    return this.#enabled;
  }

  /**
   * Internal method to verify if the instance has been destroyed.
   * Throws an error if any operation is attempted after destruction.
   */
  #checkDestroy() {
    if (this.#destroyed)
      throw new Error('This TinyDragger instance has been destroyed and can no longer be used.');
  }

  /**
   * Completely disables drag-and-drop and cleans up all event listeners.
   * Does NOT remove the original HTML element.
   */
  destroy() {
    if (this.#destroyed) return;
    this.disable();

    this.#target.removeEventListener('mousedown', this._onMouseDown);
    this.#target.removeEventListener('touchstart', this._onTouchStart);

    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('mouseup', this._onMouseUp);

    document.removeEventListener('touchmove', this._onTouchMove);
    document.removeEventListener('touchend', this._onTouchEnd);

    if (this.#lastCollision) this.#removeCollision();
    if (this.#dragProxy) {
      if (this.#mirrorElem) this.#dragProxy.remove();
      else
        Object.assign(this.#dragProxy.style, {
          position: '',
          pointerEvents: '',
          left: '',
          top: '',
          width: '',
          height: '',
          zIndex: '',
        });
      this.#dragProxy = null;
    }

    this.#collidables = [];
    this.#dragging = false;
    this.#lastCollision = null;

    if (this.#mirrorElem) this.#target.classList.remove(this.#dragHiddenClass);
    this.#target.classList.remove(this.#classDragging);
    document.body.classList.remove(this.#classBodyDragging);
    if (this.#jail)
      this.#jail.classList.remove(this.#classJailDragging, this.#classJailDragDisabled);

    this.#destroyed = true;
  }
}

export default TinyDragger;
