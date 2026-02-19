/**
 * Configuration object for the Analog Clock.
 * @typedef {Object} ClockConfig
 * @property {string} bgColor - The background color of the clock face (e.g., '#ffffff', 'rgb(0,0,0)').
 * @property {string} borderColor - The color of the clock's outer border.
 * @property {number} borderWidth - The thickness of the outer border in pixels.
 * @property {string} markColor - The color of the minute/hour tick marks.
 * @property {string} hourHandColor - The color of the hour hand.
 * @property {string} minuteHandColor - The color of the minute hand.
 * @property {string} secondHandColor - The color of the second hand.
 * @property {string} textColor - The color of the numbers on the clock face.
 * @property {string|null} skinUrl - The URL of an image to use as the clock face background. Set to null to use bgColor.
 * @property {boolean} showNumbers - Whether to render the numbers (1-12) on the clock face.
 * @property {boolean} showSeconds - Whether to display the second hand.
 * @property {number} size - The total width and height of the clock in pixels.
 * @property {number} sizeAdjust - Scale factor for the font size of the numbers relative to the clock size.
 * @property {number} padding - Padding in pixels between the clock edge and the tick marks.
 * @property {number} angleDistance - Distance multiplier (0-1) for placing numbers relative to the radius.
 * @property {number} pwH - Hour tick width as a percentage of clock size.
 * @property {number} phH - Hour tick height as a percentage of clock size.
 * @property {number} pwM - Minute tick width as a percentage of clock size.
 * @property {number} phM - Minute tick height as a percentage of clock size.
 */

class TinyAnalogClock {
  /** @type {HTMLElement} */
  #element;
  /** @type {HTMLElement} */
  #faceLayer;
  /** @type {HTMLElement} */
  #skinLayer;
  /** @type {ClockConfig} */
  #config;
  /** @type {number|null} */
  #animationFrame = null;

  /**
   * Creates an instance of TinyAnalogClock.
   * Initializes the DOM structure and starts the animation loop.
   * @param {Partial<ClockConfig>} [options] - Optional configuration overrides.
   */
  constructor(options = {}) {
    this.#config = {
      bgColor: '#f0f0f0',
      borderColor: '#333',
      borderWidth: 8,
      markColor: '#333',
      hourHandColor: '#000',
      minuteHandColor: '#444',
      secondHandColor: '#d81c1c',
      textColor: '#000',
      skinUrl: null,
      showNumbers: true,
      showSeconds: true,
      size: 800,
      sizeAdjust: 0.04,
      padding: 45,
      angleDistance: 0.95,
      pwH: 0.008,
      phH: 0.08,
      pwM: 0.005,
      phM: 0.03,
      ...options,
    };

    this.#element = document.createElement('div');
    this.#element.className = 'analog-clock-container';

    // Base styles for the container
    this.#element.style.position = 'relative';
    this.#element.style.borderRadius = '50%';
    this.#element.style.overflow = 'hidden';
    this.#element.style.boxSizing = 'border-box';

    // 1. Skin Layer (Background Image)
    this.#skinLayer = document.createElement('div');
    this.#skinLayer.style.position = 'absolute';
    this.#skinLayer.style.inset = '0';
    this.#skinLayer.style.backgroundSize = 'cover';
    this.#skinLayer.style.backgroundPosition = 'center';
    this.#skinLayer.style.zIndex = '0';

    // 2. Face Layer (Ticks and Numbers)
    this.#faceLayer = document.createElement('div');
    this.#faceLayer.style.position = 'absolute';
    this.#faceLayer.style.inset = '0';
    this.#faceLayer.style.zIndex = '1';
    this.#faceLayer.style.pointerEvents = 'none';

    // 3. Hands Layer (Hour, Minute, Second hands)
    const handsLayer = document.createElement('div');
    handsLayer.style.position = 'absolute';
    handsLayer.style.inset = '0';
    handsLayer.style.zIndex = '2';
    handsLayer.style.pointerEvents = 'none';
    handsLayer.innerHTML = `
            <div class="hand hour-hand"></div>
            <div class="hand minute-hand"></div>
            <div class="hand second-hand"></div>
            <div class="center-pin"></div>
        `;

    this.#element.appendChild(this.#skinLayer);
    this.#element.appendChild(this.#faceLayer);
    this.#element.appendChild(handsLayer);

