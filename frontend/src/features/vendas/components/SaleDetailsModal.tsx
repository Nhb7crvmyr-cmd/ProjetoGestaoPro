// Popup com os detalhes de uma venda (itens, totais, pagamento) e as ações de cancelamento:
// - vendedor (Funcionário): "Solicitar cancelamento" com motivo. A venda NÃO some: fica aguardando o Dono.
// - Dono, com pedido pendente: "Aprovar cancelamento" (estoque volta) ou "Recusar e devolver ao vendedor" (com orientação).
// - Dono, venda concluída: "Cancelar venda" direto, com motivo.

import { useEffect, useState } from 'react';
import { Alert } from '../../../components/ui/Alert';
import { Modal } from '../../../components/ui/Modal';
import { formatCents, formatDateTime } from '../../../utils/formatters';
import { paymentLabel } from '../constants/paymentMethods';
import { useCancelSale, useRejectCancelSale, useRequestCancelSale } from '../hooks/useSales';
import { ROLE_LABELS } from '../../../types/auth';
import type { Sale } from '../services/saleService';
import { SaleActionForm } from './SaleActionForm';

/** Propriedades do popup. */
interface SaleDetailsModalProps {
  /** Venda aberta. Sem venda = popup fechado. */
  sale?: Sale;
  isOwner: boolean;
  currentUserId: string;
  onClose: () => void;
  onDone: (message: string) => void;
}

/** Estilo comum dos botões de ação da venda. */
const actionButton = 'inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold transition';

/** Qual ação está aberta (mostra o campo de texto correspondente). */
type Action = 'request' | 'approve' | 'reject' | 'cancel' | null;

/**
 * Desenha o popup.
 * @param props - venda, perfil e ações
 * @returns o modal
 */
