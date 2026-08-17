// test-tinyi18.js
import { mkdir, rm } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import TinyI18 from '../../dist/v1/libs/text/TinyI18.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI colors
const Reset = '\x1b[0m';
const Bright = '\x1b[1m';
const FgGreen = '\x1b[32m';
const FgYellow = '\x1b[33m';
const FgBlue = '\x1b[34m';
const FgCyan = '\x1b[36m';

function section(title) {
  console.log(`\n${Bright}${FgYellow}--- ${title} ---${Reset}`);
}

async function testI18() {
  const tmpDir = path.join(__dirname, './tmp-locales');
  const resultDir = path.join(tmpDir, './temp');

  // Reset test folder
  if (existsSync(resultDir)) {
    await rm(resultDir, { recursive: true, force: true });
  }
  await mkdir(resultDir, { recursive: true });

  // Create sample locale JSON files
  const enFile = path.join(tmpDir, 'en.json');
  const ptFile = path.join(tmpDir, 'pt.json');
  const esFile = path.join(tmpDir, 'es.json');

  section('Loading English Locale');
  const i18 = new TinyI18({
    mode: 'file',
    basePath: tmpDir,
    defaultLocale: 'en',
    strict: true,
  });
  await i18.setLocale('en');
  console.log(`${FgGreen}EN title:${Reset}`, i18.t('app.title'));
  console.log(`${FgGreen}EN greeting:${Reset}`, i18.t('greeting', { name: 'Alice' }));

  section('Loading Portuguese Locale');
  await i18.setLocale('pt');
  console.log(`${FgBlue}PT title:${Reset}`, i18.t('app.title'));
  console.log(`${FgBlue}PT greeting:${Reset}`, i18.t('greeting', { name: 'Alice' }));

  section('Merging Locale Files');
  const mergedFile = path.join(resultDir, 'merged.json');
  await TinyI18.mergeLocaleFiles({
    files: [enFile, ptFile, esFile],
    output: mergedFile,
    spaces: 2,
  });
  console.log(`${FgCyan}✅ mergeLocaleFiles created:${Reset} ${mergedFile}`);

  section('Testing Merged File');
  const i18Merged = new TinyI18({
    mode: 'file',
    basePath: tmpDir,
    defaultLocale: 'en',
    strict: true,
  });
  // point to merged.json which contains all locales
  await i18Merged.setLocale('temp/merged');
  console.log(`${FgGreen}Merged EN greeting:${Reset}`, i18Merged.t('greeting', { name: 'Alice' }));

  section('✅ All Tests Completed');
}

export default testI18;
