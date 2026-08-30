# 📦 Tiny HTTP Response Registry

A robust, immutable, and internationalized registry for managing HTTP status codes. This module ensures that your application's HTTP response data (names, summaries, and descriptions) remains consistent, validated, and ready for multi-language support.

## 🌟 Overview

In large-scale applications, managing HTTP error messages manually can lead to bugs (e.g., typos in "Not Found") and difficulty when translating the app into other languages. 

`TinyHttpResponseRegistry` solves this by:
1. **Centralizing** all HTTP response data.
2. **Enforcing strict types** to prevent invalid data from entering your system.
3. **Supporting Localization (i18n)** so you can serve "Not Found" in English and "Não Encontrado" in Portuguese using the same ID.

---

## 🚀 Key Features

*   **🔒 Immutability:** Uses `structuredClone` and private fields (`#`) to ensure that once a response is registered, it cannot be accidentally changed by other parts of the program.
*   **🌍 Internationalization (i18n):** Deeply integrated with `TinyI18` to allow seamless language switching.
*   **💎 Data Integrity:** Uses a "Static Default" system to provide base responses that are shared across all instances of the registry.

---

## 📖 API Reference

### `constructor(initialResponses)`
Initializes the registry.
*   **Parameters:** `initialResponses` (Optional `HttpResponses` object).
*   **Throws:** `TypeError` if `initialResponses` is not a valid object.

### `addResponse(id, response, locale)`
Registers a new HTTP status code.
*   **Parameters:**
    *   `id` (`number`): The HTTP code (e.g., `404`).
    *   `response` (`HttpResponse`): An object containing `{ name, summary, description }`.
    *   `locale` (`string`, optional): The language for this specific entry.
*   **Throws:** 
    *   `TypeError`: If the response object is missing required properties or has wrong types.
    *   `Error`: If the ID is already registered.

### `get(id, params, locale)`
Retrieves the data for a specific code.
*   **Parameters:**
    *   `id` (`number`): The HTTP code to search for.
    *   `params` (`Object`, optional): Variables for string replacement in translations.
    *   `locale` (`string`, optional): The language to retrieve.
*   **Returns:** `HttpResponse | null` (The object containing `name`, `summary`, and `description`, or `null` if not found).

### `has(id)`
Checks if a code exists.
*   **Returns:** `boolean`.

### `getAll()`
Returns every registered response in the current instance.
*   **Returns:** `HttpResponses` object.

---

## 💡 Practical Examples

### 1. Basic Usage 🛠️
Standard setup and retrieval of a default code.

```javascript
import TinyHttpResponseRegistry from 'tiny-essentials/libs/tools/TinyHttpResponseRegistry';

const registry = new TinyHttpResponseRegistry();

// Check if 404 exists
console.log(registry.has(404)); // true

// Get data
const error404 = registry.get(404);
console.log(error404.name); // "Not Found"
```

### 2. Adding Custom Responses & Localization 🌍
How to add your own codes and support multiple languages.

```javascript
const registry = new TinyHttpResponseRegistry();

// Adding a custom error in English
registry.addResponse(501, {
  name: 'Not Implemented',
  summary: 'Service not implemented',
  description: 'The server does not support the functionality required to fulfill the request.'
}, 'en');

// Adding the same error in Portuguese
registry.addResponse(501, {
  name: 'Não Implementado',
  summary: 'Serviço não implementado',
  description: 'O servidor não suporta a funcionalidade necessária.'
}, 'pt');

// Retrieving based on locale
console.log(registry.get(501, {}, 'en').name); // "Not Implemented"
console.log(registry.get(501, {}, 'pt').name); // "Não Implementado"
```

### 3. Error Handling ⚠️
The registry is designed to fail loudly if you make a mistake, which is better than failing silently in production.

```javascript
const registry = new TinyHttpResponseRegistry();

try {
  // Error: 'summary' is missing
  registry.addResponse(418, {
    name: 'I am a teapot',
    description: 'I refuse to brew coffee'
  });
} catch (error) {
  console.error(error.message); 
  // Output: "Property 'summary' in status 418 must be a string."
}
```

---

## 🛠️ Daily Workflow Integration

When working on a project using this module, follow these steps:

1.  **Initialization:** Create a single instance of `TinyHttpResponseRegistry` at the start of your application lifecycle (e.g., in an `app.js` or `container.js` file).
2.  **Registration Phase:** During the application startup, use `addResponse` to load all your custom business-logic error codes.
3.  **Usage Phase:** In your Controllers or Middleware, use `registry.get(code)` to fetch the correct message to send back to the client.
4.  **Localization:** Always pass the user's preferred language (detected from the `Accept-Language` header) into the `.get()` method.
