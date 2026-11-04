// Catálogo de planos (o mesmo do popup de pagamento do site) e o que cada um LIBERA.
// Preços em CENTAVOS (inteiros): evita erros de arredondamento com números decimais.
//
// REGRA (Etapa 11, decidida pelo usuário):
// - Sem plano ativo (nunca pagou ou venceu): a empresa fica SÓ com Clientes, Produtos, Estoque, Vendas e Dashboard.
//   Funcionários (cadastrar/liberar), Chat, Automações e Marketing ficam bloqueados (ajuste do usuário na Etapa 11).
// - Básico: o essencial + até 2 funcionários ativos.
// - Profissional: + Chat + até 10 funcionários ativos.
// - Premium: + Automações e Marketing + funcionários ilimitados.

/** Identificadores aceitos pela API. */
export const PLAN_IDS = ['basico', 'profissional', 'premium'] as const;
export type PlanId = (typeof PLAN_IDS)[number];

/** Ferramentas que dependem do plano. */
export type PlanFeature = 'chat' | 'automations' | 'marketing';

/** O que um plano dá: ferramentas e limite de funcionários ativos (null = ilimitado). */
export interface PlanLimits {
  features: PlanFeature[];
  maxEmployees: number | null;
}

/** Dados de cada plano. */
export const PLANS: Record<PlanId, { name: string; priceCents: number } & PlanLimits> = {
  basico: { name: 'Básico', priceCents: 4990, features: [], maxEmployees: 2 },
  profissional: { name: 'Profissional', priceCents: 9990, features: ['chat'], maxEmployees: 10 },
  premium: { name: 'Premium', priceCents: 19990, features: ['chat', 'automations', 'marketing'], maxEmployees: null },
};

/** Sem plano ativo: só o essencial. Nenhuma ferramenta extra e nenhum funcionário ATIVO novo (limite 0). */
export const NO_PLAN_LIMITS: PlanLimits = { features: [], maxEmployees: 0 };

/** Nome de cada ferramenta (para as mensagens de erro). */
export const FEATURE_NAMES: Record<PlanFeature, string> = {
  chat: 'Chat com clientes',
  automations: 'Automações',
  marketing: 'Marketing',
};

/** Duração de cada pagamento (mensal). */
export const PLAN_DURATION_DAYS = 30;
