import IPFSHasher from '../../dist/v1/webTemplates/multiformats/14.0/IPFSHasher/index.mjs';
import { TestRunner, section, color } from './_helpers.mjs';

/**
 * Node.js port of the browser based IPFS hasher test environment
 * (`test/html/webTemplates/multiformats/14.0/IPFSHasher`).
 *
 * Covers:
 * - CIDv0 / CIDv1 generation
 * - Determinism and input validation
 *
 * @returns {Promise<void>}
 */
const testIPFSHasher = async () => {
  const t = new TestRunner('IPFSHasher');
  const encoder = new TextEncoder();

  // ---------------------------------------------------------------------
  // Construction
  // ---------------------------------------------------------------------
  section('IPFSHasher - construction', '🧬');
  t.ok(new IPFSHasher() instanceof IPFSHasher, 'Defaults to a valid instance');
  t.ok(new IPFSHasher('v0') instanceof IPFSHasher, 'Accepts the v0 version');
  t.ok(new IPFSHasher('v1') instanceof IPFSHasher, 'Accepts the v1 version');
  t.throws(() => new IPFSHasher('v2'), 'Rejects an invalid version');

  // ---------------------------------------------------------------------
  // CIDv1 (raw codec)
  // ---------------------------------------------------------------------
  section('IPFSHasher - CIDv1', '🔗');
  const v1 = new IPFSHasher('v1');
  const result = await v1.generate(encoder.encode('hello world'));

  t.equal(result.version, 'v1', 'Reports the v1 version');
  t.equal(result.hashAlgorithm, 'sha256', 'Uses sha256');
  t.equal(result.codec, 0x55, 'Uses the raw codec (0x55)');
  t.equal(typeof result.cidString, 'string', 'Returns a string CID');
  t.ok(result.cidString.startsWith('bafkrei'), 'CIDv1 uses the base32 prefix');

  const v1Again = await v1.generate(encoder.encode('hello world'));
  t.equal(v1Again.cidString, result.cidString, 'Is deterministic for the same input');

  const v1Other = await v1.generate(encoder.encode('another input'));
  t.ok(v1Other.cidString !== result.cidString, 'Different inputs produce different CIDs');

  // ---------------------------------------------------------------------
  // CIDv0 (dag-pb codec)
  // ---------------------------------------------------------------------
  section('IPFSHasher - CIDv0', '📦');
  const v0 = new IPFSHasher('v0');
  const resultV0 = await v0.generate(encoder.encode('hello world'));

  t.equal(resultV0.version, 'v0', 'Reports the v0 version');
  t.equal(resultV0.codec, 0x70, 'Uses the dag-pb codec (0x70)');
  t.ok(resultV0.cidString.startsWith('Qm'), 'CIDv0 uses the base58 Qm prefix');
  t.ok(
    resultV0.cidString !== result.cidString,
    'v0 and v1 produce different CIDs for the same input',
  );

  // ---------------------------------------------------------------------
  // Validation
  // ---------------------------------------------------------------------
  section('IPFSHasher - validation', '🛡️');
  await t.ok(await v1.generate(encoder.encode('')).then(() => true), 'Accepts an empty Uint8Array');
  await t.ok(
    await v1
      .generate('not-bytes')
      .then(() => false)
      .catch(() => true),
    'Rejects non Uint8Array input',
  );

  console.log(`\n${color('gray', 'IPFSHasher test-suite finished.')}`);

  return t.summary();
};

export default testIPFSHasher;
