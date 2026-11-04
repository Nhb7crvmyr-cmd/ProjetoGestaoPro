# Relatório — Etapa 06: Funcionários

Data: 16/10/2026

## Resumo
- **O Dono cadastra funcionários** (nome, e-mail e telefone opcional) na nova página **Funcionários**.
  O Cognito cria a conta e envia um **convite por e-mail** com senha temporária (texto em português, vale 7 dias).
- O funcionário nasce **já ligado à empresa do Dono**: o `custom:empresaId` vem do token do Dono, nunca do formulário.
  Ele entra no grupo **Funcionario** e **não passa pelo onboarding**.
- **Primeiro acesso:** ao entrar com a senha temporária, o login mostra **"Crie sua senha"**, com o olho e o medidor de força
  (é a primeira senha que a pessoa define). Depois ele cai no Início da empresa.
- **Na lista, o Dono:**
  - vê a situação de cada um (Aguardando 1º acesso / Ativo / Bloqueado);
  - **bloqueia ou libera** (ao bloquear, as sessões são encerradas);
  - **reenvia o convite** para quem ainda não entrou.
- O menu **Funcionários** saiu de "Em breve" e aparece **só para o Dono**.
- A etiqueta de situação (`UserStatusBadge`) passou a ser um componente compartilhado: o painel do SuperAdmin também
  mostra "Aguardando 1º acesso".

## Regras de segurança aplicadas
- Todas as rotas exigem token válido (401 sem token) e o grupo **Dono** (403 para os outros).
- O funcionário é gravado na **partição da empresa** (`EMPRESA#<empresaId>` / `EMPLOYEE#<userId>`). Um Dono de outra
  empresa recebe **404** ao tentar bloquear ou reenviar convite, mesmo sabendo o id.
- Cada Lambda tem a sua role, só com o necessário (ex.: a lista só pode `Query` e `AdminGetUser`).

## Pacotes
Nenhum pacote novo.

## Arquivos criados/alterados
**Backend:**
- novos: `shared/employee.ts`, `shared/userIdSchema.ts`, `functions/funcionarios/createEmployee.ts`,
  `listEmployees.ts`, `setEmployeeStatus.ts`, `resendInvite.ts`
- alterados: `shared/keys.ts` (chave do funcionário), `functions/admin/setUserStatus.ts` (usa o `userIdSchema` compartilhado),
  `README.md`

**Infra:**
- novo: `lib/routes/funcionarios-routes.ts`
- alterados: `lib/auth-stack.ts` (e-mail de convite + validade de 7 dias da senha temporária), `bin/app.ts`

**Frontend:**
- novos:
  - `src/features/funcionarios/`: `pages/EmployeesPage.tsx`, `components/EmployeesTable.tsx`,
    `components/EmployeeFormModal.tsx`, `hooks/useEmployees.ts`, `services/employeeService.ts`, `schemas/employeeSchema.ts`
  - `src/features/auth/components/NewPasswordForm.tsx`
- movido: `UserStatusBadge.tsx` de `features/admin/components` para `components/ui` (+ estado "Aguardando 1º acesso")
- alterados:
  - `src/features/auth/`: `pages/LoginPage.tsx`, `services/authService.ts`, `schemas/authSchemas.ts`
  - `src/app/`: `router.tsx`, `layouts/navigation.ts`
  - `src/features/dashboard/pages/HomePage.tsx`, `src/features/admin/components/UsersTable.tsx`, `README.md`

## Recursos AWS (us-east-1)
| Ação | Nome | Tipo | Custo |
|---|---|---|---|
| Alterado | `gestao-pro-users` | Cognito: e-mail de convite + senha temporária de 7 dias (sem recriar) | US$ 0,00 |
| Criado | `GestaoPro-Funcionarios-Create` | Lambda `gestao-pro-funcionarios-create` (`AdminCreateUser`, `AdminAddUserToGroup`, `dynamodb:PutItem`) | US$ 0,00 |
| Criado | `GestaoPro-Funcionarios-List` | Lambda `gestao-pro-funcionarios-list` (`AdminGetUser`, `dynamodb:Query`) | US$ 0,00 |
| Criado | `GestaoPro-Funcionarios-SetStatus` | Lambda `gestao-pro-funcionarios-set-status` (`AdminEnable/DisableUser`, `AdminUserGlobalSignOut`, `dynamodb:GetItem/UpdateItem`) | US$ 0,00 |
| Criado | `GestaoPro-Funcionarios-ResendInvite` | Lambda `gestao-pro-funcionarios-resend-invite` (`AdminGetUser`, `AdminCreateUser`, `dynamodb:GetItem`) | US$ 0,00 |
| Atualizado | Lambdas `admin-*` e `empresa-*` | só reempacotadas (código compartilhado mudou) | US$ 0,00 |

