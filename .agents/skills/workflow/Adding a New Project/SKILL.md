---
name: Adding a New Project
description: Mandatory end-to-end checklist for integrating a brand-new class or module into Tiny Essentials. Use this whenever you add a file under src/ and need it exported, built, tested, documented and released. Covers every layout used by the repo (flat file, folder module, platform variants, subsystem, barrel) plus the build shim, package.json exports, webpack bundle, Node test-suite, browser test environment, docs and changelog.
---

# Skill: Adding a New Project to Tiny Essentials

## 1. When to use this skill

Use this skill **every time** you add a new public module to the library, no matter where it lives under `src/`.

A module is only "installed" when **every** applicable step below is done. Skipping a step produces a module that works locally but is invisible to consumers, missing from the CDN bundle, or breaks `npm run build`.

> The reference implementation is `TinyUserActivationDetector` (`git show 861f6b0d`). It is a **flat file** module — the simplest layout. Read section 2 before copying it, because most of the repo does not look like that.

---

## 2. First: which layout does your module use?

The repo does **not** have a single convention. Pick the layout that matches what you are writing, then follow the checklist in section 4.

### 2.1. Flat file (simplest)

One file, one default export.

```
src/v1/libs/utils/TinyCloner.mjs
src/v1/libs/utils/TinyUserActivationDetector.mjs
src/v1/libs/math/TinyRateLimiter.mjs
src/v1/basics/objChecker.mjs
src/v1/regexp/Glob.mjs
```

### 2.2. Folder module with a barrel

A folder whose `index.mjs` is the public entry point. Use it as soon as you have more than one file.

```
src/v1/libs/text/TinyI18/
├── index.mjs            <- public entry (default export)
├── Node.mjs             <- platform variant
├── Browser.mjs          <- platform variant
├── Browser-NON-DOM.mjs  <- platform variant
└── browser-utils.mjs    <- internal helper

src/v1/libs/fs/
├── index.mjs            <- TinyFSCore (abstract base)
├── constants.mjs
├── encoding.mjs
├── error.mjs
├── handle.mjs
├── path.mjs
├── stats.mjs
└── plugins/OPFS/
    ├── index.mjs        <- TinyOPFSFileSystem
    └── StorageBucket.mjs
```

### 2.3. Platform variants (`Node` / `Browser` / `Browser-NON-DOM`)

When the same class needs `node:fs`, `document`, or neither, keep the shared logic in `index.mjs` and export one thin subclass per runtime. The `package.json` export points at the **runtime-specific** file, not at `index.mjs`:

```json
"./libs/text/TinyI18": {
  "types": "./dist/v1/libs/text/TinyI18/Node.d.mts",
  "require": "./dist/v1/libs/text/TinyI18/Node.cjs",
  "import": "./dist/v1/libs/text/TinyI18/Node.mjs"
}
```

Real examples: `libs/text/TinyI18/`, `libs/tools/TinyHttpResponseRegistry/`.

### 2.4. Subsystem with a public sub-path

A folder that is exposed as its own import path, not as a single class:

```
libs/fs/plugins/OPFS/index.mjs  ->  tiny-essentials/libs/fs/plugins/OPFS
libs/fs/plugins/OPFS/StorageBucket.mjs -> tiny-essentials/libs/fs/plugins/OPFS/StorageBucket
```

### 2.5. Barrel / namespace module

Some folders are pure re-export surfaces and have no class of their own:

```
src/v1/basics/index.mjs     -> tiny-essentials/basics
src/v1/regexp/index.mjs     -> tiny-essentials/regexp
src/v1/fileManager/index.mjs -> tiny-essentials/fileManager
```

If you add a helper to `basics/` or `regexp/`, you **must** also add it to the matching barrel and to `src/v1/index.mjs`.

### 2.6. Non-`libs` locations

Not everything lives in `libs/`. Check the folder before assuming:

