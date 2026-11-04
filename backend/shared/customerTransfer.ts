// Transferência de atendimento de clientes: regra compartilhada pelo Dono (na empresa dele) e pelo SuperAdmin (suporte).

import { GetCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import * as z from 'zod/mini';
import type { AuthContext } from './auth';
import type { Customer } from './customer';
import { dynamo, getTableName } from './dynamo';
import { getEmployeeOrThrow } from './employee';
import { HttpError } from './errors';
import { customerKey } from './keys';

/** No máximo 100 clientes por chamada (protege a capacidade de escrita da tabela: 5 por segundo). */
export const MAX_TRANSFER = 100;

/** Corpo da requisição de transferência. */
export const transferBodySchema = z.object({
  customerIds: z
    .array(z.guid('Cliente inválido.'))
    .check(z.minLength(1, 'Escolha ao menos um cliente.'), z.maxLength(MAX_TRANSFER, `No máximo ${MAX_TRANSFER} clientes por vez.`)),
  toSellerId: z.guid('Atendente inválido.'),
});

/** Quem pode receber clientes: o Dono, um funcionário ativo ou (pelo painel admin) o próprio SuperAdmin. */
export interface TransferTarget {
  id: string;
  name: string;
  email?: string;
}

/**
 * O SuperAdmin logado como atendente (para assumir clientes durante um suporte).
 * @param auth - o SuperAdmin logado
 * @returns id, nome e e-mail dele
 */
export function superAdminAttendant(auth: AuthContext): TransferTarget {
  return { id: auth.userId, name: auth.name ? `${auth.name} (suporte)` : 'Suporte', email: auth.email };
}

/**
 * Confere o novo atendente e descobre o nome dele.
 * @param empresaId - empresa dos clientes
 * @param toSellerId - id do novo atendente
 * @param owner - o Dono da empresa (id e nome)
 * @param extra - outro destino aceito além do Dono e dos funcionários (o SuperAdmin, no painel admin)
 * @returns o atendente de destino
 */
export async function resolveTransferTarget(
  empresaId: string,
  toSellerId: string,
  owner: TransferTarget,
  extra?: TransferTarget,
): Promise<TransferTarget> {
  if (toSellerId === owner.id) return owner;
  if (extra && toSellerId === extra.id) return extra;
  // Funcionário DESTA empresa (404 se não for) e ativo.
  const employee = await getEmployeeOrThrow(empresaId, toSellerId);
  if (!employee.enabled) throw new HttpError(400, `O acesso de ${employee.name} está bloqueado. Libere em Funcionários antes de transferir.`);
  return { id: employee.userId, name: employee.name };
}

/**
 * Passa os clientes para o novo atendente, um por vez, guardando a última transferência.
 * @param empresaId - empresa dos clientes (do token, para o Dono; da URL validada, para o SuperAdmin)
 * @param customerIds - clientes a transferir
 * @param target - novo atendente
 * @param by - quem está fazendo (id, nome e papel)
 * @returns quantos foram transferidos e quantos não existiam nesta empresa
 */
export async function transferCustomerList(
  empresaId: string,
  customerIds: string[],
  target: TransferTarget,
  by: { userId: string; name: string; role: 'Dono' | 'SuperAdmin' },
): Promise<{ transferred: number; notFound: number }> {
  const TableName = getTableName();
  const now = new Date().toISOString();
  let transferred = 0;
  let notFound = 0;

  // new Set tira ids repetidos. Um por vez para não estourar a capacidade de escrita.
  for (const customerId of new Set(customerIds)) {
    // Lê o cliente para saber quem atende hoje. A chave usa o empresaId: cliente de outra empresa "não existe".
    const { Item } = await dynamo.send(new GetCommand({ TableName, Key: customerKey(empresaId, customerId) }));
    if (!Item) {
      notFound++;
      continue;
    }
    const current = Item as Customer;
    if (current.sellerId === target.id) continue; // já é desse atendente

    await dynamo.send(
      new UpdateCommand({
        TableName,
        Key: customerKey(empresaId, customerId),
        UpdateExpression: 'SET sellerId = :toId, sellerName = :toName, lastTransfer = :transfer, updatedAt = :now',
        // Só grava se o atendente ainda for o que lemos (ninguém transferiu no meio do caminho).
        ConditionExpression: 'sellerId = :fromId',
        ExpressionAttributeValues: {
          ':fromId': current.sellerId,
          ':toId': target.id,
          ':toName': target.name,
          ':now': now,
          // Histórico da última transferência: de quem, para quem, quem fez (e com qual papel) e quando.
          ':transfer': {
            fromSellerId: current.sellerId,
            fromSellerName: current.sellerName,
            toSellerId: target.id,
            toSellerName: target.name,
            byUserId: by.userId,
            byName: by.name,
            byRole: by.role,
            at: now,
          },
        },
      }),
    );
    transferred++;
  }
  return { transferred, notFound };
}
