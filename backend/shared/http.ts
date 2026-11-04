// Ajudantes de resposta HTTP: formatam o JSON de saída e tratam erros de forma igual em todas as Lambdas.

import type { APIGatewayProxyEventV2WithJWTAuthorizer, APIGatewayProxyResultV2 } from 'aws-lambda';
import { HttpError } from './errors';

/** Tipo do evento que a Lambda recebe da HTTP API quando a rota tem autorizador JWT. */
export type ApiEvent = APIGatewayProxyEventV2WithJWTAuthorizer;

/** Tipo da função "handler" que toda Lambda da API exporta. */
export type ApiHandler = (event: ApiEvent) => Promise<APIGatewayProxyResultV2>;

/**
 * Monta uma resposta JSON.
 * Obs.: os cabeçalhos de CORS NÃO ficam aqui. Quem cuida deles é a própria HTTP API (infra/lib/api-stack.ts).
 * @param statusCode - código HTTP
 * @param body - objeto que será convertido em JSON
 * @returns resposta no formato que a HTTP API espera
 */
export function jsonResponse(statusCode: number, body: unknown): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify(body),
  };
}

/**
 * "Envolve" um handler com try/catch padrão. É um padrão chamado "higher-order function":
 * uma função que recebe uma função e devolve outra função, com comportamento extra.
 * @param handler - a lógica da Lambda
 * @returns um handler que nunca "estoura": sempre devolve uma resposta HTTP
 */
export function withErrorHandling(handler: ApiHandler): ApiHandler {
  return async (event) => {
    try {
      return await handler(event);
    } catch (error) {
      if (error instanceof HttpError) {
        return jsonResponse(error.statusCode, { message: error.message });
      }
      // console.error vai para o CloudWatch Logs (é onde investigamos os erros).
      console.error('Erro inesperado:', error);
      return jsonResponse(500, { message: 'Erro interno. Tente novamente mais tarde.' });
    }
  };
}
