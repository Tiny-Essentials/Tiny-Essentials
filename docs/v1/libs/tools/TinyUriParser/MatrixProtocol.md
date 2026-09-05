# 🧩 Matrix Protocol Parser Documentation

Welcome to the official documentation for the **Matrix Protocol Parser** module! 🚀

This module is a specialized tool designed to identify, parse, and reconstruct various types of Matrix-related URIs. Whether you are dealing with MXC content, Matrix scheme URIs, shorthand identifiers, or web URLs, this module provides a unified interface to handle them safely and predictably.

---

## 🌟 Overview

The primary goal of this module is to take a raw string (a URI) and convert it into a **strongly typed JavaScript object**. This object can then be used to extract specific information, such as a server domain, a user ID, or a room ID, without needing to manually write complex Regular Expressions every time.

It is built on top of `TinyUriParser` to ensure a consistent "Parse $\rightarrow$ Validate $\rightarrow$ Reconstruct" workflow.

---

## 🛠 Supported URI Formats

The module identifies and handles four distinct types of Matrix identifiers:

| Format Type | Example Input | Description |
| :--- | :--- | :--- |
| **MXC URI** | `mxc://matrix.org/abc123def` | Used for Matrix Content (media, files). |
| **Matrix Scheme** | `matrix:r/!room:server.com` | The formal protocol for Matrix resources. |
| **Shorthand** | `#room:server.com` or `@user:server.com` | The common human-readable format. |
| **Web URL** | `https://matrix.to/#/!room:server.com` | Full URLs used in web browsers. |

---

## 💎 Core Data Structures

When you parse a URI, the module returns a specific object structure. Understanding these "shapes" is crucial for your logic.

### 1. `MXCData` 📦
Used when parsing `mxc://` links.
- `dataType`: Always `'mxc'`.
- `server`: The domain (e.g., `'matrix.org'`).
- `dataId`: The unique content identifier.

### 2. `MatrixSchemeData` 🗺️
The most complex and versatile structure.
- `dataType`: Always `'matrix_scheme'`.
- `type`: The resource type (`'roomId'`, `'room'`, `'user'`, or `'event'`).
- `subType`: The specific sub-category (used when the type is an `event`).
- `resourceId`: The cleaned ID (e.g., `!room_id` becomes `room_id`).
- `server`: The Matrix server domain (can be `null`).
- `params`: A dictionary of query parameters (e.g., `{ via: 'server.com' }`).
- `eventId`: Present only if the type is `'event'`.

### 3. `MatrixWebData` 🌐
Used when parsing full browser URLs.
- `dataType`: Always `'matrix_web_url'`.
- `originalUrl`: The exact string you provided.
- `decodedFragment`: The part of the URL after the `#`.
- `parsed`: A nested `MatrixSchemeData` object containing the actual resource info.
