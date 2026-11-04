# infra

Infraestrutura como código com AWS CDK (TypeScript), um arquivo por recurso/stack.
Permite criar e apagar tudo com um comando.

## Estrutura
- `bin/app.ts`: ponto de entrada; cria as stacks em us-east-1.
- `lib/config.ts`: nome do projeto, região, grupos, capacidade do DynamoDB, CORS e limite da API.
- `lib/auth-stack.ts`: stack `GestaoPro-Auth` (Cognito Lite, 3 grupos, atributo `custom:empresaId`).
- `lib/database-stack.ts`: stack `GestaoPro-Database` (DynamoDB, tabela única, Provisionado 5/5).
- `lib/api-stack.ts`: stack `GestaoPro-Api` (HTTP API, CORS, limite de 10 req/s, autorizador JWT).
- `lib/api-route-stack.ts`: **uma stack por rota** (`GestaoPro-<Modulo>-<Acao>`): Lambda + role + logs + rota.
- `lib/api-function.ts`: construct Lambda + role exclusiva + logs (1 semana).
- `lib/lambda-bundler.ts`: empacota o TypeScript do backend com esbuild (código inline).
- `lib/routes/<modulo>-routes.ts`: lista das rotas de cada módulo (caminho, Lambda, permissões).

### Como adicionar uma rota
1. Crie a Lambda em `backend/functions/<modulo>/<acao>.ts`.
2. Adicione a definição em `lib/routes/<modulo>-routes.ts` (com as permissões mínimas).
3. Se for um módulo novo, inclua `...<modulo>Routes(deps)` em `bin/app.ts`.

## Comandos (rodar dentro de `infra/`)
| Comando | O que faz | Mexe na AWS? |
|---|---|---|
| `npm run typecheck` | confere os tipos do TypeScript | não |
| `npm run synth` | gera o modelo do CloudFormation em `cdk.out/` | não |
| `npm run diff` | mostra o que mudaria na AWS | só leitura |
| `npm run deploy` | cria/atualiza os recursos (use `-- --concurrency 4` para ir mais rápido) | **sim** |
| `npm run destroy` | apaga todas as stacks e os dados | **sim** |

Sem `cdk bootstrap` (o bucket S3 teria custo): usamos o `LegacyStackSynthesizer`, e o código
das Lambdas vai **inline** no modelo do CloudFormation. O `cdk` envia o modelo em YAML, e o limite
é de **50 KB por stack**. Por isso, **cada Lambda tem a sua própria stack** (hoje a maior tem ~27 KB).
