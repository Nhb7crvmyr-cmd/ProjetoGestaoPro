// Ajuda com períodos de datas: início e fim de um mês no fuso horário de quem está usando o sistema.

/** Um mês: ano e mês (0 = janeiro, 11 = dezembro, como no JavaScript). */
export interface MonthRef {
  year: number;
  month: number;
}

/**
 * Mês atual.
 * @returns ano e mês de hoje
 */
export function currentMonth(): MonthRef {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() };
}

/**
 * Anda N meses para frente (ou para trás, com N negativo). new Date resolve a virada de ano sozinho.
 * @param ref - mês de partida
 * @param delta - quantos meses andar
 * @returns o novo mês
 */
export function addMonths(ref: MonthRef, delta: number): MonthRef {
  const date = new Date(ref.year, ref.month + delta, 1);
  return { year: date.getFullYear(), month: date.getMonth() };
}

/**
 * Início e fim do mês em ISO (UTC). Ex.: outubro no Brasil começa 01/10 00:00 local = 03:00 UTC.
 * É isso que o backend usa para buscar as vendas do período.
 * @param ref - o mês
 * @returns { from, to } em ISO
 */
export function monthRange(ref: MonthRef): { from: string; to: string } {
  const start = new Date(ref.year, ref.month, 1, 0, 0, 0, 0);
  // Dia 0 do mês seguinte = último dia deste mês.
  const end = new Date(ref.year, ref.month + 1, 0, 23, 59, 59, 999);
  return { from: start.toISOString(), to: end.toISOString() };
}

/**
 * Nome do mês para exibir.
 * @param ref - o mês
 * @returns ex.: "outubro de 2026"
 */
export function monthLabel(ref: MonthRef): string {
  return new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(new Date(ref.year, ref.month, 1));
}
