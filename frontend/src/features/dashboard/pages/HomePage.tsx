// Página inicial (/inicio). Hoje: situação do plano, dados da empresa e atalhos. Os gráficos chegam na Etapa 10.

import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Alert } from '../../../components/ui/Alert';
import { useSession } from '../../auth/context/SessionContext';
import { CompanySummaryCard } from '../../empresa/components/CompanySummaryCard';
import { PlanStatusCard } from '../../empresa/components/PlanStatusCard';
import { PlansModal } from '../../empresa/components/PlansModal';
import { useCompany } from '../../empresa/hooks/useCompany';
import { Icon } from '../../../components/ui/Icon';

/** Módulos que ainda serão construídos, com a etapa de cada um. */
const UPCOMING_MODULES = [
  { name: 'Relatórios', stage: 14 },
];

/**
 * Tela inicial.
 * @returns a página conforme o perfil (SuperAdmin ou empresa)
 */
export function HomePage() {
  const { user } = useSession();
  const isSuperAdmin = user.groups.includes('SuperAdmin');
  const isOwner = user.groups.includes('Dono');
  // O SuperAdmin não tem empresa: "enabled=false" impede a busca.
  const companyQuery = useCompany(!isSuperAdmin);

  // Se veio do onboarding com { openPlans: true }, abre o popup de planos automaticamente.
  const location = useLocation();
  const navigate = useNavigate();
  const [plansOpen, setPlansOpen] = useState(false);
  useEffect(() => {
    if ((location.state as { openPlans?: boolean } | null)?.openPlans) {
      setPlansOpen(true);
      // Limpa o "state" da navegação, para não reabrir ao recarregar a página.
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate]);

  const firstName = user.name.split(' ')[0];

  if (isSuperAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-zinc-900">Olá, {firstName}!</h1>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { to: '/admin', title: 'Usuários', text: 'Veja todos os usuários e bloqueie ou libere acessos.' },
            { to: '/admin/empresas', title: 'Empresas', text: 'Veja as empresas cadastradas e a situação dos planos.' },
          ].map((card) => (
            <Link key={card.to} to={card.to} className="rounded-xl bg-white p-5 ring-1 ring-zinc-200 transition hover:ring-brand-600">
              <p className="flex items-center gap-1.5 font-semibold text-zinc-900">
                {card.title} <Icon name="arrowRight" />
              </p>
              <p className="mt-1 text-sm text-zinc-500">{card.text}</p>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Olá, {firstName}!</h1>
        <p className="mt-1 text-sm text-zinc-500">Bem-vindo ao painel da sua empresa.</p>
      </div>

      {companyQuery.isPending && <p className="text-sm text-zinc-500">Carregando dados da empresa…</p>}
      {companyQuery.isError && <Alert type="error">{companyQuery.error.message}</Alert>}

      {companyQuery.data && (
        <>
          <PlanStatusCard plan={companyQuery.data.plan} canManage={isOwner} onOpenPlans={() => setPlansOpen(true)} />

          <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <CompanySummaryCard company={companyQuery.data} />
            </div>
            <div className="rounded-xl bg-white p-5 ring-1 ring-zinc-200 lg:col-span-2">
              <h2 className="font-semibold text-zinc-900">Próximos módulos</h2>
              <p className="mt-1 text-sm text-zinc-500">Construídos etapa por etapa.</p>
              <ul className="mt-4 space-y-2">
                {UPCOMING_MODULES.map((module) => (
                  <li key={module.name} className="flex items-center justify-between text-sm">
                    <span className="text-zinc-700">{module.name}</span>
                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-500">Etapa {module.stage}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {isOwner && (
            <PlansModal open={plansOpen} onClose={() => setPlansOpen(false)} currentPlanId={companyQuery.data.plan.planId} />
          )}
        </>
      )}
    </div>
  );
}
