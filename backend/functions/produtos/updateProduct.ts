// Lambda PUT /produtos/{productId}: o Dono edita os dados do produto (o estoque NÃO muda por aqui).

import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { getAuthContext, requireEmpresaId, requireGroup } from '../../shared/auth';
import { dynamo, getTableName, type TransactItems } from '../../shared/dynamo';
import { HttpError } from '../../shared/errors';
import { jsonResponse, withErrorHandling } from '../../shared/http';
import { productKey, skuLockKey } from '../../shared/keys';
import { getProductOrThrow, type Product } from '../../shared/product';
import { normalizeSku, productIdPathSchema, updateProductSchema } from '../../shared/productSchema';
import { parseJsonBody, validate } from '../../shared/validation';

/**
 * Handler: atualiza o produto e, se o SKU mudou, troca a "trava" do SKU, tudo em uma transação.
 * @param event - requisição da HTTP API
 * @returns 200 com { product }
 */
export const handler = withErrorHandling(async (event) => {
  const auth = getAuthContext(event);
  requireGroup(auth, 'Dono');
  const empresaId = requireEmpresaId(auth);
  const { productId } = validate(productIdPathSchema, event.pathParameters ?? {});
  const body = validate(updateProductSchema, parseJsonBody(event.body));

  const current = await getProductOrThrow(empresaId, productId); // 404 se for de outra empresa
  const newSku = normalizeSku(body.sku);
  const updated: Product = {
    ...current,
    name: body.name,
    sku: newSku,
    category: body.category || undefined,
    unit: body.unit,
    priceCents: body.priceCents,
    costCents: body.costCents,
    minStock: body.minStock,
    active: body.active,
    updatedAt: new Date().toISOString(),
  };
  const TableName = getTableName();

  const items: TransactItems = [
    {
      // Put substitui o item inteiro. A condição "stock = :stock" garante que ninguém
      // mexeu no estoque entre a nossa leitura e esta gravação (senão perderíamos o movimento).
      Put: {
        TableName,
        Item: { ...productKey(empresaId, productId), ...updated },
        ConditionExpression: 'attribute_exists(pk) AND stock = :stock',
        ExpressionAttributeValues: { ':stock': current.stock },
      },
    },
  ];

  const skuChanged = current.sku !== newSku;
  if (skuChanged && current.sku) {
    // Libera o SKU antigo (só se a trava for mesmo deste produto).
    items.push({
      Delete: {
        TableName,
        Key: skuLockKey(empresaId, current.sku),
        ConditionExpression: 'productId = :productId',
        ExpressionAttributeValues: { ':productId': productId },
      },
    });
  }
  if (skuChanged && newSku) {
    items.push({
      Put: { TableName, Item: { ...skuLockKey(empresaId, newSku), productId }, ConditionExpression: 'attribute_not_exists(pk)' },
    });
  }

  try {
    await dynamo.send(new TransactWriteCommand({ TransactItems: items }));
  } catch (error) {
    const reasons = (error as { CancellationReasons?: { Code?: string }[] }).CancellationReasons;
    if (reasons?.[0]?.Code === 'ConditionalCheckFailed') {
      throw new HttpError(409, 'O produto foi alterado ao mesmo tempo por outra operação. Tente novamente.');
    }
    if (reasons?.[reasons.length - 1]?.Code === 'ConditionalCheckFailed' && newSku) {
      throw new HttpError(409, `Já existe um produto com o SKU ${newSku}.`);
    }
    throw error;
  }

  return jsonResponse(200, { product: updated });
});
