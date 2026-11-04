// Contas do Dashboard a partir da lista de vendas: totais, vendas por dia, rankings e quem comprou.
// São funções "puras" (só recebem dados e devolvem números): fáceis de entender e de testar.
// Vendas CANCELADAS ficam de fora de todas as contas. "Aguardando cancelamento" ainda conta.

import type { Sale } from '../../vendas/services/saleService';

/** Só as vendas que valem (não canceladas). */
export function validSales(sales: Sale[]): Sale[] {
  return sales.filter((sale) => sale.status !== 'CANCELED');
}

/** Números principais do período. */
export interface SalesSummary {
  totalCents: number;
  count: number;
  averageCents: number;
  /** Quantos clientes DIFERENTES compraram. */
  customers: number;
  /** Quantas unidades de produto saíram. */
  units: number;
}

/**
 * Calcula os números principais.
 * @param sales - vendas válidas do período
 * @returns o resumo
 */
export function summarize(sales: Sale[]): SalesSummary {
  const totalCents = sales.reduce((sum, sale) => sum + sale.totalCents, 0);
  return {
    totalCents,
    count: sales.length,
    averageCents: sales.length ? Math.round(totalCents / sales.length) : 0,
    customers: new Set(sales.map((sale) => sale.customerId)).size,
    units: sales.reduce((sum, sale) => sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0),
  };
}

/**
 * Variação percentual entre dois valores (ex.: este mês contra o anterior).
 * @param current - valor atual
 * @param previous - valor anterior
 * @returns a variação em % (null se não há base para comparar)
 */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

/** Um ponto do gráfico "fluxo do mês". */
export interface DailyPoint {
  day: number;
  totalCents: number;
  count: number;
}

/**
 * Soma as vendas de cada dia do mês. Dias sem venda aparecem com zero (o gráfico não "pula" dias).
 * @param sales - vendas válidas do mês
 * @param daysInMonth - quantos dias mostrar (no mês atual, até hoje)
 * @returns um ponto por dia
 */
export function dailySeries(sales: Sale[], daysInMonth: number): DailyPoint[] {
  const points: DailyPoint[] = Array.from({ length: daysInMonth }, (_, index) => ({ day: index + 1, totalCents: 0, count: 0 }));
  for (const sale of sales) {
    // getDate() usa o fuso de quem está vendo (a venda das 23h aparece no dia certo).
    const point = points[new Date(sale.createdAt).getDate() - 1];
    if (point) {
      point.totalCents += sale.totalCents;
      point.count += 1;
    }
  }
  return points;
}

/** Uma linha de ranking (produto, vendedor, cliente, forma de pagamento...). */
export interface RankingRow {
  /** Identificador do item (id do produto/cliente/vendedor ou código do pagamento): usado ao clicar. */
  key: string;
  name: string;
  totalCents: number;
  /** Quantidade (unidades, no ranking de produtos; vendas, nos outros). */
  quantity: number;
}

/**
 * Agrupa e soma, e devolve os maiores primeiro.
 * @param entries - pares (nome, valor, quantidade)
 * @param limit - quantos devolver
 * @returns o ranking
 */
function rank(entries: { key: string; name: string; totalCents: number; quantity: number }[], limit: number): RankingRow[] {
  const map = new Map<string, RankingRow>();
  for (const entry of entries) {
    const row = map.get(entry.key) ?? { key: entry.key, name: entry.name, totalCents: 0, quantity: 0 };
    row.totalCents += entry.totalCents;
    row.quantity += entry.quantity;
    map.set(entry.key, row);
  }
  return [...map.values()].sort((a, b) => b.totalCents - a.totalCents).slice(0, limit);
}

/** Produtos que mais faturaram (o desconto da venda não é dividido entre os itens). */
export function topProducts(sales: Sale[], limit = 5): RankingRow[] {
  return rank(
    sales.flatMap((sale) =>
      sale.items.map((item) => ({ key: item.productId, name: item.productName, totalCents: item.totalCents, quantity: item.quantity })),
    ),
    limit,
  );
}

/** Quanto cada vendedor vendeu. */
export function bySeller(sales: Sale[], limit = 8): RankingRow[] {
  return rank(sales.map((sale) => ({ key: sale.sellerId, name: sale.sellerName, totalCents: sale.totalCents, quantity: 1 })), limit);
}

/** Clientes que mais compraram. */
export function topCustomers(sales: Sale[], limit = 5): RankingRow[] {
  return rank(sales.map((sale) => ({ key: sale.customerId, name: sale.customerName, totalCents: sale.totalCents, quantity: 1 })), limit);
}

/**
 * Quanto entrou por forma de pagamento.
 * @param sales - vendas válidas
 * @param label - função que dá o nome da forma de pagamento (ex.: 'PIX' → 'Pix')
 * @returns o ranking
 */
export function byPayment(sales: Sale[], label: (code: string) => string): RankingRow[] {
  return rank(sales.map((sale) => ({ key: sale.paymentMethod, name: label(sale.paymentMethod), totalCents: sale.totalCents, quantity: 1 })), 6);
}

// ---------- Análise detalhada (popup do Dashboard) ----------

