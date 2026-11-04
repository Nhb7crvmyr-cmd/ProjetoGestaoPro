// Declarações mínimas de globais do Node.js (process.env e console) para o TypeScript.
// Assim não precisamos instalar o pacote @types/node inteiro só por causa disso.
// "declare" só AVISA o TypeScript que isso existe em tempo de execução, sem gerar código.

declare const process: {
  env: Record<string, string | undefined>;
};

declare const console: {
  log(...data: unknown[]): void;
  warn(...data: unknown[]): void;
  error(...data: unknown[]): void;
};

/** API de criptografia do Node.js (usamos randomUUID para gerar ids únicos). */
declare const crypto: {
  randomUUID(): string;
};
