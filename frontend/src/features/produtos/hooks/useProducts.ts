// Hooks do módulo produtos (TanStack Query): listar, cadastrar e editar.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createProduct, listProducts, updateProduct, type ProductInput } from '../services/productService';

/** Nome da lista de produtos no cache. Exportado: o módulo estoque recarrega a lista depois de um movimento. */
export const PRODUCTS_QUERY_KEY = ['produtos'] as const;

/**
 * Busca os produtos.
 * @returns a consulta (data, isPending, isError...)
 */
export function useProducts() {
  return useQuery({ queryKey: PRODUCTS_QUERY_KEY, queryFn: listProducts });
}

/** Cadastra um produto e recarrega a lista (e o histórico, se houve estoque inicial). */
export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProductInput & { initialStock?: number }) => createProduct(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ['estoque'] });
    },
  });
}

/** Edita um produto e recarrega a lista. */
export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, input }: { productId: string; input: ProductInput & { active: boolean } }) =>
      updateProduct(productId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY }),
  });
}
