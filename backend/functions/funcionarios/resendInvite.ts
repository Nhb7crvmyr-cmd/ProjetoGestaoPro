// Lambda POST /funcionarios/{userId}/convite: reenvia o e-mail de convite (nova senha temporária).

import { AdminCreateUserCommand, AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { getAuthContext, requireEmpresaId, requireGroup } from '../../shared/auth';
import { cognitoClient, getUserPoolId } from '../../shared/cognito';
import { getEmployeeOrThrow } from '../../shared/employee';
import { HttpError } from '../../shared/errors';
import { jsonResponse, withErrorHandling } from '../../shared/http';
import { userIdPathSchema } from '../../shared/userIdSchema';
import { validate } from '../../shared/validation';

/**
 * Handler: só reenvia se o funcionário ainda NÃO fez o primeiro acesso.
 * (A senha temporária vale 7 dias; depois disso, só reenviando.)
 * @param event - requisição da HTTP API
 * @returns 200 com { message }
 */
export const handler = withErrorHandling(async (event) => {
  const auth = getAuthContext(event);
  requireGroup(auth, 'Dono');
  const empresaId = requireEmpresaId(auth);
  const { userId } = validate(userIdPathSchema, event.pathParameters ?? {});

  // SEGURANÇA: só funcionários da empresa do Dono.
  const employee = await getEmployeeOrThrow(empresaId, userId);

  const userPoolId = getUserPoolId();
  const user = await cognitoClient.send(new AdminGetUserCommand({ UserPoolId: userPoolId, Username: userId }));
  if (user.UserStatus !== 'FORCE_CHANGE_PASSWORD') {
    throw new HttpError(400, 'Este funcionário já fez o primeiro acesso.');
  }

  // MessageAction "RESEND": em vez de criar outra conta, gera nova senha temporária e reenvia o e-mail.
  await cognitoClient.send(
    new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: employee.email,
      MessageAction: 'RESEND',
      DesiredDeliveryMediums: ['EMAIL'],
    }),
  );

  return jsonResponse(200, { message: `Convite reenviado para ${employee.email}.` });
});
