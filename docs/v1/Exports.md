# 📦 Package Exports Map

This package provides multiple entry points depending on what you need.
You can `import` (ESM) or `require` (CommonJS) each module individually.

---

## 🎨 CSS Assets

These are pre-built stylesheets that can be directly imported:

* `css/aiMarker.min.css` → `dist/v1/css/aiMarker.min.css`
* `css/TinyCookieConsent.min.css` → `dist/v1/css/TinyCookieConsent.min.css`
* `css/TinyDraggerExample.min.css` → `dist/v1/css/TinyDraggerExample.min.css`
* `css/TinyNotify.min.css` → `dist/v1/css/TinyNotify.min.css`
* `css/TinyLoadingScreen.min.css` → `dist/v1/css/TinyLoadingScreen.min.css`

✅ Usage example:

```js
import "tiny-essentials/css/TinyNotify.min.css";
```

---

## 🏠 Root Entrypoints

* `.` → main entry

  * `"require"` → `dist/v1/index.cjs`
  * `"import"` → `dist/v1/index.mjs`

* `libs` → all library helpers

  * `"require"` → `dist/v1/libs/index.cjs`
  * `"import"` → `dist/v1/libs/index.mjs`

* `basics` → general utility functions

  * `"require"` → `dist/v1/basics/index.cjs`
  * `"import"` → `dist/v1/basics/index.mjs`

* `fileManager` → file utilities

  * `"require"` → `dist/v1/fileManager/index.cjs`
  * `"import"` → `dist/v1/fileManager/index.mjs`

---

## 🔧 Basics Modules

Direct access to smaller utilities:

* `basics/array`
* `basics/clock`
* `basics/collision`
* `basics/fullScreen`
* `basics/html`
* `basics/objChecker`
* `basics/objFilter`
* `basics/simpleMath`
* `basics/text`

Direct access to file utilities:

* `fileManager/async`
* `fileManager/normal`

---

## 📚 Libs Modules

Each library can be imported separately:

* **General Tools** 🛠

  * `libs/ColorSafeStringify`
  * `libs/UltraRandomMsgGen`
  * `libs/TinyUploadClicker`
  * `libs/TinyToastNotify`
  * `libs/TinyTimeout`
  * `libs/TinyTextRangeEditor`
  * `libs/TinyTextarea`
  * `libs/TinySmartScroller`
  * `libs/TinySimpleDice`
  * `libs/TinyRateLimiter`
  * `libs/TinyPromiseQueue`
  * `libs/TinyNotifyCenter`
  * `libs/TinyNotifications`
  * `libs/TinyNewWinEvents`
  * `libs/TinyNeedBar`
  * `libs/TinyLocalStorage`
  * `libs/TinyLoadingScreen`
  * `libs/TinyColorValidator`
  * `libs/TinyInventoryTrader`
  * `libs/TinyInventory`
  * `libs/TinyIframeEvents`
  * `libs/TinyI18`
  * `libs/TinyLevelUp`
  * `libs/TinyGamepad`
  * `libs/TinyElementObserver`
  * `libs/TinyDragger`
  * `libs/TinyDragDropDetector`
  * `libs/TinyDomReadyManager`
  * `libs/TinyDayNightCycle`
  * `libs/TinyCookieConsent`
  * `libs/TinyColorConverter`
  * `libs/TinyClipboard`
  * `libs/TinyArrayPaginator`
  * `libs/TinyAfterScrollWatcher`
  * `libs/TinyAdvancedRaffle`

* **HTML Helpers** 🧩

  * `libs/TinyHtml`
  * `libs/TinyHtmlElems` (BETA)

  * **General Elements (BETA)**

    * `libs/TinyHtmlElems/Anchor`
    * `libs/TinyHtmlElems/Button`
    * `libs/TinyHtmlElems/Canvas`
    * `libs/TinyHtmlElems/Datalist`
    * `libs/TinyHtmlElems/Form`
    * `libs/TinyHtmlElems/Embed`
    * `libs/TinyHtmlElems/Icon`
    * `libs/TinyHtmlElems/Iframe`
    * `libs/TinyHtmlElems/Image`
    * `libs/TinyHtmlElems/Link`
    * `libs/TinyHtmlElems/Script`
    * `libs/TinyHtmlElems/Select`
    * `libs/TinyHtmlElems/Style`
    * `libs/TinyHtmlElems/Template`
    * `libs/TinyHtmlElems/Textarea`

  * **Media Elements (BETA)** 🎬

    * `libs/TinyHtmlElems/Media`
    * `libs/TinyHtmlElems/Media/Audio`
    * `libs/TinyHtmlElems/Media/Object`
    * `libs/TinyHtmlElems/Media/Source`
    * `libs/TinyHtmlElems/Media/Video`

  * **Input Elements (BETA)** ⌨️

    * `libs/TinyHtmlElems/Input`

    * **Button Inputs (BETA)**

      * `libs/TinyHtmlElems/Input/Button`
      * `libs/TinyHtmlElems/Input/Reset`
      * `libs/TinyHtmlElems/Input/Submit`

    * **Check Inputs (BETA)**

      * `libs/TinyHtmlElems/Input/Checkbox`
      * `libs/TinyHtmlElems/Input/Radio`

    * **Color & File Inputs (BETA)**

      * `libs/TinyHtmlElems/Input/Color`
      * `libs/TinyHtmlElems/Input/File`
      * `libs/TinyHtmlElems/Input/Hidden`
      * `libs/TinyHtmlElems/Input/Image`

    * **Date & Time Inputs (BETA)** 🕒

      * `libs/TinyHtmlElems/Input/Date`
      * `libs/TinyHtmlElems/Input/DateTime`
      * `libs/TinyHtmlElems/Input/Month`
      * `libs/TinyHtmlElems/Input/Time`
      * `libs/TinyHtmlElems/Input/Week`

    * **Number Inputs (BETA)** 🔢

      * `libs/TinyHtmlElems/Input/Number`
      * `libs/TinyHtmlElems/Input/Range`

    * **Text Inputs (BETA)** ✏️

      * `libs/TinyHtmlElems/Input/Email`
      * `libs/TinyHtmlElems/Input/Password`
      * `libs/TinyHtmlElems/Input/Search`
      * `libs/TinyHtmlElems/Input/Tel`
      * `libs/TinyHtmlElems/Input/Text`
      * `libs/TinyHtmlElems/Input/Url`

---

## ✅ Import Examples

**ESM (modern projects)**

```js
import { TinyTextarea } from "tiny-essentials/libs/TinyTextarea";
```

**CommonJS (Node.js)**

```js
const { TinyTextarea } = require("tiny-essentials/libs/TinyTextarea");
```
