// Descobre o Dono de uma empresa (id, nome e e-mail). Usado pelo SuperAdmin, que não pertence à empresa.

import { AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import * as z from 'zod/mini';
import { cognitoClient, getUserPoolId } from './cognito';
import { getCompanyById } from './company';
import { HttpError } from './errors';

/** {empresaId} na URL das rotas do SuperAdmin. */
export const empresaIdPathSchema = z.object({
  empresaId: z.guid('Empresa inválida.'),
});

/**
 * Busca a empresa e o nome/e-mail do Dono no Cognito.
 * @param empresaId - id da empresa (da URL, já validado)
 * @returns o nome da empresa e o Dono (id, nome e e-mail)
 */
export async function getCompanyOwner(
  empresaId: string,
): Promise<{ companyName: string; owner: { id: string; name: string; email: string } }> {
  const company = await getCompanyById(empresaId);
  if (!company) throw new HttpError(404, 'Empresa não encontrada.');

  let ownerName = company.legalName;
  let ownerEmail = '';
  try {
    const user = await cognitoClient.send(new AdminGetUserCommand({ UserPoolId: getUserPoolId(), Username: company.ownerId }));
    /** Lê um atributo do usuário do Cognito. */
    const attribute = (name: string) => user.UserAttributes?.find((item) => item.Name === name)?.Value;
    ownerName = attribute('name') ?? ownerName;
    ownerEmail = attribute('email') ?? '';
  } catch (error) {
    // Dono removido do Cognito: usa a razão social como nome.
    if (!(error instanceof Error && error.name === 'UserNotFoundException')) throw error;
  }

  return { companyName: company.tradeName || company.legalName, owner: { id: company.ownerId, name: ownerName, email: ownerEmail } };
}
