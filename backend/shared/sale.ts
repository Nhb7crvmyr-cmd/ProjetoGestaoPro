// Formato do registro de VENDA no banco, o gerador de id e a regra de acesso (Funcionario só vê as vendas dele).

import { GetCommand } from '@aws-sdk/lib-dynamodb';
import * as z from 'zod/mini';
import type { AuthContext } from './auth';
import { dynamo, getTableName } from './dynamo';
import { HttpError } from './errors';
import { saleKey } from './keys';
import type { ProductUnit } from './product';

/** Formas de pagamento aceitas. */
export const PAYMENT_METHODS = ['PIX', 'DINHEIRO', 'CARTAO_CREDITO', 'CARTAO_DEBITO', 'BOLETO', 'OUTRO'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Um item da venda. Nome, unidade e preço são COPIADOS do produto no momento da venda. */
export interface SaleItem {
  productId: string;
  productName: string;
  sku?: string;
  unit: ProductUnit;
  quantity: number;
  /** Preço unitário em centavos (do cadastro do produto, nunca do navegador). */
  unitPriceCents: number;
  /** quantity × unitPriceCents */
  totalCents: number;
}

/** Venda como fica gravada no DynamoDB (sem pk/sk). */
export interface Sale {
  saleId: string;
  /** Número sequencial da empresa (#1, #2...). */
  number: number;
  empresaId: string;
  customerId: string;
  customerName: string;
  /** Quem vendeu (o "vendedorId" das regras do projeto). Sempre do token. */
  sellerId: string;
  sellerName: string;
  items: SaleItem[];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  /**
   * COMPLETED = concluída; CANCEL_REQUESTED = o vendedor pediu cancelamento e o Dono ainda não decidiu
   * (a venda continua valendo e o estoque continua baixado); CANCELED = cancelada (estoque devolvido).
   */
  status: SaleStatus;
  createdAt: string;
  /** Pedido de cancelamento em aberto (só existe com status CANCEL_REQUESTED). */
  cancelRequest?: { reason: string; requestedBy: string; requestedByName: string; requestedAt: string };
  /** Última decisão do Dono sobre um pedido (ex.: recusado, com orientação para o vendedor). */
  lastCancelReview?: { decision: 'REJECTED'; note: string; reviewedByName: string; reviewedAt: string; requestReason: string };
  canceledAt?: string;
  canceledBy?: string;
  cancelReason?: string;
}

export type SaleStatus = 'COMPLETED' | 'CANCEL_REQUESTED' | 'CANCELED';

/**
 * Gera o id da venda COMEÇANDO PELA DATA (ex.: "20261016T183000123Z-ab12cd34").
 * Como o DynamoDB guarda as sk em ordem, as vendas ficam ordenadas por data, e dá para
 * buscar "as vendas de outubro" com um intervalo de sk (sem varrer a tabela).
 * @param date - momento da venda
 * @returns o id
 */
export function generateSaleId(date: Date): string {
  const compact = date.toISOString().replace(/[-:.]/g, ''); // 2026-10-16T18:30:00.123Z → 20261016T183000123Z
  return `${compact}-${crypto.randomUUID().slice(0, 8)}`;
}

/** {saleId} na URL. */
export const saleIdPathSchema = z.object({
  saleId: z.string('Venda inválida.').check(z.regex(/^\d{8}T\d{9}Z-[0-9a-f]{8}$/, 'Venda inválida.')),
});

/**
 * Busca uma venda e confere o acesso: o Dono vê todas; o Funcionario, só as que ele fez.
 * @param empresaId - empresa (do token)
 * @param saleId - id da venda
 * @param auth - usuário logado
 * @returns a venda (404 se não existir ou se não puder ver)
 */
export async function getSaleOrThrow(empresaId: string, saleId: string, auth: AuthContext): Promise<Sale> {
  const { Item } = await dynamo.send(new GetCommand({ TableName: getTableName(), Key: saleKey(empresaId, saleId) }));
  if (!Item) throw new HttpError(404, 'Venda não encontrada.');
  const { pk: _pk, sk: _sk, ...sale } = Item;
  if (!auth.groups.includes('Dono') && sale.sellerId !== auth.userId) throw new HttpError(404, 'Venda não encontrada.');
  return sale as Sale;
}

/**
 * Lê o motivo de uma transação cancelada pelo DynamoDB: a posição do item que falhou na condição.
 * @param error - erro capturado
 * @returns a posição (0, 1, 2...) ou -1
 */
export function failedTransactionIndex(error: unknown): number {
  const reasons = (error as { CancellationReasons?: { Code?: string }[] }).CancellationReasons;
  return reasons?.findIndex((reason) => reason.Code === 'ConditionalCheckFailed') ?? -1;
}
