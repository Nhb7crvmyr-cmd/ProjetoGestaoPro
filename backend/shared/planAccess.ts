// O que a empresa pode usar AGORA, de acordo com o plano (ativo, vencido ou inexistente).
// É o backend que decide: o site só mostra cadeados, mas quem bloqueia de verdade é esta regra.

import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { Company } from './company';
import { dynamo, getTableName } from './dynamo';
import { HttpError } from './errors';
import { EMPLOYEE_SK_PREFIX } from './keys';
import { FEATURE_NAMES, NO_PLAN_LIMITS, PLANS, type PlanFeature, type PlanId, type PlanLimits } from './plans';

/** Situação efetiva do plano da empresa. */
export interface PlanAccess extends PlanLimits {
  /** Plano ativo e dentro da validade (null = sem plano ativo). */
  planId: PlanId | null;
  /** true = tinha plano, mas a validade passou. */
  expired: boolean;
}

/**
 * Calcula o acesso: plano ATIVO e com validade no futuro → limites do plano; senão → o básico.
 * @param company - a empresa
 * @param now - "agora" (pode ser trocado nos testes)
 * @returns o acesso efetivo
 */
export function getPlanAccess(company: Pick<Company, 'plan'>, now = new Date()): PlanAccess {
  const { plan } = company;
  const valid = plan.status === 'ACTIVE' && plan.planId && plan.expiresAt && new Date(plan.expiresAt) > now;
  if (valid && plan.planId) {
    const { features, maxEmployees } = PLANS[plan.planId];
    return { planId: plan.planId, expired: false, features, maxEmployees };
  }
  return { planId: null, expired: plan.status === 'ACTIVE', ...NO_PLAN_LIMITS };
}

/**
 * Garante que o plano inclui a ferramenta; senão, 403 com a explicação (usado no Chat, Automações e Marketing).
 * @param access - acesso da empresa
 * @param feature - ferramenta pedida
 */
export function requireFeature(access: PlanAccess, feature: PlanFeature): void {
  if (!access.features.includes(feature)) {
    const needed = (Object.keys(PLANS) as PlanId[]).find((id) => PLANS[id].features.includes(feature));
    throw new HttpError(403, `${FEATURE_NAMES[feature]} não está no seu plano. Disponível a partir do plano ${needed ? PLANS[needed].name : ''}.`);
  }
}

/**
 * Conta os funcionários ATIVOS (não bloqueados) da empresa. Funcionário bloqueado não ocupa vaga.
 * @param empresaId - empresa
 * @returns quantidade
 */
export async function countActiveEmployees(empresaId: string): Promise<number> {
  let count = 0;
  let startKey: Record<string, unknown> | undefined;
  do {
    const page = await dynamo.send(
      new QueryCommand({
        TableName: getTableName(),
        KeyConditionExpression: 'pk = :pk AND begins_with(sk, :prefix)',
        FilterExpression: 'enabled = :true',
        ExpressionAttributeValues: { ':pk': `EMPRESA#${empresaId}`, ':prefix': EMPLOYEE_SK_PREFIX, ':true': true },
        // Select COUNT: o DynamoDB devolve só a contagem, sem os dados (resposta menor).
        Select: 'COUNT',
        ExclusiveStartKey: startKey,
      }),
    );
    count += page.Count ?? 0;
    startKey = page.LastEvaluatedKey;
  } while (startKey);
  return count;
}

/**
 * Garante que ainda cabe mais 1 funcionário ATIVO no plano; senão, 403 com a explicação.
 * @param access - acesso da empresa
 * @param empresaId - empresa
 */
export async function requireEmployeeSlot(access: PlanAccess, empresaId: string): Promise<void> {
  if (access.maxEmployees === null) return; // ilimitado
  // Sem plano (limite 0): nem precisa contar no banco.
  if (access.maxEmployees === 0) {
    throw new HttpError(403, 'Sem plano ativo, não é possível cadastrar ou liberar funcionários. Ative um plano (a partir do Básico).');
  }
  const active = await countActiveEmployees(empresaId);
  if (active >= access.maxEmployees) {
    const planName = access.planId ? `O plano ${PLANS[access.planId].name}` : 'Sem plano ativo, a empresa';
    throw new HttpError(
      403,
      `${planName} permite até ${access.maxEmployees} funcionários ativos (hoje: ${active}). Faça upgrade ou bloqueie alguém para liberar a vaga.`,
    );
  }
}
