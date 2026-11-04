// Popup "Novo funcionário": nome, e-mail e telefone. Ao salvar, o funcionário recebe o convite por e-mail.

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { TextField } from '../../../components/ui/TextField';
import { formatPhone, onlyDigits } from '../../../utils/formatters';
import { useCreateEmployee } from '../hooks/useEmployees';
import { employeeFormSchema, type EmployeeFormData } from '../schemas/employeeSchema';

/** Propriedades do popup. */
interface EmployeeFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Chamado com o e-mail do funcionário criado (para mostrar a mensagem de sucesso). */
  onCreated: (email: string) => void;
}

/**
 * Desenha o popup com o formulário.
 * @param props - aberto/fechado e ações
 * @returns o modal
 */
export function EmployeeFormModal({ open, onClose, onCreated }: EmployeeFormModalProps) {
  const createEmployee = useCreateEmployee();
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeFormSchema),
    defaultValues: { name: '', email: '', phone: '' },
  });

  /** Fecha e limpa o formulário e o erro. */
  function handleClose() {
    reset();
    createEmployee.reset();
    onClose();
  }

  /**
   * Envia o cadastro.
   * @param data - dados validados
   */
  async function onSubmit(data: EmployeeFormData) {
    try {
      const phone = onlyDigits(data.phone);
      await createEmployee.mutateAsync({ name: data.name, email: data.email, phone: phone || undefined });
      onCreated(data.email);
      handleClose();
    } catch {
      // O erro aparece pelo createEmployee.error (Alert abaixo).
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Novo funcionário">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {createEmployee.isError && <Alert type="error">{createEmployee.error.message}</Alert>}

        <TextField label="Nome completo" autoComplete="off" error={errors.name?.message} {...register('name')} />
        <TextField
          label="E-mail"
          type="email"
          autoComplete="off"
          hint="O convite com a senha temporária será enviado para este e-mail."
          error={errors.email?.message}
          {...register('email')}
        />
        <TextField
          label="Telefone (opcional)"
          type="tel"
          placeholder="(00) 00000-0000"
          error={errors.phone?.message}
          {...register('phone', { onChange: (event) => setValue('phone', formatPhone(event.target.value)) })}
        />

        <div className="flex flex-col gap-3 pt-2 sm:flex-row-reverse">
          <Button type="submit" isLoading={isSubmitting}>
            {isSubmitting ? 'Cadastrando…' : 'Cadastrar e enviar convite'}
          </Button>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
