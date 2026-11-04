// Página do painel do SuperAdmin: resumo, busca e lista de todos os usuários, com bloquear/liberar.

import { useState } from 'react';
import { Alert } from '../../../components/ui/Alert';
import { useSession } from '../../auth/context/SessionContext';
import { AdminStats } from '../components/AdminStats';
import { ChangeEmailModal } from '../components/ChangeEmailModal';
import { UsersTable } from '../components/UsersTable';
import { useAdminUsers } from '../hooks/useAdminUsers';
import { useSetUserStatus } from '../hooks/useSetUserStatus';
import type { AdminUser } from '../services/adminService';

/**
 * Tela do painel admin.
 * @returns a página com resumo, busca e tabela
 */
export function AdminUsersPage() {
  const { user: currentUser } = useSession();
  const [search, setSearch] = useState('');
  const usersQuery = useAdminUsers();
  const statusMutation = useSetUserStatus();
  // Usuário no popup "Alterar e-mail" (undefined = fechado).
  const [emailUser, setEmailUser] = useState<AdminUser>();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Pede confirmação e bloqueia/libera o usuário.
   * @param user - usuário da linha clicada
   */
  function handleToggle(user: AdminUser) {
    const action = user.enabled ? 'BLOQUEAR' : 'LIBERAR';
    // window.confirm abre a caixinha nativa do navegador com "OK" e "Cancelar".
    if (!window.confirm(`Deseja ${action} o acesso de ${user.email}?`)) return;
    statusMutation.mutate({ userId: user.id, enabled: !user.enabled });
  }

  // Filtro feito no navegador (a lista é pequena): procura no nome e no e-mail.
  const term = search.trim().toLowerCase();
  const users = usersQuery.data ?? [];
  const filteredUsers = term
    ? users.filter((user) => user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term))
    : users;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Painel do SuperAdmin</h1>
          <p className="mt-1 text-sm text-zinc-500">Todos os usuários da plataforma. Bloqueie ou libere acessos.</p>
        </div>
        <button
          type="button"
          onClick={() => usersQuery.refetch()}
          disabled={usersQuery.isFetching}
          className="self-start rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 ring-1 ring-zinc-300 transition hover:bg-zinc-50 disabled:opacity-60 sm:self-auto"
        >
          {usersQuery.isFetching ? 'Atualizando…' : 'Atualizar'}
        </button>
      </div>

      {successMessage && <Alert type="success">{successMessage}</Alert>}
      {statusMutation.isError && <Alert type="error">{statusMutation.error.message}</Alert>}

      {/* Os 3 estados de uma consulta: carregando, erro e sucesso. */}
      {usersQuery.isPending && <p className="text-sm text-zinc-500">Carregando usuários…</p>}

      {usersQuery.isError && <Alert type="error">{usersQuery.error.message}</Alert>}

      {usersQuery.isSuccess && (
        <>
          <AdminStats users={users} />

          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nome ou e-mail…"
            aria-label="Buscar usuários"
            className="block w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100 sm:max-w-sm"
          />

          <UsersTable
            users={filteredUsers}
            currentUserId={currentUser.userId}
            pendingUserId={statusMutation.isPending ? statusMutation.variables?.userId : undefined}
            onToggle={handleToggle}
            onChangeEmail={setEmailUser}
          />

          <p className="text-xs text-zinc-500">
            Ao bloquear, o usuário não consegue mais entrar e as sessões dele são encerradas
            (um acesso já aberto pode durar até 1 hora).
          </p>
        </>
      )}
      <ChangeEmailModal user={emailUser} onClose={() => setEmailUser(undefined)} onDone={setSuccessMessage} />
    </div>
  );
}
