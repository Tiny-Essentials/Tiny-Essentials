import { readFile } from 'fs/promises';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import { parseStream, parseBuffer } from 'music-metadata';
import { Readable } from 'stream';
import {
  validateMagicNumbers,
  validateImage,
  validateAudioVideo,
} from '../../src/v1/webTemplates/media/MediaValidator/v1/Node/index.mjs';

/**
 * Executes the test suite for a specific file.
 * @param {string} filePath - The file path on the system.
 * @param {'image' | 'audio' | 'video'} options.expectedType - The expected media category.
 * @param {boolean}  streamMode - Stream mode
 */
async function runRealTests(filePath, expectedType, streamMode) {
  try {
    const buffer = await readFile(filePath);
    console.log(`\n--- Starting Real Test: ${filePath} ---`);

    // 1. Magic Numbers Test (File Signature)
    console.log('\n[1/2] Validating Magic Numbers...');
    // Injecting the actual function from the file-type package
    const mime = await validateMagicNumbers({
      buffer,
      expectedType,
      fileTypeFromBuffer,
    });
    console.log(`✅ Success! Detected MIME: ${mime}`);

    // 2. Image Structure Test (If the file is an image)
    if (mime.startsWith('image/')) {
      console.log('\n[2/2] Validating Image Structure (Sharp)...');
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
      console.log('\n[2/2] Validating Audio/Video Structure (music-metadata)...');
      const avResult = await validateAudioVideo({
        buffer,
        mimeType: mime,
        parseBuffer: parseBuffer,
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
const targetFile = process.argv[3];
const expectedType = process.argv[2];
const streamMode = process.argv[4];

if (!targetFile || !expectedType) {
  if (!expectedType) console.error('Error: You must provide a file path.');
  else if (!expectedType) console.error('Error: You must provide a file type.');
  console.log('Usage: test:mediavalidator <audio|video|image> <file_path> <stream>?');
} else {
  runRealTests(targetFile, expectedType, streamMode === 'stream');
}
