// Popup de cadastro/edição de cliente: dados pessoais, documento, contato, nascimento, observações e endereço (CEP).

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { AddressFields } from '../../../components/ui/AddressFields';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { SelectField } from '../../../components/ui/SelectField';
import { TextAreaField } from '../../../components/ui/TextAreaField';
import { TextField } from '../../../components/ui/TextField';
import { emptyAddress } from '../../../utils/addressSchema';
import { formatCep, formatCnpj, formatCpf, formatPhone, normalizeDocument, onlyDigits } from '../../../utils/formatters';
import { useCreateCustomer, useUpdateCustomer } from '../hooks/useCustomers';
import { customerFormSchema, type CustomerFormData } from '../schemas/customerSchema';
import type { Customer, CustomerInput } from '../services/customerService';

/** Propriedades do popup. */
interface CustomerFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Cliente a editar. Sem ele, o popup é de CADASTRO. */
  customer?: Customer;
  onSaved: (message: string) => void;
}

const DOCUMENT_OPTIONS = [
  { value: 'CPF', label: 'CPF' },
  { value: 'CNPJ', label: 'CNPJ' },
];

/**
 * Converte o cliente (ou nada) nos valores iniciais do formulário (com máscaras).
 * @param customer - cliente em edição, ou undefined
 * @returns os valores do formulário
 */
function toFormValues(customer?: Customer): CustomerFormData {
  const document = customer?.document
    ? customer.documentType === 'CNPJ'
      ? formatCnpj(customer.document)
      : formatCpf(customer.document)
    : '';
  return {
    name: customer?.name ?? '',
    documentType: customer?.documentType ?? '',
    document,
    email: customer?.email ?? '',
    phone: customer ? formatPhone(customer.phone) : '',
    birthDate: customer?.birthDate ?? '',
    notes: customer?.notes ?? '',
    // No cadastro, o bloco de endereço já vem ligado (o usuário pediu cadastro completo).
    hasAddress: customer ? Boolean(customer.address) : true,
    address: customer?.address
      ? { ...customer.address, zipCode: formatCep(customer.address.zipCode), complement: customer.address.complement ?? '' }
      : emptyAddress,
  };
}

/**
 * Desenha o popup.
 * @param props - aberto/fechado, cliente (edição) e ações
 * @returns o modal
 */
export function CustomerFormModal({ open, onClose, customer, onSaved }: CustomerFormModalProps) {
  const isEdit = Boolean(customer);
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();
  const mutation = isEdit ? updateCustomer : createCustomer;

  const form = useForm<CustomerFormData>({ resolver: zodResolver(customerFormSchema), defaultValues: toFormValues(customer) });
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = form;
  const [documentType, hasAddress] = watch(['documentType', 'hasAddress']);

  useEffect(() => {
    if (open) {
      reset(toFormValues(customer));
      createCustomer.reset();
      updateCustomer.reset();
    }
    // De propósito, só "open" e "customer": reagir à abertura e à troca de cliente.
  }, [open, customer]);

  /**
   * Tira as máscaras e envia.
   * @param data - dados validados
   */
  async function onSubmit(data: CustomerFormData) {
    const input: CustomerInput = {
      name: data.name,
      documentType: data.document ? (data.documentType as 'CPF' | 'CNPJ') : undefined,
      document: data.document ? normalizeDocument(data.document) : undefined,
      email: data.email || undefined,
      phone: onlyDigits(data.phone),
      birthDate: data.birthDate || undefined,
      notes: data.notes || undefined,
      address: data.hasAddress
        ? {
            ...data.address,
            zipCode: onlyDigits(data.address.zipCode),
            complement: data.address.complement || undefined,
          }
        : undefined,
    };
    try {
      if (customer) {
        await updateCustomer.mutateAsync({ customerId: customer.customerId, input: { ...input, active: customer.active } });
        onSaved(`Cliente "${data.name}" atualizado.`);
      } else {
        await createCustomer.mutateAsync(input);
        onSaved(`Cliente "${data.name}" cadastrado.`);
      }
      onClose();
    } catch {
      // O erro aparece pelo mutation.error.
    }
  }

  // Máscara do documento conforme o tipo escolhido.
  const documentField = register('document', {
    onChange: (event) =>
      setValue('document', documentType === 'CNPJ' ? formatCnpj(event.target.value) : formatCpf(event.target.value)),
  });

  return (
    // Popup largo ("4xl") e "deitado": no computador, dados do cliente à esquerda e endereço à direita,
    // para o formulário não ficar comprido. No celular, as duas partes ficam uma embaixo da outra.
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar cliente' : 'Novo cliente'} size="4xl">
      <FormProvider {...form}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
          {mutation.isError && <Alert type="error">{mutation.error.message}</Alert>}

          {/* lg:grid-cols-2 = duas colunas lado a lado em telas grandes (1024px ou mais). */}
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-zinc-900">Dados do cliente</legend>
            <TextField label="Nome completo" error={errors.name?.message} {...register('name')} />
            <div className="grid gap-4 sm:grid-cols-6">
              <SelectField
                className="sm:col-span-2"
                label="Documento"
                placeholder="Sem documento"
                options={DOCUMENT_OPTIONS}
                error={errors.documentType?.message}
                {...register('documentType', { onChange: () => setValue('document', '') })}
              />
              <TextField
                className="sm:col-span-4"
                label={documentType ? `Número do ${documentType}` : 'Número (opcional)'}
                disabled={!documentType}
                placeholder={documentType === 'CNPJ' ? '00.000.000/0000-00' : '000.000.000-00'}
                error={errors.document?.message}
                {...documentField}
              />
              <TextField
                className="sm:col-span-3"
                label="Telefone / WhatsApp"
                type="tel"
                placeholder="(00) 00000-0000"
                error={errors.phone?.message}
                {...register('phone', { onChange: (event) => setValue('phone', formatPhone(event.target.value)) })}
              />
              <TextField className="sm:col-span-3" label="E-mail (opcional)" type="email" error={errors.email?.message} {...register('email')} />
              <TextField
                className="sm:col-span-3"
                label="Nascimento (opcional)"
                type="date"
                error={errors.birthDate?.message}
                {...register('birthDate')}
              />
            </div>
            <TextAreaField
              label="Observações (opcional)"
              placeholder="Preferências, tamanho, melhor horário para contato…"
              rows={2}
              error={errors.notes?.message}
              {...register('notes')}
            />
          </fieldset>

          {/* Coluna da direita: endereço. A linha vertical (border-l) só aparece com as duas colunas. */}
          <div className="space-y-4 lg:border-l lg:border-zinc-200 lg:pl-8">
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
              <input type="checkbox" className="size-4 accent-brand-700" {...register('hasAddress')} />
              Cadastrar endereço
            </label>
            {/* O bloco de endereço (com busca pelo CEP) só aparece se a caixa estiver marcada. */}
            {hasAddress ? (
              <AddressFields />
            ) : (
              <p className="rounded-lg bg-zinc-50 px-4 py-6 text-center text-sm text-zinc-500">Sem endereço cadastrado.</p>
            )}
          </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-zinc-200 pt-5 sm:flex-row-reverse">
            <Button type="submit" isLoading={isSubmitting} className="sm:w-auto">
              {isSubmitting ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Cadastrar cliente'}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose} className="sm:w-auto">
              Cancelar
            </Button>
          </div>
        </form>
      </FormProvider>
    </Modal>
  );
}
