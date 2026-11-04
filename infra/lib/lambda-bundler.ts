// Empacota o código TypeScript de uma Lambda em UM arquivo JavaScript, que vai inline no CloudFormation.
//
// POR QUE INLINE? O jeito padrão do CDK envia o código para um bucket S3 (criado pelo "cdk bootstrap").
// Nesta conta o S3 tem custo, então colocamos o código DENTRO do modelo do CloudFormation.
// Limites: até 4 MB por Lambda e 51 KB por modelo (stack). Por isso há uma stack por módulo,
// o código é "minificado" e o AWS SDK fica de fora (ele já vem instalado na Lambda).

import { buildSync } from 'esbuild';
import * as path from 'node:path';

/** Pasta raiz do backend (infra/lib → ../../backend). */
const BACKEND_DIR = path.resolve(__dirname, '..', '..', 'backend');

/**
 * Compila e junta (bundle) o arquivo da Lambda e tudo o que ele importa.
 * @param entry - caminho do arquivo dentro de backend/ (ex.: 'functions/admin/listUsers.ts')
 * @returns o código JavaScript final, como texto
 */
export function bundleLambda(entry: string): string {
  const result = buildSync({
    entryPoints: [path.join(BACKEND_DIR, entry)],
    absWorkingDir: BACKEND_DIR,
    bundle: true, // junta os imports (shared/, zod...) em um arquivo só
    platform: 'node',
    target: 'node24',
    // CommonJS: o CloudFormation grava o código inline como "index.js", que o Node lê como CommonJS.
    format: 'cjs',
    minify: true, // remove espaços e encurta nomes: arquivo bem menor
    legalComments: 'none',
    // O AWS SDK v3 já existe no ambiente da Lambda (Node.js 24): não precisa ir junto.
    external: ['@aws-sdk/*'],
    write: false, // devolve o resultado na memória em vez de gravar arquivo
  });
  return result.outputFiles[0].text;
}
