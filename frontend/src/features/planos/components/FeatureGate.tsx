// "Porteiro" de ferramenta paga: se o plano da empresa não inclui a ferramenta, mostra um cartão com cadeado
// e o plano necessário, em vez da tela. (Quem bloqueia de verdade é o backend: requireFeature.)

import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Icon } from '../../../components/ui/Icon';
import { FEATURE_LABELS, planForFeature, type PlanFeature } from '../../empresa/constants/plans';
import { useCompany } from '../../empresa/hooks/useCompany';

/** Propriedades do porteiro. */
interface FeatureGateProps {
  feature: PlanFeature;
  children: ReactNode;
}

/**
 * Mostra a tela (children) só se o plano tiver a ferramenta.
 * @param props - ferramenta e tela protegida
 * @returns a tela, o cartão de bloqueio ou "carregando"
 */
export function FeatureGate({ feature, children }: FeatureGateProps) {
  const companyQuery = useCompany();
  if (companyQuery.isPending) return <p className="text-sm text-zinc-500">Carregando…</p>;

  const allowed = companyQuery.data?.access.features.includes(feature);
  if (allowed) return <>{children}</>;

  const plan = planForFeature(feature);
  return (
    // Margens próprias: algumas páginas (como o Chat) ocupam a tela inteira, sem margem.
    <div className="mx-4 my-8 max-w-lg rounded-2xl bg-white p-8 text-center ring-1 ring-zinc-200/70 sm:mx-auto">
      <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
        <Icon name="lock" className="size-6" />
      </span>
      <h1 className="mt-4 text-xl font-semibold text-zinc-900">{FEATURE_LABELS[feature]} está bloqueado</h1>
      <p className="mt-1 text-sm text-zinc-500">Essa ferramenta está disponível a partir do plano {plan?.name}.</p>
      <Link
        to="/plano"
        className="mt-6 inline-flex items-center justify-center rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
      >
        Ver planos
      </Link>
    </div>
  );
}
