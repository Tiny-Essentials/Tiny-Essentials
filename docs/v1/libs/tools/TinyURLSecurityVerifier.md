# 🛡️ TinyURLSecurityVerifier Documentation

Welcome to the official documentation for **TinyURLSecurityVerifier**. This library is a specialized tool designed to protect your applications from malicious URL-based attacks, such as Cross-Site Scripting (XSS), phishing, and credential theft.

## 📝 Table of Contents
1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [🚀 Quick Start](#-quick-start)
4. [⚙️ Configuration](#-configuration)
5. [🛡️ Security Layers](#-security-layers)
6. [🛠️ API Reference](#-api-reference)
7. [📚 Real-World Use Cases](#-real-world-use-cases)

---

## 🔍 Overview
The `TinyURLSecurityVerifier` provides a multi-layered approach to URL validation. Instead of just checking if a string is a valid URL, it inspects the **intent** and **safety** of the link by analyzing protocols, domains, IP addresses, and embedded credentials.

---

## 🧠 Core Concepts

To use this library effectively, you must understand two primary modes of operation:

### 🚫 Blacklist Mode (Default)
In this mode, the verifier looks for "bad" things. If a URL contains a protocol or domain that you have explicitly added to your lists, it is flagged as **dangerous**.

### ✅ Whitelist Mode
In this mode, the verifier looks for "good" things. It assumes everything is dangerous **unless** it is explicitly present in your allowed lists. This is the most secure setting for high-sensitivity applications.

---

## 🚀 Quick Start

To begin using the verifier, import the class into your module:

```javascript
import TinyURLSecurityVerifier from 'tiny-essentials/libs/tools/TinyURLSecurityVerifier';

// Initialize the verifier
const verifier = new TinyURLSecurityVerifier();

// Check a URL
const urlToCheck = 'https://example.com';
if (verifier.isDangerous(urlToCheck)) {
  console.error('⚠️ Warning: This URL is potentially malicious!');
} else {
  console.log('✅ This URL is safe to use.');
}
```

---

## ⚙️ Configuration

The library offers two levels of configuration: **Static** (Global) and **Instance-based** (Local).

### 🌐 Global Configuration (Static)
Static methods affect every instance of the verifier created in your application. Use these for settings that should never change, such as a global list of dangerous protocols (e.g., `javascript:`).

*   `TinyURLSecurityVerifier.addProtocol(protocol)`: Adds a protocol to the global default list.
*   `TinyURLSecurityVerifier.set defaultProtocols(array)`: Overwrites all global default protocols.

### 🛠️ Local Configuration (Instance)
Instance methods allow you to create specific verifiers for different contexts (e.g., one verifier for "User Comments" and another for "Admin Dashboard").

*   `verifier.addProtocol(protocol)`: Adds a protocol only to this specific instance.
*   `verifier.addBlacklistedDomain(domain)`: Blocks a specific domain in this instance.
*   `verifier.isWhitelistMode = true`: Switches this specific instance to strict Whitelist mode.

---

## 🛡️ Security Layers

The `isDangerous()` method performs a comprehensive scan across these five layers:

1.  **Protocol Check 🔑**: Detects dangerous schemes like `javascript:`, `data:`, or `file:`.
2.  **Search Parameter Check 🔍**: Inspects the query strings (e.g., `?redirect=javascript:alert(1)`) to ensure no dangerous protocols are hidden inside parameters.
3.  **Credential Check 👤**: Detects if the URL contains embedded usernames or passwords (e.g., `https://user:pass@example.com`), which is a common phishing tactic.
4.  **Domain Reputation Check 🌐**: Checks the hostname against your custom Blacklists or Whitelists.
5.  **IP Address Check 📍**: Flags URLs that use raw IP addresses (IPv4 or IPv6) instead of domain names, as these are frequently used in phishing to bypass DNS filters.

---

## 🛠️ API Reference

### Class: `TinyURLSecurityVerifier`

#### `constructor()`
Creates a new instance. It automatically inherits the current global default protocols.

#### `isDangerous(href)`
**The primary method.** Performs all security checks.
*   **Returns:** `boolean` (`true` if dangerous, `false` if safe).

#### `isProtocolDangerous(href)`
Checks if the URL's protocol is in the dangerous list.
*   **Note:** Behavior changes based on `isWhitelistMode`.

#### `isSearchParamDangerous(href)`
Scans all URL parameters for hidden protocol injections.

#### `hasCredentials(href)`
Checks if the URL contains user/password information in the authority component.

#### `isIPAddress(href)`
Checks if the hostname is a raw IPv4 or IPv6 address.

#### `isBlacklisted(href)` / `isWhitelisted(href)`
Checks the domain against the instance's domain lists.

---

## 📚 Real-World Use Cases

### 1. Protecting a Comment Section (Blacklist Mode)
When allowing users to post links, you want to block known bad domains and dangerous protocols.

```javascript
const commentVerifier = new TinyURLSecurityVerifier();
commentVerifier.addBlacklistedDomain('malicious-site.com');
commentVerifier.addBlacklistedDomain('phishing-link.net');

const userLink = 'https://malicious-site.com/login';

if (commentVerifier.isDangerous(userLink)) {
  // Block the comment or flag it for moderation
  console.log("Comment blocked: Malicious link detected.");
}
```

### 2. High-Security Admin Redirects (Whitelist Mode)
In an admin panel, you might only want to allow redirects to your own domain.

```javascript
const adminVerifier = new TinyURLSecurityVerifier();
adminVerifier.isWhitelistMode = true; // Strict mode enabled
adminVerifier.addAllowedDomain('my-secure-app.com');

const redirectUrl = 'https://external-site.com/hack';

if (adminVerifier.isDangerous(redirectUrl)) {
  // Prevent the redirect to protect the admin
  console.error("Security Alert: Redirect blocked!");
}
```