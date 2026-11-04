// Tabela de produtos. O Dono vê custo e as ações (editar, movimentar estoque, histórico); o funcionário só consulta.

import { formatCents } from '../../../utils/formatters';
import type { Product } from '../services/productService';
import { StockBadge } from './StockBadge';

/** Ações disponíveis em cada linha (só para o Dono). */
export interface ProductRowActions {
  onEdit: (product: Product) => void;
  onMoveStock: (product: Product) => void;
  onHistory: (product: Product) => void;
}

/** Propriedades da tabela. */
interface ProductsTableProps {
  products: Product[];
  /** true = Dono (mostra custo e ações). */
  canManage: boolean;
  actions: ProductRowActions;
}

const smallButton = 'rounded-md px-2.5 py-1.5 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-300 transition hover:bg-zinc-50';

/**
 * Desenha a tabela.
 * @param props - produtos, permissão e ações
 * @returns a tabela (ou mensagem se vazia)
 */
export function ProductsTable({ products, canManage, actions }: ProductsTableProps) {
  if (products.length === 0) {
    return (
      <div className="rounded-xl bg-white p-10 text-center ring-1 ring-zinc-200">
        <p className="font-medium text-zinc-900">Nenhum produto encontrado</p>
        <p className="mt-1 text-sm text-zinc-500">
          {canManage ? 'Cadastre o primeiro no botão "Novo produto".' : 'O dono da empresa ainda não cadastrou produtos.'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-zinc-200">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Produto</th>
            <th className="px-4 py-3 font-medium">Categoria</th>
            <th className="px-4 py-3 text-right font-medium">Preço</th>
            {canManage && <th className="px-4 py-3 text-right font-medium">Custo</th>}
            <th className="px-4 py-3 font-medium">Estoque</th>
            {canManage && <th className="px-4 py-3 text-right font-medium">Ações</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {products.map((product) => (
            <tr key={product.productId} className={`hover:bg-zinc-50/60 ${product.active ? '' : 'opacity-60'}`}>
              <td className="px-4 py-3">
                <p className="font-medium text-zinc-900">
                  {product.name}
                  {!product.active && (
                    <span className="ml-2 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-zinc-500">Inativo</span>
                  )}
                </p>
                {product.sku && <p className="text-xs text-zinc-500">SKU {product.sku}</p>}
              </td>
              <td className="px-4 py-3 text-zinc-700">{product.category || '—'}</td>
              <td className="px-4 py-3 text-right tabular-nums text-zinc-900">{formatCents(product.priceCents)}</td>
              {canManage && (
                <td className="px-4 py-3 text-right tabular-nums text-zinc-600">
                  {product.costCents !== undefined ? formatCents(product.costCents) : '—'}
                </td>
              )}
              <td className="px-4 py-3">
                <StockBadge stock={product.stock} minStock={product.minStock} unit={product.unit} />
              </td>
              {canManage && (
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button type="button" className={smallButton} onClick={() => actions.onMoveStock(product)}>
                      Movimentar
                    </button>
                    <button type="button" className={smallButton} onClick={() => actions.onHistory(product)}>
                      Histórico
                    </button>
                    <button type="button" className={smallButton} onClick={() => actions.onEdit(product)}>
                      Editar
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
