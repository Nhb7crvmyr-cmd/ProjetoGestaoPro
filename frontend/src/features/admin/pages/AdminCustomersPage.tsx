// Página "Clientes" do menu Administração (SuperAdmin): escolhe a empresa e, nela, filtra por atendente,
// busca por nome/CPF ou vê os clientes "Atribuídos a mim". A empresa escolhida fica na URL (?empresa=...).

import { useSearchParams } from 'react-router';
import { Alert } from '../../../components/ui/Alert';
import { CompanyCustomersPanel } from '../components/CompanyCustomersPanel';
import { useAdminCompanies } from '../hooks/useAdminCompanies';

/**
 * Tela de clientes do SuperAdmin.
 * @returns a página
 */
export function AdminCustomersPage() {
  const companiesQuery = useAdminCompanies();
  // Guardar a empresa na URL faz o "voltar" do navegador e o recarregar a página manterem a escolha.
  const [searchParams, setSearchParams] = useSearchParams();
  const empresaId = searchParams.get('empresa') ?? '';
  const companies = companiesQuery.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">Clientes</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Escolha a empresa para ver os clientes, filtrar por atendente, buscar por nome ou CPF e transferir atendimento.
        </p>
      </div>

      {companiesQuery.isError && <Alert type="error">{companiesQuery.error.message}</Alert>}

      <div className="rounded-xl bg-white p-4 ring-1 ring-zinc-200">
        <label htmlFor="empresa" className="mb-1.5 block text-sm font-medium text-zinc-700">
          Empresa
        </label>
        <select
          id="empresa"
          value={empresaId}
          onChange={(event) => setSearchParams(event.target.value ? { empresa: event.target.value } : {})}
          className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 sm:max-w-md"
        >
          <option value="">{companiesQuery.isPending ? 'Carregando empresas…' : 'Selecione a empresa'}</option>
          {companies.map((company) => (
            <option key={company.empresaId} value={company.empresaId}>
              {company.tradeName || company.legalName} · {company.city}/{company.state}
            </option>
          ))}
        </select>
      </div>

      {/* "key" faz o React recriar o painel ao trocar de empresa (limpa busca, filtro e seleção). */}
      {empresaId ? (
        <CompanyCustomersPanel key={empresaId} empresaId={empresaId} />
      ) : (
        <p className="rounded-xl bg-white p-10 text-center text-sm text-zinc-500 ring-1 ring-zinc-200">
          Selecione uma empresa para ver os clientes.
        </p>
      )}
    </div>
  );
}
