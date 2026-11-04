// Popup "Transferir atendimento": escolhe o novo atendente para um ou vários clientes.
// Genérico: o Dono (página Clientes) e o SuperAdmin (painel admin) usam o mesmo popup,
// cada um passando as opções de atendente e a função que faz a transferência na API.

import { useEffect, useState } from 'react';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { SelectField } from '../../../components/ui/SelectField';

/** O mínimo que o popup precisa saber de cada cliente. */
export interface TransferableCustomer {
  customerId: string;
  name: string;
  sellerId: string;
  sellerName: string;
}

/** Propriedades do popup. */
interface TransferCustomersModalProps {
  /** Clientes a transferir. Vazio = popup fechado. */
  customers: TransferableCustomer[];
  /** Atendentes que podem receber (value = id, label = nome). */
  options: { value: string; label: string }[];
  /** true enquanto as opções carregam. */
  optionsLoading?: boolean;
  /** Faz a transferência na API e devolve o resultado. */
  onTransfer: (customerIds: string[], toSellerId: string) => Promise<{ transferred: number; toSellerName: string }>;
  onClose: () => void;
  onDone: (message: string) => void;
}

/**
 * Desenha o popup.
 * @param props - clientes, opções, função de transferir e ações
 * @returns o modal
 */
export function TransferCustomersModal({ customers, options, optionsLoading, onTransfer, onClose, onDone }: TransferCustomersModalProps) {
  const open = customers.length > 0;
  const [toSellerId, setToSellerId] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Limpa o formulário a cada abertura.
  useEffect(() => {
    if (open) {
      setToSellerId('');
      setErrorMessage(null);
    }
  }, [open]);

  // Se todos os clientes são do mesmo atendente, ele não aparece como opção (não faz sentido transferir para ele).
  const currentSellers = new Set(customers.map((customer) => customer.sellerId));
  const singleCurrent = currentSellers.size === 1 ? [...currentSellers][0] : undefined;
  const availableOptions = options.filter((option) => option.value !== singleCurrent);

  /** Confirma a transferência. */
  async function handleConfirm() {
    if (!toSellerId) return;
    setIsPending(true);
    setErrorMessage(null);
    try {
      const result = await onTransfer(
        customers.map((customer) => customer.customerId),
        toSellerId,
      );
      onDone(`${result.transferred === 1 ? '1 cliente transferido' : `${result.transferred} clientes transferidos`} para ${result.toSellerName}.`);
      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Não foi possível transferir.');
    } finally {
      setIsPending(false);
    }
  }

  const title = customers.length === 1 ? 'Transferir atendimento' : `Transferir ${customers.length} clientes`;

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        {errorMessage && <Alert type="error">{errorMessage}</Alert>}

        <div className="rounded-lg bg-zinc-50 px-4 py-3 text-sm">
          {customers.length === 1 ? (
            <>
              <p className="font-medium text-zinc-900">{customers[0].name}</p>
              <p className="text-zinc-500">Atendido hoje por: {customers[0].sellerName}</p>
            </>
          ) : (
            <p className="text-zinc-700">
              {customers.length} clientes{singleCurrent ? ` de ${customers[0].sellerName}` : ''} vão passar para o novo atendente.
            </p>
          )}
        </div>

        <SelectField
          label="Novo atendente"
          placeholder={optionsLoading ? 'Carregando…' : 'Escolha quem vai atender'}
          options={availableOptions}
          value={toSellerId}
          onChange={(event) => setToSellerId(event.target.value)}
        />
        <p className="text-xs text-zinc-500">
          Funcionários bloqueados não aparecem. O novo atendente passa a ver estes clientes; o anterior deixa de ver.
        </p>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row-reverse">
          <Button onClick={handleConfirm} disabled={!toSellerId} isLoading={isPending}>
            {isPending ? 'Transferindo…' : 'Transferir'}
          </Button>
          <Button variant="secondary" onClick={onClose} disabled={isPending}>
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
