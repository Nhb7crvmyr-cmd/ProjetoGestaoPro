// Itens do "carrinho" da venda: nome, preço, quantidade com botões − e + (limitada ao estoque), total e remover.

import { formatCents } from '../../../utils/formatters';
import type { Product } from '../../produtos/services/productService';
import { Icon } from '../../../components/ui/Icon';

/** Um item do carrinho: o produto e a quantidade escolhida. */
export interface CartItem {
  product: Product;
  quantity: number;
}

/** Propriedades da lista. */
interface CartItemsProps {
  items: CartItem[];
  onChangeQuantity: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}

const stepButton = 'flex size-7 items-center justify-center rounded-md text-zinc-700 ring-1 ring-zinc-300 transition hover:bg-zinc-50 disabled:opacity-40';

/**
 * Desenha os itens.
 * @param props - itens e ações
 * @returns a lista (ou aviso de carrinho vazio)
 */
export function CartItems({ items, onChangeQuantity, onRemove }: CartItemsProps) {
  if (items.length === 0) {
    return <p className="rounded-lg bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">Nenhum produto adicionado.</p>;
  }

  return (
    <ul className="divide-y divide-zinc-100">
      {items.map(({ product, quantity }) => (
        <li key={product.productId} className="flex items-center gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-zinc-900">{product.name}</p>
            <p className="text-xs text-zinc-500">{formatCents(product.priceCents)} cada</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" className={stepButton} aria-label="Diminuir" disabled={quantity <= 1} onClick={() => onChangeQuantity(product.productId, quantity - 1)}>
              <Icon name="minus" className="size-3.5" strokeWidth={2.5} />
            </button>
            <input
              type="number"
              min={1}
              max={product.stock}
              value={quantity}
              aria-label={`Quantidade de ${product.name}`}
              // Limita entre 1 e o estoque; texto inválido vira 1.
              onChange={(event) => onChangeQuantity(product.productId, Math.min(product.stock, Math.max(1, Math.floor(Number(event.target.value)) || 1)))}
              className="w-14 rounded-md border border-zinc-300 px-1 py-1 text-center text-sm tabular-nums outline-none focus:border-brand-600"
            />
            <button type="button" className={stepButton} aria-label="Aumentar" disabled={quantity >= product.stock} onClick={() => onChangeQuantity(product.productId, quantity + 1)}>
              <Icon name="plus" className="size-3.5" strokeWidth={2.5} />
            </button>
          </div>
          <p className="w-24 text-right text-sm font-semibold tabular-nums text-zinc-900">{formatCents(product.priceCents * quantity)}</p>
          <button type="button" onClick={() => onRemove(product.productId)} aria-label={`Remover ${product.name}`} className="rounded-md p-1 text-zinc-400 hover:bg-red-50 hover:text-red-600">
            <Icon name="x" />
          </button>
        </li>
      ))}
    </ul>
  );
}
