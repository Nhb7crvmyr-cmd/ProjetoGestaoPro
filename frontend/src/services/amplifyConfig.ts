// Configura o AWS Amplify (somente a parte de Auth) para conversar com o nosso Cognito.

import { Amplify } from 'aws-amplify';

/**
 * Lê os IDs do Cognito do .env.local e configura o Amplify.
 * Deve ser chamada UMA vez, antes de o React desenhar a primeira tela.
 * @returns nada; lança um erro claro se faltar alguma variável no .env.local
 */
export function configureAmplify(): void {
  // import.meta.env é como o Vite entrega as variáveis do arquivo .env.local.
  const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
  const userPoolClientId = import.meta.env.VITE_COGNITO_CLIENT_ID;

  if (!userPoolId || !userPoolClientId) {
    throw new Error('Faltam VITE_COGNITO_USER_POOL_ID e/ou VITE_COGNITO_CLIENT_ID no arquivo frontend/.env.local');
  }

  // O Amplify guarda os tokens do usuário logado no navegador (localStorage)
  // e os renova sozinho quando expiram.
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
        loginWith: { email: true },
        // Na confirmação do cadastro, o Cognito envia um CÓDIGO por e-mail (não um link).
        signUpVerificationMethod: 'code',
      },
    },
  });
}
