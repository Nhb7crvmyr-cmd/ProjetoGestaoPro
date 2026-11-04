// Página "Produtos": catálogo com busca e filtros. O Dono cadastra, edita e movimenta o estoque; o funcionário só consulta.

import { useMemo, useState } from 'react';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { useSession } from '../../auth/context/SessionContext';
import { StockHistoryModal } from '../../estoque/components/StockHistoryModal';
import { StockMovementModal } from '../../estoque/components/StockMovementModal';
import { ProductFormModal } from '../components/ProductFormModal';
import { ProductsTable } from '../components/ProductsTable';
import { useProducts } from '../hooks/useProducts';
import { isLowStock, type Product } from '../services/productService';

/** Qual popup está aberto (e para qual produto). "null" = nenhum. */
type OpenModal = { kind: 'form'; product?: Product } | { kind: 'move'; product: Product } | { kind: 'history'; product: Product } | null;

/**
 * Tela de produtos.
 * @returns a página
 */
export function ProductsPage() {
  const { user } = useSession();
  const canManage = user.groups.includes('Dono');
  const productsQuery = useProducts();
  const [modal, setModal] = useState<OpenModal>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filtros da tela.
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  const products = productsQuery.data ?? [];

  // useMemo: só recalcula a lista de categorias quando os produtos mudam (não a cada tecla na busca).
  const categories = useMemo(
    () => [...new Set(products.map((product) => product.category).filter(Boolean))].sort() as string[],
    [products],
  );

  const term = search.trim().toLowerCase();
  const filtered = products.filter(
    (product) =>
      (showInactive || product.active) &&
      (!category || product.category === category) &&
      (!onlyLowStock || isLowStock(product)) &&
      (!term || product.name.toLowerCase().includes(term) || product.sku?.toLowerCase().includes(term)),
  );
  const lowStockCount = products.filter((product) => product.active && isLowStock(product)).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Produtos</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {canManage ? 'Cadastre produtos e controle o estoque.' : 'Consulte produtos, preços e quantidades em estoque.'}
          </p>
        </div>
        {canManage && (
          <Button className="sm:w-auto" onClick={() => setModal({ kind: 'form' })}>
            + Novo produto
          </Button>
        )}
      </div>

      {successMessage && <Alert type="success">{successMessage}</Alert>}
      {lowStockCount > 0 && (
        <Alert type="error">
          {lowStockCount === 1 ? '1 produto está' : `${lowStockCount} produtos estão`} com estoque baixo ou zerado.{' '}
          <button type="button" className="font-semibold underline" onClick={() => setOnlyLowStock(true)}>
            Ver quais
          </button>
        </Alert>
      )}

      {/* Barra de filtros: busca, categoria e opções. */}
      <div className="flex flex-col gap-3 rounded-xl bg-white p-4 ring-1 ring-zinc-200 lg:flex-row lg:items-center">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar por nome ou SKU…"
          aria-label="Buscar produtos"
          className="block w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 lg:max-w-xs"
        />
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-label="Filtrar por categoria"
          className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 lg:max-w-[200px]"
        >
          <option value="">Todas as categorias</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" className="size-4 accent-brand-700" checked={onlyLowStock} onChange={(event) => setOnlyLowStock(event.target.checked)} />
          Só estoque baixo
        </label>
        {canManage && (
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" className="size-4 accent-brand-700" checked={showInactive} onChange={(event) => setShowInactive(event.target.checked)} />
            Mostrar inativos
          </label>
        )}
        <span className="text-sm text-zinc-500 lg:ml-auto">
          {filtered.length} de {products.length} produtos
        </span>
      </div>

      {productsQuery.isPending && <p className="text-sm text-zinc-500">Carregando produtos…</p>}
      {productsQuery.isError && <Alert type="error">{productsQuery.error.message}</Alert>}
      {productsQuery.isSuccess && (
        <ProductsTable
          products={filtered}
          canManage={canManage}
          actions={{
            onEdit: (product) => setModal({ kind: 'form', product }),
            onMoveStock: (product) => setModal({ kind: 'move', product }),
            onHistory: (product) => setModal({ kind: 'history', product }),
          }}
        />
      )}

      {canManage && (
        <>
          <ProductFormModal
            open={modal?.kind === 'form'}
            product={modal?.kind === 'form' ? modal.product : undefined}
            onClose={() => setModal(null)}
            onSaved={setSuccessMessage}
            categories={categories}
          />
          <StockMovementModal
            open={modal?.kind === 'move'}
            product={modal?.kind === 'move' ? modal.product : undefined}
            products={products}
            onClose={() => setModal(null)}
            onSaved={setSuccessMessage}
          />
          <StockHistoryModal product={modal?.kind === 'history' ? modal.product : undefined} onClose={() => setModal(null)} />
        </>
      )}
    </div>
  );
}
