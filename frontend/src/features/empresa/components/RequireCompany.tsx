// "Porteiro" do onboarding: quem ainda não tem empresa (nem grupo) só pode ver a tela de cadastro da empresa.

import { Navigate, Outlet } from 'react-router';
import { useSession } from '../../auth/context/SessionContext';

/**
 * Regra do projeto: "usuário recém-cadastrado sem empresa acessa somente o onboarding".
 * Sem nenhum grupo (nem SuperAdmin, nem Dono, nem Funcionario) = ainda não fez o onboarding.
 * @returns as páginas internas ou um redirecionamento para /onboarding
 */
export function RequireCompany() {
  const { user } = useSession();
  if (user.groups.length === 0) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}
