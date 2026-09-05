import { readFile } from 'fs/promises';
import { fileTypeFromBuffer } from 'file-type';
import { sharp } from 'sharp';
import { parseStream } from 'music-metadata';
import { Readable } from 'stream';
import {
  validateMagicNumbers,
  validateImage,
  validateAudioVideo,
} from '../../src/v1/webTemplates/media/MediaValidator/v1/Node/index.mjs';

/**
 * Executes the test suite for a specific file.
 * @param {string} filePath - The file path on the system.
 */
async function runRealTests(filePath) {
  try {
    const buffer = await readFile(filePath);
    console.log(`\n--- Starting Real Test: ${filePath} ---`);

    // 1. Magic Numbers Test (File Signature)
    console.log('\n[1/3] Validating Magic Numbers...');
    // Injecting the actual function from the file-type package
    const mime = await validateMagicNumbers({
      buffer,
      expectedType: 'image', // Defaulting to 'image' for this test runner
      fileTypeFromBuffer,
    });
    console.log(`✅ Success! Detected MIME: ${mime}`);

    // 2. Image Structure Test (If the file is an image)
    if (mime.startsWith('image/')) {
      console.log('\n[2/3] Validating Image Structure (Sharp)...');
      const imgResult = await validateImage({
        buffer,
        mimeType: mime,
        Sharp: sharp,
      });

      if (imgResult.error) {
        console.log(`❌ Image error: ${imgResult.error}`);
      } else {
        console.log(
          `✅ Image integrity verified. Dimensions: ${imgResult.data.metadata.width}x${imgResult.data.metadata.height}`,
        );
      }
    }

    // 3. Audio/Video Test (If the file is audio or video)
    if (mime.startsWith('audio/') || mime.startsWith('video/')) {
      console.log('\n[3/3] Validating Audio/Video Structure (music-metadata)...');
      const avResult = await validateAudioVideo({
        buffer,
        mimeType: mime,
        parseStream: parseStream,
        Readable,
      });

      if (avResult.error) {
        console.log(`❌ Audio/Video error: ${avResult.error}`);
      } else {
        console.log(
          `✅ Audio/Video integrity verified. Duration: ${avResult.data.format.duration}s`,
        );
      }
    }

    console.log('\n--- Test Completed ---');
  } catch (err) {
    console.error(`\n❌ Critical Test Error: ${err.message}`);
  }
}

// Captures the file path via command line arguments
const targetFile = process.argv[2];

if (!targetFile) {
  console.error('Error: You must provide a file path.');
  console.log('Usage: node test-runner.js <file_path>');
} else {
  runRealTests(targetFile);
}
