# Relatório — Etapa 05: Onboarding da empresa (CNPJ/CPF) + popup de pagamento simulado

Data: 16/10/2026

## Resumo
- **Login:** o medidor de força da senha saiu do login e ficou **só no cadastro**, a pedido do usuário.
- **Layout geral do sistema:** menu lateral em cinza escuro (mesmas cores do login), barra superior com nome,
  perfil e Sair, e menu tipo "gaveta" no celular. Os módulos futuros (Clientes, Produtos, Estoque, Vendas,
  Dashboard, Funcionários, Chat, Automações, Marketing, Relatórios) aparecem como **"Em breve"**.
- **Onboarding** (`/onboarding`): o usuário sem empresa só acessa esta tela. Nela ele:
  - escolhe **CNPJ** (empresa) ou **CPF** (pessoa física);
  - preenche documento com máscara e validação dos dígitos verificadores (inclui o **CNPJ alfanumérico**, válido desde 07/2026);
  - preenche razão social/nome, nome fantasia, e-mail e telefone;
  - preenche o **endereço pelo CEP** (ViaCEP), que completa rua, bairro, cidade e estado sozinho.
- Ao cadastrar: o backend grava a empresa, coloca o `empresaId` no usuário do Cognito e o põe no grupo **Dono**.
  O site renova o token e abre o **popup de planos**.
- **Popup de planos:** Básico R$ 49,90, Profissional R$ 99,90 e Premium R$ 199,90 → resumo → **pagamento
  simulado** (nenhuma cobrança, nenhum dado de cartão) → plano ativo por 30 dias.
- **Início** (`/inicio`): situação do plano (pendente, ativo até tal data ou vencido) e dados da empresa.
- **SuperAdmin:** nova página **Empresas**, com documento, dono, cidade e situação do plano.
- **Mudança na infra:** **uma stack por Lambda**. O modelo da stack da empresa chegou a 52,7 KB, acima do limite
  de 50 KB para publicar sem bucket S3. Agora cada Lambda tem a sua stack (a maior tem ~27 KB).

## Decisões tomadas (e por quê)
- **`custom:empresaId` no Cognito:** o CLAUDE.md exige que `empresaId` venha sempre do token. Só o backend grava esse
  atributo; o site pode ler, mas não escrever. O `cdk diff` confirmou que o User Pool **não** foi recriado.
- **Transação no DynamoDB:** 4 itens gravados juntos ou nenhum. Isso impede CNPJ/CPF repetido e usuário com 2 empresas.
- **Consulta de CNPJ automática (BrasilAPI): não usada.** O serviço respondeu 429 (limite de requisições) no teste,
  então o usuário digita os dados da empresa. O CEP usa o ViaCEP, que respondeu normalmente.
- **Recursos de cada plano:** são uma **proposta**. A liberação real das ferramentas por plano é a Etapa 11.

## Pacotes instalados (aprovados pelo usuário)
| Pasta | Pacote | Versão |
|---|---|---|
| backend | @aws-sdk/client-dynamodb | 3.1152.0 |
| backend | @aws-sdk/lib-dynamodb | 3.1152.0 |

0 vulnerabilidades. Na Lambda, o SDK já vem pronto (não vai no pacote).

## Arquivos criados/alterados
**Backend:**
- novos em `shared/`: `dynamo.ts`, `keys.ts`, `documents.ts`, `plans.ts`, `addressSchema.ts`, `company.ts`
- alterados em `shared/`: `auth.ts` (empresaId + `requireEmpresaId`), `node-globals.d.ts` (crypto)
- novos: `functions/empresa/createCompany.ts`, `getCompany.ts`, `activatePlan.ts`; `functions/admin/listCompanies.ts`
- alterados: `package.json`, `README.md`

**Infra:**
- novos: `lib/api-route-stack.ts`, `lib/routes/route-deps.ts`, `lib/routes/admin-routes.ts`, `lib/routes/empresa-routes.ts`
- alterados: `bin/app.ts`, `lib/auth-stack.ts` (atributo + leitura/escrita do client), `README.md`
- removidos: `lib/admin-stack.ts` (substituído por `routes/admin-routes.ts`)

