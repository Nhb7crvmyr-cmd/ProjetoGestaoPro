// Popup do suporte "Plano da empresa": escolhe o plano e até quando vale (cortesia, teste, correção), ou remove.

import { useEffect, useState } from 'react';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { SelectField } from '../../../components/ui/SelectField';
import { TextField } from '../../../components/ui/TextField';
import { formatDate } from '../../../utils/formatters';
import { PLANS } from '../../empresa/constants/plans';
import { useSetCompanyPlan } from '../hooks/useSetCompanyPlan';
import type { AdminCompany } from '../services/adminService';

/** Opções: os 3 planos + remover. */
const OPTIONS = [...PLANS.map((plan) => ({ value: plan.id, label: plan.name })), { value: 'none', label: 'Sem plano (remover)' }];

/**
 * Data de hoje + N dias no formato AAAA-MM-DD (o que o <input type="date"> usa).
 * @param days - quantos dias somar
 * @returns a data
 */
function inDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  // "sv-SE" formata como AAAA-MM-DD (truque comum para pegar a data local nesse formato).
  return date.toLocaleDateString('sv-SE');
}

/** Propriedades do popup. */
interface SetPlanModalProps {
  /** Empresa. Sem empresa = popup fechado. */
  company?: AdminCompany;
  onClose: () => void;
  onDone: (message: string) => void;
}

/**
 * Desenha o popup.
 * @param props - empresa e ações
 * @returns o modal
 */
export function SetPlanModal({ company, onClose, onDone }: SetPlanModalProps) {
  const setPlan = useSetCompanyPlan();
  const [planId, setPlanId] = useState('profissional');
  const [validUntil, setValidUntil] = useState(inDays(30));

  useEffect(() => {
    if (company) {
      setPlanId(company.planId ?? 'profissional');
      setValidUntil(inDays(30));
      setPlan.reset();
    }
    // De propósito, só "company": recarrega ao abrir para outra empresa.
  }, [company]);

  if (!company) return null;
  const removing = planId === 'none';
  const name = company.tradeName || company.legalName;

  /** Salva. */
  async function handleSave() {
    if (!company) return;
    try {
      await setPlan.mutateAsync({ empresaId: company.empresaId, planId: planId as Parameters<typeof setPlan.mutateAsync>[0]['planId'], validUntil: removing ? undefined : validUntil });
      onDone(removing ? `Plano de ${name} removido.` : `Plano de ${name} definido até ${formatDate(`${validUntil}T12:00:00`)}.`);
      onClose();
    } catch {
      // O erro aparece no Alert.
    }
  }

  return (
    <Modal open onClose={onClose} title="Plano da empresa">
      <div className="space-y-4">
        {setPlan.isError && <Alert type="error">{setPlan.error.message}</Alert>}
        <div className="rounded-lg bg-zinc-50 px-4 py-3 text-sm">
          <p className="font-medium text-zinc-900">{name}</p>
          <p className="text-zinc-500">
            Hoje: {company.planStatus === 'ACTIVE' ? PLANS.find((plan) => plan.id === company.planId)?.name : 'sem plano'}
            {company.planExpiresAt && company.planStatus === 'ACTIVE' && ` · até ${formatDate(company.planExpiresAt)}`}
          </p>
        </div>
        <SelectField label="Plano" options={OPTIONS} value={planId} onChange={(event) => setPlanId(event.target.value)} />
        {!removing && (
          <TextField label="Válido até (inclusive)" type="date" min={inDays(1)} value={validUntil} onChange={(event) => setValidUntil(event.target.value)} />
        )}
        <p className="text-xs text-zinc-500">
          {removing
            ? 'A empresa volta ao básico: Chat, Automações e Marketing ficam bloqueados.'
            : 'Fica registrado que o plano foi definido pelo suporte. Nenhuma cobrança é feita.'}
        </p>
        <div className="flex flex-col gap-3 pt-2 sm:flex-row-reverse">
          <Button onClick={handleSave} isLoading={setPlan.isPending} disabled={!removing && !validUntil} className="sm:w-auto">
            Salvar plano
          </Button>
          <Button variant="secondary" onClick={onClose} className="sm:w-auto">
            Cancelar
          </Button>
        </div>
      </div>
    </Modal>
  );
}
