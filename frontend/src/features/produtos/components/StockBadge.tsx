// Quantidade em estoque com cor de alerta: vermelho = zerado; âmbar = no mínimo ou abaixo; normal = ok.

/** Propriedades da etiqueta. */
interface StockBadgeProps {
  stock: number;
  minStock: number;
  unit: string;
}

/**
 * Desenha a quantidade com a cor certa e um texto de alerta quando precisa repor.
 * @param props - estoque, mínimo e unidade
 * @returns a etiqueta
 */
export function StockBadge({ stock, minStock, unit }: StockBadgeProps) {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200">
        0 {unit} · Sem estoque
      </span>
    );
  }
  if (stock <= minStock) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
        {stock} {unit} · Estoque baixo
      </span>
    );
  }
  return (
    <span className="tabular-nums text-sm font-medium text-zinc-900">
      {stock} <span className="text-xs font-normal text-zinc-500">{unit}</span>
    </span>
  );
}