    // Inject Styles dynamically to keep the class self-contained
    const style = document.createElement('style');
    style.textContent = `
            .analog-clock-container .hand {
                position: absolute;
                bottom: 50%;
                left: 50%;
                transform-origin: bottom center;
                border-radius: 4px;
                transform: translateX(-50%) rotate(0deg);
                z-index: 5;
            }
            .analog-clock-container .center-pin {
                position: absolute;
                top: 50%; left: 50%;
                width: 12px; height: 12px;
                background: #333;
                border-radius: 50%;
                transform: translate(-50%, -50%);
                z-index: 10;
            }
            .analog-clock-container .clock-mark {
                position: absolute;
                top: 50%; left: 50%;
                background: currentColor;
                transform-origin: center center;
            }
            .analog-clock-container .clock-number {
                position: absolute;
                top: 50%; left: 50%;
                transform: translate(-50%, -50%);
                font-family: sans-serif;
                font-weight: bold;
                text-align: center;
                line-height: 1;
            }
        `;
    this.#element.appendChild(style);

    this._applyConfig();
    this._renderFace();
    this._startTicker();
  }

  /**
   * Applies the current configuration to the DOM elements (colors, sizes, visibility).
   * @private
   */
  _applyConfig() {
    const s = this.#element.style;
    const c = this.#config;

    s.width = `${c.size}px`;
    s.height = `${c.size}px`;
    s.border = `${c.borderWidth}px solid ${c.borderColor}`;
    s.backgroundColor = c.bgColor;

    if (c.skinUrl) {
      this.#skinLayer.style.backgroundImage = `url(${c.skinUrl})`;
      this.#skinLayer.style.display = 'block';
    } else {
      this.#skinLayer.style.display = 'none';
    }

    /**
     * Helper to safely query elements within the clock.
     * @param {string} sel
     * @returns {HTMLDivElement}
     */
    const q = (sel) => {
      const result = this.#element.querySelector(sel);
      if (!(result instanceof HTMLDivElement))
        throw new Error(`TinyAnalogClock: Element ${sel} not found.`);
      return result;
    };

    // Hour Hand
    const hHand = q('.hour-hand');
    hHand.style.backgroundColor = c.hourHandColor;
    hHand.style.width = `${c.size * 0.025}px`;
    hHand.style.height = `${c.size * 0.25}px`;
    hHand.style.marginLeft = `${(c.size * 0.025) / -2}px`; // Center alignment fix
    hHand.style.bottom = '50%';
    hHand.style.left = '50%';
    hHand.style.transformOrigin = 'bottom center';

    // Minute Hand
    const mHand = q('.minute-hand');
    mHand.style.backgroundColor = c.minuteHandColor;
    mHand.style.width = `${c.size * 0.015}px`;
    mHand.style.height = `${c.size * 0.35}px`;
    mHand.style.marginLeft = `${(c.size * 0.015) / -2}px`;

    // Second Hand
    const sHand = q('.second-hand');
    if (c.showSeconds) {
      sHand.style.display = 'block';
      sHand.style.backgroundColor = c.secondHandColor;
      sHand.style.width = `${c.size * 0.005}px`;
      sHand.style.height = `${c.size * 0.4}px`;
      sHand.style.marginLeft = `${(c.size * 0.005) / -2}px`;
    } else {
      sHand.style.display = 'none';
    }

    q('.center-pin').style.background = c.borderColor;
  }

  /**
   * Renders the clock face, including tick marks and numbers, based on the current size and config.
   * Uses trigonometry to position elements perfectly from the center.
   * @private
   */
  _renderFace() {
    this.#faceLayer.innerHTML = '';
    const radius = this.#config.size / 2 - this.#config.borderWidth;

    // 1. Render Ticks (Lines)
    for (let i = 0; i < 60; i++) {
      const isHour = i % 5 === 0;
      const el = document.createElement('div');
      el.className = 'clock-mark';

      const w = isHour
        ? this.#config.size * this.#config.pwH
        : this.#config.size * this.#config.pwM;
      const h = isHour
        ? this.#config.size * this.#config.phH
        : this.#config.size * this.#config.phM;
      const color = this.#config.markColor;

      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
      el.style.color = color;

      // Distance from center to the TICK's center
      // We want the tick to be close to the edge.
      // Distance = radius - padding - (half of tick height)
      const distanceFromCenter = radius - this.#config.padding - h / 2;

      // Logic: Start at center (50% 50%) -> Rotate -> Push Outwards
      el.style.transform = `translate(-50%, -50%) rotate(${i * 6}deg) translate(0, -${distanceFromCenter}px)`;

      this.#faceLayer.appendChild(el);
    }

    // 2. Render Numbers
    if (this.#config.showNumbers) {
      for (let i = 1; i <= 12; i++) {
        const angle = i * 30 * (Math.PI / 180);
        // Adjust radius for text position (80% of total radius)
        const dist = radius * this.#config.angleDistance;
        const x = radius + Math.sin(angle) * dist;
        const y = radius - Math.cos(angle) * dist;

        const num = document.createElement('div');
        num.className = 'clock-number';
        num.innerText = i.toString();
        num.style.left = `${x}px`;
        num.style.top = `${y}px`;
        num.style.color = this.#config.textColor;
        num.style.fontSize = `${this.#config.size * this.#config.sizeAdjust}px`;
        this.#faceLayer.appendChild(num);
      }
    }
  }

  /**
   * Starts the RequestAnimationFrame loop to update hand positions.
   * @private
   */
  _startTicker() {
    if (this.#animationFrame) return;

    const update = () => {
      const now = new Date();
      const s = now.getSeconds();
      const m = now.getMinutes();
      const h = now.getHours();

      // Calculate degrees
      const sDeg = s * 6;
      const mDeg = m * 6 + s * 0.1;
      const hDeg = (h % 12) * 30 + m * 0.5;

      /**
       * @param {string} sel
       * @returns {HTMLDivElement}
       */
      const q = (sel) => {
        const result = this.#element.querySelector(sel);
        if (!(result instanceof HTMLDivElement)) throw new Error(`${sel} not found.`);
        return result;
      };

      if (this.#element.querySelector('.second-hand')) {
        q('.second-hand').style.transform = `rotate(${sDeg}deg)`;
      }
      q('.minute-hand').style.transform = `rotate(${mDeg}deg)`;
      q('.hour-hand').style.transform = `rotate(${hDeg}deg)`;

      this.#animationFrame = requestAnimationFrame(update);
    };
    update();
  }

  /**
   * Gets the main HTML element of the clock.
   * @returns {HTMLElement} The clock container.
   */
  get element() {
    return this.#element;
  }

  /**
   * Sets the size of the clock.
   * @param {number} value - The new size in pixels. Must be a positive number.
   * @throws {Error} If value is not a positive number.
   */
  set size(value) {
    if (typeof value !== 'number' || value <= 0 || isNaN(value)) {
      throw new Error(`TinyAnalogClock: 'size' must be a positive number. Received: ${value}`);
    }
    this.#config.size = value;
    this._applyConfig();
    this._renderFace();
  }

  get size() {
    return this.#config.size;
  }

  /**
   * Sets the background image (skin) of the clock.
   * @param {string|null} url - The URL string of the image, or null to remove the skin.
   * @throws {Error} If value is not a string or null.
   */
  set skinUrl(url) {
    if (url !== null && typeof url !== 'string') {
      throw new Error(
        `TinyAnalogClock: 'skin' must be a URL string or null. Received type: ${typeof url}`,
      );
    }
    this.#config.skinUrl = url;
    this._applyConfig();
  }

  get skinUrl() {
    return this.#config.skinUrl;
  }

  /**
   * Sets the primary border color.
   * @param {string} color - A valid CSS color string.
   * @throws {Error} If value is not a non-empty string.
   */
  set borderColor(color) {
    if (typeof color !== 'string' || color.trim() === '') {
      throw new Error(
        `TinyAnalogClock: 'borderColor' must be a non-empty string. Received: ${color}`,
      );
    }
    this.#config.borderColor = color;
    this._applyConfig();
    this._renderFace();
  }

  get borderColor() {
    return this.#config.borderColor;
  }

  /**
   * Sets the primary marks color.
   * @param {string} color - A valid CSS color string.
   * @throws {Error} If value is not a non-empty string.
   */
  set markColor(color) {
    if (typeof color !== 'string' || color.trim() === '') {
      throw new Error(
        `TinyAnalogClock: 'markColor' must be a non-empty string. Received: ${color}`,
      );
    }
    this.#config.markColor = color;
    this._applyConfig();
    this._renderFace();
  }

  get markColor() {
    return this.#config.markColor;
  }

  /**
   * Sets the primary text color.
   * @param {string} color - A valid CSS color string.
   * @throws {Error} If value is not a non-empty string.
   */
  set textColor(color) {
    if (typeof color !== 'string' || color.trim() === '') {
      throw new Error(
        `TinyAnalogClock: 'textColor' must be a non-empty string. Received: ${color}`,
      );
    }
    this.#config.textColor = color;
    this._applyConfig();
    this._renderFace();
  }

  get textColor() {
    return this.#config.textColor;
  }

  /**
   * Toggles the visibility of numbers on the clock face.
   * @param {boolean} value - True to show numbers, false to hide.
   * @throws {Error} If value is not a boolean.
   */
  set showNumbers(value) {
    if (typeof value !== 'boolean') {
      throw new Error(
        `TinyAnalogClock: 'showNumbers' must be a boolean. Received type: ${typeof value}`,
      );
    }
    this.#config.showNumbers = value;
    this._renderFace();
  }

  get showNumbers() {
    return this.#config.showNumbers;
  }

  /**
   * Destroys the clock instance, stops animations, and removes the element from DOM.
   * @returns {void}
   */
  destroy() {
    if (this.#animationFrame) {
      cancelAnimationFrame(this.#animationFrame);
      this.#animationFrame = null;
    }
    this.#element.remove();
  }
}

export default TinyAnalogClock;
