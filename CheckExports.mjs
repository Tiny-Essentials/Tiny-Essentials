/**
 * @fileoverview Script to validate if all paths defined in the 'exports' field
 * of package.json exist physically within the project directory.
 * @version 1.0.0
 */

import { resolve } from 'path';
import TinyPkgExportValidator from './src/v1/libs/tools/TinyPkgExportValidator.mjs';

/**
 * Main execution function.
 */
async function main() {
  const validator = new TinyPkgExportValidator(
    resolve(process.cwd(), 'package.json'),
    process.cwd(),
  );

  try {
    await validator.start();
    const isValid = await validator.validate();
    if (!isValid) {
      process.exit(1);
    }
  } catch (error) {
    process.exit(1);
  }
}

main();
