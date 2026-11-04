// Hook que busca a lista de empresas para o painel do SuperAdmin (TanStack Query).

import { useQuery } from '@tanstack/react-query';
import { listCompanies } from '../services/adminService';

/**
 * Busca as empresas. O resultado fica em cache com a chave ['admin', 'companies'].
 * @returns a consulta (data, isPending, isError, refetch...)
 */
export function useAdminCompanies() {
  return useQuery({ queryKey: ['admin', 'companies'], queryFn: listCompanies });
}