**Frontend:**
- novos:
  - `src/utils/`: `formatters.ts`, `documents.ts`, `addressSchema.ts`
  - `src/services/cepService.ts`
  - `src/components/ui/`: `AddressFields.tsx`, `SelectField.tsx`, `Modal.tsx`
  - `src/app/layouts/`: `Sidebar.tsx`, `navigation.ts`
  - `src/features/auth/context/SessionContext.tsx`
  - `src/features/empresa/`: `pages/OnboardingPage.tsx`, `components/` (`DocumentTypeToggle`, `PlansModal`,
    `PlanStatusCard`, `CompanySummaryCard`, `RequireCompany`), `hooks/useCompany.ts`,
    `services/companyService.ts`, `schemas/companySchema.ts`, `constants/plans.ts`
  - `src/features/dashboard/pages/HomePage.tsx`
  - `src/features/admin/`: `pages/AdminCompaniesPage.tsx`, `components/CompaniesTable.tsx`, `hooks/useAdminCompanies.ts`
- alterados:
  - `src/app/router.tsx`, `src/app/layouts/AppLayout.tsx`, `src/types/auth.ts`
  - `src/features/auth/`: `components/RequireAuth.tsx`, `components/RequireGroup.tsx`, `services/authService.ts`, `pages/LoginPage.tsx`
  - `src/features/admin/`: `pages/AdminUsersPage.tsx`, `services/adminService.ts`
  - `README.md`
- removido: `src/features/auth/pages/WelcomePage.tsx` (substituída pela `HomePage`)

## Recursos AWS (us-east-1)
| Ação | Nome | Tipo | Custo |
|---|---|---|---|
| Alterado | `gestao-pro-users` | Cognito: + atributo `custom:empresaId` (36 caracteres) | US$ 0,00 |
| Alterado | `gestao-pro-web` | Cognito client: leitura/escrita de atributos definidas | US$ 0,00 |
| Apagado | `GestaoPro-Admin` | stack antiga (2 Lambdas), recriada abaixo | US$ 0,00 |
| Criado | `GestaoPro-Admin-ListUsers` | Lambda `gestao-pro-admin-list-users` + role + logs + rota | US$ 0,00 |
| Criado | `GestaoPro-Admin-SetUserStatus` | Lambda `gestao-pro-admin-set-user-status` + role + logs + rota | US$ 0,00 |
| Criado | `GestaoPro-Admin-ListCompanies` | Lambda `gestao-pro-admin-list-companies` (só `dynamodb:Query`) | US$ 0,00 |
| Criado | `GestaoPro-Empresa-Create` | Lambda `gestao-pro-empresa-create` (`dynamodb:PutItem`, `AdminUpdateUserAttributes`, `AdminAddUserToGroup`) | US$ 0,00 |
| Criado | `GestaoPro-Empresa-Get` | Lambda `gestao-pro-empresa-get` (só `dynamodb:GetItem`) | US$ 0,00 |
| Criado | `GestaoPro-Empresa-ActivatePlan` | Lambda `gestao-pro-empresa-activate-plan` (só `dynamodb:UpdateItem`) | US$ 0,00 |
| Alterado | `GestaoPro-Database` | só ganhou "exports" (nome e ARN da tabela) | US$ 0,00 |

Todas as Lambdas: Node 24, arm64, 256 MB, logs com 7 dias de retenção. DynamoDB e Lambda dentro do Always Free.
API Gateway: cerca de US$ 1,00 por milhão de chamadas (aprovado).

Também ficou registrado no API Gateway um "deployment" com status FAILED, de uma tentativa manual de republicar a API.
Ele não tem efeito nem custo. A tentativa foi feita por engano, por causa do erro no script de teste descrito abaixo.

