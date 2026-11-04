// Lambda POST /admin/empresas/{empresaId}/plano: o SUPORTE (SuperAdmin) define o plano de uma empresa
// (cortesia, teste, correção): escolhe o plano e a data de validade, ou remove o plano. Fica registrado.

import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import * as z from 'zod/mini';
import { getAuthContext, requireGroup } from '../../shared/auth';
import type { CompanyPlan } from '../../shared/company';
import { empresaIdPathSchema } from '../../shared/companyOwner';
import { dynamo, getTableName } from '../../shared/dynamo';
import { HttpError } from '../../shared/errors';
import { jsonResponse, withErrorHandling } from '../../shared/http';
import { companyIndexKey, companyKey } from '../../shared/keys';
import { PLAN_IDS } from '../../shared/plans';
import { failedTransactionIndex } from '../../shared/sale';
import { parseJsonBody, validate } from '../../shared/validation';

const bodySchema = z.object({
  // "none" = remover o plano (a empresa volta ao básico).
  planId: z.enum([...PLAN_IDS, 'none'], 'Plano inválido.'),
  /** Último dia de validade (AAAA-MM-DD). Obrigatório quando há plano. */
  validUntil: z.optional(z.string().check(z.regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.'))),
});

/**
 * Converte "AAAA-MM-DD" no FIM daquele dia (23:59:59 no horário de Brasília = 02:59:59 UTC do dia seguinte).
 * Assim o plano vale o dia inteiro escolhido.
 * @param date - data escolhida
 * @returns a data/hora ISO do fim do dia
 */
function endOfDayBrasilia(date: string): string {
  const end = new Date(`${date}T23:59:59.999-03:00`);
  if (Number.isNaN(end.getTime())) throw new HttpError(400, 'Data inválida.');
  return end.toISOString();
}

/**
 * Handler: grava o plano na empresa e no índice do admin, em uma transação.
 * @param event - requisição da HTTP API
 * @returns 200 com { plan }
 */
export const handler = withErrorHandling(async (event) => {
  const auth = getAuthContext(event);
  requireGroup(auth, 'SuperAdmin');
  const { empresaId } = validate(empresaIdPathSchema, event.pathParameters ?? {});
  const body = validate(bodySchema, parseJsonBody(event.body));
  const now = new Date();

  let plan: CompanyPlan;
  if (body.planId === 'none') {
    plan = { planId: null, status: 'PENDING', paymentType: 'SUPPORT', grantedBy: auth.userId };
  } else {
    if (!body.validUntil) throw new HttpError(400, 'Informe até quando o plano vale.');
    const expiresAt = endOfDayBrasilia(body.validUntil);
    if (new Date(expiresAt) <= now) throw new HttpError(400, 'A validade precisa ser uma data futura.');
    plan = { planId: body.planId, status: 'ACTIVE', activatedAt: now.toISOString(), expiresAt, paymentType: 'SUPPORT', grantedBy: auth.userId };
  }

  const TableName = getTableName();
  try {
    await dynamo.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Update: {
              TableName,
              Key: companyKey(empresaId),
              UpdateExpression: 'SET #plan = :plan',
              ConditionExpression: 'attribute_exists(pk)', // 404 se a empresa não existir
              ExpressionAttributeNames: { '#plan': 'plan' },
              ExpressionAttributeValues: { ':plan': plan },
            },
          },
          {
            Update: {
              TableName,
              Key: companyIndexKey(empresaId),
              UpdateExpression: 'SET planId = :planId, planStatus = :status, planExpiresAt = :expiresAt',
              ExpressionAttributeValues: { ':planId': plan.planId, ':status': plan.status, ':expiresAt': plan.expiresAt ?? null },
            },
          },
        ],
      }),
    );
  } catch (error) {
    if (failedTransactionIndex(error) === 0) throw new HttpError(404, 'Empresa não encontrada.');
    throw error;
  }

  return jsonResponse(200, { plan });
});
