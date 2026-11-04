// Cliente do Cognito (AWS SDK v3) compartilhado pelas Lambdas que administram usuários.

import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';

/**
 * Criado FORA do handler de propósito: a Lambda reaproveita o mesmo "container" entre
 * chamadas próximas ("warm start"), então o cliente é criado uma vez só e reutilizado.
 * A região vem automaticamente da variável AWS_REGION, que a própria Lambda define.
 */
export const cognitoClient = new CognitoIdentityProviderClient({});

/**
 * Lê o ID do User Pool das variáveis de ambiente (definidas no CDK).
 * @returns o ID do User Pool
 */
export function getUserPoolId(): string {
  const id = process.env.USER_POOL_ID;
  if (!id) throw new Error('Variável de ambiente USER_POOL_ID não definida');
  return id;
}
