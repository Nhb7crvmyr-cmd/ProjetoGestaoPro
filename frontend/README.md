# frontend

Site do Gestão Pro: React + Vite + Tailwind CSS + React Router + React Hook Form + Zod + Amplify (somente Auth).

## Como rodar (dentro de `frontend/`)
1. Crie o `.env.local` copiando o `.env.example` e preencha com os IDs do Cognito
   (saída do `cdk deploy` da stack `GestaoPro-Auth`). Esses IDs não são segredos.
2. `npm run dev` → abra http://localhost:5173

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor local com recarga automática |
| `npm run typecheck` | confere os tipos do TypeScript |
| `npm run build` | gera o site final em `dist/` |

## Rotas
| Endereço | Página | Quem acessa |
|---|---|---|
| `/login`, `/cadastro`, `/confirmar` | login (inclui "crie sua senha" no 1º acesso do funcionário), cadastro e código de confirmação | todos |
| `/onboarding` | cadastro da empresa (CNPJ/CPF) | logado e sem empresa |
| `/inicio` | início: plano e dados da empresa | logado com empresa (ou SuperAdmin) |
| `/produtos` | produtos: catálogo, filtros; Dono cadastra/edita/movimenta (funcionário só consulta, sem custo) | Dono e Funcionário |
| `/clientes` | clientes: cadastro completo (CEP), WhatsApp, busca; Dono vê todos e quem atende | Dono (todos) e Funcionário (só os dele) |
| `/dashboard` | dashboard do mês: números, fluxo diário, rankings e quem comprou | Supervisor (empresa) e Funcionário (só os dele) |
| `/plano` | Meu plano: validade, vagas, ferramentas e comparação | Supervisor |
| `/perfil` | Meu perfil: nome, cargo e área (e-mail travado) | todos |
| `/vendas` | vendas do mês, resumo, pedidos de cancelamento (Dono) e detalhes | Dono (todas) e Funcionário (só as dele) |
| `/vendas/nova` | nova venda: cliente, produtos (lista com busca), desconto, pagamento | Dono e Funcionário |
| `/admin/clientes` | suporte: escolher empresa, filtrar atendente, buscar e transferir clientes | SuperAdmin |
| `/estoque` | resumo do estoque, itens para repor e histórico de movimentações | Dono |
| `/funcionarios` | funcionários: cadastrar (convite), bloquear/liberar, reenviar convite | Dono |
| `/admin` | usuários (bloquear/liberar, alterar e-mail) | SuperAdmin |
| `/admin/empresas` | empresas cadastradas | SuperAdmin |
| `/admin/empresas/:empresaId/clientes` | suporte: clientes da empresa (dados completos) e transferência de atendimento | SuperAdmin |

## Pastas além do padrão
- `src/utils/`: funções puras reutilizáveis (máscaras, validação de CPF/CNPJ, schema de endereço).

## Padrões visuais
- Cores neutras: `zinc` (cinza neutro). Cor da marca: `brand-*` (verde-azulado), definida em `src/index.css`.
- Ícones: `src/components/ui/Icon.tsx` (SVG próprio). Não usar emojis na interface.
- Nome dos perfis na tela: `ROLE_LABELS` em `src/types/auth.ts` (o grupo "Dono" aparece como "Supervisor").
- Gráficos: Recharts, uma série por gráfico, cor da marca (`src/features/dashboard/components/chartTheme.ts`).
