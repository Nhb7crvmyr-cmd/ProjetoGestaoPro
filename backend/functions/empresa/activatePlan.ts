// Lambda POST /empresa/plano: "pagamento" SIMULADO. Ativa o plano escolhido por 30 dias (somente Dono).
// Nenhuma cobrança real acontece aqui. Um meio de pagamento de verdade fica para o futuro.

import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import * as z from 'zod/mini';
import { getAuthContext, requireEmpresaId, requireGroup } from '../../shared/auth';
import type { CompanyPlan } from '../../shared/company';
import { dynamo, getTableName } from '../../shared/dynamo';
import { HttpError } from '../../shared/errors';
import { jsonResponse, withErrorHandling } from '../../shared/http';
import { companyIndexKey, companyKey } from '../../shared/keys';
import { PLAN_DURATION_DAYS, PLAN_IDS } from '../../shared/plans';
import { parseJsonBody, validate } from '../../shared/validation';

const bodySchema = z.object({
  planId: z.enum(PLAN_IDS, 'Plano inválido.'),
});

/**
 * Handler: valida o plano e grava como ATIVO na empresa e no índice do admin.
 * @param event - requisição da HTTP API
 * @returns 200 com { plan }
 */
export const handler = withErrorHandling(async (event) => {
  const auth = getAuthContext(event);
  requireGroup(auth, 'Dono'); // só o Dono contrata
  const empresaId = requireEmpresaId(auth);
  const { planId } = validate(bodySchema, parseJsonBody(event.body));

  const now = new Date();
  // 1 dia = 24 h × 60 min × 60 s × 1000 ms.
  const expiresAt = new Date(now.getTime() + PLAN_DURATION_DAYS * 24 * 60 * 60 * 1000);
  const plan: CompanyPlan = {
    planId,
    status: 'ACTIVE',
    activatedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    paymentType: 'SIMULATED',
  };
  const TableName = getTableName();

  try {
    await dynamo.send(
      new TransactWriteCommand({
        TransactItems: [
          {
            Update: {
              TableName,
              Key: companyKey(empresaId),
              // "#plan" e ":plan" são apelidos: evitam conflito com palavras reservadas do DynamoDB.
              UpdateExpression: 'SET #plan = :plan',
              ConditionExpression: 'attribute_exists(pk)', // só atualiza se a empresa existir
              ExpressionAttributeNames: { '#plan': 'plan' },
              ExpressionAttributeValues: { ':plan': plan },
            },
          },
          {
            Update: {
              TableName,
              Key: companyIndexKey(empresaId),
              UpdateExpression: 'SET planId = :planId, planStatus = :status, planExpiresAt = :expiresAt',
              ExpressionAttributeValues: { ':planId': planId, ':status': plan.status, ':expiresAt': plan.expiresAt },
            },
          },
        ],
      }),
    );
  } catch (error) {
    const reasons = (error as { CancellationReasons?: { Code?: string }[] }).CancellationReasons;
    if (reasons?.[0]?.Code === 'ConditionalCheckFailed') throw new HttpError(404, 'Empresa não encontrada.');
    throw error;
  }

  return jsonResponse(200, { plan });
});
