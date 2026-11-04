// Chamadas à API do módulo clientes: listar, cadastrar, editar e transferir atendimento.

import type { LastTransfer } from '../../../components/ui/TransferInfo';
import { apiFetch } from '../../../services/apiClient';
import type { Address } from '../../empresa/services/companyService';

/** Cliente como a API devolve. */
export interface Customer {
  customerId: string;
  name: string;
  documentType?: 'CPF' | 'CNPJ';
  document?: string;
  email?: string;
  phone: string;
  /** AAAA-MM-DD */
  birthDate?: string;
  notes?: string;
  address?: Address;
  /** Quem atende o cliente: no início, quem cadastrou; o Dono pode transferir. */
  sellerId: string;
  sellerName: string;
  /** Última transferência de atendimento (se houver). */
  lastTransfer?: LastTransfer;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Campos enviados no cadastro e na edição (sem máscaras). */
export interface CustomerInput {
  name: string;
  documentType?: 'CPF' | 'CNPJ';
  document?: string;
  email?: string;
  phone: string;
  birthDate?: string;
  notes?: string;
  address?: Address;
}

/**
 * Lista os clientes (o Dono recebe todos; o funcionário, só os dele: quem decide é o backend).
 * @returns os clientes (ordem alfabética)
 */
export async function listCustomers(): Promise<Customer[]> {
  const { customers } = await apiFetch<{ customers: Customer[] }>('/clientes');
  return customers;
}

/**
 * Cadastra um cliente.
 * @param input - dados do cliente
 * @returns o cliente criado
 */
export async function createCustomer(input: CustomerInput): Promise<Customer> {
  const { customer } = await apiFetch<{ customer: Customer }>('/clientes', { method: 'POST', body: JSON.stringify(input) });
  return customer;
}

/**
 * Edita um cliente.
 * @param customerId - id do cliente
 * @param input - dados + ativo/inativo
 * @returns o cliente atualizado
 */
export async function updateCustomer(customerId: string, input: CustomerInput & { active: boolean }): Promise<Customer> {
  const { customer } = await apiFetch<{ customer: Customer }>(`/clientes/${encodeURIComponent(customerId)}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  });
  return customer;
}

/** Máximo de clientes por chamada (limite do backend). */
const TRANSFER_CHUNK = 100;

/**
 * Transfere o atendimento de clientes para outro atendente (somente Dono).
 * Se forem mais de 100, envia em "lotes" de 100, um depois do outro.
 * @param customerIds - clientes a transferir
 * @param toSellerId - id do novo atendente (o próprio Dono ou um funcionário ativo)
 * @returns quantos foram transferidos e o nome do novo atendente
 */
export async function transferCustomers(customerIds: string[], toSellerId: string): Promise<{ transferred: number; toSellerName: string }> {
  let transferred = 0;
  let toSellerName = '';
  for (let start = 0; start < customerIds.length; start += TRANSFER_CHUNK) {
    const chunk = customerIds.slice(start, start + TRANSFER_CHUNK);
    const result = await apiFetch<{ transferred: number; toSellerName: string }>('/clientes/transferir', {
      method: 'POST',
      body: JSON.stringify({ customerIds: chunk, toSellerId }),
    });
    transferred += result.transferred;
    toSellerName = result.toSellerName;
  }
  return { transferred, toSellerName };
}
