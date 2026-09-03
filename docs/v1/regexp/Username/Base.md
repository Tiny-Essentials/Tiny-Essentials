# 🛠️ Username Regex Utility

A robust, highly configurable JavaScript utility designed to generate regular expressions for **validating**, **finding**, and **extracting** usernames from text. This tool supports complex rules like specific prefixes, domains, length constraints, and automated text transformations.

## 🚀 Key Features

*   **🎯 Precision Matching:** Create highly specific patterns (e.g., `@user`, `#123`, or `user@domain.com`).
*   **🛡️ Type Safety:** Built-in runtime validation to catch configuration errors immediately.
*   **🔄 Automatic Transformation:** Automatically convert extracted usernames to `lowercase`, `uppercase`, or a custom function result.
*   **🔍 Multi-Pattern Support:** Pass an array of configurations to match multiple different username formats in a single pass.
*   **📄 Smart Boundaries:** Intelligent handling of word boundaries to prevent "false positives" when usernames start or end with special characters (like `@`).

---

## ⚙️ Configuration Guide

The core of this utility is the `UsernameRegexOptions` object. This object defines exactly what a "valid username" looks like for your specific project.

### `UsernameRegexOptions` Properties

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `validValues` | `string` | `'[a-zA-Z0-9_]'` | A regex character class defining allowed characters. |
| `length` | `[number, number]` | `[3, 20]` | An array representing `[min_length, max_length]`. |
| `start` | `string` | `""` | A regex pattern required at the **start** of the username. |
| `end` | `string` | `""` | A regex pattern required at the **end** of the username. |
| `prefix` | `string` | `""` | A literal string prefix (e.g., `@` or `#`). |
| `domain` | `string` | `undefined` | A literal domain (e.g., `@gmail.com`). Escaped automatically. |
| `domainPattern` | `string` | `undefined` | A regex pattern for the domain (e.g., `@[a-z]+\.com`). |
| `transform` | `UsernameTransform` | `null` | `'lowercase'`, `'uppercase'`, or a custom function. |

---

## 📖 API Reference

### 1. `isValidUsername(string, options)`
**Use case:** Form validation. Use this to check if a user's input in a text field is valid.

*   **Returns:** `boolean`
*   **Throws:** `TypeError` if the first argument is not a string.

```javascript
// Example: Validating a simple username
const isOk = isValidUsername('Yasmin_99', { length: [3, 10] }); 
console.log(isOk); // true
```

### 2. `extractUsernames(text, options)`
**Use case:** Data scraping or parsing. Use this to pull all usernames out of a large block of text.

*   **Returns:** `string[]` (An array of matched usernames).
*   **Note:** If you provide an array of options, the transformation from the *first* option will be applied to all matches.

```javascript
const text = "Contact @Admin or @Moderator_1";
const users = extractUsernames(text, { 
  prefix: '@', 
  transform: 'lowercase' 
});
console.log(users); // ['@admin', '@moderator_1']
```

### 3. `findUsernameRegex(options)`
**Use case:** Advanced regex creation. Generates a global (`/g`) regular expression for use with `.match()` or `.replace()`.

*   **Returns:** `RegExp`

### 4. `usernameRegex(options)`
**Use case:** Strict matching. Generates a regex that matches the **entire** string from start to finish (`^...$`).

*   **Returns:** `RegExp`

---

## 🛠️ Real-World Workflow Examples

### Scenario A: Social Media Style (The "@" Prefix)
You are building a chat app where users are mentioned using `@username`.

```javascript
const socialOptions = {
  prefix: '@',
  length: [3, 15],
  validValues: '[a-zA-Z0-9_]'
};

// Extracting mentions from a chat message
const message = "Hello @yasmin, welcome to the group @dev_user!";
const mentions = extractUsernames(message, socialOptions);
// Result: ["@yasmin", "@dev_user"]
```

### Scenario B: Matrix/Identity Style (Domain required)
You need to find users on a specific Matrix server.

```javascript
const matrixOptions = {
  prefix: '@',
  domain: '@matrix.org',
  length: [3, 20]
};

const text = "Check in with @alice@matrix.org and @bob@matrix.org";
const users = extractUsernames(text, matrixOptions);
// Result: ["@alice@matrix.org", "@bob@matrix.org"]
```

### Scenario C: Multi-Format Parsing (Complex)
Your system supports both `#hashtag` style and `@username` style.

```javascript
const multiOptions = [
  { prefix: '@', length: [3, 10] },
  { prefix: '#', length: [3, 15] }
];

const text = "Follow @user and use #coding";
const matches = extractUsernames(text, multiOptions);
// Result: ["@user", "#coding"]
```

---

## ⚠️ Error Handling

This library is designed to be "fail-fast." If you pass incorrect types, it will throw specific errors to help you debug immediately:

*   **`TypeError`**: Thrown if you pass a number where a string is expected, or if an object property is missing its required type.
*   **`RangeError`**: Thrown if your `length` array has a minimum value greater than the maximum (e.g., `[20, 5]`) or if lengths are negative.
