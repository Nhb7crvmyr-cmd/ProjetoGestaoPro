// Lambda GET /admin/empresas: lista todas as empresas da plataforma (somente SuperAdmin).

import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { getAuthContext, requireGroup } from '../../shared/auth';
import { dynamo, getTableName } from '../../shared/dynamo';
import { jsonResponse, withErrorHandling } from '../../shared/http';
import { COMPANIES_INDEX_PK } from '../../shared/keys';

/**
 * Handler: lê a partição "COMPANIES" com Query. Query busca só uma partição (barato), ao contrário
 * do Scan, que lê a tabela INTEIRA e gastaria capacidade à toa.
 * @param event - requisição da HTTP API
 * @returns 200 com { companies }
 */
export const handler = withErrorHandling(async (event) => {
  requireGroup(getAuthContext(event), 'SuperAdmin');

  const companies: Record<string, unknown>[] = [];
  // O DynamoDB devolve no máximo 1 MB por vez: repetimos com "ExclusiveStartKey" até acabar.
  let startKey: Record<string, unknown> | undefined;
  do {
    const page = await dynamo.send(
      new QueryCommand({
        TableName: getTableName(),
        KeyConditionExpression: 'pk = :pk',
        ExpressionAttributeValues: { ':pk': COMPANIES_INDEX_PK },
        ExclusiveStartKey: startKey,
      }),
    );
    for (const { pk: _pk, sk: _sk, ...company } of page.Items ?? []) companies.push(company);
    startKey = page.LastEvaluatedKey;
  } while (startKey);

  // Mais recentes primeiro.
  companies.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return jsonResponse(200, { companies });
});
