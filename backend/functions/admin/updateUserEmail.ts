// Lambda POST /admin/users/{userId}/email: o SUPORTE (SuperAdmin) troca o e-mail (login) de um usuário.
// Só o suporte pode: na tela "Meu perfil" o e-mail fica travado. O novo e-mail já entra confirmado.

import {
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import * as z from 'zod/mini';
import { getAuthContext, requireGroup } from '../../shared/auth';
import { cognitoClient, getUserPoolId } from '../../shared/cognito';
import { dynamo, getTableName } from '../../shared/dynamo';
import { HttpError } from '../../shared/errors';
import { jsonResponse, withErrorHandling } from '../../shared/http';
import { companyIndexKey, employeeKey } from '../../shared/keys';
import { userIdPathSchema } from '../../shared/userIdSchema';
import { parseJsonBody, validate } from '../../shared/validation';

const bodySchema = z.object({
  email: z.pipe(z.string('Informe o novo e-mail.').check(z.trim(), z.toLowerCase()), z.email('E-mail inválido.')),
});

/**
 * Atualiza um campo de um item SÓ se a condição for verdadeira; se não for, ignora em silêncio.
 * Usado para corrigir o e-mail "copiado" em outros registros, que podem não existir para este usuário.
 * @param params - chave, expressão, condição e valores
 * @returns nada
 */
async function updateIfExists(params: {
  key: Record<string, string>;
  update: string;
  condition: string;
  values: Record<string, unknown>;
}): Promise<void> {
  try {
    await dynamo.send(
      new UpdateCommand({
        TableName: getTableName(),
        Key: params.key,
        UpdateExpression: params.update,
        ConditionExpression: params.condition,
        ExpressionAttributeValues: params.values,
      }),
    );
  } catch (error) {
    if (!(error instanceof Error && error.name === 'ConditionalCheckFailedException')) throw error;
  }
}

/**
 * Handler.
 * Passos: 1) lê o usuário  2) troca o e-mail no Cognito (já confirmado)
 *         3) atualiza o e-mail copiado no registro de funcionário e na lista de empresas (se houver).
 * @param event - requisição da HTTP API
 * @returns 200 com { userId, email }
 */
export const handler = withErrorHandling(async (event) => {
  const auth = getAuthContext(event);
  requireGroup(auth, 'SuperAdmin'); // só o suporte troca e-mail
  const { userId } = validate(userIdPathSchema, event.pathParameters ?? {});
  const { email } = validate(bodySchema, parseJsonBody(event.body));
  const userPoolId = getUserPoolId();

  let empresaId = '';
  try {
    const user = await cognitoClient.send(new AdminGetUserCommand({ UserPoolId: userPoolId, Username: userId }));
    const current = user.UserAttributes?.find((attribute) => attribute.Name === 'email')?.Value;
    if (current === email) throw new HttpError(400, 'Esse já é o e-mail do usuário.');
    empresaId = user.UserAttributes?.find((attribute) => attribute.Name === 'custom:empresaId')?.Value ?? '';

    // email_verified = true no MESMO comando: a troca vale na hora (o suporte já conferiu o e-mail).
    await cognitoClient.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: userPoolId,
        Username: userId,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'email_verified', Value: 'true' },
        ],
      }),
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'UserNotFoundException') throw new HttpError(404, 'Usuário não encontrado.');
    // Outro usuário já usa esse e-mail como login.
    if (error instanceof Error && (error.name === 'AliasExistsException' || error.name === 'UsernameExistsException')) {
      throw new HttpError(409, 'Já existe outra conta com esse e-mail.');
    }
    throw error;
  }

  // O e-mail também aparece COPIADO em alguns registros: corrige onde existir.
  if (empresaId) {
    await updateIfExists({
      key: employeeKey(empresaId, userId),
      update: 'SET email = :email',
      condition: 'attribute_exists(pk)',
      values: { ':email': email },
    });
    await updateIfExists({
      key: companyIndexKey(empresaId),
      update: 'SET ownerEmail = :email',
      condition: 'ownerId = :userId',
      values: { ':email': email, ':userId': userId },
    });
  }

  return jsonResponse(200, { userId, email });
});
