// Contexto da sessão: deixa o usuário logado (e a função de atualizá-lo) disponível para TODAS as telas internas.
//
// CONCEITO "Context" do React: em vez de passar o usuário de componente em componente
// (pai → filho → neto...), colocamos em um "contexto". Qualquer componente lá dentro lê com useSession().

import { createContext, useContext } from 'react';
import type { SessionUser } from '../../../types/auth';

/** O que o contexto oferece. */
export interface SessionContextValue {
  user: SessionUser;
  /**
   * Pede ao Cognito um token NOVO e atualiza o usuário na tela.
   * Necessário depois de mudanças feitas pelo backend (ex.: virou "Dono" no onboarding).
   */
  refreshSession: () => Promise<void>;
}

/** O contexto em si. Começa "null": só existe dentro do RequireAuth. */
export const SessionContext = createContext<SessionContextValue | null>(null);

/**
 * Hook para ler a sessão em qualquer tela interna.
 * @returns o usuário logado e a função refreshSession
 */
export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession precisa estar dentro do RequireAuth');
  return value;
}
