// Formato do registro de FUNCIONÁRIO no banco e funções para lê-lo. Usado pelo módulo funcionarios.

import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { dynamo, getTableName } from './dynamo';
import { HttpError } from './errors';
import { employeeKey } from './keys';

/** Funcionário como fica gravado no DynamoDB (sem pk/sk). */
export interface Employee {
  /** Id do usuário no Cognito (é também o "vendedorId" nas vendas, na Etapa 9). */
  userId: string;
  empresaId: string;
  name: string;
  email: string;
  phone?: string;
  /** false = bloqueado pelo Dono. */
  enabled: boolean;
  /** Quem cadastrou (o Dono). */
  createdBy: string;
  createdAt: string;
}

/**
 * Busca um funcionário DENTRO da empresa informada.
 * Segurança: como a chave inclui o empresaId do token, um Dono nunca encontra
 * funcionário de outra empresa, mesmo que descubra o id dele.
 * @param empresaId - empresa do usuário logado (do token)
 * @param userId - id do funcionário
 * @returns o funcionário; lança 404 se não existir nesta empresa
 */
export async function getEmployeeOrThrow(empresaId: string, userId: string): Promise<Employee> {
  const { Item } = await dynamo.send(new GetCommand({ TableName: getTableName(), Key: employeeKey(empresaId, userId) }));
  if (!Item) throw new HttpError(404, 'Funcionário não encontrado.');
  const { pk: _pk, sk: _sk, ...employee } = Item;
  return employee as Employee;
}
