// Página do SuperAdmin aberta pelo botão "Clientes" da lista de Empresas: os clientes daquela empresa (suporte).

import { Link, useParams } from 'react-router';
import { CompanyCustomersPanel } from '../components/CompanyCustomersPanel';
import { useAdminCompanyCustomers } from '../hooks/useAdminCompanyCustomers';
import { Icon } from '../../../components/ui/Icon';

/**
 * Tela de clientes de uma empresa (SuperAdmin), com a empresa vinda da URL.
 * @returns a página
 */
export function AdminCompanyCustomersPage() {
  // useParams lê a parte variável da URL: /admin/empresas/:empresaId/clientes.
  const { empresaId = '' } = useParams();
  // Mesma consulta do painel: o TanStack Query reaproveita o cache (não busca duas vezes).
  const query = useAdminCompanyCustomers(empresaId);

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/empresas" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700 hover:text-brand-800">
          <Icon name="arrowLeft" /> Voltar para empresas
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-zinc-900">Clientes: {query.data?.companyName ?? '…'}</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Suporte: transfira o atendimento quando um atendente sair ou ficar ausente. Toda transferência fica registrada.
        </p>
      </div>
      <CompanyCustomersPanel empresaId={empresaId} />
    </div>
  );
}
