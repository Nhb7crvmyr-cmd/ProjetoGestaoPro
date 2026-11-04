# Relatório — Etapa 04: Painel do SuperAdmin

Data: 16/10/2026

## Resumo
- **Ajustes pedidos nas telas de autenticação:**
  - botão de **mostrar/esconder senha** (ícone de olho) no login e no cadastro;
  - **medidor de força da senha** (Fraca/Média/Boa/Forte) no login e no cadastro. No cadastro aparece também a
    lista de regras obrigatórias com ✓;
  - painel da esquerda em **cinza escuro** (os detalhes continuam verde-azulados). O usuário não respondeu qual
    opção de cor preferia, então foi aplicada a sugerida.
- **Primeira API do projeto:** API Gateway HTTP API com autorizador JWT do Cognito, CORS restrito ao
  `localhost:5173` e limite de 10 requisições por segundo (pico de 20).
- **Painel do SuperAdmin** (`/admin`): resumo (usuários, ativos, bloqueados, donos), busca, tabela e botão
  **Bloquear/Liberar**, com confirmação.
- Regras no backend: só o SuperAdmin acessa (403 para os outros). Ninguém bloqueia a si mesmo nem outro SuperAdmin.
  Ao bloquear, as sessões do usuário são encerradas.
- o usuário de teste colocado no grupo **SuperAdmin**.
- **Custo zero sem bootstrap:** o código das Lambdas vai inline no modelo do CloudFormation (sem bucket S3).
  Cada módulo terá a sua própria stack, para respeitar o limite de 51 KB por modelo.

## Pacotes instalados (aprovados pelo usuário)
| Pasta | Pacote | Versão |
|---|---|---|
| backend | zod | 4.6.7 (usado como `zod/mini`, a versão compacta) |
| backend | @aws-sdk/client-cognito-identity-provider | 3.1152.0 (só para os tipos; o SDK já vem na Lambda) |
| backend | @types/aws-lambda | 8.10.164 |
| backend | typescript | 7.0.2 |
| infra | esbuild | 0.28.2 |
| frontend | @tanstack/react-query | 5.104.3 |

Todas as instalações: 0 vulnerabilidades.

## Arquivos criados/alterados
**Backend (novo):**
- `backend/package.json`, `tsconfig.json`, `.gitignore`, `README.md`
- `backend/shared/`: `http.ts`, `errors.ts`, `auth.ts`, `validation.ts`, `cognito.ts`, `node-globals.d.ts`
- `backend/functions/admin/listUsers.ts`: GET /admin/users
- `backend/functions/admin/setUserStatus.ts`: POST /admin/users/{userId}/status

**Infra:**
- novos: `lib/api-stack.ts`, `lib/admin-stack.ts`, `lib/api-function.ts`, `lib/lambda-bundler.ts`, `lib/node-globals.d.ts`
- alterados: `bin/app.ts` (novas stacks), `lib/config.ts` (CORS e limite da API),
  `cdk.json` (referências entre stacks fixadas como "strong"), `package.json` (esbuild), `README.md`

**Frontend:**
- novos: `src/services/apiClient.ts`, `src/app/AppProviders.tsx`, `src/app/layouts/AppLayout.tsx`,
  `src/components/ui/PasswordField.tsx`, `src/features/auth/components/PasswordStrengthMeter.tsx`,
  `src/features/auth/components/RequireGroup.tsx`, `src/features/auth/utils/passwordStrength.ts`,
  `src/features/admin/` (`services/adminService.ts`, `hooks/useAdminUsers.ts`, `hooks/useSetUserStatus.ts`,
  `components/AdminStats.tsx`, `components/UsersTable.tsx`, `components/UserStatusBadge.tsx`, `pages/AdminUsersPage.tsx`)
- alterados: `src/main.tsx`, `src/app/router.tsx`, `src/app/layouts/AuthLayout.tsx`, `src/components/ui/TextField.tsx`,
  `src/features/auth/components/SiteHighlights.tsx`, `src/features/auth/pages/LoginPage.tsx`, `SignUpPage.tsx`,
  `WelcomePage.tsx`, `src/vite-env.d.ts`, `.env.example`, `.env.local` (+ `VITE_API_URL`)

