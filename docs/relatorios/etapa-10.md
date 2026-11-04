# Relatório — Etapa 10: Dashboard (e ajustes de visual, perfil e Supervisor)

Data: 16/10/2026

## Resumo
- **Dashboard** (`/dashboard`, Supervisor e Funcionário), com seletor de mês:
  - **4 cartões:** vendido no mês, nº de vendas (e unidades), ticket médio e clientes que compraram. Cada um traz
    a **etiqueta de variação contra o mês anterior** (ícone + sinal + %, nunca só a cor), e os dois primeiros têm uma
    **mini linha** (sparkline) com o desenho do mês;
  - **Fluxo do mês:** área suave com degradê (Recharts), linha-guia e dica ao passar o mouse, "Melhor dia" e
    "Média por dia", mais a opção "Ver em tabela";
  - **rankings em lista:** posição 01, 02..., nome, quantidade, valor, % do total e uma linha fina de progresso.
    Substituem as barras de gráfico, de que o usuário não gostou. São eles: Mais vendidos, Equipe (Supervisor),
    Formas de pagamento e Melhores clientes;
  - **Quem comprou:** últimas vendas, com cliente, o que levou, data, nº da venda, vendedor e total;
  - **o funcionário** vê só os números dele (o backend já filtra as vendas).
- **Não precisou de backend novo:** o dashboard usa a rota de vendas que já existia (mês atual + mês anterior).
- **"Dono" aparece como "Supervisor"** em todas as telas. O nome fica centralizado em `ROLE_LABELS`; o grupo no Cognito
  continua "Dono", e as permissões não mudaram. A decisão está registrada no CLAUDE.md.
- **Botões de verdade** na venda: Aprovar cancelamento (vermelho), Recusar e devolver (marca), Solicitar e
  Cancelar venda (contorno vermelho).
- **Meu perfil** (`/perfil`, todos): cartão com nome, **cargo · área**, e-mail, empresa e perfil de acesso, e um
  formulário para editar nome, cargo e área. A barra do topo mostra "Nome / Cargo · Área" e leva ao perfil.
  - Cargo e área ficam no **Cognito** (atributos `custom:jobTitle` e `custom:department`), editados direto pelo site,
    **sem Lambda**. Isso mudou em relação ao plano inicial de 2 Lambdas: é mais simples e tem o mesmo custo zero.
- **E-mail travado; só o suporte troca:**
  - na tela o e-mail não é editável;
  - novo botão **"Alterar e-mail"** no painel do SuperAdmin (Usuários). Ele troca o login no Cognito (já confirmado)
    e corrige o e-mail copiado no funcionário e na lista de empresas;
  - **proteção no Cognito** ("manter o e-mail antigo até confirmar o novo"): mesmo que alguém tente trocar o próprio
    e-mail por fora do site, só vale depois de confirmar um código enviado ao novo endereço.
- **Visual mais "clean":**
  - **cinza neutro** (`zinc`) no lugar do cinza azulado (`slate`) em todo o sistema;
  - **menu lateral** grafite (`zinc-950`), item ativo com um traço fino na cor da marca;
  - **ícones SVG próprios** (`components/ui/Icon.tsx`) no lugar de todos os emojis e símbolos (✓ ✕ ○ ▲ ▼ ‹ › ← → 👍);
  - **seletor de mês** com ícones, compartilhado entre Vendas e Dashboard.

## Problemas encontrados (e o que foi feito)
1. **"E-mail ou senha incorretos" ao salvar o perfil:** o usuário testou antes de a mudança no Cognito ser publicada
   (os campos ainda não existiam), e o site traduziu o erro com a mensagem do login. A mudança foi publicada, e o perfil
   agora tem a própria mensagem de erro ("sem permissão para alterar esse dado").
2. **Tentativa de tirar do site a permissão de escrever o e-mail:** a AWS **recusou** ("Invalid write attributes"),
   porque o Cognito exige essa permissão para atributos obrigatórios. A stack voltou sozinha ao estado anterior, sem
   efeito, e o código foi desfeito. A solução adotada foi a proteção "manter o e-mail antigo" + a troca só pelo suporte.

