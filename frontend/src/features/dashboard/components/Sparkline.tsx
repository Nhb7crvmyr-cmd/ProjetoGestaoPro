// Mini gráfico de linha ("sparkline") para os cartões de números: mostra só a tendência do mês, sem eixos.

import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { CHART } from './chartTheme';

/**
 * Desenha a linha. Decorativa: o número do cartão é a informação; a linha só mostra o "desenho" do mês.
 * @param props - valores em ordem (um por dia) e um id único para o degradê
 * @returns o mini gráfico
 */
export function Sparkline({ values, id }: { values: number[]; id: string }) {
  // Com menos de 2 pontos não existe "linha".
  if (values.length < 2) return null;
  const data = values.map((value, index) => ({ index, value }));

  return (
    <div className="h-10 w-full" aria-hidden="true">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          {/* Degradê: a cor da marca no topo, sumindo para transparente embaixo. */}
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART.series} stopOpacity={0.25} />
              <stop offset="100%" stopColor={CHART.series} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="value" stroke={CHART.series} strokeWidth={1.5} fill={`url(#${id})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
