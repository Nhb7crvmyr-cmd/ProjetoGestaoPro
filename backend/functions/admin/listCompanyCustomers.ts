// Lambda GET /admin/empresas/{empresaId}/clientes: o SuperAdmin vê os clientes de UMA empresa (dados completos,
// para dar suporte: regra do CLAUDE.md) e os atendentes possíveis para transferir atendimento.

import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { getAuthContext, requireGroup } from '../../shared/auth';
import { superAdminAttendant } from '../../shared/customerTransfer';
import { empresaIdPathSchema, getCompanyOwner } from '../../shared/companyOwner';
import type { Customer } from '../../shared/customer';
import { dynamo, getTableName } from '../../shared/dynamo';
import type { Employee } from '../../shared/employee';
import { jsonResponse, withErrorHandling } from '../../shared/http';
import { CUSTOMER_SK_PREFIX, EMPLOYEE_SK_PREFIX } from '../../shared/keys';
import { validate } from '../../shared/validation';

/**
 * Lê todos os itens de um tipo (prefixo da sk) na partição da empresa, com paginação.
 * @param empresaId - empresa
 * @param prefix - começo da sk (ex.: "CUSTOMER#")
 * @param fields - só estes campos são lidos (ProjectionExpression: menos dados trafegando)
 * @returns os itens
 */
async function queryByPrefix<T>(empresaId: string, prefix: string, fields: string[]): Promise<T[]> {
  const items: T[] = [];
  let startKey: Record<string, unknown> | undefined;
  do {
    const page = await dynamo.send(
      new QueryCommand({
        TableName: getTableName(),
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
        ExpressionAttributeValues: { ':pk': `EMPRESA#${empresaId}`, ':prefix': prefix },
        // "#f0", "#f1"... são apelidos dos campos (alguns nomes, como "name", são palavras reservadas do DynamoDB).
        ProjectionExpression: fields.map((_, index) => `#f${index}`).join(', '),
        ExpressionAttributeNames: Object.fromEntries(fields.map((field, index) => [`#f${index}`, field])),
        ExclusiveStartKey: startKey,
      }),
    );
    items.push(...((page.Items ?? []) as T[]));
    startKey = page.LastEvaluatedKey;
  } while (startKey);
  return items;
}

/**
 * Handler.
 * @param event - requisição da HTTP API
 * @returns 200 com { companyName, customers, attendants }
 */
export const handler = withErrorHandling(async (event) => {
  const auth = getAuthContext(event);
  requireGroup(auth, 'SuperAdmin');
  const { empresaId } = validate(empresaIdPathSchema, event.pathParameters ?? {});

  const { companyName, owner } = await getCompanyOwner(empresaId); // 404 se a empresa não existir
  const [customers, employees] = await Promise.all([
    queryByPrefix<Customer>(empresaId, CUSTOMER_SK_PREFIX, [
      'customerId',
      'name',
      'documentType',
      'document',
      'email',
      'phone',
      'address',
      'sellerId',
      'sellerName',
      'active',
      'lastTransfer',
    ]),
    queryByPrefix<Pick<Employee, 'userId' | 'name' | 'email' | 'enabled'>>(empresaId, EMPLOYEE_SK_PREFIX, ['userId', 'name', 'email', 'enabled']),
  ]);

  // Atendentes possíveis: o Dono + funcionários (com e-mail e ativo/bloqueado) + o próprio SuperAdmin (suporte).
  // O site usa esta lista para mostrar o e-mail do atendente de cada cliente e as opções de transferência.
  const attendants = [
    { id: owner.id, name: owner.name, email: owner.email, role: 'Dono', enabled: true },
    ...employees.map((employee) => ({
      id: employee.userId,
      name: employee.name,
      email: employee.email,
      role: 'Funcionario',
      enabled: employee.enabled,
    })),
    { ...superAdminAttendant(auth), role: 'SuperAdmin', enabled: true },
  ];

  customers.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  return jsonResponse(200, { companyName, customers, attendants });
});
