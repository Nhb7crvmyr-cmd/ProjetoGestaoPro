// Lambda POST /empresa: onboarding. Cadastra a empresa (CNPJ ou CPF) e transforma o usuário em "Dono".

import { AdminAddUserToGroupCommand, AdminUpdateUserAttributesCommand } from '@aws-sdk/client-cognito-identity-provider';
import { TransactWriteCommand } from '@aws-sdk/lib-dynamodb';
import * as z from 'zod/mini';
import { requiredText, addressSchema } from '../../shared/addressSchema';
import { getAuthContext } from '../../shared/auth';
import { cognitoClient, getUserPoolId } from '../../shared/cognito';
import type { Company } from '../../shared/company';
import { isValidCnpj, isValidCpf, normalizeDocument } from '../../shared/documents';
import { dynamo, getTableName } from '../../shared/dynamo';
import { HttpError } from '../../shared/errors';
import { jsonResponse, withErrorHandling } from '../../shared/http';
import { companyIndexKey, companyKey, documentLockKey, userCompanyKey } from '../../shared/keys';
import { parseJsonBody, validate } from '../../shared/validation';

/** Dados que o site envia. Repare: NÃO há ownerId nem empresaId aqui. Esses vêm do token / são gerados. */
const bodySchema = z.object({
  documentType: z.enum(['CNPJ', 'CPF'], 'Escolha CNPJ ou CPF.'),
  document: z.string('Informe o CNPJ ou CPF.'),
  legalName: requiredText('Nome / razão social', 150),
  tradeName: z.optional(z.string().check(z.trim(), z.maxLength(150, 'Nome fantasia: no máximo 150 caracteres.'))),
  // z.pipe: primeiro limpa o texto (tira espaços, minúsculas), depois confere se é e-mail.
  email: z.pipe(z.string('Informe o e-mail.').check(z.trim(), z.toLowerCase()), z.email('E-mail inválido.')),
  phone: z.string('Informe o telefone.').check(z.regex(/^\d{10,11}$/, 'Telefone: DDD + número (10 ou 11 números).')),
  address: addressSchema,
});

/**
 * Handler do onboarding.
 * Passos: 1) valida  2) grava no DynamoDB em uma TRANSAÇÃO  3) atualiza o usuário no Cognito.
 * @param event - requisição da HTTP API
 * @returns 201 com { company }
 */
export const handler = withErrorHandling(async (event) => {
  const auth = getAuthContext(event);

  // Quem já tem grupo (SuperAdmin, Dono, Funcionario) ou empresa não pode fazer onboarding.
  if (auth.groups.length > 0 || auth.empresaId) {
    throw new HttpError(409, 'Sua conta já está vinculada a uma empresa.');
  }

  const body = validate(bodySchema, parseJsonBody(event.body));
  const document = normalizeDocument(body.document);
  const isValid = body.documentType === 'CNPJ' ? isValidCnpj(document) : isValidCpf(document);
  if (!isValid) throw new HttpError(400, `${body.documentType} inválido. Confira os números.`);

  const now = new Date().toISOString();
  const empresaId = crypto.randomUUID();
  const company: Company = {
    empresaId,
    documentType: body.documentType,
    document,
    legalName: body.legalName,
    // Texto vazio vira "sem nome fantasia".
    tradeName: body.tradeName || undefined,
    email: body.email,
    phone: body.phone,
    address: body.address,
    ownerId: auth.userId, // SEMPRE do token
    plan: { planId: null, status: 'PENDING' },
    createdAt: now,
  };
  const TableName = getTableName();

  // TRANSAÇÃO: as 4 gravações acontecem JUNTAS ou nenhuma acontece.
  // "attribute_not_exists(pk)" = só grava se aquela chave ainda NÃO existir. É assim que
  // impedimos CNPJ/CPF repetido e usuário com 2 empresas, mesmo com 2 cliques ao mesmo tempo.
  try {
    await dynamo.send(
      new TransactWriteCommand({
        TransactItems: [
          { Put: { TableName, Item: { ...companyKey(empresaId), ...company }, ConditionExpression: 'attribute_not_exists(pk)' } },
          {
            Put: {
              TableName,
              Item: { ...documentLockKey(document), empresaId, createdAt: now },
              ConditionExpression: 'attribute_not_exists(pk)',
            },
          },
          {
            Put: {
              TableName,
              Item: { ...userCompanyKey(auth.userId), empresaId, role: 'Dono', createdAt: now },
              ConditionExpression: 'attribute_not_exists(pk)',
            },
          },
          {
            // Resumo para a lista do SuperAdmin.
            Put: {
              TableName,
              Item: {
                ...companyIndexKey(empresaId),
                empresaId,
                documentType: company.documentType,
                document,
                legalName: company.legalName,
                tradeName: company.tradeName,
                city: company.address.city,
                state: company.address.state,
                ownerId: auth.userId,
                ownerEmail: auth.email,
                planId: null,
                planStatus: 'PENDING',
                createdAt: now,
              },
            },
          },
        ],
      }),
    );
  } catch (error) {
    // Se uma condição falhar, o DynamoDB diz QUAL item (pela posição na lista).
    const reasons = (error as { CancellationReasons?: { Code?: string }[] }).CancellationReasons;
    if (reasons?.[1]?.Code === 'ConditionalCheckFailed') {
      throw new HttpError(409, `Este ${body.documentType} já está cadastrado na plataforma.`);
    }
    if (reasons?.[2]?.Code === 'ConditionalCheckFailed') {
      throw new HttpError(409, 'Sua conta já está vinculada a uma empresa.');
    }
    throw error;
  }

  // Cognito: grava a empresa no usuário (vai para o token) e coloca no grupo "Dono".
  // O site precisa RENOVAR o token depois disso, para receber os dados novos.
  const userPoolId = getUserPoolId();
  await cognitoClient.send(
    new AdminUpdateUserAttributesCommand({
      UserPoolId: userPoolId,
      Username: auth.userId,
      UserAttributes: [{ Name: 'custom:empresaId', Value: empresaId }],
    }),
  );
  await cognitoClient.send(new AdminAddUserToGroupCommand({ UserPoolId: userPoolId, Username: auth.userId, GroupName: 'Dono' }));

  return jsonResponse(201, { company });
});
