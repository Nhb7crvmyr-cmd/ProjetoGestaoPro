// Página "Estoque" (somente Dono): resumo do estoque, produtos para repor e histórico de movimentações.

import { useState } from 'react';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { formatCents } from '../../../utils/formatters';
import { StockBadge } from '../../produtos/components/StockBadge';
import { useProducts } from '../../produtos/hooks/useProducts';
import { isLowStock, type Product } from '../../produtos/services/productService';
import { MovementsTable } from '../components/MovementsTable';
import { StockMovementModal } from '../components/StockMovementModal';
import { useMovements } from '../hooks/useStock';
import { Icon } from '../../../components/ui/Icon';

/**
 * Tela de estoque.
 * @returns a página
 */
export function StockPage() {
  const productsQuery = useProducts();
  const movementsQuery = useMovements();
  // undefined = popup fechado; null = aberto sem produto escolhido; Product = aberto para esse produto.
  const [moveTarget, setMoveTarget] = useState<Product | null | undefined>(undefined);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const active = (productsQuery.data ?? []).filter((product) => product.active);
  const lowStock = active.filter(isLowStock).sort((a, b) => a.stock - b.stock);
  // reduce "soma" a lista: começa em 0 e vai acumulando.
  const totalUnits = active.reduce((sum, product) => sum + product.stock, 0);
  const stockValueCents = active.reduce((sum, product) => sum + product.stock * (product.costCents ?? 0), 0);
  const withoutCost = active.filter((product) => product.costCents === undefined && product.stock > 0).length;

  const stats = [
    { label: 'Produtos ativos', value: String(active.length) },
    { label: 'Unidades em estoque', value: totalUnits.toLocaleString('pt-BR') },
    { label: 'Valor em estoque (custo)', value: formatCents(stockValueCents), hint: withoutCost > 0 ? `${withoutCost} sem custo informado` : undefined },
    { label: 'Para repor', value: String(lowStock.length) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Estoque</h1>
          <p className="mt-1 text-sm text-zinc-500">Entradas, saídas e ajustes. Toda mudança fica registrada no histórico.</p>
        </div>
        <Button className="sm:w-auto" onClick={() => setMoveTarget(null)} disabled={active.length === 0}>
          + Nova movimentação
        </Button>
      </div>

      {successMessage && <Alert type="success">{successMessage}</Alert>}
      {productsQuery.isError && <Alert type="error">{productsQuery.error.message}</Alert>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl bg-white p-4 ring-1 ring-zinc-200">
            <p className="text-sm text-zinc-500">{stat.label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900">{productsQuery.isPending ? '…' : stat.value}</p>
            {stat.hint && <p className="mt-0.5 text-xs text-amber-700">{stat.hint}</p>}
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold text-zinc-900">Para repor</h2>
        {lowStock.length === 0 ? (
          <p className="rounded-xl bg-white p-6 text-center text-sm text-zinc-500 ring-1 ring-zinc-200">
            {productsQuery.isPending ? (
              'Carregando…'
            ) : (
              <span className="inline-flex items-center gap-2">
                <Icon name="checkCircle" className="size-5 text-emerald-600" /> Nenhum produto abaixo do estoque mínimo.
              </span>
            )}
          </p>
        ) : (
          <ul className="divide-y divide-zinc-100 rounded-xl bg-white ring-1 ring-zinc-200">
            {lowStock.map((product) => (
              <li key={product.productId} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-zinc-900">{product.name}</p>
                  <p className="text-xs text-zinc-500">Mínimo: {product.minStock} {product.unit}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StockBadge stock={product.stock} minStock={product.minStock} unit={product.unit} />
                  <button
                    type="button"
                    onClick={() => setMoveTarget(product)}
                    className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-50"
                  >
                    Dar entrada
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-zinc-900">Últimas movimentações</h2>
        {movementsQuery.isPending && <p className="text-sm text-zinc-500">Carregando histórico…</p>}
        {movementsQuery.isError && <Alert type="error">{movementsQuery.error.message}</Alert>}
        {movementsQuery.isSuccess && <MovementsTable movements={movementsQuery.data} />}
      </section>

      <StockMovementModal
        open={moveTarget !== undefined}
        product={moveTarget ?? undefined}
        products={productsQuery.data ?? []}
        onClose={() => setMoveTarget(undefined)}
        onSaved={setSuccessMessage}
      />
    </div>
  );
}
