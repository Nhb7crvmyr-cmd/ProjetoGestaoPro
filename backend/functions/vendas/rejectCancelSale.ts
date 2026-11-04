// Lambda POST /vendas/{saleId}/recusar-cancelamento: o DONO recusa o pedido do vendedor e devolve a venda
// com uma orientação (ex.: "ofereça 10% de desconto"). A venda volta a "Concluída" e o estoque não muda.

import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import * as z from 'zod/mini';
import { requiredText } from '../../shared/addressSchema';
import { getAuthContext, requireEmpresaId, requireGroup } from '../../shared/auth';
import { dynamo, getTableName } from '../../shared/dynamo';
import { HttpError } from '../../shared/errors';
import { jsonResponse, withErrorHandling } from '../../shared/http';
import { cancelRequestKey, saleKey } from '../../shared/keys';
import { failedTransactionIndex, getSaleOrThrow, saleIdPathSchema, type Sale } from '../../shared/sale';
import { parseJsonBody, validate } from '../../shared/validation';

const bodySchema = z.object({ note: requiredText('Orientação para o vendedor', 300) });

/**
 * Handler: volta o status para COMPLETED, guarda a decisão e apaga o pedido pendente (transação).
 * @param event - requisição da HTTP API
 * @returns 200 com { sale }
 */
export const handler = withErrorHandling(async (event) => {
  const auth = getAuthContext(event);
  requireGroup(auth, 'Dono');
  const empresaId = requireEmpresaId(auth);
  const { saleId } = validate(saleIdPathSchema, event.pathParameters ?? {});
  const { note } = validate(bodySchema, parseJsonBody(event.body));

  const sale = await getSaleOrThrow(empresaId, saleId, auth);
  if (sale.status !== 'CANCEL_REQUESTED' || !sale.cancelRequest) throw new HttpError(400, 'Esta venda não tem pedido de cancelamento.');

  const lastCancelReview: NonNullable<Sale['lastCancelReview']> = {
    decision: 'REJECTED',
    note,
    reviewedByName: auth.name || auth.email,
    reviewedAt: new Date().toISOString(),
    requestReason: sale.cancelRequest.reason,
  };
  const TableName = getTableName();

  try {
    await dynamo.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Update: {
              TableName,
              Key: saleKey(empresaId, saleId),
              // REMOVE apaga o campo do pedido; SET guarda a decisão.
              UpdateExpression: 'SET #status = :completed, lastCancelReview = :review REMOVE cancelRequest',
              ConditionExpression: '#status = :requested',
              ExpressionAttributeNames: { '#status': 'status' },
              ExpressionAttributeValues: { ':completed': 'COMPLETED', ':requested': 'CANCEL_REQUESTED', ':review': lastCancelReview },
            },
          },
          { Delete: { TableName, Key: cancelRequestKey(empresaId, saleId) } },
        ],
      }),
    );
  } catch (error) {
    if (failedTransactionIndex(error) >= 0) throw new HttpError(409, 'O pedido já foi decidido. Atualize a página.');
    throw error;
  }

  const { cancelRequest: _request, ...rest } = sale;
  return jsonResponse(200, { sale: { ...rest, status: 'COMPLETED', lastCancelReview } });
});
