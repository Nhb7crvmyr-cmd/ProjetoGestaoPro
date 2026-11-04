// Traduz os erros do Cognito (que vêm em inglês, com nomes técnicos) para mensagens em português.

/**
 * Mapa "nome do erro do Cognito" → "mensagem para o usuário".
 * O "name" do erro é estável; a mensagem em inglês pode mudar. Por isso usamos o name.
 */
const messages: Record<string, string> = {
  // Com "preventUserExistenceErrors" ligado (infra), e-mail inexistente também vira
  // NotAuthorizedException. Assim, ninguém descobre quais e-mails têm conta.
  NotAuthorizedException: 'E-mail ou senha incorretos.',
  UserNotFoundException: 'E-mail ou senha incorretos.',
  UsernameExistsException: 'Já existe uma conta com este e-mail.',
  InvalidPasswordException: 'A senha não atende às regras de segurança.',
  CodeMismatchException: 'Código incorreto. Confira o e-mail e tente de novo.',
  ExpiredCodeException: 'Este código expirou. Clique em "Reenviar código".',
  LimitExceededException: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
  TooManyRequestsException: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
  TooManyFailedAttemptsException: 'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
  CodeDeliveryFailureException: 'Não conseguimos enviar o e-mail. Tente de novo mais tarde.',
  NetworkError: 'Sem conexão com a internet. Verifique sua rede.',
};

/**
 * Converte qualquer erro em uma mensagem amigável.
 * @param error - erro capturado no "catch" (pode ser de qualquer tipo)
 * @returns mensagem em português para mostrar na tela
 */
export function translateAuthError(error: unknown): string {
  // "error instanceof Error" confirma que é um objeto de erro antes de ler ".name".
  if (error instanceof Error && messages[error.name]) {
    return messages[error.name];
  }
  // Mostra o detalhe técnico no console do navegador (F12) para ajudar a depurar.
  console.error('Erro de autenticação não mapeado:', error);
  return 'Não foi possível concluir. Tente novamente.';
}
