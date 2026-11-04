// Página "Vendas": vendas do mês (com setas para trocar de mês), resumo, filtro por vendedor (Dono) e detalhes.

import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Alert } from '../../../components/ui/Alert';
import { formatCents } from '../../../utils/formatters';
import { useSession } from '../../auth/context/SessionContext';
import { SaleDetailsModal } from '../components/SaleDetailsModal';
import { MonthPicker } from '../components/MonthPicker';
import { SalesTable } from '../components/SalesTable';
import { useSales } from '../hooks/useSales';
import type { Sale } from '../services/saleService';
import { currentMonth, monthRange, type MonthRef } from '../utils/period';

/**
 * Tela de vendas.
 * @returns a página
 */
export function SalesPage() {
  const { user } = useSession();
  const isOwner = user.groups.includes('Dono');
  const [month, setMonth] = useState<MonthRef>(currentMonth());
  const { from, to } = monthRange(month);
  const salesQuery = useSales(from, to);
  const [sellerId, setSellerId] = useState('');
  const [openSale, setOpenSale] = useState<Sale>();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const sales = salesQuery.data?.sales ?? [];
  // Pedidos de cancelamento esperando o Dono (de qualquer mês).
  const pending = salesQuery.data?.pendingCancellations ?? [];
  const sellers = useMemo(() => [...new Map(sales.map((sale) => [sale.sellerId, sale.sellerName])).entries()], [sales]);
  const filtered = sales.filter((sale) => !sellerId || sale.sellerId === sellerId);

  // Resumo: canceladas não contam. Venda "aguardando cancelamento" ainda vale até o Dono decidir.
  const completed = filtered.filter((sale) => sale.status !== 'CANCELED');
  const totalCents = completed.reduce((sum, sale) => sum + sale.totalCents, 0);
  const stats = [
    { label: 'Total vendido', value: formatCents(totalCents) },
    { label: 'Vendas', value: String(completed.length) },
    { label: 'Ticket médio', value: formatCents(completed.length ? Math.round(totalCents / completed.length) : 0) },
    { label: 'Canceladas', value: String(filtered.length - completed.length) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Vendas</h1>
          <p className="mt-1 text-sm text-zinc-500">{isOwner ? 'Todas as vendas da empresa.' : 'As vendas que você registrou.'}</p>
        </div>
        <Link
          to="/vendas/nova"
          className="inline-flex items-center justify-center rounded-lg bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-800"
        >
          + Nova venda
        </Link>
      </div>

      {successMessage && <Alert type="success">{successMessage}</Alert>}

      {/* Pedidos de cancelamento dos vendedores, esperando a decisão do Dono. */}
      {isOwner && pending.length > 0 && (
        <section className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200">
          <h2 className="font-semibold text-amber-900">
            {pending.length === 1 ? '1 pedido de cancelamento aguardando sua decisão' : `${pending.length} pedidos de cancelamento aguardando sua decisão`}
          </h2>
          <ul className="mt-3 divide-y divide-amber-200/70">
            {pending.map((sale) => (
              <li key={sale.saleId} className="flex flex-col gap-2 py-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-amber-900">
                  <strong>#{sale.number}</strong> · {sale.customerName} · {formatCents(sale.totalCents)} · pedido por {sale.cancelRequest?.requestedByName}
                  <span className="block text-xs text-amber-800">Motivo: “{sale.cancelRequest?.reason}”</span>
                </p>
                <button
                  type="button"
                  onClick={() => setOpenSale(sale)}
                  className="shrink-0 rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 ring-1 ring-amber-300 transition hover:bg-amber-100"
                >
                  Analisar
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-zinc-200 sm:flex-row sm:items-center">
        <MonthPicker value={month} onChange={setMonth} />
        {isOwner && sellers.length > 0 && (
          <select
            value={sellerId}
            onChange={(event) => setSellerId(event.target.value)}
            aria-label="Filtrar por vendedor"
            className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 sm:ml-auto sm:max-w-[240px]"
          >
            <option value="">Todos os vendedores</option>
            {sellers.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl bg-white p-4 ring-1 ring-zinc-200">
            <p className="text-sm text-zinc-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900">{salesQuery.isPending ? '…' : stat.value}</p>
          </div>
        ))}
      </div>

      {salesQuery.isPending && <p className="text-sm text-zinc-500">Carregando vendas…</p>}
      {salesQuery.isError && <Alert type="error">{salesQuery.error.message}</Alert>}
      {salesQuery.isSuccess && <SalesTable sales={filtered} showSeller={isOwner} onOpen={setOpenSale} />}

      <SaleDetailsModal
        sale={openSale}
        isOwner={isOwner}
        currentUserId={user.userId}
        onClose={() => setOpenSale(undefined)}
        onDone={setSuccessMessage}
      />
    </div>
  );
}
