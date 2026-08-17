# 🍪 TinyCookieConsent

A flexible and customizable **cookie consent manager** for the web.
It displays a consent bar, lets users manage categories, and stores preferences in `localStorage`.

---

## ✨ Features

* 📊 Displays a **consent bar** with customizable text and buttons
* 🗂️ Supports **multiple categories** (required, analytics, ads, etc.)
* 💾 Stores preferences in **localStorage**
* 🔔 Provides **callbacks** when preferences are saved
* 🎨 Fully customizable with **custom renderers**
* 🎬 Smooth **animations** for showing/hiding elements

---

## 📦 Typedefs

### 🗂️ `Category`

| Property   | Type      | Description                                          |
| ---------- | --------- | ---------------------------------------------------- |
| `label`    | `string`  | Category label displayed to the user                 |
| `required` | `boolean` | If `true`, category cannot be disabled               |
| `default`  | `boolean` | Default state (`true = enabled`, `false = disabled`) |

---

### ⚙️ `Config`

| Property            | Type                                   | Description                                     |
| ------------------- | -------------------------------------- | ----------------------------------------------- |
| `message`           | `string`                               | Consent message shown in the bar                |
| `acceptText`        | `string`                               | Text for the **"Accept All"** button            |
| `rejectText`        | `string`                               | Text for the **"Reject All"** button            |
| `settingsText`      | `string`                               | Text for the **"Manage Settings"** button       |
| `categories`        | `Category[]`                           | List of cookie categories                       |
| `storageKey`        | `string`                               | Key used in `localStorage`                      |
| `onSave`            | `(preferences: Object) => void`        | Callback fired when preferences are saved       |
| `animationDuration` | `number` (default: `400`)              | Animation duration in milliseconds              |
| `renderBar`         | `((config: Config) => string) \| null` | Optional custom HTML renderer for the **bar**   |
| `renderModal`       | `((config: Config) => string) \| null` | Optional custom HTML renderer for the **modal** |

---

## 🏗️ Class: `TinyCookieConsent`

### 🔑 Constructor

```js
new TinyCookieConsent(config: Config)
```

* Creates a new cookie consent manager instance.
* Automatically loads stored preferences, or shows the consent bar if none are saved.

Throws:

* `TypeError` if `config` is not a valid object.

---

### 📖 Properties

| Property      | Type                      | Description                                        |
| ------------- | ------------------------- | -------------------------------------------------- |
| `preferences` | `Record<string, boolean>` | Returns stored preferences (or `{}` if none exist) |
| `config`      | `Config`                  | Returns the current configuration                  |

---

### 🛠️ Methods

#### 🔍 `validateConfig(config: Partial<Config>): void`

Validates a config object.
Throws `TypeError` if any field is invalid.

---

#### 🗂️ `validateCategory(cat: Category, index: number): void`

Ensures a category object is valid.
Throws if fields are missing or of the wrong type.

---

#### 💾 `loadPreferences(): Record<string, boolean> \| null`

Loads preferences from `localStorage`.
Returns `null` if no preferences are saved.

---

#### 🎬 `removeWithAnimation(el: HTMLElement): void`

Removes an element with a fade/slide animation.
Uses `config.animationDuration`.

---

#### 💾 `savePreferences(prefs: Record<string, boolean>): void`

Saves preferences to `localStorage` and fires the `onSave` callback.

---

#### 📊 `showConsentBar(): void`

Displays the initial **consent bar**.
Includes buttons:

* ✅ Accept All
* ❌ Reject All
* ⚙️ Manage Settings

---

#### ⚙️ `showSettingsModal(bar: HTMLElement): void`

Displays a modal for fine-grained category control.
Allows toggling each category, then saving preferences.

---

#### 🔎 `isAllowed(category: string): boolean`

Checks whether a given category is enabled.
Returns `false` if preferences are missing or category is not allowed.

---

## 🧩 Example Usage

```js
import TinyCookieConsent from 'tiny-essentials/libs/html/templates/TinyCookieConsent';

const consent = new TinyCookieConsent({
  message: "We use cookies to personalize your experience.",
  acceptText: "Accept All",
  rejectText: "Reject All",
  settingsText: "Cookie Settings",
  categories: [
    { label: "Essential", required: true, default: true },
    { label: "Analytics", required: false, default: false },
    { label: "Ads", required: false, default: false }
  ],
  onSave: (prefs) => console.log("Saved preferences:", prefs),
});
```
