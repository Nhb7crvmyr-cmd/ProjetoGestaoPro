// Tabela do histórico de estoque: data, produto, tipo, variação, estoque antes → depois, motivo e quem fez.

import { formatDateTime } from '../../../utils/formatters';
import { MOVEMENT_LABELS, type StockMovement } from '../services/stockService';
import { Icon } from '../../../components/ui/Icon';

/** Propriedades da tabela. */
interface MovementsTableProps {
  movements: StockMovement[];
  /** Esconde a coluna "Produto" (quando o histórico já é de um produto só). */
  hideProduct?: boolean;
}

/**
 * Desenha o histórico.
 * @param props - movimentos e se esconde a coluna de produto
 * @returns a tabela (ou mensagem se vazia)
 */
export function MovementsTable({ movements, hideProduct = false }: MovementsTableProps) {
  if (movements.length === 0) {
    return <p className="rounded-xl bg-white p-8 text-center text-sm text-zinc-500 ring-1 ring-zinc-200">Nenhuma movimentação ainda.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-zinc-200">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Data</th>
            {!hideProduct && <th className="px-4 py-3 font-medium">Produto</th>}
            <th className="px-4 py-3 font-medium">Tipo</th>
            <th className="px-4 py-3 text-right font-medium">Qtd.</th>
            <th className="px-4 py-3 font-medium">Estoque</th>
            <th className="px-4 py-3 font-medium">Motivo / por</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {movements.map((movement) => {
            const type = MOVEMENT_LABELS[movement.type];
            return (
              <tr key={`${movement.createdAt}-${movement.movementId}`}>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-zinc-600">{formatDateTime(movement.createdAt)}</td>
                {!hideProduct && <td className="px-4 py-3 font-medium text-zinc-900">{movement.productName}</td>}
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${type.classes}`}>{type.label}</span>
                </td>
                {/* Sinal explícito: +5 entrou, -3 saiu. */}
                <td className={`px-4 py-3 text-right font-semibold tabular-nums ${movement.delta >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  {movement.delta > 0 ? `+${movement.delta}` : movement.delta}
                </td>
                <td className="whitespace-nowrap px-4 py-3 tabular-nums text-zinc-600">
                  <span className="inline-flex items-center gap-1.5">
                    {movement.previousStock} <Icon name="arrowRight" className="size-3.5 text-zinc-400" />
                    <span className="font-medium text-zinc-900">{movement.newStock}</span>
                  </span>
                </td>
                <td className="px-4 py-3">
                  <p className="text-zinc-700">{movement.reason || '—'}</p>
                  <p className="text-xs text-zinc-400">{movement.userEmail}</p>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
