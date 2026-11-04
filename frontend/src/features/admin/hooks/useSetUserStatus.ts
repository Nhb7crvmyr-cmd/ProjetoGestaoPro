// Hook que bloqueia/libera um usuário e atualiza a lista na tela em seguida.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { setUserStatus } from '../services/adminService';
import { ADMIN_USERS_QUERY_KEY } from './useAdminUsers';

/**
 * "Mutation" é como o TanStack Query chama uma ação que MUDA dados (diferente de "query", que só lê).
 * @returns mutate({ userId, enabled }), isPending, error...
 */
export function useSetUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, enabled }: { userId: string; enabled: boolean }) => setUserStatus(userId, enabled),
    // Deu certo? Marca a lista como "velha", e o TanStack Query busca de novo sozinho.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY }),
  });
}
