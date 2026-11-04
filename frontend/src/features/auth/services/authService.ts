// Serviço de autenticação: única parte do site que conversa com o Cognito (via Amplify).
//
// Por que um arquivo só para isso? Se um dia trocarmos o Amplify por outra biblioteca,
// só este arquivo muda. As páginas continuam chamando as mesmas funções.

import {
  confirmSignIn,
  confirmSignUp,
  fetchAuthSession,
  getCurrentUser,
  resendSignUpCode,
  signIn,
  signOut,
  signUp,
  updateUserAttributes,
} from 'aws-amplify/auth';
import type { SessionUser, UserGroup } from '../../../types/auth';

/**
 * O que pode acontecer depois de um login:
 * - SIGNED_IN: entrou;
 * - NEEDS_CONFIRMATION: e-mail ainda não confirmado (cadastro próprio);
 * - NEW_PASSWORD_REQUIRED: funcionário no 1º acesso, entrando com a senha temporária do convite.
 */
export type SignInResult = 'SIGNED_IN' | 'NEEDS_CONFIRMATION' | 'NEW_PASSWORD_REQUIRED';

/**
 * Faz login com e-mail e senha.
 * @param email - e-mail do usuário
 * @param password - senha
 * @returns 'SIGNED_IN' se entrou, ou 'NEEDS_CONFIRMATION' se o e-mail ainda não foi confirmado
 */
export async function signInWithEmail(email: string, password: string): Promise<SignInResult> {
  // O Amplify usa o fluxo SRP: a senha não é enviada pela rede, só uma "prova" matemática.
  const { nextStep } = await signIn({ username: email, password });

  // O Cognito pode pedir passos extras ("nextStep"). Com a nossa configuração
  // (sem MFA), só esperamos 2: login concluído ou e-mail ainda não confirmado.
  if (nextStep.signInStep === 'DONE') return 'SIGNED_IN';
  if (nextStep.signInStep === 'CONFIRM_SIGN_UP') return 'NEEDS_CONFIRMATION';
  if (nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') return 'NEW_PASSWORD_REQUIRED';

  throw new Error(`Etapa de login não suportada: ${nextStep.signInStep}`);
}

/**
 * Conclui o 1º acesso do funcionário: troca a senha temporária pela senha definitiva.
 * Precisa ser chamada logo depois do signInWithEmail que devolveu 'NEW_PASSWORD_REQUIRED'
 * (o Amplify guarda o "desafio" do Cognito na memória da página entre as duas chamadas).
 * @param newPassword - a nova senha (já validada pelo Zod)
 * @returns nada; lança erro se o Cognito recusar
 */
export async function completeNewPassword(newPassword: string): Promise<void> {
  const { nextStep } = await confirmSignIn({ challengeResponse: newPassword });
  if (nextStep.signInStep !== 'DONE') throw new Error(`Etapa de login não suportada: ${nextStep.signInStep}`);
}

/**
 * Cadastra um novo usuário. O Cognito envia um código de 6 dígitos para o e-mail.
 * @param name - nome completo
 * @param email - e-mail (também é o login)
 * @param password - senha (já validada pelo Zod)
 * @returns nada; lança erro se o Cognito recusar (ex.: e-mail já cadastrado)
 */
export async function registerUser(name: string, email: string, password: string): Promise<void> {
  await signUp({
    username: email,
    password,
    // "Atributos" são os dados extras do usuário. "name" é obrigatório no nosso User Pool.
    options: { userAttributes: { email, name } },
  });
}

/**
 * Confirma o cadastro com o código recebido por e-mail.
 * @param email - e-mail usado no cadastro
 * @param code - código de 6 dígitos
 * @returns nada; lança erro se o código estiver errado ou expirado
 */
export async function confirmRegistration(email: string, code: string): Promise<void> {
  await confirmSignUp({ username: email, confirmationCode: code });
}

/**
 * Pede ao Cognito um novo código de confirmação.
 * @param email - e-mail usado no cadastro
 * @returns nada
 */
export async function resendConfirmationCode(email: string): Promise<void> {
  await resendSignUpCode({ username: email });
}

/**
 * Sai da conta: apaga os tokens guardados no navegador.
 * @returns nada
 */
export async function signOutUser(): Promise<void> {
  await signOut();
}

/**
 * Lê os dados do usuário logado a partir do token de identidade (idToken) do Cognito.
 * @returns os dados do usuário, ou null se ninguém estiver logado
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    // getCurrentUser falha se não houver ninguém logado.
    await getCurrentUser();

    // O idToken é um JWT: um texto assinado pelo Cognito com os dados do usuário dentro
    // ("claims"). O "payload" é a parte com esses dados.
    const { tokens } = await fetchAuthSession();
    const payload = tokens?.idToken?.payload;
    if (!payload) return null;

    return {
      userId: String(payload.sub),
      name: String(payload.name ?? ''),
      email: String(payload.email ?? ''),
      // "cognito:groups" só existe no token se o usuário estiver em algum grupo.
      groups: (payload['cognito:groups'] as UserGroup[] | undefined) ?? [],
      // Atributos personalizados aparecem no token com o prefixo "custom:".
      empresaId: String(payload['custom:empresaId'] ?? ''),
      jobTitle: String(payload['custom:jobTitle'] ?? ''),
      department: String(payload['custom:department'] ?? ''),
    };
  } catch {
    return null;
  }
}

/**
 * Força a renovação do token (pede um NOVO ao Cognito, mesmo que o atual não tenha vencido)
 * e lê o usuário de novo. Usado depois que o backend muda grupo/atributos do usuário.
 * @returns o usuário atualizado, ou null se a sessão tiver acabado
 */
export async function refreshSessionUser(): Promise<SessionUser | null> {
  await fetchAuthSession({ forceRefresh: true });
  return getSessionUser();
}

/**
 * Atualiza o perfil da própria pessoa direto no Cognito (sem Lambda): nome, cargo e área.
 * Funciona porque o client do site tem permissão de ESCRITA nesses atributos (infra/lib/auth-stack.ts).
 * O empresaId NÃO está nessa lista: o site nunca consegue mudá-lo.
 * Texto vazio em cargo/área apaga o valor.
 * @param profile - nome, cargo e área
 * @returns nada; depois disso, renove a sessão para o token trazer os dados novos
 */
export async function updateProfile(profile: { name: string; jobTitle: string; department: string }): Promise<void> {
  await updateUserAttributes({
    userAttributes: {
      name: profile.name,
      'custom:jobTitle': profile.jobTitle,
      'custom:department': profile.department,
    },
  });
}
