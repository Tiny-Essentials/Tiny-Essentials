# 🛡️ MediaShield: Robust Media Validation Library

Welcome to **MediaShield**! This library is designed to provide security, multi-layered validation for media files (Images, Audio, and Video). 

When building modern web applications, users often upload files. A common security risk is "File Spoofing," where a malicious actor renames a dangerous script (like `.exe` or `.js`) to a harmless extension (like `.jpg`). **MediaShield** prevents this by looking *inside* the file, not just at the filename.

---

## 🚀 Core Concept: The Two-Layer Defense

MediaShield operates on a "Defense in Depth" principle. We don't just trust the file extension; we verify the actual data.

1.  **Layer 1: Magic Number Validation (The Identity Check) 🔍**
    We inspect the "Magic Numbers" (the first few bytes of a file). This tells us what the file *actually* is, regardless of its name.
2.  **Layer 2: Structural Validation (The Integrity Check) 🏗️**
    Once we know the identity, we ask the browser to attempt to decode the file. If the browser cannot read the internal structure (like height/width for images or duration for video), the file is considered corrupted or malicious.

---

## 📖 API Reference

### 1. `validateMagicNumbers`
The first line of defense. It checks the binary signature of the file.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `inputData` | `Buffer \| Uint8Array \| Blob` | The raw binary data of the file. |
| `expectedType` | `'image' \| 'audio' \| 'video'` | The category you are expecting. |
| `fileTypeFromBuffer` | `Function` | A callback function that identifies MIME types from buffers. |

**Returns:** `Promise<string>` (The confirmed MIME type).
**Throws:** `Error` if the signature doesn't match the expected category.

---

### 2. `validateImage`
Deep structural validation specifically for images.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `inputData` | `Blob` | The image file as a Blob. |

**Returns:** `Promise<ValidationResult>`
*   **On Success:** `{ mimeType, error: null, data: { width, height, format } }`
*   **On Failure:** `{ mimeType: null, error: "Error message" }`

---

### 3. `validateAudioVideo`
Deep structural validation for multimedia containers.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `inputData` | `Blob` | The media file as a Blob. |
| `mimeType` | `string` | The MIME type obtained from `validateMagicNumbers`. |

**Returns:** `Promise<ValidationResult>`
*   **On Success:** `{ mimeType, error: null, data: { duration } }`
*   **On Failure:** `{ mimeType: null, error: "Error message" }`

---

## 🛠️ Daily Workflow: How to use it

To use MediaShield in your project, you should follow this logical sequence to ensure security.

### Step-by-Step Implementation Guide

1.  **Step 1: Capture the File** 📥
    Get the file from an `<input type="file">` element.
2.  **Step 2: Run Magic Number Check** 🛡️
    Call `validateMagicNumbers`. If this fails, stop immediately. The file is a spoof.
3.  **Step 3: Perform Deep Validation** 🏗️
    Based on the result of Step 2, call either `validateImage` or `validateAudioVideo`.
4.  **Step 4: Proceed or Reject** ✅
    If both layers pass, the file is safe to upload to your server.

### 💻 Code Example

Here is how you would implement the full pipeline in a real-world scenario:

```javascript
import { validateMagicNumbers, validateImage, validateAudioVideo } from 'tiny-essentials/webTemplates/media/MediaValidator/v1/Browser';

async function handleFileUpload(fileBlob) {
  try {
    const fileDetector = async () => ({ mime: fileBlob.type });

    // --- LAYER 1: Identity Check ---
    const confirmedMime = await validateMagicNumbers({
      inputData: fileBlob,
      expectedType: 'image',
      fileTypeFromBuffer: fileDetector
    });
    console.log(`✅ Identity confirmed: ${confirmedMime}`);

    // --- LAYER 2: Structural Check ---
    const validation = await validateImage({
      inputData: fileBlob
    });

    if (validation.error) {
      throw new Error(`❌ Structural validation failed: ${validation.error}`);
    }

    console.log(`🎉 File is safe! Dimensions: ${validation.data.width}x${validation.data.height}`);
    return validation.data;

  } catch (error) {
    console.error(`🚨 Security/Validation Error: ${error.message}`);
  }
}

// Usage
const fileInput = document.querySelector('input[type="file"]');
 fileInput.addEventListener('change', (e) => handleFileUpload(e.target.files[0]));
```

---

## ⚠️ Security Notes
*   **Always** perform Layer 1 validation on the client side for immediate user feedback.
*   **Crucial:** Client-side validation is for UX and basic security. Always perform a second round of validation on your **Server/Backend** before saving files to permanent storage.
