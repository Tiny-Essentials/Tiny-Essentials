# 🛡️ TinyPasswordValidator

A lightweight, robust, and highly customizable JavaScript utility for validating password strength and security requirements. This library is designed for developers who need precise control over password policies and detailed feedback for end-users.

## 🌟 Features

* **📏 Rule-Based Validation:** Check for length, casing, numbers, and special characters.
* **📊 Strength Assessment:** Automatically classifies passwords as `strong`, `medium`, or `weak`.
* **🛠️ Custom Validator Engine:** Add your own logic (e.g., checking against "forbidden words") using the manager pattern.
* **⚠️ Strict Error Reporting:** Provides specific error messages and unique error codes for every failed rule.
* **🔒 Security Oriented:** Built-in support for asynchronous hashing functions.

---

## 🚀 Getting Started

### 1. Installation
Since this is a module, ensure your project supports ES6 modules. Import the class into your file:

```javascript
import TinyPasswordValidator from 'tiny-essentials/libs/tools/TinyPasswordValidator';
```

### 2. Basic Usage (Default Rules)
By default, the validator requires: 8-128 characters, at least one lowercase, one uppercase, one number, and one special character (`@$!%*?&`).

```javascript
const validator = new TinyPasswordValidator();

const result = validator.validate('Password123!');

console.log(result.isValid);   // true
console.log(result.strength);  // 'strong'
```

---

## ⚙️ Configuration & Customization

### 🛠️ Customizing Rules
You can define specific rules during instantiation or update them later using `setRules()`.

```javascript
// Example: A much stricter configuration
const strictValidator = new TinyPasswordValidator({
  minLength: 12,
  maxLength: 20,
  requireSpecial: true,
  requireNumbers: true
});

// Updating rules dynamically
strictValidator.setRules({
  minLength: 16,
  requireUppercase: true
});
```

### 🧩 Adding Custom Validators
The `TinyPasswordValidator` allows you to extend its logic. This is useful for complex checks like "Password cannot contain the user's name."

**Step-by-step implementation:**

1. **Define a validator object** following the `CustomValidator` structure.
2. **Use the `.add()` method** to register it.
3. **Use the `.execute()` method** to run all registered validators.

```javascript
const validator = new TinyPasswordValidator();

// 1. Define custom validator
const noCommonWordsValidator = {
  id: 'no-common-words',
  name: 'No Common Words',
  validate: (password) => {
    const forbidden = ['password', '123456', 'qwerty'];
    const isForbidden = forbidden.some(word => password.toLowerCase().includes(word));
    
    return {
      isValid: !isForbidden,
      strength: isForbidden ? 'weak' : 'strong',
      errors: isForbidden ? ['Password contains a common forbidden word.'] : [],
      errorCodes: isForbidden ? [7] : [],
      score: isForbidden ? 0 : 1,
      totalPossiblePoints: 1
    };
  }
};

// 2. Register the validator
validator.add(noCommonWordsValidator);

// 3. Execute all validators
const result = validator.execute('Password123!');
console.log(result.allPassed); // true (if 'Password123!' passes the custom check)
```

---

## 🔍 Understanding the Output

The `.validate()` method returns a `ValidationResult` object. Here is how to use it in your UI:

| Property | Type | Description |
| :--- | :--- | :--- |
| `isValid` | `boolean` | `true` if all rules are met, `false` otherwise. |
| `strength` | `string` | `'strong'`, `'medium'`, or `'weak'`. |
| `errors` | `string[]` | Array of human-readable error messages. |
| `errorCodes` | `number[]` | Array of numeric IDs for the failed rules. |
| `score` | `number` | How many requirements were successfully met. |

### 🔢 Error Code Reference
| Code | Meaning |
| :--- | :--- |
| `1` | Password is too short. |
| `2` | Password is too long. |
| `3` | Missing lowercase letter. |
| `4` | Missing uppercase letter. |
| `5` | Missing number. |
| `6` | Missing special character. |

---

## 🔐 Security & Hashing

The class includes a static `hashText` method. 

⚠️ **IMPORTANT:** By default, `hashText` is a "dummy" function that returns the plain text. **This is only for testing purposes.**

In a production environment, you **must** replace this with a real cryptographic function.

**Recommended implementation:**
```javascript
import { hashText } from 'tiny-essentials/basics/crypto';

// Replace the dummy function with a real one
TinyPasswordValidator.hashText = hashText;

// Usage
const secureHash = await TinyPasswordValidator.hashText('my-secret-password');
```

---

## 🛠️ Advanced Management

The validator acts as a manager for your custom rules. You can:

* **`reorder(oldIndex, newIndex)`**: Change the priority of custom validators.
* **`sort(comparator)`**: Sort validators using a custom comparison function.
* **`remove(id)`**: Delete a specific validator by its ID.
* **`clear()`**: Remove all custom validators.
* **`size`**: Check how many custom validators are currently registered.
