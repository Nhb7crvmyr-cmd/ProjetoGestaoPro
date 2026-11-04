// Lambda POST /clientes/transferir: o Dono passa o atendimento de um ou vários clientes para outro atendente
// (ex.: funcionário desligado ou de folga). O novo atendente pode ser o próprio Dono ou um funcionário ATIVO.

import { getAuthContext, requireEmpresaId, requireGroup } from '../../shared/auth';
import { resolveTransferTarget, transferBodySchema, transferCustomerList } from '../../shared/customerTransfer';
import { jsonResponse, withErrorHandling } from '../../shared/http';
import { parseJsonBody, validate } from '../../shared/validation';

/**
 * Handler: a empresa vem do TOKEN do Dono, então ele só transfere clientes da própria empresa.
 * @param event - requisição da HTTP API
 * @returns 200 com { transferred, notFound, toSellerName }
 */
export const handler = withErrorHandling(async (event) => {
  const auth = getAuthContext(event);
  requireGroup(auth, 'Dono'); // só o Dono transfere atendimento na empresa
  const empresaId = requireEmpresaId(auth);
  const { customerIds, toSellerId } = validate(transferBodySchema, parseJsonBody(event.body));

  // O Dono logado é o dono desta empresa (o empresaId do token dele é o da empresa).
  const target = await resolveTransferTarget(empresaId, toSellerId, { id: auth.userId, name: auth.name || auth.email });
  const result = await transferCustomerList(empresaId, customerIds, target, { userId: auth.userId, name: auth.name || auth.email, role: 'Dono' });

  return jsonResponse(200, { ...result, toSellerName: target.name });
});
