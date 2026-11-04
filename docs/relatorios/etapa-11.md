# Relatório — Etapa 11: Planos e liberação de ferramentas

Data: 16/10/2026

## Decisões do usuário
- **Sem plano ativo** (nunca pagou ou venceu): **o básico continua** (clientes, produtos, estoque, vendas, dashboard,
  funcionários). Só **Chat, Automações e Marketing** ficam bloqueados (regra do CLAUDE.md).
- **Planos:**

  | Plano | Preço | Libera | Funcionários ativos |
  |---|---|---|---|
  | Sem plano | — | só Clientes, Produtos, Estoque, Vendas e Dashboard | **nenhum** (ajuste do usuário) |
  | Básico | R$ 49,90 | o básico | até 2 |
  | Profissional | R$ 99,90 | + Chat | até 10 |
  | Premium | R$ 199,90 | + Automações e Marketing | ilimitados |

  Ajuste do usuário depois da 1ª versão: sem plano, **Funcionários também ficam bloqueados** (limite 0). A 1ª versão
  permitia 2.
- **Suporte (SuperAdmin) pode ativar, trocar, estender ou remover** o plano de qualquer empresa.

## Resumo
- **Regra no backend** (`shared/planAccess.ts`): é ela quem decide; o site só mostra cadeados.
  - `getPlanAccess`: plano **ativo e dentro da validade** → limites do plano; senão → o básico;
  - `requireFeature`: bloqueia ferramenta fora do plano (403 com o plano necessário). Pronta para o Chat (Etapa 12)
    e para Automações/Marketing (Etapa 13);
  - `requireEmployeeSlot`: limite de funcionários **ativos**. Funcionário bloqueado não ocupa vaga.
- **Limite aplicado** no cadastro de funcionário e ao **liberar** um bloqueado.
- **`GET /empresa`** devolve também o `access` (plano efetivo, ferramentas, limite).
- **Suporte:** nova rota `POST /admin/empresas/{empresaId}/plano` (plano + "válido até", ou "none" para remover).
  Grava `paymentType: SUPPORT` e quem definiu.
- **Site:**
  - **Meu plano** (`/plano`, Supervisor): plano atual, validade e **dias restantes** (aviso com 5 dias ou menos),
    **vagas de funcionários** com barra, ferramentas liberadas/bloqueadas, **tabela comparando os 3 planos** e o botão
    Trocar/renovar;
  - **menu lateral:** Chat, Automações e Marketing com **cadeado + plano necessário** quando não estão no plano
    (clicar leva ao plano). Se estiverem liberados, aparece "Em breve" até as Etapas 12 e 13;
  - **Funcionários:** "N de M funcionários ativos · Plano"; o botão "Novo funcionário" é desligado no limite, com o link
    "Ver planos";
  - **Início:** o cartão do plano mostra os dias restantes e o atalho "Ver meu plano";
  - **SuperAdmin → Empresas:** botão **"Plano"** (escolher plano e validade, ou remover);
  - **popup de planos:** benefícios e limites de acordo com a regra.

## Comportamento a saber
- **Empresa que perde o plano com mais funcionários do que o básico permite:** ninguém é bloqueado automaticamente.
  Ela só não consegue cadastrar ou liberar mais ninguém até voltar ao limite.
- **Validade definida pelo suporte:** vale até o **fim do dia** escolhido (23:59 no horário de Brasília).

## Pacotes
Nenhum pacote novo.

## Arquivos criados/alterados
**Backend:**
- novos: `shared/planAccess.ts`, `functions/admin/setCompanyPlan.ts`
- alterados:
  - `shared/plans.ts`: ferramentas, limites e "sem plano"
  - `shared/company.ts`: `paymentType: SUPPORT` e `grantedBy`
  - `functions/funcionarios/createEmployee.ts` e `setEmployeeStatus.ts`: limite do plano
  - `functions/empresa/getCompany.ts`: devolve o `access`
  - `README.md`

**Infra:**
- `lib/routes/admin-routes.ts`: rota nova
- `lib/routes/funcionarios-routes.ts`: permissões `GetItem` e `Query` para checar o limite

