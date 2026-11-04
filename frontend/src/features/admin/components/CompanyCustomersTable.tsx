// Tabela de clientes de uma empresa no painel do SuperAdmin: cliente (com contato), atendente (nome + e-mail) e,
// na própria linha, "Transferir para…": ao escolher um nome, pede confirmação; se cancelar, a caixa volta ao início.

import { useState } from 'react';
import { TransferInfo } from '../../../components/ui/TransferInfo';
import { formatCnpj, formatCpf, formatPhone } from '../../../utils/formatters';
import { attendantRoleLabel, type AdminAttendant, type AdminCompanyCustomer } from '../services/adminService';

/** Propriedades da tabela. */
interface CompanyCustomersTableProps {
  customers: AdminCompanyCustomer[];
  /** Todos os atendentes da empresa (para achar nome/e-mail e montar as opções). */
  attendants: AdminAttendant[];
  /** Ids marcados nas caixinhas (para transferir em lote). */
  selected: Set<string>;
  onToggleSelect: (customerId: string) => void;
  onToggleSelectAll: () => void;
  /** Transfere UM cliente para o atendente escolhido na linha. */
  onTransfer: (customerId: string, toSellerId: string) => Promise<void>;
}

/**
 * Uma linha da tabela. Cada linha guarda a PRÓPRIA escolha de destino (estado local),
 * para que escolher um atendente numa linha não mexa nas outras.
 * @param props - cliente, atendentes, seleção e ações
 * @returns a linha <tr>
 */
function CustomerRow({
  customer,
  attendants,
  isSelected,
  onToggleSelect,
  onTransfer,
}: {
  customer: AdminCompanyCustomer;
  attendants: AdminAttendant[];
  isSelected: boolean;
  onToggleSelect: () => void;
  onTransfer: (toSellerId: string) => Promise<void>;
}) {
  const [isPending, setIsPending] = useState(false);
  const seller = attendants.find((attendant) => attendant.id === customer.sellerId);
  // Destinos possíveis: atendentes ativos, menos o atual.
  const options = attendants.filter((attendant) => attendant.enabled && attendant.id !== customer.sellerId);

  /**
   * Chamado ao escolher um nome na caixa. Pergunta na hora; a caixa NÃO guarda a escolha
   * (ela é "controlada" com value="" sempre), então nunca fica um nome errado "esperando" um clique.
   * @param toSellerId - atendente escolhido
   */
  async function handleChoose(toSellerId: string) {
    const target = attendants.find((attendant) => attendant.id === toSellerId);
    if (!target || !window.confirm(`Transferir ${customer.name} para ${target.name}?`)) return;
    setIsPending(true);
    try {
      await onTransfer(toSellerId);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <tr className={customer.active ? '' : 'opacity-60'}>
      <td className="px-4 py-3">
        <input type="checkbox" aria-label={`Selecionar ${customer.name}`} className="size-4 accent-brand-700" checked={isSelected} onChange={onToggleSelect} />
      </td>
      <td className="px-4 py-3">
        <p className="font-medium text-zinc-900">
          {customer.name}
          {!customer.active && <span className="ml-2 text-xs font-normal text-zinc-400">(inativo)</span>}
        </p>
        {/* Contato completo: o SuperAdmin tem acesso para dar suporte (regra do CLAUDE.md). */}
        <p className="text-xs text-zinc-500">
          <a href={`https://wa.me/55${customer.phone}`} target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline">
            {formatPhone(customer.phone)}
          </a>
          {customer.email && <> · {customer.email}</>}
        </p>
        {(customer.document || customer.address) && (
          <p className="text-xs text-zinc-400">
            {customer.document &&
              `${customer.documentType} ${customer.documentType === 'CNPJ' ? formatCnpj(customer.document) : formatCpf(customer.document)}`}
            {customer.document && customer.address && ' · '}
            {customer.address && `${customer.address.city}/${customer.address.state}`}
          </p>
        )}
      </td>
      <td className="px-4 py-3">
        <p className="text-zinc-900">
          {customer.sellerName}
          {seller && seller.role !== 'Funcionario' && (
            <span className="ml-1.5 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-zinc-500">
              {seller.role === 'Dono' ? 'Supervisor' : 'Suporte'}
            </span>
          )}
          {seller && !seller.enabled && <span className="ml-1.5 rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-red-600">Bloqueado</span>}
        </p>
        {seller?.email && <p className="text-xs text-zinc-500">{seller.email}</p>}
        {customer.lastTransfer && <TransferInfo transfer={customer.lastTransfer} />}
      </td>
      <td className="px-4 py-3">
        <div className="flex justify-end">
          <select
            // value fixo em "": depois de escolher (confirmando ou cancelando), a caixa volta a "Transferir para…".
            value=""
            disabled={isPending || options.length === 0}
            onChange={(event) => void handleChoose(event.target.value)}
            aria-label={`Transferir ${customer.name} para`}
            className="w-48 rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
          >
            <option value="">{isPending ? 'Transferindo…' : 'Transferir para…'}</option>
            {options.map((attendant) => (
              <option key={attendant.id} value={attendant.id}>
                {attendant.name}
                {attendantRoleLabel(attendant.role)}
              </option>
            ))}
          </select>
        </div>
      </td>
    </tr>
  );
}

/**
 * Desenha a tabela.
 * @param props - clientes, atendentes, seleção e ações
 * @returns a tabela (ou mensagem se vazia)
 */
export function CompanyCustomersTable({ customers, attendants, selected, onToggleSelect, onToggleSelectAll, onTransfer }: CompanyCustomersTableProps) {
  if (customers.length === 0) {
    return <p className="rounded-xl bg-white p-8 text-center text-sm text-zinc-500 ring-1 ring-zinc-200">Nenhum cliente encontrado.</p>;
  }
  const allSelected = customers.every((customer) => selected.has(customer.customerId));

  return (
    <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-zinc-200">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="w-10 px-4 py-3">
              <input type="checkbox" aria-label="Selecionar todos" className="size-4 accent-brand-700" checked={allSelected} onChange={onToggleSelectAll} />
            </th>
            <th className="px-4 py-3 font-medium">Cliente</th>
            <th className="px-4 py-3 font-medium">Atendido por</th>
            <th className="px-4 py-3 text-right font-medium">Transferir</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {customers.map((customer) => (
            <CustomerRow
              key={customer.customerId}
              customer={customer}
              attendants={attendants}
              isSelected={selected.has(customer.customerId)}
              onToggleSelect={() => onToggleSelect(customer.customerId)}
              onTransfer={(toSellerId) => onTransfer(customer.customerId, toSellerId)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
