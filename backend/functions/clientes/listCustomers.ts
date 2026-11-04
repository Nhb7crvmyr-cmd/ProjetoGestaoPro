// Lambda GET /clientes: o Dono vê todos os clientes da empresa; o Funcionario, só os que ele atende.

import { QueryCommand, type QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import { getAuthContext, requireEmpresaId, requireGroup } from '../../shared/auth';
import type { Customer } from '../../shared/customer';
import { dynamo, getTableName } from '../../shared/dynamo';
import { jsonResponse, withErrorHandling } from '../../shared/http';
import { CUSTOMER_SK_PREFIX } from '../../shared/keys';

/**
 * Handler: Query em "CUSTOMER#" da empresa. Para o Funcionario, um filtro deixa só os clientes dele.
 * O filtro é aplicado PELO BACKEND, com o id que vem do token: o funcionário não consegue "pedir" os de outro.
 * @param event - requisição da HTTP API
 * @returns 200 com { customers } (ordem alfabética)
 */
export const handler = withErrorHandling(async (event) => {
  const auth = getAuthContext(event);
  requireGroup(auth, 'Dono', 'Funcionario');
  const empresaId = requireEmpresaId(auth);
  const isOwner = auth.groups.includes('Dono');

  const baseQuery: QueryCommandInput = {
    TableName: getTableName(),
    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
    ExpressionAttributeValues: { ':pk': `EMPRESA#${empresaId}`, ':prefix': CUSTOMER_SK_PREFIX },
  };
  if (!isOwner) {
    baseQuery.FilterExpression = 'sellerId = :sellerId';
    baseQuery.ExpressionAttributeValues = { ...baseQuery.ExpressionAttributeValues, ':sellerId': auth.userId };
  }

  const customers: Customer[] = [];
  let startKey: Record<string, unknown> | undefined;
  do {
    const page = await dynamo.send(new QueryCommand({ ...baseQuery, ExclusiveStartKey: startKey }));
    for (const { pk: _pk, sk: _sk, ...item } of page.Items ?? []) customers.push(item as Customer);
    startKey = page.LastEvaluatedKey;
  } while (startKey);

  customers.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  return jsonResponse(200, { customers });
});
