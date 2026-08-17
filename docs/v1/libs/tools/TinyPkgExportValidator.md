# 📦 TinyPkgExportValidator

`TinyPkgExportValidator` is a specialized utility designed to ensure that the paths defined in the `"exports"` field of your `package.json` file actually exist on your file system. 

When developing Node.js packages, it is easy to misspell a path or forget to include a file in your repository. This tool automates the validation process, preventing "Module not found" errors for your end-users. 🚀

## ✨ Key Features

* **🔍 Automatic Traversal:** Recursively checks all nested paths in the `exports` object.
* **🎨 Custom Reporting:** Completely redefine the terminal output using custom message templates.
* **🤫 Silent Mode:** Suppress all console logs for clean integration into build scripts.
* **🛠 Strict Validation:** High reliability through rigorous type checking and error handling.

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

### Advanced Usage (Customization)

You can pass an `options` object to the constructor to personalize the validator.

```javascript
import { resolve } from 'path';
import TinyPkgExportValidator from 'tiny-essentials/libs/tools/TinyPkgExportValidator';

async function main() {
  const validator = new TinyPkgExportValidator(
    resolve(process.cwd(), 'package.json'),
    process.cwd(),
    {
      projectName: 'My Awesome Library',
      silent: false,
      messages: {
        header: `\n🚀 STARTING VALIDATION FOR: {projectName} 🚀\n`,
        successHeader: `✨ Perfect! Everything is in place. ✨`,
      }
    }
  );

  await validator.start();
  await validator.validate();
}

main();
```

---

## 🛠 API Reference

### `new TinyPkgExportValidator(packageJsonPath, rootDir, options)`

**Constructor**

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `packageJsonPath` | `string` | Yes | Absolute path to your `package.json`. |
| `rootDir` | `string` | Yes | The project root directory. |
| `options` | `Object` | No | Configuration for customization. |

#### `options` Object Properties

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `projectName` | `string` | `'Tiny-Essentials Export Validation'` | The name displayed in the report header. |
| `silent` | `boolean` | `false` | If `true`, no console output is generated. |
| `messages` | `Object` | `DEFAULT_MESSAGES` | Custom template strings for the report. |

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

### 📝 Customizing Messages (Templates)

The `messages` option allows you to override the default output. You can use **placeholders** within your strings to inject dynamic data at runtime.

#### Available Placeholders:
* `{projectName}`: The name provided in `options.projectName`.
* `{path}`: The key path being validated (e.g., `import -> ./dist/index.js`).
* `{errorPath}`: The actual missing file path.
* `{errorCount}`: The total number of failed exports.
* `{message}`: The specific error message (used in unexpected errors).

#### Message Keys to Override:
To ensure a valid custom message object, you must provide all the following keys:

| Key | Description |
| :--- | :--- |
| `header` | The top of the report. |
| `divider` | The line separating the report parts. |
| `itemValid` | Message for a successful check. |
| `itemInvalid` | Message for a failed check. |
| `itemMissing` | Message showing the missing path. |
| `successHeader` | Final message on total success. |
| `failureHeader` | Final message on failure. |
| `errorLoad` | Error if `package.json` isn't loaded. |
| `noExports` | Warning if `"exports"` field is missing. |
| `errorNotFound` | Error if `package.json` file is missing. |
| `errorParse` | Error if `package.json` is invalid JSON. |
| `errorUnexpected`| Error for any other runtime exception. |


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

The validator provides specific feedback for common issues:
1. **`errorLoad`**: Attempted to validate before calling `.start()`.
2. **`noExports`**: The `package.json` exists, but the `"exports"` field is missing.
3. **`errorNotFound`**: The file at `packageJsonPath` does not exist.
4. **`errorParse`**: The `package.json` file contains syntax errors.
5. **`errorUnexpected`**: Any other error (e.g., permission issues).
