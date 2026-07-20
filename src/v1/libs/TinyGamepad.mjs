import { createCheckDestroyed } from './utils.mjs';

const checkDestroy = createCheckDestroyed('TinyGamepad');

/**
 * @typedef {Object} KeyStatus
 * Describes the status of a key or button.
 * @property {boolean} pressed - Whether the key is currently pressed.
 * @property {number} [value] - Optional analog value associated with the key.
 * @property {number} [value2] - Optional second analog value.
 */

/**
 * @typedef {'gamepad-only' | 'keyboard-only' | 'both'} InputMode
 * Defines the available input modes.
 */

/**
 * A callback function that is invoked when a mapped logical input is activated or deactivated.
 *
 * This function receives the logical name associated with the input (e.g., "Jump", "Shoot", "Menu")
 * and can be used to handle input-related actions such as triggering game mechanics or UI behavior.
 *
 * @typedef {(payload: { logicalName: string, activeTime: number, comboTime: number }) => void} MappedInputCallback
 */

/**
 * A callback function that is invoked when a mapped key is activated or deactivated.
 *
 * This function receives the key name associated with the input (e.g., "KeyA", "KeyB", "KeyC")
 * and can be used to handle input-related actions such as triggering game mechanics or UI behavior.
 *
 * @typedef {(payload: { key: string, activeTime: number }) => void} MappedKeyCallback
 */

/**
 * @typedef {(payload: InputPayload|InputAnalogPayload) => void} PayloadCallback
 * Callback for handling input events.
 */

/**
 * @typedef {(payload: ConnectionPayload) => void} ConnectionCallback
 * Callback for handling gamepad connection events.
 */

/**
 * A callback function that is triggered when a registered input sequence is fully activated.
 *
 * @callback InputSequenceCallback
 * @param {number} timestamp - The moment in milliseconds when the sequence was successfully detected.
 */

/**
 * A callback function that is triggered when a registered key sequence is fully activated.
 *
 * @callback KeySequenceCallback
 * @param {number} timestamp - The moment in milliseconds when the sequence was successfully detected.
 */

/**
 * Represents any valid callback type used in the TinyGamepad event system.
 * This is a union of all supported callback signatures.
 * @typedef {ConnectionCallback | PayloadCallback | MappedInputCallback | MappedKeyCallback} CallbackList
 */

/**
 * Represents a specific input source from a gamepad.
 * - 'gamepad-analog' refers to analog sticks or analog triggers.
 * - 'gamepad-button' refers to digital buttons on the gamepad.
 * @typedef {'gamepad-analog'|'gamepad-button'} GamepadDeviceSource
 */

/**
 * Represents any possible physical device source that can be used for input.
 * - 'mouse': Input from a mouse.
 * - 'keyboard': Input from a keyboard.
 * - 'gamepad-analog': Analog input from a gamepad (e.g., sticks, triggers).
 * - 'gamepad-button': Digital button input from a gamepad.
 * @typedef {'mouse'|'keyboard'|GamepadDeviceSource} DeviceSource
 */

/**
 * Represents the type of input interaction detected.
 * - 'up': Input was released.
 * - 'down': Input was pressed.
 * - 'hold': Input is being held.
 * - 'change': Input value changed (e.g., pressure or axis).
 * - 'move': Analog movement detected (e.g., joystick motion).
 * @typedef {'up'|'down'|'hold'|'change'|'move'} DeviceInputType
 */

/**
 * @typedef {Object} InputPayload
 * Structure for digital button input payload.
 * @property {string} id - Unique identifier for the input.
 * @property {Event} [event] - Optional DOM event reference.
 * @property {DeviceInputType} type - Type of input event (down, up, hold).
 * @property {DeviceSource} source - Input source (keyboard, mouse, gamepad).
 * @property {string} key - Physical input identifier.
 * @property {boolean} isPressure - Whether the input is pressure sensitive.
 * @property {string} logicalName - Logical name associated with the input.
 * @property {number} value - Primary analog value.
 * @property {number} value2 - Secondary analog value.
 * @property {boolean} pressed - Current pressed status.
 * @property {boolean|null} [prevPressed] - Previous pressed status.
 * @property {number} timestamp - Timestamp of the event.
 * @property {Gamepad} [gp] - Reference to the originating Gamepad.
 */

/**
 * @typedef {Object} InputAnalogPayload
 * Structure for analog input payload.
 * @property {string} id - Unique identifier for the input.
 * @property {Event} [event] - Optional DOM event reference.
 * @property {DeviceInputType} type - Type of input event (change).
 * @property {DeviceSource} source - Input source.
 * @property {string} key - Physical input identifier.
 * @property {string} logicalName - Logical name associated with the input.
 * @property {number} value - Analog value.
 * @property {number} value2 - Secondary analog value.
 * @property {number} timestamp - Timestamp of the event.
 * @property {Gamepad} [gp] - Reference to the originating Gamepad.
 */

/**
 * @typedef {Object} InputEvents
 * Internal structure for digital input events.
 * @property {string} id - Unique identifier for the input.
 * @property {Event} [event] - Optional DOM event reference.
 * @property {string} key - Input key identifier.
 * @property {DeviceSource} source - Source of the input.
 * @property {number} value - Value of the input.
 * @property {number} value2 - Secondary value.
 * @property {DeviceInputType} type - Type of input event.
 * @property {boolean} isPressure - Whether it is pressure-sensitive.
 * @property {boolean} pressed - Pressed status.
 * @property {boolean|null} [prevPressed] - Previous pressed status.
 * @property {number} timestamp - Timestamp of the event.
 * @property {Gamepad} [gp] - Reference to the gamepad.
 */

/**
 * @typedef {Object} InputAnalogEvents
 * Internal structure for analog input events.
 * @property {string} id - Unique identifier for the input.
 * @property {Event} [event] - Optional DOM event reference.
 * @property {string} key - Analog key.
 * @property {DeviceSource} source - Source of input.
 * @property {number} value - Main analog value.
 * @property {number} value2 - Secondary analog value.
 * @property {DeviceInputType} type - Type of event.
 * @property {number} timestamp - Timestamp.
 * @property {Gamepad} [gp] - Gamepad reference.
 */

/**
 * @typedef {Object} ConnectionPayload
 * Payload for connection-related events.
 * @property {string} id - ID of the gamepad.
 * @property {number} timestamp - Timestamp of the event.
 * @property {Gamepad} gp - Gamepad instance.
 */

/**
 * @typedef {Object} ExportedConfig
 * @property {string | null} expectedId - The expected identifier for a specific gamepad device, or null if not set.
 * @property {string[]} ignoreIds - Array of device IDs to be ignored (excluded from input detection).
 * @property {number} deadZone - The threshold value below which analog stick inputs are ignored (dead zone).
 * @property {number} timeoutComboKeys - Time in milliseconds allowed between consecutive inputs in a combo sequence before it resets.
 * @property {number} axisActiveSensitivity - Sensitivity threshold for detecting significant analog axis movement (0 = most sensitive, 1 = least sensitive).
 * @property {[string, string | string[]][]} inputMap - Array of key-value pairs representing the mapping between logical input names and physical input(s).
 */

/**
 * TinyGamepad is a high-level and extensible input management system
 * designed for professional-level control schemes in games or applications.
 *
 * It supports input from gamepads, keyboards, and optionally mouse devices.
 * Key features include:
 * - Input mapping from physical controls to logical action names
 * - Pressure-sensitive trigger and button support
 * - Dead zone configuration for analog inputs
 * - Event-based input handling (start, hold, end)
 * - Multiple logical names per input binding
 * - Unified control model for both digital and analog inputs
 *
 * TinyGamepad allows seamless integration of fallback control types,
 * detailed input feedback, and JSON-based profile serialization for saving and restoring mappings.
 */
class TinyGamepad {
  /** @type {boolean} Indicates whether this instance has been destroyed and is no longer usable. */
  #isDestroyed = false;

  /** @type {Set<string>} Currently held physical key/input identifiers. */
  #heldKeys = new Set();

  /** @type {Map<string, string|string[]>} Maps logical input names to one or more physical input identifiers. */
  #inputMap = new Map();

  /**
   * @type {Map<string, CallbackList[]>}
   * Stores all event callback arrays for different input-related events.
   */
  #callbacks = new Map();

  /** @type {null|Gamepad} Holds the currently connected Gamepad instance, or null if none is connected. */
  #connectedGamepad = null;

  /** @type {KeyStatus[]} Stores the previous button states for the connected gamepad to detect changes. */
  #lastButtonStates = [];

  /** @type {Record<string|number, KeyStatus>} Tracks the previous state of each key or button (keyboard/mouse/gamepad). */
  #lastKeyStates = {};

  /** @type {number[]} Stores the last known values of all gamepad analog axes. */
  #lastAxes = [];

  /** @type {null|number} Holds the requestAnimationFrame ID for the gamepad update loop. */
  #animationFrame = null;

  /** @type {null|number} Holds the setInterval ID for keyboard and mouse hold tracking. */
  #mouseKeyboardHoldLoop = null;

  /** @type {InputMode} Defines the current input mode (keyboard, gamepad, or both). */
  #inputMode;

  /** @type {Set<string>} A list of controller IDs to ignore during gamepad scanning. */
  #ignoreIds;

  /** @type {number} Dead zone threshold for analog stick sensitivity. */
  #deadZone;

  /** @type {string|null} The expected gamepad ID (if filtering by specific controller model). */
  #expectedId;

  /** @type {boolean} Whether mouse inputs are accepted and mapped like other inputs. */
  #allowMouse;

  /** @type {Window|Element} The element or window that receives input events (keyboard/mouse). */
  #elementBase;

  /**
   * @type {number}
   * Time in milliseconds before resetting a combination of raw keys (used for basic key sequences).
   */
  #timeoutComboKeys;

  /**
   * Axis movement threshold to consider an axis active combo.
   * Value range: 0 (most sensitive) to 1 (least sensitive).
   * @type {number}
   */
  #axisActiveSensitivity;

  /** @type {string[]} Temporarily holds the current sequence of mapped inputs being pressed. */
  #comboInputs = [];

  /** @type {number} Timestamp of the last mapped input combo trigger. */
  #timeComboInputs = 0;

  /** @type {number} Timestamp of the last mapped input. */
  #timeMappedInputs = 0;

  /** @type {string[]} Temporarily holds the current sequence of raw keys being pressed. */
  #comboKeys = [];

  /** @type {number} Timestamp of the last key combo trigger. */
  #timeComboKeys = 0;

  /** @type {NodeJS.Timeout|null} Timer for auto-resetting the raw key combo sequence. */
  #intervalComboKeys = null;

  /**
   * @type {Set<string>}
   * Set of currently active logical keys (used to track which mapped actions are being held).
   */
  #activeMappedKeys = new Set();

  /**
   * @type {Set<string>}
   * Set of currently active logical inputs (used to track which mapped actions are being held).
   */
  #activeMappedInputs = new Set();

  /**
   * @type {Map<string, { sequence: string[], callback: InputSequenceCallback, triggered: boolean }>}
   * Stores all registered logical input sequences and their associated callbacks.
   */
  #inputSequences = new Map();

  /**
   * @type {Map<string, { sequence: string[], callback: KeySequenceCallback, triggered: boolean }>}
   * Stores all registered raw key sequences and their associated callbacks.
   */
  #keySequences = new Map();

  /**
   * Stores the previous values of each input key to track state changes between updates.
   * @type {Map<string, { value: number; value2: number }>}
   */
  #keyOldValue = new Map();

