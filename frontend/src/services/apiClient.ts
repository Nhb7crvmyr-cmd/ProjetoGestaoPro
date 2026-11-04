// Cliente HTTP da nossa API: coloca o token do Cognito em toda chamada e padroniza os erros.

import { fetchAuthSession } from 'aws-amplify/auth';

/** Erro de uma chamada à API, com o status HTTP e a mensagem enviada pela Lambda. */
export class ApiError extends Error {
  /**
   * @param status - código HTTP (401, 403, 404, 500...)
   * @param message - mensagem em português vinda do backend
   */
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Faz uma chamada autenticada à API.
 * O token vai no cabeçalho "Authorization". A HTTP API confere esse token ANTES de chamar a Lambda.
 * @param path - caminho da rota (ex.: '/admin/users')
 * @param options - método, corpo etc. (as mesmas opções do fetch)
 * @returns o JSON da resposta, já com o tipo T
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  // fetchAuthSession devolve os tokens atuais. Se estiverem vencidos, o Amplify renova sozinho.
  // Usamos o idToken porque ele traz e-mail, nome e grupos do usuário.
  const { tokens } = await fetchAuthSession();
  const idToken = tokens?.idToken?.toString();
  if (!idToken) throw new ApiError(401, 'Sua sessão expirou. Entre novamente.');

  let response: Response;
  try {
    response = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
      ...options,
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${idToken}`,
        ...options.headers,
      },
    });
  } catch {
    // fetch só "estoura" quando nem chega a resposta (sem internet, CORS bloqueado...).
    throw new ApiError(0, 'Não foi possível falar com o servidor. Verifique sua conexão.');
  }

  // Tenta ler o JSON; algumas respostas de erro da API Gateway podem não ter corpo.
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const fallback: Record<number, string> = {
      401: 'Sua sessão expirou. Entre novamente.',
      403: 'Você não tem permissão para esta ação.',
      429: 'Muitas requisições. Aguarde alguns segundos.',
    };
    throw new ApiError(response.status, body.message ?? fallback[response.status] ?? 'Erro inesperado no servidor.');
  }
  return body as T;
}
