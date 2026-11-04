// Lambda GET /produtos: lista os produtos da empresa (Dono vê tudo; Funcionario não vê o custo).

import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { getAuthContext, requireEmpresaId, requireGroup } from '../../shared/auth';
import { dynamo, getTableName } from '../../shared/dynamo';
import { jsonResponse, withErrorHandling } from '../../shared/http';
import { PRODUCT_SK_PREFIX } from '../../shared/keys';
import { toProductResponse, type Product } from '../../shared/product';

/**
 * Handler: Query na partição da empresa, só os registros "PRODUCT#", com paginação.
 * @param event - requisição da HTTP API
 * @returns 200 com { products } (ordem alfabética)
 */
export const handler = withErrorHandling(async (event) => {
  const auth = getAuthContext(event);
  requireGroup(auth, 'Dono', 'Funcionario');
  const empresaId = requireEmpresaId(auth);

  const products: Product[] = [];
  let startKey: Record<string, unknown> | undefined;
  do {
    const page = await dynamo.send(
      new QueryCommand({
        TableName: getTableName(),
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
        ExpressionAttributeValues: { ':pk': `EMPRESA#${empresaId}`, ':prefix': PRODUCT_SK_PREFIX },
        ExclusiveStartKey: startKey,
      }),
    );
    for (const { pk: _pk, sk: _sk, ...item } of page.Items ?? []) products.push(item as Product);
    startKey = page.LastEvaluatedKey;
  } while (startKey);

  products.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  return jsonResponse(200, { products: products.map((product) => toProductResponse(product, auth)) });
});
