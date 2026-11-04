// Popup grande de "análise detalhada" do Dashboard: abre ao clicar num cliente, produto, vendedor ou forma de
// pagamento. Mostra números do item no mês, dois rankings (que também são clicáveis) e a lista de vendas.
// Navegar de uma análise para outra (ex.: vendedor → cliente) empilha; o botão "Voltar" desempilha.

import type { ReactNode } from 'react';
import { Icon, type IconName } from '../../../components/ui/Icon';
import { Modal } from '../../../components/ui/Modal';
import { formatCents } from '../../../utils/formatters';
import { paymentLabel } from '../../vendas/constants/paymentMethods';
import type { Sale } from '../../vendas/services/saleService';
import {
  byPayment,
  filterSales,
  productBuyers,
  summarize,
  topCustomers,
  topProducts,
  type DrillFilter,
  type RankingRow,
} from '../utils/salesStats';
import { DrillSalesTable } from './DrillSalesTable';
import { RankingList } from './RankingList';

/** Propriedades do popup. */
interface DrillDownModalProps {
  /** Análise aberta (o topo da pilha). Sem filtro = popup fechado. */
  filter?: DrillFilter;
  /** true quando há uma análise anterior para voltar. */
  canGoBack: boolean;
  /** Vendas válidas do mês. */
  sales: Sale[];
  monthName: string;
  isOwner: boolean;
  /** Abre outra análise por cima (ex.: clicar num cliente dentro da análise do vendedor). */
  onOpen: (filter: DrillFilter) => void;
  onBack: () => void;
  onClose: () => void;
}

/** Nome e ícone de cada tipo de análise. */
const KIND_INFO: Record<DrillFilter['kind'], { label: string; icon: IconName }> = {
  customer: { label: 'Cliente', icon: 'users' },
  product: { label: 'Produto', icon: 'package' },
  seller: { label: 'Vendedor', icon: 'sparkles' },
  payment: { label: 'Forma de pagamento', icon: 'creditCard' },
};

/** Textos das quantidades. */
const plural = (quantity: number, one: string, many: string) => `${quantity} ${quantity === 1 ? one : many}`;
const units = (row: RankingRow) => plural(row.quantity, 'unidade', 'unidades');
const salesText = (row: RankingRow) => plural(row.quantity, 'venda', 'vendas');
const purchases = (row: RankingRow) => plural(row.quantity, 'compra', 'compras');

/**
 * Cartão pequeno de número.
 * @param props - rótulo e valor
 * @returns o cartão
 */
function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-zinc-50 px-4 py-3 ring-1 ring-zinc-200/70">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-zinc-900">{value}</p>
    </div>
  );
}

/**
 * Bloco com título para os rankings do popup.
 * @param props - título e conteúdo
 * @returns o bloco
 */
function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl p-4 ring-1 ring-zinc-200/70">
      <h3 className="mb-3 text-sm font-semibold text-zinc-900">{title}</h3>
      {children}
    </section>
  );
}

/**
 * Desenha o popup.
 * @param props - análise aberta, vendas, mês, perfil e ações
 * @returns o modal (ou nada, se fechado)
 */
