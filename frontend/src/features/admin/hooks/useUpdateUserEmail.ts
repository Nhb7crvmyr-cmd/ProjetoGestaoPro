// Hook do suporte para trocar o e-mail (login) de um usuário e recarregar a lista de usuários.

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateUserEmail } from '../services/adminService';
import { ADMIN_USERS_QUERY_KEY } from './useAdminUsers';

/**
 * Troca o e-mail. Também recarrega a lista de empresas (o e-mail do dono aparece lá).
 * @returns a mutation
 */
export function useUpdateUserEmail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, email }: { userId: string; email: string }) => updateUserEmail(userId, email),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['admin', 'companies'] });
    },
  });
}
