// Hooks do módulo vendas (TanStack Query): listar por período, registrar, cancelar e o fluxo de pedido de cancelamento.

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PRODUCTS_QUERY_KEY } from '../../produtos/hooks/useProducts';
import { cancelSale, createSale, listSales, rejectCancelSale, requestCancelSale, type SaleInput } from '../services/saleService';

/**
 * Busca as vendas do período. Cada período tem o seu cache (a chave inclui as datas).
 * @param from - início (ISO)
 * @param to - fim (ISO)
 * @returns a consulta
 */
export function useSales(from: string, to: string) {
  return useQuery({ queryKey: ['vendas', from, to], queryFn: () => listSales(from, to) });
}

/**
 * Depois de vender ou cancelar, o estoque mudou: recarrega vendas, produtos e histórico de estoque.
 * @returns função que manda recarregar
 */
function useRefreshAfterSale() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['vendas'] });
    queryClient.invalidateQueries({ queryKey: PRODUCTS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: ['estoque'] });
  };
}

/** Registra uma venda. */
export function useCreateSale() {
  const refresh = useRefreshAfterSale();
  return useMutation({ mutationFn: (input: SaleInput) => createSale(input), onSuccess: refresh });
}

/** Cancela uma venda (somente Dono). */
export function useCancelSale() {
  const refresh = useRefreshAfterSale();
  return useMutation({
    mutationFn: ({ saleId, reason }: { saleId: string; reason: string }) => cancelSale(saleId, reason),
    onSuccess: refresh,
  });
}

/** Funcionário: pede o cancelamento. Só recarrega as vendas (o estoque ainda não muda). */
export function useRequestCancelSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ saleId, reason }: { saleId: string; reason: string }) => requestCancelSale(saleId, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendas'] }),
  });
}

/** Dono: recusa o pedido e devolve a venda ao vendedor. */
export function useRejectCancelSale() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ saleId, note }: { saleId: string; note: string }) => rejectCancelSale(saleId, note),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendas'] }),
  });
}
