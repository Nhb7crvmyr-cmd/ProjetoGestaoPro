// Lambda GET /estoque/movimentos: histórico de estoque da empresa, do mais novo para o mais velho (somente Dono).
// Filtro opcional por produto: /estoque/movimentos?productId=<id>

import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import * as z from 'zod/mini';
import { getAuthContext, requireEmpresaId, requireGroup } from '../../shared/auth';
import { dynamo, getTableName } from '../../shared/dynamo';
import { jsonResponse, withErrorHandling } from '../../shared/http';
import { STOCK_MOVEMENT_SK_PREFIX } from '../../shared/keys';
import type { StockMovement } from '../../shared/stock';
import { validate } from '../../shared/validation';

/** Quantos movimentos devolver no máximo. */
const MAX_RESULTS = 100;
/** Quantas "páginas" do DynamoDB ler no máximo (protege a capacidade de leitura da tabela). */
const MAX_PAGES = 5;

const querySchema = z.object({
  productId: z.optional(z.guid('Produto inválido.')),
});

/**
 * Handler: Query em "STOCKMOV#" de trás para frente (mais novos primeiro).
 * Com filtro de produto, o DynamoDB lê os movimentos e descarta os de outros produtos
 * (FilterExpression). Por isso limitamos as páginas lidas: com muitos dados, o ideal seria um índice próprio.
 * @param event - requisição da HTTP API
 * @returns 200 com { movements }
 */
export const handler = withErrorHandling(async (event) => {
  const auth = getAuthContext(event);
  requireGroup(auth, 'Dono');
  const empresaId = requireEmpresaId(auth);
  const { productId } = validate(querySchema, event.queryStringParameters ?? {});

  const movements: StockMovement[] = [];
  let startKey: Record<string, unknown> | undefined;
  let pages = 0;
  do {
    const page = await dynamo.send(
      new QueryCommand({
        TableName: getTableName(),
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
        // false = ordem DECRESCENTE da sk (como a sk começa com a data, os mais novos vêm primeiro).
        ScanIndexForward: false,
        ...(productId
          ? { FilterExpression: 'productId = :productId', ExpressionAttributeValues: { ':pk': `EMPRESA#${empresaId}`, ':prefix': STOCK_MOVEMENT_SK_PREFIX, ':productId': productId } }
          : { ExpressionAttributeValues: { ':pk': `EMPRESA#${empresaId}`, ':prefix': STOCK_MOVEMENT_SK_PREFIX } }),
        Limit: MAX_RESULTS,
        ExclusiveStartKey: startKey,
      }),
    );
    for (const { pk: _pk, sk: _sk, ...item } of page.Items ?? []) movements.push(item as StockMovement);
    startKey = page.LastEvaluatedKey;
    pages++;
  } while (startKey && movements.length < MAX_RESULTS && pages < MAX_PAGES);

  return jsonResponse(200, { movements: movements.slice(0, MAX_RESULTS) });
});
