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

  * `libs/color/ColorSafeStringify`
  * `libs/utils/UltraRandomMsgGen`
  * `libs/html/upload/TinyUploadClicker`
  * `libs/html/notification/TinyToastNotify`
  * `libs/math/TinyTimeout`
  * `libs/text/TinyTextRangeEditor`
  * `libs/text/TinyTextarea`
  * `libs/html/scroll/TinySmartScroller`
  * `libs/math/TinySimpleDice`
  * `libs/math/TinyRateLimiter`
  * `libs/utils/TinyPromiseQueue`
  * `libs/html/notification/TinyNotifyCenter`
  * `libs/html/notification/TinyNotifications`
  * `libs/html/events/TinyNewWinEvents`
  * `libs/game/TinyNeedBar`
  * `libs/storage/TinyLocalStorage`
  * `libs/html/templates/TinyLoadingScreen`
  * `libs/color/TinyColorValidator`
  * `libs/game/TinyInventoryTrader`
  * `libs/game/TinyInventory`
  * `libs/html/events/TinyIframeEvents`
  * `libs/text/TinyI18`
  * `libs/game/TinyLevelUp`
  * `libs/game/TinyGamepad`
  * `libs/html/TinyElementObserver`
  * `libs/html/drag/TinyDragger`
  * `libs/html/drag/TinyDragDropDetector`
  * `libs/html/TinyDomReadyManager`
  * `libs/game/TinyDayNightCycle`
  * `libs/html/templates/TinyCookieConsent`
  * `libs/color/TinyColorConverter`
  * `libs/text/TinyClipboard`
  * `libs/array/TinyArrayPaginator`
  * `libs/html/scroll/TinyAfterScrollWatcher`
  * `libs/math/TinyAdvancedRaffle`

* **HTML Helpers** 🧩

  * `libs/html/TinyHtml`
  * `libs/html/TinyHtmlElems` (BETA)

  * **General Elements (BETA)**

    * `libs/html/TinyHtmlElems/Anchor`
    * `libs/html/TinyHtmlElems/Button`
    * `libs/html/TinyHtmlElems/Canvas`
    * `libs/html/TinyHtmlElems/Datalist`
    * `libs/html/TinyHtmlElems/Form`
    * `libs/html/TinyHtmlElems/Embed`
    * `libs/html/TinyHtmlElems/Icon`
    * `libs/html/TinyHtmlElems/Iframe`
    * `libs/html/TinyHtmlElems/Image`
    * `libs/html/TinyHtmlElems/Link`
    * `libs/html/TinyHtmlElems/Script`
    * `libs/html/TinyHtmlElems/Select`
    * `libs/html/TinyHtmlElems/Style`
    * `libs/html/TinyHtmlElems/Template`
    * `libs/html/TinyHtmlElems/Textarea`

  * **Media Elements (BETA)** 🎬

    * `libs/html/TinyHtmlElems/Media`
    * `libs/html/TinyHtmlElems/Media/Audio`
    * `libs/html/TinyHtmlElems/Media/Object`
    * `libs/html/TinyHtmlElems/Media/Source`
    * `libs/html/TinyHtmlElems/Media/Video`

  * **Input Elements (BETA)** ⌨️

    * `libs/html/TinyHtmlElems/Input`

    * **Button Inputs (BETA)**

      * `libs/html/TinyHtmlElems/Input/Button`
      * `libs/html/TinyHtmlElems/Input/Reset`
      * `libs/html/TinyHtmlElems/Input/Submit`

    * **Check Inputs (BETA)**

      * `libs/html/TinyHtmlElems/Input/Checkbox`
      * `libs/html/TinyHtmlElems/Input/Radio`

    * **Color & File Inputs (BETA)**

      * `libs/html/TinyHtmlElems/Input/Color`
      * `libs/html/TinyHtmlElems/Input/File`
      * `libs/html/TinyHtmlElems/Input/Hidden`
      * `libs/html/TinyHtmlElems/Input/Image`

    * **Date & Time Inputs (BETA)** 🕒

      * `libs/html/TinyHtmlElems/Input/Date`
      * `libs/html/TinyHtmlElems/Input/DateTime`
      * `libs/html/TinyHtmlElems/Input/Month`
      * `libs/html/TinyHtmlElems/Input/Time`
      * `libs/html/TinyHtmlElems/Input/Week`

    * **Number Inputs (BETA)** 🔢

      * `libs/html/TinyHtmlElems/Input/Number`
      * `libs/html/TinyHtmlElems/Input/Range`

    * **Text Inputs (BETA)** ✏️

      * `libs/html/TinyHtmlElems/Input/Email`
      * `libs/html/TinyHtmlElems/Input/Password`
      * `libs/html/TinyHtmlElems/Input/Search`
      * `libs/html/TinyHtmlElems/Input/Tel`
      * `libs/html/TinyHtmlElems/Input/Text`
      * `libs/html/TinyHtmlElems/Input/Url`

---

## ✅ Import Examples

**ESM (modern projects)**

```js
import { TinyTextarea } from "tiny-essentials/libs/text/TinyTextarea";
```

**CommonJS (Node.js)**

```js
const { TinyTextarea } = require("tiny-essentials/libs/text/TinyTextarea");
```
