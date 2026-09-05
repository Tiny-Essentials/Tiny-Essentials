# 🛡️ Secure Media Validator

A multi-layered validation toolkit designed to ensure file integrity and prevent security exploits such as **MIME-spoofing** (where a malicious file is disguised with a fake extension).

## 📋 Overview

When handling file uploads, simply checking a file extension (like `.jpg`) is not enough. An attacker can rename a malicious script to `image.jpg`. This project implements a two-layer defense strategy:

1.  **Layer 1: Fast Binary Validation (Magic Numbers) 🔍**
    Checks the actual file header (the first few bytes) to see if the internal signature matches the expected category.
2.  **Layer 2: Deep Structural Validation 🏗️**
    Forces the system to parse the internal structure of the file (metadata/frames) to ensure the file isn't just a valid header followed by corrupted or malicious data.

---

## 📦 Dependencies

To use this toolkit, you must have the following packages installed in your project:

*   `file-type`: For magic number detection.
*   `sharp`: For deep image structural analysis.
*   `music-metadata`: For deep audio/video container parsing.

```bash
npm install file-type sharp music-metadata
```

---

## 🛠️ API Reference

### 1. Layer 1: `validateMagicNumbers` 🔍

This is your first line of defense. It is extremely fast because it only reads the beginning of the file.

**Purpose:** To verify that the file's internal "signature" matches the category you expect (image, audio, or video).

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `buffer` | `Buffer` | The raw binary data of the uploaded file. |
| `expectedType` | `'image' \| 'audio' \| 'video'` | The category you are expecting. |
| `fileTypeFromBuffer` | `Function` | The `fileTypeFromBuffer` function from the `file-type` package. |

**Returns:** `Promise<string>` (The confirmed MIME type).
**Throws:** `Error` if the signature is unknown or does not match the `expectedType`.

---

### 2. Layer 2 (Images): `validateImage` 🖼️

Once the magic numbers are confirmed, use this to inspect the image's internal structure.

**Purpose:** Uses the `sharp` engine to parse the image. This detects "Polyglot" files (files that are valid in two different formats) or files with corrupted headers designed to exploit image parsers.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `buffer` | `Buffer` | The raw image buffer. |
| `Sharp` | `SharpConstructor` | The `sharp` constructor. |

**Returns:** `Promise<ValidationResult<{ data: Sharp, metadata: SharpMetadata }>>`

---

### 3. Layer 2 (Audio/Video): `validateAudioVideo` 🎵

For media files, we need to ensure the container (like MP3 or MP4) is actually intact.

**Purpose:** Uses `music-metadata` to parse the container. It ensures the file contains valid audio/video streams and a valid duration.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `buffer` | `Buffer` | The raw media buffer. |
| `parseBuffer` | `Function` | The `parseBuffer` function from `music-metadata`. |

**Returns:** `Promise<ValidationResult<IAudioMetadata>>`

---

## 🚀 Implementation Guide: Daily Workflow

To implement this in a real-world upload service, you should follow this sequential logic. **Do not skip Layer 1**, as Layer 2 is more computationally expensive.

### 🛠️ Step-by-Step Integration

1.  **Receive the file** as a Buffer from your upload middleware (e.g., Multer).
2.  **Run `validateMagicNumbers`**: If this fails, reject the upload immediately.
3.  **Branch by Type**:
    *   If `mimeType` starts with `image/` $\rightarrow$ Call `validateImage`.
    *   If `mimeType` is `audio/` or `video/` $\rightarrow$ Call `validateAudioVideo`.
4.  **Handle the Result**: If the `error` property is present in the result, reject the upload and log the security event.

### 💻 Code Example

```javascript
import { validateMagicNumbers, validateImage } from 'tiny-essentials/webTemplates/media/MediaValidator/v1/Node';
import fileType from 'file-type';
import sharp from 'sharp';

async function handleUpload(fileBuffer, userExpectedType) {
  try {
    // STEP 1: Fast Check
    const mimeType = await validateMagicNumbers({
      buffer: fileBuffer,
      expectedType: userExpectedType,
      fileTypeFromBuffer: fileType.fileTypeFromBuffer
    });

    // STEP 2: Deep Check (if it's an image)
    if (mimeType.startsWith('image/')) {
      const result = await validateImage({
        buffer: fileBuffer,
        Sharp: sharp
      });

      if (result.error) {
        console.error("❌ Image Security Violation:", result.error);
        return { success: false, message: "Invalid image structure." };
      }

      console.log("✅ Image is safe and valid:", result.metadata.format);
      return { success: true, data: result.data };
    }

    // ... handle audio/video similarly
    
  } catch (error) {
    console.error("🚨 Security Block:", error.message);
    return { success: false, message: error.message };
  }
}
```

## ⚠️ Security Notes

*   **Error Handling:** The `ValidationResult` object is used to prevent the application from crashing during deep parsing. Always check `if (result.error)` before accessing `result.data`.
*   **Performance:** Layer 2 functions are CPU-intensive. Always run them in a worker thread or ensure your server has adequate resources if handling high volumes of uploads.
