// Pequeno formulário de ação da venda: um campo de texto obrigatório + botão de confirmar + voltar.
// Usado para: pedir cancelamento (vendedor), aprovar/cancelar e recusar (Dono).

import { useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { TextField } from '../../../components/ui/TextField';

/** Propriedades do formulário. */
interface SaleActionFormProps {
  label: string;
  placeholder: string;
  /** Texto inicial do campo (ex.: o motivo que o vendedor escreveu). */
  initialValue?: string;
  hint: string;
  confirmLabel: string;
  /** "danger" = botão vermelho (cancelar); "primary" = botão da marca. */
  tone: 'danger' | 'primary';
  isPending: boolean;
  onConfirm: (text: string) => void;
  onBack: () => void;
}

/**
 * Desenha o campo e os botões.
 * @param props - textos, estado e ações
 * @returns o formulário
 */
export function SaleActionForm({ label, placeholder, initialValue = '', hint, confirmLabel, tone, isPending, onConfirm, onBack }: SaleActionFormProps) {
  const [text, setText] = useState(initialValue);
  return (
    <div className="space-y-3">
      <TextField label={label} placeholder={placeholder} value={text} maxLength={300} autoFocus onChange={(event) => setText(event.target.value)} />
      <p className="text-xs text-zinc-500">{hint}</p>
      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <Button
          variant={tone === 'danger' ? 'danger' : 'primary'}
          className="sm:w-auto"
          disabled={!text.trim()}
          isLoading={isPending}
          onClick={() => onConfirm(text.trim())}
        >
          {confirmLabel}
        </Button>
        <Button variant="secondary" className="sm:w-auto" onClick={onBack} disabled={isPending}>
          Voltar
        </Button>
      </div>
    </div>
  );
}
