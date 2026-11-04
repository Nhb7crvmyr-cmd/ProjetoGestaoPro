// Lambda POST /clientes: Dono ou Funcionario cadastra um cliente. Quem cadastra vira o responsável (sellerId).

import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import { getAuthContext, requireEmpresaId, requireGroup } from '../../shared/auth';
import type { Customer } from '../../shared/customer';
import { customerFieldsSchema, normalizeCustomerExtras } from '../../shared/customerSchema';
import { dynamo, getTableName, type TransactItems } from '../../shared/dynamo';
import { HttpError } from '../../shared/errors';
import { jsonResponse, withErrorHandling } from '../../shared/http';
import { customerDocLockKey, customerKey } from '../../shared/keys';
import { parseJsonBody, validate } from '../../shared/validation';

/**
 * Handler: grava o cliente e, se tiver documento, a trava do documento, em uma transação.
 * @param event - requisição da HTTP API
 * @returns 201 com { customer }
 */
export const handler = withErrorHandling(async (event) => {
  const auth = getAuthContext(event);
  requireGroup(auth, 'Dono', 'Funcionario');
  const empresaId = requireEmpresaId(auth);
  const body = validate(customerFieldsSchema, parseJsonBody(event.body));
  const extras = normalizeCustomerExtras(body);

  const now = new Date().toISOString();
  const customer: Customer = {
    customerId: crypto.randomUUID(),
    empresaId,
    name: body.name,
    ...extras,
    email: body.email || undefined,
    phone: body.phone,
    notes: body.notes || undefined,
    address: body.address,
    // SEGURANÇA: o responsável vem do TOKEN. O site não consegue cadastrar cliente "em nome" de outro.
    sellerId: auth.userId,
    sellerName: auth.name || auth.email,
    active: true,
    createdAt: now,
    updatedAt: now,
  };
  const TableName = getTableName();

  const items: TransactItems = [
    { Put: { TableName, Item: { ...customerKey(empresaId, customer.customerId), ...customer }, ConditionExpression: 'attribute_not_exists(pk)' } },
  ];
  if (customer.document) {
    items.push({
      Put: {
        TableName,
        Item: { ...customerDocLockKey(empresaId, customer.document), customerId: customer.customerId },
        ConditionExpression: 'attribute_not_exists(pk)',
      },
    });
  }

  try {
    await dynamo.send(new TransactWriteCommand({ TransactItems: items }));
  } catch (error) {
    const reasons = (error as { CancellationReasons?: { Code?: string }[] }).CancellationReasons;
    if (reasons?.[1]?.Code === 'ConditionalCheckFailed') {
      throw new HttpError(409, `Já existe um cliente com este ${customer.documentType}.`);
    }
    throw error;
  }

  return jsonResponse(201, { customer });
});
