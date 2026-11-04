// Página de confirmação do cadastro: o usuário digita o código de 6 dígitos recebido por e-mail.

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { TextField } from '../../../components/ui/TextField';
import { confirmSignUpSchema, type ConfirmSignUpFormData } from '../schemas/authSchemas';
import { confirmRegistration, resendConfirmationCode } from '../services/authService';
import { translateAuthError } from '../utils/translateAuthError';

/**
 * Tela do código de confirmação.
 * O e-mail chega pela URL (ex.: /confirmar?email=maria@x.com), vindo do cadastro ou do login.
 * @returns o formulário de confirmação
 */
export function ConfirmSignUpPage() {
  const navigate = useNavigate();
  // useSearchParams lê os parâmetros depois do "?" na URL.
  const [searchParams] = useSearchParams();
  const emailFromUrl = searchParams.get('email') ?? '';

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<ConfirmSignUpFormData>({
    resolver: zodResolver(confirmSignUpSchema),
    defaultValues: { email: emailFromUrl, code: '' },
  });

  /**
   * Confirma o código e volta para o login com uma mensagem de sucesso.
   * @param data - e-mail e código já validados
   */
  async function onSubmit(data: ConfirmSignUpFormData) {
    setErrorMessage(null);
    setInfoMessage(null);
    try {
      await confirmRegistration(data.email, data.code);
      navigate('/login', {
        replace: true,
        state: { successMessage: 'Conta confirmada! Agora é só entrar.', email: data.email },
      });
    } catch (error) {
      setErrorMessage(translateAuthError(error));
    }
  }

  /** Pede um novo código ao Cognito (valida só o campo de e-mail antes). */
  async function handleResend() {
    setErrorMessage(null);
    setInfoMessage(null);
    // trigger('email') roda a validação só desse campo.
    if (!(await trigger('email'))) return;

    setIsResending(true);
    try {
      await resendConfirmationCode(getValues('email'));
      setInfoMessage('Enviamos um novo código. Confira também a caixa de spam.');
    } catch (error) {
      setErrorMessage(translateAuthError(error));
    } finally {
      // "finally" roda sempre, com sucesso ou erro: garante que o botão volte ao normal.
      setIsResending(false);
    }
  }

  return (
    <>
      <h2 className="text-2xl font-bold text-zinc-900">Confirme seu e-mail</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Enviamos um código de 6 números para o seu e-mail. Ele pode levar alguns minutos para chegar.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        {errorMessage && <Alert type="error">{errorMessage}</Alert>}
        {infoMessage && <Alert type="success">{infoMessage}</Alert>}

        <TextField
          label="E-mail"
          type="email"
          autoComplete="email"
          // Se o e-mail veio na URL, deixa só leitura para evitar erro de digitação.
          readOnly={Boolean(emailFromUrl)}
          error={errors.email?.message}
          {...register('email')}
        />
        <TextField
          label="Código"
          // inputMode="numeric" abre o teclado de números no celular.
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="000000"
          error={errors.code?.message}
          {...register('code')}
        />

        <Button type="submit" isLoading={isSubmitting}>
          {isSubmitting ? 'Confirmando…' : 'Confirmar'}
        </Button>
        <Button type="button" variant="secondary" isLoading={isResending} onClick={handleResend}>
          Reenviar código
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-600">
        <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">
          Voltar para o login
        </Link>
      </p>
    </>
  );
}
