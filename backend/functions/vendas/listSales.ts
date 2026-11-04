// Lambda GET /vendas?from=...&to=...: vendas de um período. Dono vê todas; Funcionario, só as que ele fez.

import { QueryCommand, type QueryCommandInput } from '@aws-sdk/lib-dynamodb';
import * as z from 'zod/mini';
import { getAuthContext, requireEmpresaId, requireGroup } from '../../shared/auth';
import { dynamo, getTableName } from '../../shared/dynamo';
import { HttpError } from '../../shared/errors';
import { jsonResponse, withErrorHandling } from '../../shared/http';
import { CANCEL_REQUEST_SK_PREFIX, SALE_SK_PREFIX } from '../../shared/keys';
import type { Sale } from '../../shared/sale';
import { validate } from '../../shared/validation';

/** Data e hora em ISO, como o navegador gera com toISOString() (ex.: 2026-10-01T03:00:00.000Z). */
const isoDateTime = z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/, 'Data inválida.'));

const querySchema = z.object({ from: isoDateTime, to: isoDateTime });

/** Período máximo de uma consulta: 1 ano (protege a capacidade de leitura da tabela). */
const MAX_RANGE_MS = 366 * 24 * 60 * 60 * 1000;

/**
 * Converte a data ISO no mesmo formato do começo do saleId (2026-10-16T18:30:00.000Z → 20261016T183000000Z).
 * @param iso - data ISO
 * @returns a data "compacta"
 */
function compact(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:.]/g, '');
}

/**
 * Handler: Query com "sk BETWEEN" (as vendas do período, já em ordem de data, sem varrer a tabela).
 * O site manda o início e o fim do período no fuso horário do usuário (convertidos para UTC).
 * @param event - requisição da HTTP API
 * @returns 200 com { sales } (mais recentes primeiro) e, para o Dono, { pendingCancellations } de qualquer período
 */
export const handler = withErrorHandling(async (event) => {
  const auth = getAuthContext(event);
  requireGroup(auth, 'Dono', 'Funcionario');
  const empresaId = requireEmpresaId(auth);
  const { from, to } = validate(querySchema, event.queryStringParameters ?? {});

  const range = new Date(to).getTime() - new Date(from).getTime();
  if (range < 0) throw new HttpError(400, 'A data final é anterior à inicial.');
  if (range > MAX_RANGE_MS) throw new HttpError(400, 'Escolha um período de até 1 ano.');

  const query: QueryCommandInput = {
    TableName: getTableName(),
    KeyConditionExpression: 'pk = :pk AND sk BETWEEN :from AND :to',
    ExpressionAttributeValues: {
      ':pk': `EMPRESA#${empresaId}`,
      ':from': `${SALE_SK_PREFIX}${compact(from)}`,
      // "~" vem depois de todos os números e letras na ordem do DynamoDB: inclui as vendas do último milissegundo.
      ':to': `${SALE_SK_PREFIX}${compact(to)}~`,
    },
    // Mais recentes primeiro.
    ScanIndexForward: false,
  };
  if (!auth.groups.includes('Dono')) {
    // REGRA DO PROJETO: Funcionario só acessa registros com vendedorId = o id dele (do token).
    query.FilterExpression = 'sellerId = :sellerId';
    query.ExpressionAttributeValues = { ...query.ExpressionAttributeValues, ':sellerId': auth.userId };
  }

  const sales: Sale[] = [];
  let startKey: Record<string, unknown> | undefined;
  do {
    const page = await dynamo.send(new QueryCommand({ ...query, ExclusiveStartKey: startKey }));
    for (const { pk: _pk, sk: _sk, ...item } of page.Items ?? []) sales.push(item as Sale);
    startKey = page.LastEvaluatedKey;
  } while (startKey);

  // Para o Dono: pedidos de cancelamento esperando decisão (de qualquer mês, não só do período).
  let pendingCancellations: Sale[] = [];
  if (auth.groups.includes('Dono')) {
    const pending = await dynamo.send(
      new QueryCommand({
        TableName: getTableName(),
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
        ExpressionAttributeValues: { ':pk': `EMPRESA#${empresaId}`, ':prefix': CANCEL_REQUEST_SK_PREFIX },
      }),
    );
    pendingCancellations = (pending.Items ?? []).map((item) => item.sale as Sale);
  }

  return jsonResponse(200, { sales, pendingCancellations });
});
