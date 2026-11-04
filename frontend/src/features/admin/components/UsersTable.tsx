// Tabela de usuários do painel admin, com o botão de bloquear/liberar em cada linha.

import type { AdminUser } from '../services/adminService';
import { UserStatusBadge } from '../../../components/ui/UserStatusBadge';

/** Propriedades da tabela. */
interface UsersTableProps {
  users: AdminUser[];
  /** Id do SuperAdmin logado (ele não pode bloquear a si mesmo). */
  currentUserId: string;
  /** Id do usuário que está sendo bloqueado/liberado agora (mostra "Salvando…"). */
  pendingUserId?: string;
  /** Chamado ao clicar em Bloquear/Liberar. */
  onToggle: (user: AdminUser) => void;
  /** Suporte: abre o popup "Alterar e-mail". */
  onChangeEmail: (user: AdminUser) => void;
}

/** Formata a data no padrão brasileiro (ex.: 16/10/2026). */
const dateFormatter = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' });

/**
 * Desenha a tabela.
 * @param props - usuários, usuário logado, linha em andamento e ação do botão
 * @returns a tabela (ou uma mensagem, se a lista estiver vazia)
 */
export function UsersTable({ users, currentUserId, pendingUserId, onToggle, onChangeEmail }: UsersTableProps) {
  if (users.length === 0) {
    return <p className="rounded-xl bg-white p-8 text-center text-sm text-zinc-500 ring-1 ring-zinc-200">Nenhum usuário encontrado.</p>;
  }

  return (
    // overflow-x-auto: no celular, só a TABELA rola para o lado, não a página inteira.
    <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-zinc-200">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Usuário</th>
            <th className="px-4 py-3 font-medium">Grupo</th>
            <th className="px-4 py-3 font-medium">Situação</th>
            <th className="px-4 py-3 font-medium">Criado em</th>
            <th className="px-4 py-3 text-right font-medium">Acesso</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            const isSuperAdmin = user.groups.includes('SuperAdmin');
            // Mesmas regras do backend. Aqui só desabilitam o botão; quem garante é a Lambda.
            const canToggle = !isSelf && !isSuperAdmin;
            const isPending = pendingUserId === user.id;

            return (
              <tr key={user.id} className="hover:bg-zinc-50/60">
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-900">
                    {user.name || '—'} {isSelf && <span className="text-xs font-normal text-zinc-400">(você)</span>}
                  </p>
                  <p className="text-zinc-500">{user.email}</p>
                </td>
                <td className="px-4 py-3 text-zinc-700">{user.groups.join(', ') || <span className="text-zinc-400">Sem empresa</span>}</td>
                <td className="px-4 py-3">
                  <UserStatusBadge enabled={user.enabled} status={user.status} />
                </td>
                <td className="px-4 py-3 tabular-nums text-zinc-600">
                  {user.createdAt ? dateFormatter.format(new Date(user.createdAt)) : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                  {/* O e-mail (login) só pode ser trocado aqui, pelo suporte. */}
                  <button
                    type="button"
                    onClick={() => onChangeEmail(user)}
                    className="rounded-md px-3 py-1.5 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-300 transition hover:bg-zinc-50"
                  >
                    Alterar e-mail
                  </button>
                  {canToggle ? (
                    <button
                      type="button"
                      onClick={() => onToggle(user)}
                      disabled={isPending}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold ring-1 transition disabled:opacity-60 ${
                        user.enabled
                          ? 'text-red-700 ring-red-200 hover:bg-red-50'
                          : 'text-emerald-700 ring-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      {isPending ? 'Salvando…' : user.enabled ? 'Bloquear' : 'Liberar'}
                    </button>
                  ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
