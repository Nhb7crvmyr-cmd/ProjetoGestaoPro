// Validação de entradas com Zod: transforma dados "desconhecidos" em dados tipados ou devolve erro 400.
//
// Usamos "zod/mini", a versão compacta do Zod (vem no mesmo pacote "zod").
// O motivo é o tamanho: o código das Lambdas vai DENTRO do modelo do CloudFormation
// (para não precisar de bucket S3), e cada modelo tem limite de 51 KB.

import * as z from 'zod/mini';
import { HttpError } from './errors';

/**
 * Valida um dado com um schema do Zod.
 * @param schema - regras que o dado deve seguir
 * @param data - dado vindo de fora (corpo, parâmetros da URL...)
 * @returns o dado validado, já com o tipo certo
 */
export function validate<T extends z.ZodMiniType>(schema: T, data: unknown): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    // Pega a primeira mensagem de erro para mostrar ao usuário.
    throw new HttpError(400, result.error.issues[0]?.message ?? 'Dados inválidos.');
  }
  return result.data;
}

/**
 * Converte o corpo da requisição (texto) em objeto.
 * @param body - corpo bruto da requisição
 * @returns o objeto do JSON; lança 400 se o JSON for inválido
 */
export function parseJsonBody(body: string | undefined): unknown {
  if (!body) return {};
  try {
    return JSON.parse(body);
  } catch {
    throw new HttpError(400, 'JSON inválido.');
  }
}
