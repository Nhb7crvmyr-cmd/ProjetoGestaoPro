// Seletor de mês "‹ outubro de 2026 ›", com ícones. Usado nas Vendas e no Dashboard.

import { Icon } from '../../../components/ui/Icon';
import { addMonths, currentMonth, monthLabel, type MonthRef } from '../utils/period';

/** Propriedades do seletor. */
interface MonthPickerProps {
  value: MonthRef;
  onChange: (month: MonthRef) => void;
}

const arrowButton =
  'flex size-9 items-center justify-center rounded-lg bg-white text-zinc-600 ring-1 ring-zinc-200 transition hover:bg-zinc-50 hover:text-zinc-900 disabled:opacity-40 disabled:hover:bg-white';

/**
 * Desenha o seletor. Não deixa avançar para depois do mês atual (não existe venda no futuro).
 * @param props - mês escolhido e ação de troca
 * @returns o seletor
 */
export function MonthPicker({ value, onChange }: MonthPickerProps) {
  const today = currentMonth();
  const isCurrent = value.year === today.year && value.month === today.month;

  return (
    <div className="flex items-center gap-2">
      <button type="button" aria-label="Mês anterior" onClick={() => onChange(addMonths(value, -1))} className={arrowButton}>
        <Icon name="chevronLeft" />
      </button>
      <span className="flex min-w-44 items-center justify-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium capitalize text-zinc-900 ring-1 ring-zinc-200">
        <Icon name="calendar" className="size-4 text-zinc-400" />
        {monthLabel(value)}
      </span>
      <button type="button" aria-label="Próximo mês" disabled={isCurrent} onClick={() => onChange(addMonths(value, 1))} className={arrowButton}>
        <Icon name="chevronRight" />
      </button>
    </div>
  );
}
