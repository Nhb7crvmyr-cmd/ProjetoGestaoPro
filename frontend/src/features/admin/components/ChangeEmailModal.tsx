// Popup do suporte "Alterar e-mail": troca o login de um usuário (o único lugar do sistema onde isso é possível).

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { TextField } from '../../../components/ui/TextField';
import { useUpdateUserEmail } from '../hooks/useUpdateUserEmail';
import type { AdminUser } from '../services/adminService';

const schema = z.object({ email: z.string().trim().toLowerCase().pipe(z.email('E-mail inválido.')) });
type FormData = z.infer<typeof schema>;

/** Propriedades do popup. */
interface ChangeEmailModalProps {
  /** Usuário a alterar. Sem usuário = popup fechado. */
  user?: AdminUser;
  onClose: () => void;
  onDone: (message: string) => void;
}

/**
 * Desenha o popup.
 * @param props - usuário e ações
 * @returns o modal
 */
export function ChangeEmailModal({ user, onClose, onDone }: ChangeEmailModalProps) {
  const updateEmail = useUpdateUserEmail();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema), defaultValues: { email: '' } });

  useEffect(() => {
    reset({ email: '' });
    updateEmail.reset();
    // De propósito, só "user": limpa ao abrir para outra pessoa.
  }, [user]);

  if (!user) return null;

  /**
   * Envia a troca.
   * @param data - novo e-mail validado
   */
  async function onSubmit(data: FormData) {
    if (!user) return;
    try {
      await updateEmail.mutateAsync({ userId: user.id, email: data.email });
      onDone(`E-mail de ${user.name || user.email} alterado para ${data.email}. O novo e-mail já vale para entrar.`);
      onClose();
    } catch {
      // O erro aparece no Alert.
    }
  }

  return (
    <Modal open onClose={onClose} title="Alterar e-mail (login)">
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        {updateEmail.isError && <Alert type="error">{updateEmail.error.message}</Alert>}
        <div className="rounded-lg bg-zinc-50 px-4 py-3 text-sm">
          <p className="font-medium text-zinc-900">{user.name || '—'}</p>
          <p className="text-zinc-500">E-mail atual: {user.email}</p>
        </div>
        <TextField label="Novo e-mail" type="email" autoComplete="off" autoFocus error={errors.email?.message} {...register('email')} />
        <p className="text-xs text-zinc-500">
          O usuário passa a entrar com o novo e-mail na hora, com a mesma senha. Avise a pessoa da mudança.
        </p>
        <div className="flex flex-col gap-3 pt-2 sm:flex-row-reverse">
          <Button type="submit" isLoading={isSubmitting} className="sm:w-auto">
            {isSubmitting ? 'Salvando…' : 'Alterar e-mail'}
          </Button>
          <Button type="button" variant="secondary" onClick={onClose} className="sm:w-auto">
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
