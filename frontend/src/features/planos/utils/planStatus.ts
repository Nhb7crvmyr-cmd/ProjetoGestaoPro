// Situação do plano para exibir na tela: nome, se está ativo/vencido e quantos dias faltam.
// (Quem decide o que está liberado é o backend, pelo "access"; aqui é só a apresentação.)

import { findPlan } from '../../empresa/constants/plans';
import type { CompanyWithAccess } from '../../empresa/services/companyService';

/** Situação para a tela. */
export interface PlanStatusView {
  /** Nome do plano ativo, ou "Sem plano ativo". */
  name: string;
  state: 'active' | 'expired' | 'none';
  /** Dias até vencer (só quando ativo). */
  daysLeft?: number;
  expiresAt?: string;
  /** true = foi definido pelo suporte (cortesia/ajuste). */
  bySupport: boolean;
}

/**
 * Monta a situação do plano.
 * @param company - empresa com o "access" do backend
 * @returns a situação para exibir
 */
export function planStatusView(company: CompanyWithAccess): PlanStatusView {
  const bySupport = company.plan.paymentType === 'SUPPORT';
  if (company.access.planId) {
    const expiresAt = company.plan.expiresAt;
    // Math.ceil: "faltam 0,3 dia" vira "1 dia" (ainda vale hoje).
    const daysLeft = expiresAt ? Math.max(0, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86_400_000)) : undefined;
    return { name: findPlan(company.access.planId)?.name ?? '', state: 'active', daysLeft, expiresAt, bySupport };
  }
  return { name: 'Sem plano ativo', state: company.access.expired ? 'expired' : 'none', expiresAt: company.plan.expiresAt, bySupport };
}
