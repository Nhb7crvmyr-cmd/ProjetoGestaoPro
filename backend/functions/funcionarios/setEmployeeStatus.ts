// Lambda POST /funcionarios/{userId}/status: o Dono bloqueia ou libera o acesso de um funcionário DA SUA empresa.

import {
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminUserGlobalSignOutCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { getAuthContext, requireEmpresaId, requireGroup } from '../../shared/auth';
import { cognitoClient, getUserPoolId } from '../../shared/cognito';
import { getCompanyById } from '../../shared/company';
import { dynamo, getTableName } from '../../shared/dynamo';
import { getEmployeeOrThrow } from '../../shared/employee';
import { HttpError } from '../../shared/errors';
import { jsonResponse, withErrorHandling } from '../../shared/http';
import { employeeKey } from '../../shared/keys';
import { getPlanAccess, requireEmployeeSlot } from '../../shared/planAccess';
import { enabledBodySchema, userIdPathSchema } from '../../shared/userIdSchema';
import { parseJsonBody, validate } from '../../shared/validation';

/**
 * Handler: confere que o funcionário é da empresa do Dono, muda no Cognito e no registro.
 * @param event - requisição da HTTP API
 * @returns 200 com { userId, enabled }
 */
export const handler = withErrorHandling(async (event) => {
  const auth = getAuthContext(event);
  requireGroup(auth, 'Dono');
  const empresaId = requireEmpresaId(auth);
  const { userId } = validate(userIdPathSchema, event.pathParameters ?? {});
  const { enabled } = validate(enabledBodySchema, parseJsonBody(event.body));

  // SEGURANÇA: se o funcionário não estiver na empresa do Dono, para aqui com 404.
  const employee = await getEmployeeOrThrow(empresaId, userId);

  // LIMITE DO PLANO: liberar um funcionário bloqueado faz ele voltar a ocupar uma vaga.
  if (enabled && !employee.enabled) {
    const company = await getCompanyById(empresaId);
    if (!company) throw new HttpError(404, 'Empresa não encontrada.');
    await requireEmployeeSlot(getPlanAccess(company), empresaId);
  }

  const userPoolId = getUserPoolId();
  if (enabled) {
    await cognitoClient.send(new AdminEnableUserCommand({ UserPoolId: userPoolId, Username: userId }));
  } else {
    // Encerra as sessões (o refresh token deixa de valer) e depois desativa a conta.
    await cognitoClient.send(new AdminUserGlobalSignOutCommand({ UserPoolId: userPoolId, Username: userId }));
    await cognitoClient.send(new AdminDisableUserCommand({ UserPoolId: userPoolId, Username: userId }));
  }

  await dynamo.send(
    new UpdateCommand({
      TableName: getTableName(),
      Key: employeeKey(empresaId, userId),
      UpdateExpression: 'SET enabled = :enabled',
      ExpressionAttributeValues: { ':enabled': enabled },
    }),
  );

  return jsonResponse(200, { userId, enabled });
});