export function SaleDetailsModal({ sale, isOwner, currentUserId, onClose, onDone }: SaleDetailsModalProps) {
  const cancelSale = useCancelSale();
  const requestCancel = useRequestCancelSale();
  const rejectCancel = useRejectCancelSale();
  const [action, setAction] = useState<Action>(null);

  useEffect(() => {
    setAction(null);
    cancelSale.reset();
    requestCancel.reset();
    rejectCancel.reset();
    // De propósito, só "sale": limpa ao abrir outra venda.
  }, [sale]);

  if (!sale) return null;
  const error = cancelSale.error ?? requestCancel.error ?? rejectCancel.error;

  /**
   * Roda uma ação na API, avisa a página e fecha o popup.
   * @param run - a chamada (mutateAsync)
   * @param message - mensagem de sucesso
   */
  async function runAction(run: () => Promise<unknown>, message: string) {
    try {
      await run();
      onDone(message);
      onClose();
    } catch {
      // O erro aparece no Alert (error).
    }
  }

  // Quem pode o quê.
  const canRequest = !isOwner && sale.status === 'COMPLETED' && sale.sellerId === currentUserId;
  const canDecide = isOwner && sale.status === 'CANCEL_REQUESTED';
  const canCancelDirect = isOwner && sale.status === 'COMPLETED';

  return (
    <Modal open onClose={onClose} title={`Venda #${sale.number}`} size="2xl">
      <div className="space-y-5">
        {/* Situação da venda. */}
        {sale.status === 'CANCELED' && (
          <Alert type="error">
            Cancelada em {sale.canceledAt ? formatDateTime(sale.canceledAt) : '—'}. Motivo: {sale.cancelReason}
          </Alert>
        )}
        {sale.status === 'CANCEL_REQUESTED' && sale.cancelRequest && (
          <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
            <p className="font-semibold">Aguardando decisão do {ROLE_LABELS.Dono}</p>
            <p>
              {sale.cancelRequest.requestedByName} pediu o cancelamento em {formatDateTime(sale.cancelRequest.requestedAt)}.
            </p>
            <p className="mt-1">Motivo: “{sale.cancelRequest.reason}”</p>
          </div>
        )}
        {sale.status === 'COMPLETED' && sale.lastCancelReview && (
          <div className="rounded-lg bg-sky-50 px-4 py-3 text-sm text-sky-900 ring-1 ring-sky-200">
            <p className="font-semibold">Cancelamento recusado por {sale.lastCancelReview.reviewedByName}</p>
            <p>Pedido: “{sale.lastCancelReview.requestReason}”</p>
            <p className="mt-1">
              Orientação: <strong>“{sale.lastCancelReview.note}”</strong>
            </p>
          </div>
        )}

        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {[
            ['Data', formatDateTime(sale.createdAt)],
            ['Cliente', sale.customerName],
            ['Vendedor', sale.sellerName],
            ['Pagamento', paymentLabel(sale.paymentMethod)],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-3 sm:block">
              <dt className="text-zinc-500">{label}</dt>
              <dd className="font-medium text-zinc-900">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="overflow-x-auto rounded-lg ring-1 ring-zinc-200">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-3 py-2 font-medium">Produto</th>
                <th className="px-3 py-2 text-right font-medium">Qtd.</th>
                <th className="px-3 py-2 text-right font-medium">Preço</th>
                <th className="px-3 py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {sale.items.map((item) => (
                <tr key={item.productId}>
                  <td className="px-3 py-2 text-zinc-900">{item.productName}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCents(item.unitPriceCents)}</td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums">{formatCents(item.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="ml-auto max-w-xs space-y-1 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-500">Subtotal</dt>
            <dd className="tabular-nums">{formatCents(sale.subtotalCents)}</dd>
          </div>
          {sale.discountCents > 0 && (
            <div className="flex justify-between">
              <dt className="text-zinc-500">Desconto</dt>
              <dd className="tabular-nums text-red-600">− {formatCents(sale.discountCents)}</dd>
            </div>
          )}
          <div className="flex justify-between text-base">
            <dt className="font-semibold">Total</dt>
            <dd className="font-bold tabular-nums">{formatCents(sale.totalCents)}</dd>
          </div>
        </dl>

        {sale.notes && <p className="rounded-lg bg-zinc-50 px-4 py-3 text-sm text-zinc-600">Obs.: {sale.notes}</p>}

        {/* Ações (só aparecem para quem pode). */}
        {(canRequest || canDecide || canCancelDirect) && (
          <div className="space-y-3 border-t border-zinc-200 pt-4">
            {error && <Alert type="error">{error.message}</Alert>}

            {/* Botões de verdade (e não links): ficam mais visíveis. Vermelho = cancela; da marca = mantém a venda. */}
            {action === null && (
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {canRequest && (
                  <button type="button" onClick={() => setAction('request')} className={`${actionButton} text-red-700 ring-1 ring-red-300 hover:bg-red-50`}>
                    Solicitar cancelamento
                  </button>
                )}
                {canDecide && (
                  <>
                    <button type="button" onClick={() => setAction('approve')} className={`${actionButton} bg-red-600 text-white hover:bg-red-700`}>
                      Aprovar cancelamento
                    </button>
                    <button type="button" onClick={() => setAction('reject')} className={`${actionButton} bg-brand-700 text-white hover:bg-brand-800`}>
                      Recusar e devolver ao vendedor
                    </button>
                  </>
                )}
                {canCancelDirect && (
                  <button type="button" onClick={() => setAction('cancel')} className={`${actionButton} text-red-700 ring-1 ring-red-300 hover:bg-red-50`}>
                    Cancelar venda
                  </button>
                )}
              </div>
            )}

            {action === 'request' && (
              <SaleActionForm
                label="Por que cancelar?"
                placeholder="Ex.: o cliente desistiu da compra"
                hint={`O ${ROLE_LABELS.Dono} vai analisar: ele pode aprovar ou devolver a venda para você com uma orientação.`}
                confirmLabel={`Enviar pedido ao ${ROLE_LABELS.Dono}`}
                tone="danger"
                isPending={requestCancel.isPending}
                onBack={() => setAction(null)}
                onConfirm={(reason) =>
                  runAction(() => requestCancel.mutateAsync({ saleId: sale.saleId, reason }), `Pedido de cancelamento da venda #${sale.number} enviado ao ${ROLE_LABELS.Dono}.`)
                }
              />
            )}
            {(action === 'approve' || action === 'cancel') && (
              <SaleActionForm
                label="Motivo do cancelamento"
                placeholder="Ex.: cliente desistiu, venda lançada errada…"
                initialValue={action === 'approve' ? sale.cancelRequest?.reason : ''}
                hint="Os produtos voltam para o estoque e tudo fica registrado no histórico."
                confirmLabel="Confirmar cancelamento"
                tone="danger"
                isPending={cancelSale.isPending}
                onBack={() => setAction(null)}
                onConfirm={(reason) =>
                  runAction(() => cancelSale.mutateAsync({ saleId: sale.saleId, reason }), `Venda #${sale.number} cancelada. O estoque foi devolvido.`)
                }
              />
            )}
            {action === 'reject' && (
              <SaleActionForm
                label="Orientação para o vendedor"
                placeholder="Ex.: ofereça 10% de desconto para o cliente"
                hint="A venda volta a valer e o vendedor vê esta orientação ao abrir a venda."
                confirmLabel="Recusar e devolver"
                tone="primary"
                isPending={rejectCancel.isPending}
                onBack={() => setAction(null)}
                onConfirm={(note) =>
                  runAction(() => rejectCancel.mutateAsync({ saleId: sale.saleId, note }), `Pedido recusado. A venda #${sale.number} voltou para ${sale.sellerName}.`)
                }
              />
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
