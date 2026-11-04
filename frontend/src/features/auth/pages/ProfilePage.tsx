// Página "Meu perfil" (todos os usuários): cartão com nome, cargo, área, perfil de acesso e e-mail,
// e o formulário para a própria pessoa editar nome, cargo e área (ex.: "Supervisor" · "Área comercial").

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { TextField } from '../../../components/ui/TextField';
import { ROLE_LABELS } from '../../../types/auth';
import { useCompany } from '../../empresa/hooks/useCompany';
import { useSession } from '../context/SessionContext';
import { updateProfile } from '../services/authService';
import { translateAuthError } from '../utils/translateAuthError';

/** Regras do formulário (cargo e área: até 50 caracteres, como no Cognito). */
const profileSchema = z.object({
  name: z.string().trim().min(3, 'Informe seu nome completo.').max(100, 'No máximo 100 caracteres.'),
  jobTitle: z.string().trim().max(50, 'No máximo 50 caracteres.'),
  department: z.string().trim().max(50, 'No máximo 50 caracteres.'),
});
type ProfileFormData = z.infer<typeof profileSchema>;

/**
 * Tela de perfil.
 * @returns a página
 */
export function ProfilePage() {
  const { user, refreshSession } = useSession();
  const role = user.groups[0];
  const roleLabel = role ? ROLE_LABELS[role] : '';
  // O nome da empresa aparece no cartão (o SuperAdmin não tem empresa: não busca).
  const companyQuery = useCompany(role !== 'SuperAdmin');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, jobTitle: user.jobTitle, department: user.department },
  });

  /**
   * Salva no Cognito e renova a sessão (para o topo da página mostrar os dados novos).
   * @param data - dados validados
   */
  async function onSubmit(data: ProfileFormData) {
    setMessage(null);
    try {
      await updateProfile(data);
      await refreshSession();
      // "reset" com os valores salvos: o botão Salvar volta a ficar desligado até a próxima mudança.
      reset(data);
      setMessage({ type: 'success', text: 'Perfil atualizado.' });
    } catch (error) {
      // No perfil, "NotAuthorized" quer dizer "sem permissão para alterar esse campo" (e não "senha errada",
      // que é o significado no login). Por isso a mensagem é tratada aqui, antes da tradução geral.
      const text =
        error instanceof Error && error.name === 'NotAuthorizedException'
          ? 'Não foi possível salvar: você não tem permissão para alterar esse dado.'
          : translateAuthError(error);
      setMessage({ type: 'error', text });
    }
  }

  // Linha "Cargo · Área". Sem cargo, usa o perfil de acesso (ex.: "Supervisor").
  const subtitle = [user.jobTitle || roleLabel, user.department].filter(Boolean).join(' · ');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">Meu perfil</h1>

      {/* Cartão de apresentação. */}
      <section className="flex flex-col gap-5 rounded-2xl bg-brand-950 p-6 text-white ring-1 ring-white/5 sm:flex-row sm:items-center">
        <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-brand-600 text-2xl font-semibold ring-4 ring-white/10" aria-hidden="true">
          {user.name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="truncate text-xl font-semibold">{user.name}</p>
          <p className="text-brand-200">{subtitle}</p>
          <p className="mt-1 truncate text-sm text-zinc-400">
            {user.email}
            {companyQuery.data && <> · {companyQuery.data.tradeName || companyQuery.data.legalName}</>}
          </p>
        </div>
        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-200 sm:ml-auto">
          Acesso: {roleLabel}
        </span>
      </section>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4 rounded-2xl bg-white p-6 ring-1 ring-zinc-200">
        <h2 className="font-semibold text-zinc-900">Editar dados</h2>
        {message && <Alert type={message.type}>{message.text}</Alert>}

        <TextField label="Nome completo" autoComplete="name" error={errors.name?.message} {...register('name')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label="Cargo"
            placeholder={roleLabel ? `Ex.: ${roleLabel}` : 'Ex.: Vendedor'}
            error={errors.jobTitle?.message}
            {...register('jobTitle')}
          />
          <TextField label="Área" placeholder="Ex.: Área comercial" error={errors.department?.message} {...register('department')} />
        </div>
        <TextField label="E-mail (login)" value={user.email} disabled readOnly hint="O e-mail é o seu login e não pode ser alterado aqui." />

        <p className="text-xs text-zinc-500">
          Mudanças no nome valem daqui para frente: vendas e clientes antigos continuam com o nome da época.
        </p>
        <div className="flex justify-end">
          <Button type="submit" className="sm:w-auto" disabled={!isDirty} isLoading={isSubmitting}>
            {isSubmitting ? 'Salvando…' : 'Salvar perfil'}
          </Button>
        </div>
      </form>
    </div>
  );
}