| Folder                    | Purpose                                                        |
| :------------------------ | :------------------------------------------------------------- |
| `src/v1/basics/`          | Pure helpers, no DOM, no Node APIs.                            |
| `src/v1/regexp/`          | Regex builders and validators.                                 |
| `src/v1/fileManager/`     | `fs` wrappers (`normalFuncs`, `asyncFuncs`).                   |
| `src/v1/jsdoc/`           | Types only (`EventEmitter.mjs`).                               |
| `src/v1/webTemplates/`    | Optional integrations (bootstrap, vite, ag-psd, multiformats). |
| `src/v1/libs/<category>/` | Everything else, grouped by category.                          |

---

## 3. The full checklist

```
[ ] 1. Source file(s) under src/v1/...
[ ] 2. Build shim (only when webpack needs a browser global)
[ ] 3. src/v1/index.mjs (import + export) — skip for sub-path-only modules
[ ] 4. package.json -> exports["..."]
[ ] 5. webpack.config.mjs -> addModule(...) — only for browser globals
[ ] 6. test/libs/<Name>.mjs (Node test-suite)
[ ] 7. test/index.mjs (register the test)
[ ] 8. package.json -> scripts["test:mjs:<name>"]
[ ] 9. test/html/<category>/<Name>/ (browser environment)
[ ] 10. docs/v1/<path>/<Name>.md
[ ] 11. docs/v1/README.md (documentation index)
[ ] 12. docs/v1/Exports.md (exports list)
[ ] 13. changelog/1/<minor>/<patch>.md (release note)
[ ] 14. npm run build && npm test (must be green)
```

---

## 4. Step by step

### 4.1. The source file(s)

- One public class per file, `export default`.
- Extend `TinyDebugger` (`src/v1/libs/tools/TinyDebugger.mjs`) when you need logging.
- Full JSDoc: `@typedef` for every options object, `@returns` on every method.

> [!WARNING]
> **Never put `@readonly` in the JSDoc of a getter.** `tsc` runs with `checkJs` and fails the whole build with
> `error TS1024: 'readonly' modifier can only appear on a property declaration or index signature.`
> Use `@returns {boolean}` (or the real type) instead of `@type {boolean}` + `@readonly`.

```javascript
/**
 * Whether the polling timer is currently scheduled.
 *
 * @returns {boolean}
 */
  get existsTime() {
    return !!this.#timer;
  }
```

### 4.2. The build shim (optional)

The shim is **only** needed when the module must be exposed as a browser global by webpack. It is a 3-line re-export:

```javascript
// src/v1/build/<Name>.mjs
import Name from '../libs/<category>/<Name>.mjs';

export { Name };
```

Where the shim lives depends on the module:

| Module                                | Shim                                         |
| :------------------------------------ | :------------------------------------------- |
| `libs/**` (most)                      | `src/v1/build/<Name>.mjs`                    |
| `libs/sw/service/**`                  | `src/v1/libs/sw/service/build/<Name>.mjs`    |
| `libs/worker/engine/**`               | `src/v1/libs/worker/engine/build/<Name>.mjs` |
| `libs/plugin/TinyPlugin.mjs`          | **none** — webpack points at the source      |
| `libs/storage/TinySetMapDatabase.mjs` | **none** — webpack points at the source      |

If the module has platform variants, the shim imports the **browser** one:

```javascript
// src/v1/build/TinyI18.mjs
import TinyI18 from '../libs/text/TinyI18/Browser.mjs';

export { TinyI18 };
```

### 4.3. Root barrel

`src/v1/index.mjs` — add the import next to the other `libs/` imports and the name to the `export {}` block:

```javascript
import Name from './libs/<category>/<Name>.mjs';

export {
  Name,
  // ...
};
```

Skip this step for modules that are only meant to be imported by sub-path (e.g. `libs/fs/plugins/OPFS`).

### 4.4. Package exports

`package.json` → `exports`. Keep the alphabetical/grouped placement used by the neighbours:

