// Lista de produtos para adicionar à venda: busca por nome/SKU, com preço e estoque disponível.
// Produto sem estoque aparece, mas o botão "Adicionar" fica desligado (a venda seria bloqueada).

import { useState } from 'react';
import { formatCents } from '../../../utils/formatters';
import type { Product } from '../../produtos/services/productService';

/** Propriedades da lista. */
interface ProductPickerProps {
  products: Product[];
  /** Quanto de cada produto já está no carrinho (para descontar do disponível). */
  inCart: Map<string, number>;
  onAdd: (product: Product) => void;
}

/**
 * Desenha a busca e a lista de produtos.
 * @param props - produtos, carrinho e ação de adicionar
 * @returns o bloco de produtos
 */
export function ProductPicker({ products, inCart, onAdd }: ProductPickerProps) {
  const [search, setSearch] = useState('');
  const term = search.trim().toLowerCase();
  const filtered = products
    .filter((product) => product.active)
    .filter((product) => !term || product.name.toLowerCase().includes(term) || product.sku?.toLowerCase().includes(term))
    .slice(0, 12);

  return (
    <div className="space-y-2">
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar produto por nome ou SKU…"
        aria-label="Buscar produto"
        className="block w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
      />
      <ul className="max-h-80 divide-y divide-zinc-100 overflow-y-auto rounded-lg ring-1 ring-zinc-200">
        {filtered.map((product) => {
          // Disponível = estoque menos o que já está no carrinho.
          const available = product.stock - (inCart.get(product.productId) ?? 0);
          return (
            <li key={product.productId} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <div className="min-w-0">
                <p className="truncate font-medium text-zinc-900">{product.name}</p>
                <p className="text-xs text-zinc-500">
                  {formatCents(product.priceCents)} ·{' '}
                  <span className={available <= 0 ? 'font-semibold text-red-600' : ''}>
                    {available <= 0 ? 'sem estoque' : `${available} ${product.unit} disponíveis`}
                  </span>
                </p>
              </div>
              <button
                type="button"
                disabled={available <= 0}
                onClick={() => onAdd(product)}
                className="shrink-0 rounded-md px-3 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:text-zinc-400 disabled:ring-zinc-200"
              >
                + Adicionar
              </button>
            </li>
          );
        })}
        {filtered.length === 0 && <li className="px-4 py-3 text-sm text-zinc-500">Nenhum produto encontrado.</li>}
      </ul>
    </div>
  );
}
