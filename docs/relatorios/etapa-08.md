# Relatório — Etapa 08: Clientes

Data: 16/10/2026

## Resumo
- **Ajuste pedido na Etapa 7:** no cadastro de produto, a **Categoria** virou uma lista com as categorias já usadas
  (escolhe uma ou digita uma nova). Usa o `<datalist>` do próprio navegador, sem pacote novo.
- **Clientes** (menu "Clientes", para Dono e Funcionário):
  - **cadastro completo:** nome e telefone/WhatsApp (obrigatórios); CPF ou CNPJ (opcional, com máscara e dígitos
    verificadores), e-mail, data de nascimento, observações e **endereço pelo CEP** (ViaCEP);
  - **documento repetido:** o mesmo CPF/CNPJ não pode estar em dois clientes da mesma empresa (trava `CUSTDOC#`);
  - **na lista:** telefone com **link do WhatsApp** (`wa.me`), busca por nome, telefone, e-mail ou documento, e
    filtro "mostrar inativos";
  - **desativar/reativar:** o cliente nunca é apagado, porque as vendas da Etapa 9 vão apontar para ele.
- **Regra "Funcionário só acessa os clientes dele"** (CLAUDE.md):
  - **responsável:** quem cadastra vira o responsável (`sellerId`, o "vendedorId" das regras), **sempre lido do token**;
  - **funcionário:** lista, vê e edita só os dele. O cliente de outro responde **404**, para ele nem saber que existe;
  - **Dono:** vê e edita todos, com a coluna **"Atendido por"** e um filtro por atendente;
  - **edição:** não troca o responsável. Mesmo enviando um `sellerId` falso, o backend ignora.
- O token agora também fornece o **nome** do usuário ao backend (usado em "Atendido por").

## Pacotes
Nenhum pacote novo.

## Arquivos criados/alterados
**Backend:**
- novos: `shared/customer.ts`, `shared/customerSchema.ts`, `functions/clientes/createCustomer.ts`,
  `listCustomers.ts`, `updateCustomer.ts`
- alterados:
  - `shared/keys.ts`: chaves de cliente e trava de documento
  - `shared/auth.ts`: nome do usuário
  - `shared/addressSchema.ts`: mensagem "Campo obrigatório: X". Vai para a AWS na próxima publicação
  - `README.md`

**Infra:**
- novo: `lib/routes/clientes-routes.ts`
- alterado: `bin/app.ts`

**Frontend:**
- novos:
  - `src/components/ui/TextAreaField.tsx`
  - `src/features/clientes/`: `pages/CustomersPage.tsx`, `components/CustomersTable.tsx`,
    `components/CustomerFormModal.tsx`, `hooks/useCustomers.ts`, `services/customerService.ts`, `schemas/customerSchema.ts`
- alterados:
  - `src/components/ui/Modal.tsx`: tamanho "2xl"
  - `src/features/produtos/`: `components/ProductFormModal.tsx` e `pages/ProductsPage.tsx` (lista de categorias)
  - `src/app/`: `router.tsx`, `layouts/navigation.ts`
  - `src/features/dashboard/pages/HomePage.tsx`, `README.md`

## Recursos AWS (us-east-1)
| Ação | Stack | Lambda | Permissões | Custo |
|---|---|---|---|---|
| Criado | `GestaoPro-Clientes-Create` | `gestao-pro-clientes-create` | `dynamodb:PutItem` | US$ 0,00 |
| Criado | `GestaoPro-Clientes-List` | `gestao-pro-clientes-list` | `dynamodb:Query` | US$ 0,00 |
| Criado | `GestaoPro-Clientes-Update` | `gestao-pro-clientes-update` | `dynamodb:GetItem/PutItem/DeleteItem` | US$ 0,00 |
| Atualizado | todas as outras Lambdas | só reempacotadas (o código compartilhado agora lê o nome do token) | — | US$ 0,00 |

## Comandos executados
- `npx tsc --noEmit` (backend, infra, frontend), `npx vite build`, `npx cdk synth`
- `npx cdk deploy --all --concurrency 4`
- Testes: `aws lambda invoke` (empresa fictícia, 1 Dono e 2 funcionários fictícios) e `curl` (rotas sem token)
- Limpeza: `aws dynamodb query` + `delete-item` (4 itens de teste)

