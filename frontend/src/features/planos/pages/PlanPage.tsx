// Página "Meu plano" (somente Supervisor): plano atual e validade, uso das vagas de funcionários,
// ferramentas liberadas/bloqueadas e a comparação entre planos, com o botão de trocar/renovar.

import { useState } from 'react';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { formatDate } from '../../../utils/formatters';
import { PlansModal } from '../../empresa/components/PlansModal';
import { FEATURE_LABELS, planForFeature, type PlanFeature } from '../../empresa/constants/plans';
import { useCompany } from '../../empresa/hooks/useCompany';
import { useEmployees } from '../../funcionarios/hooks/useEmployees';
import { PlanComparison } from '../components/PlanComparison';
import { planStatusView } from '../utils/planStatus';

const FEATURES: PlanFeature[] = ['chat', 'automations', 'marketing'];

/**
 * Tela do plano.
 * @returns a página
 */
export function PlanPage() {
  const companyQuery = useCompany();
  const employeesQuery = useEmployees();
  const [plansOpen, setPlansOpen] = useState(false);

  if (companyQuery.isPending) return <p className="text-sm text-zinc-500">Carregando plano…</p>;
  if (companyQuery.isError) return <Alert type="error">{companyQuery.error.message}</Alert>;

  const company = companyQuery.data;
  const { access } = company;
  const status = planStatusView(company);
  // Vagas: só funcionários ATIVOS ocupam (bloqueado libera a vaga).
  const activeEmployees = (employeesQuery.data ?? []).filter((employee) => employee.enabled).length;
  const max = access.maxEmployees;
  const usage = max ? Math.min(100, (activeEmployees / max) * 100) : 0;
  const ending = status.state === 'active' && status.daysLeft !== undefined && status.daysLeft <= 5;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-brand-700">Assinatura</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">Meu plano</h1>
      </div>

      {status.state === 'expired' && (
        <Alert type="error">
          Seu plano venceu. A empresa ficou só com Clientes, Produtos, Estoque, Vendas e Dashboard. Funcionários, Chat,
          Automações e Marketing estão bloqueados.
        </Alert>
      )}
      {ending && <Alert type="error">Seu plano vence em {status.daysLeft} {status.daysLeft === 1 ? 'dia' : 'dias'}. Renove para não perder as ferramentas.</Alert>}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Plano atual. */}
        <section className="rounded-2xl bg-brand-950 p-6 text-white lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-sm text-brand-200">
                <Icon name="crown" className="size-4" /> Plano atual
              </p>
              <p className="mt-1 text-3xl font-semibold tracking-tight">{status.name}</p>
              <p className="mt-1 text-sm text-brand-200">
                {status.state === 'active' && status.expiresAt && (
                  <>
                    Válido até {formatDate(status.expiresAt)}
                    {status.daysLeft !== undefined && ` · ${status.daysLeft} ${status.daysLeft === 1 ? 'dia restante' : 'dias restantes'}`}
                  </>
                )}
                {status.state === 'expired' && status.expiresAt && <>Venceu em {formatDate(status.expiresAt)}</>}
                {status.state === 'none' &&
                  'Liberado: Clientes, Produtos, Estoque, Vendas e Dashboard. Ative um plano para ter Funcionários, Chat, Automações e Marketing.'}
              </p>
              {status.bySupport && <p className="mt-2 text-xs text-brand-300">Definido pelo suporte.</p>}
            </div>
            <Button variant="inverse" className="sm:w-auto" onClick={() => setPlansOpen(true)}>
              {status.state === 'active' ? 'Trocar ou renovar' : 'Escolher plano'}
            </Button>
          </div>
        </section>

        {/* Vagas de funcionários. */}
        <section className="rounded-2xl bg-white p-6 ring-1 ring-zinc-200/70">
          <p className="flex items-center gap-2 text-sm font-medium text-zinc-500">
            <Icon name="users" className="size-4" /> Funcionários ativos
          </p>
          <p className="mt-2 text-3xl font-semibold tabular-nums text-zinc-900">
            {employeesQuery.isPending ? '—' : activeEmployees}
            <span className="text-lg font-normal text-zinc-400"> / {max ?? '∞'}</span>
          </p>
          {max !== null && (
            <div className="mt-3 h-1.5 rounded-full bg-zinc-100" aria-hidden="true">
              <div className={`h-1.5 rounded-full ${usage >= 100 ? 'bg-red-500' : 'bg-brand-600'}`} style={{ width: `${usage}%` }} />
            </div>
          )}
          <p className="mt-2 text-xs text-zinc-500">
            {max === null ? 'Seu plano não tem limite.' : usage >= 100 ? 'Limite atingido. Faça upgrade ou bloqueie alguém.' : `${max - activeEmployees} vaga(s) livre(s).`}
          </p>
        </section>
      </div>

      {/* Ferramentas: liberadas ou bloqueadas, e a partir de qual plano. */}
      <section className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map((feature) => {
          const allowed = access.features.includes(feature);
          return (
            <div key={feature} className="flex items-center gap-3 rounded-2xl bg-white p-4 ring-1 ring-zinc-200/70">
              <span className={`flex size-9 items-center justify-center rounded-lg ${allowed ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-500'}`}>
                <Icon name={allowed ? 'check' : 'lock'} className="size-4" strokeWidth={2.5} />
              </span>
              <div>
                <p className="text-sm font-medium text-zinc-900">{FEATURE_LABELS[feature]}</p>
                <p className="text-xs text-zinc-500">{allowed ? 'Liberado no seu plano' : `A partir do plano ${planForFeature(feature)?.name}`}</p>
              </div>
            </div>
          );
        })}
      </section>

      <PlanComparison currentPlanId={access.planId} />

      <PlansModal open={plansOpen} onClose={() => setPlansOpen(false)} currentPlanId={access.planId} />
    </div>
  );
}
