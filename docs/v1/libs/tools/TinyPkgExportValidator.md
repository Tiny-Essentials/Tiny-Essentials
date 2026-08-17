# 📦 TinyPkgExportValidator

`TinyPkgExportValidator` is a specialized utility designed to ensure that the paths defined in the `"exports"` field of your `package.json` file actually exist on your file system. 

When developing Node.js packages, it is easy to misspell a path or forget to include a file in your repository. This tool automates the validation process, preventing "Module not found" errors for your end-users. 🚀

## 🔍 How it Works

The validator performs a **recursive traversal** of the `exports` object in your `package.json`. 
1. It identifies the keys (e.g., `import`, `require`, or sub-paths).
2. It follows the nested structure.
3. It resolves the final string paths relative to your project's root directory.
4. It checks if each file/directory exists using the file system.

---

## 🚀 Quick Start

To use the validator, you need to provide the absolute path to your `package.json` and the root directory of your project.

### Example Implementation

Create a script (e.g., `validate-exports.mjs`) in your project root:

```javascript
/**
 * @fileoverview Script to validate if all paths defined in the 'exports' field
 * of package.json exist physically within the project directory.
 * @version 1.0.0
 */

import { resolve } from 'path';
import { fileURLToPath } from 'url';
import TinyPkgExportValidator from 'tiny-essentials/libs/tools/TinyPkgExportValidator';

// Helper to get __dirname in ES Modules
const __dirname = resolve(process.cwd());

/**
 * Main execution function.
 */
async function main() {
  // 1. Initialize the validator
  const validator = new TinyPkgExportValidator(
    resolve(__dirname, 'package.json'), // Path to your package.json
    __dirname,                         // Your project root directory
  );

  try {
    // 2. Load the package.json data
    await validator.start();

    // 3. Run the validation
    const isValid = await validator.validate();

    // 4. Exit with error code if validation fails (useful for CI/CD)
    if (!isValid) {
      console.error('❌ Validation failed! Please check the missing paths above.');
      process.exit(1);
    }

    console.log('✅ Validation passed successfully!');
  } catch (error) {
    console.error('💥 An error occurred during validation:', error.message);
    process.exit(1);
  }
}

main();
```

---

## 🛠 API Reference

### `new TinyPkgExportValidator(packageJsonPath, rootDir)`

**Constructor**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `packageJsonPath` | `string` | The absolute path to the `package.json` file. |
| `rootDir` | `string` | The base directory used to resolve relative paths. |

**Throws:** `TypeError` if arguments are not strings.

---

### `async start()`

**Method**

Loads and parses the `package.json` file. This must be called before calling `validate()`.

* **Returns:** `Promise<void>`
* **Throws:** `TypeError` if the JSON is not an object; `Error` if the file cannot be read.

---

### `async validate()`

**Method**

The core logic. It traverses the `exports` field and checks the filesystem.

* **Returns:** `Promise<boolean>` — Returns `true` if all exported paths exist; `false` if any are missing.

---

### `get results()`

**Getter**

Returns a detailed list of the validation results.

* **Returns:** `Array<{path: string, valid: boolean, errorPath?: string}>`
    * `path`: The key context (e.g., `import -> ./dist/index.js`).
    * `valid`: `true` if the file exists, `false` otherwise.
    * `errorPath`: (Optional) The actual path that was missing.

---

## 📊 Console Output

The validator provides high-visibility feedback in your terminal using ANSI colors.

### ✅ Successful Validation
If everything is correct, you will see:
```text
=== Tiny-Essentials Export Validation ===

  [✔] import -> ./dist/main.js
  [✔] require -> ./dist/main.cjs

-----------------------------------------
SUCCESS: All exports are correctly mapped.
```

### ❌ Failed Validation
If a file is missing, the output will clearly identify the failure:
```text
=== Tiny-Essentials Export Validation ===

  [✔] import -> ./dist/main.js
  [✘] require -> ./dist/main.cjs
      Missing: ./dist/main.cjs

-----------------------------------------
FAILURE: 1 export(s) are missing or invalid.
```

## ⚠️ Error Handling

The validator handles common errors gracefully:
- **`ENOENT`**: If the `package.json` is not found.
- **`SyntaxError`**: If the `package.json` contains invalid JSON syntax.
- **Missing `exports`**: If the `exports` field is missing, it will issue a warning but return `true` (as there is nothing to validate).