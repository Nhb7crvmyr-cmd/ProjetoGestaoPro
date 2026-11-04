// Rotas do módulo clientes: cadastrar, listar, editar (Dono vê todos; Funcionario só os dele) e transferir atendimento (Dono).

import { HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import type { ApiRouteDefinition } from '../api-route-stack';
import { dynamoPolicy } from './policies';
import type { RouteDeps } from './route-deps';

/**
 * Monta as definições das rotas de clientes. Cada uma vira uma stack (ver api-route-stack.ts).
 * @param deps - tabela e User Pool
 * @returns a lista de rotas
 */
export function clientesRoutes({ table }: RouteDeps): ApiRouteDefinition[] {
  const environment = { TABLE_NAME: table.tableName };
  return [
    {
      stackId: 'Clientes-Create',
      functionName: 'clientes-create',
      entry: 'functions/clientes/createCustomer.ts',
      method: HttpMethod.POST,
      path: '/clientes',
      environment,
      // Só cria itens (cliente e trava do documento).
      policies: [dynamoPolicy(table, 'PutItem')],
    },
    {
      stackId: 'Clientes-List',
      functionName: 'clientes-list',
      entry: 'functions/clientes/listCustomers.ts',
      method: HttpMethod.GET,
      path: '/clientes',
      environment,
      policies: [dynamoPolicy(table, 'Query')],
    },
    {
      stackId: 'Clientes-Update',
      functionName: 'clientes-update',
      entry: 'functions/clientes/updateCustomer.ts',
      method: HttpMethod.PUT,
      path: '/clientes/{customerId}',
      environment,
      // Lê o atual, regrava o cliente e troca a trava do documento (apaga a antiga, cria a nova).
      policies: [dynamoPolicy(table, 'GetItem', 'PutItem', 'DeleteItem')],
    },
    {
      stackId: 'Clientes-Transfer',
      functionName: 'clientes-transfer',
      entry: 'functions/clientes/transferCustomers.ts',
      method: HttpMethod.POST,
      path: '/clientes/transferir',
      environment,
      // Lê o cliente e o funcionário de destino; atualiza só o atendente do cliente.
      policies: [dynamoPolicy(table, 'GetItem', 'UpdateItem')],
    },
  ];
}
