import { execSync } from 'child_process';
import { mkdirSync, cpSync, rmSync, existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Executa um comando no terminal exibindo a saída em tempo real no console.
 * @param {string} command - O comando a ser executado.
 */
function runCommand(command) {
  console.log(`\n> Executando: ${command}`);
  execSync(command, { stdio: 'inherit' });
}

function build() {
  try {
    // 1. Compilação do Service Worker (SW)
    runCommand('npx tsc -p src/v1/libs/router/pwa/tsconfig.json');

    // 2. Compilação do TypeScript principal
    runCommand('npx tsc -p tsconfig.json');

    // 3. Bundling de JS com Rollup e Webpack
    runCommand('npx rollup -c');
    runCommand('npx webpack --mode production');

    // 4. Mover/Copiar a pasta do PWA
    const sourceDir = resolve('dist-sw/src/v1/libs/router/pwa');
    const targetDir = resolve('dist/v1/libs/router/pwa');

    if (existsSync(sourceDir)) {
      console.log(`\n> Copiando arquivos PWA de "${sourceDir}" para "${targetDir}"...`);
      mkdirSync(targetDir, { recursive: true });
      cpSync(sourceDir, targetDir, { recursive: true });
      rmSync(resolve('dist-sw'), { recursive: true, force: true });
      
      console.log('> Arquivos PWA copiados com sucesso!');
    } else {
      console.warn(`\n> [Aviso] Diretório de origem não encontrado: ${sourceDir}`);
    }

    console.log('\n Build finalizado com sucesso!');
  } catch (error) {
    console.error('\n Ocorreu um erro durante o processo de build:', error.message);
    process.exit(1);
  }
}

build();