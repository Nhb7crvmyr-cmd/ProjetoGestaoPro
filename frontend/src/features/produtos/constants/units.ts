// Unidades de medida aceitas (iguais às do backend: backend/shared/product.ts). Todas contadas em inteiros.

export const UNIT_OPTIONS = [
  { value: 'UN', label: 'Unidade (UN)' },
  { value: 'CX', label: 'Caixa (CX)' },
  { value: 'PC', label: 'Peça (PC)' },
  { value: 'PCT', label: 'Pacote (PCT)' },
  { value: 'PAR', label: 'Par (PAR)' },
  { value: 'KIT', label: 'Kit (KIT)' },
] as const;

/** Tipo com os valores possíveis ('UN' | 'CX' | ...), gerado a partir da lista acima. */
export type ProductUnit = (typeof UNIT_OPTIONS)[number]['value'];
