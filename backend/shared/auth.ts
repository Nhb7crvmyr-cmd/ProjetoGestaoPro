// Lê QUEM está chamando a API a partir do token do Cognito (já validado pela HTTP API).
//
// SEGURANÇA: a HTTP API tem um "autorizador JWT". Ele confere a assinatura e a validade do token
// ANTES de chamar a Lambda. Se o token for falso ou estiver vencido, a Lambda nem é executada.
// Por isso, aqui podemos confiar nos "claims" (dados) do token. Já o corpo da requisição
// pode ter sido escrito por qualquer pessoa, então userId e grupo NUNCA vêm dele.

import { HttpError } from './errors';
import type { ApiEvent } from './http';

/** Grupos existentes no Cognito. */
export type UserGroup = 'SuperAdmin' | 'Dono' | 'Funcionario';

/** Quem está fazendo a requisição. */
export interface AuthContext {
  userId: string;
  email: string;
  /** Nome do usuário (atributo "name" do Cognito). */
  name: string;
  groups: UserGroup[];
  /** Empresa do usuário (atributo "custom:empresaId" do Cognito). Vazio enquanto não fizer o onboarding. */
  empresaId: string;
}

/**
 * A HTTP API entrega claims do tipo lista como TEXTO, por exemplo "[SuperAdmin Dono]".
 * Esta função transforma esse texto em um array de verdade.
 * @param raw - valor bruto do claim "cognito:groups"
 * @returns a lista de grupos
 */
function parseGroups(raw: unknown): UserGroup[] {
  if (Array.isArray(raw)) return raw as UserGroup[];
  if (typeof raw !== 'string' || raw.trim() === '') return [];
  return raw
    .replace(/^\[|\]$/g, '')
    .split(/[\s,]+/)
    .filter(Boolean) as UserGroup[];
}

/**
 * Extrai o usuário logado do evento.
 * @param event - evento recebido pela Lambda
 * @returns id, e-mail e grupos do usuário
 */
export function getAuthContext(event: ApiEvent): AuthContext {
  const claims = event.requestContext.authorizer.jwt.claims;
  return {
    userId: String(claims.sub),
    email: String(claims.email ?? ''),
    name: String(claims.name ?? ''),
    groups: parseGroups(claims['cognito:groups']),
    empresaId: String(claims['custom:empresaId'] ?? ''),
  };
}

/**
 * Devolve o empresaId do token ou lança 403 se o usuário ainda não tiver empresa.
 * @param auth - usuário logado
 * @returns o id da empresa
 */
export function requireEmpresaId(auth: AuthContext): string {
  if (!auth.empresaId) {
    throw new HttpError(403, 'Cadastre sua empresa para continuar.');
  }
  return auth.empresaId;
}

/**
 * Garante que o usuário esteja em um dos grupos permitidos; senão, lança o erro 403 (proibido).
 * @param auth - usuário logado
 * @param allowed - grupos que podem usar a rota
 */
export function requireGroup(auth: AuthContext, ...allowed: UserGroup[]): void {
  if (!auth.groups.some((group) => allowed.includes(group))) {
    throw new HttpError(403, 'Você não tem permissão para esta ação.');
  }
}
