# Relatório — Etapa 02: CDK + Cognito + DynamoDB + IAM

Data: 16/10/2026

## Resumo
- Criado o projeto CDK em TypeScript na pasta `infra/`.
- Publicadas na AWS 2 stacks, a de autenticação (Cognito) e a de banco (DynamoDB), com custo **US$ 0,00**.
- Nenhum `cdk bootstrap`: ele criaria um bucket S3, que tem custo nesta conta. Usamos o `LegacyStackSynthesizer`.
- DynamoDB em modo **Provisionado 5/5** (e não On-Demand) para ficar dentro do Always Free.
  Confirmado pelo usuário, e o CLAUDE.md já foi atualizado (o volume é pequeno: poucos cadastros, produtos e clientes fictícios).
- IAM: nenhuma role criada nesta etapa. Cada Lambda terá a sua própria role (menor privilégio),
  criada junto com ela. O mesmo vale para a API Gateway HTTP API.
- Código com comentários didáticos, a pedido do usuário.

## Decisões do usuário
- 16/10/2026: "sem custo". Sempre a opção de custo zero exato (adiar bootstrap, DynamoDB Provisionado).
- 16/10/2026: "sim para os dois", para instalar os pacotes em `infra/` e publicar na AWS.
- Pedido: comentários explicativos no código, para estudo.

## Pacotes instalados (somente em `infra/`)
| Pacote | Versão | Finalidade |
|---|---|---|
| aws-cdk-lib | 2.273.0 | biblioteca oficial do CDK |
| constructs | 10.8.1 | base do CDK |
| aws-cdk | 2.1145.0 | comando `cdk` |
| typescript | 7.0.2 | compilador / checagem de tipos |
| tsx | 4.23.15 | executa o app CDK em TypeScript |

`npm install`: 0 vulnerabilidades.

## Arquivos criados/alterados
- `infra/package.json`, `infra/package-lock.json`: dependências e scripts
- `infra/cdk.json`: configuração do CDK (como rodar o app)
- `infra/tsconfig.json`: configuração do TypeScript
- `infra/.gitignore`: ignora `node_modules/` e `cdk.out/`
- `infra/bin/app.ts`: ponto de entrada e criação das stacks
- `infra/lib/config.ts`: nome, região, grupos e capacidade
- `infra/lib/auth-stack.ts`: Cognito
- `infra/lib/database-stack.ts`: DynamoDB
- `infra/README.md`: atualizado com estrutura e comandos
- `CLAUDE.md`: linha do banco alterada de On-Demand para Provisionado 5/5
- `docs/relatorios/etapa-02.md`: este relatório

## Recursos AWS criados (us-east-1)
| Nome | Tipo | Configuração | Custo |
|---|---|---|---|
| `GestaoPro-Auth` | CloudFormation stack | — | US$ 0,00 |
| `gestao-pro-users` | Cognito User Pool | plano LITE, login por e-mail, MFA desligado, e-mail do próprio Cognito | US$ 0,00 (grátis até 10.000 usuários ativos por mês) |
| `gestao-pro-web` | Cognito App Client | sem segredo, fluxo SRP | US$ 0,00 |
| `SuperAdmin` (0), `Dono` (1), `Funcionario` (2) | Cognito Groups (precedência) | — | US$ 0,00 |
| `GestaoPro-Database` | CloudFormation stack | — | US$ 0,00 |
| `gestao-pro` | DynamoDB Table | chaves `pk`/`sk` (texto), Provisionado 5 de leitura e 5 de escrita, sem auto scaling, PITR desligado | US$ 0,00 (Always Free até 25/25) |

Os IDs do Cognito não são segredos: o frontend precisa deles e eles ficam visíveis no navegador.

Verificado após o deploy: plano LITE, MFA OFF, e-mail COGNITO_DEFAULT, 3 grupos, tabela ACTIVE 5/5,
PITR DISABLED, 0 alvos de auto scaling e 0 alarmes no CloudWatch.

## Comandos executados
- `npm install` (em `infra/`)
- `npx tsc --noEmit` (checagem de tipos)
- `npx cdk synth`
- `npx cdk deploy --all --require-approval never`: a 1ª tentativa falhou porque o
  `BootstraplessSynthesizer` ainda tentava usar as roles do bootstrap. Nada foi criado
  (conferido com `aws cloudformation list-stacks`). Trocado para `LegacyStackSynthesizer`, e a 2ª tentativa deu certo.
- `aws cognito-idp describe-user-pool`, `aws cognito-idp list-groups`, `aws dynamodb describe-table`,
  `aws dynamodb describe-continuous-backups`, `aws application-autoscaling describe-scalable-targets`,
  `aws cloudwatch describe-alarms` (verificação)
- `npx cdk diff`: sem diferenças depois de melhorar os comentários

## Como testar
1. Console AWS (us-east-1) → **Cognito → User pools → gestao-pro-users → Groups**: os 3 grupos aparecem.
2. Console AWS → **DynamoDB → Tables → gestao-pro**: capacidade 5/5, modo Provisioned.
3. No terminal, dentro de `infra/`: `npm run diff` deve mostrar "There were no differences".
4. Para apagar tudo (se quiser): `npm run destroy`.

## Pendências / atenção
- O `cdk bootstrap` será necessário quando houver Lambdas, porque elas precisam de um bucket S3 para enviar o código.
  Antes dessa etapa, vou avaliar alternativas de custo zero e perguntar.
- ~~Atualizar o CLAUDE.md para "Provisionado 5/5"~~: feito em 16/10/2026, com aprovação do usuário.
- API Gateway HTTP API confirmada de novo pelo usuário (16/10/2026): o volume baixo de chamadas deixa o custo perto de zero.
- O limite de 25/25 do Always Free é a SOMA de todas as tabelas e índices (GSIs). Cada índice novo consome parte dele.
- O e-mail do Cognito tem limite de 50 envios por dia.
