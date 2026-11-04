// Cartão com a situação do plano: pendente (convite para pagar), ativo (com validade) ou vencido.

import { Link } from 'react-router';
import { Button } from '../../../components/ui/Button';
import { formatDate } from '../../../utils/formatters';
import { findPlan } from '../constants/plans';
import type { CompanyPlan } from '../services/companyService';

/** Propriedades do cartão. */
interface PlanStatusCardProps {
  plan: CompanyPlan;
  /** Só o Dono pode pagar; para o funcionário o botão não aparece. */
  canManage: boolean;
  onOpenPlans: () => void;
}

/**
 * Decide a situação do plano e desenha o cartão.
 * @param props - plano, permissão e ação do botão
 * @returns o cartão
 */
export function PlanStatusCard({ plan, canManage, onOpenPlans }: PlanStatusCardProps) {
  const planInfo = findPlan(plan.planId);
  // Vencido = estava ativo, mas a data de validade já passou.
  const isExpired = plan.status === 'ACTIVE' && !!plan.expiresAt && new Date(plan.expiresAt) < new Date();
  const isActive = plan.status === 'ACTIVE' && !isExpired;

  if (isActive && planInfo) {
    return (
      <div className="flex flex-col gap-4 rounded-xl bg-white p-5 ring-1 ring-zinc-200 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">Seu plano</p>
          <p className="mt-0.5 flex items-center gap-2 text-lg font-semibold text-zinc-900">
            {planInfo.name}
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">Ativo</span>
          </p>
          {plan.expiresAt && (
            <p className="mt-0.5 text-sm text-zinc-500">
              Válido até {formatDate(plan.expiresAt)}
              {/* Dias restantes (arredondado para cima: "ainda vale hoje" conta como 1). */}
              {` · ${Math.max(0, Math.ceil((new Date(plan.expiresAt).getTime() - Date.now()) / 86_400_000))} dias restantes`}
            </p>
          )}
        </div>
        {canManage && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link
              to="/plano"
              className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-zinc-700 ring-1 ring-zinc-300 transition hover:bg-zinc-50"
            >
              Ver meu plano
            </Link>
            <Button variant="secondary" className="sm:w-auto" onClick={onOpenPlans}>
              Trocar ou renovar
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-amber-50 p-5 ring-1 ring-amber-200 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold text-amber-900">{isExpired ? 'Seu plano venceu' : 'Ative seu plano'}</p>
        <p className="mt-0.5 text-sm text-amber-800">
          {canManage
            ? 'Escolha um plano para liberar todas as ferramentas do sistema.'
            : 'Peça ao dono da empresa para ativar o plano.'}
        </p>
      </div>
      {canManage && (
        <Button className="sm:w-auto" onClick={onOpenPlans}>
          Escolher plano
        </Button>
      )}
    </div>
  );
}
