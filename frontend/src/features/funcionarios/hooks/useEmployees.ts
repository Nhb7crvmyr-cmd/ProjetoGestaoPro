// Hooks do módulo funcionarios (TanStack Query): listar, cadastrar, bloquear/liberar e reenviar convite.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createEmployee,
  listEmployees,
  resendInvite,
  setEmployeeStatus,
  type CreateEmployeeInput,
} from '../services/employeeService';

/** Nome da lista de funcionários no cache. */
const EMPLOYEES_QUERY_KEY = ['funcionarios'] as const;

/**
 * Busca os funcionários.
 * @param enabled - false para não buscar ainda (ex.: popup fechado)
 * @returns a consulta (data, isPending, isError, refetch...)
 */
export function useEmployees(enabled = true) {
  return useQuery({ queryKey: EMPLOYEES_QUERY_KEY, queryFn: listEmployees, enabled });
}

/**
 * Hook "fábrica": toda ação que muda funcionários recarrega a lista quando dá certo.
 * @returns a função que invalida (manda recarregar) a lista
 */
function useInvalidateEmployees() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: EMPLOYEES_QUERY_KEY });
}

/** Cadastra um funcionário. */
export function useCreateEmployee() {
  const invalidate = useInvalidateEmployees();
  return useMutation({ mutationFn: (input: CreateEmployeeInput) => createEmployee(input), onSuccess: invalidate });
}

/** Bloqueia/libera um funcionário. */
export function useSetEmployeeStatus() {
  const invalidate = useInvalidateEmployees();
  return useMutation({
    mutationFn: ({ userId, enabled }: { userId: string; enabled: boolean }) => setEmployeeStatus(userId, enabled),
    onSuccess: invalidate,
  });
}

/** Reenvia o convite. (Não muda a lista, então não precisa recarregar.) */
export function useResendInvite() {
  return useMutation({ mutationFn: (userId: string) => resendInvite(userId) });
}