## Comandos executados
- `curl` no ViaCEP e na BrasilAPI (teste de disponibilidade)
- `npm view` (versões) e `npm install` (backend)
- `npx tsc --noEmit` (backend, infra, frontend), `npx cdk diff GestaoPro-Auth`, `npx cdk synth`
- `aws cloudformation delete-stack --stack-name GestaoPro-Admin` (+ `wait`)
- `npx cdk deploy --all --concurrency 4`
- Testes: `aws lambda invoke` (eventos simulados) e `curl` na API
- Usuário de teste: `aws cognito-idp admin-create-user` / `admin-delete-user` (`teste-etapa5@example.com`)
- Limpeza: `aws dynamodb delete-item` (4 itens de teste)

## Testes feitos
| Teste | Esperado | Resultado |
|---|---|---|
| Cadastrar empresa (CNPJ válido, e-mail com espaço e maiúscula) | 201, e-mail limpo, CNPJ sem pontuação | ✅ |
| Cadastrar de novo com o mesmo usuário | 409 | ✅ |
| Mesmo CNPJ por outra pessoa | 409 | ✅ |
| CPF inválido / CEP inválido | 400 | ✅ |
| Usuário que já é Dono tenta onboarding | 409 | ✅ |
| Ler empresa (Dono) / outro empresaId / sem grupo | 200 / 404 / 403 | ✅ |
| Ativar plano como Funcionario / plano inexistente | 403 / 400 | ✅ |
| Ativar plano Profissional (Dono) | 200, ativo por 30 dias | ✅ |
| SuperAdmin lista empresas / Dono tenta listar | 200 / 403 | ✅ |
| Cognito do usuário de teste: `custom:empresaId` + grupo Dono | gravados | ✅ |
| Todas as 6 rotas sem token | 401 | ✅ |
| CORS de `localhost:5173` | permitido | ✅ |
| Validação de CPF/CNPJ (front e back), incluindo o CNPJ alfanumérico oficial `12.ABC.345/01DE-35` | correta | ✅ |

Depois dos testes, o usuário de teste e os 4 itens foram **apagados**. A tabela ficou com 0 itens.

**Erro no script de teste (não na API):** no zsh, o comando `set -- $r` não separa as palavras, então o `curl`
chamava só o endereço base da API e recebia 404. Com o script corrigido, todas as rotas responderam 401, como esperado.

**Não testado de ponta a ponta no navegador:** o fluxo completo pela tela (onboarding → popup → plano).
Os testes acima cobrem o backend; as telas precisam da conferência do usuário.

## Como testar
1. `cd frontend && npm run dev` → http://localhost:5173 (recarregue com **Cmd+Shift+R**).
2. Numa **janela anônima**, crie uma conta nova (use um e-mail real seu, por causa do código).
3. Ao entrar, você cai no **onboarding**:
   - CNPJ de teste: `11.222.333/0001-81`; CPF de teste: `529.982.247-25`;
   - digite um CEP (ex.: `01310-100`) e veja o endereço preencher sozinho;
   - complete e clique em **Cadastrar e escolher plano**.
4. O **popup de planos** abre: escolha um plano → **Confirmar pagamento simulado** → **Continuar**.
5. Em **Início**, veja o plano ativo e os dados da empresa. Teste o menu (e o ☰ no celular).
6. Com o usuário de teste (SuperAdmin): menu **Empresas** → a empresa nova aparece com o plano.

## Pendências / atenção
- O plano ainda **não bloqueia** nada. A liberação de ferramentas por plano é a Etapa 11.
- Se o Cognito falhar depois da transação no DynamoDB (muito raro), a empresa fica gravada sem o usuário virar Dono.
  Ainda não há tela para corrigir; dá para resolver com o SuperAdmin numa etapa futura.
- Como o CNPJ e o CPF de teste acima são conhecidos, só é possível cadastrar **uma empresa** com cada um.
- Próxima etapa: **6 (Funcionários)**. Depois: 7 Produtos e estoque, 8 Clientes (com CEP), 9 Vendas, 10 Dashboard.
