// Lambda POST /produtos: o Dono cadastra um produto (com estoque inicial opcional, que entra no histórico).

import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { getAuthContext, requireEmpresaId, requireGroup } from '../../shared/auth';
import { dynamo, getTableName, type TransactItems } from '../../shared/dynamo';
import { HttpError } from '../../shared/errors';
import { jsonResponse, withErrorHandling } from '../../shared/http';
import { productKey, skuLockKey } from '../../shared/keys';
import type { Product } from '../../shared/product';
import { createProductSchema, normalizeSku } from '../../shared/productSchema';
import { buildStockMovementItem } from '../../shared/stock';
import { parseJsonBody, validate } from '../../shared/validation';

/**
 * Handler: grava produto + trava do SKU + movimento inicial em UMA transação.
 * @param event - requisição da HTTP API
 * @returns 201 com { product }
 */
export const handler = withErrorHandling(async (event) => {
  const auth = getAuthContext(event);
  requireGroup(auth, 'Dono'); // só o Dono cadastra produtos
  const empresaId = requireEmpresaId(auth);
  const body = validate(createProductSchema, parseJsonBody(event.body));

  const now = new Date().toISOString();
  const initialStock = body.initialStock ?? 0;
  const product: Product = {
    productId: crypto.randomUUID(),
    empresaId,
    name: body.name,
    sku: normalizeSku(body.sku),
    category: body.category || undefined,
    unit: body.unit,
    priceCents: body.priceCents,
    costCents: body.costCents,
    stock: initialStock,
    minStock: body.minStock,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
  const TableName = getTableName();

  // Lista de gravações da transação: começa com o produto e vai ganhando itens conforme o caso.
  const items: TransactItems = [
    { Put: { TableName, Item: { ...productKey(empresaId, product.productId), ...product }, ConditionExpression: 'attribute_not_exists(pk)' } },
  ];
  if (product.sku) {
    items.push({
      Put: {
        TableName,
        Item: { ...skuLockKey(empresaId, product.sku), productId: product.productId },
        // Se já existir esse SKU na empresa, a transação inteira é cancelada.
        ConditionExpression: 'attribute_not_exists(pk)',
      },
    });
  }
  if (initialStock > 0) {
    items.push({
      Put: {
        TableName,
        Item: buildStockMovementItem(empresaId, auth, {
          productId: product.productId,
          productName: product.name,
          type: 'IN',
          previousStock: 0,
          newStock: initialStock,
          reason: 'Estoque inicial',
        }),
      },
    });
  }

  try {
    await dynamo.send(new TransactWriteCommand({ TransactItems: items }));
  } catch (error) {
    const reasons = (error as { CancellationReasons?: { Code?: string }[] }).CancellationReasons;
    if (product.sku && reasons?.[1]?.Code === 'ConditionalCheckFailed') {
      throw new HttpError(409, `Já existe um produto com o SKU ${product.sku}.`);
    }
    throw error;
  }

  return jsonResponse(201, { product });
});
