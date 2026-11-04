// Lista "Quem comprou": as últimas vendas do período, com data, cliente, o que levou e o total.

import { Link } from 'react-router';
import { formatCents, formatDateTime } from '../../../utils/formatters';
import type { Sale } from '../../vendas/services/saleService';
import { Icon } from '../../../components/ui/Icon';

/** Propriedades da lista. */
interface RecentBuyersProps {
  /** Vendas válidas, das mais recentes para as mais antigas. */
  sales: Sale[];
  /** true = Supervisor: mostra também o vendedor. */
  showSeller: boolean;
  limit?: number;
  /** Ao clicar numa venda: abre a análise do cliente. */
  onCustomer?: (sale: Sale) => void;
}

/**
 * Resume os itens da venda em uma linha (ex.: "2× Camiseta, 1× Boné").
 * @param sale - a venda
 * @returns o resumo
 */
function itemsSummary(sale: Sale): string {
  return sale.items.map((item) => `${item.quantity}× ${item.productName}`).join(', ');
}

/**
 * Desenha a lista.
 * @param props - vendas, se mostra o vendedor e quantas mostrar
 * @returns a lista (ou aviso de vazio)
 */
export function RecentBuyers({ sales, showSeller, limit = 8, onCustomer }: RecentBuyersProps) {
  if (sales.length === 0) {
    return <p className="rounded-lg bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">Ninguém comprou neste período ainda.</p>;
  }

  return (
    <div>
      <ul className="divide-y divide-zinc-100">
        {sales.slice(0, limit).map((sale) => (
          <li key={sale.saleId}>
            {/* A linha inteira é um botão: clicar abre a análise do cliente (o que comprou no mês, como pagou...). */}
            <button
              type="button"
              disabled={!onCustomer}
              onClick={() => onCustomer?.(sale)}
              className="group -mx-2 flex w-[calc(100%+1rem)] items-start justify-between gap-3 rounded-xl px-2 py-3 text-left transition enabled:hover:bg-zinc-50"
            >
            <span className="block min-w-0">
              <span className="block font-medium text-zinc-900">
                {sale.customerName}
                {sale.status === 'CANCEL_REQUESTED' && <span className="ml-2 text-xs font-medium text-amber-600">aguardando cancelamento</span>}
              </span>
              <span className="block truncate text-xs text-zinc-500">{itemsSummary(sale)}</span>
              <span className="block text-xs text-zinc-400">
                {formatDateTime(sale.createdAt)} · Venda #{sale.number}
                {showSeller && ` · ${sale.sellerName}`}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2">
              <span className="font-semibold tabular-nums text-zinc-900">{formatCents(sale.totalCents)}</span>
              {onCustomer && <Icon name="chevronRight" className="size-4 text-zinc-300 transition group-hover:text-brand-600" />}
            </span>
            </button>
          </li>
        ))}
      </ul>
      {sales.length > limit && (
        <Link to="/vendas" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:text-brand-800">
          Ver todas as {sales.length} vendas <Icon name="arrowRight" />
        </Link>
      )}
    </div>
  );
}
