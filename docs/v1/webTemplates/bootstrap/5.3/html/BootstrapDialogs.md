# 🚀 BootstrapDialogs Documentation

`BootstrapDialogs` is a asynchronous JavaScript utility designed to replace native browser dialogs (`alert`, `confirm`, `prompt`) with beautiful, customizable **Bootstrap 5 Modals**. 

It provides a non-blocking, Promise-based workflow and features a robust configuration system to ensure your UI remains consistent and visually appealing.

## ✨ Key Features

*   **💎 Promise-Based:** All dialogs are `async`, allowing for clean `await` syntax in your business logic.
*   **🎨 Deep Customization:** Every single part of the modal (header, body, footer, buttons, etc.) can be styled with custom CSS classes and inline styles.
*   **🛡️ Security Focused:** Uses strict DOM manipulation to prevent XSS attacks.
*   **⏳ Loading State:** Includes a built-in, non-dismissible global loading overlay for background tasks.
*   **🧹 Automatic Cleanup:** Automatically manages DOM elements and body classes (`modal-open`) to prevent memory leaks or broken scrolling.

---

## 🛠️ Setup

To use this library, you must have **Bootstrap 5** (JavaScript and CSS) included in your project. You must also initialize the library with the Bootstrap Modal class.

```javascript
import { BootstrapDialogs } from './BootstrapDialogs.js';
import { Modal } from 'bootstrap';

// 1. Initialize the Modal class
BootstrapDialogs.Modal = Modal;
```

---

## ⚙️ Configuration

### 1. Global Defaults
You can set a global configuration that applies to all dialogs created by the library.

```javascript
BootstrapDialogs.defaultConfig = {
  modalConfig: { className: 'my-custom-modal', styles: { 'border': '2px solid blue' } },
  confirmBtnConfig: { className: 'btn-success' },
  // ... other config keys
};
```

### 2. Data Types (JSDoc Reference)

#### `CustomElementConfig` 🎨
Used to customize specific parts of the modal.
| Property | Type | Description |
| :--- | :--- | :--- |
| `className` | `string \| string[]` | CSS classes to add to the element. |
| `styles` | `Object<string, string>` | CSS properties and values (e.g., `{ 'color': 'red' }`). |

#### `ModalOptions` 📋
Configuration options for individual dialog calls.
| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `title` | `string` | `'Alert'` | Text for the modal header. |
| `confirmText` | `string` | `'OK'` | Text for the primary button. |
| `cancelText` | `string` | `'Cancel'` | Text for the secondary button. |
| `defaultValue` | `string` | `''` | Initial value for prompt inputs. |
| `modalConfig` | `CustomElementConfig` | `{}` | Customization for the main container. |
| `headerConfig` | `CustomElementConfig` | `{}` | Customization for the header. |
| `titleConfig` | `CustomElementConfig` | `{}` | Customization for the title. |
| `closeBtnConfig` | `CustomElementConfig` | `{}` | Customization for the close button. |
| `bodyConfig` | `CustomElementConfig` | `{}` | Customization for the body. |
| `footerConfig` | `CustomElementConfig` | `{}` | Customization for the footer. |
| `confirmBtnConfig`| `CustomElementConfig` | `{}` | Customization for the confirm button. |
| `cancelBtnConfig` | `CustomElementConfig` | `{}` | Customization for the cancel button. |
| `contentConfig` | `CustomElementConfig` | `{}` | Customization for the content wrapper. |
| `dialogConfig` | `CustomElementConfig` | `{}` | Customization for the dialog wrapper. |

---

## 🚀 API Reference

### 📢 `alert(message, options)`
Displays a simple informational modal.
*   **Returns:** `Promise<void>`
*   **Usage:** `await alert('Operation successful!');`

### ❓ `confirm(message, options)`
Displays a confirmation modal with "Yes" and "No" options.
*   **Returns:** `Promise<boolean>` (Resolves `true` if confirmed, `false` if cancelled).
*   **Usage:** 
    ```javascript
    const isDeleted = await confirm('Are you sure you want to delete this?');
    ```

### ⌨️ `prompt(message, defaultValue, options)`
Displays a modal with a text input field.
*   **Returns:** `Promise<string | null>` (Resolves with the input value, or `null` if cancelled).
*   **Usage:**
    ```javascript
    const name = await prompt('Enter your name', 'Guest');
    ```

### ⏳ `showLoading(message)`
Displays a global, non-dismissible loading spinner.
*   **Returns:** `void`
*   **Usage:** `showLoading('Fetching data...');`

### ✅ `hideLoading()`
Removes the loading overlay.
*   **Returns:** `void`
*   **Usage:** `hideLoading();`

---

## 💡 Usage Example

```javascript
import { confirm, prompt, showLoading, hideLoading } from './BootstrapDialogs.js';

async function handleDeleteUser(userId) {
  // 1. Show loading state
  showLoading('Processing request...');

  try {
    // 2. Ask for confirmation
    const confirmed = await confirm('Do you really want to delete this user?', {
      title: '⚠️ Warning',
      confirmText: 'Delete Forever',
      cancelText: 'Keep User',
      confirmBtnConfig: { className: 'btn-danger' }
    });

    if (confirmed) {
      // 3. Simulate API Call
      await new Promise(res => setTimeout(res, 2000));
      console.log(`User ${userId} deleted.`);
    }
  } catch (error) {
    console.error(error);
  } finally {
    // 4. Hide loading
    hideLoading();
  }
}
```
