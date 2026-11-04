// Chamadas à API do módulo empresa: cadastrar (onboarding), ler os dados e ativar o plano (simulado).

import { apiFetch } from '../../../services/apiClient';
import type { PlanFeature, PlanId } from '../constants/plans';

/** Endereço como a API devolve e recebe (CEP só com números). */
export interface Address {
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  district: string;
  city: string;
  state: string;
}

/** Plano da empresa. */
export interface CompanyPlan {
  planId: PlanId | null;
  /** PENDING = ainda não pagou; ACTIVE = pago. */
  status: 'PENDING' | 'ACTIVE';
  activatedAt?: string;
  expiresAt?: string;
  /** SIMULATED = pagamento de teste; SUPPORT = definido pelo suporte (SuperAdmin). */
  paymentType?: 'SIMULATED' | 'SUPPORT';
}

/** O que a empresa pode usar AGORA (calculado pelo backend a partir do plano e da validade). */
export interface PlanAccess {
  /** Plano ativo e dentro da validade (null = sem plano ativo: o básico continua). */
  planId: PlanId | null;
  /** true = tinha plano, mas venceu. */
  expired: boolean;
  /** Ferramentas liberadas. */
  features: PlanFeature[];
  /** Funcionários ATIVOS permitidos (null = ilimitado). */
  maxEmployees: number | null;
}

/** Empresa + acesso do plano (é o que GET /empresa devolve). */
export type CompanyWithAccess = Company & { access: PlanAccess };

/** Empresa como a API devolve. */
export interface Company {
  empresaId: string;
  documentType: 'CNPJ' | 'CPF';
  document: string;
  legalName: string;
  tradeName?: string;
  email: string;
  phone: string;
  address: Address;
  ownerId: string;
  plan: CompanyPlan;
  createdAt: string;
}

/** O que o site envia no onboarding. Não há empresaId nem ownerId: o backend gera/lê do token. */
export type CreateCompanyInput = Omit<Company, 'empresaId' | 'ownerId' | 'plan' | 'createdAt'>;

/**
 * Cadastra a empresa do usuário logado.
 * @param input - dados do formulário, já sem máscaras
 * @returns a empresa criada
 */
export async function createCompany(input: CreateCompanyInput): Promise<Company> {
  const { company } = await apiFetch<{ company: Company }>('/empresa', { method: 'POST', body: JSON.stringify(input) });
  return company;
}

/**
 * Busca a empresa do usuário logado (o backend descobre qual é pelo token).
 * @returns a empresa
 */
export async function getCompany(): Promise<CompanyWithAccess> {
  const { company, access } = await apiFetch<{ company: Company; access: PlanAccess }>('/empresa');
  // Junta os dois num objeto só: as telas que já usavam a empresa continuam funcionando,
  // e quem precisa do plano lê "company.access".
  return { ...company, access };
}

/**
 * "Paga" (simulado) e ativa um plano por 30 dias.
 * @param planId - plano escolhido
 * @returns o plano ativado
 */
export async function activatePlan(planId: PlanId): Promise<CompanyPlan> {
  const { plan } = await apiFetch<{ plan: CompanyPlan }>('/empresa/plano', {
    method: 'POST',
    body: JSON.stringify({ planId }),
  });
  return plan;
}
