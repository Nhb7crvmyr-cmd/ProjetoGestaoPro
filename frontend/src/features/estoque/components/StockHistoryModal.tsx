// Popup com o histórico de estoque de UM produto (somente Dono).

import { Alert } from '../../../components/ui/Alert';
import { Modal } from '../../../components/ui/Modal';
import type { Product } from '../../produtos/services/productService';
import { useMovements } from '../hooks/useStock';
import { MovementsTable } from './MovementsTable';

/** Propriedades do popup. */
interface StockHistoryModalProps {
  /** Produto cujo histórico será mostrado. Sem produto = popup fechado. */
  product?: Product;
  onClose: () => void;
}

/**
 * Desenha o popup. Só busca o histórico quando há produto (popup aberto).
 * @param props - produto e ação de fechar
 * @returns o modal
 */
export function StockHistoryModal({ product, onClose }: StockHistoryModalProps) {
  const movementsQuery = useMovements(product?.productId, Boolean(product));

  return (
    <Modal open={Boolean(product)} onClose={onClose} title={`Histórico: ${product?.name ?? ''}`} size="4xl">
      {movementsQuery.isPending && <p className="text-sm text-zinc-500">Carregando histórico…</p>}
      {movementsQuery.isError && <Alert type="error">{movementsQuery.error.message}</Alert>}
      {movementsQuery.isSuccess && <MovementsTable movements={movementsQuery.data} hideProduct />}
    </Modal>
  );
}
