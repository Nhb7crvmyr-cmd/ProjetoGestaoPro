// Rotas do módulo funcionarios: o Dono cadastra, lista, bloqueia/libera e reenvia o convite.

import { HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import type { ApiRouteDefinition } from '../api-route-stack';
import { cognitoPolicy, dynamoPolicy } from './policies';
import type { RouteDeps } from './route-deps';

/**
 * Monta as definições das rotas de funcionários. Cada uma vira uma stack (ver api-route-stack.ts).
 * @param deps - tabela e User Pool
 * @returns a lista de rotas
 */
export function funcionariosRoutes({ table, userPool }: RouteDeps): ApiRouteDefinition[] {
  const environment = { TABLE_NAME: table.tableName, USER_POOL_ID: userPool.userPoolId };

  /** Atalhos com o User Pool e a tabela já preenchidos (ver policies.ts). */
  const cognito = (...actions: string[]) => cognitoPolicy(userPool, ...actions);
  const dynamo = (...actions: string[]) => dynamoPolicy(table, ...actions);

  return [
    {
      stackId: 'Funcionarios-Create',
      functionName: 'funcionarios-create',
      entry: 'functions/funcionarios/createEmployee.ts',
      method: HttpMethod.POST,
      path: '/funcionarios',
      environment,
      // GetItem + Query: lê o plano da empresa e conta os funcionários ativos (limite do plano).
      policies: [cognito('AdminCreateUser', 'AdminAddUserToGroup'), dynamo('PutItem', 'GetItem', 'Query')],
    },
    {
      stackId: 'Funcionarios-List',
      functionName: 'funcionarios-list',
      entry: 'functions/funcionarios/listEmployees.ts',
      method: HttpMethod.GET,
      path: '/funcionarios',
      environment,
      policies: [cognito('AdminGetUser'), dynamo('Query')],
    },
    {
      stackId: 'Funcionarios-SetStatus',
      functionName: 'funcionarios-set-status',
      entry: 'functions/funcionarios/setEmployeeStatus.ts',
      method: HttpMethod.POST,
      path: '/funcionarios/{userId}/status',
      environment,
      policies: [cognito('AdminEnableUser', 'AdminDisableUser', 'AdminUserGlobalSignOut'), dynamo('GetItem', 'UpdateItem', 'Query')],
    },
    {
      stackId: 'Funcionarios-ResendInvite',
      functionName: 'funcionarios-resend-invite',
      entry: 'functions/funcionarios/resendInvite.ts',
      method: HttpMethod.POST,
      path: '/funcionarios/{userId}/convite',
      environment,
      policies: [cognito('AdminGetUser', 'AdminCreateUser'), dynamo('GetItem')],
    },
  ];
}
