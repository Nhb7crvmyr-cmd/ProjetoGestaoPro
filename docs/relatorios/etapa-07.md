# Relatório — Etapa 07: Produtos e estoque

Data: 16/10/2026

## Resumo
- **Produtos** (menu "Produtos", para Dono e Funcionário):
  - **campos:** nome, SKU (opcional e **único na empresa**), categoria, unidade (UN, CX, PC, PCT, PAR, KIT), preço de venda,
    custo (opcional), estoque mínimo e ativo/inativo;
  - **o Dono** cadastra (com **estoque inicial** opcional, que entra no histórico), edita e desativa. Produto **não é apagado**,
    para não quebrar o histórico das vendas;
  - **o funcionário** só consulta e **não recebe o custo**: o backend tira esse campo da resposta;
  - **filtros:** busca por nome ou SKU, categoria, "só estoque baixo" e "mostrar inativos", com alerta de estoque baixo ou zerado.
- **Estoque** (só o Dono, como manda o CLAUDE.md):
  - **movimentos:** **Entrada**, **Saída** e **Ajuste** (inventário), com **prévia** do resultado ("10 → 15");
  - **regras:** saída e ajuste exigem motivo, e a saída não deixa o estoque ficar negativo;
  - **histórico:** cada movimento guarda tipo, variação, estoque antes e depois, motivo, quem fez e quando;
  - **página "Estoque":** resumo (produtos ativos, unidades, **valor do estoque a preço de custo**, itens para repor),
    lista "Para repor" com o botão **Dar entrada** e as últimas movimentações;
  - **histórico por produto:** botão **Histórico** na tabela de produtos.
- **Trava otimista no estoque:** o movimento só é gravado se o estoque não mudou desde a leitura (condição
  `stock = valor lido`). Se duas operações acontecerem ao mesmo tempo, uma recebe "tente novamente" e nada é gravado.
  A edição de produto tem a mesma proteção, para não "apagar" um movimento feito no meio.
- O estoque **só muda por movimento**: a edição do produto não mexe na quantidade.

## Decisões
- **Unidades só inteiras** (UN, CX, PC, PCT, PAR, KIT). Peso (KG) e volume (L) com decimais ficaram de fora para simplificar.
  Dá para incluir depois, se quiser.
- **"Estoque" no menu só para o Dono.** O funcionário vê as quantidades na página Produtos (regra do CLAUDE.md:
  "vê produtos e quantidades, mas não altera o estoque").
- **Histórico filtrado por produto:** usa um filtro na leitura (FilterExpression), limitado a 100 resultados e 5 páginas,
  para proteger a capacidade da tabela. Com muitos dados, o ideal seria um índice próprio (GSI). Isso consome capacidade
  do Always Free (25/25), então só vale a pena se for necessário.

## Pacotes
Nenhum pacote novo.

## Arquivos criados/alterados
**Backend:**
- novos: `shared/product.ts`, `shared/productSchema.ts`, `shared/stock.ts`, `functions/produtos/createProduct.ts`,
  `listProducts.ts`, `updateProduct.ts`, `functions/estoque/createMovement.ts`, `listMovements.ts`
- alterados: `shared/keys.ts` (chaves de produto, SKU e movimento), `shared/dynamo.ts` (tipo `TransactItems`), `README.md`

**Infra:**
- novos: `lib/routes/policies.ts` (atalhos de permissão), `lib/routes/produtos-routes.ts`, `lib/routes/estoque-routes.ts`
- alterados: `bin/app.ts`, `lib/routes/funcionarios-routes.ts` (passou a usar `policies.ts`)

**Frontend:**
- novos:
  - `src/features/produtos/`: `pages/ProductsPage.tsx`, `components/ProductsTable.tsx`,
    `components/ProductFormModal.tsx`, `components/StockBadge.tsx`, `hooks/useProducts.ts`,
    `services/productService.ts`, `schemas/productSchema.ts`, `constants/units.ts`
  - `src/features/estoque/`: `pages/StockPage.tsx`, `components/StockMovementModal.tsx`,
    `components/StockHistoryModal.tsx`, `components/MovementsTable.tsx`, `hooks/useStock.ts`, `services/stockService.ts`
- alterados:
  - `src/utils/formatters.ts`: máscara de dinheiro e data/hora
  - `src/app/`: `router.tsx`, `layouts/navigation.ts`
  - `src/features/dashboard/pages/HomePage.tsx`, `README.md`

