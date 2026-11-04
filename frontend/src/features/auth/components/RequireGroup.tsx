// "Porteiro" por grupo: só mostra a página se o usuário logado estiver em um dos grupos permitidos.

import { Navigate, Outlet } from 'react-router';
import type { UserGroup } from '../../../types/auth';
import { useSession } from '../context/SessionContext';

/** Propriedades do porteiro. */
interface RequireGroupProps {
  /** Grupos que podem ver as páginas filhas. */
  allowed: UserGroup[];
}

/**
 * Deve ficar DENTRO do RequireAuth (precisa da sessão).
 * Lembrete: isso só esconde a tela. Quem barra de verdade é a Lambda (requireGroup no backend).
 * @param props - grupos permitidos
 * @returns as páginas protegidas ou um redirecionamento para /inicio
 */
export function RequireGroup({ allowed }: RequireGroupProps) {
  const { user } = useSession();
  const isAllowed = user.groups.some((group) => allowed.includes(group));

  if (!isAllowed) return <Navigate to="/inicio" replace />;
  return <Outlet />;
}