## Decisões do usuário
- "Dono aparece como Supervisor" (só o nome na tela). Um perfil Supervisor separado do Dono não foi criado.
- Perfil editável por pessoa (cargo e área).
- "Deixa salvo": o cargo e a área ficam salvos no Cognito. Não haverá histórico de alterações.
- E-mail: só o suporte altera.

## Pacotes instalados (aprovados pelo usuário)
| Pasta | Pacote | Versão |
|---|---|---|
| frontend | recharts | 3.10.1 (traz junto o react-is 19.3.1, exigido por ele) |

0 vulnerabilidades. O pacote do site passou de 1 MB (avisado: dá para dividir na etapa de deploy).

## Validação das cores dos gráficos
Cor da série: `#0d9488` (brand-600). O validador de paleta passou em tudo: faixa de luminosidade, saturação e
contraste ≥ 3:1 sobre o branco. Cada gráfico tem uma série só, então não há legenda nem disputa de cores.

## Arquivos criados/alterados
**Backend:** novo `functions/admin/updateUserEmail.ts`; README.

**Infra:** `lib/auth-stack.ts` (atributos de perfil, leitura/escrita do client, `keepOriginal` do e-mail);
`lib/routes/admin-routes.ts` (rota de e-mail).

**Frontend:**
- novos:
  - `src/components/ui/Icon.tsx`
  - `src/features/dashboard/pages/DashboardPage.tsx`
  - `src/features/dashboard/components/`: `StatTile.tsx`, `Sparkline.tsx`, `DailySalesChart.tsx`, `RankingList.tsx`,
    `RecentBuyers.tsx`, `chartTheme.ts`
  - `src/features/dashboard/utils/salesStats.ts`
  - `src/features/vendas/components/MonthPicker.tsx`
  - `src/features/auth/pages/ProfilePage.tsx`
  - `src/features/admin/`: `components/ChangeEmailModal.tsx`, `hooks/useUpdateUserEmail.ts`
- alterados:
  - `src/types/auth.ts`: `ROLE_LABELS`, cargo e área
  - `src/features/auth/services/authService.ts`: `updateProfile`
  - `src/app/layouts/`: `AppLayout`, `Sidebar`, `AuthLayout`, `navigation`; `src/app/router.tsx`; `src/index.css`
  - `src/features/vendas/`: `SaleDetailsModal`, `SalesPage`
  - `src/features/admin/`: `UsersTable`, `AdminUsersPage`, `adminService`
  - telas com emojis trocados por ícones
  - todo o `src`: `slate` → `zinc`
- removido: `RankingBars.tsx` (barras substituídas pela lista)
- **Outros:** `CLAUDE.md` (Supervisor) e READMEs

## Recursos AWS (us-east-1)
| Ação | Nome | Tipo | Custo |
|---|---|---|---|
| Alterado | `gestao-pro-users` | Cognito: + `custom:jobTitle` e `custom:department` (até 50 caracteres) | US$ 0,00 |
| Alterado | `gestao-pro-web` | Cognito client: cargo e área legíveis e editáveis pelo site | US$ 0,00 |
| Alterado | `gestao-pro-users` | Cognito: "manter e-mail antigo até confirmar o novo" | US$ 0,00 |
| Criado | `GestaoPro-Admin-UpdateUserEmail` | Lambda `gestao-pro-admin-update-user-email` (`AdminGetUser`, `AdminUpdateUserAttributes`, `dynamodb:UpdateItem`) | US$ 0,00 |
| Tentado e revertido pela AWS | `gestao-pro-web` | tirar a escrita do e-mail (recusado; sem efeito) | US$ 0,00 |

Nenhuma alteração recriou o User Pool (conferido com `cdk diff`); os 3 usuários continuam.

## Comandos executados
- `npm view recharts`, `npm install recharts@3.10.1`
- `node scripts/validate_palette.js "#0d9488" --mode light` (skill de visualização)
- `npx tsc --noEmit` (backend, infra, frontend), `npx vite build`, `npx cdk diff`/`synth`
- `npx cdk deploy GestaoPro-Auth` (3 vezes: atributos ✅; escrita do e-mail ❌ revertido; proteção ✅) e `GestaoPro-Admin-UpdateUserEmail`
- `aws cognito-idp describe-user-pool` / `describe-user-pool-client` / `list-users` (conferência)
- Testes: `npx tsx` (contas do dashboard), `aws lambda invoke` (troca de e-mail), `curl` (rota sem token)
- Limpeza: usuário e registro de teste apagados

