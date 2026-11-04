# Relatório — Etapa 09: Vendas

Data: 16/10/2026

## Resumo
- **Nova venda** (`/vendas/nova`, Dono e Funcionário):
  1. **cliente:** busca por nome, telefone ou CPF. O funcionário só vê os clientes dele;
  2. **produtos:** lista com busca por nome/SKU, mostrando **preço e quanto há disponível**. Sem estoque, o botão fica desligado;
  3. **resumo:** quantidade com − / + (sem passar do estoque), remover item, **desconto** (R$), **forma de pagamento**
     (Pix, dinheiro, crédito, débito, boleto, outro), observações e total. No fim aparece "Venda #N registrada!".
- **Regras do CLAUDE.md:**
  - **baixa automática:** a mesma transação grava a venda, baixa o estoque de cada produto e registra
    "Venda #N · Cliente" no histórico (tudo ou nada);
  - **sem estoque, a venda é bloqueada;**
  - **o funcionário** vende só para os **clientes dele** e vê só as **vendas dele** (o vendedor vem sempre do token).
- **Segurança de preço:** o navegador manda só o produto e a quantidade. Preço, nome e totais são calculados no backend
  com os dados do banco. No teste, um "preço falso" enviado foi ignorado.
- **Número sequencial** por empresa (#1, #2...), gerado com um contador atômico (`ADD`) no DynamoDB.
- **Vendas** (`/vendas`):
  - mês com setas ‹ ›;
  - resumo: **total vendido, nº de vendas, ticket médio e canceladas**;
  - filtro por vendedor (Dono), tabela e detalhes da venda.
- **Cancelamento com aprovação** (pedido do usuário):
  - **funcionário:** "Solicitar cancelamento" com motivo. A venda **não some**: fica "Aguardando cancelamento",
    continua valendo e o estoque continua baixado;
  - **Dono:** vê o quadro "N pedidos de cancelamento aguardando sua decisão" (de qualquer mês) e escolhe:
    - **Aprovar:** a venda é cancelada e o estoque volta (histórico "Cancelamento da venda #N: motivo");
    - **Recusar e devolver ao vendedor:** escreve uma orientação (ex.: "Ofereça 10% de desconto"). A venda volta a
      "Concluída", com a etiqueta "Cancelamento recusado", e o vendedor vê a orientação na venda;
  - **Dono** também pode **cancelar direto** uma venda concluída, com motivo.
- **Ajuste pedido na Etapa 8:** a coluna "Atendido por" mostra "Transferido por **X** em dd/mm · de A para B".
  O backend passou a guardar o **nome** de quem transferiu. Transferências antigas mostram "o Dono" ou "o suporte".

## Decisões
- **Quem decide o cancelamento é o Dono.** Não existe perfil "Supervisor"; criar um seria uma mudança de arquitetura,
  a ser combinada.
- **"Aguardando cancelamento" conta no total vendido** até o Dono decidir.
- **Itens por venda:** até 30 produtos diferentes (cada item usa 2 gravações na transação; o limite do DynamoDB é 100).
- **Capacidade do DynamoDB (Provisionado 5/5, custo zero):** uma venda com 3 produtos usa cerca de 14 unidades de escrita.
  Funciona com folga por causa da "reserva" (burst) de até 5 minutos de capacidade não usada. Só dezenas de vendas no
  mesmo minuto dariam "tente de novo", sem cobrança.
- **Período das vendas no fuso do usuário:** o site manda o início e o fim do mês já convertidos para UTC.

## Pacotes
Nenhum pacote novo.

## Arquivos criados/alterados
**Backend:**
- novos: `shared/sale.ts`, `functions/vendas/createSale.ts`, `listSales.ts`, `requestCancelSale.ts`,
  `rejectCancelSale.ts`, `cancelSale.ts`
- alterados:
  - `shared/keys.ts`: venda, contador, pedido de cancelamento
  - `shared/stock.ts`: `saleId` no histórico
  - `shared/customerTransfer.ts`, `shared/customer.ts`, `functions/clientes/transferCustomers.ts`,
    `functions/admin/transferCompanyCustomers.ts`: nome de quem transferiu
  - `README.md`

**Infra:**
- novo: `lib/routes/vendas-routes.ts`
- alterado: `bin/app.ts`

**Frontend:**
- novos:
  - `src/features/vendas/`: `pages/SalesPage.tsx`, `pages/NewSalePage.tsx`, `components/CustomerPicker.tsx`,
    `components/ProductPicker.tsx`, `components/CartItems.tsx`, `components/SalesTable.tsx`,
    `components/SaleDetailsModal.tsx`, `components/SaleActionForm.tsx`, `hooks/useSales.ts`,
    `services/saleService.ts`, `constants/paymentMethods.ts`, `utils/period.ts`
  - `src/components/ui/TransferInfo.tsx`
- alterados:
  - `src/app/`: `router.tsx`, `layouts/navigation.ts`, `layouts/Sidebar.tsx` (Vendas ativo também em /vendas/nova)
  - `src/features/clientes/` e `src/features/admin/`: tabelas, serviços (linha da transferência)
  - `src/features/dashboard/pages/HomePage.tsx`, `README.md`

## Recursos AWS (us-east-1)
| Ação | Stack | Lambda | Permissões | Custo |
|---|---|---|---|---|
| Criado | `GestaoPro-Vendas-Create` | `gestao-pro-vendas-create` | `dynamodb:GetItem/UpdateItem/PutItem` | US$ 0,00 |
| Criado | `GestaoPro-Vendas-List` | `gestao-pro-vendas-list` | `dynamodb:Query` | US$ 0,00 |
| Criado | `GestaoPro-Vendas-RequestCancel` | `gestao-pro-vendas-request-cancel` | `dynamodb:GetItem/UpdateItem/PutItem` | US$ 0,00 |
| Criado | `GestaoPro-Vendas-RejectCancel` | `gestao-pro-vendas-reject-cancel` | `dynamodb:GetItem/UpdateItem/DeleteItem` | US$ 0,00 |
| Criado | `GestaoPro-Vendas-Cancel` | `gestao-pro-vendas-cancel` | `dynamodb:GetItem/UpdateItem/PutItem/DeleteItem` | US$ 0,00 |
| Atualizado | `Clientes-Transfer`, `Admin-TransferCompanyCustomers` | guardam o nome de quem transferiu | — | US$ 0,00 |

## Comandos executados
- `npx tsc --noEmit` (backend, infra, frontend), `npx vite build`, `npx cdk synth`
- `npx cdk deploy --all --concurrency 4`
- Testes: `aws lambda invoke` (empresa fictícia `5a1e5000-...`, 1 Dono e 2 funcionários) e `curl` (rotas sem token)
- Limpeza: `aws dynamodb query` + `delete-item` (20 itens de teste)

## Testes feitos (25 de 25 ✅)
| Grupo | O que foi testado |
|---|---|
| Vender | venda com 2 produtos + desconto: totais pelo **preço do banco** (preço falso ignorado) e estoque baixado; funcionário vendendo para cliente de outro → 404; sem estoque → 400; produto inativo → 400; desconto maior que o total → 400; sem itens / pagamento inválido → 400; item repetido somado; Dono vende para cliente de funcionário → 201; números #1, #2, #3 |
| Listar | funcionário vê só as dele; Dono vê todas (mais recentes primeiro); período maior que 1 ano → 400 |
| Pedido de cancelamento | funcionário pede: status "aguardando" e estoque **sem mudar**; pedir de novo → 400; outro funcionário → 404; Dono na rota de pedido → 403; o pedido aparece para o Dono |
| Recusar | Dono recusa com orientação: volta a "concluída" e o estoque não muda; funcionário tentando recusar → 403; recusar sem pedido → 400 |
| Aprovar / cancelar | funcionário pede de novo; funcionário tentando cancelar direto → 403; Dono aprova: cancelada, pedido some e **estoque volta**; Dono cancela direto; cancelar de novo → 400; id inválido → 400 |
| Histórico de estoque | "Venda #N · Cliente" e "Cancelamento da venda #N: motivo", com antes → depois corretos (Camiseta 10 → 8 no fim) |
| API | 5 rotas sem token → 401 |

**Teste no navegador (feito pelo usuário em 16/10/2026): ✅ aprovado.**

## Como testar
1. `cd frontend && npm run dev` → http://localhost:5173 (recarregue com **Cmd+Shift+R**).
2. **Funcionário:** Vendas → **+ Nova venda** → escolha um cliente dele → adicione produtos → pagamento → **Finalizar**.
   Veja o estoque baixar em Produtos.
3. **Funcionário:** abra a venda → **Solicitar cancelamento** → motivo.
4. **Dono:** em Vendas aparece o quadro de pedidos → **Analisar** → teste **Recusar e devolver** (com orientação).
   Volte ao funcionário e abra a venda para ver a orientação. Peça de novo e, como Dono, **Aprove**: o estoque volta.
5. **Dono:** em Estoque, veja no histórico "Venda #N" e "Cancelamento da venda #N".
6. Clientes: a coluna "Atendido por" agora mostra quem fez a transferência.

## Pendências / atenção
- Editar uma venda (ex.: aplicar um desconto depois da recusa) ainda não existe. Hoje o Dono orienta e, se precisar,
  cancela e o vendedor lança uma nova venda.
- Próxima etapa: **10 (Dashboard)**, com vendas do mês, quem comprou e o fluxo do mês em gráficos (Recharts).
