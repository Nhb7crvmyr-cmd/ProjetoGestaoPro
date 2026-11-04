// Chamadas à API do módulo admin (somente SuperAdmin): listar usuários e bloquear/liberar acesso.

import type { LastTransfer } from '../../../components/ui/TransferInfo';
import { apiFetch } from '../../../services/apiClient';
import type { UserGroup } from '../../../types/auth';

/** Usuário como a Lambda listUsers devolve. */
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  /** false = bloqueado. */
  enabled: boolean;
  /** CONFIRMED, UNCONFIRMED, FORCE_CHANGE_PASSWORD... (situação no Cognito). */
  status: string;
  /** Data de criação no formato ISO (ex.: 2026-10-16T18:30:00.000Z). */
  createdAt: string;
  groups: UserGroup[];
}

/**
 * Busca todos os usuários da plataforma.
 * @returns a lista de usuários (mais recentes primeiro)
 */
export async function listUsers(): Promise<AdminUser[]> {
  const { users } = await apiFetch<{ users: AdminUser[] }>('/admin/users');
  return users;
}

/**
 * Bloqueia (enabled=false) ou libera (enabled=true) o acesso de um usuário.
 * @param userId - id do usuário no Cognito
 * @param enabled - novo estado do acesso
 * @returns o id e o novo estado confirmados pelo backend
 */
export async function setUserStatus(userId: string, enabled: boolean): Promise<{ userId: string; enabled: boolean }> {
  // encodeURIComponent protege a URL caso o id tenha caracteres especiais.
  return apiFetch(`/admin/users/${encodeURIComponent(userId)}/status`, {
    method: 'POST',
    body: JSON.stringify({ enabled }),
  });
}

/** Resumo de empresa como a Lambda listCompanies devolve. */
export interface AdminCompany {
  empresaId: string;
  documentType: 'CNPJ' | 'CPF';
  document: string;
  legalName: string;
  tradeName?: string;
  city: string;
  state: string;
  ownerEmail: string;
  planId: string | null;
  /** PENDING = não pagou; ACTIVE = pago. */
  planStatus: 'PENDING' | 'ACTIVE';
  planExpiresAt?: string;
  createdAt: string;
}

/**
 * Busca todas as empresas da plataforma.
 * @returns a lista de empresas (mais recentes primeiro)
 */
export async function listCompanies(): Promise<AdminCompany[]> {
  const { companies } = await apiFetch<{ companies: AdminCompany[] }>('/admin/empresas');
  return companies;
}

/** Cliente como o SuperAdmin vê (dados completos, para dar suporte). */
export interface AdminCompanyCustomer {
  customerId: string;
  name: string;
  documentType?: 'CPF' | 'CNPJ';
  document?: string;
  email?: string;
  phone: string;
  address?: { city: string; state: string };
  sellerId: string;
  sellerName: string;
  active: boolean;
  lastTransfer?: LastTransfer;
}

/** Atendente possível de uma empresa. */
export interface AdminAttendant {
  id: string;
  name: string;
  /** E-mail do atendente (para o SuperAdmin identificar quem é). */
  email: string;
  /** SuperAdmin = você mesmo, para assumir o atendimento durante um suporte. */
  role: 'Dono' | 'Funcionario' | 'SuperAdmin';
  enabled: boolean;
}

/**
 * Texto do papel do atendente, para as listas.
 * @param role - papel
 * @returns texto entre parênteses (ou vazio para funcionário)
 */
export function attendantRoleLabel(role: AdminAttendant['role']): string {
  if (role === 'Dono') return ' (Supervisor)';
  if (role === 'SuperAdmin') return ' (você)';
  return '';
}

/**
 * Busca os clientes de uma empresa e os atendentes possíveis (suporte do SuperAdmin).
 * @param empresaId - id da empresa
 * @returns nome da empresa, clientes e atendentes
 */
export async function listCompanyCustomers(
  empresaId: string,
): Promise<{ companyName: string; customers: AdminCompanyCustomer[]; attendants: AdminAttendant[] }> {
  return apiFetch(`/admin/empresas/${encodeURIComponent(empresaId)}/clientes`);
}

/**
 * Transfere o atendimento de clientes de uma empresa (suporte do SuperAdmin), em lotes de 100.
 * @param empresaId - id da empresa
 * @param customerIds - clientes
 * @param toSellerId - novo atendente (Dono ou funcionário ativo da empresa)
 * @returns quantos foram transferidos e o nome do novo atendente
 */
export async function transferCompanyCustomers(
  empresaId: string,
  customerIds: string[],
  toSellerId: string,
): Promise<{ transferred: number; toSellerName: string }> {
  let transferred = 0;
  let toSellerName = '';
  for (let start = 0; start < customerIds.length; start += 100) {
    const result = await apiFetch<{ transferred: number; toSellerName: string }>(
      `/admin/empresas/${encodeURIComponent(empresaId)}/clientes/transferir`,
      { method: 'POST', body: JSON.stringify({ customerIds: customerIds.slice(start, start + 100), toSellerId }) },
    );
    transferred += result.transferred;
    toSellerName = result.toSellerName;
  }
  return { transferred, toSellerName };
}

/**
 * Suporte: troca o e-mail (login) de um usuário. O novo e-mail já entra confirmado.
 * @param userId - id do usuário
 * @param email - novo e-mail
 * @returns o id e o e-mail novo
 */
export async function updateUserEmail(userId: string, email: string): Promise<{ userId: string; email: string }> {
  return apiFetch(`/admin/users/${encodeURIComponent(userId)}/email`, { method: 'POST', body: JSON.stringify({ email }) });
}

/**
 * Suporte: define o plano de uma empresa (ou remove, com 'none').
 * @param empresaId - id da empresa
 * @param planId - plano escolhido, ou 'none' para remover
 * @param validUntil - último dia de validade (AAAA-MM-DD); obrigatório com plano
 * @returns o plano gravado
 */
export async function setCompanyPlan(
  empresaId: string,
  planId: 'basico' | 'profissional' | 'premium' | 'none',
  validUntil?: string,
): Promise<{ plan: { planId: string | null; status: string; expiresAt?: string } }> {
  return apiFetch(`/admin/empresas/${encodeURIComponent(empresaId)}/plano`, {
    method: 'POST',
    body: JSON.stringify({ planId, validUntil }),
  });
}