```json
"./libs/<category>/<Name>": {
  "types": "./dist/v1/libs/<category>/<Name>.d.mts",
  "require": "./dist/v1/libs/<category>/<Name>.cjs",
  "import": "./dist/v1/libs/<category>/<Name>.mjs"
},
```

For a folder module the path points at the folder (`index.mjs` is implied by the build), and for platform variants it points at the runtime file:

```json
"./libs/fs/plugins/OPFS": {
  "types": "./dist/v1/libs/fs/plugins/OPFS/index.d.mts",
  "require": "./dist/v1/libs/fs/plugins/OPFS/index.cjs",
  "import": "./dist/v1/libs/fs/plugins/OPFS/index.mjs"
}
```

`npm test` ends with `check-exports`, which fails when a path here does not exist after the build.

### 4.5. Webpack bundle (optional)

`webpack.config.mjs` — add one line next to the other `addModule` calls, **only if the module should be a browser global**:

```javascript
addModule(1, './src/v1/build/<Name>.mjs', '<Name>', true);
```

The last argument (`true`) marks the module as a class (`libraryExport`). This produces `dist/v1/<Name>.min.js` for `<script>` users.

Some entries point straight at the source (no shim):

```javascript
addModule(1, './src/v1/libs/plugin/TinyPlugin.mjs', 'TinyPluginPackage');
addModule(1, './src/v1/libs/storage/TinySetMapDatabase.mjs', 'TinySetMapPackage');
```

### 4.6. Node test-suite

Create `test/libs/<Name>.mjs`:

```javascript
import { TestRunner, section, color, sleep } from './_helpers.mjs';

// The test always imports from dist/, so run `npm run build` first.
const { default: Name } = await import('../../dist/v1/libs/<category>/<Name>.mjs');

const testName = async () => {
  const t = new TestRunner('<Name>');

  section('<Name> - construction', '🧪');
  t.equal(typeof Name, 'function', 'Is a class');
  // ...

  return t.summary(); // returns the number of failures
};

export default testName;
```

`TestRunner` API (`test/libs/_helpers.mjs`): `equal`, `deepEqual`, `ok`, `throws`, `throwsAsync`, `summary`. Also exported: `section`, `color`, `sleep`, `success`, `info`, `fail`.

> Tests import from `dist/`, so a stale build silently tests old code. When a test fails for no reason, rebuild first.

### 4.7. Register the test

`test/index.mjs` — two edits:

```javascript
import testName from './libs/<Name>.mjs';

new TinyPkgExportValidator('../package.json', '../').execCommandTester(
  {
    // ...
    name: testName,
  },
  process.argv,
);
```

### 4.8. npm script

`package.json` → `scripts`, next to the other `test:mjs:*` entries:

```json
"test:mjs:<name>": "node test/index.mjs <name>"
```

Run it with `npm run test:mjs:<name>`.

### 4.9. Browser test environment

```
test/html/<category>/<Name>/
├── index.html
├── app.js
└── styles.css
```

- `index.html` loads `<script type="module" src="app.js"></script>`.
- `app.js` imports from the **source** path (`/src/v1/libs/<category>/<Name>.mjs`), never from `dist/`.
- Expose the instance on `window` so the class can be poked from the console.
- Serve with `npm run dev` (port `3145`) and open `/test/html/<category>/<Name>/`.

> [!IMPORTANT]
> **If the class (or any of its imports) uses `node:events`, add an import map.**
> Browsers cannot resolve the bare `events` specifier, so extending `TinyDebugger`
> (or any `EventEmitter` subclass) throws
> `Uncaught TypeError: Failed to resolve module specifier "events"` in the browser.
> Add this to the `<head>` **before** the stylesheet:
>
> ```html
> <script type="importmap">
>   {
>     "imports": {
>       "events": "https://esm.sh/events@3.3.0"
>     }
>   }
> </script>
> ```

