// Lambda POST /vendas/{saleId}/cancelar: o Dono cancela uma venda (direto ou APROVANDO o pedido do vendedor).
// O estoque volta e tudo fica no histórico.

import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import * as z from 'zod/mini';
import { requiredText } from '../../shared/addressSchema';
import { getAuthContext, requireEmpresaId, requireGroup } from '../../shared/auth';
import { dynamo, getTableName, type TransactItems } from '../../shared/dynamo';
import { HttpError } from '../../shared/errors';
import { jsonResponse, withErrorHandling } from '../../shared/http';
import { cancelRequestKey, productKey, saleKey } from '../../shared/keys';
import { getProductOrThrow } from '../../shared/product';
import { failedTransactionIndex, getSaleOrThrow, saleIdPathSchema } from '../../shared/sale';
import { buildStockMovementItem } from '../../shared/stock';
import { parseJsonBody, validate } from '../../shared/validation';

const bodySchema = z.object({ reason: requiredText('Motivo do cancelamento', 200) });

/**
 * Handler: marca a venda como CANCELADA e devolve ao estoque cada item, em UMA transação.
 * @param event - requisição da HTTP API
 * @returns 200 com { saleId, status }
 */
export const handler = withErrorHandling(async (event) => {
  const auth = getAuthContext(event);
  requireGroup(auth, 'Dono'); // só o Dono cancela (o estoque é dele)
  const empresaId = requireEmpresaId(auth);
  const { saleId } = validate(saleIdPathSchema, event.pathParameters ?? {});
  const { reason } = validate(bodySchema, parseJsonBody(event.body));

  const sale = await getSaleOrThrow(empresaId, saleId, auth);
  if (sale.status === 'CANCELED') throw new HttpError(400, `A venda #${sale.number} já está cancelada.`);

  // Estoque atual de cada produto (para registrar "antes → depois" no histórico).
  const products = await Promise.all(sale.items.map((item) => getProductOrThrow(empresaId, item.productId)));
  const now = new Date().toISOString();
  const TableName = getTableName();

  const transactItems: TransactItems = [
    {
      Update: {
        TableName,
        Key: saleKey(empresaId, saleId),
        UpdateExpression: 'SET #status = :canceled, canceledAt = :now, canceledBy = :by, cancelReason = :reason',
        // Só cancela se o status ainda for o que lemos (evita cancelar duas vezes ao mesmo tempo).
        ConditionExpression: '#status = :current',
        // "status" é palavra reservada do DynamoDB: por isso o apelido "#status".
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':canceled': 'CANCELED', ':current': sale.status, ':now': now, ':by': auth.userId, ':reason': reason },
      },
    },
  ];
  // Se havia pedido do vendedor, ele foi APROVADO: apaga o pedido pendente.
  if (sale.status === 'CANCEL_REQUESTED') {
    transactItems.push({ Delete: { TableName, Key: cancelRequestKey(empresaId, saleId) } });
  }
  const firstProductIndex = transactItems.length;
  sale.items.forEach((item, index) => {
    const product = products[index];
    const newStock = product.stock + item.quantity;
    transactItems.push(
      {
        Update: {
          TableName,
          Key: productKey(empresaId, product.productId),
          UpdateExpression: 'SET stock = :newStock, updatedAt = :now',
          ConditionExpression: 'stock = :previousStock',
          ExpressionAttributeValues: { ':newStock': newStock, ':previousStock': product.stock, ':now': now },
        },
      },
      {
        Put: {
          TableName,
          Item: buildStockMovementItem(empresaId, auth, {
            productId: product.productId,
            productName: product.name,
            type: 'IN',
            previousStock: product.stock,
            newStock,
            reason: `Cancelamento da venda #${sale.number}: ${reason}`,
            saleId,
          }),
        },
      },
    );
  });

  try {
    await dynamo.send(new TransactWriteCommand({ TransactItems: transactItems }));
  } catch (error) {
    const index = failedTransactionIndex(error);
    if (index === 0) throw new HttpError(409, `A venda #${sale.number} mudou (já cancelada ou pedido decidido). Atualize a página.`);
    if (index >= firstProductIndex) throw new HttpError(409, 'O estoque mudou durante o cancelamento. Tente de novo.');
    throw error;
  }

  return jsonResponse(200, { saleId, status: 'CANCELED' });
});
