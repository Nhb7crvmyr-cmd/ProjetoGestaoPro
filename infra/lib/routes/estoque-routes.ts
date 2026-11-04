// Rotas do módulo estoque (somente Dono): registrar movimento (entrada/saída/ajuste) e ver o histórico.

import { HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import type { ApiRouteDefinition } from '../api-route-stack';
import { dynamoPolicy } from './policies';
import type { RouteDeps } from './route-deps';

/**
 * Monta as definições das rotas de estoque. Cada uma vira uma stack (ver api-route-stack.ts).
 * @param deps - tabela e User Pool
 * @returns a lista de rotas
 */
export function estoqueRoutes({ table }: RouteDeps): ApiRouteDefinition[] {
  const environment = { TABLE_NAME: table.tableName };
  return [
    {
      stackId: 'Estoque-CreateMovement',
      functionName: 'estoque-create-movement',
      entry: 'functions/estoque/createMovement.ts',
      method: HttpMethod.POST,
      path: '/estoque/movimentos',
      environment,
      // Lê o produto, atualiza o estoque e grava o movimento no histórico.
      policies: [dynamoPolicy(table, 'GetItem', 'UpdateItem', 'PutItem')],
    },
    {
      stackId: 'Estoque-ListMovements',
      functionName: 'estoque-list-movements',
      entry: 'functions/estoque/listMovements.ts',
      method: HttpMethod.GET,
      path: '/estoque/movimentos',
      environment,
      policies: [dynamoPolicy(table, 'Query')],
    },
  ];
}
