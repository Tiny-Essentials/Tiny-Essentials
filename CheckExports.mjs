/**
 * @fileoverview Script para validar se todos os caminhos definidos no campo 'exports'
 * do package.json existem fisicamente no diretório do projeto.
 * @version 1.0.0
 */

import { readFile, access } from 'node:fs/promises';
import { resolve } from 'node:path';

/**
 * Constantes de cores para o console (ANSI escape codes).
 * Utilizadas para fornecer um feedback visual profissional e claro.
 */
const COLORS = {
  RESET: '\x1b[0m',
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  CYAN: '\x1b[36m',
  DIM: '\x1b[2m',
};

/**
 * Classe responsável por validar as exportações do pacote.
 * Implementa encapsulamento de estado e lógica de busca recursiva.
 */
class ExportValidator {
  /** @type {Object} */
  #packageData;
  /** @type {string} */
  #rootDir;
  /** @type {Array<{path: string, valid: boolean}>} */
  #results;

  /**
   * Cria uma instância de ExportValidator.
   *
   * @param {Object} packageData - O conteúdo do objeto JSON do package.json.
   * @param {string} rootDir - O diretório raiz do projeto.
   * @throws {TypeError} Se packageData não for um objeto ou rootDir não for uma string.
   */
  constructor(packageData, rootDir) {
    if (typeof packageData !== 'object' || packageData === null) {
      throw new TypeError('The "packageData" argument must be a non-null object.');
    }
    if (typeof rootDir !== 'string') {
      throw new TypeError('The "rootDir" argument must be a string.');
    }

    this.#packageData = packageData;
    this.#rootDir = rootDir;
    this.#results = [];
  }

  /**
   * Getter para acessar os resultados da validação.
   * @returns {Array<{path: string, valid: boolean}>} Lista de caminhos validados.
   */
  get results() {
    return this.#results;
  }

  /**
   * Executa o processo de validação.
   * @returns {Promise<boolean>} Retorna true se todos os caminhos forem válidos, false caso contrário.
   */
  async validate() {
    const exports = this.#packageData.exports;

    if (!exports) {
      console.log(`${COLORS.YELLOW}[!] No "exports" field found in package.json.${COLORS.RESET}`);
      return true;
    }

    this.#results = [];
    await this.#traverseExports(exports);
    return this.#report();
  }

  /**
   * Percorre recursivamente o objeto de exportações.
   *
   * @param {Object|string} node - O nó atual do objeto de exportações.
   * @param {string} currentKey - A chave atual (usada para rastreamento de logs).
   * @private
   * @returns {Promise<void>}
   */
  async #traverseExports(node, currentKey = '') {
    if (typeof node === 'string') {
      // Caso base: o valor é um caminho direto
      await this.#checkFileExists(node, currentKey);
    } else if (typeof node === 'object' && node !== null) {
      // Caso recursivo: o valor é um objeto (ex: { import: '...', require: '...' })
      const keys = Object.keys(node);
      for (const key of keys) {
        const subKey = currentKey ? `${currentKey} -> ${key}` : key;
        await this.#traverseExports(node[key], subKey);
      }
    }
  }

  /**
   * Verifica a existência de um arquivo no sistema de arquivos.
   *
   * @param {string} relativePath - O caminho relativo definido no package.json.
   * @param {string} context - O contexto da chave para fins de relatório.
   * @private
   * @returns {Promise<void>}
   */
  async #checkFileExists(relativePath, context) {
    // Remove possíveis curingas (wildcards) como '*' para validação de caminhos literais
    const cleanPath = relativePath.replace(/\*/g, '');
    const absolutePath = resolve(this.#rootDir, cleanPath);

    try {
      await access(absolutePath);
      this.#results.push({ path: context, valid: true });
    } catch {
      this.#results.push({ path: context, valid: false, errorPath: relativePath });
    }
  }

  /**
   * Gera o relatório final no console.
   *
   * @returns {boolean} True se não houver erros, false se houver falhas.
   * @private
   */
  #report() {
    console.log(`\n${COLORS.CYAN}=== Tiny-Essentials Export Validation ===${COLORS.RESET}\n`);

    let errorCount = 0;

    for (const result of this.#results) {
      if (result.valid) {
        console.log(`${COLORS.GREEN}  [✔] ${result.path}${COLORS.RESET}`);
      } else {
        console.log(`${COLORS.RED}  [✘] ${result.path}${COLORS.RESET}`);
        console.log(`      ${COLORS.DIM}Missing: ${result.errorPath}${COLORS.RESET}`);
        errorCount++;
      }
    }

    console.log(`\n${COLORS.CYAN}-----------------------------------------${COLORS.RESET}`);
    if (errorCount === 0) {
      console.log(`${COLORS.GREEN}SUCCESS: All exports are correctly mapped.${COLORS.RESET}`);
      return true;
    } else {
      console.log(
        `${COLORS.RED}FAILURE: ${errorCount} export(s) are missing or invalid.${COLORS.RESET}`,
      );
      return false;
    }
  }
}

/**
 * Função principal de execução.
 */
async function main() {
  try {
    const packageJsonPath = resolve(process.cwd(), 'package.json');
    const rootDir = process.cwd();

    const packageRaw = await readFile(packageJsonPath, 'utf-8');
    const packageData = JSON.parse(packageRaw);

    const validator = new ExportValidator(packageData, rootDir);
    const isValid = await validator.validate();

    if (!isValid) {
      process.exit(1);
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(
        `${COLORS.RED}Error: package.json not found in the current directory.${COLORS.RESET}`,
      );
    } else if (error instanceof SyntaxError) {
      console.error(
        `${COLORS.RED}Error: Failed to parse package.json. Ensure it is valid JSON.${COLORS.RESET}`,
      );
    } else {
      console.error(`${COLORS.RED}An unexpected error occurred:${COLORS.RESET}`, error.message);
    }
    process.exit(1);
  }
}

main();
