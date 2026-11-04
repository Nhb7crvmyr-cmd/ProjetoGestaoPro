// Formato do registro de EMPRESA no banco e funções para lê-lo. Usado pelos módulos empresa e admin.

import { GetCommand } from '@aws-sdk/lib-dynamodb';
import type { Address } from './addressSchema';
import { dynamo, getTableName } from './dynamo';
import { companyKey } from './keys';
import type { PlanId } from './plans';

/** Situação do plano: PENDING = ainda não pagou; ACTIVE = pago e dentro da validade. */
export type PlanStatus = 'PENDING' | 'ACTIVE';

/** Plano contratado pela empresa. */
export interface CompanyPlan {
  planId: PlanId | null;
  status: PlanStatus;
  activatedAt?: string;
  /** Data em que o plano vence (ISO). */
  expiresAt?: string;
  /** SIMULATED = pagamento de teste (sem cobrança real); SUPPORT = definido pelo suporte (SuperAdmin). */
  paymentType?: 'SIMULATED' | 'SUPPORT';
  /** Quando foi o suporte: id de quem definiu. */
  grantedBy?: string;
}

/** Empresa como fica gravada no DynamoDB (sem pk/sk). */
export interface Company {
  empresaId: string;
  /** CNPJ = empresa; CPF = pessoa física que se cadastra como "empresa". */
  documentType: 'CNPJ' | 'CPF';
  /** Documento sem pontuação. */
  document: string;
  /** Razão social (CNPJ) ou nome completo (CPF). */
  legalName: string;
  /** Nome fantasia (opcional). */
  tradeName?: string;
  email: string;
  /** Telefone só com números (DDD + número). */
  phone: string;
  address: Address;
  ownerId: string;
  plan: CompanyPlan;
  createdAt: string;
}

/**
 * Busca a empresa pelo id.
 * @param empresaId - id da empresa (SEMPRE vindo do token)
 * @returns a empresa, ou null se não existir
 */
export async function getCompanyById(empresaId: string): Promise<Company | null> {
  const { Item } = await dynamo.send(new GetCommand({ TableName: getTableName(), Key: companyKey(empresaId) }));
  if (!Item) return null;
  // Remove as chaves internas antes de devolver (o site não precisa delas).
  const { pk: _pk, sk: _sk, ...company } = Item;
  return company as Company;
}
