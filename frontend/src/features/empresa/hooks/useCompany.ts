// Hooks do módulo empresa (TanStack Query): ler a empresa, cadastrar e ativar o plano.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { PlanId } from '../constants/plans';
import { activatePlan, createCompany, getCompany, type CreateCompanyInput } from '../services/companyService';

/** Nome da empresa no cache do TanStack Query. */
export const COMPANY_QUERY_KEY = ['empresa'] as const;

/**
 * Busca a empresa do usuário logado.
 * @param enabled - false para NÃO buscar (ex.: SuperAdmin, que não tem empresa)
 * @returns a consulta (data, isPending, isError...)
 */
export function useCompany(enabled = true) {
  return useQuery({ queryKey: COMPANY_QUERY_KEY, queryFn: getCompany, enabled });
}

/**
 * Cadastra a empresa (onboarding).
 * @returns a mutation (mutateAsync, isPending, error...)
 */
export function useCreateCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCompanyInput) => createCompany(input),
    // Manda buscar a empresa de novo (para vir junto o "access" do plano calculado pelo backend).
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COMPANY_QUERY_KEY }),
  });
}

/**
 * Ativa um plano (pagamento simulado) e recarrega a empresa.
 * @returns a mutation
 */
export function useActivatePlan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (planId: PlanId) => activatePlan(planId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: COMPANY_QUERY_KEY }),
  });
}
