// Popup "Ver todos": tabela COMPLETA do mês (produtos, clientes, vendedores ou formas de pagamento), com busca,
// ordenação por qualquer coluna e clique na linha para abrir a análise individual daquele item.

import { useMemo, useState } from 'react';
import { Icon } from '../../../components/ui/Icon';
import { Modal } from '../../../components/ui/Modal';
import { formatCents, formatDate } from '../../../utils/formatters';
import { paymentLabel } from '../../vendas/constants/paymentMethods';
import type { Sale } from '../../vendas/services/saleService';
import { detailRows, type DetailRow, type DrillFilter, type ListKind } from '../utils/salesStats';
import { SortHeader, type SortDirection } from './SortHeader';

/** Colunas que podem ser ordenadas (campos da DetailRow). */
type SortKey = 'name' | 'totalCents' | 'units' | 'salesCount' | 'customers' | 'averageCents' | 'lastAt';

/** Uma coluna da tabela: título, campo e como mostrar o valor. */
interface Column {
  key: SortKey;
  label: string;
  render: (row: DetailRow, totalCents: number) => string;
}

const money = (key: 'totalCents' | 'averageCents'): Column['render'] => (row) => formatCents(row[key]);
const count = (key: 'units' | 'salesCount' | 'customers'): Column['render'] => (row) => row[key].toLocaleString('pt-BR');

/** Configuração de cada tipo de lista: título, nome da 1ª coluna, colunas e o que a busca procura. */
const CONFIG: Record<ListKind, { title: string; nameLabel: string; columns: Column[]; searchPlaceholder: string }> = {
  product: {
    title: 'Todos os produtos vendidos',
    nameLabel: 'Produto',
    searchPlaceholder: 'Buscar produto…',
    columns: [
      { key: 'totalCents', label: 'Faturado', render: money('totalCents') },
      { key: 'units', label: 'Unidades', render: count('units') },
      { key: 'salesCount', label: 'Vendas', render: count('salesCount') },
      { key: 'customers', label: 'Clientes', render: count('customers') },
      { key: 'lastAt', label: 'Última venda', render: (row) => formatDate(row.lastAt) },
    ],
  },
  customer: {
    title: 'Todos os clientes que compraram',
    nameLabel: 'Cliente',
    searchPlaceholder: 'Buscar cliente (ex.: Camila)…',
    columns: [
      { key: 'totalCents', label: 'Comprou', render: money('totalCents') },
      { key: 'salesCount', label: 'Vezes', render: count('salesCount') },
      { key: 'units', label: 'Unidades', render: count('units') },
      { key: 'averageCents', label: 'Ticket médio', render: money('averageCents') },
      { key: 'lastAt', label: 'Última compra', render: (row) => formatDate(row.lastAt) },
    ],
  },
  seller: {
    title: 'Equipe: vendas e atendimentos',
    nameLabel: 'Vendedor',
    searchPlaceholder: 'Buscar vendedor…',
    columns: [
      { key: 'totalCents', label: 'Vendido', render: money('totalCents') },
      { key: 'salesCount', label: 'Vendas', render: count('salesCount') },
      { key: 'customers', label: 'Clientes atendidos', render: count('customers') },
      { key: 'averageCents', label: 'Ticket médio', render: money('averageCents') },
      { key: 'lastAt', label: 'Última venda', render: (row) => formatDate(row.lastAt) },
    ],
  },
  payment: {
    title: 'Todas as formas de pagamento',
    nameLabel: 'Forma de pagamento',
    searchPlaceholder: 'Buscar forma de pagamento…',
    columns: [
      { key: 'totalCents', label: 'Recebido', render: money('totalCents') },
      { key: 'salesCount', label: 'Vendas', render: count('salesCount') },
      { key: 'customers', label: 'Clientes', render: count('customers') },
      { key: 'averageCents', label: 'Ticket médio', render: money('averageCents') },
      { key: 'lastAt', label: 'Última venda', render: (row) => formatDate(row.lastAt) },
    ],
  },
};

/** Propriedades do popup. */
interface FullListModalProps {
  kind: ListKind;
  /** Vendas válidas do mês. */
  sales: Sale[];
  monthName: string;
  canGoBack: boolean;
  /** Clique numa linha: abre a análise individual. */
  onOpen: (filter: DrillFilter) => void;
  onBack: () => void;
  onClose: () => void;
}

/**
 * Desenha o popup.
 * @param props - tipo, vendas, mês e ações
 * @returns o modal
 */
