// Página de login: e-mail + senha. Se o e-mail ainda não foi confirmado, leva para a confirmação.

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { PasswordField } from '../../../components/ui/PasswordField';
import { TextField } from '../../../components/ui/TextField';
import { NewPasswordForm } from '../components/NewPasswordForm';
import { loginSchema, type LoginFormData } from '../schemas/authSchemas';
import { getSessionUser, signInWithEmail } from '../services/authService';
import { translateAuthError } from '../utils/translateAuthError';

/** Dados que outras páginas podem mandar para cá ao navegar (ex.: "conta confirmada"). */
interface LoginLocationState {
  successMessage?: string;
  email?: string;
}

/**
 * Tela de login.
 * @returns o formulário de login
 */
export function LoginPage() {
  const navigate = useNavigate();
  // location.state = dados "escondidos" enviados por outra página com navigate(..., { state }).
  const state = (useLocation().state ?? {}) as LoginLocationState;
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // true = funcionário no 1º acesso: troca o formulário de login pelo de "crie sua senha".
  const [needsNewPassword, setNeedsNewPassword] = useState(false);

  // useForm controla o formulário: guarda os valores, roda o Zod (resolver)
  // e só chama onSubmit se tudo estiver válido.
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: state.email ?? '', password: '' },
  });

  /** Depois de logado: o SuperAdmin vai direto para o painel; os demais, para o início. */
  async function goToApp() {
    const user = await getSessionUser();
    navigate(user?.groups.includes('SuperAdmin') ? '/admin' : '/inicio', { replace: true });
  }

  /**
   * Envia o login ao Cognito e decide para onde ir.
   * @param data - e-mail e senha já validados
   */
  async function onSubmit(data: LoginFormData) {
    setErrorMessage(null);
    try {
      const result = await signInWithEmail(data.email, data.password);
      if (result === 'NEEDS_CONFIRMATION') {
        // encodeURIComponent protege caracteres especiais do e-mail dentro da URL.
        navigate(`/confirmar?email=${encodeURIComponent(data.email)}`);
        return;
      }
      if (result === 'NEW_PASSWORD_REQUIRED') {
        setNeedsNewPassword(true);
        return;
      }
      await goToApp();
    } catch (error) {
      // Se já havia alguém logado neste navegador, apenas segue para o início.
      if (error instanceof Error && error.name === 'UserAlreadyAuthenticatedException') {
        navigate('/inicio', { replace: true });
        return;
      }
      setErrorMessage(translateAuthError(error));
    }
  }

  if (needsNewPassword) return <NewPasswordForm onDone={goToApp} />;

  return (
    <>
      <h2 className="text-2xl font-bold text-zinc-900">Entrar</h2>
      <p className="mt-1 text-sm text-zinc-500">Acesse sua conta para gerenciar sua empresa.</p>

      {/* noValidate desliga a validação nativa do navegador: quem valida é o Zod. */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
        {state.successMessage && !errorMessage && <Alert type="success">{state.successMessage}</Alert>}
        {errorMessage && <Alert type="error">{errorMessage}</Alert>}

        {/* register('email') liga o campo ao useForm (nome, valor, ref e eventos). */}
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
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <Button type="submit" isLoading={isSubmitting}>
          {isSubmitting ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-600">
        Ainda não tem conta?{' '}
        <Link to="/cadastro" className="font-semibold text-brand-700 hover:text-brand-800">
          Cadastre-se grátis
        </Link>
      </p>
    </>
  );
}
