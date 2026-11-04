// Formato do registro de CLIENTE no banco e a regra de acesso: o Funcionario só acessa os clientes DELE.

import { GetCommand } from '@aws-sdk/lib-dynamodb';
import type { Address } from './addressSchema';
import type { AuthContext } from './auth';
import { dynamo, getTableName } from './dynamo';
import { HttpError } from './errors';
import { customerKey } from './keys';

/** Cliente como fica gravado no DynamoDB (sem pk/sk). */
export interface Customer {
  customerId: string;
  empresaId: string;
  name: string;
  /** Tipo do documento, se informado. */
  documentType?: 'CPF' | 'CNPJ';
  /** CPF/CNPJ sem pontuação (único dentro da empresa). */
  document?: string;
  email?: string;
  /** Telefone/WhatsApp só com números. */
  phone: string;
  /** Data de nascimento no formato AAAA-MM-DD. */
  birthDate?: string;
  notes?: string;
  address?: Address;
  /**
   * Quem atende o cliente (o "vendedorId" das regras do projeto): no início, quem cadastrou;
   * depois, o Dono pode transferir para outro atendente (functions/clientes/transferCustomers.ts).
   * O Funcionario só enxerga clientes com sellerId igual ao próprio id.
   */
  sellerId: string;
  sellerName: string;
  /** Última transferência de atendimento feita pelo Dono (se houver). */
  lastTransfer?: {
    fromSellerId: string;
    fromSellerName: string;
    toSellerId: string;
    toSellerName: string;
    byUserId: string;
    /** Nome de quem fez (transferências antigas podem não ter). */
    byName?: string;
    /** Quem fez: o Dono da empresa ou o SuperAdmin (suporte). */
    byRole?: 'Dono' | 'SuperAdmin';
    at: string;
  };
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Diz se o usuário pode acessar o cliente: o Dono acessa todos; o Funcionario, só os dele.
 * @param customer - o cliente
 * @param auth - usuário logado
 * @returns true se pode
 */
export function canAccessCustomer(customer: Pick<Customer, 'sellerId'>, auth: AuthContext): boolean {
  return auth.groups.includes('Dono') || customer.sellerId === auth.userId;
}

/**
 * Busca um cliente da empresa e confere se o usuário pode acessá-lo.
 * Se o Funcionario tentar abrir cliente de outro, a resposta é 404 (e não 403) de propósito:
 * assim ele nem fica sabendo que aquele cliente existe.
 * @param empresaId - empresa (do token)
 * @param customerId - id do cliente
 * @param auth - usuário logado
 * @returns o cliente
 */
export async function getCustomerOrThrow(empresaId: string, customerId: string, auth: AuthContext): Promise<Customer> {
  const { Item } = await dynamo.send(new GetCommand({ TableName: getTableName(), Key: customerKey(empresaId, customerId) }));
  if (!Item) throw new HttpError(404, 'Cliente não encontrado.');
  const { pk: _pk, sk: _sk, ...customer } = Item;
  if (!canAccessCustomer(customer as Customer, auth)) throw new HttpError(404, 'Cliente não encontrado.');
  return customer as Customer;
}
