// Cores e estilos dos gráficos do Dashboard, num lugar só.
// Os gráficos têm UMA série cada, então usam uma cor só: o azul-marinho da marca (brand-600).
// Validado: contraste ≥ 3:1 sobre o branco e saturação suficiente (os marinhos mais foscos pareciam cinza).
// Textos dos gráficos usam as cores de texto (cinza), nunca a cor da série.

export const CHART = {
  /** Cor da série (azul-marinho da marca, brand-600). */
  series: '#2b4f8f',
  /** Cor da série ao passar o mouse (brand-700, mais escura). */
  seriesHover: '#213f74',
  /** Linhas de grade: bem claras, para não competir com os dados. */
  grid: '#e4e4e7',
  /** Texto dos eixos (zinc-500). */
  axisText: '#71717a',
  /** Fundo da barra ao passar o mouse (realce da coluna inteira). */
  cursor: '#f4f4f5',
} as const;

/**
 * Formata centavos de forma curta para os eixos (R$ 1,2 mil; R$ 3,4 mi).
 * @param cents - valor em centavos
 * @returns texto curto
 */
export function compactCurrency(cents: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 }).format(cents / 100);
}