## Testes feitos
| Teste | Resultado |
|---|---|
| Contas do dashboard (vendas fictícias): cancelada fora, "aguardando" dentro, dias sem venda = 0, rankings, % | ✅ |
| Troca de e-mail: Supervisor → 403; inválido → 400; mesmo e-mail → 400; e-mail de outra conta → 409; usuário inexistente → 404 | ✅ |
| Troca de e-mail pelo suporte: Cognito atualizado (e confirmado) e registro do funcionário corrigido | ✅ |
| Rota nova sem token → 401 | ✅ |

**Não verificado por mim:** o visual (gráficos, cores e layout) no navegador. O usuário vai conferir.

## Como testar
1. http://localhost:5173 (recarregue com **Cmd+Shift+R**).
2. **Meu perfil:** preencha Cargo ("Supervisor") e Área ("Área comercial") → Salvar. O topo da tela muda.
3. **Dashboard:** confira cartões, fluxo do mês, rankings e "Quem comprou". Troque o mês nas setas.
4. **Vendas:** abra um pedido de cancelamento e veja os botões novos.
5. **SuperAdmin → Usuários → Alterar e-mail** (teste com uma conta de teste sua).

## Pendências / atenção
- O nome antigo continua nas vendas e clientes já gravados (são cópias da época). Só os registros novos usam o nome novo.
- Próxima etapa: **11 (Planos e liberação de ferramentas)**.

---

## Ajuste pedido pelo usuário: azul-marinho fosco e logo novo (só no site, sem mudança na AWS)
- **Cor da marca:** "cores opacas azul-marinho" (paleta `brand-*` em `src/index.css`, de `#f3f6fb` a `#0c1830`).
  Toda a interface usa essa paleta, então botões, destaques, links e seleções mudaram juntos.
- **Superfícies escuras em azul-marinho profundo** (`brand-950`): menu lateral, painel do login, cabeçalho do
  cadastro da empresa, cartão do perfil e dicas dos gráficos. Textos sobre elas em tons de azul claro.
- **Fundo das páginas:** continua claro (aprovado pelo usuário).
- **Logo final (3ª versão): igual ao modelo enviado pelo usuário.** 4 formas em "bandeira/seta" (pentágonos) em
  grade 2×2, nas cores do modelo (azul-petróleo `#5a9fa8`, verde-menta `#7ecfa6`, azul-ardósia `#2f5476`,
  verde-claro `#9de8a2`) sobre azul-marinho `#0a1a3f`. As medidas foram tiradas da imagem do modelo e conferidas numa
  prévia em PNG. **Na página de login o logo ficou maior** (novo tamanho `size="lg"`).
  Aviso dado ao usuário: se o modelo for o logo de outra empresa, usá-lo num produto comercial pode gerar problema de
  marca registrada.
- **Versões anteriores (recusadas):** "escada de crescimento".
  São 4 cantoneiras (⌝) encaixadas em diagonal, subindo para a direita e clareando do azul-marinho ao verde-menta,
  sobre um quadrado azul-marinho profundo. A 1ª versão (linha com seta) foi recusada. Uma tentativa intermediária
  (blocos com canto cortado) foi descartada por mim ao ver a prévia, porque parecia "folhas de papel".
  Nome: "Gestão" em azul-marinho escuro (ou branco, no fundo escuro) + selo "PRO" discreto. O favicon segue o mesmo
  desenho. As prévias foram geradas em PNG com o `qlmanage` do macOS e conferidas visualmente.
- **Cor dos gráficos:** `#2b4f8f` (brand-600). Os azuis-marinhos mais foscos (`#34507f`, `#3d5a8a`, `#4c6697`)
  **reprovaram** no validador por parecerem cinza (pouca saturação). Esse tom passou em todas as verificações.