**Frontend:**
- novos:
  - `src/features/planos/`: `pages/PlanPage.tsx`, `components/PlanComparison.tsx`, `utils/planStatus.ts`
  - `src/features/admin/`: `components/SetPlanModal.tsx`, `hooks/useSetCompanyPlan.ts`
- alterados:
  - `src/features/empresa/`: `constants/plans.ts` (ferramentas e limites), `services/companyService.ts` (`access`),
    `hooks/useCompany.ts`, `components/PlansModal.tsx`, `components/PlanStatusCard.tsx`
  - `src/app/`: `layouts/navigation.ts`, `layouts/Sidebar.tsx` (cadeados), `layouts/AppLayout.tsx`, `router.tsx`
  - `src/features/funcionarios/pages/EmployeesPage.tsx` (vagas)
  - `src/features/admin/`: `components/CompaniesTable.tsx`, `pages/AdminCompaniesPage.tsx`, `services/adminService.ts`
  - `src/components/ui/Icon.tsx` (ícones lock e crown)
  - `README.md`

## Recursos AWS (us-east-1)
| Ação | Stack | Lambda / mudança | Custo |
|---|---|---|---|
| Criado | `GestaoPro-Admin-SetCompanyPlan` | `gestao-pro-admin-set-company-plan` (`dynamodb:UpdateItem`) | US$ 0,00 |
| Atualizado | `GestaoPro-Funcionarios-Create` | limite do plano; + `dynamodb:GetItem/Query` | US$ 0,00 |
| Atualizado | `GestaoPro-Funcionarios-SetStatus` | limite ao liberar; + `dynamodb:Query` | US$ 0,00 |
| Atualizado | `GestaoPro-Empresa-Get` | devolve o `access` | US$ 0,00 |
| Atualizado | demais Lambdas | reempacotadas (código compartilhado) | US$ 0,00 |

Ao final do deploy, as 31 stacks do projeto estavam concluídas (sem nenhuma com erro ou desfeita).

## Comandos executados
- `npx tsc --noEmit` (backend, infra, frontend), `npx vite build`, `npx cdk synth`
- `npx tsx` (teste local da regra de planos)
- `npx cdk deploy --all --concurrency 4`
- Testes: `aws lambda invoke` (empresa fictícia `91a00000-...`) e `curl` (rota sem token)
- Limpeza: 6 itens do DynamoDB e 1 usuário de teste do Cognito apagados

## Testes feitos
**Regra local (sem AWS):**
- sem plano, Básico, Profissional, Premium e Premium **vencido** dão o acesso esperado;
- Premium usa Marketing ✅; vencido e Básico não usam Chat 🔒, com a mensagem do plano necessário.

**Na AWS (13 de 13 ✅):**
| Teste | Esperado |
|---|---|
| Sem plano: `access` = básico, até 2 | ✅ |
| Sem plano com 2 ativos: novo funcionário / liberar bloqueado | 403 (com a explicação) |
| Supervisor tentando a rota do suporte | 403 |
| Suporte: data no passado / sem data / plano inválido / empresa inexistente | 400 / 400 / 400 / 404 |
| Suporte define Profissional por 10 dias | 200; `access` com chat e até 10; fim do dia em Brasília |
| Profissional: novo funcionário | 201 (cabe) |
| Suporte remove o plano | 200; volta ao básico |
| Sem plano com 3 ativos: novo funcionário | 403 |
| Suporte define Premium | 200; ilimitado; aparece na lista do admin |
| Rota nova sem token | 401 |

**Não verificado por mim:** as telas no navegador.

## Como testar
1. Recarregue com **Cmd+Shift+R**.
2. **Supervisor → Meu plano:** confira validade, dias, vagas, ferramentas e a comparação.
3. **Menu:** Chat/Automações/Marketing com cadeado (de acordo com o seu plano).
4. **Funcionários:** veja "N de M". Com o limite atingido, o botão de novo funcionário fica desligado.
5. **SuperAdmin → Empresas → Plano:** troque o plano da sua empresa (ex.: Básico) e veja os cadeados mudarem no
   Supervisor. Depois volte para o plano que estava.

