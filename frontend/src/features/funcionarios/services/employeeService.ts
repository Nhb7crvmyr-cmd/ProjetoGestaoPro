// Chamadas à API do módulo funcionarios (somente Dono): cadastrar, listar, bloquear/liberar e reenviar convite.

import { apiFetch } from '../../../services/apiClient';

/** Funcionário como a API devolve. */
export interface Employee {
  userId: string;
  name: string;
  email: string;
  phone?: string;
  /** false = bloqueado. */
  enabled: boolean;
  /** Situação no Cognito: FORCE_CHANGE_PASSWORD (não fez o 1º acesso), CONFIRMED... */
  status: string;
  createdAt: string;
}

/** Dados do formulário de novo funcionário (telefone só com números). */
export interface CreateEmployeeInput {
  name: string;
  email: string;
  phone?: string;
}

/**
 * Lista os funcionários da empresa do Dono logado.
 * @returns a lista (ordem alfabética)
 */
export async function listEmployees(): Promise<Employee[]> {
  const { employees } = await apiFetch<{ employees: Employee[] }>('/funcionarios');
  return employees;
}

/**
 * Cadastra um funcionário. O Cognito envia o convite por e-mail.
 * @param input - nome, e-mail e telefone
 * @returns o funcionário criado
 */
export async function createEmployee(input: CreateEmployeeInput): Promise<Employee> {
  const { employee } = await apiFetch<{ employee: Employee }>('/funcionarios', { method: 'POST', body: JSON.stringify(input) });
  return employee;
}

/**
 * Bloqueia ou libera um funcionário.
 * @param userId - id do funcionário
 * @param enabled - novo estado do acesso
 * @returns o id e o novo estado
 */
export async function setEmployeeStatus(userId: string, enabled: boolean): Promise<{ userId: string; enabled: boolean }> {
  return apiFetch(`/funcionarios/${encodeURIComponent(userId)}/status`, { method: 'POST', body: JSON.stringify({ enabled }) });
}

/**
 * Reenvia o e-mail de convite (nova senha temporária).
 * @param userId - id do funcionário
 * @returns a mensagem de confirmação
 */
export async function resendInvite(userId: string): Promise<{ message: string }> {
  return apiFetch(`/funcionarios/${encodeURIComponent(userId)}/convite`, { method: 'POST' });
}
