// Lambda POST /admin/empresas/{empresaId}/clientes/transferir: o SuperAdmin transfere o atendimento de clientes
// de uma empresa (suporte). Destinos: o Dono da empresa, um funcionário ativo dela ou o próprio SuperAdmin.

import { getAuthContext, requireGroup } from '../../shared/auth';
import { empresaIdPathSchema, getCompanyOwner } from '../../shared/companyOwner';
import { resolveTransferTarget, superAdminAttendant, transferBodySchema, transferCustomerList } from '../../shared/customerTransfer';
import { jsonResponse, withErrorHandling } from '../../shared/http';
import { parseJsonBody, validate } from '../../shared/validation';

/**
 * Handler: aqui a empresa vem da URL (o SuperAdmin não tem empresa no token).
 * Por isso a rota é exclusiva do SuperAdmin, e a transferência fica registrada com o papel "SuperAdmin".
 * @param event - requisição da HTTP API
 * @returns 200 com { transferred, notFound, toSellerName }
 */
export const handler = withErrorHandling(async (event) => {
  const auth = getAuthContext(event);
  requireGroup(auth, 'SuperAdmin');
  const { empresaId } = validate(empresaIdPathSchema, event.pathParameters ?? {});
  const { customerIds, toSellerId } = validate(transferBodySchema, parseJsonBody(event.body));

  const { owner } = await getCompanyOwner(empresaId); // 404 se a empresa não existir
  const target = await resolveTransferTarget(empresaId, toSellerId, owner, superAdminAttendant(auth));
  const result = await transferCustomerList(empresaId, customerIds, target, { userId: auth.userId, name: auth.name || auth.email, role: 'SuperAdmin' });

  return jsonResponse(200, { ...result, toSellerName: target.name });
});
