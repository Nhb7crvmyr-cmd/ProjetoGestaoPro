# backend

API do Gestão Pro: funções AWS Lambda em Node.js 24 + TypeScript (AWS SDK v3).

- `shared/planAccess.ts`: regra do plano (`getPlanAccess`, `requireFeature`, `requireEmployeeSlot`). **Use em toda ferramenta paga.**
- `shared/`: código comum (resposta HTTP, erros, leitura do token, validação com `zod/mini`, clientes
  Cognito e DynamoDB, chaves da tabela, CPF/CNPJ, endereço, planos).
- `functions/<modulo>/`: uma Lambda por arquivo.
  - `admin/`: `listUsers.ts`, `setUserStatus.ts`, `updateUserEmail.ts`, `listCompanies.ts`, `setCompanyPlan.ts`, `listCompanyCustomers.ts`, `transferCompanyCustomers.ts`
  - `empresa/`: `createCompany.ts`, `getCompany.ts`, `activatePlan.ts`
  - `funcionarios/`: `createEmployee.ts`, `listEmployees.ts`, `setEmployeeStatus.ts`, `resendInvite.ts`
  - `produtos/`: `createProduct.ts`, `listProducts.ts`, `updateProduct.ts`
  - `estoque/`: `createMovement.ts`, `listMovements.ts`
  - `clientes/`: `createCustomer.ts`, `listCustomers.ts`, `updateCustomer.ts`, `transferCustomers.ts`
  - `vendas/`: `createSale.ts`, `listSales.ts`, `requestCancelSale.ts`, `rejectCancelSale.ts`, `cancelSale.ts`

## Chaves da tabela (ver `shared/keys.ts`)
| Registro | pk | sk |
|---|---|---|
| Empresa | `EMPRESA#<empresaId>` | `PROFILE` |
| Trava de CNPJ/CPF | `DOCUMENT#<documento>` | `DOCUMENT` |
| Usuário → empresa | `USER#<userId>` | `COMPANY` |
| Lista do SuperAdmin | `COMPANIES` | `EMPRESA#<empresaId>` |
| Funcionário | `EMPRESA#<empresaId>` | `EMPLOYEE#<userId>` |
| Produto | `EMPRESA#<empresaId>` | `PRODUCT#<productId>` |
| Trava de SKU | `EMPRESA#<empresaId>` | `SKU#<sku>` |
| Movimento de estoque | `EMPRESA#<empresaId>` | `STOCKMOV#<data ISO>#<id>` |
| Cliente | `EMPRESA#<empresaId>` | `CUSTOMER#<customerId>` |
| Trava de documento do cliente | `EMPRESA#<empresaId>` | `CUSTDOC#<cpf/cnpj>` |
| Venda | `EMPRESA#<empresaId>` | `SALE#<saleId>` (o id começa com a data) |
| Contador de vendas | `EMPRESA#<empresaId>` | `COUNTER#SALE` |
| Pedido de cancelamento pendente | `EMPRESA#<empresaId>` | `CANCELREQ#<saleId>` |

O empacotamento e o deploy são feitos pela infra (`infra/lib/lambda-bundler.ts`).
Checar tipos: `npm run typecheck` (dentro de `backend/`).