### 4.10. Documentation

Create `docs/v1/<same/path/as/src>/<Name>.md` with the same shape as the neighbours:

1. One-line pitch + how it works.
2. Getting started snippet.
3. Constructor options table.
4. API reference tables (static, methods, getters).
5. Practical examples.
6. Best practices / caveats.

### 4.11. Documentation index

`docs/v1/README.md` — add a bullet under the right `### 2.x. libs/<category>` heading:

```markdown
- 🖱️ **[<Name>](./libs/<category>/<Name>.md)** — One sentence describing it.
```

### 4.12. Exports list

`docs/v1/Exports.md` — add the subpath under the matching group:

```markdown
    * `libs/<category>/<Name>`
```

### 4.13. Changelog

Create the next `changelog/1/<minor>/<patch>.md` (the highest number + 1) describing the new module, with a usage snippet. Follow the tone of the existing files.

---

## 5. Verify everything

```bash
npm run build   # tsc (JSDoc types) + sass/scss + rollup + webpack
npm test        # test:mjs + test:cjs + test:js + check-exports
```

`npm run build` **must** be run before `npm test`: the Node test-suite imports from `dist/`.

Expected tail of a healthy run:

```
<Name>: PASSED (N/N checks)
SUCCESS: All exports are correctly mapped.
```

---

## 6. Common mistakes

| Symptom                                                                       | Cause                                                                      | Fix                                                                              |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `error TS1024: 'readonly' modifier can only appear on a property declaration` | `@type` + `@readonly` on a getter                                          | Use `@returns {T}` on the getter instead.                                        |
| `Cannot find module '.../dist/v1/libs/...'`                                   | Ran the test before building                                               | `npm run build` first.                                                           |
| `SUCCESS: All exports are correctly mapped` never prints / export error       | Missing `package.json` export or file not emitted                          | Add the export **and** make sure the source file is under `src/`.                |
| Class missing from the CDN bundle                                             | Forgot `webpack.config.mjs`                                                | Add the `addModule(...)` line (or point it at the source).                       |
| `Unknown argument: <name>` when running the test                              | Forgot to register it in `test/index.mjs`                                  | Add the import + the `execCommandTester` key.                                    |
| `Failed to resolve module specifier "events"` in the browser                  | Class extends `TinyDebugger`/`EventEmitter` and the page has no import map | Add the `events` import map (step 4.9).                                          |
| `TinyI18 is not a constructor` / wrong runtime                                | `package.json` export points at `index.mjs` instead of the platform file   | Point the export at `Node.mjs` / `Browser.mjs`.                                  |
| Helper added to `basics/` is `undefined`                                      | Forgot to add it to the barrel                                             | Re-export it from `src/v1/basics/index.mjs` and `src/v1/index.mjs`.              |
| Prettier check fails in CI                                                    | Formatting                                                                 | `npx prettier --write <files>` (config: `printWidth: 100`, `singleQuote: true`). |

---

## 7. Quick checklist

- [ ] Source file(s) created in the right folder (section 2).
- [ ] Class file with full JSDoc (no `@readonly` on getters).
- [ ] Build shim created — **only if** the module needs a browser global.
- [ ] `src/v1/index.mjs` imports and exports the class (unless sub-path only).
- [ ] `package.json` has the `exports` subpath (pointing at the platform file when it has variants).
- [ ] `webpack.config.mjs` has the `addModule` line (if applicable).
- [ ] `test/libs/<Name>.mjs` covers the happy path and the edge cases.
- [ ] `test/index.mjs` registers the test and `package.json` has the `test:mjs:<name>` script.
- [ ] Browser environment under `test/html/<category>/<Name>/` with the `events` import map when needed.
- [ ] `docs/v1/...` written and linked from `docs/v1/README.md` and `docs/v1/Exports.md`.
- [ ] Changelog entry created.
- [ ] `npm run build && npm test` is green.
