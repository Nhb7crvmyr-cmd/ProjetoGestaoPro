// Hooks do SuperAdmin para os clientes de uma empresa (suporte): listar e transferir atendimento.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { listCompanyCustomers, transferCompanyCustomers } from '../services/adminService';

/**
 * Busca clientes e atendentes de uma empresa.
 * @param empresaId - id da empresa (vem da URL)
 * @returns a consulta
 */
export function useAdminCompanyCustomers(empresaId: string) {
  return useQuery({ queryKey: ['admin', 'empresa', empresaId, 'clientes'], queryFn: () => listCompanyCustomers(empresaId) });
}

/**
 * Transfere clientes da empresa e recarrega a lista.
 * @param empresaId - id da empresa
 * @returns a mutation
 */
export function useAdminTransferCustomers(empresaId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ customerIds, toSellerId }: { customerIds: string[]; toSellerId: string }) =>
      transferCompanyCustomers(empresaId, customerIds, toSellerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'empresa', empresaId, 'clientes'] }),
  });
}
