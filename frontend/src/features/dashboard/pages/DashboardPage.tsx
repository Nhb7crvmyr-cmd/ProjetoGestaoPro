// Página "Dashboard": como foi o mês, num visual limpo. Cartões com os números principais (com variação e
// mini linha), fluxo de vendas por dia (área), rankings em lista (produtos, vendedores, pagamento, clientes)
// e quem comprou. O Supervisor vê a empresa toda; o funcionário vê só as vendas dele (quem filtra é o backend).
// TUDO é clicável: clientes, produtos, vendedores e formas de pagamento abrem uma análise detalhada (popup).

import { useState, type ReactNode } from 'react';
import { Alert } from '../../../components/ui/Alert';
import { Icon, type IconName } from '../../../components/ui/Icon';
import { formatCents } from '../../../utils/formatters';
import { useSession } from '../../auth/context/SessionContext';
import { MonthPicker } from '../../vendas/components/MonthPicker';
import { paymentLabel } from '../../vendas/constants/paymentMethods';
import { useSales } from '../../vendas/hooks/useSales';
import { addMonths, currentMonth, monthLabel, monthRange, type MonthRef } from '../../vendas/utils/period';
import { DailySalesChart } from '../components/DailySalesChart';
import { AllSalesModal } from '../components/AllSalesModal';
import { DrillDownModal } from '../components/DrillDownModal';
import { FullListModal } from '../components/FullListModal';
import { RankingList } from '../components/RankingList';
import { RecentBuyers } from '../components/RecentBuyers';
import { StatTile } from '../components/StatTile';
import {
  byPayment,
  bySeller,
  customersBySeller,
  dailySeries,
  percentChange,
  summarize,
  topCustomers,
  topProducts,
  validSales,
  type DrillFilter,
  type ListKind,
  type RankingRow,
} from '../utils/salesStats';

/**
 * Moldura de cada bloco: título com ícone, subtítulo opcional, um "extra" à direita e o conteúdo.
 * @param props - título, ícone, subtítulo, extra e conteúdo
 * @returns o bloco
 */
function Panel({
  title,
  icon,
  subtitle,
  extra,
  children,
  className = '',
}: {
  title: string;
  icon: IconName;
  subtitle?: string;
  extra?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl bg-white p-6 ring-1 ring-zinc-200/70 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
            <Icon name={icon} className="size-4" />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">{title}</h2>
            {subtitle && <p className="text-xs text-zinc-500">{subtitle}</p>}
          </div>
        </div>
        {extra}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

/** O que está aberto na pilha de popups: lista completa, todas as vendas ou a análise de um item. */
type DashboardView = { type: 'list'; kind: ListKind } | { type: 'sales' } | { type: 'drill'; filter: DrillFilter };

/**
 * Botão "Ver todos" que fica no canto de cada bloco.
 * @param props - quantidade de itens e ação
 * @returns o botão
 */
function SeeAllButton({ count, onClick }: { count: number; onClick: () => void }) {
  if (count === 0) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-50"
    >
      <Icon name="list" className="size-3.5" />
      Ver todos ({count})
    </button>
  );
}

/**
 * Número pequeno com rótulo (usado ao lado do título do "Fluxo do mês").
 * @param props - rótulo e valor
 * @returns o bloco
 */
function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-right">
      <p className="text-[11px] font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="text-sm font-semibold tabular-nums text-zinc-900">{value}</p>
    </div>
  );
}

/**
 * Tela do dashboard.
 * @returns a página
 */
