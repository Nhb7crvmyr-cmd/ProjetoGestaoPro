// Chamadas à API do módulo vendas: registrar, listar por período, pedir cancelamento e decidir (aprovar/recusar).

import { apiFetch } from '../../../services/apiClient';
import type { PaymentMethod } from '../constants/paymentMethods';

/** Item da venda (nome e preço copiados do produto no momento da venda). */
export interface SaleItem {
  productId: string;
  productName: string;
  sku?: string;
  unit: string;
  quantity: number;
  unitPriceCents: number;
  totalCents: number;
}

/** Venda como a API devolve. */
export interface Sale {
  saleId: string;
  number: number;
  customerId: string;
  customerName: string;
  sellerId: string;
  sellerName: string;
  items: SaleItem[];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  /** COMPLETED = concluída; CANCEL_REQUESTED = vendedor pediu cancelamento (Dono decide); CANCELED = cancelada. */
  status: 'COMPLETED' | 'CANCEL_REQUESTED' | 'CANCELED';
  createdAt: string;
  /** Pedido de cancelamento em aberto. */
  cancelRequest?: { reason: string; requestedByName: string; requestedAt: string };
  /** Última decisão do Dono (pedido recusado, com orientação para o vendedor). */
  lastCancelReview?: { decision: 'REJECTED'; note: string; reviewedByName: string; reviewedAt: string; requestReason: string };
  canceledAt?: string;
  cancelReason?: string;
}

/** O que o site envia para registrar uma venda: só produto e quantidade (o preço vem do banco). */
export interface SaleInput {
  customerId: string;
  items: { productId: string; quantity: number }[];
  discountCents?: number;
  paymentMethod: PaymentMethod;
  notes?: string;
}

/**
 * Registra a venda (o backend dá baixa no estoque).
 * @param input - cliente, itens, desconto, pagamento e observações
 * @returns a venda criada (com número e totais calculados pelo backend)
 */
export async function createSale(input: SaleInput): Promise<Sale> {
  const { sale } = await apiFetch<{ sale: Sale }>('/vendas', { method: 'POST', body: JSON.stringify(input) });
  return sale;
}

/**
 * Lista as vendas de um período (o funcionário recebe só as dele: quem decide é o backend).
 * O Dono recebe também os pedidos de cancelamento pendentes (de qualquer mês).
 * @param from - início (ISO)
 * @param to - fim (ISO)
 * @returns { sales, pendingCancellations }
 */
export async function listSales(from: string, to: string): Promise<{ sales: Sale[]; pendingCancellations: Sale[] }> {
  return apiFetch(`/vendas?${new URLSearchParams({ from, to })}`);
}

/**
 * Funcionário: pede o cancelamento de uma venda dele (o Dono decide).
 * @param saleId - id da venda
 * @param reason - motivo
 * @returns a venda atualizada
 */
export async function requestCancelSale(saleId: string, reason: string): Promise<{ sale: Sale }> {
  return apiFetch(`/vendas/${encodeURIComponent(saleId)}/solicitar-cancelamento`, { method: 'POST', body: JSON.stringify({ reason }) });
}

/**
 * Dono: recusa o pedido e devolve a venda ao vendedor com uma orientação.
 * @param saleId - id da venda
 * @param note - orientação (ex.: "ofereça 10% de desconto")
 * @returns a venda atualizada
 */
export async function rejectCancelSale(saleId: string, note: string): Promise<{ sale: Sale }> {
  return apiFetch(`/vendas/${encodeURIComponent(saleId)}/recusar-cancelamento`, { method: 'POST', body: JSON.stringify({ note }) });
}

/**
 * Cancela uma venda (somente Dono): direto ou aprovando o pedido do vendedor. O estoque volta.
 * @param saleId - id da venda
 * @param reason - motivo
 * @returns confirmação
 */
export async function cancelSale(saleId: string, reason: string): Promise<{ saleId: string; status: 'CANCELED' }> {
  return apiFetch(`/vendas/${encodeURIComponent(saleId)}/cancelar`, { method: 'POST', body: JSON.stringify({ reason }) });
}