## Pendências / atenção
- Chat (Etapa 12) e Automações/Marketing (Etapa 13) devem chamar `requireFeature` em **todas** as suas Lambdas.
- Pagamento continua **simulado**.

---

## Ajustes pedidos pelo usuário
1. **Sem plano ou vencido = só Clientes, Produtos, Estoque, Vendas e Dashboard.**
   - **backend:** `NO_PLAN_LIMITS.maxEmployees = 0`. Cadastrar ou liberar funcionário dá 403 "Sem plano ativo, não é
     possível cadastrar ou liberar funcionários. Ative um plano (a partir do Básico).";
   - **site:** o menu "Funcionários" ganha cadeado "Básico" sem plano; a página mostra o aviso e o botão
     "Ativar um plano"; os textos de "Meu plano" foram atualizados;
   - **funcionários que já existiam** não são bloqueados automaticamente (mesma regra de antes).
   - **Depende de publicação:** as Lambdas `Funcionarios-Create`, `Funcionarios-SetStatus` e `Empresa-Get` precisam
     ser republicadas (código, sem recurso novo).
2. **Botão "Trocar ou renovar" branco:** duas cores de fundo "brigavam" na mesma classe (texto branco sobre branco).
   O `Button` ganhou as variantes oficiais **`danger`** (vermelho) e **`inverse`** (branco, para fundo escuro), e o
   botão "Confirmar cancelamento" da venda, que tinha o mesmo problema, também foi corrigido.
3. **Chat em PRÉVIA, só no site** (sem API e sem WebSocket, custo zero), em `/chat`:
   - **lista de conversas:** busca, avatar, última mensagem, horário, "não lidas" e "online";
   - **conversa:** balões, "digitando…" com resposta simulada, respostas rápidas, Enter envia e Shift+Enter quebra a linha;
   - **layout:** duas colunas no computador; no celular, alterna entre lista e conversa;
   - **dados:** nomes dos clientes reais; mensagens de exemplo. Nada é enviado nem salvo;
   - **plano:** protegido por `FeatureGate` (só com Chat no plano; senão, cartão de cadeado com o plano necessário).
     O backend do chat (Etapa 12) vai usar `requireFeature`.
   - **arquivos:** `features/chat/` (`pages/ChatPage.tsx`, `components/ConversationList.tsx`, `components/ChatWindow.tsx`,
     `data/demoConversations.ts`), `features/planos/components/FeatureGate.tsx`, ícones `send`, `message` e `phone`.
4. **Chat no estilo do WhatsApp Web e em tela cheia** (pedido do usuário; só no site):
   - **tela:** ocupa a tela inteira (sem título e sem margens), em duas colunas;
   - **lista:** cabeçalho cinza, busca arredondada, abas "Todas"/"Não lidas", avatar colorido, horário verde e bolinha
     verde com as não lidas;
   - **conversa:** fundo bege com textura (só CSS), balões brancos (cliente) e verde-claro (você) com a "pontinha",
     horário e tiques ✓✓ dentro do balão (cinza = enviada, azul = lida), "digitando…" com três pontinhos;
   - **barra de digitação:** cinza, com respostas rápidas, anexar ("em breve"), campo arredondado e o botão verde de
     enviar;
   - **tela inicial** "Gestão Pro Chat" quando nenhuma conversa está aberta;
   - **simulação:** a mensagem enviada fica "lida" quando o cliente "responde"; se a resposta chega com outra conversa
     aberta, conta como não lida;
   - **arquivos:** `features/chat/components/chatTheme.ts` (cores), `ConversationList.tsx`, `ChatWindow.tsx`,
     `pages/ChatPage.tsx`, `data/demoConversations.ts` (status de leitura), `app/layouts/AppLayout.tsx` (tela cheia no
     /chat), `components/ui/Icon.tsx` (checkCheck, moreVertical, paperclip), `planos/components/FeatureGate.tsx` (margem).
