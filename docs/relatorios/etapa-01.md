# Relatório — Etapa 01: Proteção de custo e estrutura do projeto

Data: 16/10/2026

## Resumo
- Conta AWS verificada (somente leitura), acessada por um usuário IAM (não root).
- Os serviços escolhidos ficam dentro dos limites "Always Free" (Lambda, DynamoDB, CloudWatch, Cognito, KMS).
- Não há nenhum recurso existente em us-east-1 nem em sa-east-1.
- Configurado o acompanhamento de custos da conta (alertas de orçamento).
- Criada a estrutura de pastas do projeto, com um README.md em cada pasta.
- Levantadas as dependências das próximas etapas. **Nada foi instalado.**

## Arquivos criados
- `CLAUDE.md`: regras fixas do projeto
- `docs/README.md`, `docs/relatorios/README.md`
- `frontend/README.md`, `frontend/src/README.md`
- `frontend/src/app/README.md`, `frontend/src/components/README.md`, `frontend/src/components/ui/README.md`
- `frontend/src/features/README.md`, `frontend/src/services/README.md`, `frontend/src/types/README.md`
- `backend/README.md`, `backend/functions/README.md`, `backend/shared/README.md`
- `infra/README.md`
- `docs/relatorios/etapa-01.md`: este relatório

## Recursos AWS criados
| Nome | Tipo | Região | Configuração | Custo |
|---|---|---|---|---|
| Alertas de orçamento | AWS Budgets (custo, mensal) | global | aviso por e-mail ao detectar gasto | US$ 0,00 |

## Situação da conta (Passo 1)
Recursos verificados nas duas regiões, sem nenhum encontrado: Lambda, DynamoDB, Cognito, API Gateway
(HTTP, WebSocket, REST), EC2, NAT Gateway, Elastic IP, EBS, RDS, CloudFormation, S3 e CloudFront.

## Dependências das próximas etapas (não instaladas)
### Ferramentas de sistema
| Nome | Versão | Finalidade | Instalado? |
|---|---|---|---|
| Node.js | 24.x LTS | executar JS/TS, Lambdas (runtime nodejs) | ✅ v24.15.0 |
| npm | 11.x | gerenciar pacotes | ✅ 11.12.1 |
| AWS CLI | 2.x | acessar a AWS pelo terminal | ✅ 2.36.42 |
| git | 2.x | controle de versão local (opcional) | ✅ 2.50.1 |
| AWS CDK CLI (`aws-cdk`) | 2.1145.0 | criar/apagar a infraestrutura | ❌ (dá para usar via `npx`, sem instalação global) |
| TypeScript (`tsc`) | 7.0.2 | compilador TypeScript | ❌ (será instalado por projeto) |

### Infra (pasta `infra/`)
| Pacote | Versão | Finalidade |
|---|---|---|
| aws-cdk-lib | 2.273.0 | biblioteca oficial do CDK |
| constructs | 10.8.1 | base do CDK (obrigatória) |
| aws-cdk | 2.1145.0 | CLI do CDK |
| tsx | 4.23.15 | rodar o app CDK em TypeScript |
| esbuild | 0.28.2 | empacotar as Lambdas |

### Backend (pasta `backend/`)
| Pacote | Versão | Finalidade |
|---|---|---|
| @aws-sdk/client-dynamodb | 3.1152.0 | cliente oficial do DynamoDB (SDK v3) |
| @aws-sdk/lib-dynamodb | 3.1152.0 | facilita leitura/escrita no DynamoDB |
| zod | 4.6.7 | validar as entradas |
| @types/aws-lambda | 8.10.164 | tipos dos eventos Lambda |

### Frontend (pasta `frontend/`)
| Pacote | Versão | Finalidade |
|---|---|---|
| react / react-dom | 19.3.1 | interface |
| vite + @vitejs/plugin-react | 8.3.4 / 6.1.2 | servidor de desenvolvimento e build |
| tailwindcss + @tailwindcss/vite | 4.3.3 | estilos |
| react-router | 8.4.0 | rotas/páginas |
| react-hook-form + @hookform/resolvers | 7.90.0 / 5.9.1 | formulários (+ integração com Zod) |
| zod | 4.6.7 | validar formulários |
| @tanstack/react-query | 5.104.3 | chamadas à API e cache |
| aws-amplify | 6.22.2 | login com Cognito (somente Auth) |
| recharts | 3.10.1 | gráficos do dashboard |

Todos são pacotes oficiais ou amplamente usados. As versões são as últimas publicadas no npm em 16/10/2026.

## Comandos executados
- `aws sts get-caller-identity`
- `aws freetier get-account-plan-state --region us-east-1`
- `aws freetier get-free-tier-usage --region us-east-1`
- Listagens somente leitura (`lambda list-functions`, `dynamodb list-tables`, `cognito-idp list-user-pools`,
  `apigatewayv2 get-apis`, `apigateway get-rest-apis`, `ec2 describe-instances/nat-gateways/addresses/volumes`,
  `rds describe-db-instances`, `cloudformation list-stacks`, `s3api list-buckets`, `cloudfront list-distributions`,
  `budgets describe-budgets`) em us-east-1 e sa-east-1
- `aws budgets create-budget` (2 vezes) e `aws budgets describe-notifications-for-budget`
- `node/npm/npx/cdk/tsc/git/aws --version` e `npm view <pacote> version` (somente consulta)

## Como testar
1. Console AWS → **Billing and Cost Management → Budgets**: os alertas de orçamento devem aparecer.
2. No terminal: `aws budgets describe-budgets --account-id <ID-DA-CONTA> --output table`
3. Confira a estrutura (na pasta do projeto): `find . -name README.md`

## Decisões do usuário
- **API Gateway HTTP API:** aprovado pelo usuário (16/10/2026), que já usava o serviço. O custo é baixo
  (cerca de US$ 1,00 por milhão de chamadas) e fica coberto pelos alertas de orçamento.
- **TypeScript 7.0:** versão aprovada pelo usuário.

## Pendências / atenção
- O alerta de custo da AWS pode chegar com até ~1 dia de atraso. Ele avisa, mas não bloqueia gastos.