export function FullListModal({ kind, sales, monthName, canGoBack, onOpen, onBack, onClose }: FullListModalProps) {
  const config = CONFIG[kind];
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('totalCents');
  const [direction, setDirection] = useState<SortDirection>('desc');

  // useMemo: só recalcula as linhas quando as vendas mudam (não a cada tecla na busca).
  const allRows = useMemo(() => detailRows(sales, kind, paymentLabel), [sales, kind]);
  const totalCents = allRows.reduce((sum, row) => sum + row.totalCents, 0);

  const term = search.trim().toLowerCase();
  const rows = allRows
    .filter((row) => !term || row.name.toLowerCase().includes(term))
    // Ordena: texto com localeCompare (ordem alfabética em português); números/datas comparando direto.
    .sort((a, b) => {
      const result =
        sortKey === 'name' || sortKey === 'lastAt'
          ? String(a[sortKey]).localeCompare(String(b[sortKey]), 'pt-BR')
          : a[sortKey] - b[sortKey];
      return direction === 'asc' ? result : -result;
    });

  /**
   * Clique num título de coluna: ordena por ela; se já estava, inverte a ordem.
   * @param key - coluna clicada
   */
  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setDirection(direction === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      // Nome começa de A→Z; números e datas começam do maior/mais recente.
      setDirection(key === 'name' ? 'asc' : 'desc');
    }
  }

  return (
    <Modal open onClose={onClose} title={config.title} size="4xl">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {canGoBack && (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 self-start rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 ring-1 ring-zinc-300 transition hover:bg-zinc-50"
            >
              <Icon name="arrowLeft" /> Voltar
            </button>
          )}
          {/* Campo de busca com ícone de lupa dentro. */}
          <label className="relative block flex-1">
            <span className="sr-only">Buscar</span>
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={config.searchPlaceholder}
              autoFocus
              className="block w-full rounded-lg border border-zinc-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
            />
          </label>
          <p className="text-sm text-zinc-500 sm:ml-auto">
            <span className="capitalize">{monthName}</span> · {rows.length} de {allRows.length}
          </p>
        </div>

        {rows.length === 0 ? (
          <p className="rounded-xl bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-500">
            {allRows.length === 0 ? 'Sem vendas no período.' : 'Nada encontrado com essa busca.'}
          </p>
        ) : (
          <div className="max-h-[60vh] overflow-auto rounded-xl ring-1 ring-zinc-200">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="sticky top-0 z-10 bg-zinc-50 text-xs text-zinc-500">
                <tr>
                  <SortHeader label={config.nameLabel} active={sortKey === 'name'} direction={direction} onClick={() => toggleSort('name')} />
                  {config.columns.map((column) => (
                    <SortHeader
                      key={column.key}
                      label={column.label}
                      active={sortKey === column.key}
                      direction={direction}
                      onClick={() => toggleSort(column.key)}
                      alignRight
                    />
                  ))}
                  <th className="w-8" aria-hidden="true" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {rows.map((row) => (
                  // A linha inteira abre a análise; o botão no nome permite usar o teclado (Tab + Enter).
                  <tr
                    key={row.key}
                    onClick={() => onOpen({ kind, key: row.key, name: row.name })}
                    className="group cursor-pointer transition hover:bg-zinc-50"
                  >
                    <td className="px-3 py-2.5">
                      <button type="button" className="text-left font-medium text-zinc-900 group-hover:text-brand-700">
                        {row.name}
                      </button>
                      {/* Participação no total do mês, numa linha fina. */}
                      <div className="mt-1.5 h-1 w-32 rounded-full bg-zinc-100" aria-hidden="true">
                        <div className="h-1 rounded-full bg-brand-600" style={{ width: `${totalCents ? Math.max(2, (row.totalCents / totalCents) * 100) : 0}%` }} />
                      </div>
                    </td>
                    {config.columns.map((column) => (
                      <td
                        key={column.key}
                        className={`px-3 py-2.5 text-right tabular-nums ${column.key === sortKey ? 'font-semibold text-zinc-900' : 'text-zinc-600'}`}
                      >
                        {column.render(row, totalCents)}
                      </td>
                    ))}
                    <td className="pr-3">
                      <Icon name="chevronRight" className="size-4 text-zinc-300 transition group-hover:text-brand-600" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-zinc-400">Clique no título de uma coluna para ordenar. Clique numa linha para ver a análise completa.</p>
      </div>
    </Modal>
  );
}
