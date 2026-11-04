// Hooks do módulo clientes (TanStack Query): listar, cadastrar, editar e transferir atendimento.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createCustomer, listCustomers, transferCustomers, updateCustomer, type CustomerInput } from '../services/customerService';

/** Nome da lista de clientes no cache. Exportado: as vendas (Etapa 9) também vão usar. */
export const CUSTOMERS_QUERY_KEY = ['clientes'] as const;

/**
 * Busca os clientes.
 * @returns a consulta (data, isPending, isError...)
 */
export function useCustomers() {
  return useQuery({ queryKey: CUSTOMERS_QUERY_KEY, queryFn: listCustomers });
}

/** Cadastra um cliente e recarrega a lista. */
export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CustomerInput) => createCustomer(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY }),
  });
}

/** Edita um cliente e recarrega a lista. */
export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, input }: { customerId: string; input: CustomerInput & { active: boolean } }) =>
      updateCustomer(customerId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY }),
  });
}

/** Transfere o atendimento (somente Dono) e recarrega a lista. */
export function useTransferCustomers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ customerIds, toSellerId }: { customerIds: string[]; toSellerId: string }) =>
      transferCustomers(customerIds, toSellerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CUSTOMERS_QUERY_KEY }),
  });
}
