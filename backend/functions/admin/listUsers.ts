// Lambda GET /admin/users: lista TODOS os usuários do Cognito com seus grupos (somente SuperAdmin).

import {
  ListUsersCommand,
  ListUsersInGroupCommand,
  type UserType,
} from '@aws-sdk/client-cognito-identity-provider';
import { getAuthContext, requireGroup, type UserGroup } from '../../shared/auth';
import { cognitoClient, getUserPoolId } from '../../shared/cognito';
import { jsonResponse, withErrorHandling } from '../../shared/http';

/** Formato de cada usuário devolvido ao site. */
interface AdminUser {
  id: string;
  email: string;
  name: string;
  /** false = bloqueado pelo SuperAdmin. */
  enabled: boolean;
  /** Situação no Cognito: CONFIRMED (e-mail confirmado), UNCONFIRMED (ainda não confirmou)... */
  status: string;
  createdAt: string;
  groups: UserGroup[];
}

const GROUPS: UserGroup[] = ['SuperAdmin', 'Dono', 'Funcionario'];

/**
 * Busca todos os usuários do User Pool. O Cognito devolve no máximo 60 por vez
 * ("paginação"), então repetimos a chamada usando o PaginationToken até acabar.
 * @param userPoolId - ID do User Pool
 * @returns todos os usuários
 */
async function fetchAllUsers(userPoolId: string): Promise<UserType[]> {
  const users: UserType[] = [];
  let paginationToken: string | undefined;
  do {
    const page = await cognitoClient.send(
      new ListUsersCommand({ UserPoolId: userPoolId, Limit: 60, PaginationToken: paginationToken }),
    );
    users.push(...(page.Users ?? []));
    paginationToken = page.PaginationToken;
  } while (paginationToken);
  return users;
}

/**
 * Descobre os grupos de cada usuário. Em vez de perguntar usuário por usuário
 * (uma chamada para cada um), pergunta grupo por grupo: são só 3 chamadas.
 * @param userPoolId - ID do User Pool
 * @returns mapa "id do usuário" → lista de grupos
 */
async function fetchGroupsByUser(userPoolId: string): Promise<Map<string, UserGroup[]>> {
  const groupsByUser = new Map<string, UserGroup[]>();
  for (const group of GROUPS) {
    let nextToken: string | undefined;
    do {
      const page = await cognitoClient.send(
        new ListUsersInGroupCommand({ UserPoolId: userPoolId, GroupName: group, Limit: 60, NextToken: nextToken }),
      );
      for (const user of page.Users ?? []) {
        const id = user.Username!;
        groupsByUser.set(id, [...(groupsByUser.get(id) ?? []), group]);
      }
      nextToken = page.NextToken;
    } while (nextToken);
  }
  return groupsByUser;
}

/**
 * Lê um atributo (email, name...) da lista de atributos do usuário no Cognito.
 * @param user - usuário do Cognito
 * @param name - nome do atributo
 * @returns o valor, ou texto vazio
 */
function getAttribute(user: UserType, name: string): string {
  return user.Attributes?.find((attribute) => attribute.Name === name)?.Value ?? '';
}

/**
 * Handler: confere se é SuperAdmin, busca usuários e grupos e devolve a lista.
 * @param event - requisição da HTTP API
 * @returns 200 com { users: AdminUser[] }
 */
export const handler = withErrorHandling(async (event) => {
  requireGroup(getAuthContext(event), 'SuperAdmin');

  const userPoolId = getUserPoolId();
  // Promise.all roda as duas buscas AO MESMO TEMPO (mais rápido do que uma depois da outra).
  const [users, groupsByUser] = await Promise.all([fetchAllUsers(userPoolId), fetchGroupsByUser(userPoolId)]);

  const result: AdminUser[] = users
    .map((user) => ({
      id: user.Username!,
      email: getAttribute(user, 'email'),
      name: getAttribute(user, 'name'),
      enabled: user.Enabled ?? false,
      status: user.UserStatus ?? 'UNKNOWN',
      createdAt: user.UserCreateDate?.toISOString() ?? '',
      groups: groupsByUser.get(user.Username!) ?? [],
    }))
    // Mais recentes primeiro.
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return jsonResponse(200, { users: result });
});
