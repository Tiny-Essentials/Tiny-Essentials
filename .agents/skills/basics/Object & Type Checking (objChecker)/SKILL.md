---
name: Object & Type Checking (objChecker)
description: Mandatory workflow for validating and narrowing unknown values across the entire codebase. Use this whenever you write a type guard, validate external input, or check if a value is a plain object, class instance, or class constructor. Always prefer the shared helpers from src/v1/basics/objChecker.mjs over inline typeof/instanceof/Array.isArray checks.
---

# Skill: Object & Type Checking with `objChecker`

## 1. When to use this skill

Use this skill **every time** you need to answer a question about the runtime shape of a value, for example:

- Is this a plain JSON object (`{}`) or something else?
- Is this value an instance of a class (custom or native)?
- Is this function actually a class constructor?
- How many entries does this object/array have?

This applies to **all infrastructure code**, not just `src/v1/basics/`. If you are about to write `typeof x === 'object'`, `x instanceof Object`, `Array.isArray(x)`, `Object.prototype.toString.call(x)`, or `x.constructor.name`, **stop** and use the helpers below instead.

Do **not** reimplement these checks locally. Duplicated type guards drift apart and produce inconsistent behavior across the project.

---

## 2. Where the helpers live

```
src/v1/basics/objChecker.mjs
```

Always import from the source module (or the package subpath `tiny-essentials/basics/objChecker` when consuming the published package):

```js
import {
  countObj,
  isJsonObject,
  isValidObj,
  isClass,
  isClassInstance,
  isAnyClassInstance,
} from './objChecker.mjs';
```

> Adjust the relative path so it points to `src/v1/basics/objChecker.mjs`. Inside `src/v1/basics/` the barrel file re-exports them, so `import { isJsonObject } from './index.mjs'` also works.

---

## 3. API reference

| Helper | Signature | Returns `true` when… |
| --- | --- | --- |
| `countObj` | `(obj: Array<*> \| Record<PropertyKey, any>) => number` | Always returns a count. Throws `TypeError` if not an array/pure object. |
| `isJsonObject` | `(value: unknown) => value is Record<PropertyKey, unknown>` | Value is a **plain** object (`{}`, `new Object()`, `JSON.parse` output). |
| `isValidObj` | `(value: unknown) => value is Object<PropertyKey, unknown>` | Value is a non-null object that is **not** an array (looser than `isJsonObject`). |
| `isClass` | `(target: unknown) => boolean` | Value is a `class` constructor. Throws `TypeError` if not a function. |
| `isClassInstance` | `(value: unknown) => boolean` | Value is an instance of a **custom ES6 class** (not plain objects, not `Map`/`Date`/etc.). |
| `isAnyClassInstance` | `(value: unknown) => boolean` | Value is an instance of **any** class, custom or native (`Map`, `Set`, `URL`, `Date`, …). |

---

## 4. Choosing the right helper

```
Is the value a plain JSON object?
├── yes → isJsonObject(value)
└── no
    └── Is it any non-array object?
        ├── yes → isValidObj(value)
        └── no
            └── Is it a class instance?
                ├── custom class only ....... isClassInstance(value)
                └── custom OR native class .. isAnyClassInstance(value)

Is the value a class constructor?
└── isClass(value)

How many entries does it have?
└── countObj(value)
```

---

## 5. Usage examples

### 5.1. Validating external input

```js
import { isJsonObject } from './objChecker.mjs';

/**
 * @param {unknown} payload
 */
export function parseConfig(payload) {
  if (!isJsonObject(payload)) {
    throw new TypeError('Config must be a plain JSON object.');
  }

  return payload;
}
```

### 5.2. Distinguishing plain objects from class instances

```js
import { isJsonObject, isAnyClassInstance } from './objChecker.mjs';

/**
 * @param {unknown} value
 */
function describe(value) {
  if (isJsonObject(value)) return 'plain object';
  if (isAnyClassInstance(value)) return 'class instance';
  return 'primitive or null';
}
```

### 5.3. Detecting class constructors

```js
import { isClass } from './objChecker.mjs';

/**
 * @param {unknown} target
 */
function register(target) {
  if (typeof target !== 'function') return;
  if (!isClass(target)) return; // ignore plain functions
  // `target` is a class constructor here
}
```

### 5.4. Counting entries safely

```js
import { countObj } from './objChecker.mjs';

countObj([1, 2, 3]); // 3
countObj({ a: 1, b: 2 }); // 2
countObj('nope'); // throws TypeError
```

---

## 6. Best practices

1. **Never reimplement these checks inline.** If you need a new variant, add it to `objChecker.mjs` and export it there.
2. **Prefer `isJsonObject` over `typeof x === 'object'`.** The latter is `true` for `null`, arrays, and class instances.
3. **Use `isValidObj` when arrays must be rejected but class instances are acceptable.**
4. **Use `isClassInstance` for user-defined classes** and `isAnyClassInstance` when native classes (`Map`, `Date`, `URL`, …) must also match.
5. **`isClass` throws on non-functions.** Guard with `typeof target === 'function'` first when the input is untrusted.
6. **Rely on the type predicates.** `isJsonObject` and `isValidObj` are TypeScript type guards — after the `if`, the value is narrowed automatically.
7. **Import from the source of truth.** Do not copy the implementation into other modules; import from `src/v1/basics/objChecker.mjs`.

---

## 7. Common mistakes

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `null` passes the check | Used `typeof x === 'object'` | Use `isJsonObject(x)` or `isValidObj(x)`. |
| Arrays pass the check | Used `typeof x === 'object'` | Use `isJsonObject(x)` (rejects arrays) or add `!Array.isArray(x)`. |
| `Date`/`Map` treated as plain objects | Used a loose object check | Use `isJsonObject(x)`. |
| Custom class instance not detected | Used `isJsonObject` | Use `isClassInstance(x)` or `isAnyClassInstance(x)`. |
| `isClass` throws unexpectedly | Passed a non-function | Guard with `typeof target === 'function'` first. |
| Duplicated helper logic across files | Reimplemented the check locally | Import from `objChecker.mjs` instead. |

---

## 8. Quick checklist

- [ ] Did I import the helper from `src/v1/basics/objChecker.mjs` instead of writing an inline check?
- [ ] Did I pick the strictest helper that fits (`isJsonObject` > `isValidObj` > `isAnyClassInstance`)?
- [ ] Did I handle the `TypeError` thrown by `countObj` and `isClass`?
- [ ] Did I avoid duplicating type-guard logic that already exists in `objChecker.mjs`?
