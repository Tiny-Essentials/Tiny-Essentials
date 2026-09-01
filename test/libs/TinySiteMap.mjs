import assert from 'node:assert';
import { Writable } from 'node:stream';
import TinySiteMap from '../../dist/v1/libs/tools/TinySiteMap.mjs';
import TinySiteMapStream from '../../dist/v1/libs/tools/TinySiteMapStream.mjs';

/**
 * Helper function to capture stream output into a single string.
 * @param {import('node:stream').Readable} stream
 * @returns {Promise<string>}
 */
const captureStreamOutput = (stream) => {
  return new Promise((resolve, reject) => {
    let output = '';
    const writable = new Writable({
      write(chunk, encoding, callback) {
        output += chunk.toString();
        callback();
      },
    });

    stream.pipe(writable);
    stream.on('error', reject);
    writable.on('finish', () => resolve(output));
  });
};

/**
 * Complete professional test suite for TinySiteMap and TinySiteMapStream.
 */
const testTinySiteMap = async () => {
  console.log('Starting Complete Professional Test Suite...\n');

  try {
    // ========================================================================
    // TEST 1: TinySiteMap - Normal Generation & XML Escaping
    // ========================================================================
    console.log('Running Test 1: In-Memory Normal Sitemap & Escaping...');

    const memSitemap = new TinySiteMap({
      baseUrl: 'https://exemple.com',
      type: 'normal',
      namespaceStrategy: TinySiteMap.protocolStrategy,
    });

    memSitemap.addEntry({
      loc: '/path-with-&s-and-<tags>', // Testing XML injection defense
      priority: 0.9,
      customTags: {
        'example:metadata': 'Strictly confidential & private',
      },
    });

    const memXml = memSitemap.generateXml();

    // Assertions
    assert.ok(
      memXml.includes('xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"'),
      'Missing XSI namespace',
    );
    assert.ok(
      memXml.includes('xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9'),
      'Missing schemaLocation attribute',
    );
    assert.ok(
      memXml.includes('<loc>https://exemple.com/path-with-&amp;s-and-%3Ctags%3E</loc>'),
      'XML escaping failed on URL',
    );
    assert.ok(
      memXml.includes('<example:metadata>Strictly confidential &amp; private</example:metadata>'),
      'XML escaping failed on custom tags',
    );

    console.log('-> Test 1 Passed!\n');

    // ========================================================================
    // TEST 2: TinySiteMap - Index Strict Mode
    // ========================================================================
    console.log('Running Test 2: Index Mode Strict Validation...');

    const indexSitemap = new TinySiteMap({
      baseUrl: 'https://exemple.com',
      type: 'index',
    });

    // Should throw if we try to add priority to an index entry
    assert.throws(
      () => {
        indexSitemap.addEntry({
          loc: '/sitemap-1.xml',
          priority: 1.0, // Invalid for index
        });
      },
      TypeError,
      'Index sitemap allowed forbidden properties',
    );

    console.log('-> Test 2 Passed!\n');

    // ========================================================================
    // TEST 3: Stream Resilience (Level: warn) & Date Formatting
    // ========================================================================
    console.log('Running Test 3: Stream Output (lastmodDateOnly & Warn Level)...');

    const baseSiteMap = new TinySiteMap({
      baseUrl: 'https://exemple.com',
      type: 'normal',
      namespaceStrategy: TinySiteMap.protocolStrategy,
    });

    const stream = new TinySiteMapStream(baseSiteMap, {
      xslUrl: '/estilo.xsl',
      lastmodDateOnly: true,
      level: 'warn',
    });

    // We start capturing asynchronously
    const streamPromise = captureStreamOutput(stream);

    // Write valid entry
    stream.write({
      loc: '/home',
      lastmod: '2026-08-31T10:30:00Z',
      changefreq: 'daily',
      priority: 1.0,
    });

    // Write INVALID entry (should be skipped, not crash)
    stream.write({
      loc: '/erro-proposital',
      priority: 5.0, // Invalid: > 1.0
    });

    // End stream
    stream.end();

    const streamXml = await streamPromise;

    // Assertions
    assert.ok(
      streamXml.includes('<?xml-stylesheet type="text/xsl" href="/estilo.xsl"?>'),
      'XSLT header missing',
    );
    assert.ok(
      streamXml.includes('<lastmod>2026-08-31</lastmod>'),
      'lastmodDateOnly failed to strip time',
    );
    assert.ok(
      !streamXml.includes('erro-proposital'),
      'Invalid entry was written to stream despite error',
    );
    assert.ok(streamXml.endsWith('</urlset>'), 'Stream did not close properly');

    console.log('-> Test 3 Passed!\n');

    // ========================================================================
    // TEST 4: Stream Strict Error Handling (Level: error)
    // ========================================================================
    console.log('Running Test 4: Stream Strict Errors (Level: error)...');

    const strictStream = new TinySiteMapStream(baseSiteMap, {
      level: 'error',
    });

    const strictStreamPromise = captureStreamOutput(strictStream);

    strictStream.write({
      loc: '/home',
      priority: 5.0, // This should crash the stream
    });
    strictStream.end();

    await assert.rejects(
      strictStreamPromise,
      RangeError,
      'Stream failed to throw error on invalid data',
    );

    console.log('-> Test 4 Passed!\n');

    console.log('✅ ALL TESTS PASSED SUCCESSFULLY! The library is ready for production.');
  } catch (error) {
    console.error('❌ TEST SUITE FAILED!');
    console.error(error);
    process.exit(1);
  }
};

export default testTinySiteMap;