  /** @type {Record<string, string>} */
  static #specialMap = {
    ' ': 'Space',
    '\n': 'Enter',
    '\r': 'Enter',
    '\t': 'Tab',
    '-': 'Minus',
    _: 'Minus',
    '=': 'Equal',
    '+': 'Equal',
    '[': 'BracketLeft',
    '{': 'BracketLeft',
    ']': 'BracketRight',
    '}': 'BracketRight',
    '\\': 'Backslash',
    '|': 'Backslash',
    ';': 'Semicolon',
    ':': 'Semicolon',
    "'": 'Quote',
    '"': 'Quote',
    ',': 'Comma',
    '<': 'Comma',
    '.': 'Period',
    '>': 'Period',
    '/': 'Slash',
    '?': 'Slash',
    '`': 'Backquote',
    '~': 'Backquote',
  };

  /**
   * Add or update a special key mapping.
   * @param {string} char - The character to map.
   * @param {string} code - The corresponding key code.
   */
  static addSpecialKey(char, code) {
    if (typeof char !== 'string')
      throw new TypeError(`Invalid char type: expected string, got ${typeof char}`);
    if (char.length !== 1)
      throw new Error(`Invalid char length: "${char}" (must be exactly one character)`);
    if (typeof code !== 'string')
      throw new TypeError(`Invalid code type: expected string, got ${typeof code}`);
    TinyGamepad.#specialMap[char] = code;
  }

  /**
   * Remove a special key mapping.
   * @param {string} char - The character to remove from mapping.
   */
  static removeSpecialKey(char) {
    if (typeof char !== 'string')
      throw new TypeError(`Invalid char type: expected string, got ${typeof char}`);
    if (char.length !== 1)
      throw new Error(`Invalid char length: "${char}" (must be exactly one character)`);
    delete TinyGamepad.#specialMap[char];
  }

  /**
   * Get the mapped code for a special character.
   * @param {string} char - The character to look up.
   * @returns {string | undefined} - The mapped code or undefined if not found.
   */
  static getSpecialKey(char) {
    if (typeof char !== 'string')
      throw new TypeError(`Invalid char type: expected string, got ${typeof char}`);
    if (char.length !== 1)
      throw new Error(`Invalid char length: "${char}" (must be exactly one character)`);
    return TinyGamepad.#specialMap[char];
  }

  /**
   * Get all current special key mappings.
   * @returns {Record<string, string>}
   */
  static getAllSpecialKeys() {
    return { ...TinyGamepad.#specialMap };
  }

  /**
   * Converts a string into an array of TinyGamepad-style key codes.
   * Example: "pudding" → ['KeyP', 'KeyU', 'KeyD', 'KeyD', 'KeyI', 'KeyN', 'KeyG']
   * @param {string} text - Input text.
   * @returns {string[]} Array of key codes.
   */
  static stringToKeys(text) {
    if (typeof text !== 'string')
      throw new TypeError(`Invalid text type: expected string, got ${typeof text}`);
    if (!text.length) throw new Error(`Invalid text: cannot be empty`);
    return Array.from(text).map((char) => {
      const upper = char.toUpperCase();
      if (upper >= 'A' && upper <= 'Z') {
        return `Key${upper}`;
      }
      if (upper >= '0' && upper <= '9') {
        return `Digit${upper}`;
      }
      const mapped = TinyGamepad.#specialMap[char];
      if (mapped !== undefined) {
        return mapped;
      }
      throw new Error(`Unsupported character: "${char}"`);
    });
  }

  /**
   * Initializes a new instance of TinyGamepad with customizable input behavior.
   *
   * This constructor allows configuring the expected device ID, the type of inputs to listen for
   * (keyboard, gamepad, or both), analog dead zone sensitivity, and whether to allow mouse input.
   * It also supports filtering out specific devices by ID.
   *
   * @param {Object} options - Configuration object for TinyGamepad behavior.
   * @param {string | null} [options.expectedId=null] - Specific controller ID to expect.
   * @param {InputMode} [options.inputMode='both'] - Mode of input to use.
   * @param {string[]} [options.ignoreIds=[]] - List of device IDs to ignore.
   * @param {number} [options.deadZone=0.1] - Analog stick dead zone threshold.
   * @param {boolean} [options.allowMouse=false] - Whether mouse events should be treated as input triggers.
   * @param {number} [options.timeoutComboKeys=500] - Maximum time (in milliseconds) allowed between inputs in a key sequence before the reset time.
   * @param {number} [options.axisActiveSensitivity=0.3] - Threshold to detect meaningful axis movement (0 = most sensitive, 1 = least sensitive).
   * @param {Window|Element} [options.elementBase=window] - The DOM element or window to bind keyboard and mouse events to.
   */
  constructor({
    expectedId = null,
    inputMode = 'both',
    ignoreIds = [],
    deadZone = 0.1,
    axisActiveSensitivity = 0.3,
    timeoutComboKeys = 500,
    allowMouse = false,
    elementBase = window,
  } = {}) {
    // Validate expectedId
    if (expectedId !== null && typeof expectedId !== 'string')
      throw new TypeError(`"expectedId" must be a string or null, received: ${typeof expectedId}`);

    // Validate inputMode
    if (!['keyboard-only', 'gamepad-only', 'both'].includes(inputMode))
      throw new TypeError(
        `"inputMode" must be 'keyboard-only', 'gamepad-only', or 'both', received: ${inputMode}`,
      );

    // Validate ignoreIds
    if (!Array.isArray(ignoreIds) || !ignoreIds.every((id) => typeof id === 'string'))
      throw new TypeError(`"ignoreIds" must be an array of strings`);

    // Validate deadZone
    if (typeof deadZone !== 'number' || deadZone < 0 || deadZone > 1)
      throw new RangeError(`"deadZone" must be a number between 0 and 1, received: ${deadZone}`);

    // Validate axisActiveSensitivity
    if (
      typeof axisActiveSensitivity !== 'number' ||
      axisActiveSensitivity < 0 ||
      axisActiveSensitivity > 1
    )
      throw new RangeError(
        `"axisActiveSensitivity" must be a number between 0 and 1, received: ${axisActiveSensitivity}`,
      );

    // Validate timeoutComboKeys
    if (typeof timeoutComboKeys !== 'number' || timeoutComboKeys < 0)
      throw new RangeError(
        `"timeoutComboKeys" must be a positive number, received: ${timeoutComboKeys}`,
      );

    // Validate allowMouse
    if (typeof allowMouse !== 'boolean')
      throw new TypeError(`"allowMouse" must be a boolean, received: ${typeof allowMouse}`);

    // Validate elementBase
    if (!(elementBase instanceof Window || elementBase instanceof Element))
      throw new TypeError(`"elementBase" must be a Window or Element instance`);

    this.#expectedId = expectedId;
    this.#inputMode = inputMode;
    this.#ignoreIds = new Set(ignoreIds);
    this.#deadZone = deadZone;
    this.#allowMouse = allowMouse;
    this.#elementBase = elementBase;
    this.#timeoutComboKeys = timeoutComboKeys;
    this.#axisActiveSensitivity = axisActiveSensitivity;

    if (['gamepad-only', 'both'].includes(this.#inputMode)) {
      this.#initGamepadEvents();
    }

    if (['keyboard-only', 'both'].includes(this.#inputMode)) {
      this.#initKeyboardMouse();
    }
  }

  //////////////////////////////////////////

  /** @type {(this: Window, ev: GamepadEvent) => any} */
  #gamepadConnected = (e) => this.#onGamepadConnect(e.gamepad);

  /** @type {(this: Window, ev: GamepadEvent) => any} */
  #gamepadDisconnected = (e) => this.#onGamepadDisconnect(e.gamepad);

  /**
   * Initializes listeners for gamepad connection and disconnection.
   * Automatically detects and handles supported gamepads.
   */
  #initGamepadEvents() {
    window.addEventListener('gamepadconnected', this.#gamepadConnected);
    window.addEventListener('gamepaddisconnected', this.#gamepadDisconnected);
  }

  /**
   * Internal callback when a gamepad is connected.
   * Starts polling and emits a "connected" event.
   * @param {Gamepad} gamepad
   */
  #onGamepadConnect(gamepad) {
    if (this.#isDestroyed) return;
    if (this.#ignoreIds.has(gamepad.id)) return;
    if (this.#expectedId && gamepad.id !== this.#expectedId) return;

    if (!this.#connectedGamepad) {
      this.#connectedGamepad = gamepad;
      this.#expectedId = gamepad.id;

      this.#startPolling();
      this.#emit('connected', { id: gamepad.id, gp: gamepad, timestamp: gamepad.timestamp });
    }
  }

  /**
   * Internal callback when a gamepad is disconnected.
   * Cancels polling and emits a "disconnected" event.
   * @param {Gamepad} gamepad
   */
  #onGamepadDisconnect(gamepad) {
    if (this.#isDestroyed) return;
    if (this.#connectedGamepad && gamepad.id === this.#connectedGamepad.id) {
      this.#connectedGamepad = null;
      if (this.#animationFrame) {
        cancelAnimationFrame(this.#animationFrame);
        this.#animationFrame = null;
      }
      this.#emit('disconnected', { id: gamepad.id, gp: gamepad, timestamp: gamepad.timestamp });
    }
  }

  /**
   * Starts the polling loop for tracking gamepad state.
   */
  #startPolling() {
    const loop = () => {
      if (this.#isDestroyed) return;
      this.#checkGamepadState();
      this.#animationFrame = requestAnimationFrame(loop);
    };
    loop();
  }

  /**
   * Compares and emits input changes from buttons and axes on the gamepad.
   */
  #checkGamepadState() {
    if (this.#isDestroyed) return;
    const pads = navigator.getGamepads();
    const gp = Array.from(pads).find((g) => g && g.id === this.#expectedId);
    if (!gp) return;

    this.#connectedGamepad = gp;

    gp.buttons.forEach((btn, index) => {
      const key = `Button${index}`;
      const prev = this.#lastButtonStates[index]?.pressed || false;

      /** @type {DeviceInputType} */
      let type;

      const source = 'gamepad-button';
      let value;
      let isPressure = false;
      if (btn.pressed && !prev) {
        value = 1;
        type = 'down';
      } else if (!btn.pressed && prev) {
        value = 0;
        type = 'up';
      } else if (btn.pressed && prev) {
        value = 1;
        type = 'hold';
      }

      if (btn.pressed && btn.value > 0 && btn.value < 1 && btn.value !== 1) {
        value = btn.value;
        isPressure = true;
      }

      // @ts-ignore
      if (typeof value === 'number' && typeof type === 'string')
        this.#handleInput({
          key,
          source,
          value,
          value2: NaN,
          type,
          gp,
          isPressure,
          pressed: btn.pressed,
          prevPressed: prev,
          timestamp: gp.timestamp,
          id: gp.id,
        });
      this.#lastButtonStates[index] = {
        pressed: btn.pressed,
        value: typeof value === 'number' ? value : this.#lastButtonStates[index]?.value,
        value2: NaN,
      };
    });

    gp.axes.forEach((val, index) => {
      if (Math.abs(val) < this.#deadZone) val = 0;

      const key = `Axis${index}`;
      const prev = this.#lastAxes[index] ?? 0;
      if (val !== prev) {
        this.#handleInput({
          key,
          source: 'gamepad-analog',
          value: val,
          value2: NaN,
          type: 'change',
          timestamp: gp.timestamp,
          id: gp.id,
          gp,
        });
      }
      this.#lastAxes[index] = val;
    });
  }

  ///////////////////////////////////

  /**
   * Listener for the 'keydown' event.
   * Triggers when a key is pressed and marks it as held.
   * Avoids duplicate presses while the key remains down.
   * Reports the input as a 'keyboard' source.
   *
   * @type {EventListener}
   */
  #keydown = (e) => {
    if (this.#isDestroyed) return;
    if (!(e instanceof KeyboardEvent))
      throw new Error('Expected KeyboardEvent in keydown listener.');
    if (!this.#heldKeys.has(e.code)) {
      this.#heldKeys.add(e.code);
      this.#handleInput({
        event: e,
        key: e.code,
        source: 'keyboard',
        value: 1,
        value2: NaN,
        type: 'down',
        pressed: true,
        prevPressed: this.#lastKeyStates[e.code]?.pressed ?? false,
        id: 'native_keyboard',
        timestamp: e.timeStamp,
      });
      this.#lastKeyStates[e.code] = { pressed: true };
    }
  };

  /**
   * Listener for the 'keyup' event.
   * Triggers when a key is released and removes it from the held list.
   * Reports the input as a 'keyboard' source.
   *
   * @type {EventListener}
   */
  #keyup = (e) => {
    if (this.#isDestroyed) return;
    if (!(e instanceof KeyboardEvent)) throw new Error('Expected KeyboardEvent in keyup listener.');
    if (this.#heldKeys.has(e.code)) {
      this.#heldKeys.delete(e.code);
      this.#handleInput({
        event: e,
        key: e.code,
        source: 'keyboard',
        value: 0,
        value2: NaN,
        type: 'up',
        pressed: false,
        prevPressed: this.#lastKeyStates[e.code]?.pressed ?? false,
        id: 'native_keyboard',
        timestamp: e.timeStamp,
      });
      this.#lastKeyStates[e.code] = { pressed: false };
    }
  };

  /**
   * Listener for the 'mousedown' event.
   * Fires when a mouse button is pressed.
   * Identifies each button as 'Mouse<button>' and tracks its held state.
   *
   * @type {EventListener}
   */
  #mousedown = (e) => {
    if (this.#isDestroyed) return;
    if (!(e instanceof MouseEvent)) throw new Error('Expected MouseEvent in mousedown listener.');
    const key = `Mouse${e.button}`;
    this.#heldKeys.add(key);
    this.#handleInput({
      event: e,
      key,
      source: 'mouse',
      value: 1,
      value2: NaN,
      type: 'down',
      pressed: true,
      prevPressed: this.#lastKeyStates[key]?.pressed ?? false,
      id: 'native_mouse',
      timestamp: e.timeStamp,
    });
    this.#lastKeyStates[key] = { pressed: true };
  };

  /**
   * Listener for the 'mouseup' event.
   * Fires when a mouse button is released.
   * Stops tracking the held state of the given button.
   *
   * @type {EventListener}
   */
  #mouseup = (e) => {
    if (this.#isDestroyed) return;
    if (!(e instanceof MouseEvent)) throw new Error('Expected MouseEvent in mouseup listener.');
    const key = `Mouse${e.button}`;
    this.#heldKeys.delete(key);
    this.#handleInput({
      event: e,
      key,
      source: 'mouse',
      value: 0,
      value2: NaN,
      type: 'up',
      pressed: false,
      prevPressed: this.#lastKeyStates[key]?.pressed ?? false,
      id: 'native_mouse',
      timestamp: e.timeStamp,
    });
    this.#lastKeyStates[key] = { pressed: false };
  };

  /**
   * Listener for the 'mousemove' event.
   * Tracks relative movement of the mouse using movementX and movementY.
   * Used to simulate analog movement via mouse input.
   *
   * @type {EventListener}
   */
  #mousemove = (e) => {
    if (this.#isDestroyed) return;
    if (!(e instanceof MouseEvent)) throw new Error('Expected MouseEvent in mousemove listener.');
    if (e.movementX !== 0 || e.movementY !== 0) {
      const key = 'MouseMove';
      /** @type {KeyStatus} */
      const old = this.#lastKeyStates[key] ?? { pressed: false, value: 0, value2: 0 };
      this.#handleInput({
        event: e,
        key,
        source: 'mouse',
        value: e.movementX + (old.value ?? 0),
        value2: e.movementY + (old.value ?? 0),
        id: 'native_mouse',
        type: 'move',
        pressed: true,
        prevPressed: null,
        timestamp: e.timeStamp,
      });
      this.#lastKeyStates[key] = { pressed: false, value: e.movementX, value2: e.movementY };
    }
  };

  /**
   * Initializes keyboard and mouse event listeners to emulate input behavior.
   */
  #initKeyboardMouse() {
    // Keyboard
    this.#elementBase.addEventListener('keydown', this.#keydown);
    this.#elementBase.addEventListener('keyup', this.#keyup);
    if (this.#allowMouse) {
      this.#elementBase.addEventListener('mousedown', this.#mousedown);
      this.#elementBase.addEventListener('mouseup', this.#mouseup);
      this.#elementBase.addEventListener('mousemove', this.#mousemove);
    }

    // Opcional: checagem contínua para "hold"
    const loop = () => {
      if (this.#isDestroyed) return;
      this.#heldKeys.forEach((key) => {
        const source = !key.startsWith('Mouse') ? 'keyboard' : 'mouse';
        this.#handleInput({
          key,
          source,
          id: `native_${source}`,
          value: 1,
          value2: NaN,
          type: 'hold',
          pressed: true,
          prevPressed: this.#lastKeyStates[key]?.pressed ?? false,
          timestamp: NaN,
        });
      });
      this.#mouseKeyboardHoldLoop = requestAnimationFrame(loop);
    };
    loop();
  }

  //////////////////////////////////

  /**
   * Handles an input event by dispatching to registered listeners.
   * This method acts as the central hub for all input events (gamepad, keyboard, mouse, etc.),
   * handling both direct physical inputs and their mapped logical equivalents.
   *
   * Features inside this method:
   *  - Wildcard callback support (global input listeners)
   *  - Automatic detection of axis-based controls (analog sticks, triggers)
   *  - Dead zone filtering for axis values (#axisActiveSensitivity)
   *  - Dynamic key press/release tracking for both physical keys and mapped inputs
   *  - Combination key sequence tracking with timeout handling
   *  - Separate callback systems for:
   *       -> Physical inputs
   *       -> Logical (mapped) inputs
   *       -> Start/End/Hold input events
   *       -> Combo sequences (key-based and mapped input-based)
   *  - Payload injection for callbacks with contextual data
   *
   * @param {InputEvents|InputAnalogEvents} settings - Input event data containing key, value, type, etc.
   */
  #handleInput(settings) {
    if (this.#isDestroyed) return;

    /**
     *  @type {PayloadCallback[]}
     *  List of global "input-*" listeners that will receive *all* input events
     *  regardless of the specific key, axis, or logical mapping.
     */
    // @ts-ignore
    const globalCbs = this.#callbacks.get('input-*') || [];

    // Extract main properties from incoming settings
    // @ts-ignore
    const { pressed, key } = settings;

    /**
     *  @type {boolean}
     *  Detect if the incoming key belongs to an axis (e.g., 'Axis0', 'Axis1').
     */
    const isAxis = key.startsWith('Axis');

    /**
     *  @type {boolean}
     *  Determines whether the input should be considered "active".
     *  - For buttons: simply uses the `pressed` flag
     *  - For axes: compares value to configured deadzone threshold (#axisActiveSensitivity)
     */
    const isPressed =
      (typeof pressed === 'boolean' && pressed) ||
      (isAxis &&
        (settings.value > this.#axisActiveSensitivity ||
          settings.value < -Math.abs(this.#axisActiveSensitivity)));

    /**
     *  @type {string}
     *  The "active key" represents the directional form of the key.
     *  - Non-axis: same as the original key
     *  - Axis: adds '+' or '-' depending on value direction
     */
    const activeKey = !isAxis
      ? key
      : `${key}${settings.value > 0 ? '+' : settings.value < 0 ? '-' : ''}`;

    /**
     *  @type {boolean|null}
     *  Used to track if this event results in a key press (true), release (false), or no change (null).
     */
    let keyResult = null;

    // -------------------------
    //  PHYSICAL KEY TRACKING
    // -------------------------
    if (settings.type !== 'move' && settings.type !== 'hold') {
      if (isPressed) {
        // -------------------------
        //  NEW KEY PRESS DETECTION
        // -------------------------
        if (
          (!isAxis && !this.#activeMappedKeys.has(key)) ||
          (isAxis &&
            !this.#activeMappedKeys.has(key) &&
            !this.#activeMappedKeys.has(`${key}+`) &&
            !this.#activeMappedKeys.has(`${key}-`))
        ) {
          if (this.#timeComboKeys === 0) this.#timeComboKeys = Date.now();
          this.#activeMappedKeys.add(activeKey);
          keyResult = true;

          // Combo tracking
          this.#comboKeys.push(activeKey);
          if (this.#comboInputs.length < 1) {
            if (this.#intervalComboKeys) clearTimeout(this.#intervalComboKeys);
            this.#intervalComboKeys = setTimeout(
              () => this.resetComboMapped(),
              this.#timeoutComboKeys,
            );
          }

          /**
           *  @type {MappedKeyCallback[]}
           *  Notifies all "mapped-key-start" listeners that a key has been pressed.
           */
          // @ts-ignore
          const cbs = this.#callbacks.get('mapped-key-start') ?? [];
          for (const cb of cbs)
            cb({
              key: activeKey,
              activeTime: this.#timeComboKeys,
            });
        }
      } else {
        // -------------------------
        //  KEY RELEASE DETECTION
        // -------------------------
        if (
          (!isAxis && this.#activeMappedKeys.has(key)) ||
          (isAxis &&
            (this.#activeMappedKeys.has(key) ||
              this.#activeMappedKeys.has(`${key}+`) ||
              this.#activeMappedKeys.has(`${key}-`)))
        ) {
          this.#activeMappedKeys.delete(key);
          this.#activeMappedKeys.delete(`${key}+`);
          this.#activeMappedKeys.delete(`${key}-`);
          keyResult = false;

          /**
           *  @type {MappedKeyCallback[]}
           *  Notifies all "mapped-key-end" listeners that a key has been released.
           */
          // @ts-ignore
          const cbs = this.#callbacks.get('mapped-key-end') ?? [];
          for (const cb of cbs)
            cb({
              key: activeKey,
              activeTime: this.#timeComboKeys,
            });
        }
      }

      // -------------------------
      //  PHYSICAL KEY COMBO SEQUENCES
      // -------------------------
      for (const { sequence, callback, triggered } of this.#keySequences.values()) {
        const keySequence = this.#keySequences.get(sequence.join('+'));
        if (!keySequence) continue;

        const allPressed = sequence.every((name, index) => this.#comboKeys[index] === name);
        if (allPressed && !triggered) {
          keySequence.triggered = true;
          callback(this.#timeComboKeys);
        } else if (!allPressed && triggered) {
          keySequence.triggered = false;
        }
      }
    }

    // -------------------------
    //  LOGICAL (MAPPED) INPUTS
    // -------------------------
    for (const [logical, physical] of this.#inputMap.entries()) {
      /**
       * Checks if a given tinyKey matches the physical mapping of a logical input.
       * @param {string} tinyKey
       * @returns {boolean}
       */
      const checkPhysical = (tinyKey) =>
        (typeof physical === 'string' && tinyKey === physical) ||
        (Array.isArray(physical) && physical.findIndex((value, i) => tinyKey === physical[i]) > -1);

      const mainKey = checkPhysical(activeKey);
      const baseAxisKeyP = isAxis && checkPhysical(`${key}+`);
      const baseAxisKeyN = isAxis && checkPhysical(`${key}-`);

      // -------------------------
      //  ACTIVE MAPPED INPUT LIST
      // -------------------------
      if (mainKey || baseAxisKeyP || baseAxisKeyN) {
        if (isPressed && mainKey) {
          if (keyResult || !this.#activeMappedInputs.has(logical)) {
            if (this.#timeMappedInputs === 0) this.#timeMappedInputs = Date.now();
            this.#activeMappedInputs.add(logical);

            if (this.#timeComboInputs === 0) this.#timeComboInputs = Date.now();
            if (this.#intervalComboKeys) clearTimeout(this.#intervalComboKeys);
            this.#comboInputs.push(logical);
            this.#intervalComboKeys = setTimeout(
              () => this.resetComboMapped(),
              this.#timeoutComboKeys,
            );

            /**
             *  @type {MappedInputCallback[]}
             *  Notifies all "mapped-input-start" listeners that a logical input has been activated.
             */
            // @ts-ignore
            const cbs = this.#callbacks.get('mapped-input-start') ?? [];
            for (const cb of cbs)
              cb({
                logicalName: logical,
                activeTime: this.#timeMappedInputs,
                comboTime: this.#timeComboInputs,
              });
          }
        } else {
          if (!keyResult || this.#activeMappedInputs.has(logical)) {
            this.#activeMappedInputs.delete(logical);
            if (this.#activeMappedInputs.size < 1) this.#timeMappedInputs = 0;

            /**
             *  @type {MappedInputCallback[]}
             *  Notifies all "mapped-input-end" listeners that a logical input has been deactivated.
             */
            // @ts-ignore
            const cbs = this.#callbacks.get('mapped-input-end') ?? [];
            for (const cb of cbs)
              cb({
                logicalName: logical,
                activeTime: this.#timeMappedInputs,
                comboTime: this.#timeComboInputs,
              });
          }
        }

        // -------------------------
        //  LOGICAL COMBO SEQUENCES
        // -------------------------
        for (const { sequence, callback, triggered } of this.#inputSequences.values()) {
          const inputSequence = this.#inputSequences.get(sequence.join('+'));
          if (!inputSequence) continue;

          const activeSequence = Array.from(this.#activeMappedInputs);
          const allPressed = sequence.every((name, index) => activeSequence[index] === name);
          if (allPressed && !triggered) {
            inputSequence.triggered = true;
            callback(this.#timeMappedInputs);
          } else if (!allPressed && triggered) {
            inputSequence.triggered = false;
          }
        }
      }

      /** @type {string[]} */
      const keys = [];
      if (!isAxis || settings.value !== 0) keys.push(activeKey);
      else {
        const { value: valueN } = this.#keyOldValue.get(`${key}-`) ?? { value: 0, value2: NaN };
        const { value: valueP } = this.#keyOldValue.get(`${key}+`) ?? { value: 0, value2: NaN };
        if (settings.value !== valueN) keys.push(`${key}-`);
        if (settings.value !== valueP) keys.push(`${key}+`);
      }

      keys.forEach((key) => {
        // -------------------------
        //  MATCH CHECKER (for physical <-> logical link)
        // -------------------------
        const matches =
          physical === '*' ||
          physical === key ||
          (Array.isArray(physical) && physical.includes(key));

        if (!matches) return;

        // -------------------------
        //  CALLBACK RETRIEVAL
        // -------------------------
        /** @type {PayloadCallback[]} */
        // @ts-ignore
        const typeCbs = this.#callbacks.get(`input-${settings.type}-${logical}`) || [];

        /** @type {PayloadCallback[]} */
        // @ts-ignore
        const cbs = this.#callbacks.get(`input-${logical}`) || [];

        if (cbs.length < 1 && typeCbs.length < 1 && globalCbs.length < 1) return;

        // -------------------------
        //  PAYLOAD DISPATCH
        // -------------------------
        /** @type {InputPayload|InputAnalogPayload} */
        const payload = { ...settings, key, logicalName: logical };
        for (const cb of globalCbs) cb(payload);
        for (const cb of cbs) cb(payload);

        // ➕ Separate event type callbacks
        for (const cb of typeCbs) cb(payload);
        this.#keyOldValue.set(key, { value: settings.value, value2: settings.value2 });
      });
    }
  }

  /**
   * Emits a custom internal event to all listeners.
   * @param {string} event - Event name.
   * @param {*} data - Payload data.
   */
  #emit(event, data) {
    const cbs = this.#callbacks.get(event) || [];
    for (const cb of cbs) cb(data);
  }

  /**
   * Registers a callback for a logical template
   * @param {string} logicalName
   * @param {CallbackList} callback
   * @param {string} nameStart
   */
  #onTemplate(logicalName, callback, nameStart) {
    if (typeof logicalName !== 'string')
      throw new TypeError(`"logicalName" must be a string, received ${logicalName}`);
    if (typeof callback !== 'function')
      throw new TypeError(`"callback" must be a function, received ${typeof callback}`);
    const id = nameStart.replace('{logicalName}', logicalName);

    let callbacks = this.#callbacks.get(id);
    if (!Array.isArray(callbacks)) {
      callbacks = [];
      this.#callbacks.set(id, callbacks);
    }
    callbacks.push(callback);
  }

  /**
   * Registers a one-time callback for a logical template.
   * The callback is removed after the first invocation.
   * @param {string} logicalName
   * @param {CallbackList} callback
   * @param {string} nameStart
   */
  #onceTemplate(logicalName, callback, nameStart) {
    if (typeof logicalName !== 'string')
      throw new TypeError(`"logicalName" must be a string, received ${logicalName}`);
    if (typeof callback !== 'function')
      throw new TypeError(`"callback" must be a function, received ${typeof callback}`);
    /** @type {CallbackList} */
    // @ts-ignore
    const wrapper = (payload) => {
      this.#offTemplate(logicalName, wrapper, nameStart);
      callback(payload);
    };
    this.#onTemplate(logicalName, wrapper, nameStart);
  }

  /**
   * Prepends a callback to the template event list.
   * @param {string} logicalName
   * @param {CallbackList} callback
   * @param {string} nameStart
   */
  #prependTemplate(logicalName, callback, nameStart) {
    if (typeof logicalName !== 'string')
      throw new TypeError(`"logicalName" must be a string, received ${logicalName}`);
    if (typeof callback !== 'function')
      throw new TypeError(`"callback" must be a function, received ${typeof callback}`);
    const id = nameStart.replace('{logicalName}', logicalName);

    const list = this.#callbacks.get(id) ?? [];
    list.unshift(callback);
    this.#callbacks.set(id, list);
  }

  /**
   * Removes a callback from a specific logical template event.
   * @param {string} logicalName
   * @param {CallbackList} callback
   * @param {string} nameStart
   */
  #offTemplate(logicalName, callback, nameStart) {
    if (typeof logicalName !== 'string')
      throw new TypeError(`"logicalName" must be a string, received ${logicalName}`);
    if (typeof callback !== 'function')
      throw new TypeError(`"callback" must be a function, received ${typeof callback}`);
    const id = nameStart.replace('{logicalName}', logicalName);

    const list = this.#callbacks.get(id);
    if (Array.isArray(list))
      this.#callbacks.set(
        id,
        list.filter((cb) => cb !== callback),
      );
  }

  ///////////////////////////////////////////////////

  /**
   * Waits for a single input event from the user and resolves with detailed input information.
   * This is typically used in control configuration screens to allow the user to choose an input
   * (keyboard, mouse, or gamepad) that will be mapped to a logical action.
   *
   * The function listens for the first eligible input (ignores 'MouseMove') and returns the key,
   * input source, and the Gamepad object if applicable. If no input is received before the timeout,
   * the promise resolves with a `null` key and source.
   *
   * @param {object} [options] - Optional configuration for input capture behavior.
   * @param {number} [options.timeout=10000] - Timeout in milliseconds before the promise resolves automatically with null values.
   * @param {string} [options.eventName='MappingInput'] - The temporary logical event name used internally to listen for input.
   * @param {boolean} [options.canMove=false] - Whether movement-based inputs (e.g., mouse movement) are allowed.
   * @returns {Promise<{ key: string | null, source: DeviceSource | null, gp?: Gamepad }>}
   * A promise that resolves with an object containing:
   *   - `key`: the identifier of the pressed input (e.g., "KeyW", "Button0", "LeftClick"),
   *   - `source`: the origin of the input ("keyboard", "mouse", "gamepad-button", or "gamepad-analog"),
   *   - `gp`: the Gamepad object (only if the input source is a gamepad).
   */
  awaitInputMapping({ timeout = 10000, eventName = 'MappingInput', canMove = false } = {}) {
    checkDestroy(this.#isDestroyed);
    return new Promise((resolve, reject) => {
      // Argument validation
      if (typeof timeout !== 'number' || Number.isNaN(timeout) || timeout < 0)
        return reject(
          new TypeError(`Invalid "timeout": expected a positive number, got ${timeout}`),
        );
      if (typeof eventName !== 'string' || !eventName.trim())
        return reject(
          new TypeError(`Invalid "eventName": expected a non-empty string, got ${eventName}`),
        );
      if (typeof canMove !== 'boolean')
        return reject(new TypeError(`Invalid "canMove": expected a boolean, got ${canMove}`));

      /** @type {{ key: string|null; source: DeviceSource|null; gp?: Gamepad; }} */
      const result = { key: null, source: null };

      /** @type {PayloadCallback} */
      const inputCallback = ({ key, type, source, gp, value }) => {
        if (!canMove && type === 'move') return;
        result.key = key;
        result.source = source;
        result.gp = gp;

        clearTimeout(timer);
        this.offInputStart(eventName, inputCallback);
        this.offInputChange(eventName, inputCallback);
        if (canMove) this.offInputMove(eventName, inputCallback);
        resolve(result);
      };

      // Time limit to auto-cancel input collection
      const timer = setTimeout(() => resolve(result), timeout);

      this.mapInput(eventName, '*');
      this.onInputStart(eventName, inputCallback);
      this.onInputChange(eventName, inputCallback);
      if (canMove) this.onInputMove(eventName, inputCallback);
    });
  }

  /**
   * Assigns a physical input to a logical name (e.g., "Jump" => "Button1")
   * @param {string} logicalName
   * @param {string|string[]} physicalInput
   */
  mapInput(logicalName, physicalInput) {
    checkDestroy(this.#isDestroyed);
    if (typeof logicalName !== 'string' || !logicalName.trim())
      throw new TypeError(`Invalid "logicalName": expected a non-empty string, got ${logicalName}`);
    if (!(
      typeof physicalInput === 'string' ||
      (Array.isArray(physicalInput) && physicalInput.every((p) => typeof p === 'string'))
    ))
      throw new TypeError(
        `Invalid "physicalInput": expected string or array of strings, got ${JSON.stringify(physicalInput)}`,
      );
    this.#inputMap.set(logicalName, physicalInput);
  }

  /**
   * Removes a logical input mapping
   * @param {string} logicalName
   */
  unmapInput(logicalName) {
    checkDestroy(this.#isDestroyed);
    if (typeof logicalName !== 'string' || !logicalName.trim())
      throw new TypeError(`Invalid "logicalName": expected a non-empty string, got ${logicalName}`);
    this.#inputMap.delete(logicalName);
  }

  /**
   * Checks if a logical name is mapped to any physical input.
   * @param {string} logicalName
   * @returns {boolean}
   */
  hasMappedInput(logicalName) {
    checkDestroy(this.#isDestroyed);
    if (typeof logicalName !== 'string' || !logicalName.trim())
      throw new TypeError(`Invalid "logicalName": expected a non-empty string, got ${logicalName}`);
    return this.#inputMap.has(logicalName);
  }

  /**
   * Returns the physical input(s) mapped to a given logical name.
   * @param {string} logicalName
   * @returns {string | string[]}
   */
  getMappedInput(logicalName) {
    checkDestroy(this.#isDestroyed);
    if (typeof logicalName !== 'string' || !logicalName.trim())
      throw new TypeError(`Invalid "logicalName": expected a non-empty string, got ${logicalName}`);
    const result = this.#inputMap.get(logicalName);
    if (!result) throw new Error(`No physical input mapped for logicalName: "${logicalName}"`);
    return result;
  }

  /**
   * Clears all mappings for all logical inputs.
   */
  clearMapInputs() {
    checkDestroy(this.#isDestroyed);
    this.#inputMap.clear();
  }

  //////////////////////////////////////////////////////////////

  /**
   * Registers a sequence of logical inputs that triggers a specific callback.
   * @param {string[]} sequence - Ordered list of logical input names (e.g., ['Jump', 'Action'])
   * @param {InputSequenceCallback} callback - Function to invoke when the sequence is fully held
   */
  registerInputSequence(sequence, callback) {
    checkDestroy(this.#isDestroyed);
    if (!Array.isArray(sequence) || !sequence.every((s) => typeof s === 'string'))
      throw new TypeError(
        `'sequence' must be an array of strings, got: ${JSON.stringify(sequence)}`,
      );
    if (typeof callback !== 'function')
      throw new TypeError(`'callback' must be a function, got: ${typeof callback}`);
    if (sequence.length === 0) throw new Error(`'sequence' must contain at least one input name.`);
    const key = sequence.join('+');
    this.#inputSequences.set(key, { sequence, callback, triggered: false });
  }

  /**
   * Unregisters a previously registered input sequence.
   * @param {string[]} sequence - The sequence to remove from detection
   */
  unregisterInputSequence(sequence) {
    checkDestroy(this.#isDestroyed);
    if (!Array.isArray(sequence) || !sequence.every((s) => typeof s === 'string'))
      throw new TypeError(
        `'sequence' must be an array of strings, got: ${JSON.stringify(sequence)}`,
      );
    const key = sequence.join('+');
    this.#inputSequences.delete(key);
  }

  /**
   * Removes all registered input sequences.
   */
  unregisterAllInputSequences() {
    checkDestroy(this.#isDestroyed);
    this.#inputSequences.clear();
  }

  /**
   * Checks whether a given input sequence is currently registered.
   * @param {string[]} sequence - The sequence to check
   * @returns {boolean}
   */
  hasInputSequence(sequence) {
    checkDestroy(this.#isDestroyed);
    if (!Array.isArray(sequence) || !sequence.every((s) => typeof s === 'string'))
      throw new TypeError(
        `'sequence' must be an array of strings, got: ${JSON.stringify(sequence)}`,
      );
    const key = sequence.join('+');
    return this.#inputSequences.has(key);
  }

  ////////////////////////////////////////////////////////

  /**
   * Registers a sequence of logical inputs that triggers a specific callback.
   * @param {string[]} sequence - Ordered list of logical input names (e.g., ['Jump', 'Action'])
   * @param {InputSequenceCallback} callback - Function to invoke when the sequence is fully held
   */
  registerKeySequence(sequence, callback) {
    checkDestroy(this.#isDestroyed);
    if (!Array.isArray(sequence) || !sequence.every((s) => typeof s === 'string'))
      throw new TypeError(
        `'sequence' must be an array of strings, got: ${JSON.stringify(sequence)}`,
      );
    if (typeof callback !== 'function')
      throw new TypeError(`'callback' must be a function, got: ${typeof callback}`);
    if (sequence.length === 0) throw new Error(`'sequence' must contain at least one input name.`);
    const key = sequence.join('+');
    this.#keySequences.set(key, { sequence, callback, triggered: false });
  }

  /**
   * Unregisters a previously registered input sequence.
   * @param {string[]} sequence - The sequence to remove from detection
   */
  unregisterKeySequence(sequence) {
    checkDestroy(this.#isDestroyed);
    if (!Array.isArray(sequence) || !sequence.every((s) => typeof s === 'string'))
      throw new TypeError(
        `'sequence' must be an array of strings, got: ${JSON.stringify(sequence)}`,
      );
    const key = sequence.join('+');
    this.#keySequences.delete(key);
  }

  /**
   * Removes all registered input sequences.
   */
  unregisterAllKeySequences() {
    checkDestroy(this.#isDestroyed);
    this.#keySequences.clear();
  }

  /**
   * Checks whether a given input sequence is currently registered.
   * @param {string[]} sequence - The sequence to check
   * @returns {boolean}
   */
  hasKeySequence(sequence) {
    checkDestroy(this.#isDestroyed);
    if (!Array.isArray(sequence) || !sequence.every((s) => typeof s === 'string'))
      throw new TypeError(
        `'sequence' must be an array of strings, got: ${JSON.stringify(sequence)}`,
      );
    const key = sequence.join('+');
    return this.#keySequences.has(key);
  }

  ////////////////////////////////////////////////////////

  /**
   * Renew the currently held combo logical keys.
   */
  renewComboMapped() {
    checkDestroy(this.#isDestroyed);
    if (this.#intervalComboKeys) {
      clearTimeout(this.#intervalComboKeys);
      this.#intervalComboKeys = setTimeout(() => this.resetComboMapped(), this.#timeoutComboKeys);
    }
  }

  /**
   * Resets the currently held key combo logical inputs.
   */
  resetComboMapped() {
    checkDestroy(this.#isDestroyed);
    if (this.#intervalComboKeys) clearTimeout(this.#intervalComboKeys);
    this.#comboKeys = [];
    this.#intervalComboKeys = null;
    this.#timeComboKeys = 0;
    this.#comboInputs = [];
    this.#timeComboInputs = 0;
  }

  /////////////////////////////////////////////////////////////////

  /**
   * Registers a callback for when a mapped key is activated (pressed down)
   * @param {MappedInputCallback} callback
   */
  onMappedKeyStart(callback) {
    checkDestroy(this.#isDestroyed);
    return this.#onTemplate('', callback, 'mapped-key-start');
  }

  /**
   * Registers a one-time callback for the "mapped-key-start" event.
   * The callback will be automatically removed after it runs once.
   * @param {MappedInputCallback} callback
   */
  onceMappedKeyStart(callback) {
    checkDestroy(this.#isDestroyed);
    return this.#onceTemplate('', callback, 'mapped-key-start');
  }

  /**
   * Prepends a callback to the "mapped-key-start" event.
   * @param {MappedInputCallback} callback
   */
  prependMappedKeyStart(callback) {
    checkDestroy(this.#isDestroyed);
    return this.#prependTemplate('', callback, 'mapped-key-start');
  }

  /**
   * Removes a callback from the "mapped-key-start" event.
   * @param {MappedInputCallback} callback
   */
  offMappedKeyStart(callback) {
    checkDestroy(this.#isDestroyed);
    return this.#offTemplate('', callback, 'mapped-key-start');
  }

  /**
   * Removes all callbacks from the "mapped-key-start" event.
   */
  offAllMappedKeyStart() {
    checkDestroy(this.#isDestroyed);
    this.#callbacks.delete('mapped-key-start');
  }

  //////////////////////////////////////////////////////////////////

  /**
   * Registers a callback for when a mapped key is deactivated (released)
   * @param {MappedInputCallback} callback
   */
  onMappedKeyEnd(callback) {
    checkDestroy(this.#isDestroyed);
    return this.#onTemplate('', callback, 'mapped-key-end');
  }

  /**
   * Registers a one-time callback for the "mapped-key-end" event.
   * The callback will be automatically removed after it runs once.
   * @param {MappedInputCallback} callback
   */
  onceMappedKeyEnd(callback) {
    checkDestroy(this.#isDestroyed);
    return this.#onceTemplate('', callback, 'mapped-key-end');
  }

  /**
   * Prepends a callback to the "mapped-key-end" event.
   * @param {MappedInputCallback} callback
   */
  prependMappedKeyEnd(callback) {
    checkDestroy(this.#isDestroyed);
    return this.#prependTemplate('', callback, 'mapped-key-end');
  }

  /**
   * Removes a callback from the "mapped-key-end" event.
   * @param {MappedInputCallback} callback
   */
  offMappedKeyEnd(callback) {
    checkDestroy(this.#isDestroyed);
    return this.#offTemplate('', callback, 'mapped-key-end');
  }

  /**
   * Removes all callbacks from the "mapped-key-end" event.
   */
  offAllMappedKeyEnd() {
    checkDestroy(this.#isDestroyed);
    this.#callbacks.delete('mapped-key-end');
  }

  /////////////////////////////////////////////////////////////////

  /**
   * Registers a callback for when a mapped input is activated (pressed down)
   * @param {MappedInputCallback} callback
   */
  onMappedInputStart(callback) {
    checkDestroy(this.#isDestroyed);
    return this.#onTemplate('', callback, 'mapped-input-start');
  }

  /**
   * Registers a one-time callback for the "mapped-input-start" event.
   * The callback will be automatically removed after it runs once.
   * @param {MappedInputCallback} callback
   */
  onceMappedInputStart(callback) {
    checkDestroy(this.#isDestroyed);
    return this.#onceTemplate('', callback, 'mapped-input-start');
  }

  /**
   * Prepends a callback to the "mapped-input-start" event.
   * @param {MappedInputCallback} callback
   */
  prependMappedInputStart(callback) {
    checkDestroy(this.#isDestroyed);
    return this.#prependTemplate('', callback, 'mapped-input-start');
  }

  /**
   * Removes a callback from the "mapped-input-start" event.
   * @param {MappedInputCallback} callback
   */
  offMappedInputStart(callback) {
    checkDestroy(this.#isDestroyed);
    return this.#offTemplate('', callback, 'mapped-input-start');
  }

  /**
   * Removes all callbacks from the "mapped-input-start" event.
   */
  offAllMappedInputStart() {
    checkDestroy(this.#isDestroyed);
    this.#callbacks.delete('mapped-input-start');
  }

  //////////////////////////////////////////////////////////////////

  /**
   * Registers a callback for when a mapped input is deactivated (released)
   * @param {MappedInputCallback} callback
   */
  onMappedInputEnd(callback) {
    checkDestroy(this.#isDestroyed);
    return this.#onTemplate('', callback, 'mapped-input-end');
  }

  /**
   * Registers a one-time callback for the "mapped-input-end" event.
   * The callback will be automatically removed after it runs once.
   * @param {MappedInputCallback} callback
   */
  onceMappedInputEnd(callback) {
    checkDestroy(this.#isDestroyed);
    return this.#onceTemplate('', callback, 'mapped-input-end');
  }

  /**
   * Prepends a callback to the "mapped-input-end" event.
   * @param {MappedInputCallback} callback
   */
  prependMappedInputEnd(callback) {
    checkDestroy(this.#isDestroyed);
    return this.#prependTemplate('', callback, 'mapped-input-end');
  }

  /**
   * Removes a callback from the "mapped-input-end" event.
   * @param {MappedInputCallback} callback
   */
  offMappedInputEnd(callback) {
    checkDestroy(this.#isDestroyed);
    return this.#offTemplate('', callback, 'mapped-input-end');
  }

  /**
   * Removes all callbacks from the "mapped-input-end" event.
   */
  offAllMappedInputEnd() {
    checkDestroy(this.#isDestroyed);
    this.#callbacks.delete('mapped-input-end');
  }

  /////////////////////////////////////////////////////////////

  /**
   * Registers a callback for a logical input
   * @param {string} logicalName
   * @param {PayloadCallback} callback
   */
  onInput(logicalName, callback) {
    checkDestroy(this.#isDestroyed);
    return this.#onTemplate(logicalName, callback, 'input-{logicalName}');
  }

  /**
   * Registers a one-time callback for a logical input.
   * The callback is removed after the first invocation.
   * @param {string} logicalName
   * @param {PayloadCallback} callback
   */
  onceInput(logicalName, callback) {
    checkDestroy(this.#isDestroyed);
    return this.#onceTemplate(logicalName, callback, 'input-{logicalName}');
  }

  /**
   * Prepends a callback to the input event list.
   * @param {string} logicalName
   * @param {PayloadCallback} callback
   */
  prependInput(logicalName, callback) {
    checkDestroy(this.#isDestroyed);
    return this.#prependTemplate(logicalName, callback, 'input-{logicalName}');
  }

  /**
   * Removes a callback from a specific logical input event.
   * @param {string} logicalName
   * @param {PayloadCallback} callback
   */
  offInput(logicalName, callback) {
    checkDestroy(this.#isDestroyed);
    return this.#offTemplate(logicalName, callback, 'input-{logicalName}');
  }

  /////////////////////////////////////////////////////////

  /**
   * Registers a callback for the "input-start" event of a logical name
   * @param {string} logicalName
   * @param {PayloadCallback} callback
   */
  onInputStart(logicalName, callback) {
    checkDestroy(this.#isDestroyed);
    return this.#onTemplate(logicalName, callback, 'input-down-{logicalName}');
  }

  /**
   * Registers a one-time callback for the "input-start" event.
   * @param {string} logicalName
   * @param {PayloadCallback} callback
   */
  onceInputStart(logicalName, callback) {
    checkDestroy(this.#isDestroyed);
    return this.#onceTemplate(logicalName, callback, 'input-down-{logicalName}');
  }

  /**
   * Prepends a callback to the "input-start" event list.
   * @param {string} logicalName
   * @param {PayloadCallback} callback
   */
  prependInputStart(logicalName, callback) {
    checkDestroy(this.#isDestroyed);
    return this.#prependTemplate(logicalName, callback, 'input-down-{logicalName}');
  }

  /**
   * Removes a callback from a specific logical "input-start" event.
   * @param {string} logicalName
   * @param {PayloadCallback} callback
   */
  offInputStart(logicalName, callback) {
    checkDestroy(this.#isDestroyed);
    return this.#offTemplate(logicalName, callback, 'input-down-{logicalName}');
  }

  /////////////////////////////////////////////////////////////////////////

  /**
   * Registers a callback for the "input-end" event of a logical name
   * @param {string} logicalName
   * @param {PayloadCallback} callback
   */
  onInputEnd(logicalName, callback) {
    checkDestroy(this.#isDestroyed);
    return this.#onTemplate(logicalName, callback, 'input-up-{logicalName}');
  }

  /**
   * Registers a one-time callback for the "input-end" event.
   * @param {string} logicalName
   * @param {PayloadCallback} callback
   */
  onceInputEnd(logicalName, callback) {
    checkDestroy(this.#isDestroyed);
    return this.#onceTemplate(logicalName, callback, 'input-up-{logicalName}');
  }

  /**
   * Prepends a callback to the "input-end" event list.
   * @param {string} logicalName
   * @param {PayloadCallback} callback
   */
  prependInputEnd(logicalName, callback) {
    checkDestroy(this.#isDestroyed);
    return this.#prependTemplate(logicalName, callback, 'input-up-{logicalName}');
  }

  /**
   * Removes a callback from a specific logical "input-end" event.
   * @param {string} logicalName
   * @param {PayloadCallback} callback
   */
  offInputEnd(logicalName, callback) {
    checkDestroy(this.#isDestroyed);
    return this.#offTemplate(logicalName, callback, 'input-up-{logicalName}');
  }

  ///////////////////////////////////////////////////////////////////

  /**
   * Registers a callback for the "input-hold" event of a logical name
   * @param {string} logicalName
   * @param {PayloadCallback} callback
   */
  onInputHold(logicalName, callback) {
    checkDestroy(this.#isDestroyed);
    return this.#onTemplate(logicalName, callback, 'input-hold-{logicalName}');
  }

  /**
   * Registers a one-time callback for the "input-hold" event.
   * @param {string} logicalName
   * @param {PayloadCallback} callback
   */
  onceInputHold(logicalName, callback) {
    checkDestroy(this.#isDestroyed);
    return this.#onceTemplate(logicalName, callback, 'input-hold-{logicalName}');
  }

  /**
   * Prepends a callback to the "input-hold" event list.
   * @param {string} logicalName
   * @param {PayloadCallback} callback
   */
  prependInputHold(logicalName, callback) {
    checkDestroy(this.#isDestroyed);
    return this.#prependTemplate(logicalName, callback, 'input-hold-{logicalName}');
  }

  /**
   * Removes a callback from a specific logical "input-hold" event.
   * @param {string} logicalName
   * @param {PayloadCallback} callback
   */
  offInputHold(logicalName, callback) {
    checkDestroy(this.#isDestroyed);
    return this.#offTemplate(logicalName, callback, 'input-hold-{logicalName}');
  }

  ////////////////////////////////////////////////////////////

  /**
   * Registers a callback for the "input-change" event of a logical name
   * @param {string} logicalName
   * @param {PayloadCallback} callback
   */
  onInputChange(logicalName, callback) {
    checkDestroy(this.#isDestroyed);
    return this.#onTemplate(logicalName, callback, 'input-change-{logicalName}');
  }

  /**
   * Registers a one-time callback for the "input-change" event.
   * @param {string} logicalName
   * @param {PayloadCallback} callback
   */
  onceInputChange(logicalName, callback) {
    checkDestroy(this.#isDestroyed);
    return this.#onceTemplate(logicalName, callback, 'input-change-{logicalName}');
  }

  /**
   * Prepends a callback to the "input-change" event list.
   * @param {string} logicalName
   * @param {PayloadCallback} callback
   */
  prependInputChange(logicalName, callback) {
    checkDestroy(this.#isDestroyed);
    return this.#prependTemplate(logicalName, callback, 'input-change-{logicalName}');
  }

  /**
   * Removes a callback from a specific logical "input-change" event.
   * @param {string} logicalName
   * @param {PayloadCallback} callback
   */
  offInputChange(logicalName, callback) {
    checkDestroy(this.#isDestroyed);
    return this.#offTemplate(logicalName, callback, 'input-change-{logicalName}');
  }

  ////////////////////////////////////////////////////////////

  /**
   * Registers a callback for the "input-move" event of a logical name
   * @param {string} logicalName
   * @param {PayloadCallback} callback
   */
  onInputMove(logicalName, callback) {
    checkDestroy(this.#isDestroyed);
    return this.#onTemplate(logicalName, callback, 'input-move-{logicalName}');
  }

  /**
   * Registers a one-time callback for the "input-move" event.
   * @param {string} logicalName
   * @param {PayloadCallback} callback
   */
  onceInputMove(logicalName, callback) {
    checkDestroy(this.#isDestroyed);
    return this.#onceTemplate(logicalName, callback, 'input-move-{logicalName}');
  }

  /**
   * Prepends a callback to the "input-move" event list.
   * @param {string} logicalName
   * @param {PayloadCallback} callback
   */
  prependInputMove(logicalName, callback) {
    checkDestroy(this.#isDestroyed);
    return this.#prependTemplate(logicalName, callback, 'input-move-{logicalName}');
  }

  /**
   * Removes a callback from a specific logical "input-move" event.
   * @param {string} logicalName
   * @param {PayloadCallback} callback
   */
  offInputMove(logicalName, callback) {
    checkDestroy(this.#isDestroyed);
    return this.#offTemplate(logicalName, callback, 'input-move-{logicalName}');
  }

  ////////////////////////////////////////////////////////////

  /**
   * Returns a shallow clone of the callback list for a given logical input and event type.
   * @param {string} logicalName
   * @param {'all' | 'start' | 'end' | 'hold' | 'change' | 'move'} [type='all']
   * @returns {Function[]}
   */
  getCalls(logicalName, type = 'all') {
    checkDestroy(this.#isDestroyed);
    if (typeof logicalName !== 'string' || logicalName.trim() === '')
      throw new TypeError(`"logicalName" must be a non-empty string, received ${logicalName}`);
    const validTypes = ['all', 'start', 'end', 'hold', 'change', 'move'];
    if (!validTypes.includes(type))
      throw new TypeError(`"type" must be one of ${validTypes.join(', ')}, received ${type}`);
    const prefix = {
      all: 'input-',
      start: 'input-down-',
      end: 'input-up-',
      hold: 'input-hold-',
      change: 'input-change-',
      move: 'input-move-',
    }[type];
    const key = `${prefix}${logicalName}`;
    const list = this.#callbacks.get(key);
    return Array.isArray(list) ? [...list] : [];
  }

  /**
   * Removes all callbacks for a specific logical input event.
   * @param {string} logicalName
   * @param {'all'| 'start' | 'end' | 'hold' | 'change' | 'move'} [type='all']
   */
  offAllInputs(logicalName, type = 'all') {
    checkDestroy(this.#isDestroyed);
    if (typeof logicalName !== 'string' || logicalName.trim() === '')
      throw new TypeError(`"logicalName" must be a non-empty string, received ${logicalName}`);
    const validTypes = ['all', 'start', 'end', 'hold', 'change', 'move'];
    if (!validTypes.includes(type))
      throw new TypeError(`"type" must be one of ${validTypes.join(', ')}, received ${type}`);
    const prefix = {
      all: 'input-',
      start: 'input-down-',
      end: 'input-up-',
      hold: 'input-hold-',
      change: 'input-change-',
      move: 'input-move-',
    }[type];
    if (prefix) this.#callbacks.delete(`${prefix}${logicalName}`);
  }

  /**
   * Returns the number of registered callbacks for a specific logical input and type.
   * @param {string} logicalName
   * @param {'all' | 'start' | 'end' | 'hold' | 'change' | 'move'} [type='all']
   * @returns {number}
   */
  getCallSize(logicalName, type = 'all') {
    checkDestroy(this.#isDestroyed);
    if (typeof logicalName !== 'string' || logicalName.trim() === '')
      throw new TypeError(`"logicalName" must be a non-empty string, received ${logicalName}`);
    const validTypes = ['all', 'start', 'end', 'hold', 'change', 'move'];
    if (!validTypes.includes(type))
      throw new TypeError(`"type" must be one of ${validTypes.join(', ')}, received ${type}`);
    const prefix = {
      all: 'input-',
      start: 'input-down-',
      end: 'input-up-',
      hold: 'input-hold-',
      change: 'input-change-',
      move: 'input-move-',
    }[type];
    const list = this.#callbacks.get(`${prefix}${logicalName}`);
    return Array.isArray(list) ? list.length : 0;
  }

  ////////////////////////////////////////////////

  /**
   * Default haptic effect settings
   */
  #defaultHapticEffect = {
    /** @type {GamepadHapticEffectType} */
    type: 'dual-rumble',
    /** @type {GamepadEffectParameters} */
    params: {
      startDelay: 0,
      duration: 200,
      weakMagnitude: 0.5,
      strongMagnitude: 1.0,
    },
  };

  /**
   * Returns the current default haptic feedback effect configuration.
   *
   * This includes the effect type (e.g., 'dual-rumble') and its parameters
   * such as duration, delay, and vibration intensities (weak and strong).
   *
   * The returned object is a shallow clone to prevent external mutation.
   *
   * @returns {{ type: GamepadHapticEffectType; params: GamepadEffectParameters; }} The default haptic effect settings.
   */
  get defaultHapticEffect() {
    checkDestroy(this.#isDestroyed);
    return {
      type: this.#defaultHapticEffect.type,
      params: { ...this.#defaultHapticEffect.params },
    };
  }

  /**
   * Sets the default haptic feedback effect configuration.
   * @param {GamepadHapticEffectType} type - Type of effect.
   * @param {GamepadEffectParameters} params - Effect parameters.
   */
  setDefaultHapticEffect(type, params) {
    checkDestroy(this.#isDestroyed);
    if (typeof type !== 'string')
      throw new TypeError(
        `"type" must be a valid GamepadHapticEffectType string, received ${type}`,
      );
    if (typeof params !== 'object' || params === null)
      throw new TypeError(`"params" must be a non-null object, received ${params}`);
    this.#defaultHapticEffect.type = type;
    this.#defaultHapticEffect.params = params;
  }

  /**
   * Checks if the connected gamepad supports haptic feedback.
   * @returns {boolean}
   */
  hasHapticEffect() {
    checkDestroy(this.#isDestroyed);
    const gp = this.#connectedGamepad;
    if (!gp) return false;
    const vibrationActuator = gp.vibrationActuator;
    if (!(vibrationActuator instanceof GamepadHapticActuator)) return false;
    return true;
  }

  /**
   * Triggers a haptic feedback vibration using provided or default settings.
   * @param {GamepadEffectParameters} [params] - Custom parameters.
   * @param {GamepadHapticEffectType} [type] - Custom type.
   * @returns {Promise<GamepadHapticsResult>}
   */
  vibrate(params, type) {
    checkDestroy(this.#isDestroyed);
    if (params !== undefined && (typeof params !== 'object' || params === null))
      throw new TypeError(`"params" must be an object if provided, received ${params}`);
    if (type !== undefined && typeof type !== 'string')
      throw new TypeError(
        `"type" must be a valid GamepadHapticEffectType string if provided, received ${type}`,
      );
    const gp = this.#connectedGamepad;
    if (!gp) return new Promise((resolve) => resolve('complete'));
    const vibrationActuator = gp.vibrationActuator;
    if (!(vibrationActuator instanceof GamepadHapticActuator))
      return new Promise((resolve) => resolve('complete'));
    return vibrationActuator.playEffect(type ?? this.#defaultHapticEffect.type, {
      ...this.#defaultHapticEffect.params,
      ...params,
    });
  }

  ////////////////////////////////////////////

  /**
   * Adds an ID to the ignored list
   * @param {string} id
   */
  ignoreId(id) {
    checkDestroy(this.#isDestroyed);
    if (typeof id !== 'string' || id.trim() === '')
      throw new TypeError(`"id" must be a non-empty string, received ${id}`);
    this.#ignoreIds.add(id);
  }

  /**
   * Removes an ID from the ignored list
   * @param {string} id
   */
  unignoreId(id) {
    checkDestroy(this.#isDestroyed);
    if (typeof id !== 'string' || id.trim() === '')
      throw new TypeError(`"id" must be a non-empty string, received ${id}`);
    this.#ignoreIds.delete(id);
  }

  /**
   * Registers a callback for the "connected" event
   * @param {ConnectionCallback} callback
   */
  onConnected(callback) {
    checkDestroy(this.#isDestroyed);
    return this.#onTemplate('', callback, 'connected');
  }

  /**
   * Registers a one-time callback for the "connected" event.
   * The callback will be automatically removed after it runs once.
   * @param {ConnectionCallback} callback
   */
  onceConnected(callback) {
    checkDestroy(this.#isDestroyed);
    return this.#onceTemplate('', callback, 'connected');
  }

  /**
   * Prepends a callback to the "connected" event.
   * @param {ConnectionCallback} callback
   */
  prependConnected(callback) {
    checkDestroy(this.#isDestroyed);
    return this.#prependTemplate('', callback, 'connected');
  }

  /**
   * Removes a callback from the "connected" event.
   * @param {ConnectionCallback} callback
   */
  offConnected(callback) {
    checkDestroy(this.#isDestroyed);
    return this.#offTemplate('', callback, 'connected');
  }

  /**
   * Removes all callbacks from the "connected" event.
   */
  offAllConnected() {
    checkDestroy(this.#isDestroyed);
    this.#callbacks.delete('connected');
  }

  /**
   * Registers a callback for the "disconnected" event
   * @param {ConnectionCallback} callback
   */
  onDisconnected(callback) {
    checkDestroy(this.#isDestroyed);
    return this.#onTemplate('', callback, 'disconnected');
  }

  /**
   * Registers a one-time callback for the "disconnected" event.
   * The callback will be automatically removed after it runs once.
   * @param {ConnectionCallback} callback
   */
  onceDisconnected(callback) {
    checkDestroy(this.#isDestroyed);
    return this.#onceTemplate('', callback, 'disconnected');
  }

  /**
   * Prepends a callback to the "disconnected" event.
   * @param {ConnectionCallback} callback
   */
  prependDisconnected(callback) {
    checkDestroy(this.#isDestroyed);
    return this.#prependTemplate('', callback, 'disconnected');
  }

  /**
   * Removes a callback from the "disconnected" event.
   * @param {ConnectionCallback} callback
   */
  offDisconnected(callback) {
    checkDestroy(this.#isDestroyed);
    return this.#offTemplate('', callback, 'disconnected');
  }

  /**
   * Removes all callbacks from the "disconnected" event.
   */
  offAllDisconnected() {
    checkDestroy(this.#isDestroyed);
    this.#callbacks.delete('disconnected');
  }

  //////////////////////////////////////////

  /**
   * Returns whether a gamepad is currently connected.
   * @returns {boolean}
   */
  hasGamepad() {
    checkDestroy(this.#isDestroyed);
    return this.#connectedGamepad instanceof Gamepad;
  }

  /**
   * Returns the currently connected Gamepad instance.
   * Throws if no gamepad is connected.
   * @returns {Gamepad}
   */
  getGamepad() {
    checkDestroy(this.#isDestroyed);
    if (!this.#connectedGamepad) throw new Error('No gamepad is currently connected.');
    return this.#connectedGamepad;
  }

  /**
   * Checks if there is a recorded last state for a given button index.
   * @param {number} index - The index of the button to check.
   * @returns {boolean} True if a last state exists for the specified button index; otherwise, false.
   */
  hasLastButtonState(index) {
    checkDestroy(this.#isDestroyed);
    if (!this.#lastButtonStates[index]) return false;
    return true;
  }

  /**
   * Retrieves the last recorded state for a given button index.
   * Throws an error if the button index has no recorded state.
   * @param {number} index - The index of the button to retrieve.
   * @returns {KeyStatus} A copy of the last known state for the specified button index.
   * @throws {Error} If no last state exists for the specified button index.
   */
  getLastButtonState(index) {
    checkDestroy(this.#isDestroyed);
    if (!this.#lastButtonStates[index])
      throw new Error(`No last button state found for index ${index}`);
    return { ...this.#lastButtonStates[index] };
  }

  //////////////////////////////////////////

  /**
   * Exports the current TinyGamepad configuration as a plain object suitable for serialization.
   * Includes device filters, input mappings, and various sensitivity settings.
   * @returns {ExportedConfig} The current configuration snapshot.
   */
  exportConfig() {
    checkDestroy(this.#isDestroyed);
    return {
      expectedId: this.#expectedId,
      ignoreIds: Array.from(this.#ignoreIds),
      deadZone: this.#deadZone,
      timeoutComboKeys: this.#timeoutComboKeys,
      axisActiveSensitivity: this.#axisActiveSensitivity,
      inputMap: Array.from(this.#inputMap.entries()),
    };
  }

  /**
   * Imports and applies a configuration object or JSON string to update TinyGamepad settings.
   * Validates the input to ensure proper types and throws if invalid.
   * @param {string | ExportedConfig} json - JSON string or configuration object to apply.
   * @throws {TypeError} Throws if the provided argument is not a valid JSON string or configuration object,
   * or if any property has an incorrect type.
   */
  importConfig(json) {
    checkDestroy(this.#isDestroyed);
    if (typeof json !== 'string' && (typeof json !== 'object' || json === null))
      throw new TypeError(`"json" must be a string or a non-null object, received: ${json}`);

    const config = typeof json === 'string' ? JSON.parse(json) : json;

    if (
      config.expectedId !== undefined &&
      typeof config.expectedId !== 'string' &&
      config.expectedId !== null
    )
      throw new TypeError(`"expectedId" must be a string or null if provided`);

    if (config.ignoreIds !== undefined && !Array.isArray(config.ignoreIds))
      throw new TypeError(`"ignoreIds" must be an array if provided`);

    if (config.deadZone !== undefined && typeof config.deadZone !== 'number')
      throw new TypeError(`"deadZone" must be a number if provided`);

    if (config.timeoutComboKeys !== undefined && typeof config.timeoutComboKeys !== 'number')
      throw new TypeError(`"timeoutComboKeys" must be a number if provided`);

    if (
      config.axisActiveSensitivity !== undefined &&
      typeof config.axisActiveSensitivity !== 'number'
    )
      throw new TypeError(`"axisActiveSensitivity" must be a number if provided`);

    if (config.inputMap !== undefined && !Array.isArray(config.inputMap))
      throw new TypeError(`"inputMap" must be an array if provided`);

    if (config.expectedId !== undefined) this.#expectedId = config.expectedId;
    if (Array.isArray(config.ignoreIds)) this.#ignoreIds = new Set(config.ignoreIds);
    if (typeof config.deadZone === 'number') this.#deadZone = config.deadZone;
    if (typeof config.timeoutComboKeys === 'number')
      this.#timeoutComboKeys = config.timeoutComboKeys;
    if (typeof config.axisActiveSensitivity === 'number')
      this.#axisActiveSensitivity = config.axisActiveSensitivity;
    if (Array.isArray(config.inputMap)) this.#inputMap = new Map(config.inputMap);
  }

  ///////////////////////////////////////////////////////////////

  /**
   * Returns a cloned list of the "mapped-key-start" event callbacks.
   * @returns {MappedInputCallback[]}
   */
  get mappedKeyStartCalls() {
    checkDestroy(this.#isDestroyed);
    /** @type {MappedInputCallback[]} */
    // @ts-ignore
    const list = this.#callbacks.get('mapped-key-start');
    return Array.isArray(list) ? [...list] : [];
  }

  /**
   * Returns a cloned list of the "mapped-key-end" event callbacks.
   * @returns {MappedInputCallback[]}
   */
  get mappedKeyEndCalls() {
    checkDestroy(this.#isDestroyed);
    /** @type {MappedInputCallback[]} */
    // @ts-ignore
    const list = this.#callbacks.get('mapped-key-end');
    return Array.isArray(list) ? [...list] : [];
  }

  ///////////////////////////////////////////////////////////////

  /**
   * Returns a clone of currently held key combo logical inputs.
   * @returns {string[]}
   */
  get comboMappedKeys() {
    checkDestroy(this.#isDestroyed);
    return [...this.#comboKeys];
  }

  /**
   * Returns a clone of currently held combo logical inputs.
   * @returns {string[]}
   */
  get comboMappedInputs() {
    checkDestroy(this.#isDestroyed);
    return [...this.#comboInputs];
  }

  ////////////////////////////////////

  /**
   * Returns the number of input sequences currently registered.
   * @returns {number}
   */
  get keySequenceSize() {
    checkDestroy(this.#isDestroyed);
    return this.#keySequences.size;
  }

  /**
   * Returns a shallow clone of all input sequences and their associated data.
   * @returns {InputSequenceCallback[]}
   */
  get keySequences() {
    checkDestroy(this.#isDestroyed);
    const result = [];
    for (const [, data] of this.#keySequences.entries()) result.push(data.callback);
    return result;
  }

  /**
   * Returns a clone of currently held mapped logical keys.
   * @returns {string[]}
   */
  get activeMappedKeys() {
    checkDestroy(this.#isDestroyed);
    return [...this.#activeMappedKeys];
  }

  ////////////////////////////////////

  /**
   * Returns a cloned list of the "mapped-input-start" event callbacks.
   * @returns {MappedInputCallback[]}
   */
  get mappedInputStartCalls() {
    checkDestroy(this.#isDestroyed);
    /** @type {MappedInputCallback[]} */
    // @ts-ignore
    const list = this.#callbacks.get('mapped-input-start');
    return Array.isArray(list) ? [...list] : [];
  }

  /**
   * Returns a cloned list of the "mapped-input-end" event callbacks.
   * @returns {MappedInputCallback[]}
   */
  get mappedInputEndCalls() {
    checkDestroy(this.#isDestroyed);
    /** @type {MappedInputCallback[]} */
    // @ts-ignore
    const list = this.#callbacks.get('mapped-input-end');
    return Array.isArray(list) ? [...list] : [];
  }

  ////////////////////////////////////

  /**
   * Returns the number of input sequences currently registered.
   * @returns {number}
   */
  get inputSequenceSize() {
    checkDestroy(this.#isDestroyed);
    return this.#inputSequences.size;
  }

  /**
   * Returns a shallow clone of all input sequences and their associated data.
   * @returns {InputSequenceCallback[]}
   */
  get inputSequences() {
    checkDestroy(this.#isDestroyed);
    const result = [];
    for (const [, data] of this.#inputSequences.entries()) result.push(data.callback);
    return result;
  }

  /**
   * Returns a clone of currently held mapped logical inputs.
   * @returns {string[]}
   */
  get activeMappedInputs() {
    checkDestroy(this.#isDestroyed);
    return [...this.#activeMappedInputs];
  }

  ////////////////////////////////////

  /**
   * Returns a shallow clone of all logical-to-physical input mappings as a plain object.
   * @returns {{ [logicalName: string]: string | string[] }}
   */
  get mappedInputs() {
    checkDestroy(this.#isDestroyed);
    /** @type {{ [logicalName: string]: string | string[] }} */
    const result = {};
    for (const [logicalName, physicalInput] of this.#inputMap.entries()) {
      result[logicalName] = physicalInput;
    }
    return result;
  }

  /**
   * Returns the number of logical inputs currently mapped.
   * @returns {number}
   */
  get mappedInputSize() {
    checkDestroy(this.#isDestroyed);
    return this.#inputMap.size;
  }

  ////////////////////////////////////

  /**
   * Returns a cloned list of the "connected" event callbacks.
   * @returns {ConnectionCallback[]}
   */
  get connectedCalls() {
    checkDestroy(this.#isDestroyed);
    /** @type {ConnectionCallback[]} */
    // @ts-ignore
    const list = this.#callbacks.get('connected');
    return Array.isArray(list) ? [...list] : [];
  }

  /**
   * Returns a cloned list of the "disconnected" event callbacks.
   * @returns {ConnectionCallback[]}
   */
  get disconnectedCalls() {
    checkDestroy(this.#isDestroyed);
    /** @type {ConnectionCallback[]} */
    // @ts-ignore
    const list = this.#callbacks.get('disconnected');
    return Array.isArray(list) ? [...list] : [];
  }

  ////////////////////////////////////

  /**
   * Returns a shallow clone of the set of ignored device IDs.
   * @returns {string[]}
   */
  get ignoredDeviceIds() {
    checkDestroy(this.#isDestroyed);
    return [...this.#ignoreIds];
  }

  /**
   * Returns a shallow clone of the currently held keys.
   * @returns {string[]}
   */
  get heldKeys() {
    checkDestroy(this.#isDestroyed);
    return [...this.#heldKeys];
  }

  ////////////////////////////////////

  /**
   * Returns the total number of sub event keys inside all events currently registered.
   * @returns {number}
   */
  get eventsSize() {
    checkDestroy(this.#isDestroyed);
    let total = 0;
    this.#callbacks.forEach((values) => {
      total += values.length;
    });
    return total;
  }

  /**
   * Returns the total number of unique event keys currently registered.
   * @returns {number}
   */
  get callSize() {
    checkDestroy(this.#isDestroyed);
    return this.#callbacks.size;
  }

  /**
   * Returns the number of callbacks registered for the "connected" event.
   * @returns {number}
   */
  get connectedCallSize() {
    checkDestroy(this.#isDestroyed);
    const list = this.#callbacks.get('connected');
    return Array.isArray(list) ? list.length : 0;
  }

  /**
   * Returns the number of callbacks registered for the "disconnected" event.
   * @returns {number}
   */
  get disconnectedCallSize() {
    checkDestroy(this.#isDestroyed);
    const list = this.#callbacks.get('disconnected');
    return Array.isArray(list) ? list.length : 0;
  }

  /**
   * Returns the number of callbacks registered for the "mapped-key-start" event.
   * @returns {number}
   */
  get mappedKeyStartCallSize() {
    checkDestroy(this.#isDestroyed);
    const list = this.#callbacks.get('mapped-key-start');
    return Array.isArray(list) ? list.length : 0;
  }

  /**
   * Returns the number of callbacks registered for the "mapped-key-end" event.
   * @returns {number}
   */
  get mappedKeyEndCallSize() {
    checkDestroy(this.#isDestroyed);
    const list = this.#callbacks.get('mapped-key-end');
    return Array.isArray(list) ? list.length : 0;
  }

  /**
   * Returns the number of callbacks registered for the "mapped-input-start" event.
   * @returns {number}
   */
  get mappedInputStartCallSize() {
    checkDestroy(this.#isDestroyed);
    const list = this.#callbacks.get('mapped-input-start');
    return Array.isArray(list) ? list.length : 0;
  }

  /**
   * Returns the number of callbacks registered for the "mapped-input-end" event.
   * @returns {number}
   */
  get mappedInputEndCallSize() {
    checkDestroy(this.#isDestroyed);
    const list = this.#callbacks.get('mapped-input-end');
    return Array.isArray(list) ? list.length : 0;
  }

  //////////////////////////////////////

  /**
   * Retrieves a snapshot of the most recent button states.
   * Each element represents the status of a specific button at the last update cycle.
   * @returns {KeyStatus[]} An array of button states from the last poll.
   */
  get lastButtonStates() {
    checkDestroy(this.#isDestroyed);
    /** @type {KeyStatus[]} */
    const results = [];
    this.#lastButtonStates.forEach((value) => {
      results.push({ ...value });
    });
    return results;
  }

  /**
   * Retrieves a snapshot of the most recent axis values.
   * Each element is a numeric value representing the position or tilt of a specific axis at the last update cycle.
   * @returns {number[]} An array of axis values from the last poll.
   */
  get lastAxes() {
    checkDestroy(this.#isDestroyed);
    return [...this.#lastAxes];
  }

  //////////////////////////////////////

  /**
   * Returns the current input mode (e.g., 'keyboard-only', 'gamepad-only', or 'both').
   * @returns {InputMode}
   */
  get inputMode() {
    checkDestroy(this.#isDestroyed);
    return this.#inputMode;
  }

  /**
   * Returns the base element or window used for event binding.
   * @returns {Window|Element}
   */
  get elementBase() {
    checkDestroy(this.#isDestroyed);
    return this.#elementBase;
  }

  /**
   * Returns the timestamp of the last mapped input combo.
   * @returns {number}
   */
  get timeComboInputs() {
    checkDestroy(this.#isDestroyed);
    return this.#timeComboInputs;
  }

  /**
   * Returns the timestamp of the last raw key combo.
   * @returns {number}
   */
  get timeComboKeys() {
    checkDestroy(this.#isDestroyed);
    return this.#timeComboKeys;
  }

  /**
   * Returns the timestamp of the last mapped input activity.
   * @returns {number}
   */
  get timeMappedInputs() {
    checkDestroy(this.#isDestroyed);
    return this.#timeMappedInputs;
  }

  /**
   * Returns the timeout duration (in milliseconds) before raw key combos are reset.
   * @returns {number}
   */
  get timeoutComboKeys() {
    checkDestroy(this.#isDestroyed);
    return this.#timeoutComboKeys;
  }

  /**
   * Sets the timeout duration (in milliseconds) before raw key combos are reset.
   * Must be a positive number.
   * @param {number} value
   */
  set timeoutComboKeys(value) {
    checkDestroy(this.#isDestroyed);
    if (typeof value !== 'number' || value < 0 || !Number.isFinite(value))
      throw new TypeError('Timeout combo keys must be a non-negative finite number.');
    this.#timeoutComboKeys = value;
  }

  /**
   * Gets the sensitivity threshold used to detect when an axis (like a thumbstick or trigger)
   * is considered "actively moved". This helps distinguish minor noise from intentional input.
   *
   * A value of 0 means even the slightest movement is detected; a value closer to 1 means only strong input is accepted.
   *
   * @returns {number} The current axis activity sensitivity (between 0 and 1).
   */
  get axisActiveSensitivity() {
    checkDestroy(this.#isDestroyed);
    return this.#axisActiveSensitivity;
  }

  /**
   * Sets the sensitivity threshold used to detect active axis input.
   * This value defines how far an analog axis (such as a thumbstick or trigger) must move from its rest position
   * before being considered as a valid input.
   *
   * Values must be between 0 and 1. An error is thrown if the value is outside this range or not a number.
   *
   * @param {number} value - The new sensitivity value between 0 and 1.
   */
  set axisActiveSensitivity(value) {
    checkDestroy(this.#isDestroyed);
    if (typeof value !== 'number' || value < 0 || value > 1)
      throw new RangeError('Axis sensitivity must be a number between 0 and 1.');
    this.#axisActiveSensitivity = value;
  }

  /**
   * Returns the current dead zone threshold for analog inputs.
   * @returns {number}
   */
  get deadZone() {
    checkDestroy(this.#isDestroyed);
    return this.#deadZone;
  }

  /**
   * Sets a new dead zone threshold for analog inputs.
   * Must be a number between 0 and 1.
   * @param {number} value
   */
  set deadZone(value) {
    checkDestroy(this.#isDestroyed);
    if (typeof value !== 'number' || value < 0 || value > 1)
      throw new RangeError('Dead zone must be a number between 0 and 1.');
    this.#deadZone = value;
  }

  /**
   * Returns the expected device ID, or null if any is accepted.
   * @returns {string|null}
   */
  get expectedId() {
    checkDestroy(this.#isDestroyed);
    return this.#expectedId;
  }

  /**
   * Sets the expected device ID.
   */
  set expectedId(value) {
    checkDestroy(this.#isDestroyed);
    if (typeof value !== 'string') throw new TypeError('Expected device id be a string.');
    this.#expectedId = value;
  }

  ////////////////////////////////////

  /**
   * Returns whether the instance has been destroyed
   * @returns {boolean}
   */
  get isDestroyed() {
    return this.#isDestroyed;
  }

  /**
   * Clears internal state and stops any ongoing input monitoring or loops.
   * Marks the instance as destroyed.
   */
  destroy() {
    if (this.#isDestroyed) return;

    if (this.#animationFrame) cancelAnimationFrame(this.#animationFrame);
    if (this.#mouseKeyboardHoldLoop) cancelAnimationFrame(this.#mouseKeyboardHoldLoop);
    this.#animationFrame = null;
    this.#mouseKeyboardHoldLoop = null;

    if (['keyboard-only', 'both'].includes(this.#inputMode)) {
      this.#elementBase.removeEventListener('keydown', this.#keydown);
      this.#elementBase.removeEventListener('keyup', this.#keyup);
      if (this.#allowMouse) {
        this.#elementBase.removeEventListener('mousedown', this.#mousedown);
        this.#elementBase.removeEventListener('mouseup', this.#mouseup);
        this.#elementBase.removeEventListener('mousemove', this.#mousemove);
      }
    }

    if (['gamepad-only', 'both'].includes(this.#inputMode)) {
      window.removeEventListener('gamepadconnected', this.#gamepadConnected);
      window.removeEventListener('gamepaddisconnected', this.#gamepadDisconnected);
    }

    this.resetComboMapped();
    this.#inputMap.clear();
    this.#callbacks.clear();
    this.#heldKeys.clear();
    this.#activeMappedInputs.clear();
    this.#activeMappedKeys.clear();
    this.#inputSequences.clear();
    this.#keySequences.clear();
    this.#ignoreIds.clear();
    this.#keyOldValue.clear();
    this.#lastButtonStates = [];
    this.#lastAxes = [];
    this.#lastKeyStates = {};
    this.#connectedGamepad = null;
    this.#expectedId = null;
    this.#allowMouse = false;
    this.#timeMappedInputs = 0;
    this.#isDestroyed = true;
  }
}

export default TinyGamepad;
