// Cartão de número principal (KPI): ícone, rótulo, valor grande, etiqueta de variação contra o mês anterior
// e, opcionalmente, uma mini linha com o desenho do mês. A variação usa ícone + sinal + texto (nunca só a cor).

import { Icon, type IconName } from '../../../components/ui/Icon';
import { Sparkline } from './Sparkline';

/** Propriedades do cartão. */
interface StatTileProps {
  label: string;
  value: string;
  icon: IconName;
  /** Variação em % contra o mês anterior (null = sem base; undefined = ainda carregando). */
  change?: number | null;
  /** Texto pequeno extra (ex.: "12 unidades"). */
  hint?: string;
  /** Valores diários para a mini linha (opcional). */
  trend?: number[];
  loading?: boolean;
}

/**
 * Etiqueta de variação: "↗ 12%" verde ou "↘ 8%" vermelha.
 * @param props - variação em %
 * @returns a etiqueta
 */
function ChangeBadge({ change }: { change: number | null }) {
  if (change === null) return <span className="text-xs text-zinc-400">sem base no mês anterior</span>;
  const up = change >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
        up ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
      }`}
    >
      <Icon name={up ? 'trendingUp' : 'trendingDown'} className="size-3.5" strokeWidth={2.5} />
      {up ? '+' : '−'}
      {Math.abs(change).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}%
    </span>
  );
}

/**
 * Desenha o cartão.
 * @param props - rótulo, valor, ícone, variação, dica e tendência
 * @returns o cartão
 */
export function StatTile({ label, value, icon, change, hint, trend, loading }: StatTileProps) {
  return (
    <div className="flex flex-col rounded-2xl bg-white p-5 ring-1 ring-zinc-200/70">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-zinc-500">{label}</p>
        <span className="flex size-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
          <Icon name={icon} className="size-4" />
        </span>
      </div>
      <p className="mt-3 text-[28px] font-semibold leading-none tracking-tight tabular-nums text-zinc-900">{loading ? '—' : value}</p>
      <div className="mt-3 flex min-h-6 flex-wrap items-center gap-2">
        {!loading && change !== undefined && <ChangeBadge change={change} />}
        {!loading && change !== undefined && change !== null && <span className="text-xs text-zinc-400">vs. mês anterior</span>}
        {!loading && hint && <span className="text-xs text-zinc-500">{hint}</span>}
      </div>
      {trend && !loading && (
        <div className="-mx-1 mt-3">
          <Sparkline values={trend} id={`spark-${label.replace(/\W/g, '')}`} />
        </div>
      )}
    </div>
  );
}
