// Ranking em lista: posição, nome, detalhe, valor, % do total e uma linha fina de progresso.
// Com "onSelect", cada linha vira um BOTÃO: clicar abre a análise detalhada daquele item (popup do Dashboard).

import { Icon } from '../../../components/ui/Icon';
import { formatCents } from '../../../utils/formatters';
import type { RankingRow } from '../utils/salesStats';

/** Propriedades da lista. */
interface RankingListProps {
  rows: RankingRow[];
  /** Total do período, para calcular a participação de cada linha (em %). */
  totalCents: number;
  /** Como descrever a linha (ex.: (row) → "3 unidades"). Recebe a linha inteira para textos mais ricos. */
  describe: (row: RankingRow) => string;
  emptyText: string;
  /** Opcional: ao clicar numa linha (abre a análise). */
  onSelect?: (row: RankingRow) => void;
}

/**
 * Conteúdo de uma linha (o mesmo com ou sem clique).
 * @param props - linha, posição, total, maior valor e descrição
 * @returns o conteúdo
 */
function RowContent({ row, index, totalCents, max, describe, clickable }: {
  row: RankingRow;
  index: number;
  totalCents: number;
  max: number;
  describe: (row: RankingRow) => string;
  clickable: boolean;
}) {
  const share = totalCents ? (row.totalCents / totalCents) * 100 : 0;
  return (
    <>
      <div className="flex items-baseline gap-3">
        {/* Posição com 2 dígitos (01, 02...), em fonte de largura fixa: alinha a coluna. */}
        <span className="w-6 shrink-0 font-mono text-xs text-zinc-400">{String(index + 1).padStart(2, '0')}</span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-zinc-900">{row.name}</p>
          <p className="text-xs text-zinc-500">{describe(row)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums text-zinc-900">{formatCents(row.totalCents)}</p>
          <p className="text-xs tabular-nums text-zinc-400">{share.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%</p>
        </div>
        {/* Setinha: só aparece quando dá para clicar (fica mais forte ao passar o mouse). */}
        {clickable && <Icon name="chevronRight" className="size-4 self-center text-zinc-300 transition group-hover:text-brand-600" />}
      </div>
      {/* Trilho cinza + preenchimento na cor da marca (fino: 4px, pontas arredondadas). */}
      <div className="ml-9 mt-2 h-1 rounded-full bg-zinc-100" aria-hidden="true">
        <div className="h-1 rounded-full bg-brand-600" style={{ width: `${Math.max(2, (row.totalCents / max) * 100)}%` }} />
      </div>
    </>
  );
}

/**
 * Desenha a lista.
 * @param props - linhas, total, descrição, texto de vazio e ação de clique
 * @returns a lista (ou aviso de vazio)
 */
export function RankingList({ rows, totalCents, describe, emptyText, onSelect }: RankingListProps) {
  if (rows.length === 0) {
    return <p className="rounded-xl bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">{emptyText}</p>;
  }
  // A linha de progresso é relativa ao PRIMEIRO colocado (ele ocupa a linha inteira).
  const max = rows[0].totalCents || 1;

  return (
    <ol className="-mx-2 space-y-1">
      {rows.map((row, index) => (
        <li key={row.key}>
          {onSelect ? (
            // "group": o ícone de seta reage ao hover da linha inteira (group-hover).
            <button
              type="button"
              onClick={() => onSelect(row)}
              className="group block w-full rounded-xl px-2 py-2 text-left transition hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-brand-600"
              aria-label={`Analisar ${row.name}`}
            >
              <RowContent row={row} index={index} totalCents={totalCents} max={max} describe={describe} clickable />
            </button>
          ) : (
            <div className="px-2 py-2">
              <RowContent row={row} index={index} totalCents={totalCents} max={max} describe={describe} clickable={false} />
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
