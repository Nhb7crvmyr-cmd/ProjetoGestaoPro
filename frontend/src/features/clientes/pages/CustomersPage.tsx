// Página "Clientes": o Dono vê todos (com filtro por atendente); o funcionário vê e cadastra só os dele.

import { useMemo, useState } from 'react';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { onlyDigits } from '../../../utils/formatters';
import { useSession } from '../../auth/context/SessionContext';
import { useEmployees } from '../../funcionarios/hooks/useEmployees';
import { CustomerFormModal } from '../components/CustomerFormModal';
import { CustomersTable } from '../components/CustomersTable';
import { TransferCustomersModal } from '../components/TransferCustomersModal';
import { useCustomers, useTransferCustomers, useUpdateCustomer } from '../hooks/useCustomers';
import type { Customer } from '../services/customerService';

/**
 * Tela de clientes.
 * @returns a página
 */
export function CustomersPage() {
  const { user } = useSession();
  const isOwner = user.groups.includes('Dono');
  const customersQuery = useCustomers();
  const updateCustomer = useUpdateCustomer();

  // undefined = popup fechado; null = cadastro; Customer = edição.
  const [editing, setEditing] = useState<Customer | null | undefined>(undefined);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sellerId, setSellerId] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  // Clientes no popup de transferência (lista vazia = popup fechado).
  const [transferList, setTransferList] = useState<Customer[]>([]);
  const transfer = useTransferCustomers();
  // Funcionários só são buscados quando o popup de transferência abre (e só o Dono abre).
  const employeesQuery = useEmployees(isOwner && transferList.length > 0);
  // Atendentes possíveis: o próprio Dono + funcionários ativos.
  const transferOptions = [
    { value: user.userId, label: `${user.name} (você, Supervisor)` },
    ...(employeesQuery.data ?? [])
      .filter((employee) => employee.enabled && employee.status !== 'REMOVED')
      .map((employee) => ({ value: employee.userId, label: employee.name })),
  ];

  const customers = customersQuery.data ?? [];

  // Lista de atendentes (sem repetir), para o filtro do Dono. Map usa o id como chave única.
  const sellers = useMemo(
    () => [...new Map(customers.map((customer) => [customer.sellerId, customer.sellerName])).entries()],
    [customers],
  );

  const term = search.trim().toLowerCase();
  const termDigits = onlyDigits(term);
  const filtered = customers.filter(
    (customer) =>
      (showInactive || customer.active) &&
      (!sellerId || customer.sellerId === sellerId) &&
      (!term ||
        customer.name.toLowerCase().includes(term) ||
        customer.email?.includes(term) ||
        // Busca por números (telefone/documento) ignora a pontuação digitada.
        (termDigits.length >= 3 && (customer.phone.includes(termDigits) || customer.document?.includes(termDigits)))),
  );

  /**
   * Desativa/reativa um cliente (mantendo todos os dados).
   * @param customer - cliente da linha
   */
  function handleToggleActive(customer: Customer) {
    const action = customer.active ? 'DESATIVAR' : 'REATIVAR';
    if (!window.confirm(`Deseja ${action} o cliente ${customer.name}?`)) return;
    setSuccessMessage(null);
    const { customerId, sellerId: _s, sellerName: _n, active, createdAt: _c, updatedAt: _u, ...input } = customer;
    updateCustomer.mutate(
      { customerId, input: { ...input, active: !active } },
      { onSuccess: () => setSuccessMessage(`Cliente "${customer.name}" ${active ? 'desativado' : 'reativado'}.`) },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Clientes</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {isOwner ? 'Todos os clientes da empresa e quem atende cada um.' : 'Os clientes que você atende.'}
          </p>
        </div>
        <Button className="sm:w-auto" onClick={() => setEditing(null)}>
          + Novo cliente
        </Button>
      </div>

      {successMessage && <Alert type="success">{successMessage}</Alert>}
      {updateCustomer.isError && <Alert type="error">{updateCustomer.error.message}</Alert>}

      <div className="flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-zinc-200 lg:flex-row lg:items-center">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nome, telefone, e-mail ou documento…"
          aria-label="Buscar clientes"
          className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 lg:max-w-sm"
        />
        {isOwner && sellers.length > 0 && (
          <select
            value={sellerId}
            onChange={(event) => setSellerId(event.target.value)}
            aria-label="Filtrar por atendente"
            className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 lg:max-w-[220px]"
          >
            <option value="">Todos os atendentes</option>
            {sellers.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        )}
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" className="size-4 accent-brand-700" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} />
          Mostrar inativos
        </label>
        <span className="text-sm text-zinc-500 lg:ml-auto">
          {filtered.length} de {customers.length} clientes
        </span>
      </div>

      {/* Transferência em lote: aparece quando o Dono filtra por um atendente. */}
      {isOwner && sellerId && filtered.length > 0 && (
        <div className="flex flex-col gap-3 rounded-xl bg-brand-50 px-4 py-3 ring-1 ring-brand-100 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-brand-900">
            Atendente desligado ou ausente? Passe os clientes dele para outra pessoa de uma vez.
          </p>
          <Button className="sm:w-auto" onClick={() => setTransferList(filtered)}>
            Transferir todos ({filtered.length})
          </Button>
        </div>
      )}

      {customersQuery.isPending && <p className="text-sm text-zinc-500">Carregando clientes…</p>}
      {customersQuery.isError && <Alert type="error">{customersQuery.error.message}</Alert>}
      {customersQuery.isSuccess && (
        <CustomersTable
          customers={filtered}
          showSeller={isOwner}
          onEdit={(customer) => setEditing(customer)}
          onToggleActive={handleToggleActive}
          onTransfer={isOwner ? (customer) => setTransferList([customer]) : undefined}
          pendingId={updateCustomer.isPending ? updateCustomer.variables?.customerId : undefined}
        />
      )}

      <CustomerFormModal
        open={editing !== undefined}
        customer={editing ?? undefined}
        onClose={() => setEditing(undefined)}
        onSaved={setSuccessMessage}
      />
      {isOwner && (
        <TransferCustomersModal
          customers={transferList}
          options={transferOptions}
          optionsLoading={employeesQuery.isPending}
          onTransfer={(customerIds, toSellerId) => transfer.mutateAsync({ customerIds, toSellerId })}
          onClose={() => setTransferList([])}
          onDone={setSuccessMessage}
        />
      )}
    </div>
  );
}
