// Lambda POST /admin/users/{userId}/status: bloqueia ou libera o acesso de um usuário (somente SuperAdmin).

import {
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminListGroupsForUserCommand,
  AdminUserGlobalSignOutCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { getAuthContext, requireGroup } from '../../shared/auth';
import { cognitoClient, getUserPoolId } from '../../shared/cognito';
import { HttpError } from '../../shared/errors';
import { jsonResponse, withErrorHandling } from '../../shared/http';
import { enabledBodySchema, userIdPathSchema } from '../../shared/userIdSchema';
import { parseJsonBody, validate } from '../../shared/validation';

/**
 * Confere se o usuário-alvo é SuperAdmin (um SuperAdmin não pode bloquear outro por esta tela).
 * @param userPoolId - ID do User Pool
 * @param userId - id do usuário-alvo
 * @returns true se o alvo for SuperAdmin
 */
async function isSuperAdmin(userPoolId: string, userId: string): Promise<boolean> {
  const { Groups } = await cognitoClient.send(
    new AdminListGroupsForUserCommand({ UserPoolId: userPoolId, Username: userId }),
  );
  return (Groups ?? []).some((group) => group.GroupName === 'SuperAdmin');
}

/**
 * Handler: valida a entrada, aplica as regras e bloqueia/libera no Cognito.
 * @param event - requisição da HTTP API
 * @returns 200 com { userId, enabled }
 */
export const handler = withErrorHandling(async (event) => {
  const auth = getAuthContext(event);
  requireGroup(auth, 'SuperAdmin');

  const { userId } = validate(userIdPathSchema, event.pathParameters ?? {});
  const { enabled } = validate(enabledBodySchema, parseJsonBody(event.body));
  const userPoolId = getUserPoolId();

  // Regras de negócio:
  if (userId === auth.userId) {
    throw new HttpError(400, 'Você não pode alterar o seu próprio acesso.');
  }

  try {
    if (await isSuperAdmin(userPoolId, userId)) {
      throw new HttpError(400, 'Não é possível bloquear outro SuperAdmin.');
    }

    if (enabled) {
      await cognitoClient.send(new AdminEnableUserCommand({ UserPoolId: userPoolId, Username: userId }));
    } else {
      // 1º) Encerra as sessões: os "refresh tokens" deixam de valer (o usuário não renova o login).
      // 2º) Desativa: novos logins são recusados.
      // Obs.: um token que já tinha sido emitido continua valendo até expirar (no máximo 1 hora).
      await cognitoClient.send(new AdminUserGlobalSignOutCommand({ UserPoolId: userPoolId, Username: userId }));
      await cognitoClient.send(new AdminDisableUserCommand({ UserPoolId: userPoolId, Username: userId }));
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'UserNotFoundException') {
      throw new HttpError(404, 'Usuário não encontrado.');
    }
    throw error;
  }

  return jsonResponse(200, { userId, enabled });
});
