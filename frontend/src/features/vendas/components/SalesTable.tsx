// Tabela de vendas: número, data, cliente, vendedor (para o Dono), itens, pagamento, total e situação.

import { formatCents, formatDateTime } from '../../../utils/formatters';
import { paymentLabel } from '../constants/paymentMethods';
import type { Sale } from '../services/saleService';

/** Propriedades da tabela. */
interface SalesTableProps {
  sales: Sale[];
  /** true = Dono: mostra a coluna "Vendedor". */
  showSeller: boolean;
  onOpen: (sale: Sale) => void;
}

/**
 * Desenha a tabela. Clicar na linha abre os detalhes.
 * @param props - vendas, se mostra o vendedor e ação de abrir
 * @returns a tabela (ou mensagem se vazia)
 */
export function SalesTable({ sales, showSeller, onOpen }: SalesTableProps) {
  if (sales.length === 0) {
    return (
      <div className="rounded-xl bg-white p-10 text-center ring-1 ring-zinc-200">
        <p className="font-medium text-zinc-900">Nenhuma venda neste período</p>
        <p className="mt-1 text-sm text-zinc-500">Registre uma no botão "Nova venda".</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-zinc-200">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Venda</th>
            <th className="px-4 py-3 font-medium">Cliente</th>
            {showSeller && <th className="px-4 py-3 font-medium">Vendedor</th>}
            <th className="px-4 py-3 font-medium">Itens</th>
            <th className="px-4 py-3 font-medium">Pagamento</th>
            <th className="px-4 py-3 text-right font-medium">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {sales.map((sale) => {
            const canceled = sale.status === 'CANCELED';
            const units = sale.items.reduce((sum, item) => sum + item.quantity, 0);
            return (
              <tr key={sale.saleId} onClick={() => onOpen(sale)} className={`cursor-pointer hover:bg-zinc-50 ${canceled ? 'opacity-60' : ''}`}>
                <td className="px-4 py-3">
                  {/* Botão "de verdade" dentro da linha: assim dá para abrir pelo teclado (Tab + Enter). */}
                  <button type="button" className="font-semibold text-zinc-900 hover:text-brand-700" onClick={() => onOpen(sale)}>
                    #{sale.number}
                  </button>
                  <p className="text-xs tabular-nums text-zinc-500">{formatDateTime(sale.createdAt)}</p>
                </td>
                <td className="px-4 py-3 text-zinc-900">{sale.customerName}</td>
                {showSeller && <td className="px-4 py-3 text-zinc-700">{sale.sellerName}</td>}
                <td className="px-4 py-3 text-zinc-600">
                  {units} {units === 1 ? 'unidade' : 'unidades'}
                  <span className="text-xs text-zinc-400"> · {sale.items.length} {sale.items.length === 1 ? 'produto' : 'produtos'}</span>
                </td>
                <td className="px-4 py-3 text-zinc-700">{paymentLabel(sale.paymentMethod)}</td>
                <td className="px-4 py-3 text-right">
                  <span className={`font-semibold tabular-nums ${canceled ? 'text-zinc-400 line-through' : 'text-zinc-900'}`}>
                    {formatCents(sale.totalCents)}
                  </span>
                  {canceled && <p className="text-xs font-medium text-red-600">Cancelada</p>}
                  {sale.status === 'CANCEL_REQUESTED' && <p className="text-xs font-medium text-amber-600">Aguardando cancelamento</p>}
                  {sale.status === 'COMPLETED' && sale.lastCancelReview && <p className="text-xs font-medium text-sky-600">Cancelamento recusado</p>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
