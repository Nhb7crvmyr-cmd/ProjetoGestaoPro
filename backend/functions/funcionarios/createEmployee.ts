// Lambda POST /funcionarios: o Dono cadastra um funcionário. O Cognito envia um convite com senha temporária.

import { AdminAddUserToGroupCommand, AdminCreateUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import * as z from 'zod/mini';
import { requiredText } from '../../shared/addressSchema';
import { getAuthContext, requireEmpresaId, requireGroup } from '../../shared/auth';
import { cognitoClient, getUserPoolId } from '../../shared/cognito';
import { getCompanyById } from '../../shared/company';
import { dynamo, getTableName } from '../../shared/dynamo';
import type { Employee } from '../../shared/employee';
import { HttpError } from '../../shared/errors';
import { jsonResponse, withErrorHandling } from '../../shared/http';
import { employeeKey } from '../../shared/keys';
import { getPlanAccess, requireEmployeeSlot } from '../../shared/planAccess';
import { parseJsonBody, validate } from '../../shared/validation';

const bodySchema = z.object({
  name: requiredText('Nome', 100),
  email: z.pipe(z.string('Informe o e-mail.').check(z.trim(), z.toLowerCase()), z.email('E-mail inválido.')),
  phone: z.optional(z.string().check(z.regex(/^\d{10,11}$/, 'Telefone: DDD + número (10 ou 11 números).'))),
});

/**
 * Handler.
 * Passos: 1) cria o usuário no Cognito (já com o empresaId do DONO)  2) coloca no grupo "Funcionario"
 *         3) grava o registro do funcionário na partição da empresa.
 * @param event - requisição da HTTP API
 * @returns 201 com { employee }
 */
export const handler = withErrorHandling(async (event) => {
  const auth = getAuthContext(event);
  requireGroup(auth, 'Dono'); // só o Dono cria funcionários
  const empresaId = requireEmpresaId(auth); // a empresa vem do TOKEN do Dono, nunca do corpo
  const body = validate(bodySchema, parseJsonBody(event.body));
  const userPoolId = getUserPoolId();

  // LIMITE DO PLANO: confere se ainda cabe mais um funcionário ativo ANTES de criar a conta no Cognito.
  const company = await getCompanyById(empresaId);
  if (!company) throw new HttpError(404, 'Empresa não encontrada.');
  await requireEmployeeSlot(getPlanAccess(company), empresaId);

  let userId: string;
  try {
    // AdminCreateUser: cria a conta e o Cognito manda o e-mail de convite com a senha temporária
    // (o texto do e-mail está em infra/lib/auth-stack.ts → userInvitation).
    const { User } = await cognitoClient.send(
      new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: body.email,
        DesiredDeliveryMediums: ['EMAIL'],
        UserAttributes: [
          { Name: 'email', Value: body.email },
          // O Dono já informou o e-mail: marcamos como verificado (o convite chega nele mesmo).
          { Name: 'email_verified', Value: 'true' },
          { Name: 'name', Value: body.name },
          { Name: 'custom:empresaId', Value: empresaId },
        ],
      }),
    );
    userId = User!.Username!;
  } catch (error) {
    if (error instanceof Error && error.name === 'UsernameExistsException') {
      throw new HttpError(409, 'Já existe uma conta com este e-mail.');
    }
    throw error;
  }

  await cognitoClient.send(new AdminAddUserToGroupCommand({ UserPoolId: userPoolId, Username: userId, GroupName: 'Funcionario' }));

  const employee: Employee = {
    userId,
    empresaId,
    name: body.name,
    email: body.email,
    phone: body.phone,
    enabled: true,
    createdBy: auth.userId,
    createdAt: new Date().toISOString(),
  };
  await dynamo.send(
    new PutCommand({
      TableName: getTableName(),
      Item: { ...employeeKey(empresaId, userId), ...employee },
      ConditionExpression: 'attribute_not_exists(pk)',
    }),
  );

  return jsonResponse(201, { employee });
});
