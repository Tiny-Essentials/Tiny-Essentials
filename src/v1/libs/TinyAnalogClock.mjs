/**
 * @typedef {Object} ClockConfig
 * @property {string} bgColor
 * @property {string} borderColor
 * @property {number} borderWidth
 * @property {string} markColor
 * @property {string} hourHandColor
 * @property {string} minuteHandColor
 * @property {string} secondHandColor
 * @property {string} textColor
 * @property {string|null} skinUrl
 * @property {boolean} showNumbers
 * @property {boolean} showSeconds
 * @property {number} size
 * @property {number} sizeAdjust
 * @property {number} padding
 * @property {number} angleDistance
 * @property {number} pwH
 * @property {number} phH
 * @property {number} pwM
 * @property {number} phM
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
   * @constructor
   * @param {Partial<ClockConfig>} [options]
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

    // Shadow DOM or scoped style could be used, but inline styles for structure + CSS vars is efficient here
    this.#element.style.position = 'relative';
    this.#element.style.borderRadius = '50%';
    this.#element.style.overflow = 'hidden';
    this.#element.style.boxSizing = 'border-box';

    // Layers
    this.#skinLayer = document.createElement('div');
    this.#skinLayer.style.position = 'absolute';
    this.#skinLayer.style.inset = '0';
    this.#skinLayer.style.backgroundSize = 'cover';
    this.#skinLayer.style.backgroundPosition = 'center';
    this.#skinLayer.style.zIndex = '0';

    this.#faceLayer = document.createElement('div');
    this.#faceLayer.style.position = 'absolute';
    this.#faceLayer.style.inset = '0';
    this.#faceLayer.style.zIndex = '1';
    this.#faceLayer.style.pointerEvents = 'none';

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

    // Inject Styles
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

    // Update hands colors and sizes
    /**
     * @param {string} sel
     * @returns {HTMLDivElement}
     */
    const q = (sel) => {
      const result = this.#element.querySelector(sel);
      if (!(result instanceof HTMLDivElement)) throw new Error(`${sel} not found.`);
      return result;
    };

    // Setup Hands Dimensions relative to size
    const hHand = q('.hour-hand');
    hHand.style.backgroundColor = c.hourHandColor;
    hHand.style.width = `${c.size * 0.025}px`;
    hHand.style.height = `${c.size * 0.25}px`;
    // Fix alignment slightly to center the width
    hHand.style.marginLeft = `${(c.size * 0.025) / -2}px`;
    hHand.style.bottom = '50%';
    hHand.style.left = '50%';
    hHand.style.transformOrigin = 'bottom center';

    const mHand = q('.minute-hand');
    mHand.style.backgroundColor = c.minuteHandColor;
    mHand.style.width = `${c.size * 0.015}px`;
    mHand.style.height = `${c.size * 0.35}px`;
    mHand.style.marginLeft = `${(c.size * 0.015) / -2}px`;

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
   * @private
   */
  _renderFace() {
    this.#faceLayer.innerHTML = '';
    const radius = this.#config.size / 2 - this.#config.borderWidth;

    // 1. Render Ticks (Lines)
    // We render them starting from center, rotate them, then push them outwards (translateY)
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
   * @private
   */
  _startTicker() {
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

      // Note: Hands are already centered via CSS 'left: 50%'.
      // We removed translateX(-50%) from JS update loop and put it in CSS/Initial setup
      // to avoid overwriting it, but rotation overwrites transform property.
      // So we must include the translate inside the update.

      if (q('.second-hand')) {
        q('.second-hand').style.transform = `rotate(${sDeg}deg)`;
        // Why no translate here? Because margin-left handles the centering now (see _applyConfig)
      }
      q('.minute-hand').style.transform = `rotate(${mDeg}deg)`;
      q('.hour-hand').style.transform = `rotate(${hDeg}deg)`;

      this.#animationFrame = requestAnimationFrame(update);
    };
    update();
  }

  /**
   * @returns {HTMLElement}
   */
  get element() {
    return this.#element;
  }

  /**
   * @param {number} value
   */
  set size(value) {
    this.#config.size = value;
    this._applyConfig();
    this._renderFace();
  }

  /**
   * @param {string|null} url
   */
  set skin(url) {
    this.#config.skinUrl = url;
    this._applyConfig();
  }

  /**
   * @param {string} color
   */
  set themeColor(color) {
    this.#config.borderColor = color;
    this.#config.markColor = color;
    this.#config.textColor = color;
    this._applyConfig();
    this._renderFace(); // Re-render to apply color to new tick elements
  }

  /**
   * @param {boolean} value
   */
  set showNumbers(value) {
    this.#config.showNumbers = value;
    this._renderFace();
  }

  /**
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
