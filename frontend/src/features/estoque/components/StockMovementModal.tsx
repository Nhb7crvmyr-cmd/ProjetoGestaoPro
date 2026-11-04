// Popup "Movimentar estoque" (somente Dono): entrada, saída ou ajuste, com prévia de como o estoque vai ficar.

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { SelectField } from '../../../components/ui/SelectField';
import { TextField } from '../../../components/ui/TextField';
import type { Product } from '../../produtos/services/productService';
import { useCreateMovement } from '../hooks/useStock';
import { Icon } from '../../../components/ui/Icon';

/** Os 3 tipos de movimento manual, com explicação para o usuário. */
const TYPES = [
  { value: 'IN', title: 'Entrada', text: 'Chegou mercadoria' },
  { value: 'OUT', title: 'Saída', text: 'Perda, avaria, uso interno' },
  { value: 'ADJUST', title: 'Ajuste', text: 'Contei e o número é outro' },
] as const;

/** Regras do formulário. A regra "motivo obrigatório na saída/ajuste" fica no superRefine. */
const movementSchema = z
  .object({
    productId: z.string().min(1, 'Escolha o produto.'),
    type: z.enum(['IN', 'OUT', 'ADJUST']),
    quantity: z.string().trim().regex(/^\d{1,7}$/, 'Use números inteiros.'),
    reason: z.string().trim().max(200, 'No máximo 200 caracteres.'),
  })
  .superRefine((data, ctx) => {
    if (data.type !== 'ADJUST' && Number(data.quantity) === 0) {
      ctx.addIssue({ code: 'custom', path: ['quantity'], message: 'A quantidade precisa ser maior que zero.' });
    }
    if (data.type !== 'IN' && !data.reason) {
      ctx.addIssue({ code: 'custom', path: ['reason'], message: 'Informe o motivo.' });
    }
  });
type MovementFormData = z.infer<typeof movementSchema>;

/** Propriedades do popup. */
interface StockMovementModalProps {
  open: boolean;
  onClose: () => void;
  /** Lista de produtos para escolher (quando "product" não for informado). */
  products: Product[];
  /** Produto já escolhido (quando o popup é aberto pela linha da tabela). */
  product?: Product;
  onSaved: (message: string) => void;
}

/**
 * Desenha o popup.
 * @param props - aberto/fechado, produtos, produto fixo e ações
 * @returns o modal
 */
export function StockMovementModal({ open, onClose, products, product, onSaved }: StockMovementModalProps) {
  const createMovement = useCreateMovement();
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MovementFormData>({
    resolver: zodResolver(movementSchema),
    defaultValues: { productId: product?.productId ?? '', type: 'IN', quantity: '', reason: '' },
  });

  useEffect(() => {
    if (open) {
      reset({ productId: product?.productId ?? '', type: 'IN', quantity: '', reason: '' });
      createMovement.reset();
    }
    // De propósito, só "open" e "product": reagir à abertura e à troca de produto.
  }, [open, product]);

  const [type, quantityText, productId] = watch(['type', 'quantity', 'productId']);
  const selected = product ?? products.find((item) => item.productId === productId);

  // Prévia: calcula o novo estoque enquanto a pessoa digita (a conta oficial é feita no backend).
  const quantity = /^\d+$/.test(quantityText) ? Number(quantityText) : null;
  let preview: number | null = null;
  if (selected && quantity !== null) {
    preview = type === 'IN' ? selected.stock + quantity : type === 'OUT' ? selected.stock - quantity : quantity;
  }

  /**
   * Envia o movimento.
   * @param data - dados validados
   */
  async function onSubmit(data: MovementFormData) {
    try {
      const result = await createMovement.mutateAsync({
        productId: data.productId,
        type: data.type,
        quantity: Number(data.quantity),
        reason: data.reason || undefined,
      });
      onSaved(`Estoque de "${selected?.name}" atualizado: ${result.previousStock} → ${result.newStock}.`);
      onClose();
    } catch {
      // O erro aparece pelo createMovement.error.
    }
  }

  // Só produtos ativos aparecem na lista de escolha.
  const productOptions = products.filter((item) => item.active).map((item) => ({ value: item.productId, label: `${item.name} (${item.stock} ${item.unit})` }));

  return (
    <Modal open={open} onClose={onClose} title="Movimentar estoque">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {createMovement.isError && <Alert type="error">{createMovement.error.message}</Alert>}

        {product ? (
          <div className="rounded-lg bg-zinc-50 px-4 py-3">
            <p className="font-medium text-zinc-900">{product.name}</p>
            <p className="text-sm text-zinc-500">
              Estoque atual: <strong className="text-zinc-900">{product.stock} {product.unit}</strong>
            </p>
          </div>
        ) : (
          <SelectField label="Produto" placeholder="Escolha o produto" options={productOptions} error={errors.productId?.message} {...register('productId')} />
        )}

        {/* Tipo de movimento: 3 botões, um deles marcado. */}
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-zinc-700">Tipo</legend>
          <div className="grid grid-cols-3 gap-2">
            {TYPES.map((option) => (
              <label
                key={option.value}
                className="cursor-pointer rounded-lg p-3 text-center ring-1 ring-zinc-300 transition hover:bg-zinc-50 has-checked:bg-brand-50 has-checked:ring-2 has-checked:ring-brand-600"
              >
                {/* register('type') nos 3 rádios: o React Hook Form entende que é um grupo e guarda o marcado. */}
                <input type="radio" value={option.value} className="sr-only" {...register('type')} />
                <span className="block text-sm font-semibold text-zinc-900">{option.title}</span>
                <span className="block text-[11px] leading-tight text-zinc-500">{option.text}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <TextField
          label={type === 'ADJUST' ? 'Quantidade contada (novo estoque)' : type === 'IN' ? 'Quantidade que entrou' : 'Quantidade que saiu'}
          inputMode="numeric"
          error={errors.quantity?.message}
          {...register('quantity')}
        />
        <TextField
          label={type === 'IN' ? 'Motivo (opcional)' : 'Motivo'}
          placeholder={type === 'IN' ? 'Ex.: Compra do fornecedor X' : type === 'OUT' ? 'Ex.: Produto avariado' : 'Ex.: Inventário mensal'}
          error={errors.reason?.message}
          {...register('reason')}
        />

        {selected && preview !== null && (
          <p className={`rounded-lg px-4 py-3 text-sm ${preview < 0 ? 'bg-red-50 text-red-700' : 'bg-brand-50 text-brand-800'}`}>
            {preview < 0 ? (
              <>Estoque insuficiente: há só {selected.stock} {selected.unit}.</>
            ) : (
              <>
                Estoque vai ficar:{' '}
                <strong className="inline-flex items-center gap-1.5">
                  {selected.stock} <Icon name="arrowRight" className="size-3.5" /> {preview} {selected.unit}
                </strong>
              </>
            )}
          </p>
        )}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row-reverse">
          <Button type="submit" isLoading={isSubmitting} disabled={preview !== null && preview < 0}>
            {isSubmitting ? 'Salvando…' : 'Confirmar movimento'}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
