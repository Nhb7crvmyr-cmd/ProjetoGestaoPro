// Formulário de "crie sua senha" do 1º acesso do funcionário (troca a senha temporária do convite).

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { PasswordField } from '../../../components/ui/PasswordField';
import { newPasswordSchema, type NewPasswordFormData } from '../schemas/authSchemas';
import { completeNewPassword } from '../services/authService';
import { translateAuthError } from '../utils/translateAuthError';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

/** Propriedades do formulário. */
interface NewPasswordFormProps {
  /** Chamado quando a nova senha é aceita (o usuário já está logado). */
  onDone: () => void;
}

/**
 * Desenha o formulário. Tem medidor de força porque é a PRIMEIRA vez que a pessoa define a senha.
 * @param props - ação ao concluir
 * @returns o formulário
 */
export function NewPasswordForm({ onDone }: NewPasswordFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<NewPasswordFormData>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });
  const password = watch('password');

  /**
   * Envia a nova senha ao Cognito.
   * @param data - senha validada
   */
  async function onSubmit(data: NewPasswordFormData) {
    setErrorMessage(null);
    try {
      await completeNewPassword(data.password);
      onDone();
    } catch (error) {
      setErrorMessage(translateAuthError(error));
    }
  }

  return (
    <>
      <h2 className="text-2xl font-bold text-zinc-900">Crie sua senha</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Este é o seu primeiro acesso. Troque a senha temporária do convite por uma senha só sua.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        {errorMessage && <Alert type="error">{errorMessage}</Alert>}
        <PasswordField
          label="Nova senha"
          autoComplete="new-password"
          hint={password ? undefined : 'Mínimo de 8 caracteres, com maiúscula, minúscula e número.'}
          error={errors.password?.message}
          footer={<PasswordStrengthMeter password={password} showRules />}
          {...register('password')}
        />
        <PasswordField
          label="Repita a nova senha"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" isLoading={isSubmitting}>
          {isSubmitting ? 'Salvando…' : 'Salvar senha e entrar'}
        </Button>
      </form>
    </>
  );
}
