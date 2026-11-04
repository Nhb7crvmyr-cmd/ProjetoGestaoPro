// Lambda PUT /clientes/{customerId}: edita um cliente. O Dono edita qualquer um; o Funcionario, só os dele.

import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { getAuthContext, requireEmpresaId, requireGroup } from '../../shared/auth';
import { getCustomerOrThrow, type Customer } from '../../shared/customer';
import { customerIdPathSchema, normalizeCustomerExtras, updateCustomerSchema } from '../../shared/customerSchema';
import { dynamo, getTableName, type TransactItems } from '../../shared/dynamo';
import { HttpError } from '../../shared/errors';
import { jsonResponse, withErrorHandling } from '../../shared/http';
import { customerDocLockKey, customerKey } from '../../shared/keys';
import { parseJsonBody, validate } from '../../shared/validation';

/**
 * Handler: atualiza o cliente e, se o documento mudou, troca a trava do documento (transação).
 * O responsável (sellerId) e a data de cadastro NÃO mudam aqui.
 * @param event - requisição da HTTP API
 * @returns 200 com { customer }
 */
export const handler = withErrorHandling(async (event) => {
  const auth = getAuthContext(event);
  requireGroup(auth, 'Dono', 'Funcionario');
  const empresaId = requireEmpresaId(auth);
  const { customerId } = validate(customerIdPathSchema, event.pathParameters ?? {});
  const body = validate(updateCustomerSchema, parseJsonBody(event.body));
  const extras = normalizeCustomerExtras(body);

  // 404 se não existir, se for de outra empresa ou (para o Funcionario) se for cliente de outro.
  const current = await getCustomerOrThrow(empresaId, customerId, auth);

  const updated: Customer = {
    ...current,
    name: body.name,
    documentType: extras.documentType,
    document: extras.document,
    birthDate: extras.birthDate,
    email: body.email || undefined,
    phone: body.phone,
    notes: body.notes || undefined,
    address: body.address,
    active: body.active,
    updatedAt: new Date().toISOString(),
  };
  const TableName = getTableName();

  const items: TransactItems = [
    {
      Put: {
        TableName,
        Item: { ...customerKey(empresaId, customerId), ...updated },
        // Garante que ninguém trocou o responsável entre a leitura e a gravação.
        ConditionExpression: 'attribute_exists(pk) AND sellerId = :sellerId',
        ExpressionAttributeValues: { ':sellerId': current.sellerId },
      },
    },
  ];
  const documentChanged = current.document !== updated.document;
  if (documentChanged && current.document) {
    items.push({
      Delete: {
        TableName,
        Key: customerDocLockKey(empresaId, current.document),
        ConditionExpression: 'customerId = :customerId',
        ExpressionAttributeValues: { ':customerId': customerId },
      },
    });
  }
  if (documentChanged && updated.document) {
    items.push({
      Put: { TableName, Item: { ...customerDocLockKey(empresaId, updated.document), customerId }, ConditionExpression: 'attribute_not_exists(pk)' },
    });
  }

  try {
    await dynamo.send(new TransactWriteCommand({ TransactItems: items }));
  } catch (error) {
    const reasons = (error as { CancellationReasons?: { Code?: string }[] }).CancellationReasons;
    if (reasons?.[0]?.Code === 'ConditionalCheckFailed') throw new HttpError(409, 'O cliente foi alterado por outra operação. Tente novamente.');
    if (updated.document && reasons?.[reasons.length - 1]?.Code === 'ConditionalCheckFailed') {
      throw new HttpError(409, `Já existe um cliente com este ${updated.documentType}.`);
    }
    throw error;
  }

  return jsonResponse(200, { customer: updated });
});
