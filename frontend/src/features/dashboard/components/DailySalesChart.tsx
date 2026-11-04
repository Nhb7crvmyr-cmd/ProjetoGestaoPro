// Gráfico "Fluxo do mês": área suave com degradê mostrando quanto foi vendido em cada dia.
// Ao passar o mouse, aparece uma linha-guia vertical e a dica com o valor e o número de vendas.
// Para quem prefere números, há "Ver em tabela".

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipContentProps, type TooltipValueType } from 'recharts';
import { formatCents } from '../../../utils/formatters';
import type { DailyPoint } from '../utils/salesStats';
import { CHART, compactCurrency } from './chartTheme';

/** Propriedades do gráfico. */
interface DailySalesChartProps {
  points: DailyPoint[];
  /** Nome do mês (ex.: "outubro de 2026"), usado na descrição. */
  monthName: string;
}

/**
 * Caixinha que aparece ao passar o mouse.
 * @param props - dados do ponto (o Recharts preenche)
 * @returns a dica, ou nada
 */
function DayTooltip({ active, payload }: TooltipContentProps<TooltipValueType, string | number>) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload as DailyPoint;
  return (
    <div className="rounded-xl bg-brand-950 px-3 py-2 text-sm text-white shadow-xl">
      <p className="text-xs text-brand-200">Dia {point.day}</p>
      <p className="font-semibold tabular-nums">{formatCents(point.totalCents)}</p>
      <p className="text-xs text-brand-200">
        {point.count} {point.count === 1 ? 'venda' : 'vendas'}
      </p>
    </div>
  );
}

/**
 * Desenha o gráfico.
 * @param props - pontos e nome do mês
 * @returns o gráfico + a tabela opcional
 */
export function DailySalesChart({ points, monthName }: DailySalesChartProps) {
  const hasSales = points.some((point) => point.count > 0);

  return (
    <div>
      {/* role="img" + aria-label: leitores de tela anunciam o que o gráfico mostra. */}
      <div className="h-72" role="img" aria-label={`Vendas por dia em ${monthName}`}>
        {hasSales ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 12, right: 8, bottom: 0, left: 0 }}>
              <defs>
                {/* Degradê do preenchimento: mais forte em cima, transparente embaixo. */}
                <linearGradient id="flowGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART.series} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={CHART.series} stopOpacity={0} />
                </linearGradient>
              </defs>
              {/* Grade só horizontal, tracejada e clarinha: guia sem poluir. */}
              <CartesianGrid vertical={false} stroke={CHART.grid} strokeDasharray="4 4" />
              <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: CHART.axisText, fontSize: 12 }} interval="preserveStartEnd" minTickGap={16} />
              <YAxis tickFormatter={compactCurrency} tickLine={false} axisLine={false} tick={{ fill: CHART.axisText, fontSize: 12 }} width={72} />
              {/* cursor = linha-guia vertical que acompanha o mouse. */}
              <Tooltip content={DayTooltip} cursor={{ stroke: CHART.axisText, strokeWidth: 1, strokeDasharray: '4 4' }} />
              {/* "monotone" deixa a linha suave; activeDot = bolinha no ponto sob o mouse (com anel branco). */}
              <Area
                type="monotone"
                dataKey="totalCents"
                stroke={CHART.series}
                strokeWidth={2}
                fill="url(#flowGradient)"
                activeDot={{ r: 5, fill: CHART.series, stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-xl bg-zinc-50 text-sm text-zinc-500">Nenhuma venda neste mês ainda.</div>
        )}
      </div>

      {hasSales && (
        // <details>: um "abre e fecha" nativo do navegador, sem JavaScript.
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-zinc-500 hover:text-zinc-700">Ver em tabela</summary>
          <div className="mt-2 max-h-60 overflow-y-auto rounded-lg ring-1 ring-zinc-200">
            <table className="w-full text-left">
              <thead className="sticky top-0 bg-zinc-50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Dia</th>
                  <th className="px-3 py-2 text-right font-medium">Vendas</th>
                  <th className="px-3 py-2 text-right font-medium">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {points
                  .filter((point) => point.count > 0)
                  .map((point) => (
                    <tr key={point.day}>
                      <td className="px-3 py-1.5">{point.day}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{point.count}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{formatCents(point.totalCents)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </div>
  );
}
