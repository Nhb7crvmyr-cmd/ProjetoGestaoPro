// Título de coluna "ordenável": clicar ordena a tabela por essa coluna; clicar de novo inverte a ordem.

import { Icon } from '../../../components/ui/Icon';

/** Direção da ordem: "desc" = maior primeiro; "asc" = menor primeiro. */
export type SortDirection = 'asc' | 'desc';

/** Propriedades do título. */
interface SortHeaderProps {
  label: string;
  /** true se a tabela está ordenada por esta coluna agora. */
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
  /** Alinha à direita (colunas de número). */
  alignRight?: boolean;
}

/**
 * Desenha o título como botão, com a setinha mostrando a ordem atual.
 * aria-sort avisa aos leitores de tela qual coluna está ordenando a tabela.
 * @param props - texto, estado e ação
 * @returns a célula de título (th)
 */
export function SortHeader({ label, active, direction, onClick, alignRight }: SortHeaderProps) {
  return (
    <th
      className={`px-3 py-2 font-medium ${alignRight ? 'text-right' : ''}`}
      aria-sort={active ? (direction === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 uppercase tracking-wide transition hover:text-zinc-900 ${active ? 'text-zinc-900' : ''}`}
      >
        {label}
        {/* Seta para baixo = maior primeiro; para cima = menor primeiro. Apagada quando a coluna não está ativa. */}
        <Icon
          name={active && direction === 'asc' ? 'chevronUp' : 'chevronDown'}
          className={`size-3.5 ${active ? 'text-brand-600' : 'text-zinc-300'}`}
          strokeWidth={2.5}
        />
      </button>
    </th>
  );
}
