// Lambda POST /vendas/{saleId}/solicitar-cancelamento: o FUNCIONÁRIO pede o cancelamento de uma venda dele.
// A venda não some: fica "Aguardando cancelamento" até o Dono aprovar ou recusar. O estoque não muda ainda.

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

const bodySchema = z.object({ reason: requiredText('Motivo', 200) });

/**
 * Handler: muda o status para CANCEL_REQUESTED e cria o "pedido pendente" (para o Dono achar),
 * em UMA transação.
 * @param event - requisição da HTTP API
 * @returns 200 com { sale }
 */
export const handler = withErrorHandling(async (event) => {
  const auth = getAuthContext(event);
  // O Dono não precisa pedir: ele cancela direto. Esta rota é do vendedor.
  requireGroup(auth, 'Funcionario');
  const empresaId = requireEmpresaId(auth);
  const { saleId } = validate(saleIdPathSchema, event.pathParameters ?? {});
  const { reason } = validate(bodySchema, parseJsonBody(event.body));

  // 404 se a venda não for dele (regra: Funcionario só acessa as próprias vendas).
  const sale = await getSaleOrThrow(empresaId, saleId, auth);
  if (sale.status === 'CANCEL_REQUESTED') throw new HttpError(400, 'Já existe um pedido de cancelamento para esta venda.');
  if (sale.status === 'CANCELED') throw new HttpError(400, 'Esta venda já está cancelada.');

  const cancelRequest = { reason, requestedBy: auth.userId, requestedByName: auth.name || auth.email, requestedAt: new Date().toISOString() };
  const updated: Sale = { ...sale, status: 'CANCEL_REQUESTED', cancelRequest };
  const TableName = getTableName();

  try {
    await dynamo.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Update: {
              TableName,
              Key: saleKey(empresaId, saleId),
              UpdateExpression: 'SET #status = :requested, cancelRequest = :request',
              ConditionExpression: '#status = :completed',
              ExpressionAttributeNames: { '#status': 'status' },
              ExpressionAttributeValues: { ':requested': 'CANCEL_REQUESTED', ':completed': 'COMPLETED', ':request': cancelRequest },
            },
          },
          {
            // "Pedido pendente": uma cópia da venda numa sk própria. O Dono lista todos os pendentes
            // com um Query, mesmo que a venda seja de outro mês.
            Put: { TableName, Item: { ...cancelRequestKey(empresaId, saleId), sale: updated }, ConditionExpression: 'attribute_not_exists(pk)' },
          },
        ],
      }),
    );
  } catch (error) {
    if (failedTransactionIndex(error) >= 0) throw new HttpError(409, 'A venda mudou enquanto você pedia o cancelamento. Atualize a página.');
    throw error;
  }

  return jsonResponse(200, { sale: updated });
});
