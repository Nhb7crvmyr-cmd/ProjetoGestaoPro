// Rotas do módulo empresa: onboarding (cadastro CNPJ/CPF), dados da empresa e plano (pagamento simulado).

import { HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import type { ApiRouteDefinition } from '../api-route-stack';
import type { RouteDeps } from './route-deps';

/**
 * Monta as definições das rotas da empresa. Cada uma vira uma stack (ver api-route-stack.ts).
 * @param deps - tabela e User Pool
 * @returns a lista de rotas
 */
export function empresaRoutes({ table, userPool }: RouteDeps): ApiRouteDefinition[] {
  return [
    {
      stackId: 'Empresa-Create',
      functionName: 'empresa-create',
      entry: 'functions/empresa/createCompany.ts',
      method: HttpMethod.POST,
      path: '/empresa',
      environment: { TABLE_NAME: table.tableName, USER_POOL_ID: userPool.userPoolId },
      policies: [
        // Só CRIAR itens (PutItem) na nossa tabela. A transação usa essa mesma permissão.
        new iam.PolicyStatement({ actions: ['dynamodb:PutItem'], resources: [table.tableArn] }),
        // No Cognito: só gravar o empresaId e colocar no grupo, neste User Pool.
        new iam.PolicyStatement({
          actions: ['cognito-idp:AdminUpdateUserAttributes', 'cognito-idp:AdminAddUserToGroup'],
          resources: [userPool.userPoolArn],
        }),
      ],
    },
    {
      stackId: 'Empresa-Get',
      functionName: 'empresa-get',
      entry: 'functions/empresa/getCompany.ts',
      method: HttpMethod.GET,
      path: '/empresa',
      environment: { TABLE_NAME: table.tableName },
      policies: [new iam.PolicyStatement({ actions: ['dynamodb:GetItem'], resources: [table.tableArn] })],
    },
    {
      stackId: 'Empresa-ActivatePlan',
      functionName: 'empresa-activate-plan',
      entry: 'functions/empresa/activatePlan.ts',
      method: HttpMethod.POST,
      path: '/empresa/plano',
      environment: { TABLE_NAME: table.tableName },
      policies: [new iam.PolicyStatement({ actions: ['dynamodb:UpdateItem'], resources: [table.tableArn] })],
    },
  ];
}
