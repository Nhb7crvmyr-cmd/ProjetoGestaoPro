// Tabela comparando os 3 planos: o que cada um libera, com o plano atual destacado.

import { Icon } from '../../../components/ui/Icon';
import { formatCents } from '../../../utils/formatters';
import { FEATURE_LABELS, PLANS, type PlanFeature, type PlanId } from '../../empresa/constants/plans';

/** Linhas da comparação: o essencial (todos têm), as ferramentas e o limite de funcionários. */
const FEATURE_ROWS: PlanFeature[] = ['chat', 'automations', 'marketing'];

/**
 * Marca de "tem" (check verde) ou "não tem" (traço cinza), com texto para leitores de tela.
 * @param props - se tem
 * @returns o ícone
 */
function Mark({ yes }: { yes: boolean }) {
  return yes ? (
    <Icon name="check" className="mx-auto size-5 text-emerald-600" strokeWidth={2.5} label="Incluído" />
  ) : (
    <Icon name="minus" className="mx-auto size-5 text-zinc-300" label="Não incluído" />
  );
}

/**
 * Desenha a tabela.
 * @param props - plano atual (destacado)
 * @returns a tabela
 */
export function PlanComparison({ currentPlanId }: { currentPlanId: PlanId | null }) {
  /** Fundo da coluna do plano atual. */
  const highlight = (id: PlanId) => (id === currentPlanId ? 'bg-brand-50' : '');

  return (
    <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-zinc-200/70">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-zinc-200">
            <th className="px-4 py-3 text-left font-medium text-zinc-500">Recursos</th>
            {PLANS.map((plan) => (
              <th key={plan.id} className={`px-4 py-3 text-center ${highlight(plan.id)}`}>
                <p className="font-semibold text-zinc-900">{plan.name}</p>
                <p className="text-xs font-normal text-zinc-500">{formatCents(plan.priceCents)}/mês</p>
                {plan.id === currentPlanId && (
                  <span className="mt-1 inline-block rounded-full bg-brand-700 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                    Seu plano
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          <tr>
            <td className="px-4 py-3 text-zinc-700">Clientes, produtos, estoque, vendas e dashboard</td>
            {PLANS.map((plan) => (
              <td key={plan.id} className={`px-4 py-3 ${highlight(plan.id)}`}>
                <Mark yes />
              </td>
            ))}
          </tr>
          {FEATURE_ROWS.map((feature) => (
            <tr key={feature}>
              <td className="px-4 py-3 text-zinc-700">{FEATURE_LABELS[feature]}</td>
              {PLANS.map((plan) => (
                <td key={plan.id} className={`px-4 py-3 ${highlight(plan.id)}`}>
                  <Mark yes={plan.features.includes(feature)} />
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <td className="px-4 py-3 text-zinc-700">Funcionários ativos</td>
            {PLANS.map((plan) => (
              <td key={plan.id} className={`px-4 py-3 text-center font-semibold tabular-nums text-zinc-900 ${highlight(plan.id)}`}>
                {plan.maxEmployees ?? 'Ilimitado'}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