## Recursos AWS criados/alterados (us-east-1)
| Nome | Tipo | Custo |
|---|---|---|
| `GestaoPro-Api` | CloudFormation stack | US$ 0,00 |
| `gestao-pro-api` (`78lmlyyd01`) | API Gateway HTTP API + stage `$default` (10 req/s, pico de 20) | ~US$ 0,00 (US$ 1,00 por milhão de chamadas; aprovado) |
| `cognito-jwt` | Autorizador JWT da HTTP API | US$ 0,00 |
| `GestaoPro-Admin` | CloudFormation stack | US$ 0,00 |
| `gestao-pro-admin-list-users` | Lambda (Node 24, arm64, 256 MB, 10 s) | US$ 0,00 (Always Free) |
| `gestao-pro-admin-set-user-status` | Lambda (Node 24, arm64, 256 MB, 10 s) | US$ 0,00 (Always Free) |
| `gestao-pro-admin-list-users-role`, `gestao-pro-admin-set-user-status-role` | IAM Roles (menor privilégio) | US$ 0,00 |
| `/aws/lambda/gestao-pro-admin-*` (2) | CloudWatch Log Groups, retenção de 7 dias | US$ 0,00 (Always Free 5 GB) |
| 2 rotas + 2 integrações + 2 permissões Lambda | partes da HTTP API | US$ 0,00 |
| `GestaoPro-Auth` | ganhou apenas "exports" (IDs para as outras stacks) | US$ 0,00 |
| Usuário o usuário de teste | adicionado ao grupo SuperAdmin | US$ 0,00 |

Não foi criado: bucket S3, bootstrap, auto scaling, alarmes nem NAT.

**Permissões de cada role:**
- list-users: `logs:CreateLogStream`/`PutLogEvents` (só no próprio log), `cognito-idp:ListUsers`/`ListUsersInGroup` (só neste User Pool)
- set-user-status: logs (só no próprio log), `cognito-idp:AdminListGroupsForUser`/`AdminEnableUser`/`AdminDisableUser`/`AdminUserGlobalSignOut` (só neste User Pool)

## Comandos executados
- `npm view <pacote> version` (consulta), `npm install` (backend, infra, frontend)
- `aws cognito-idp list-users` (consulta) e `aws cognito-idp admin-add-user-to-group` (SuperAdmin)
- `aws cloudformation describe-type` (consulta do limite de código inline)
- `npx tsc --noEmit` (backend, infra, frontend), `npx cdk synth`
- `npx cdk deploy --all`, e depois `npx cdk deploy GestaoPro-Admin` (correção, ver abaixo)
- Testes: `curl` (sem token, token falso, CORS) e `aws lambda invoke` com eventos simulados

## Testes feitos
| Teste | Resultado |
|---|---|
| API sem token | 401 ✅ |
| API com token falso | 401 ✅ |
| CORS a partir de `localhost:5173` | permitido ✅ |
| CORS a partir de outro site | bloqueado ✅ |
| Listar usuários como SuperAdmin | 200, com grupos ✅ |
| Listar usuários como Dono | 403 ✅ |
| Bloquear a si mesmo | 400 ✅ |
| Bloquear outro SuperAdmin | 400 ✅ |
| ID inválido / corpo inválido | 400 ✅ |
| Usuário inexistente | 404 ✅ |

**Bug encontrado e corrigido:** os IDs do Cognito (ex.: `f4c87448-70d1-70c5-c786-...`) não seguem o padrão UUID
estrito, e o `z.uuid()` recusava todos. Trocado por `z.guid()` (formato 8-4-4-4-12) e publicado de novo.

**Não testado:** bloquear/liberar de verdade um usuário comum, porque hoje só existe a conta SuperAdmin.

## Como testar
1. Servidor local: `cd frontend && npm run dev` e abra http://localhost:5173 (recarregue com Cmd+Shift+R).
2. **Saia e entre de novo** com o usuário de teste. O token antigo ainda não tinha o grupo SuperAdmin.
   Depois do login, você cai direto no **Painel admin**.
3. Para testar bloquear/liberar: em outra janela anônima, cadastre uma 2ª conta. No painel, clique em
   **Atualizar** e depois em **Bloquear**. Tente entrar com a 2ª conta: o login é recusado. Clique em **Liberar** e entre de novo.
4. Login/cadastro: teste o ícone de olho e o medidor de força.

## Pendências / atenção
- Com o usuário bloqueado, um token já emitido pode valer por até 1 hora. As próximas Lambdas vão checar isso nos dados.
  **Atualização (04/11/2026):** a validade do token foi reduzida para 15 minutos (ver `ajuste-01-publicacao.md`).
- As **empresas** ainda não aparecem no painel: elas só existem a partir da Etapa 5 (onboarding).
- O CORS só aceita `http://localhost:5173`. Na Etapa 15 (deploy) entra o endereço do CloudFront.
- Limite de 51 KB por stack: cada módulo novo terá a sua própria stack.
- Se o painel da esquerda devia ficar diferente (ex.: só a palavra "Gestão" em cinza), é um ajuste rápido.
