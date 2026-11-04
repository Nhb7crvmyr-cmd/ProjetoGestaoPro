// Tabela de clientes: contato (com link do WhatsApp), documento, cidade e, para o Dono, quem atende.

import { TransferInfo } from '../../../components/ui/TransferInfo';
import { formatCnpj, formatCpf, formatPhone } from '../../../utils/formatters';
import type { Customer } from '../services/customerService';

/** Propriedades da tabela. */
interface CustomersTableProps {
  customers: Customer[];
  /** true = Dono: mostra a coluna "Atendido por". */
  showSeller: boolean;
  onEdit: (customer: Customer) => void;
  onToggleActive: (customer: Customer) => void;
  /** Só para o Dono: abre o popup de transferir atendimento. */
  onTransfer?: (customer: Customer) => void;
  pendingId?: string;
}

const smallButton = 'rounded-md px-2.5 py-1.5 text-xs font-semibold ring-1 transition disabled:opacity-60';

/**
 * Monta o link do WhatsApp. O "55" é o código do Brasil; o wa.me abre a conversa direto.
 * @param phone - telefone só com números (DDD + número)
 * @returns o endereço do WhatsApp
 */
function whatsappLink(phone: string): string {
  return `https://wa.me/55${phone}`;
}

/**
 * Desenha a tabela.
 * @param props - clientes, se mostra o responsável e ações
 * @returns a tabela (ou mensagem se vazia)
 */
export function CustomersTable({ customers, showSeller, onEdit, onToggleActive, onTransfer, pendingId }: CustomersTableProps) {
  if (customers.length === 0) {
    return (
      <div className="rounded-xl bg-white p-10 text-center ring-1 ring-zinc-200">
        <p className="font-medium text-zinc-900">Nenhum cliente encontrado</p>
        <p className="mt-1 text-sm text-zinc-500">Cadastre o primeiro no botão "Novo cliente".</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-zinc-200">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Cliente</th>
            <th className="px-4 py-3 font-medium">Contato</th>
            <th className="px-4 py-3 font-medium">Cidade</th>
            {showSeller && <th className="px-4 py-3 font-medium">Atendido por</th>}
            <th className="px-4 py-3 text-right font-medium">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {customers.map((customer) => (
            <tr key={customer.customerId} className={`hover:bg-zinc-50/60 ${customer.active ? '' : 'opacity-60'}`}>
              <td className="px-4 py-3">
                <p className="font-medium text-zinc-900">
                  {customer.name}
                  {!customer.active && (
                    <span className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-zinc-500">Inativo</span>
                  )}
                </p>
                {customer.document && (
                  <p className="text-xs text-zinc-500">
                    {customer.documentType} {customer.documentType === 'CNPJ' ? formatCnpj(customer.document) : formatCpf(customer.document)}
                  </p>
                )}
              </td>
              <td className="px-4 py-3">
                {/* target="_blank" abre em outra aba; rel="noreferrer" é uma proteção padrão para links externos. */}
                <a href={whatsappLink(customer.phone)} target="_blank" rel="noreferrer" className="font-medium text-emerald-700 hover:underline">
                  {formatPhone(customer.phone)}
                </a>
                {customer.email && <p className="text-xs text-zinc-500">{customer.email}</p>}
              </td>
              <td className="px-4 py-3 text-zinc-700">{customer.address ? `${customer.address.city}/${customer.address.state}` : '—'}</td>
              {showSeller && (
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-800">{customer.sellerName}</p>
                  {customer.lastTransfer && <TransferInfo transfer={customer.lastTransfer} />}
                </td>
              )}
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                  {onTransfer && (
                    <button type="button" className={`${smallButton} text-brand-700 ring-brand-200 hover:bg-brand-50`} onClick={() => onTransfer(customer)}>
                      Transferir
                    </button>
                  )}
                  <button type="button" className={`${smallButton} text-zinc-700 ring-zinc-300 hover:bg-zinc-50`} onClick={() => onEdit(customer)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    disabled={pendingId === customer.customerId}
                    onClick={() => onToggleActive(customer)}
                    className={`${smallButton} ${customer.active ? 'text-zinc-600 ring-zinc-300 hover:bg-zinc-50' : 'text-emerald-700 ring-emerald-200 hover:bg-emerald-50'}`}
                  >
                    {pendingId === customer.customerId ? '…' : customer.active ? 'Desativar' : 'Reativar'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
