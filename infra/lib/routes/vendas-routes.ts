// Rotas do módulo vendas: registrar (Dono e Funcionario), listar por período, pedir cancelamento (Funcionario)
// e decidir o cancelamento: aprovar/cancelar direto ou recusar (só Dono).

import { HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import type { ApiRouteDefinition } from '../api-route-stack';
import { dynamoPolicy } from './policies';
import type { RouteDeps } from './route-deps';

/**
 * Monta as definições das rotas de vendas. Cada uma vira uma stack (ver api-route-stack.ts).
 * @param deps - tabela e User Pool
 * @returns a lista de rotas
 */
export function vendasRoutes({ table }: RouteDeps): ApiRouteDefinition[] {
  const environment = { TABLE_NAME: table.tableName };
  return [
    {
      stackId: 'Vendas-Create',
      functionName: 'vendas-create',
      entry: 'functions/vendas/createSale.ts',
      method: HttpMethod.POST,
      path: '/vendas',
      environment,
      // Lê cliente e produtos; atualiza o contador e o estoque; grava a venda e o histórico.
      policies: [dynamoPolicy(table, 'GetItem', 'UpdateItem', 'PutItem')],
    },
    {
      stackId: 'Vendas-List',
      functionName: 'vendas-list',
      entry: 'functions/vendas/listSales.ts',
      method: HttpMethod.GET,
      path: '/vendas',
      environment,
      policies: [dynamoPolicy(table, 'Query')],
    },
    {
      stackId: 'Vendas-Cancel',
      functionName: 'vendas-cancel',
      entry: 'functions/vendas/cancelSale.ts',
      method: HttpMethod.POST,
      path: '/vendas/{saleId}/cancelar',
      environment,
      // Lê a venda e os produtos; marca como cancelada; devolve o estoque; grava o histórico;
      // apaga o pedido pendente (quando é a aprovação de um pedido do vendedor).
      policies: [dynamoPolicy(table, 'GetItem', 'UpdateItem', 'PutItem', 'DeleteItem')],
    },
    {
      stackId: 'Vendas-RequestCancel',
      functionName: 'vendas-request-cancel',
      entry: 'functions/vendas/requestCancelSale.ts',
      method: HttpMethod.POST,
      path: '/vendas/{saleId}/solicitar-cancelamento',
      environment,
      // Lê a venda; muda o status; cria o pedido pendente.
      policies: [dynamoPolicy(table, 'GetItem', 'UpdateItem', 'PutItem')],
    },
    {
      stackId: 'Vendas-RejectCancel',
      functionName: 'vendas-reject-cancel',
      entry: 'functions/vendas/rejectCancelSale.ts',
      method: HttpMethod.POST,
      path: '/vendas/{saleId}/recusar-cancelamento',
      environment,
      // Lê a venda; volta o status; apaga o pedido pendente.
      policies: [dynamoPolicy(table, 'GetItem', 'UpdateItem', 'DeleteItem')],
    },
  ];
}
