// Lambda POST /estoque/movimentos: o Dono registra entrada, saída ou ajuste de estoque de um produto.

import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import * as z from 'zod/mini';
import { getAuthContext, requireEmpresaId, requireGroup } from '../../shared/auth';
import { dynamo, getTableName } from '../../shared/dynamo';
import { HttpError } from '../../shared/errors';
import { jsonResponse, withErrorHandling } from '../../shared/http';
import { productKey } from '../../shared/keys';
import { getProductOrThrow } from '../../shared/product';
import { quantityField } from '../../shared/productSchema';
import { buildStockMovementItem } from '../../shared/stock';
import { parseJsonBody, validate } from '../../shared/validation';

const bodySchema = z.object({
  productId: z.guid('Produto inválido.'),
  // SALE não entra aqui: venda só acontece pelo módulo de vendas.
  type: z.enum(['IN', 'OUT', 'ADJUST'], 'Tipo de movimento inválido.'),
  /** IN/OUT: quantidade que entra/sai. ADJUST: quantidade CONTADA (o novo estoque). */
  quantity: quantityField('Quantidade'),
  reason: z.optional(z.string().check(z.trim(), z.maxLength(200, 'Motivo: no máximo 200 caracteres.'))),
});

/**
 * Handler: calcula o novo estoque e grava produto + histórico em uma transação.
 * @param event - requisição da HTTP API
 * @returns 201 com { productId, previousStock, newStock }
 */
export const handler = withErrorHandling(async (event) => {
  const auth = getAuthContext(event);
  requireGroup(auth, 'Dono'); // REGRA DO PROJETO: só o Dono controla o estoque
  const empresaId = requireEmpresaId(auth);
  const body = validate(bodySchema, parseJsonBody(event.body));

  if (body.type !== 'ADJUST' && body.quantity === 0) throw new HttpError(400, 'A quantidade precisa ser maior que zero.');
  if (body.type !== 'IN' && !body.reason) throw new HttpError(400, 'Informe o motivo da saída ou do ajuste.');

  const product = await getProductOrThrow(empresaId, body.productId);
  const previousStock = product.stock;

  let newStock: number;
  if (body.type === 'IN') newStock = previousStock + body.quantity;
  else if (body.type === 'OUT') newStock = previousStock - body.quantity;
  else newStock = body.quantity;

  if (newStock < 0) throw new HttpError(400, `Estoque insuficiente: há só ${previousStock} em estoque.`);
  if (newStock === previousStock) throw new HttpError(400, 'O estoque já está com essa quantidade.');

  const TableName = getTableName();
  try {
    await dynamo.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Update: {
              TableName,
              Key: productKey(empresaId, product.productId),
              UpdateExpression: 'SET stock = :newStock, updatedAt = :now',
              // "Trava otimista": só grava se o estoque ainda for o que lemos.
              // Se outra operação mudou no meio do caminho, a transação é cancelada e nada é gravado.
              ConditionExpression: 'stock = :previousStock',
              ExpressionAttributeValues: { ':newStock': newStock, ':previousStock': previousStock, ':now': new Date().toISOString() },
            },
          },
          {
            Put: {
              TableName,
              Item: buildStockMovementItem(empresaId, auth, {
                productId: product.productId,
                productName: product.name,
                type: body.type,
                previousStock,
                newStock,
                reason: body.reason || undefined,
              }),
            },
          },
        ],
      }),
    );
  } catch (error) {
    const reasons = (error as { CancellationReasons?: { Code?: string }[] }).CancellationReasons;
    if (reasons?.[0]?.Code === 'ConditionalCheckFailed') {
      throw new HttpError(409, 'O estoque foi alterado por outra operação. Atualize a página e tente novamente.');
    }
    throw error;
  }

  return jsonResponse(201, { productId: product.productId, previousStock, newStock });
});
