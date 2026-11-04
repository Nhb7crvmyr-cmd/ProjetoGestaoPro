// Atalhos para criar permissões IAM de MENOR PRIVILÉGIO: sempre presas ao NOSSO User Pool ou à NOSSA tabela.

import type * as cognito from 'aws-cdk-lib/aws-cognito';
import type * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';

/**
 * Permissão de DynamoDB só na tabela do projeto.
 * @param table - a tabela
 * @param actions - ações sem o prefixo (ex.: 'GetItem', 'Query')
 * @returns a regra de permissão
 */
export function dynamoPolicy(table: dynamodb.ITable, ...actions: string[]): iam.PolicyStatement {
  return new iam.PolicyStatement({ actions: actions.map((action) => `dynamodb:${action}`), resources: [table.tableArn] });
}

/**
 * Permissão de Cognito só no User Pool do projeto.
 * @param userPool - o User Pool
 * @param actions - ações sem o prefixo (ex.: 'AdminGetUser')
 * @returns a regra de permissão
 */
export function cognitoPolicy(userPool: cognito.IUserPool, ...actions: string[]): iam.PolicyStatement {
  return new iam.PolicyStatement({ actions: actions.map((action) => `cognito-idp:${action}`), resources: [userPool.userPoolArn] });
}
