// Catálogo de planos exibido no site. Ids, preços, ferramentas e limites IGUAIS aos do backend
// (backend/shared/plans.ts). Regra da Etapa 11: sem plano ativo, a empresa fica SÓ com Clientes, Produtos,
// Estoque, Vendas e Dashboard (sem funcionários); Chat (Profissional) e Automações + Marketing (Premium)
// dependem do plano; o número de funcionários ativos também.

/** Identificadores aceitos pela API. */
export type PlanId = 'basico' | 'profissional' | 'premium';

/** Ferramentas que dependem do plano. */
export type PlanFeature = 'chat' | 'automations' | 'marketing';

/** Nome de cada ferramenta na tela. */
export const FEATURE_LABELS: Record<PlanFeature, string> = {
  chat: 'Chat com clientes',
  automations: 'Automações',
  marketing: 'Marketing',
};

/** Dados de exibição de um plano. */
export interface PlanInfo {
  id: PlanId;
  name: string;
  /** Preço mensal em centavos. */
  priceCents: number;
  description: string;
  /** Lista de benefícios (texto para os cartões do popup). */
  benefits: string[];
  /** Ferramentas liberadas. */
  features: PlanFeature[];
  /** Funcionários ATIVOS permitidos (null = ilimitado). */
  maxEmployees: number | null;
  /** Destaque visual ("Mais escolhido"). */
  highlighted?: boolean;
}

export const PLANS: PlanInfo[] = [
  {
    id: 'basico',
    name: 'Básico',
    priceCents: 4990,
    description: 'Para começar a organizar a empresa.',
    benefits: ['Clientes, produtos e estoque', 'Vendas com baixa automática no estoque', 'Dashboard e relatórios', 'Até 2 funcionários ativos'],
    features: [],
    maxEmployees: 2,
  },
  {
    id: 'profissional',
    name: 'Profissional',
    priceCents: 9990,
    description: 'Para equipes que atendem clientes todo dia.',
    benefits: ['Tudo do Básico', 'Chat com clientes', 'Até 10 funcionários ativos'],
    features: ['chat'],
    maxEmployees: 10,
    highlighted: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    priceCents: 19990,
    description: 'Para crescer com automações.',
    benefits: ['Tudo do Profissional', 'Automações e marketing', 'Funcionários ilimitados'],
    features: ['chat', 'automations', 'marketing'],
    maxEmployees: null,
  },
];

/**
 * Procura um plano pelo id.
 * @param id - id do plano
 * @returns o plano, ou undefined
 */
export function findPlan(id: string | null | undefined): PlanInfo | undefined {
  return PLANS.find((plan) => plan.id === id);
}

/**
 * Primeiro plano (o mais barato) que libera uma ferramenta.
 * @param feature - ferramenta
 * @returns o plano
 */
export function planForFeature(feature: PlanFeature): PlanInfo | undefined {
  return PLANS.find((plan) => plan.features.includes(feature));
}
