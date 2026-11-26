# 🎮 TinyGamepad

TinyGamepad is a powerful and flexible JavaScript library designed to manage gamepad, keyboard, and mouse inputs seamlessly.
It supports advanced features like input mapping, combo detection, haptic feedback, and multiple event callbacks — all in a clean, easy-to-use API.

Perfect for game developers and interactive apps who want precise control over input devices without hassle.

---

## 📑 Table of Contents

- [🎮 Type Definitions](#-type-definitions)
  - [🔑 `KeyStatus`](#-keystatus)
  - [🎯 `InputMode`](#-inputmode)
  - [🗺️ `MappedInputCallback`](#️-mappedinputcallback)
  - [⌨️ `MappedKeyCallback`](#️-mappedkeycallback)
  - [📦 `PayloadCallback`](#-payloadcallback)
  - [🔌 `ConnectionCallback`](#-connectioncallback)
  - [🕹️ `InputSequenceCallback`](#️-inputsequencecallback)
  - [⌨️ `KeySequenceCallback`](#️-keysequencecallback)
  - [📚 `CallbackList`](#-callbacklist)
  - [🎮 `GamepadDeviceSource`](#-gamepaddevicesource)
  - [🖱️ `DeviceSource`](#️-devicesource)
  - [📍 `DeviceInputType`](#-deviceinputtype)
  - [🆙 `InputPayload`](#-inputpayload)
  - [📏 `InputAnalogPayload`](#-inputanalogpayload)
  - [🗂️ `InputEvents`](#️-inputevents)
  - [🎚️ `InputAnalogEvents`](#️-inputanalogevents)
  - [🔌 `ConnectionPayload`](#-connectionpayload)
  - [⚙️ `ExportedConfig`](#️-exportedconfig)
- [🎮 Constructor & Input Event Initialization](#-constructor--input-event-initialization)
  - [⚙️ Constructor](#️-constructor)
- [🎮 Input Mapping & Sequence Management](#-input-mapping--sequence-management)
  - [⏳ `awaitInputMapping({ timeout, eventName, canMove })`](#-awaitinputmapping-timeout-eventname-canmove-)
  - [🛠️ `mapInput(logicalName, physicalInput)`](#️-mapinputlogicalname-physicalinput)
  - [❌ `unmapInput(logicalName)`](#-unmapinputlogicalname)
  - [🔍 `hasMappedInput(logicalName): boolean`](#-hasmappedinputlogicalname-boolean)
  - [📋 `getMappedInput(logicalName): string | string[]`](#-getmappedinputlogicalname-string--string)
  - [🧹 `clearMapInputs()`](#-clearmapinputs)
- [🔗 Input Sequences — Logical & Physical](#-input-sequences--logical--physical)
- [⏳ Combo Logical Keys Management](#-combo-logical-keys-management)
- [🎯 Event Listener Methods for Input Events](#-event-listener-methods-for-input-events)
  - [🔑 Mapped Key Events](#-mapped-key-events)
  - [🎛️ Mapped Input Events (includes buttons, analogs, sensors, etc.)](#️-mapped-input-events-includes-buttons-analogs-sensors-etc)
  - [🧩 Logical Input Events by Name](#-logical-input-events-by-name)
- [📋 Callback Management for Logical Inputs](#-callback-management-for-logical-inputs)
  - [🔍 Get Registered Callbacks](#-get-registered-callbacks)
  - [❌ Remove All Callbacks for an Input](#-remove-all-callbacks-for-an-input)
  - [🔢 Count Registered Callbacks](#-count-registered-callbacks)
- [🎮 Haptic Feedback (Vibration) Control](#-haptic-feedback-vibration-control)
  - [⚙️ Default Haptic Effect Settings](#️-default-haptic-effect-settings)
  - [🔍 `get defaultHapticEffect()`](#-get-defaulthapticeffect)
  - [🔧 `setDefaultHapticEffect(type, params)`](#-setdefaulthapticeffecttype-params)
  - [🎵 `hasHapticEffect()`](#-hashapticeffect)
  - [📳 `vibrate(params?, type?)`](#-vibrateparams-type)
- [🚫 Ignoring Specific Input IDs](#-ignoring-specific-input-ids)
  - [`ignoreId(id)`](#ignoreidid)
  - [`unignoreId(id)`](#unignoreidid)
- [🔌 Gamepad Connection Events](#-gamepad-connection-events)
  - [Connection Callbacks](#connection-callbacks)
  - [Disconnection Callbacks](#disconnection-callbacks)
- [🎮 Gamepad Info and State](#-gamepad-info-and-state)
  - [`hasGamepad()`](#hasgamepad)
  - [`getGamepad()`](#getgamepad)
  - [Button Last State Tracking](#button-last-state-tracking)
- [⚙️ Configuration Export & Import](#️-configuration-export--import)
  - [💾 `exportConfig()`](#-exportconfig)
  - [📥 `importConfig(json)`](#-importconfigjson)
- [🔄 Callback Lists Getters](#-callback-lists-getters)
  - [🔑 Mapped Key Callbacks](#-mapped-key-callbacks)
  - [🔀 Combo Keys and Inputs](#-combo-keys-and-inputs)
- [📜 Input Sequence Info](#-input-sequence-info)
  - [🔢 Key Sequences](#-key-sequences)
  - [🔑 Active Mapped Keys & Inputs](#-active-mapped-keys--inputs)
- [🔑 Mapped Input Callbacks](#-mapped-input-callbacks)
- [🧩 Input Sequences (Again)](#-input-sequences-again)
- [🗺️ Logical-to-Physical Mapping Info](#️-logical-to-physical-mapping-info)
- [🔌 Connection Event Callbacks](#-connection-event-callbacks)
- [🚫 Ignored Devices & Held Keys](#-ignored-devices--held-keys)
- [📊 Event Counts & Sizes](#-event-counts--sizes)
- [🎮 Last Button and Axis States](#-last-button-and-axis-states)
- [🎛️ Input Modes and Event Targets](#️-input-modes-and-event-targets)
- [⏰ Timestamps & Timeouts](#-timestamps--timeouts)
- [🎚️ Sensitivity & Dead Zone Settings](#️-sensitivity--dead-zone-settings)
- [🆔 Device Identification](#-device-identification)
- [🧹 Lifecycle & Cleanup](#-lifecycle--cleanup)
  - [🔒 `isDestroyed`](#-isdestroyed)
  - [🗑️ `destroy()`](#️-destroy)

---

## 🎮 Type Definitions

This section documents the key **types**, **structures**, and **callback signatures** used by **TinyGamepad** for handling gamepad, keyboard, and mouse inputs.

---

### 🔑 `KeyStatus`

Represents the **status** of a key or button.

```ts
type KeyStatus = {
  pressed: boolean;      // Whether the key is currently pressed
  value?: number;        // Optional analog value
  value2?: number;       // Optional secondary analog value
};
```

---

### 🎯 `InputMode`

Defines the available **input modes**:

* `'gamepad-only'` → Only gamepad input
* `'keyboard-only'` → Only keyboard input
* `'both'` → Accept both gamepad and keyboard

```ts
type InputMode = 'gamepad-only' | 'keyboard-only' | 'both';
```

---

### 🗺️ `MappedInputCallback`

Callback fired when a **mapped logical input** (e.g., `"Jump"`, `"Shoot"`) is activated or deactivated.

```ts
type MappedInputCallback = (payload: {
  logicalName: string;    // Logical input name
  activeTime: number;     // Time active in milliseconds
  comboTime: number;      // Combo sequence timing
}) => void;
```

---

### ⌨️ `MappedKeyCallback`

Callback fired when a **mapped key** (e.g., `"KeyA"`, `"KeyB"`) is activated or deactivated.

```ts
type MappedKeyCallback = (payload: {
  key: string;            // Physical key name
  activeTime: number;     // Time active in milliseconds
}) => void;
```

---

### 📦 `PayloadCallback`

Generic callback for handling **input events**:

```ts
type PayloadCallback = (payload: InputPayload | InputAnalogPayload) => void;
```

---

### 🔌 `ConnectionCallback`

Callback for **gamepad connection events**:

```ts
type ConnectionCallback = (payload: ConnectionPayload) => void;
```

---

### 🕹️ `InputSequenceCallback`

Fired when a **registered input sequence** is fully activated:

```ts
type InputSequenceCallback = (timestamp: number) => void;
```

---

### ⌨️ `KeySequenceCallback`

Fired when a **registered key sequence** is fully activated:

```ts
type KeySequenceCallback = (timestamp: number) => void;
```

---

### 📚 `CallbackList`

Union of all possible **callback types** in the event system:

```ts
type CallbackList =
  | ConnectionCallback
  | PayloadCallback
  | MappedInputCallback
  | MappedKeyCallback;
```

---

### 🎮 `GamepadDeviceSource`

Specific gamepad input sources:

* `'gamepad-analog'` → Analog sticks / triggers
* `'gamepad-button'` → Digital buttons

```ts
type GamepadDeviceSource = 'gamepad-analog' | 'gamepad-button';
```

---

### 🖱️ `DeviceSource`

All possible **physical input sources**:

* `'mouse'`
* `'keyboard'`
* `'gamepad-analog'`
* `'gamepad-button'`

```ts
type DeviceSource = 'mouse' | 'keyboard' | GamepadDeviceSource;
```

---

### 📍 `DeviceInputType`

Describes **input interaction types**:

* `'up'` → Released
* `'down'` → Pressed
* `'hold'` → Held
* `'change'` → Value changed
* `'move'` → Analog motion detected

```ts
type DeviceInputType = 'up' | 'down' | 'hold' | 'change' | 'move';
```

---

### 🆙 `InputPayload`

Payload structure for **digital button input events**:

```ts
type InputPayload = {
  id: string;
  event?: Event;
  type: DeviceInputType;
  source: DeviceSource;
  key: string;
  isPressure: boolean;
  logicalName: string;
  value: number;
  value2: number;
  pressed: boolean;
  prevPressed?: boolean | null;
  timestamp: number;
  gp?: Gamepad;
};
```

---

### 📏 `InputAnalogPayload`

Payload structure for **analog input events**:

```ts
type InputAnalogPayload = {
  id: string;
  event?: Event;
  type: DeviceInputType;
  source: DeviceSource;
  key: string;
  logicalName: string;
  value: number;
  value2: number;
  timestamp: number;
  gp?: Gamepad;
};
```

---

### 🗂️ `InputEvents`

Internal structure for **digital input tracking**:

```ts
type InputEvents = {
  id: string;
  event?: Event;
  key: string;
  source: DeviceSource;
  value: number;
  value2: number;
  type: DeviceInputType;
  isPressure: boolean;
  pressed: boolean;
  prevPressed?: boolean | null;
  timestamp: number;
  gp?: Gamepad;
};
```

---

### 🎚️ `InputAnalogEvents`

Internal structure for **analog input tracking**:

```ts
type InputAnalogEvents = {
  id: string;
  event?: Event;
  key: string;
  source: DeviceSource;
  value: number;
  value2: number;
  type: DeviceInputType;
  timestamp: number;
  gp?: Gamepad;
};
```

---

### 🔌 `ConnectionPayload`

Payload for **gamepad connection events**:

```ts
type ConnectionPayload = {
  id: string;
  timestamp: number;
  gp: Gamepad;
};
```

---

### ⚙️ `ExportedConfig`

Structure for **exporting and importing TinyGamepad configurations**:

```ts
type ExportedConfig = {
  expectedId: string | null;                  // Expected gamepad ID or null
  ignoreIds: string[];                        // IDs to ignore
  deadZone: number;                            // Analog dead zone threshold
  timeoutComboKeys: number;                    // Max time between combo inputs
  axisActiveSensitivity: number;               // Analog movement sensitivity
  inputMap: [string, string | string[]][];     // Logical-to-physical mappings
};
```

---

## 🎮 Constructor & Input Event Initialization

### ⚙️ Constructor

```js
constructor({
  expectedId = null,
  inputMode = 'both',
  ignoreIds = [],
  deadZone = 0.1,
  axisActiveSensitivity = 0.3,
  timeoutComboKeys = 500,
  allowMouse = false,
  elementBase = window,
} = {}) { ... }
```

Initializes a new instance of **TinyGamepad** with customizable input behavior.

#### 🔑 Parameters:

| Name                    | Type                | Default        | Description                                                                         |          |                                      |
| ----------------------- | ------------------- | -------------- | ----------------------------------------------------------------------------------- | -------- | ------------------------------------ |
| `expectedId`            | `string \| null`    | `null`         | Specific controller ID to expect; filters gamepads.                                 |          |                                      |
| `inputMode`             | \`'keyboard-only'   | 'gamepad-only' | 'both'\`                                                                            | `'both'` | Selects input sources to listen for. |
| `ignoreIds`             | `string[]`          | `[]`           | List of device IDs to ignore during detection.                                      |          |                                      |
| `deadZone`              | `number`            | `0.1`          | Threshold under which analog stick inputs are ignored (0 to 1).                     |          |                                      |
| `axisActiveSensitivity` | `number`            | `0.3`          | Sensitivity threshold to detect meaningful analog axis movement (0 most sensitive). |          |                                      |
| `timeoutComboKeys`      | `number`            | `500`          | Time (ms) allowed between inputs in a key sequence before reset.                    |          |                                      |
| `allowMouse`            | `boolean`           | `false`        | Whether mouse input events should be treated as triggers.                           |          |                                      |
| `elementBase`           | `Window \| Element` | `window`       | DOM element or window to bind keyboard and mouse event listeners.                   |          |                                      |

#### 🚨 Validation:

* Throws `TypeError` or `RangeError` on invalid types or out-of-range values.
* Ensures only valid configurations are accepted.

#### 🔥 Behavior:

* Initializes gamepad event listeners if mode includes `'gamepad-only'` or `'both'`.
* Initializes keyboard and mouse listeners if mode includes `'keyboard-only'` or `'both'`.

---

## 🎮 Input Mapping & Sequence Management

### ⏳ `awaitInputMapping({ timeout, eventName, canMove })`

Waits for a single input event from the user and resolves with detailed input info.
Useful for input configuration screens where the user chooses a key/button to assign.

#### ⚙️ Parameters (all optional):

| Name        | Type    | Default          | Description                                              |
| ----------- | ------- | ---------------- | -------------------------------------------------------- |
| `timeout`   | number  | `10000` ms       | How long to wait before resolving with `null` (no input) |
| `eventName` | string  | `'MappingInput'` | Temporary logical event name used internally             |
| `canMove`   | boolean | `false`          | Whether to accept movement inputs like mouse move        |

#### 🔄 Returns:

A `Promise` that resolves with an object:

```ts
{
  key: string | null,       // Input identifier ("KeyW", "Button0", "LeftClick")
  source: DeviceSource | null, // Input origin: "keyboard", "mouse", "gamepad-button", "gamepad-analog"
  gp?: Gamepad              // Gamepad object if the source is a gamepad
}
```

---

### 🛠️ `mapInput(logicalName, physicalInput)`

Maps one or multiple physical inputs to a logical input name.

| Parameter       | Type                   | Description                                                     |
| --------------- | ---------------------- | --------------------------------------------------------------- |
| `logicalName`   | `string`               | Logical input identifier (e.g. "Jump")                          |
| `physicalInput` | `string` or `string[]` | Physical input(s) mapped (e.g. "Button1", \["KeyW", "ArrowUp"]) |

---

### ❌ `unmapInput(logicalName)`

Removes the mapping for the specified logical input.

| Parameter     | Type     | Description                        |
| ------------- | -------- | ---------------------------------- |
| `logicalName` | `string` | Logical input identifier to remove |

---

### 🔍 `hasMappedInput(logicalName): boolean`

Checks if a logical input name has any physical inputs mapped.

| Parameter     | Type     | Returns                                     |
| ------------- | -------- | ------------------------------------------- |
| `logicalName` | `string` | `true` if mapping exists, otherwise `false` |

---

### 📋 `getMappedInput(logicalName): string | string[]`

Gets the physical input(s) mapped to a logical input name.

| Parameter     | Type     | Returns                  |
| ------------- | -------- | ------------------------ |
| `logicalName` | `string` | Mapped physical input(s) |

---

### 🧹 `clearMapInputs()`

Clears **all** logical to physical input mappings.

---

## 🔗 Input Sequences — Logical & Physical

#### ➡️ `registerInputSequence(sequence, callback)`

Registers a sequence of logical inputs that triggers a callback when fully held.

| Parameter  | Type                    | Description                                                 |
| ---------- | ----------------------- | ----------------------------------------------------------- |
| `sequence` | `string[]`              | Ordered list of logical inputs (e.g., `['Jump', 'Action']`) |
| `callback` | `InputSequenceCallback` | Function invoked when sequence is triggered                 |

---

#### ❌ `unregisterInputSequence(sequence)`

Removes a registered logical input sequence.

---

#### 🧹 `unregisterAllInputSequences()`

Removes **all** registered logical input sequences.

---

#### 🔍 `hasInputSequence(sequence): boolean`

Checks if a logical input sequence is registered.

---

#### ➡️ `registerKeySequence(sequence, callback)`

Same as `registerInputSequence` but for **physical key** sequences.

---

#### ❌ `unregisterKeySequence(sequence)`

Unregisters a physical key sequence.

---

#### 🧹 `unregisterAllKeySequences()`

Removes all physical key sequences.

---

#### 🔍 `hasKeySequence(sequence): boolean`

Checks if a physical key sequence is registered.

---

## ⏳ Combo Logical Keys Management

#### 🔄 `renewComboMapped()`

Refreshes the timer that tracks the currently held combo logical keys.
Useful to prevent premature combo resets when keys are still being held.

---

#### ❌ `resetComboMapped()`

Resets and clears all current combo keys and combo inputs, stopping timers and resetting timestamps.

---

## 🎯 Event Listener Methods for Input Events

This section covers how to register, unregister, and manage callbacks for various input-related events.
Each event type has methods for regular (`on`), one-time (`once`), prepend, and removal of callbacks (`off`).

---

### 🔑 Mapped Key Events

#### `onMappedKeyStart(callback)`

Register callback for when a mapped key is **pressed down**.

#### `onceMappedKeyStart(callback)`

Register a one-time callback that triggers once when a mapped key is pressed.

#### `prependMappedKeyStart(callback)`

Adds a callback at the start of the callback list for mapped key start.

#### `offMappedKeyStart(callback)`

Removes a specific callback from mapped key start event.

#### `offAllMappedKeyStart()`

Removes **all** callbacks from mapped key start event.

---

#### `onMappedKeyEnd(callback)`

Register callback for when a mapped key is **released**.

#### `onceMappedKeyEnd(callback)`

One-time callback for mapped key release.

#### `prependMappedKeyEnd(callback)`

Prepends callback for mapped key release event.

#### `offMappedKeyEnd(callback)`

Removes a callback from mapped key release event.

#### `offAllMappedKeyEnd()`

Removes all callbacks from mapped key release event.

---

### 🎛️ Mapped Input Events (includes buttons, analogs, sensors, etc.)

#### `onMappedInputStart(callback)`

Triggered when any mapped input is activated (pressed or engaged).

#### `onceMappedInputStart(callback)`

One-time callback for mapped input activation.

#### `prependMappedInputStart(callback)`

Prepends callback for mapped input start.

#### `offMappedInputStart(callback)`

Removes a callback from mapped input start.

#### `offAllMappedInputStart()`

Removes all callbacks from mapped input start.

---

#### `onMappedInputEnd(callback)`

Triggered when a mapped input is deactivated (released or disengaged).

#### `onceMappedInputEnd(callback)`

One-time callback for mapped input release.

#### `prependMappedInputEnd(callback)`

Prepends callback for mapped input end.

#### `offMappedInputEnd(callback)`

Removes a callback from mapped input end.

#### `offAllMappedInputEnd()`

Removes all callbacks from mapped input end.

---

### 🧩 Logical Input Events by Name

These methods use the logical input names to manage callbacks for different stages of input:

| Event Type      | Description                                       |
| --------------- | ------------------------------------------------- |
| `onInput`       | Callback on **any** input event                   |
| `onInputStart`  | Callback when input is **pressed down**           |
| `onInputEnd`    | Callback when input is **released**               |
| `onInputHold`   | Callback when input is **held down**              |
| `onInputChange` | Callback on **value changes** (e.g. analog move)  |
| `onInputMove`   | Callback on **movement inputs** (e.g. mouse move) |

---

#### Common method patterns for logical inputs:

* `on<EventType>(logicalName, callback)`
  Register a callback for the event.

* `once<EventType>(logicalName, callback)`
  Register a one-time callback for the event.

* `prepend<EventType>(logicalName, callback)`
  Add a callback to the **start** of the callback list.

* `off<EventType>(logicalName, callback)`
  Remove a specific callback.

---

#### Example: Logical Input "Jump" pressed down event

```js
gamepad.onInputStart('Jump', callback);
gamepad.onceInputStart('Jump', callback);
gamepad.prependInputStart('Jump', callback);
gamepad.offInputStart('Jump', callback);
```

---

#### Detailed List of Methods:

| Method                                | Description                   |
| ------------------------------------- | ----------------------------- |
| `onInput(logicalName, callback)`      | On any input event            |
| `onceInput(logicalName, callback)`    | One-time on any input         |
| `prependInput(logicalName, callback)` | Prepend callback on any input |
| `offInput(logicalName, callback)`     | Remove callback on any input  |

| Method                                     | Description                    |
| ------------------------------------------ | ------------------------------ |
| `onInputStart(logicalName, callback)`      | On input pressed down          |
| `onceInputStart(logicalName, callback)`    | One-time on input pressed down |
| `prependInputStart(logicalName, callback)` | Prepend on input pressed down  |
| `offInputStart(logicalName, callback)`     | Remove on input pressed down   |

| Method                                   | Description                |
| ---------------------------------------- | -------------------------- |
| `onInputEnd(logicalName, callback)`      | On input released          |
| `onceInputEnd(logicalName, callback)`    | One-time on input released |
| `prependInputEnd(logicalName, callback)` | Prepend on input released  |
| `offInputEnd(logicalName, callback)`     | Remove on input released   |

| Method                                    | Description              |
| ----------------------------------------- | ------------------------ |
| `onInputHold(logicalName, callback)`      | While input is held down |
| `onceInputHold(logicalName, callback)`    | One-time on hold         |
| `prependInputHold(logicalName, callback)` | Prepend on hold          |
| `offInputHold(logicalName, callback)`     | Remove on hold           |

| Method                                      | Description                                 |
| ------------------------------------------- | ------------------------------------------- |
| `onInputChange(logicalName, callback)`      | On input value change (e.g., analog change) |
| `onceInputChange(logicalName, callback)`    | One-time on input change                    |
| `prependInputChange(logicalName, callback)` | Prepend on input change                     |
| `offInputChange(logicalName, callback)`     | Remove on input change                      |

| Method                                    | Description                          |
| ----------------------------------------- | ------------------------------------ |
| `onInputMove(logicalName, callback)`      | On movement input (e.g., mouse move) |
| `onceInputMove(logicalName, callback)`    | One-time on move                     |
| `prependInputMove(logicalName, callback)` | Prepend on move                      |
| `offInputMove(logicalName, callback)`     | Remove on move                       |

---

## 📋 Callback Management for Logical Inputs

These methods help you inspect and control the callbacks registered for logical inputs and their event types.

---

### 🔍 Get Registered Callbacks

#### `getCalls(logicalName, type = 'all')`

Returns a **shallow clone** of the callback list for a given logical input and event type.

* `logicalName`: Logical input name (e.g., "Jump")
* `type`: Event type filter — `'all' | 'start' | 'end' | 'hold' | 'change' | 'move'` (default: `'all'`)
* Returns an array of registered callback functions.

---

### ❌ Remove All Callbacks for an Input

#### `offAllInputs(logicalName, type = 'all')`

Removes **all callbacks** for a specific logical input and event type.

* `logicalName`: Logical input name
* `type`: Event type filter (same as `getCalls`)

---

### 🔢 Count Registered Callbacks

#### `getCallSize(logicalName, type = 'all')`

Returns the number of callbacks registered for the given logical input and event type.

---

## 🎮 Haptic Feedback (Vibration) Control

---

### ⚙️ Default Haptic Effect Settings

* Private field storing default effect type and parameters (duration, intensity, etc.)

---

### 🔍 `get defaultHapticEffect()`

Returns the current default haptic feedback effect configuration, including effect type and parameters like duration and intensity.

---

### 🔧 `setDefaultHapticEffect(type, params)`

Sets the default haptic feedback effect for gamepad vibration.

* `type`: Effect type (e.g., `'dual-rumble'`)
* `params`: Effect parameters like duration, intensity

---

### 🎵 `hasHapticEffect()`

Checks if the currently connected gamepad supports vibration feedback.

* Returns: `true` if supported, `false` otherwise.

---

### 📳 `vibrate(params?, type?)`

Triggers a vibration on the connected gamepad using either custom or default parameters.

* Returns a Promise resolved when vibration completes.

---

## 🚫 Ignoring Specific Input IDs

---

### `ignoreId(id)`

Adds an input ID to the ignored list (won’t trigger events).

### `unignoreId(id)`

Removes an input ID from the ignored list.

---

## 🔌 Gamepad Connection Events

---

### Connection Callbacks

| Method                 | Description                            |
| ---------------------- | -------------------------------------- |
| `onConnected(cb)`      | Register callback on gamepad connected |
| `onceConnected(cb)`    | One-time callback on connection        |
| `prependConnected(cb)` | Prepend callback for connection        |
| `offConnected(cb)`     | Remove callback from connection event  |
| `offAllConnected()`    | Remove **all** connection callbacks    |

---

### Disconnection Callbacks

| Method                    | Description                               |
| ------------------------- | ----------------------------------------- |
| `onDisconnected(cb)`      | Register callback on gamepad disconnected |
| `onceDisconnected(cb)`    | One-time callback on disconnection        |
| `prependDisconnected(cb)` | Prepend callback for disconnection        |
| `offDisconnected(cb)`     | Remove callback from disconnection event  |
| `offAllDisconnected()`    | Remove **all** disconnection callbacks    |

---

## 🎮 Gamepad Info and State

---

### `hasGamepad()`

Returns `true` if a gamepad is currently connected, else `false`.

---

### `getGamepad()`

Returns the connected `Gamepad` instance. Throws error if none connected.

---

### Button Last State Tracking

#### `hasLastButtonState(index)`

Checks if there is a recorded last state for button index.

#### `getLastButtonState(index)`

Returns a copy of the last known state for a button index. Throws if none recorded.

---

## ⚙️ Configuration Export & Import

---

### 💾 `exportConfig()`

Exports the current TinyGamepad settings as a plain object, ready for saving or serialization.
Includes: device filters, ignored IDs, input mappings, sensitivities, and timeouts.
**Returns:** An object snapshot of the configuration.

---

### 📥 `importConfig(json)`

Imports and applies a configuration object or JSON string to update TinyGamepad settings.

* Accepts either a JSON string or a config object.
* Validates types for each property and throws if invalid.
* Updates internal settings accordingly.

---

## 🔄 Callback Lists Getters

---

### 🔑 Mapped Key Callbacks

* `mappedKeyStartCalls` — Gets cloned list of callbacks for `"mapped-key-start"` event.
* `mappedKeyEndCalls` — Gets cloned list of callbacks for `"mapped-key-end"` event.

---

### 🔀 Combo Keys and Inputs

* `comboMappedKeys` — Clone of currently held **key combo** logical inputs.
* `comboMappedInputs` — Clone of currently held **combo logical inputs**.

---

## 📜 Input Sequence Info

---

### 🔢 Key Sequences

* `keySequenceSize` — Number of registered input sequences.
* `keySequences` — Clone array of all input sequence callbacks.

---

### 🔑 Active Mapped Keys & Inputs

* `activeMappedKeys` — Clone of currently held mapped logical keys.
* `activeMappedInputs` — Clone of currently held mapped logical inputs.

---

## 🔑 Mapped Input Callbacks

* `mappedInputStartCalls` — Cloned callbacks for `"mapped-input-start"`.
* `mappedInputEndCalls` — Cloned callbacks for `"mapped-input-end"`.

---

## 🧩 Input Sequences (Again)

* `inputSequenceSize` — Number of registered input sequences (physical/logical).
* `inputSequences` — Clone array of all input sequence callbacks.

---

## 🗺️ Logical-to-Physical Mapping Info

* `mappedInputs` — Shallow clone object of all logical → physical input mappings.
* `mappedInputSize` — Number of logical inputs currently mapped.

---

## 🔌 Connection Event Callbacks

* `connectedCalls` — Clone of callbacks for `"connected"` event.
* `disconnectedCalls` — Clone of callbacks for `"disconnected"` event.

---

## 🚫 Ignored Devices & Held Keys

* `ignoredDeviceIds` — Clone of currently ignored device IDs.
* `heldKeys` — Clone of currently held raw keys.

---

## 📊 Event Counts & Sizes

* `eventsSize` — Total number of registered callbacks (all events).
* `callSize` — Number of unique event keys (types).
* `connectedCallSize` — Number of callbacks registered for `"connected"`.
* `disconnectedCallSize` — Number of callbacks registered for `"disconnected"`.
* `mappedKeyStartCallSize` — Callbacks count for `"mapped-key-start"`.
* `mappedKeyEndCallSize` — Callbacks count for `"mapped-key-end"`.
* `mappedInputStartCallSize` — Callbacks count for `"mapped-input-start"`.
* `mappedInputEndCallSize` — Callbacks count for `"mapped-input-end"`.

---

## 🎮 Last Button and Axis States

* `lastButtonStates` — Snapshot array of button statuses from last update cycle.
* `lastAxes` — Snapshot array of axis values (thumbsticks, triggers) from last update.

---

## 🎛️ Input Modes and Event Targets

* `inputMode` — Current input mode (e.g., `'keyboard-only'`, `'gamepad-only'`, `'both'`).
* `elementBase` — DOM element or window used for event bindings.

---

## ⏰ Timestamps & Timeouts

* `timeComboInputs` — Timestamp of last mapped input combo.
* `timeComboKeys` — Timestamp of last raw key combo.
* `timeMappedInputs` — Timestamp of last mapped input activity.
* `timeoutComboKeys` — Timeout in ms before raw key combos reset (getter/setter).

---

## 🎚️ Sensitivity & Dead Zone Settings

* `axisActiveSensitivity` — Sensitivity threshold for axis movement to count as "active" input (getter/setter).
* `deadZone` — Dead zone threshold for analog inputs (getter/setter).

---

## 🆔 Device Identification

* `expectedId` — Expected device ID filter (getter/setter).

---

## 🧹 Lifecycle & Cleanup

---

### 🔒 `isDestroyed`

**Getter** that returns whether this TinyGamepad instance has been destroyed.

* **Returns:** `true` if the instance has been cleaned up and disabled; otherwise `false`.
* Use this to check if the instance is still active or has been terminated.

---

### 🗑️ `destroy()`

Cleans up and completely stops all internal input monitoring and loops.

* Cancels any ongoing animation frames or loops.
* Removes all event listeners (keyboard, mouse, gamepad) based on current input mode.
* Resets combos and clears all internal state (maps, callbacks, keys, sequences, etc).
* Marks the instance as destroyed (`isDestroyed` becomes `true`).
* After calling this, the instance should no longer be used.

---

✨ **Tip:** Always call `destroy()` when you want to cleanly remove TinyGamepad and free resources, especially before discarding the instance or when switching contexts.