export function DashboardPage() {
  const { user } = useSession();
  const isOwner = user.groups.includes('Dono');
  const [month, setMonth] = useState<MonthRef>(currentMonth());
  const today = currentMonth();
  const isCurrentMonth = month.year === today.year && month.month === today.month;

  // Duas buscas: o mês escolhido e o anterior (para a comparação "+12% vs. mês anterior").
  const range = monthRange(month);
  const previousRange = monthRange(addMonths(month, -1));
  const salesQuery = useSales(range.from, range.to);
  const previousQuery = useSales(previousRange.from, previousRange.to);

  const sales = validSales(salesQuery.data?.sales ?? []);
  const current = summarize(sales);
  const previous = summarize(validSales(previousQuery.data?.sales ?? []));
  // A comparação só aparece quando o mês anterior já carregou.
  const compare = (a: number, b: number) => (previousQuery.isSuccess ? percentChange(a, b) : undefined);

  // No mês atual, o gráfico vai até hoje; nos passados, até o último dia do mês.
  const daysInMonth = isCurrentMonth ? new Date().getDate() : new Date(month.year, month.month + 1, 0).getDate();
  const daily = dailySeries(sales, daysInMonth);
  const bestDay = daily.reduce((best, point) => (point.totalCents > best.totalCents ? point : best), daily[0] ?? { day: 0, totalCents: 0, count: 0 });
  const monthName = monthLabel(month);
  const loading = salesQuery.isPending;

  // Pilha de popups abertos: o último é o que aparece. "Voltar" tira o último; fechar limpa tudo.
  // Ex.: Ver todos os clientes → Camila → produto que ela comprou → Voltar → Voltar.
  const [views, setViews] = useState<DashboardView[]>([]);
  const openView = (view: DashboardView) => setViews((stack) => [...stack, view]);
  const openDrill = (filter: DrillFilter) => openView({ type: 'drill', filter });
  const openList = (kind: ListKind) => () => openView({ type: 'list', kind });
  const goBack = () => setViews((stack) => stack.slice(0, -1));
  const closeAll = () => setViews([]);
  const topView = views[views.length - 1];
  // Quantos itens DIFERENTES há em cada lista (para o "Ver todos (N)").
  const distinct = (pick: (sale: (typeof sales)[number]) => string[]) => new Set(sales.flatMap(pick)).size;
  const counts = {
    product: distinct((sale) => sale.items.map((item) => item.productId)),
    customer: distinct((sale) => [sale.customerId]),
    seller: distinct((sale) => [sale.sellerId]),
    payment: distinct((sale) => [sale.paymentMethod]),
  };
  /** Cria a função de clique de um ranking para um tipo de análise. */
  const drillOn = (kind: DrillFilter['kind']) => (row: RankingRow) => openDrill({ kind, key: row.key, name: row.name });

  /** Textos das linhas dos rankings. */
  const plural = (quantity: number, one: string, many: string) => `${quantity} ${quantity === 1 ? one : many}`;
  const units = (row: RankingRow) => plural(row.quantity, 'unidade', 'unidades');
  const salesCount = (row: RankingRow) => plural(row.quantity, 'venda', 'vendas');
  const purchases = (row: RankingRow) => plural(row.quantity, 'compra', 'compras');
  // Equipe: quem mais vendeu E quem mais atendeu (clientes diferentes).
  const attended = customersBySeller(sales);
  const teamText = (row: RankingRow) => `${salesCount(row)} · ${plural(attended.get(row.key) ?? 0, 'cliente atendido', 'clientes atendidos')}`;
  const empty = 'Sem vendas no período.';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-brand-700">{isOwner ? 'Visão da empresa' : 'Seus resultados'}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">Dashboard</h1>
        </div>
        <MonthPicker value={month} onChange={setMonth} />
      </div>

      {salesQuery.isError && <Alert type="error">{salesQuery.error.message}</Alert>}

      {/* Números principais. As mini linhas usam os valores de cada dia do mês. */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Vendido no mês"
          icon="wallet"
          value={formatCents(current.totalCents)}
          change={compare(current.totalCents, previous.totalCents)}
          trend={daily.map((point) => point.totalCents)}
          loading={loading}
        />
        <StatTile
          label="Vendas"
          icon="receipt"
          value={String(current.count)}
          change={compare(current.count, previous.count)}
          hint={plural(current.units, 'unidade', 'unidades')}
          trend={daily.map((point) => point.count)}
          loading={loading}
        />
        <StatTile label="Ticket médio" icon="tag" value={formatCents(current.averageCents)} change={compare(current.averageCents, previous.averageCents)} loading={loading} />
        <StatTile label="Clientes que compraram" icon="users" value={String(current.customers)} change={compare(current.customers, previous.customers)} loading={loading} />
      </div>

      <Panel
        title="Fluxo do mês"
        icon="calendar"
        subtitle={`Vendas por dia · ${monthName}`}
        extra={
          !loading && current.count > 0 ? (
            <div className="flex gap-6">
              <MiniStat label="Melhor dia" value={`Dia ${bestDay.day} · ${formatCents(bestDay.totalCents)}`} />
              <MiniStat label="Média por dia" value={formatCents(Math.round(current.totalCents / Math.max(1, daysInMonth)))} />
            </div>
          ) : undefined
        }
      >
        {loading ? <p className="text-sm text-zinc-500">Carregando…</p> : <DailySalesChart points={daily} monthName={monthName} />}
      </Panel>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Mais vendidos" icon="package" subtitle="Produtos que mais faturaram" extra={<SeeAllButton count={counts.product} onClick={openList('product')} />}>
          <RankingList rows={topProducts(sales)} totalCents={current.totalCents} describe={units} emptyText={empty} onSelect={drillOn('product')} />
        </Panel>
        {isOwner ? (
          <Panel title="Equipe" icon="users" subtitle="Quem mais vendeu e quem mais atendeu" extra={<SeeAllButton count={counts.seller} onClick={openList('seller')} />}>
            <RankingList rows={bySeller(sales)} totalCents={current.totalCents} describe={teamText} emptyText={empty} onSelect={drillOn('seller')} />
          </Panel>
        ) : (
          <Panel title="Melhores clientes" icon="sparkles" subtitle="Quem mais comprou" extra={<SeeAllButton count={counts.customer} onClick={openList('customer')} />}>
            <RankingList rows={topCustomers(sales)} totalCents={current.totalCents} describe={purchases} emptyText={empty} onSelect={drillOn('customer')} />
          </Panel>
        )}
        <Panel title="Formas de pagamento" icon="creditCard" subtitle="Como os clientes pagaram" extra={<SeeAllButton count={counts.payment} onClick={openList('payment')} />}>
          <RankingList rows={byPayment(sales, paymentLabel)} totalCents={current.totalCents} describe={salesCount} emptyText={empty} onSelect={drillOn('payment')} />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <Panel
          title="Quem comprou"
          icon="receipt"
          subtitle="Últimas vendas do mês"
          className={isOwner ? 'lg:col-span-3' : 'lg:col-span-5'}
          extra={<SeeAllButton count={sales.length} onClick={() => openView({ type: 'sales' })} />}
        >
          <RecentBuyers
            sales={sales}
            showSeller={isOwner}
            onCustomer={(sale) => openDrill({ kind: 'customer', key: sale.customerId, name: sale.customerName })}
          />
        </Panel>
        {isOwner && (
          <Panel
            title="Melhores clientes"
            icon="sparkles"
            subtitle="Quem mais comprou"
            className="lg:col-span-2"
            extra={<SeeAllButton count={counts.customer} onClick={openList('customer')} />}
          >
            <RankingList rows={topCustomers(sales)} totalCents={current.totalCents} describe={purchases} emptyText={empty} onSelect={drillOn('customer')} />
          </Panel>
        )}
      </div>

      {/* Só o popup do topo da pilha aparece. "key" recria o popup ao trocar de lista (limpa busca e ordem). */}
      {topView?.type === 'list' && (
        <FullListModal
          key={topView.kind}
          kind={topView.kind}
          sales={sales}
          monthName={monthName}
          canGoBack={views.length > 1}
          onOpen={openDrill}
          onBack={goBack}
          onClose={closeAll}
        />
      )}
      {topView?.type === 'sales' && (
        <AllSalesModal sales={sales} monthName={monthName} isOwner={isOwner} canGoBack={views.length > 1} onOpen={openDrill} onBack={goBack} onClose={closeAll} />
      )}
      <DrillDownModal
        filter={topView?.type === 'drill' ? topView.filter : undefined}
        canGoBack={views.length > 1}
        sales={sales}
        monthName={monthName}
        isOwner={isOwner}
        onOpen={openDrill}
        onBack={goBack}
        onClose={closeAll}
      />

      <p className="text-xs text-zinc-400">
        Use "Ver todos" para a lista completa (com busca e ordenação). Clique em qualquer cliente, produto, vendedor ou
        forma de pagamento para ver a análise completa do mês.
        Vendas canceladas não entram nos números. Vendas aguardando cancelamento continuam contando até a decisão.
        No ranking de produtos, os valores são antes do desconto da venda.
      </p>
    </div>
  );
}
