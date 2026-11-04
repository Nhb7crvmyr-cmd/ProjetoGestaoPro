// Cliente do DynamoDB compartilhado pelas Lambdas (com o "DocumentClient", que facilita ler e gravar).

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, type TransactWriteCommandInput } from '@aws-sdk/lib-dynamodb';

/**
 * O DynamoDB "puro" exige escrever cada valor com o tipo junto: { S: "texto" }, { N: "10" }...
 * O DocumentClient faz essa conversão sozinho: gravamos e lemos objetos JavaScript normais.
 * Criado fora do handler para ser reutilizado entre chamadas ("warm start").
 */
export const dynamo = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  // Ignora campos "undefined" em vez de dar erro (ex.: complemento de endereço vazio).
  marshallOptions: { removeUndefinedValues: true },
});

/**
 * Lê o nome da tabela das variáveis de ambiente (definida no CDK).
 * @returns o nome da tabela
 */
export function getTableName(): string {
  const name = process.env.TABLE_NAME;
  if (!name) throw new Error('Variável de ambiente TABLE_NAME não definida');
  return name;
}

/** Tipo da lista de gravações de uma transação (cada item é um Put, Update, Delete ou ConditionCheck). */
export type TransactItems = NonNullable<TransactWriteCommandInput['TransactItems']>;
