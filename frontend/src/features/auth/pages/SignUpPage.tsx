// Página de cadastro: nome, e-mail e senha. Depois, o Cognito envia um código para o e-mail.

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { PasswordField } from '../../../components/ui/PasswordField';
import { TextField } from '../../../components/ui/TextField';
import { PasswordStrengthMeter } from '../components/PasswordStrengthMeter';
import { signUpSchema, type SignUpFormData } from '../schemas/authSchemas';
import { registerUser } from '../services/authService';
import { translateAuthError } from '../utils/translateAuthError';

/**
 * Tela de cadastro.
 * Obs.: o usuário entra SEM grupo. Na Etapa 5 (onboarding) ele cadastra a empresa e vira "Dono".
 * @returns o formulário de cadastro
 */
export function SignUpPage() {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  // watch('password') "observa" o campo: a cada tecla, o componente redesenha com o valor novo
  // e o medidor de força é atualizado. O medidor só existe no CADASTRO (no login não faz sentido).
  const password = watch('password');

  /**
   * Cria a conta no Cognito e leva para a tela do código.
   * @param data - dados do formulário já validados
   */
  async function onSubmit(data: SignUpFormData) {
    setErrorMessage(null);
    try {
      await registerUser(data.name, data.email, data.password);
      navigate(`/confirmar?email=${encodeURIComponent(data.email)}`);
    } catch (error) {
      setErrorMessage(translateAuthError(error));
    }
  }

  return (
    <>
      <h2 className="text-2xl font-bold text-zinc-900">Criar conta</h2>
      <p className="mt-1 text-sm text-zinc-500">Leva menos de um minuto. Depois você cadastra sua empresa.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        {errorMessage && <Alert type="error">{errorMessage}</Alert>}

        <TextField
          label="Nome completo"
          autoComplete="name"
          placeholder="Maria da Silva"
          error={errors.name?.message}
          {...register('name')}
        />
        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="voce@empresa.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordField
          label="Senha"
          // "new-password" faz o navegador sugerir uma senha forte.
          autoComplete="new-password"
          // A dica só aparece com o campo vazio; depois, a lista de regras do medidor substitui.
          hint={password ? undefined : 'Mínimo de 8 caracteres, com maiúscula, minúscula e número.'}
          error={errors.password?.message}
          footer={<PasswordStrengthMeter password={password} showRules />}
          {...register('password')}
        />
        <PasswordField
          label="Repita a senha"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button type="submit" isLoading={isSubmitting}>
          {isSubmitting ? 'Criando conta…' : 'Criar conta'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-600">
        Já tem conta?{' '}
        <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">
          Entrar
        </Link>
      </p>
    </>
  );
}
