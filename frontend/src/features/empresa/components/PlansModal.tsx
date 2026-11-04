// Popup de planos com pagamento SIMULADO, em 3 passos: escolher → conferir e "pagar" → sucesso.

import { useState } from 'react';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { formatCents, formatDate } from '../../../utils/formatters';
import { PLANS, findPlan, type PlanId } from '../constants/plans';
import { useActivatePlan } from '../hooks/useCompany';
import { Icon } from '../../../components/ui/Icon';

/** Propriedades do popup. */
interface PlansModalProps {
  open: boolean;
  onClose: () => void;
  /** Plano atual (para marcar "Plano atual"). */
  currentPlanId?: PlanId | null;
}

/** Os passos do popup. Um "tipo união" garante que só existam estes 3 valores. */
type Step = 'choose' | 'checkout' | 'success';

/**
 * Desenha o popup de planos.
 * @param props - aberto/fechado, ação de fechar e plano atual
 * @returns o modal
 */
export function PlansModal({ open, onClose, currentPlanId }: PlansModalProps) {
  const [step, setStep] = useState<Step>('choose');
  const [selectedId, setSelectedId] = useState<PlanId | null>(null);
  const activatePlan = useActivatePlan();
  const selected = findPlan(selectedId);

  /** Fecha e volta ao 1º passo (para a próxima vez que abrir). */
  function handleClose() {
    onClose();
    setStep('choose');
    setSelectedId(null);
    activatePlan.reset();
  }

  /** Confirma o pagamento simulado. */
  async function handleConfirm() {
    if (!selectedId) return;
    try {
      await activatePlan.mutateAsync(selectedId);
      setStep('success');
    } catch {
      // O erro já aparece pelo activatePlan.error (Alert abaixo).
    }
  }

  const titles: Record<Step, string> = {
    choose: 'Escolha seu plano',
    checkout: 'Confirmar pagamento',
    success: 'Plano ativado!',
  };

  return (
    <Modal open={open} onClose={handleClose} title={titles[step]} size={step === 'choose' ? '4xl' : 'md'}>
      {step === 'choose' && (
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`flex flex-col rounded-xl p-5 ring-1 ${plan.highlighted ? 'ring-2 ring-brand-600' : 'ring-zinc-200'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-zinc-900">{plan.name}</h3>
                {plan.highlighted && (
                  <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">Mais escolhido</span>
                )}
              </div>
              <p className="mt-1 text-sm text-zinc-500">{plan.description}</p>
              <p className="mt-4">
                <span className="text-3xl font-bold tabular-nums text-zinc-900">{formatCents(plan.priceCents)}</span>
                <span className="text-sm text-zinc-500">/mês</span>
              </p>
              <ul className="mt-4 flex-1 space-y-2">
                {plan.benefits.map((feature) => (
                  <li key={feature} className="flex gap-2 text-sm text-zinc-700">
                    <Icon name="check" className="mt-0.5 size-4 text-brand-600" strokeWidth={2.5} />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-5"
                variant={plan.highlighted ? 'primary' : 'secondary'}
                onClick={() => {
                  setSelectedId(plan.id);
                  setStep('checkout');
                }}
              >
                {plan.id === currentPlanId ? 'Renovar plano atual' : `Escolher ${plan.name}`}
              </Button>
            </div>
          ))}
        </div>
      )}

      {step === 'checkout' && selected && (
        <div className="space-y-5">
          {/* Resumo do pedido. */}
          <dl className="divide-y divide-zinc-100 rounded-lg ring-1 ring-zinc-200">
            <div className="flex justify-between px-4 py-3 text-sm">
              <dt className="text-zinc-500">Plano</dt>
              <dd className="font-medium text-zinc-900">{selected.name}</dd>
            </div>
            <div className="flex justify-between px-4 py-3 text-sm">
              <dt className="text-zinc-500">Período</dt>
              <dd className="font-medium text-zinc-900">30 dias</dd>
            </div>
            <div className="flex justify-between px-4 py-3 text-sm">
              <dt className="text-zinc-500">Total</dt>
              <dd className="font-bold tabular-nums text-zinc-900">{formatCents(selected.priceCents)}</dd>
            </div>
          </dl>

          <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-amber-200">
            <strong>Pagamento simulado:</strong> ambiente de teste. Nenhuma cobrança será feita e nenhum dado de cartão é pedido.
          </div>

          {activatePlan.isError && <Alert type="error">{activatePlan.error.message}</Alert>}

          <div className="flex flex-col gap-3 sm:flex-row-reverse">
            <Button onClick={handleConfirm} isLoading={activatePlan.isPending}>
              {activatePlan.isPending ? 'Processando…' : 'Confirmar pagamento simulado'}
            </Button>
            <Button variant="secondary" onClick={() => setStep('choose')} disabled={activatePlan.isPending}>
              Voltar
            </Button>
          </div>
        </div>
      )}

      {step === 'success' && selected && (
        <div className="space-y-5 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <Icon name="check" className="size-7" strokeWidth={2.5} />
          </div>
          <p className="text-sm text-zinc-600">
            O plano <strong className="text-zinc-900">{selected.name}</strong> está ativo
            {activatePlan.data?.expiresAt && <> até <strong className="text-zinc-900">{formatDate(activatePlan.data.expiresAt)}</strong></>}.
          </p>
          <Button onClick={handleClose}>Continuar</Button>
        </div>
      )}
    </Modal>
  );
}
