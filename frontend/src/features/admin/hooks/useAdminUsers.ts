// Hook que busca a lista de usuários com TanStack Query (cache, carregando, erro).

import { useQuery } from '@tanstack/react-query';
import { listUsers } from '../services/adminService';

/**
 * "queryKey" é o nome do dado no cache. Outras partes do app usam a mesma chave
 * para mandar recarregar (ex.: depois de bloquear alguém).
 */
export const ADMIN_USERS_QUERY_KEY = ['admin', 'users'] as const;

/**
 * Busca os usuários. O componente recebe prontos: data, isPending, isError, error, refetch...
 * @returns o resultado da consulta do TanStack Query
 */
export function useAdminUsers() {
  return useQuery({
    queryKey: ADMIN_USERS_QUERY_KEY,
    queryFn: listUsers,
  });
}
