// Lambda POST /vendas: registra uma venda com baixa AUTOMÁTICA no estoque. Sem estoque, a venda é bloqueada.
// Dono vende para qualquer cliente da empresa; Funcionario, só para os clientes dele.

import { TransactWriteCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import * as z from 'zod/mini';
import { getAuthContext, requireEmpresaId, requireGroup } from '../../shared/auth';
import { getCustomerOrThrow } from '../../shared/customer';
import { dynamo, getTableName, type TransactItems } from '../../shared/dynamo';
import { HttpError } from '../../shared/errors';
import { jsonResponse, withErrorHandling } from '../../shared/http';
import { productKey, saleCounterKey, saleKey } from '../../shared/keys';
import { getProductOrThrow, type Product } from '../../shared/product';
import { failedTransactionIndex, generateSaleId, PAYMENT_METHODS, type Sale, type SaleItem } from '../../shared/sale';
import { buildStockMovementItem } from '../../shared/stock';
import { parseJsonBody, validate } from '../../shared/validation';

/**
 * Máximo de itens diferentes por venda. Cada item usa 2 gravações na transação (estoque + histórico)
 * e uma transação aceita até 100: 1 (venda) + 2 × 30 = 61, com folga.
 */
const MAX_ITEMS = 30;

/**
 * O navegador manda SÓ o produto e a quantidade. Preço, nome e estoque são lidos do banco:
 * assim ninguém consegue alterar o preço mexendo na página.
 */
const bodySchema = z.object({
  customerId: z.guid('Escolha o cliente.'),
  items: z
    .array(
      z.object({
        productId: z.guid('Produto inválido.'),
        quantity: z.number('Informe a quantidade.').check(z.int('Quantidade: use números inteiros.'), z.minimum(1, 'A quantidade mínima é 1.'), z.maximum(100_000, 'Quantidade muito alta.')),
      }),
    )
    .check(z.minLength(1, 'Adicione pelo menos um produto.'), z.maxLength(MAX_ITEMS, `No máximo ${MAX_ITEMS} produtos por venda.`)),
  discountCents: z.optional(z.number().check(z.int('Desconto inválido.'), z.minimum(0, 'O desconto não pode ser negativo.'))),
  paymentMethod: z.enum(PAYMENT_METHODS, 'Escolha a forma de pagamento.'),
  notes: z.optional(z.string().check(z.trim(), z.maxLength(300, 'Observações: no máximo 300 caracteres.'))),
});

/**
 * Junta itens repetidos (o mesmo produto adicionado 2 vezes vira 1 item com a soma).
 * @param items - itens enviados
 * @returns mapa productId → quantidade total
 */
function mergeItems(items: { productId: string; quantity: number }[]): Map<string, number> {
  const merged = new Map<string, number>();
  for (const item of items) merged.set(item.productId, (merged.get(item.productId) ?? 0) + item.quantity);
  return merged;
}

/**
 * Pega o próximo número de venda da empresa (#1, #2...). "ADD" no DynamoDB soma de forma atômica:
 * duas vendas ao mesmo tempo nunca recebem o mesmo número.
 * @param empresaId - empresa
 * @returns o número
 */
async function nextSaleNumber(empresaId: string): Promise<number> {
  const { Attributes } = await dynamo.send(
    new UpdateCommand({
      TableName: getTableName(),
      Key: saleCounterKey(empresaId),
      UpdateExpression: 'ADD lastNumber :one',
      ExpressionAttributeValues: { ':one': 1 },
      ReturnValues: 'UPDATED_NEW',
    }),
  );
  return Number(Attributes?.lastNumber);
}

/**
 * Handler.
 * Passos: 1) valida  2) confere cliente e produtos/estoque  3) calcula com os preços do banco
 *         4) grava venda + baixa de estoque + histórico em UMA transação (tudo ou nada).
 * @param event - requisição da HTTP API
 * @returns 201 com { sale }
 */
export const handler = withErrorHandling(async (event) => {
  const auth = getAuthContext(event);
  requireGroup(auth, 'Dono', 'Funcionario');
  const empresaId = requireEmpresaId(auth);
  const body = validate(bodySchema, parseJsonBody(event.body));

  // Cliente: 404 se não existir ou (para o Funcionario) se não for dele.
  const customer = await getCustomerOrThrow(empresaId, body.customerId, auth);
  if (!customer.active) throw new HttpError(400, `O cliente ${customer.name} está inativo.`);

  // Produtos: lê todos ao mesmo tempo e confere se estão ativos e com estoque.
  const quantities = mergeItems(body.items);
  const products: Product[] = await Promise.all([...quantities.keys()].map((productId) => getProductOrThrow(empresaId, productId)));
  for (const product of products) {
    const quantity = quantities.get(product.productId)!;
    if (!product.active) throw new HttpError(400, `O produto ${product.name} está inativo.`);
    // REGRA DO PROJETO: sem estoque, a venda é bloqueada.
    if (product.stock < quantity) {
      throw new HttpError(400, `Estoque insuficiente de ${product.name}: há só ${product.stock} ${product.unit}.`);
    }
  }

  // Valores calculados com os preços do BANCO.
  const items: SaleItem[] = products.map((product) => {
    const quantity = quantities.get(product.productId)!;
    return {
      productId: product.productId,
      productName: product.name,
      sku: product.sku,
      unit: product.unit,
      quantity,
      unitPriceCents: product.priceCents,
      totalCents: quantity * product.priceCents,
    };
  });
  const subtotalCents = items.reduce((sum, item) => sum + item.totalCents, 0);
  const discountCents = body.discountCents ?? 0;
  if (discountCents > subtotalCents) throw new HttpError(400, 'O desconto não pode ser maior que o valor da venda.');

  const now = new Date();
  const sale: Sale = {
    saleId: generateSaleId(now),
    number: await nextSaleNumber(empresaId),
    empresaId,
    customerId: customer.customerId,
    customerName: customer.name,
    sellerId: auth.userId, // SEMPRE do token
    sellerName: auth.name || auth.email,
    items,
    subtotalCents,
    discountCents,
    totalCents: subtotalCents - discountCents,
    paymentMethod: body.paymentMethod,
    notes: body.notes || undefined,
    status: 'COMPLETED',
    createdAt: now.toISOString(),
  };

  const TableName = getTableName();
  const transactItems: TransactItems = [
    { Put: { TableName, Item: { ...saleKey(empresaId, sale.saleId), ...sale }, ConditionExpression: 'attribute_not_exists(pk)' } },
  ];
  for (const product of products) {
    const quantity = quantities.get(product.productId)!;
    const newStock = product.stock - quantity;
    transactItems.push(
      {
        // Baixa no estoque, com "trava otimista": só grava se o estoque ainda for o que lemos.
        Update: {
          TableName,
          Key: productKey(empresaId, product.productId),
          UpdateExpression: 'SET stock = :newStock, updatedAt = :now',
          ConditionExpression: 'stock = :previousStock AND active = :true',
          ExpressionAttributeValues: { ':newStock': newStock, ':previousStock': product.stock, ':true': true, ':now': sale.createdAt },
        },
      },
      {
        Put: {
          TableName,
          Item: buildStockMovementItem(empresaId, auth, {
            productId: product.productId,
            productName: product.name,
            type: 'SALE',
            previousStock: product.stock,
            newStock,
            reason: `Venda #${sale.number} · ${customer.name}`,
            saleId: sale.saleId,
          }),
        },
      },
    );
  }

  try {
    await dynamo.send(new TransactWriteCommand({ TransactItems: transactItems }));
  } catch (error) {
    const index = failedTransactionIndex(error);
    if (index >= 1) {
      // Posições 1, 3, 5... são as baixas de estoque: (index - 1) / 2 diz qual produto.
      const product = products[Math.floor((index - 1) / 2)];
      throw new HttpError(409, `O estoque de ${product?.name ?? 'um produto'} mudou durante a venda. Confira e tente de novo.`);
    }
    throw error;
  }

  return jsonResponse(201, { sale });
});
