// Rotas do módulo produtos: cadastrar e editar (Dono) e listar (Dono e Funcionario).

import { HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import type { ApiRouteDefinition } from '../api-route-stack';
import { dynamoPolicy } from './policies';
import type { RouteDeps } from './route-deps';

/**
 * Monta as definições das rotas de produtos. Cada uma vira uma stack (ver api-route-stack.ts).
 * @param deps - tabela e User Pool
 * @returns a lista de rotas
 */
export function produtosRoutes({ table }: RouteDeps): ApiRouteDefinition[] {
  const environment = { TABLE_NAME: table.tableName };
  return [
    {
      stackId: 'Produtos-Create',
      functionName: 'produtos-create',
      entry: 'functions/produtos/createProduct.ts',
      method: HttpMethod.POST,
      path: '/produtos',
      environment,
      // Só cria itens (produto, trava do SKU e movimento inicial).
      policies: [dynamoPolicy(table, 'PutItem')],
    },
    {
      stackId: 'Produtos-List',
      functionName: 'produtos-list',
      entry: 'functions/produtos/listProducts.ts',
      method: HttpMethod.GET,
      path: '/produtos',
      environment,
      policies: [dynamoPolicy(table, 'Query')],
    },
    {
      stackId: 'Produtos-Update',
      functionName: 'produtos-update',
      entry: 'functions/produtos/updateProduct.ts',
      method: HttpMethod.PUT,
      path: '/produtos/{productId}',
      environment,
      // Lê o atual, regrava o produto e troca a trava do SKU (apaga a antiga, cria a nova).
      policies: [dynamoPolicy(table, 'GetItem', 'PutItem', 'DeleteItem')],
    },
  ];
}
