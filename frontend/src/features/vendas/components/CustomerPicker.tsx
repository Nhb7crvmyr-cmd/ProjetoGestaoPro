// Escolha do cliente da venda: campo de busca + lista clicável (nome, telefone e documento).
// O funcionário só vê os clientes dele (a lista já vem filtrada pelo backend).

import { useState } from 'react';
import { formatPhone, onlyDigits } from '../../../utils/formatters';
import type { Customer } from '../../clientes/services/customerService';

/** Propriedades do seletor. */
interface CustomerPickerProps {
  customers: Customer[];
  selected?: Customer;
  onSelect: (customer: Customer | undefined) => void;
}

/**
 * Desenha o seletor. Com um cliente escolhido, mostra só ele e o botão "Trocar".
 * @param props - clientes, escolhido e ação
 * @returns o bloco de escolha do cliente
 */
export function CustomerPicker({ customers, selected, onSelect }: CustomerPickerProps) {
  const [search, setSearch] = useState('');

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg bg-brand-50 px-4 py-3 ring-1 ring-brand-200">
        <div>
          <p className="font-medium text-zinc-900">{selected.name}</p>
          <p className="text-xs text-zinc-600">{formatPhone(selected.phone)}</p>
        </div>
        <button type="button" onClick={() => onSelect(undefined)} className="text-sm font-semibold text-brand-700 hover:text-brand-800">
          Trocar
        </button>
      </div>
    );
  }

  const term = search.trim().toLowerCase();
  const digits = onlyDigits(term);
  const active = customers.filter((customer) => customer.active);
  const filtered = active
    .filter(
      (customer) =>
        !term ||
        customer.name.toLowerCase().includes(term) ||
        (digits.length >= 3 && (customer.phone.includes(digits) || customer.document?.includes(digits))),
    )
    // Mostra no máximo 8 por vez: a lista fica curta e rápida de ler.
    .slice(0, 8);

  return (
    <div className="space-y-2">
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar cliente por nome, telefone ou CPF…"
        aria-label="Buscar cliente"
        className="block w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
      />
      {active.length === 0 ? (
        <p className="rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-500">Nenhum cliente ativo. Cadastre em Clientes.</p>
      ) : (
        <ul className="max-h-64 divide-y divide-zinc-100 overflow-y-auto rounded-lg ring-1 ring-zinc-200">
          {filtered.map((customer) => (
            <li key={customer.customerId}>
              <button type="button" onClick={() => onSelect(customer)} className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition hover:bg-zinc-50">
                <span className="font-medium text-zinc-900">{customer.name}</span>
                <span className="text-xs text-zinc-500">{formatPhone(customer.phone)}</span>
              </button>
            </li>
          ))}
          {filtered.length === 0 && <li className="px-4 py-3 text-sm text-zinc-500">Nenhum cliente encontrado.</li>}
        </ul>
      )}
    </div>
  );
}
