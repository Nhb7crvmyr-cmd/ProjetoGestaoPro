// Declarações mínimas do Node.js usadas pela infra (__dirname e node:path).
// Assim não precisamos instalar o pacote @types/node inteiro só por causa disso.

/** Pasta do arquivo atual (o tsx executa o app CDK como CommonJS, que define esta variável). */
declare const __dirname: string;

declare module 'node:path' {
  export function resolve(...paths: string[]): string;
  export function join(...paths: string[]): string;
}
