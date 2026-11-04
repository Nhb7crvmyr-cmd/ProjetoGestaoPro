// "Porteiro" das rotas protegidas: só deixa passar quem está logado; os outros vão para o login.
// Também fornece a SESSÃO (usuário + refreshSession) para todas as telas internas.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet } from 'react-router';
import type { SessionUser } from '../../../types/auth';
import { SessionContext, type SessionContextValue } from '../context/SessionContext';
import { getSessionUser, refreshSessionUser } from '../services/authService';

/**
 * Verifica a sessão e decide o que mostrar.
 * ATENÇÃO: isso só esconde telas. Quem protege os DADOS de verdade é o backend
 * (autorizador JWT + Lambdas), que confere o token em toda requisição.
 * @returns tela de carregamento, redirecionamento para /login ou as páginas protegidas
 */
export function RequireAuth() {
  // "undefined" = ainda verificando; "null" = ninguém logado; objeto = usuário logado.
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);

  // useEffect roda DEPOIS de a tela aparecer. É o lugar certo para buscar dados.
  // O array vazio [] no final significa: rodar só uma vez, quando o componente aparece.
  useEffect(() => {
    let active = true;
    getSessionUser().then((sessionUser) => {
      // "active" evita atualizar a tela se o componente já saiu dela antes da resposta.
      if (active) setUser(sessionUser);
    });
    return () => {
      active = false;
    };
  }, []);

  // useCallback "memoriza" a função: ela não é recriada a cada desenho da tela.
  const refreshSession = useCallback(async () => {
    setUser(await refreshSessionUser());
  }, []);

  // useMemo "memoriza" o objeto do contexto. Sem isso, toda tela que usa useSession()
  // seria redesenhada à toa sempre que o RequireAuth redesenhasse.
  const contextValue = useMemo<SessionContextValue | null>(
    () => (user ? { user, refreshSession } : null),
    [user, refreshSession],
  );

  if (user === undefined) {
    return <div className="flex min-h-dvh items-center justify-center text-sm text-zinc-500">Carregando…</div>;
  }

  // "replace" troca o endereço atual em vez de empilhar, para o botão "voltar" não cair em loop.
  if (user === null || !contextValue) return <Navigate to="/login" replace />;

  return (
    <SessionContext.Provider value={contextValue}>
      <Outlet />
    </SessionContext.Provider>
  );
}