/** O que está sendo analisado no popup: um cliente, um produto, um vendedor ou uma forma de pagamento. */
export type DrillFilter =
  | { kind: 'customer'; key: string; name: string }
  | { kind: 'product'; key: string; name: string }
  | { kind: 'seller'; key: string; name: string }
  | { kind: 'payment'; key: string; name: string };

/**
 * Separa as vendas que pertencem ao item analisado.
 * @param sales - vendas válidas do mês
 * @param filter - o que analisar
 * @returns só as vendas daquele cliente/produto/vendedor/pagamento
 */
export function filterSales(sales: Sale[], filter: DrillFilter): Sale[] {
  switch (filter.kind) {
    case 'customer':
      return sales.filter((sale) => sale.customerId === filter.key);
    case 'seller':
      return sales.filter((sale) => sale.sellerId === filter.key);
    case 'payment':
      return sales.filter((sale) => sale.paymentMethod === filter.key);
    case 'product':
      return sales.filter((sale) => sale.items.some((item) => item.productId === filter.key));
  }
}

/**
 * Quem comprou UM produto: soma só a parte daquele produto em cada venda (quantidade e valor).
 * @param sales - vendas que têm o produto
 * @param productId - id do produto
 * @param limit - quantos devolver
 * @returns ranking de clientes (quantity = unidades do produto)
 */
export function productBuyers(sales: Sale[], productId: string, limit = 8): RankingRow[] {
  return rank(
    sales.flatMap((sale) =>
      sale.items
        .filter((item) => item.productId === productId)
        .map((item) => ({ key: sale.customerId, name: sale.customerName, totalCents: item.totalCents, quantity: item.quantity })),
    ),
    limit,
  );
}

/**
 * Quantos clientes DIFERENTES cada vendedor atendeu (para "quem mais atendeu").
 * @param sales - vendas válidas
 * @returns mapa id do vendedor → nº de clientes
 */
export function customersBySeller(sales: Sale[]): Map<string, number> {
  const sets = new Map<string, Set<string>>();
  for (const sale of sales) {
    const set = sets.get(sale.sellerId) ?? new Set<string>();
    set.add(sale.customerId);
    sets.set(sale.sellerId, set);
  }
  return new Map([...sets].map(([sellerId, set]) => [sellerId, set.size]));
}

// ---------- Visão completa ("Ver todos") ----------

/** Tipos de lista completa: produtos, clientes, vendedores ou formas de pagamento. */
export type ListKind = 'product' | 'customer' | 'seller' | 'payment';

/** Uma linha da tabela completa, com todas as medidas que podem ser ordenadas. */
export interface DetailRow {
  key: string;
  name: string;
  /** Valor total (para produto: só a parte daquele produto nas vendas). */
  totalCents: number;
  /** Unidades de produto. */
  units: number;
  /** Em quantas vendas aparece (para cliente: quantas vezes comprou). */
  salesCount: number;
  /** Quantos clientes diferentes (para vendedor: clientes atendidos). */
  customers: number;
  /** Valor médio por venda. */
  averageCents: number;
  /** Data da venda mais recente (ISO). */
  lastAt: string;
}

/**
 * Monta TODAS as linhas de um tipo (sem limite), para a tabela completa com busca e ordenação.
 * @param sales - vendas válidas do mês
 * @param kind - o que listar
 * @param label - nome da forma de pagamento (ex.: 'PIX' → 'Pix')
 * @returns as linhas, do maior valor para o menor
 */
export function detailRows(sales: Sale[], kind: ListKind, label: (code: string) => string): DetailRow[] {
  // Acumulador por item; "Set" guarda vendas e clientes sem repetir.
  const map = new Map<string, { row: DetailRow; saleIds: Set<string>; customerIds: Set<string> }>();

  /** Soma uma contribuição na linha do item. */
  const add = (key: string, name: string, sale: Sale, totalCents: number, units: number) => {
    const entry = map.get(key) ?? {
      row: { key, name, totalCents: 0, units: 0, salesCount: 0, customers: 0, averageCents: 0, lastAt: '' },
      saleIds: new Set<string>(),
      customerIds: new Set<string>(),
    };
    entry.row.totalCents += totalCents;
    entry.row.units += units;
    entry.saleIds.add(sale.saleId);
    entry.customerIds.add(sale.customerId);
    if (sale.createdAt > entry.row.lastAt) entry.row.lastAt = sale.createdAt;
    map.set(key, entry);
  };

  for (const sale of sales) {
    const saleUnits = sale.items.reduce((sum, item) => sum + item.quantity, 0);
    if (kind === 'product') {
      for (const item of sale.items) add(item.productId, item.productName, sale, item.totalCents, item.quantity);
    } else if (kind === 'customer') {
      add(sale.customerId, sale.customerName, sale, sale.totalCents, saleUnits);
    } else if (kind === 'seller') {
      add(sale.sellerId, sale.sellerName, sale, sale.totalCents, saleUnits);
    } else {
      add(sale.paymentMethod, label(sale.paymentMethod), sale, sale.totalCents, saleUnits);
    }
  }

  return [...map.values()]
    .map(({ row, saleIds, customerIds }) => ({
      ...row,
      salesCount: saleIds.size,
      customers: customerIds.size,
      averageCents: Math.round(row.totalCents / saleIds.size),
    }))
    .sort((a, b) => b.totalCents - a.totalCents);
}
