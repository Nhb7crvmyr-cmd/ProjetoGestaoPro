// Lambda GET /funcionarios: lista os funcionários da empresa do Dono, com a situação de cada um no Cognito.

import { AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { getAuthContext, requireEmpresaId, requireGroup } from '../../shared/auth';
import { cognitoClient, getUserPoolId } from '../../shared/cognito';
import { dynamo, getTableName } from '../../shared/dynamo';
import type { Employee } from '../../shared/employee';
import { jsonResponse, withErrorHandling } from '../../shared/http';
import { EMPLOYEE_SK_PREFIX } from '../../shared/keys';

/**
 * Busca a situação do usuário no Cognito.
 * FORCE_CHANGE_PASSWORD = ainda não fez o primeiro acesso; CONFIRMED = já criou a própria senha.
 * @param userPoolId - ID do User Pool
 * @param userId - id do funcionário
 * @returns a situação e se está ativo
 */
async function getCognitoStatus(userPoolId: string, userId: string): Promise<{ status: string; enabled: boolean }> {
  try {
    const user = await cognitoClient.send(new AdminGetUserCommand({ UserPoolId: userPoolId, Username: userId }));
    return { status: user.UserStatus ?? 'UNKNOWN', enabled: user.Enabled ?? false };
  } catch (error) {
    if (error instanceof Error && error.name === 'UserNotFoundException') return { status: 'REMOVED', enabled: false };
    throw error;
  }
}

/**
 * Handler: Query na partição da empresa (só registros "EMPLOYEE#") + situação no Cognito.
 * @param event - requisição da HTTP API
 * @returns 200 com { employees }
 */
export const handler = withErrorHandling(async (event) => {
  const auth = getAuthContext(event);
  requireGroup(auth, 'Dono');
  const empresaId = requireEmpresaId(auth);

  const { Items } = await dynamo.send(
    new QueryCommand({
      TableName: getTableName(),
      // begins_with: só as sk que COMEÇAM com "EMPLOYEE#" (ignora o PROFILE e outros registros da empresa).
      KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
      ExpressionAttributeValues: { ':pk': `EMPRESA#${empresaId}`, ':prefix': EMPLOYEE_SK_PREFIX },
    }),
  );
  const employees = (Items ?? []).map(({ pk: _pk, sk: _sk, ...item }) => item as Employee);

  // Uma consulta ao Cognito por funcionário, todas ao mesmo tempo (Promise.all).
  // Com poucos funcionários por empresa, isso é rápido e barato.
  const userPoolId = getUserPoolId();
  const withStatus = await Promise.all(
    employees.map(async (employee) => ({ ...employee, ...(await getCognitoStatus(userPoolId, employee.userId)) })),
  );

  withStatus.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  return jsonResponse(200, { employees: withStatus });
});
