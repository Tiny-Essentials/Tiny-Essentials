# 📧 Email Validation Toolkit

A robust, highly configurable JavaScript utility for validating email addresses and extracting them from text using customizable Regular Expressions and strict filtering rules.

## 🌟 Overview

This toolkit is designed for developers who need more than just basic email validation. It allows you to define exactly what a "valid" email looks like for your specific application—whether you want to restrict users to a specific company domain, block certain usernames, or use custom logic.

---

## ⚙️ The Configuration Object (`EmailRegexOptions`)

The "brain" of this toolkit is the `options` object. Instead of writing complex Regex every time, you pass this object to the functions to control the behavior.

| Property | Type | Description |
| :--- | :--- | :--- |
| `validName` | `string` | The regex pattern for the part **before** the `@`. (Default: `[a-zA-Z0-9._%+-]+`) |
| `validDomain` | `string` | The regex pattern for the part **after** the `@`. (Default: `[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`) |
| `blacklistDomains` | `string[]` | List of domains that are **not** allowed (e.g., `['tempmail.com']`). |
| `whitelistDomains` | `string[]` | List of domains that are the **only** ones allowed. |
| `blacklistUsernames` | `string[]` | List of usernames that are **not** allowed (e.g., `['admin', 'root']`). |
| `whitelistUsernames` | `string[]` | List of usernames that are the **only** ones allowed. |
| `customValidator` | `Function` | A function `(email: string) => boolean` for logic that Regex cannot handle. |

---

## 🛠️ Core Functions

### 1. `isValidEmail(s, options)`
**The most common tool.** Use this to check if a single string is a valid email based on your rules.

*   **Input:** A `string` and an optional `options` object.
*   **Returns:** `boolean` (`true` if valid, `false` otherwise).
*   **Throws:** `TypeError` if the first argument is not a string.

### 2. `extractEmails(text, options)`
**The "Scraper" tool.** Use this when you have a large block of text (like a comment section or an email body) and you want to find all valid emails within it.

*   **Input:** A `string` (the text to search) and an optional `options` object.
*   **Returns:** `string[]` (An array of found emails. Returns an empty array `[]` if none are found).
*   **Throws:** `TypeError` if the input text is not a string.

---

## 🚀 Practical Daily Scenarios

Here is how you would use these tools in different professional programming scenarios.

### Scenario A: Simple Validation 🔍
*Goal: Just check if the email follows standard formatting.*

```javascript
import { isValidEmail } from 'tiny-essentials/regexp/Email';

const email = "user@example.com";

if (isValidEmail(email)) {
  console.log("✅ This is a valid email format.");
} else {
  console.log("❌ Invalid email format.");
}
```

### Scenario B: Corporate/Internal Restriction 🏢
*Goal: Only allow users from your company domain (`@company.com`).*

```javascript
import { isValidEmail } from 'tiny-essentials/regexp/Email';

const userEmail = "employee@company.com";
const guestEmail = "stranger@gmail.com";

const companyOnlyOptions = {
  whitelistDomains: ['company.com']
};

console.log(isValidEmail(userEmail, companyOnlyOptions)); // true
console.log(isValidEmail(guestEmail, companyOnlyOptions)); // false
```

### Scenario C: Preventing "Bad" Usernames & Domains 🛡️
*Goal: Block specific disposable email providers and restricted usernames.*

```javascript
import { isValidEmail } from 'tiny-essentials/regexp/Email';

const securityOptions = {
  blacklistDomains: ['spam.org', 'trashmail.net'],
  blacklistUsernames: ['admin', 'root', 'support']
};

console.log(isValidEmail("admin@example.com", securityOptions)); // false (Username is blacklisted)
console.log(isValidEmail("user@spam.org", securityOptions));      // false (Domain is blacklisted)
console.log(isValidEmail("valid.user@example.com", securityOptions)); // true
```

### Scenario D: Extracting Emails from a Log File 📑
*Goal: Pull all valid emails from a messy text block.*

```javascript
import { extractEmails } from 'tiny-essentials/regexp/Email';

const logData = "Contact us at support@company.com or sales@company.com. Do not use admin@evil.com.";

const options = {
  whitelistDomains: ['company.com']
};

const validCompanyEmails = extractEmails(logData, options);

console.log(validCompanyEmails); 
// Output: ["support@company.com", "sales@company.com"]
// Note: "admin@evil.com" was ignored because it didn't match the whitelist.
```

---

## ⚠️ Error Handling & Safety

This module is designed with **Strict Type Safety**. To prevent bugs in large applications, the functions will throw errors if you pass the wrong data types.

| Error Type | Cause |
| :--- | :--- |
| `TypeError` | You passed a `number` or `null` instead of a `string` to `isValidEmail` or `extractEmails`. |
| `TypeError` | You passed an invalid object to the `options` parameter (e.g., a `blacklistDomain` that is a string instead of an array). |

**Pro-tip:** Always wrap your calls in `try...catch` blocks if you are handling user input that might be unpredictable!
