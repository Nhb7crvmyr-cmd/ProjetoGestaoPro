// Erros padronizados das Lambdas: cada erro carrega o código HTTP e a mensagem para o usuário.

/**
 * Erro "esperado" (regra de negócio, validação, permissão).
 * Quando uma Lambda lança um HttpError, o withErrorHandling devolve esse status e essa mensagem.
 * Qualquer OUTRO erro vira 500 ("erro interno"), sem vazar detalhes técnicos para o navegador.
 */
export class HttpError extends Error {
  /**
   * @param statusCode - código HTTP (400 = dados inválidos, 403 = sem permissão, 404 = não encontrado...)
   * @param message - mensagem em português que o site vai mostrar
   */
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}
