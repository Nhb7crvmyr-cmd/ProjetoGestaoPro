// Página do SuperAdmin com todas as empresas cadastradas e a situação do plano de cada uma.

import { useState } from 'react';
import { Alert } from '../../../components/ui/Alert';
import { CompaniesTable } from '../components/CompaniesTable';
import { SetPlanModal } from '../components/SetPlanModal';
import type { AdminCompany } from '../services/adminService';
import { useAdminCompanies } from '../hooks/useAdminCompanies';

/**
 * Tela de empresas.
 * @returns a página com resumo e tabela
 */
export function AdminCompaniesPage() {
  const companiesQuery = useAdminCompanies();
  // Empresa no popup "Plano" (undefined = fechado).
  const [planCompany, setPlanCompany] = useState<AdminCompany>();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const companies = companiesQuery.data ?? [];
  const activeCount = companies.filter((company) => company.planStatus === 'ACTIVE').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Empresas</h1>
          <p className="mt-1 text-sm text-zinc-500">Todas as empresas cadastradas na plataforma.</p>
        </div>
        <button
          type="button"
          onClick={() => companiesQuery.refetch()}
          disabled={companiesQuery.isFetching}
          className="self-start rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 ring-1 ring-zinc-300 transition hover:bg-zinc-50 disabled:opacity-60 sm:self-auto"
        >
          {companiesQuery.isFetching ? 'Atualizando…' : 'Atualizar'}
        </button>
      </div>

      {successMessage && <Alert type="success">{successMessage}</Alert>}
      {companiesQuery.isPending && <p className="text-sm text-zinc-500">Carregando empresas…</p>}
      {companiesQuery.isError && <Alert type="error">{companiesQuery.error.message}</Alert>}

      {companiesQuery.isSuccess && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              { label: 'Empresas', value: companies.length },
              { label: 'Com plano ativo', value: activeCount },
            ].map((stat) => (
              <div key={stat.label} className="rounded-xl bg-white p-4 ring-1 ring-zinc-200">
                <p className="text-sm text-zinc-500">{stat.label}</p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900">{stat.value}</p>
              </div>
            ))}
          </div>
          <CompaniesTable companies={companies} onSetPlan={setPlanCompany} />
        </>
      )}
      <SetPlanModal company={planCompany} onClose={() => setPlanCompany(undefined)} onDone={setSuccessMessage} />
    </div>
  );
}
