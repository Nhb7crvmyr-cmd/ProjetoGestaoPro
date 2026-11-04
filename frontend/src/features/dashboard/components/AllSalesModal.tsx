// Popup "Quem comprou: ver todos": todas as vendas do mês, com busca (cliente ou produto), filtro por forma de
// pagamento e ordem (mais recentes, maior valor, menor valor). Clicar no cliente abre a análise dele.

import { useState } from 'react';
import { Icon } from '../../../components/ui/Icon';
import { Modal } from '../../../components/ui/Modal';
import { formatCents } from '../../../utils/formatters';
import { PAYMENT_METHODS } from '../../vendas/constants/paymentMethods';
import type { Sale } from '../../vendas/services/saleService';
import type { DrillFilter } from '../utils/salesStats';
import { DrillSalesTable } from './DrillSalesTable';

/** Opções de ordem. */
const SORTS = {
  recent: { label: 'Mais recentes', compare: (a: Sale, b: Sale) => b.createdAt.localeCompare(a.createdAt) },
  highest: { label: 'Maior valor', compare: (a: Sale, b: Sale) => b.totalCents - a.totalCents },
  lowest: { label: 'Menor valor', compare: (a: Sale, b: Sale) => a.totalCents - b.totalCents },
} as const;
type SortId = keyof typeof SORTS;

/** Propriedades do popup. */
interface AllSalesModalProps {
  sales: Sale[];
  monthName: string;
  isOwner: boolean;
  canGoBack: boolean;
  onOpen: (filter: DrillFilter) => void;
  onBack: () => void;
  onClose: () => void;
}

const selectClass =
  'rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100';

/**
 * Desenha o popup.
 * @param props - vendas, mês, perfil e ações
 * @returns o modal
 */
export function AllSalesModal({ sales, monthName, isOwner, canGoBack, onOpen, onBack, onClose }: AllSalesModalProps) {
  const [search, setSearch] = useState('');
  const [payment, setPayment] = useState('');
  const [sort, setSort] = useState<SortId>('recent');

  const term = search.trim().toLowerCase();
  const filtered = sales
    .filter(
      (sale) =>
        (!payment || sale.paymentMethod === payment) &&
        (!term ||
          sale.customerName.toLowerCase().includes(term) ||
          sale.items.some((item) => item.productName.toLowerCase().includes(term))),
    )
    // O filter já devolve uma lista NOVA, então o sort não mexe na lista original de vendas.
    .sort(SORTS[sort].compare);
  const totalCents = filtered.reduce((sum, sale) => sum + sale.totalCents, 0);

  return (
    <Modal open onClose={onClose} title="Quem comprou: todas as vendas" size="4xl">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          {canGoBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 self-start rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 ring-1 ring-zinc-300 transition hover:bg-zinc-50"
            >
              <Icon name="arrowLeft" /> Voltar
            </button>
          )}
          <label className="relative block flex-1">
            <span className="sr-only">Buscar</span>
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por cliente ou produto…"
              autoFocus
              className="block w-full rounded-lg border border-zinc-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            />
          </label>
          <select value={payment} onChange={(event) => setPayment(event.target.value)} aria-label="Forma de pagamento" className={selectClass}>
            <option value="">Todas as formas de pagamento</option>
            {PAYMENT_METHODS.map((method) => (
              <option key={method.value} value={method.value}>
                {method.label}
              </option>
            ))}
          </select>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortId)} aria-label="Ordenar" className={selectClass}>
            {Object.entries(SORTS).map(([id, option]) => (
              <option key={id} value={id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <p className="text-sm text-zinc-500">
          <span className="capitalize">{monthName}</span> · {filtered.length} {filtered.length === 1 ? 'venda' : 'vendas'} ·{' '}
          <strong className="font-semibold text-zinc-900">{formatCents(totalCents)}</strong>
        </p>

        {filtered.length === 0 ? (
          <p className="rounded-xl bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">Nenhuma venda encontrada.</p>
        ) : (
          <DrillSalesTable
            sales={filtered}
            showSeller={isOwner}
            onCustomer={(sale) => onOpen({ kind: 'customer', key: sale.customerId, name: sale.customerName })}
          />
        )}
      </div>
    </Modal>
  );
}
