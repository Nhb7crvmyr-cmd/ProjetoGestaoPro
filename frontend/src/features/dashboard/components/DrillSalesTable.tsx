// Tabela de vendas dentro da análise detalhada: data, nº, cliente, vendedor, o que levou, pagamento e valor.
// Na análise de um PRODUTO, a coluna de valor mostra só a parte daquele produto (e quantas unidades).

import { formatCents, formatDateTime } from '../../../utils/formatters';
import { paymentLabel } from '../../vendas/constants/paymentMethods';
import type { Sale } from '../../vendas/services/saleService';

/** Propriedades da tabela. */
interface DrillSalesTableProps {
  sales: Sale[];
  /** true = mostra a coluna "Vendedor" (Supervisor). */
  showSeller: boolean;
  /** Na análise de um produto: o id dele (a tabela mostra só a parte desse produto). */
  productId?: string;
  /** Ao clicar no nome do cliente (abre a análise do cliente). */
  onCustomer?: (sale: Sale) => void;
}

/**
 * Desenha a tabela.
 * @param props - vendas, se mostra o vendedor, produto em foco e clique no cliente
 * @returns a tabela
 */
export function DrillSalesTable({ sales, showSeller, productId, onCustomer }: DrillSalesTableProps) {
  return (
    <div className="max-h-80 overflow-auto rounded-xl ring-1 ring-zinc-200">
      <table className="w-full min-w-[640px] text-left text-sm">
        {/* sticky: o cabeçalho fica parado enquanto a lista rola. */}
        <thead className="sticky top-0 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-3 py-2 font-medium">Venda</th>
            <th className="px-3 py-2 font-medium">Cliente</th>
            {showSeller && <th className="px-3 py-2 font-medium">Vendedor</th>}
            <th className="px-3 py-2 font-medium">{productId ? 'Qtd.' : 'Itens'}</th>
            <th className="px-3 py-2 font-medium">Pagamento</th>
            <th className="px-3 py-2 text-right font-medium">Valor</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {sales.map((sale) => {
            // Na análise de produto: só o item daquele produto.
            const item = productId ? sale.items.find((saleItem) => saleItem.productId === productId) : undefined;
            return (
              <tr key={sale.saleId} className="hover:bg-zinc-50/60">
                <td className="whitespace-nowrap px-3 py-2">
                  <p className="font-medium text-zinc-900">#{sale.number}</p>
                  <p className="text-xs tabular-nums text-zinc-500">{formatDateTime(sale.createdAt)}</p>
                </td>
                <td className="px-3 py-2">
                  {onCustomer ? (
                    <button type="button" onClick={() => onCustomer(sale)} className="font-medium text-brand-700 hover:underline">
                      {sale.customerName}
                    </button>
                  ) : (
                    <span className="text-zinc-900">{sale.customerName}</span>
                  )}
                </td>
                {showSeller && <td className="px-3 py-2 text-zinc-700">{sale.sellerName}</td>}
                <td className="px-3 py-2 text-zinc-600">
                  {item ? (
                    `${item.quantity} ${item.unit}`
                  ) : (
                    <span className="line-clamp-2 text-xs">{sale.items.map((saleItem) => `${saleItem.quantity}× ${saleItem.productName}`).join(', ')}</span>
                  )}
                </td>
                <td className="px-3 py-2 text-zinc-700">{paymentLabel(sale.paymentMethod)}</td>
                <td className="px-3 py-2 text-right font-semibold tabular-nums text-zinc-900">
                  {formatCents(item ? item.totalCents : sale.totalCents)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
