// Etiqueta colorida com a situação de um usuário: Ativo, Bloqueado, sem confirmação ou aguardando 1º acesso.
// Usada no painel do SuperAdmin e na lista de funcionários do Dono.

/** Propriedades da etiqueta. */
interface UserStatusBadgeProps {
  enabled: boolean;
  /** Situação no Cognito (CONFIRMED, UNCONFIRMED...). */
  status: string;
}

/**
 * Escolhe texto e cor conforme a situação. "Bloqueado" tem prioridade sobre as outras.
 * @param props - enabled e status do usuário
 * @returns a etiqueta
 */
export function UserStatusBadge({ enabled, status }: UserStatusBadgeProps) {
  let label = 'Ativo';
  let classes = 'bg-emerald-50 text-emerald-700 ring-emerald-200';

  if (!enabled) {
    label = 'Bloqueado';
    classes = 'bg-red-50 text-red-700 ring-red-200';
  } else if (status === 'UNCONFIRMED') {
    label = 'Não confirmou e-mail';
    classes = 'bg-amber-50 text-amber-700 ring-amber-200';
  } else if (status === 'FORCE_CHANGE_PASSWORD') {
    // Funcionário convidado que ainda não entrou para criar a própria senha.
    label = 'Aguardando 1º acesso';
    classes = 'bg-sky-50 text-sky-700 ring-sky-200';
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${classes}`}>
      {label}
    </span>
  );
}
