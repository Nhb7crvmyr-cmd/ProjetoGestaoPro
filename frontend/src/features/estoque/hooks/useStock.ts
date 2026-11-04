// Hooks do módulo estoque (TanStack Query): histórico de movimentos e registro de movimento.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PRODUCTS_QUERY_KEY } from '../../produtos/hooks/useProducts';
import { createMovement, listMovements, type MovementInput } from '../services/stockService';

/**
 * Busca o histórico. A chave inclui o productId: cada produto tem o seu cache,
 * e ['estoque'] sozinho "pega" todos eles na hora de recarregar.
 * @param productId - filtra por produto (opcional)
 * @param enabled - false para não buscar (ex.: popup fechado)
 * @returns a consulta
 */
export function useMovements(productId?: string, enabled = true) {
  return useQuery({
    queryKey: ['estoque', 'movimentos', productId ?? 'todos'],
    queryFn: () => listMovements(productId),
    enabled,
  });
}

/** Registra um movimento e recarrega produtos (o estoque mudou) e o histórico. */
export function useCreateMovement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: MovementInput) => createMovement(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['estoque'] });
    },
  });
}
