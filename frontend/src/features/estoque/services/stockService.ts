// Chamadas à API do módulo estoque (somente Dono): registrar movimento e listar o histórico.

import { apiFetch } from '../../../services/apiClient';

/** Tipos de movimento (SALE = venda automática, a partir da Etapa 9). */
export type MovementType = 'IN' | 'OUT' | 'ADJUST' | 'SALE';

/** Movimento como a API devolve. */
export interface StockMovement {
  movementId: string;
  productId: string;
  productName: string;
  type: MovementType;
  /** Variação: positiva (entrou) ou negativa (saiu). */
  delta: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  userEmail: string;
  createdAt: string;
}

/** Dados enviados para registrar um movimento manual. */
export interface MovementInput {
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUST';
  /** IN/OUT: quanto entra/sai. ADJUST: a quantidade contada (novo estoque). */
  quantity: number;
  reason?: string;
}

/**
 * Registra um movimento de estoque.
 * @param input - produto, tipo, quantidade e motivo
 * @returns o estoque antes e depois
 */
export async function createMovement(input: MovementInput): Promise<{ previousStock: number; newStock: number }> {
  return apiFetch('/estoque/movimentos', { method: 'POST', body: JSON.stringify(input) });
}

/**
 * Lista o histórico (mais novos primeiro), de todos os produtos ou de um só.
 * @param productId - filtra por produto (opcional)
 * @returns os movimentos
 */
export async function listMovements(productId?: string): Promise<StockMovement[]> {
  // URLSearchParams monta o "?productId=..." com os caracteres especiais já protegidos.
  const query = productId ? `?${new URLSearchParams({ productId })}` : '';
  const { movements } = await apiFetch<{ movements: StockMovement[] }>(`/estoque/movimentos${query}`);
  return movements;
}

/** Nome e cor de cada tipo de movimento, para as tabelas. */
export const MOVEMENT_LABELS: Record<MovementType, { label: string; classes: string }> = {
  IN: { label: 'Entrada', classes: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  OUT: { label: 'Saída', classes: 'bg-red-50 text-red-700 ring-red-200' },
  ADJUST: { label: 'Ajuste', classes: 'bg-sky-50 text-sky-700 ring-sky-200' },
  SALE: { label: 'Venda', classes: 'bg-violet-50 text-violet-700 ring-violet-200' },
};