## Recursos AWS (us-east-1)
| Ação | Stack | Lambda | Permissões | Custo |
|---|---|---|---|---|
| Criado | `GestaoPro-Produtos-Create` | `gestao-pro-produtos-create` | `dynamodb:PutItem` | US$ 0,00 |
| Criado | `GestaoPro-Produtos-List` | `gestao-pro-produtos-list` | `dynamodb:Query` | US$ 0,00 |
| Criado | `GestaoPro-Produtos-Update` | `gestao-pro-produtos-update` | `dynamodb:GetItem/PutItem/DeleteItem` | US$ 0,00 |
| Criado | `GestaoPro-Estoque-CreateMovement` | `gestao-pro-estoque-create-movement` | `dynamodb:GetItem/UpdateItem/PutItem` | US$ 0,00 |
| Criado | `GestaoPro-Estoque-ListMovements` | `gestao-pro-estoque-list-movements` | `dynamodb:Query` | US$ 0,00 |
| Atualizado | Lambdas `admin-*`, `empresa-*` e `funcionarios-*` | só reempacotadas (código compartilhado mudou) | — | US$ 0,00 |

Todas as Lambdas: Node 24, arm64, 256 MB, logs de 7 dias. Cada uma tem a sua própria stack (a maior tem ~31 KB).

## Comandos executados
- `npx tsc --noEmit` (backend, infra, frontend), `npx vite build`, `npx cdk synth`
- `npx cdk deploy --all --concurrency 4`
- Testes: `aws lambda invoke` (eventos simulados, empresa fictícia `7e570000-...0001`) e `curl` (rotas sem token e CORS)
- Limpeza: `aws dynamodb query` + `delete-item` (9 itens de teste)

## Testes feitos (28 de 28 ✅)
| Grupo | O que foi testado |
|---|---|
| Cadastro | estoque inicial vira histórico; SKU em maiúsculas; SKU repetido → 409; Funcionario → 403; preço negativo, quantidade com vírgula e unidade inválida → 400 |
| Listagem | Dono vê custo; **Funcionario não recebe o custo**; outra empresa vê 0 produtos |
| Movimentos | saída 10→7; saída maior que o estoque → 400; saída sem motivo → 400; entrada de 0 → 400; ajuste para o mesmo valor → 400; ajuste 7→12; entrada 12→17; Funcionario → 403; outra empresa → 404 |
| Histórico | ordem do mais novo para o mais velho, com antes → depois e motivo; filtro por produto; Funcionario → 403 |
| Edição | troca de SKU libera o antigo (outro produto pôde usar `CAM-001`); SKU já usado → 409; desativar; o estoque **não muda** na edição; outra empresa → 404; Funcionario → 403 |
| API | 5 rotas sem token → 401; CORS permite PUT |

**Teste no navegador (feito pelo usuário em 16/10/2026): ✅ aprovado.**
O Dono criou produtos e fez entradas, saídas e ajustes de estoque com quantidades variadas. Na conta do funcionário,
a consulta funcionou sem acesso ao custo nem ao estoque.

**Não testado:** a trava otimista com duas operações realmente simultâneas (é difícil provocar no teste manual).
A lógica está nas condições das transações (`stock = :previousStock`).

## Como testar
1. `cd frontend && npm run dev` → http://localhost:5173 (recarregue com **Cmd+Shift+R**).
2. Como **Dono**: menu **Produtos** → **+ Novo produto**. Cadastre 2 ou 3 produtos com estoque inicial e estoque mínimo.
3. Na linha de um produto, clique em **Movimentar**: teste Entrada, Saída (tente tirar mais do que tem) e Ajuste.
4. Clique em **Histórico** para ver os movimentos do produto. Depois abra o menu **Estoque** (resumo e "Para repor").
5. Como **funcionário** (janela anônima): menu **Produtos** → aparecem preço e estoque, **sem custo e sem botões**;
   o menu Estoque não aparece.

## Pendências / atenção
- A **baixa automática** do estoque na venda (e o bloqueio de venda sem estoque) é a Etapa 9. O tipo "Venda" já está
  previsto no histórico.
- Próxima etapa: **8 (Clientes)**, com cadastro completo e endereço pelo CEP. O funcionário vê só os clientes dele.
