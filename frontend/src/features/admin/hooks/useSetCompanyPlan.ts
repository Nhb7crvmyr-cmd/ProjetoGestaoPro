// Hook do suporte para definir o plano de uma empresa e recarregar a lista de empresas.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setCompanyPlan } from '../services/adminService';

/**
 * Define o plano.
 * @returns a mutation
 */
export function useSetCompanyPlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ empresaId, planId, validUntil }: { empresaId: string; planId: Parameters<typeof setCompanyPlan>[1]; validUntil?: string }) =>
      setCompanyPlan(empresaId, planId, validUntil),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] }),
  });
}
