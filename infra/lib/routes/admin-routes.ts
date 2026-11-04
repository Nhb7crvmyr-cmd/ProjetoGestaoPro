// Rotas do módulo admin (painel do SuperAdmin): usuários, empresas e transferência de clientes (suporte).

import { HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { cognitoPolicy, dynamoPolicy } from './policies';
import type { ApiRouteDefinition } from '../api-route-stack';
import type { RouteDeps } from './route-deps';

/**
 * Monta as definições das rotas do admin. Cada uma vira uma stack (ver api-route-stack.ts).
 * @param deps - tabela e User Pool
 * @returns a lista de rotas
 */
export function adminRoutes({ table, userPool }: RouteDeps): ApiRouteDefinition[] {
  return [
    {
      stackId: 'Admin-ListUsers',
      functionName: 'admin-list-users',
      entry: 'functions/admin/listUsers.ts',
      method: HttpMethod.GET,
      path: '/admin/users',
      environment: { USER_POOL_ID: userPool.userPoolId },
      // Menor privilégio: só LEITURA de usuários, e só NESTE User Pool.
      policies: [
        new iam.PolicyStatement({
          actions: ['cognito-idp:ListUsers', 'cognito-idp:ListUsersInGroup'],
          resources: [userPool.userPoolArn],
        }),
      ],
    },
    {
      stackId: 'Admin-SetUserStatus',
      functionName: 'admin-set-user-status',
      entry: 'functions/admin/setUserStatus.ts',
      method: HttpMethod.POST,
      // {userId} é um "parâmetro de caminho": chega na Lambda em event.pathParameters.userId.
      path: '/admin/users/{userId}/status',
      environment: { USER_POOL_ID: userPool.userPoolId },
      policies: [
        new iam.PolicyStatement({
          actions: [
            'cognito-idp:AdminListGroupsForUser',
            'cognito-idp:AdminEnableUser',
            'cognito-idp:AdminDisableUser',
            'cognito-idp:AdminUserGlobalSignOut',
          ],
          resources: [userPool.userPoolArn],
        }),
      ],
    },
    {
      stackId: 'Admin-ListCompanies',
      functionName: 'admin-list-companies',
      entry: 'functions/admin/listCompanies.ts',
      method: HttpMethod.GET,
      path: '/admin/empresas',
      environment: { TABLE_NAME: table.tableName },
      // Só LEITURA por Query (não pode Scan nem gravar).
      policies: [new iam.PolicyStatement({ actions: ['dynamodb:Query'], resources: [table.tableArn] })],
    },
    {
      stackId: 'Admin-ListCompanyCustomers',
      functionName: 'admin-list-company-customers',
      entry: 'functions/admin/listCompanyCustomers.ts',
      method: HttpMethod.GET,
      path: '/admin/empresas/{empresaId}/clientes',
      environment: { TABLE_NAME: table.tableName, USER_POOL_ID: userPool.userPoolId },
      // Lê a empresa, os clientes e os funcionários; no Cognito, só o nome do Dono.
      policies: [dynamoPolicy(table, 'GetItem', 'Query'), cognitoPolicy(userPool, 'AdminGetUser')],
    },
    {
      stackId: 'Admin-TransferCompanyCustomers',
      functionName: 'admin-transfer-company-customers',
      entry: 'functions/admin/transferCompanyCustomers.ts',
      method: HttpMethod.POST,
      path: '/admin/empresas/{empresaId}/clientes/transferir',
      environment: { TABLE_NAME: table.tableName, USER_POOL_ID: userPool.userPoolId },
      policies: [dynamoPolicy(table, 'GetItem', 'UpdateItem'), cognitoPolicy(userPool, 'AdminGetUser')],
    },
    {
      stackId: 'Admin-UpdateUserEmail',
      functionName: 'admin-update-user-email',
      entry: 'functions/admin/updateUserEmail.ts',
      method: HttpMethod.POST,
      path: '/admin/users/{userId}/email',
      environment: { TABLE_NAME: table.tableName, USER_POOL_ID: userPool.userPoolId },
      // Lê e troca o e-mail no Cognito; corrige o e-mail copiado no funcionário e na lista de empresas.
      policies: [cognitoPolicy(userPool, 'AdminGetUser', 'AdminUpdateUserAttributes'), dynamoPolicy(table, 'UpdateItem')],
    },
    {
      stackId: 'Admin-SetCompanyPlan',
      functionName: 'admin-set-company-plan',
      entry: 'functions/admin/setCompanyPlan.ts',
      method: HttpMethod.POST,
      path: '/admin/empresas/{empresaId}/plano',
      environment: { TABLE_NAME: table.tableName },
      // Só atualiza o plano da empresa e o resumo no índice do admin.
      policies: [dynamoPolicy(table, 'UpdateItem')],
    },
  ];
}