- **Arquivos:** `src/index.css`, `src/components/ui/Logo.tsx`, `public/favicon.svg`,
  `src/features/dashboard/components/chartTheme.ts`, `DailySalesChart.tsx`, `src/app/layouts/` (Sidebar, AuthLayout,
  AppLayout), `src/components/ui/Modal.tsx`, `OnboardingPage.tsx`, `ProfilePage.tsx`, `SiteHighlights.tsx`.

---

## Dashboard clicável: análise detalhada (pedido do usuário; só no site, sem mudança na AWS)
Clicar em qualquer item do Dashboard abre um **popup grande** com a análise daquele item no mês:

| Clique em | O popup mostra |
|---|---|
| Cliente ("Quem comprou" ou "Melhores clientes") | total comprado, nº de compras, ticket médio, unidades; **o que levou** e **como pagou**; a lista de vendas |
| Produto ("Mais vendidos") | faturado com o produto, unidades, vendas e clientes; **quem comprou** (quantidade e valor); formas de pagamento; as vendas, com a quantidade do produto |
| Vendedor ("Equipe") | vendido, vendas, **clientes atendidos**, ticket médio; os clientes dele e os produtos que mais vendeu; as vendas |
| Forma de pagamento | total recebido, vendas, ticket, clientes; os clientes que mais usaram e os produtos vendidos assim; as vendas |

- **Dentro do popup** também dá para clicar (ex.: na análise de um vendedor, clicar num cliente ou produto). As análises
  se empilham e o botão **"Voltar"** retorna à anterior.
- **Equipe** agora mostra "N vendas · M clientes atendidos": quem mais vendeu e quem mais atendeu.
- **Rankings e "Quem comprou"** viraram botões, com destaque ao passar o mouse e uma setinha.
- **Contas testadas** com vendas fictícias (filtros por cliente, produto, vendedor e pagamento; quem comprou um produto;
  clientes por vendedor) ✅.
- **Arquivos:**
  - novos: `features/dashboard/components/DrillDownModal.tsx`, `DrillSalesTable.tsx`
  - alterados: `RankingList.tsx` (clicável), `RecentBuyers.tsx` (clicável), `utils/salesStats.ts`
    (`DrillFilter`, `filterSales`, `productBuyers`, `customersBySeller`, `key` no ranking), `pages/DashboardPage.tsx`

---

## "Ver todos": visão completa com busca e ordenação (pedido do usuário; só no site, sem mudança na AWS)
- Cada bloco do Dashboard ganhou o botão **"Ver todos (N)"**: Mais vendidos, Melhores clientes, Equipe, Formas de
  pagamento e Quem comprou.
- **Listas completas** (`FullListModal`): todos os itens do mês, numa tabela com:
  - **busca pelo nome** (ex.: "Camila");
  - **ordenação clicando no título da coluna** (clicar de novo inverte);
  - colunas próprias de cada tipo:
    - **clientes:** comprou (R$), **vezes que comprou**, unidades, ticket médio, última compra;
    - **produtos:** faturado, unidades, vendas, clientes, última venda;
    - **equipe:** vendido, vendas, **clientes atendidos**, ticket médio, última venda;
    - **pagamentos:** recebido, vendas, clientes, ticket médio, última venda;
  - uma linha fina de participação no total.
- **Todas as vendas** (`AllSalesModal`, em "Quem comprou"): busca por cliente **ou produto**, filtro por forma de
  pagamento, ordem (mais recentes / maior valor / menor valor) e o total filtrado.
- **Clicar numa linha** abre a análise individual (popup da etapa anterior). Os popups formam uma pilha, e o botão
  **"Voltar"** percorre o caminho de volta (ex.: lista de clientes → Camila → produto → Voltar → Voltar).
- **Contas testadas** com vendas fictícias (ex.: Camila com 2 compras, R$ 55,00, 4 unidades, ticket R$ 27,50) ✅.
- **Arquivos:**
  - novos: `features/dashboard/components/FullListModal.tsx`, `AllSalesModal.tsx`, `SortHeader.tsx`
  - alterados: `utils/salesStats.ts` (`detailRows`, `ListKind`), `pages/DashboardPage.tsx` (pilha de popups e botões),
    `components/ui/Icon.tsx` (ícones chevronUp, chevronDown, search, list)
