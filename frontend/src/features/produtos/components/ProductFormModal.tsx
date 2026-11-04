// Popup de cadastro/edição de produto (somente Dono). No cadastro dá para informar o estoque inicial.

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useId } from 'react';
import { useForm } from 'react-hook-form';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { SelectField } from '../../../components/ui/SelectField';
import { TextField } from '../../../components/ui/TextField';
import { centsToMoneyInput, formatMoneyInput, parseMoneyInput } from '../../../utils/formatters';
import { UNIT_OPTIONS, type ProductUnit } from '../constants/units';
import { useCreateProduct, useUpdateProduct } from '../hooks/useProducts';
import { productFormSchema, type ProductFormData } from '../schemas/productSchema';
import type { Product } from '../services/productService';

/** Propriedades do popup. */
interface ProductFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Produto a editar. Sem ele, o popup é de CADASTRO. */
  product?: Product;
  /** Chamado com uma mensagem de sucesso. */
  onSaved: (message: string) => void;
  /** Categorias já usadas na empresa (viram sugestões no campo Categoria). */
  categories: string[];
}

/**
 * Converte o produto (ou nada) nos valores iniciais do formulário.
 * @param product - produto em edição, ou undefined no cadastro
 * @returns os valores do formulário (tudo como texto)
 */
function toFormValues(product?: Product): ProductFormData {
  return {
    name: product?.name ?? '',
    sku: product?.sku ?? '',
    category: product?.category ?? '',
    unit: product?.unit ?? 'UN',
    price: product ? centsToMoneyInput(product.priceCents) : '',
    cost: product?.costCents !== undefined ? centsToMoneyInput(product.costCents) : '',
    minStock: String(product?.minStock ?? 0),
    initialStock: '',
    active: product?.active ?? true,
  };
}

/**
 * Desenha o popup.
 * @param props - aberto/fechado, produto (edição) e ações
 * @returns o modal
 */
export function ProductFormModal({ open, onClose, product, onSaved, categories }: ProductFormModalProps) {
  // Id único para ligar o campo Categoria à lista de sugestões (<datalist>).
  const categoriesListId = useId();
  const isEdit = Boolean(product);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const mutation = isEdit ? updateProduct : createProduct;

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({ resolver: zodResolver(productFormSchema), defaultValues: toFormValues(product) });

  // Toda vez que o popup abre (ou troca o produto), recarrega os valores do formulário.
  useEffect(() => {
    if (open) {
      reset(toFormValues(product));
      createProduct.reset();
      updateProduct.reset();
    }
    // De propósito, só "open" e "product" na lista: queremos reagir à abertura e à troca de produto.
  }, [open, product]);

  /**
   * Converte os textos em números e envia.
   * @param data - dados validados do formulário
   */
  async function onSubmit(data: ProductFormData) {
    const input = {
      name: data.name,
      sku: data.sku || undefined,
      category: data.category || undefined,
      unit: data.unit as ProductUnit,
      priceCents: parseMoneyInput(data.price),
      costCents: data.cost ? parseMoneyInput(data.cost) : undefined,
      minStock: Number(data.minStock),
    };
    try {
      if (product) {
        await updateProduct.mutateAsync({ productId: product.productId, input: { ...input, active: data.active } });
        onSaved(`Produto "${data.name}" atualizado.`);
      } else {
        await createProduct.mutateAsync({ ...input, initialStock: data.initialStock ? Number(data.initialStock) : undefined });
        onSaved(`Produto "${data.name}" cadastrado.`);
      }
      onClose();
    } catch {
      // O erro aparece pelo mutation.error (Alert abaixo).
    }
  }

  /** Liga um campo de dinheiro ao formulário, aplicando a máscara a cada tecla. */
  const moneyField = (name: 'price' | 'cost') =>
    register(name, { onChange: (event) => setValue(name, formatMoneyInput(event.target.value)) });

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar produto' : 'Novo produto'}>
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {mutation.isError && <Alert type="error">{mutation.error.message}</Alert>}

        <TextField label="Nome do produto" error={errors.name?.message} {...register('name')} />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Código / SKU (opcional)" placeholder="Ex.: CAM-001" error={errors.sku?.message} {...register('sku')} />
          {/* "list" liga o campo ao <datalist>: o navegador mostra as categorias existentes como sugestões.
              Dá para escolher uma da lista ou digitar uma nova. */}
          <TextField
            label="Categoria (opcional)"
            placeholder={categories.length > 0 ? 'Escolha ou digite uma nova' : 'Ex.: Roupas'}
            list={categoriesListId}
            autoComplete="off"
            error={errors.category?.message}
            {...register('category')}
          />
          <datalist id={categoriesListId}>
            {categories.map((category) => (
              <option key={category} value={category} />
            ))}
          </datalist>
          <TextField
            label="Preço de venda (R$)"
            inputMode="numeric"
            placeholder="0,00"
            error={errors.price?.message}
            {...moneyField('price')}
          />
          <TextField
            label="Custo (R$, opcional)"
            inputMode="numeric"
            placeholder="0,00"
            hint="Só você (Supervisor) vê o custo."
            error={errors.cost?.message}
            {...moneyField('cost')}
          />
          <SelectField label="Unidade" options={UNIT_OPTIONS} error={errors.unit?.message} {...register('unit')} />
          <TextField
            label="Estoque mínimo"
            inputMode="numeric"
            hint="Abaixo disso, o produto aparece com alerta."
            error={errors.minStock?.message}
            {...register('minStock')}
          />
          {!isEdit && (
            <TextField
              label="Estoque inicial (opcional)"
              inputMode="numeric"
              placeholder="0"
              hint="Entra no histórico como “Estoque inicial”."
              error={errors.initialStock?.message}
              {...register('initialStock')}
            />
          )}
        </div>

        {isEdit && (
          <>
            <label className="flex items-center gap-2 text-sm text-zinc-700">
              <input type="checkbox" className="size-4 accent-brand-700" {...register('active')} />
              Produto ativo (desmarque para tirar das vendas sem perder o histórico)
            </label>
            <p className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-600">
              Para mudar a quantidade em estoque, use <strong>Movimentar estoque</strong>. Assim, toda mudança fica no histórico.
            </p>
          </>
        )}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row-reverse">
          <Button type="submit" isLoading={isSubmitting}>
            {isSubmitting ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Cadastrar produto'}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
