// Regra de validação (Zod) do parâmetro {userId} nas rotas: o id de um usuário do Cognito.

import * as z from 'zod/mini';

/**
 * O id do usuário no Cognito tem o formato 8-4-4-4-12 (ex.: f4c87448-70d1-70c5-c786-4295a17fc38d).
 * Usamos z.guid() e não z.uuid(): o z.uuid() exige o padrão RFC estrito, e os ids do Cognito
 * nem sempre seguem esse padrão (descobrimos isso testando na Etapa 4).
 */
export const userIdPathSchema = z.object({
  userId: z.guid('Usuário inválido.'),
});

/** Corpo para bloquear/liberar: { "enabled": true } libera, { "enabled": false } bloqueia. */
export const enabledBodySchema = z.object({
  enabled: z.boolean('Informe "enabled" como true ou false.'),
});