## Testes feitos (21 de 21 ✅)
| Grupo | O que foi testado |
|---|---|
| Cadastro | completo (CPF, e-mail com espaço/maiúscula, endereço) → 201; `sellerId` falso no corpo é **ignorado**; só nome + telefone → 201 |
| Validações | CPF repetido → 409; CPF inválido, documento sem tipo, telefone sem DDD, nascimento no futuro, 31/02, e-mail inválido e endereço sem cidade → 400 |
| Quem vê o quê | Dono vê os 2 (com "Atendido por"); Funcionário 1 vê só o dele; Funcionário 2 vê 0; outra empresa vê 0 |
| Edição | Funcionário 2 edita cliente do 1 → 404; Funcionário 1 edita cliente do Dono → 404; Funcionário 1 edita o dele (o responsável não muda, mesmo enviando outro); o CPF removido fica livre; Dono desativa cliente do funcionário; outra empresa → 404; id inválido → 400 |
| API | 3 rotas sem token → 401 |

## Como testar
1. `cd frontend && npm run dev` → http://localhost:5173 (recarregue com **Cmd+Shift+R**).
2. **Produtos** → **+ Novo produto**: clique em Categoria e veja a lista das categorias já usadas.
3. **Clientes** → **+ Novo cliente** (como Dono): preencha tudo, incluindo o CEP (o endereço completa sozinho).
   Clique no telefone da lista: abre o WhatsApp.
4. Como **funcionário** (janela anônima): cadastre um cliente. Ele vê **só esse**. Volte ao Dono: aparecem
   todos, com "Atendido por".
5. Teste **Editar** e **Desativar/Reativar**.

## Pendências / atenção
- Próxima etapa: **9 (Vendas)**, com baixa automática no estoque e venda bloqueada sem estoque. O funcionário registra
  vendas só para os clientes dele.

---

## Complemento (pedido do usuário antes da Etapa 9): transferência de atendimento

### O que foi feito
- **Dono** (página Clientes):
  - botão **Transferir** em cada cliente;
  - ao filtrar por um atendente, aparece **"Transferir todos (N)"** (ex.: funcionário desligado ou ausente);
  - a coluna "Atendido por" mostra "Transferido de X em dd/mm".
- **SuperAdmin** (Empresas → botão **Clientes**), para suporte:
  - **busca** por nome, telefone, e-mail ou documento;
  - **dados completos** do cliente: telefone/WhatsApp, e-mail, documento e cidade;
  - atendente com **nome e e-mail** (etiquetas Dono / Suporte / Bloqueado);
  - **"Transferir para…" + botão na própria linha**, ou em lote pelas caixinhas;
  - o próprio SuperAdmin pode **assumir o atendimento** ("Fulano (suporte)").
- **Destinos aceitos:** o Dono, um funcionário **ativo** da empresa ou, só pelo painel admin, o SuperAdmin.
  Funcionário bloqueado é recusado ("O acesso de X está bloqueado...").
- **Registro:** cada cliente guarda a última transferência (de quem, para quem, quem fez, com que papel e quando).
- **Na hora:** o atendente anterior deixa de ver o cliente, e o novo passa a ver. O Dono continua vendo todos.
- **Correções de texto:** "Campo obrigatório: X" (no lugar de "Cidade é obrigatório") e a mensagem de funcionário bloqueado.

### Mudança de regra (aprovada pelo usuário em 16/10/2026)
"O admin pode ver sim, ele tem acesso a tudo para poder auxiliar." O `CLAUDE.md` foi atualizado:
- **Perfis:** o SuperAdmin tem acesso aos dados das empresas (ex.: clientes) para suporte e pode transferir atendimento,
  inclusive para si mesmo.
- **Segurança:** exceção para as rotas `/admin/*`, exclusivas do SuperAdmin, com a empresa indicada na URL.

### Arquivos
- **Backend:**
  - novos: `shared/customerTransfer.ts`, `shared/companyOwner.ts`, `functions/clientes/transferCustomers.ts`,
    `functions/admin/listCompanyCustomers.ts`, `functions/admin/transferCompanyCustomers.ts`
  - alterados: `shared/customer.ts` (lastTransfer), `shared/addressSchema.ts` (mensagem)
