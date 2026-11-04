// Movimentos de estoque: tipos e a função que monta o registro do histórico.
// Usado pelo cadastro de produto (estoque inicial), pelos movimentos manuais e, na Etapa 9, pelas vendas.

import type { AuthContext } from './auth';
import { stockMovementKey } from './keys';

/**
 * Tipos de movimento:
 * - IN (entrada): soma ao estoque (compra, devolução de fornecedor...)
 * - OUT (saída): tira do estoque (perda, uso interno, avaria...)
 * - ADJUST (ajuste): define o estoque com o número contado na prateleira (inventário)
 * - SALE (venda): saída automática feita pela venda (Etapa 9)
 */
export type StockMovementType = 'IN' | 'OUT' | 'ADJUST' | 'SALE';

/** Movimento como fica gravado no DynamoDB (sem pk/sk). */
export interface StockMovement {
  movementId: string;
  productId: string;
  /** Nome do produto no momento do movimento (o histórico continua legível se o nome mudar). */
  productName: string;
  type: StockMovementType;
  /** Variação: positiva (entrada) ou negativa (saída). No ajuste, é a diferença calculada. */
  delta: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  /** Venda que causou o movimento (tipo SALE, ou entrada por cancelamento de venda). */
  saleId?: string;
  userId: string;
  userEmail: string;
  createdAt: string;
}

/**
 * Monta o item do histórico, pronto para ir em um "Put" do DynamoDB.
 * @param empresaId - empresa (do token)
 * @param auth - quem fez o movimento
 * @param data - produto, tipo, estoques antes/depois e motivo
 * @returns o item com pk/sk + dados
 */
export function buildStockMovementItem(
  empresaId: string,
  auth: AuthContext,
  data: Pick<StockMovement, 'productId' | 'productName' | 'type' | 'previousStock' | 'newStock' | 'reason' | 'saleId'>,
): Record<string, unknown> {
  const createdAt = new Date().toISOString();
  // Só os 8 primeiros caracteres do UUID bastam para diferenciar movimentos no mesmo milissegundo.
  const movementId = crypto.randomUUID().slice(0, 8);
  const movement: StockMovement = {
    ...data,
    movementId,
    delta: data.newStock - data.previousStock,
    userId: auth.userId,
    userEmail: auth.email,
    createdAt,
  };
  return { ...stockMovementKey(empresaId, createdAt, movementId), ...movement };
}
