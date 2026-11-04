// Painel de clientes de UMA empresa para o SuperAdmin (suporte): busca, filtro por atendente, "Atribuídos a mim",
// tabela com dados completos e transferência (na linha ou em lote). Usado em duas páginas do painel admin.

import { useState } from 'react';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { onlyDigits } from '../../../utils/formatters';
import { useSession } from '../../auth/context/SessionContext';
import { TransferCustomersModal, type TransferableCustomer } from '../../clientes/components/TransferCustomersModal';
import { useAdminCompanyCustomers, useAdminTransferCustomers } from '../hooks/useAdminCompanyCustomers';
import { attendantRoleLabel } from '../services/adminService';
import { CompanyCustomersTable } from './CompanyCustomersTable';

/** Propriedades do painel. */
interface CompanyCustomersPanelProps {
  empresaId: string;
}

/**
 * Desenha o painel.
 * @param props - id da empresa
 * @returns filtros + tabela + popup de transferência em lote
 */
export function CompanyCustomersPanel({ empresaId }: CompanyCustomersPanelProps) {
  const { user } = useSession();
  const query = useAdminCompanyCustomers(empresaId);
  const transfer = useAdminTransferCustomers(empresaId);

  const [search, setSearch] = useState('');
  const [sellerFilter, setSellerFilter] = useState('');
  // Ids marcados nas caixinhas. Set = conjunto sem repetição.
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [transferList, setTransferList] = useState<TransferableCustomer[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const customers = query.data?.customers ?? [];
  const attendants = query.data?.attendants ?? [];

  // Filtros: nome, e-mail, telefone ou documento (ignora maiúsculas e pontuação) e atendente.
  const term = search.trim().toLowerCase();
  const termDigits = onlyDigits(term);
  const filtered = customers.filter(
    (customer) =>
      (!term ||
        customer.name.toLowerCase().includes(term) ||
        customer.email?.includes(term) ||
        (termDigits.length >= 3 && (customer.phone.includes(termDigits) || customer.document?.includes(termDigits)))) &&
      (!sellerFilter || customer.sellerId === sellerFilter),
  );
  const selectedCustomers = customers.filter((customer) => selected.has(customer.customerId));
  const mineCount = customers.filter((customer) => customer.sellerId === user.userId).length;

  // Quantos clientes cada atendente tem (para mostrar no filtro).
  const countBySeller = new Map<string, number>();
  for (const customer of customers) countBySeller.set(customer.sellerId, (countBySeller.get(customer.sellerId) ?? 0) + 1);

  /**
   * Troca o filtro de atendente e limpa a seleção (para não transferir quem não está na tela).
   * @param sellerId - id do atendente ('' = todos)
   */
  function changeSellerFilter(sellerId: string) {
    setSellerFilter(sellerId);
    setSelected(new Set());
  }

  /**
   * Marca/desmarca um cliente. Cria um Set NOVO: o React só redesenha quando o estado é um objeto novo.
   * @param customerId - id do cliente
   */
  function toggleSelect(customerId: string) {
    const next = new Set(selected);
    if (next.has(customerId)) next.delete(customerId);
    else next.add(customerId);
    setSelected(next);
  }

  /** Marca todos os clientes visíveis (ou desmarca, se já estavam todos marcados). */
  function toggleSelectAll() {
    const allSelected = filtered.every((customer) => selected.has(customer.customerId));
    setSelected(allSelected ? new Set() : new Set(filtered.map((customer) => customer.customerId)));
  }

  /**
   * Transfere um cliente pela própria linha da tabela.
   * @param customerId - cliente
   * @param toSellerId - novo atendente
   */
  async function transferOne(customerId: string, toSellerId: string) {
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const result = await transfer.mutateAsync({ customerIds: [customerId], toSellerId });
      const name = customers.find((customer) => customer.customerId === customerId)?.name;
      setSuccessMessage(`${name} agora é atendido por ${result.toSellerName}.`);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Não foi possível transferir.');
    }
  }

  return (
    <div className="space-y-4">
      {successMessage && <Alert type="success">{successMessage}</Alert>}
      {errorMessage && <Alert type="error">{errorMessage}</Alert>}
      {query.isPending && <p className="text-sm text-zinc-500">Carregando clientes…</p>}
      {query.isError && <Alert type="error">{query.error.message}</Alert>}

      {query.isSuccess && (
        <>
          <div className="flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-zinc-200 lg:flex-row lg:flex-wrap lg:items-center">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, CPF, telefone ou e-mail…"
              aria-label="Buscar cliente"
              className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 lg:max-w-sm"
            />
            <select
              value={sellerFilter}
              onChange={(event) => changeSellerFilter(event.target.value)}
              aria-label="Filtrar por atendente"
              className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 lg:max-w-xs"
            >
              <option value="">Todos os atendentes ({customers.length})</option>
              {attendants.map((attendant) => (
                <option key={attendant.id} value={attendant.id}>
                  {attendant.name}
                  {attendantRoleLabel(attendant.role)}
                  {!attendant.enabled ? ' (bloqueado)' : ''} · {countBySeller.get(attendant.id) ?? 0}
                </option>
              ))}
            </select>
            {/* Atalho: os clientes que o próprio SuperAdmin assumiu nesta empresa. */}
            <button
              type="button"
              onClick={() => changeSellerFilter(sellerFilter === user.userId ? '' : user.userId)}
              className={`rounded-lg px-3 py-2 text-sm font-medium ring-1 transition ${
                sellerFilter === user.userId ? 'bg-brand-700 text-white ring-brand-700' : 'text-zinc-700 ring-zinc-300 hover:bg-zinc-50'
              }`}
            >
              Atribuídos a mim ({mineCount})
            </button>
            <Button
              variant="secondary"
              className="lg:ml-auto lg:w-auto"
              disabled={selectedCustomers.length === 0}
              onClick={() => setTransferList(selectedCustomers)}
            >
              Transferir selecionados ({selectedCustomers.length})
            </Button>
          </div>

          <CompanyCustomersTable
            customers={filtered}
            attendants={attendants}
            selected={selected}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onTransfer={transferOne}
          />
        </>
      )}

      {/* Popup da transferência EM LOTE (clientes marcados nas caixinhas). */}
      <TransferCustomersModal
        customers={transferList}
        options={attendants
          .filter((attendant) => attendant.enabled)
          .map((attendant) => ({ value: attendant.id, label: `${attendant.name}${attendantRoleLabel(attendant.role)}` }))}
        onTransfer={(customerIds, toSellerId) => transfer.mutateAsync({ customerIds, toSellerId })}
        onClose={() => setTransferList([])}
        onDone={(message) => {
          setSuccessMessage(message);
          setSelected(new Set());
        }}
      />
    </div>
  );
}
