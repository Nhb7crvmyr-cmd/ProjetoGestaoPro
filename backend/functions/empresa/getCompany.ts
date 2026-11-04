// Lambda GET /empresa: devolve os dados da empresa do usuário logado (Dono ou Funcionario)
// e o ACESSO efetivo do plano (o que está liberado agora), para o site mostrar os cadeados certos.

import { getAuthContext, requireEmpresaId, requireGroup } from '../../shared/auth';
import { getCompanyById } from '../../shared/company';
import { HttpError } from '../../shared/errors';
import { getPlanAccess } from '../../shared/planAccess';
import { jsonResponse, withErrorHandling } from '../../shared/http';

/**
 * Handler: o empresaId vem do TOKEN, então ninguém consegue ver a empresa de outra pessoa.
 * @param event - requisição da HTTP API
 * @returns 200 com { company, access }
 */
export const handler = withErrorHandling(async (event) => {
  const auth = getAuthContext(event);
  requireGroup(auth, 'Dono', 'Funcionario');

  const company = await getCompanyById(requireEmpresaId(auth));
  if (!company) throw new HttpError(404, 'Empresa não encontrada.');

  return jsonResponse(200, { company, access: getPlanAccess(company) });
});