- **Infra:** `lib/routes/clientes-routes.ts` e `lib/routes/admin-routes.ts` (rotas novas)
- **Frontend:**
  - novos: `features/clientes/components/TransferCustomersModal.tsx` (genérico, usado pelo Dono e pelo SuperAdmin),
    `features/admin/pages/AdminCompanyCustomersPage.tsx`, `features/admin/components/CompanyCustomersTable.tsx`,
    `features/admin/hooks/useAdminCompanyCustomers.ts`
  - alterados: `features/clientes/` (página, tabela, serviço, hooks), `features/admin/components/CompaniesTable.tsx`
    (botão Clientes), `features/admin/services/adminService.ts`, `features/funcionarios/hooks/useEmployees.ts`,
    `app/router.tsx`
- **Outros:** `CLAUDE.md` e READMEs

### Recursos AWS (us-east-1)
| Ação | Stack | Lambda | Permissões | Custo |
|---|---|---|---|---|
| Criado | `GestaoPro-Clientes-Transfer` | `gestao-pro-clientes-transfer` | `dynamodb:GetItem/UpdateItem` | US$ 0,00 |
| Criado | `GestaoPro-Admin-ListCompanyCustomers` | `gestao-pro-admin-list-company-customers` | `dynamodb:GetItem/Query`, `cognito-idp:AdminGetUser` | US$ 0,00 |
| Criado | `GestaoPro-Admin-TransferCompanyCustomers` | `gestao-pro-admin-transfer-company-customers` | `dynamodb:GetItem/UpdateItem`, `cognito-idp:AdminGetUser` | US$ 0,00 |
| Atualizado | todas as Lambdas | reempacotadas (mensagem "Campo obrigatório") | — | US$ 0,00 |

### Testes (19 de 19 ✅, com empresas fictícias, apagadas depois)
- **Dono:**
  - transfere de funcionário para si e o funcionário deixa de ver o cliente;
  - destino bloqueado → 400; destino de fora da empresa → 404;
  - funcionário tentando transferir → 403;
  - lote com cliente de outra empresa → conta como "não encontrado";
  - lista vazia ou com mais de 100 → 400;
  - não pode transferir para o SuperAdmin → 404.
- **SuperAdmin:**
  - lista com dados completos e atendentes com e-mail;
  - Dono usando rota do admin → 403; empresa inexistente → 404; id inválido → 400;
  - transfere em lote (registrado como "SuperAdmin");
  - assume o cliente: o funcionário deixa de ver e o Dono continua vendo;
  - devolve o cliente; destino bloqueado → 400.
- **API:** as 3 rotas novas sem token → 401.
- Leitura de conferência na empresa real (sem alterar nada): Dono e funcionário aparecem com e-mail.

### Como testar
1. **Como Dono** → Clientes → **Transferir** num cliente. Filtre por um atendente → **Transferir todos (N)**.
2. **Como SuperAdmin** → Empresas → **Clientes** (na linha da empresa):
   - digite um nome na busca;
   - escolha em "Transferir para…" → **Transferir**;
   - teste também "você (suporte)" e a transferência em lote pelas caixinhas.

---

## Ajustes pedidos pelo usuário (só no site, sem mudança na AWS)
1. **Cadastro de cliente mais "deitado":** o popup ficou mais largo (`4xl`), com **dados do cliente à esquerda** e
   **endereço à direita** no computador. Fica bem mais baixo e não toma a tela inteira. No celular continua em uma coluna.
2. **"Transferir para…" sem risco de erro:** a caixa não guarda mais a escolha. Ao escolher um nome, aparece na hora
   "Transferir X para Y?". Confirmando ou cancelando, ela **volta sozinha** para "Transferir para…". O botão separado saiu.
3. **Menu "Clientes" do SuperAdmin** (`/admin/clientes`):
   - **seleciona a empresa** (fica na URL: recarregar a página mantém a escolha);
   - **filtra pelo atendente**;
   - **busca** por nome, CPF, telefone ou e-mail;
   - atalho **"Atribuídos a mim (N)"** mostra os clientes que o SuperAdmin assumiu na empresa.

   A mesma tela continua acessível pelo botão "Clientes" na lista de Empresas.

**Arquivos:**
- novos: `features/admin/components/CompanyCustomersPanel.tsx` (painel reutilizado pelas duas páginas),
  `features/admin/pages/AdminCustomersPage.tsx`
- alterados: `features/admin/pages/AdminCompanyCustomersPage.tsx`, `features/admin/components/CompanyCustomersTable.tsx`,
  `features/clientes/components/CustomerFormModal.tsx`, `app/router.tsx`, `app/layouts/navigation.ts`

**Limitação:** "Atribuídos a mim" funciona **por empresa**. Uma lista única com os clientes assumidos em todas as
empresas exigiria uma rota nova no backend.