Todas as Lambdas: Node 24, arm64, 256 MB, logs de 7 dias. E-mail do Cognito: grátis, até 50 por dia.

## Comandos executados
- `npx tsc --noEmit` (backend, infra, frontend), `npx vite build`, `npx cdk synth`, `npx cdk diff GestaoPro-Auth`
- `npx cdk deploy --all --concurrency 4`
- Testes: `aws lambda invoke` (eventos simulados) e `curl` (rotas sem token)
- Limpeza: `aws dynamodb delete-item` (1 item) e `aws cognito-idp admin-delete-user` (funcionário de teste)

## Testes feitos
| Teste | Esperado | Resultado |
|---|---|---|
| Dono cadastra funcionário (e-mail com maiúsculas) | 201, e-mail em minúsculas | ✅ |
| Mesmo e-mail de novo | 409 | ✅ |
| Funcionario tenta cadastrar / Dono sem empresa no token | 403 / 403 | ✅ |
| E-mail inválido / corpo inválido | 400 / 400 | ✅ |
| Dono A lista → vê o funcionário "aguardando 1º acesso"; Dono B lista → 0 | ✅ | ✅ |
| Dono B tenta bloquear / reenviar convite de funcionário de A | 404 / 404 | ✅ |
| Dono A bloqueia → libera | 200 / 200 (Cognito atualizado) | ✅ |
| Dono A reenvia convite | 200 | ✅ |
| Cognito do funcionário: `custom:empresaId` da empresa A + grupo Funcionario | gravados | ✅ |
| 4 rotas novas sem token | 401 | ✅ |

O funcionário de teste usou um e-mail `@example.com`, que não existe: os 2 convites não foram entregues, mas contam no
limite diário. Depois dos testes, o usuário e o registro foram **apagados**.

**Teste no navegador (feito pelo usuário em 16/10/2026): ✅ aprovado.**
- O Dono cadastrou a empresa "CARLOS SOLUCOES LTDA" (CNPJ) e ativou o plano Profissional (simulado).
- O Dono cadastrou um funcionário, o convite chegou por e-mail e o funcionário entrou com a senha temporária,
  passou pela tela "Crie sua senha" e acessou o sistema.

## Como testar
1. `cd frontend && npm run dev` → http://localhost:5173 (recarregue com **Cmd+Shift+R**).
2. Entre com a conta **Dono** (a que fez o onboarding na Etapa 5) → menu **Funcionários** → **+ Novo funcionário**.
   Use um **e-mail real** seu (dica: no Gmail, `seuemail+func1@gmail.com` chega na mesma caixa).
3. Confira o e-mail "Você foi convidado para o Gestão Pro" (veja o spam) e copie a senha temporária.
4. Numa **janela anônima**, entre com o e-mail do funcionário e a senha temporária → aparece **"Crie sua senha"**
   → defina a senha → você cai no **Início** da empresa (sem o botão de pagar plano e sem o menu Funcionários).
5. Volte à conta do Dono → **Atualizar** a página → o funcionário aparece como **Ativo**. Teste **Bloquear** e
   tente entrar de novo com o funcionário (o login é recusado). Depois **Libere**.

## Pendências / atenção
- O **limite de funcionários por plano** (Básico 2, Profissional 10) ainda não é aplicado: isso é a Etapa 11.
- Um funcionário bloqueado pode continuar usando um acesso já aberto por até 1 hora, até o token dele expirar.
  **Atualização (04/11/2026):** agora são no máximo 15 minutos (ver `ajuste-01-publicacao.md`).
- O e-mail do Cognito tem limite de **50 por dia** e pode cair no spam.
- Próxima etapa: **7 (Produtos e estoque)**. Só o Dono altera o estoque; o funcionário só visualiza.
