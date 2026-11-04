# Relatório — Ajuste 01: Preparação para publicação no GitHub e revisão de segurança

Data: 04/11/2026

## Resumo
- Revisão de segurança das 28 Lambdas, da API e da infraestrutura.
- README principal criado na raiz, explicando a ferramenta, a arquitetura e os serviços da AWS.
- Dados confidenciais removidos dos arquivos: número da conta AWS, usuário IAM, e-mails, IDs do Cognito,
  detalhes dos orçamentos e caminhos da máquina local.
- `.gitignore` geral criado na raiz (dependências, builds, `.env*`, chaves).
- Validade dos tokens de login reduzida de 1 hora para **15 minutos**.

## Revisão de segurança
Pontos fortes: todas as rotas exigem token; empresa, usuário e grupo vêm sempre do token; cada Lambda confere o grupo;
Funcionário só vê os próprios clientes e vendas; entradas validadas com Zod; uma role IAM por Lambda; CORS restrito;
limite de requisições na API; erros internos não vazam detalhes.

Pontos de atenção:
| # | Ponto | Situação |
|---|---|---|
| 1 | Usuário bloqueado continuava usando a API por até 1 hora (token ainda válido) | **Corrigido**: token de 15 minutos |
| 2 | Supervisor ativa qualquer plano sem pagar | Esperado: pagamento simulado |
| 3 | Cadastro aberto pode esgotar a cota de 50 e-mails/dia do Cognito | Aceito (sem custo) |
| 4 | Um SuperAdmin pode trocar o e-mail de outro SuperAdmin | Aceito (risco baixo) |
| 5 | Funcionário pode dar até 100% de desconto | Regra de negócio a definir |

## Arquivos criados/alterados
- criados: `README.md`, `.gitignore`, `docs/relatorios/ajuste-01-publicacao.md`
- alterados: `infra/lib/auth-stack.ts` (validade dos tokens), `infra/bin/app.ts` (comentário), `CLAUDE.md` (contexto),
  `docs/relatorios/etapa-01.md`, `etapa-02.md`, `etapa-04.md`, `etapa-05.md`, `etapa-06.md` (dados confidenciais removidos e atualizações)

## Recursos AWS alterados
| Nome | Tipo | Região | Mudança | Custo |
|---|---|---|---|---|
| `gestao-pro-web` | Cognito App Client | us-east-1 | ID token e access token: 60 → 15 minutos (refresh token continua 30 dias) | US$ 0,00 |

## Comandos executados
- `npm run typecheck` e `npx cdk diff GestaoPro-Auth` (somente leitura)
- `npx cdk deploy GestaoPro-Auth --exclusively` (rodado pelo usuário)
- `aws cognito-idp describe-user-pool-client` (somente leitura, para conferir)

## Como testar
1. Entre no site e use normalmente por mais de 15 minutos: a sessão continua (o token é renovado sozinho).
2. Com o SuperAdmin, bloqueie um usuário de teste que esteja logado: em até 15 minutos ele perde o acesso.

## Pendências
- Nenhuma deste ajuste. Próxima etapa do roteiro: 12 (Chat).