export function DrillDownModal({ filter, canGoBack, sales, monthName, isOwner, onOpen, onBack, onClose }: DrillDownModalProps) {
  if (!filter) return null;

  const filtered = filterSales(sales, filter);
  const summary = summarize(filtered);
  const info = KIND_INFO[filter.kind];
  const empty = 'Nada no período.';

  // Atalhos para abrir outras análises a partir das linhas dos rankings.
  const openCustomer = (row: RankingRow) => onOpen({ kind: 'customer', key: row.key, name: row.name });
  const openProduct = (row: RankingRow) => onOpen({ kind: 'product', key: row.key, name: row.name });

  // Números e rankings mudam conforme o que está sendo analisado.
  let metrics: { label: string; value: string }[];
  let blocks: ReactNode;

  if (filter.kind === 'product') {
    const buyers = productBuyers(filtered, filter.key);
    const productTotal = buyers.reduce((sum, row) => sum + row.totalCents, 0);
    const productUnits = buyers.reduce((sum, row) => sum + row.quantity, 0);
    metrics = [
      { label: 'Faturado com o produto', value: formatCents(productTotal) },
      { label: 'Unidades vendidas', value: String(productUnits) },
      { label: 'Vendas', value: String(filtered.length) },
      { label: 'Clientes que compraram', value: String(summary.customers) },
    ];
    blocks = (
      <>
        <Block title="Quem comprou">
          <RankingList rows={buyers} totalCents={productTotal} describe={units} emptyText={empty} onSelect={openCustomer} />
        </Block>
        <Block title="Formas de pagamento (vendas com o produto)">
          <RankingList rows={byPayment(filtered, paymentLabel)} totalCents={summary.totalCents} describe={salesText} emptyText={empty} />
        </Block>
      </>
    );
  } else if (filter.kind === 'seller') {
    metrics = [
      { label: 'Vendido', value: formatCents(summary.totalCents) },
      { label: 'Vendas', value: String(summary.count) },
      { label: 'Clientes atendidos', value: String(summary.customers) },
      { label: 'Ticket médio', value: formatCents(summary.averageCents) },
    ];
    blocks = (
      <>
        <Block title="Clientes atendidos">
          <RankingList rows={topCustomers(filtered, 8)} totalCents={summary.totalCents} describe={purchases} emptyText={empty} onSelect={openCustomer} />
        </Block>
        <Block title="Produtos que mais vendeu">
          <RankingList rows={topProducts(filtered, 8)} totalCents={summary.totalCents} describe={units} emptyText={empty} onSelect={openProduct} />
        </Block>
      </>
    );
  } else if (filter.kind === 'customer') {
    metrics = [
      { label: 'Total comprado', value: formatCents(summary.totalCents) },
      { label: 'Compras', value: String(summary.count) },
      { label: 'Ticket médio', value: formatCents(summary.averageCents) },
      { label: 'Unidades', value: String(summary.units) },
    ];
    blocks = (
      <>
        <Block title="O que levou">
          <RankingList rows={topProducts(filtered, 8)} totalCents={summary.totalCents} describe={units} emptyText={empty} onSelect={openProduct} />
        </Block>
        <Block title="Como pagou">
          <RankingList rows={byPayment(filtered, paymentLabel)} totalCents={summary.totalCents} describe={salesText} emptyText={empty} />
        </Block>
      </>
    );
  } else {
    metrics = [
      { label: 'Total recebido', value: formatCents(summary.totalCents) },
      { label: 'Vendas', value: String(summary.count) },
      { label: 'Ticket médio', value: formatCents(summary.averageCents) },
      { label: 'Clientes', value: String(summary.customers) },
    ];
    blocks = (
      <>
        <Block title="Clientes que mais usaram">
          <RankingList rows={topCustomers(filtered, 8)} totalCents={summary.totalCents} describe={purchases} emptyText={empty} onSelect={openCustomer} />
        </Block>
        <Block title="Produtos vendidos assim">
          <RankingList rows={topProducts(filtered, 8)} totalCents={summary.totalCents} describe={units} emptyText={empty} onSelect={openProduct} />
        </Block>
      </>
    );
  }

  return (
    <Modal open onClose={onClose} title={`${info.label}: ${filter.name}`} size="4xl">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="inline-flex items-center gap-2 text-sm text-zinc-500">
            <span className="flex size-7 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
              <Icon name={info.icon} className="size-4" />
            </span>
            <span className="capitalize">{monthName}</span>
          </p>
          {canGoBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-zinc-700 ring-1 ring-zinc-300 transition hover:bg-zinc-50"
            >
              <Icon name="arrowLeft" /> Voltar
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {metrics.map((metric) => (
            <Metric key={metric.label} label={metric.label} value={metric.value} />
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">{blocks}</div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-zinc-900">
            Vendas <span className="font-normal text-zinc-400">({filtered.length})</span>
          </h3>
          {filtered.length === 0 ? (
            <p className="rounded-xl bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">Nenhuma venda no período.</p>
          ) : (
            <DrillSalesTable
              sales={filtered}
              showSeller={isOwner && filter.kind !== 'seller'}
              productId={filter.kind === 'product' ? filter.key : undefined}
              // Na análise do próprio cliente, o nome não precisa ser clicável.
              onCustomer={filter.kind === 'customer' ? undefined : (sale) => onOpen({ kind: 'customer', key: sale.customerId, name: sale.customerName })}
            />
          )}
        </div>
      </div>
    </Modal>
  );
}
