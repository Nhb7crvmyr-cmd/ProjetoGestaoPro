// Tabela de funcionários do Dono, com as ações de cada linha: bloquear/liberar e reenviar convite.

import { UserStatusBadge } from '../../../components/ui/UserStatusBadge';
import { formatDate, formatPhone } from '../../../utils/formatters';
import type { Employee } from '../services/employeeService';

/** Propriedades da tabela. */
interface EmployeesTableProps {
  employees: Employee[];
  /** Id do funcionário com ação em andamento (mostra "…" no botão). */
  pendingUserId?: string;
  onToggle: (employee: Employee) => void;
  onResendInvite: (employee: Employee) => void;
}

/** Classes comuns dos botões pequenos das linhas. */
const smallButton = 'rounded-md px-3 py-1.5 text-xs font-semibold ring-1 transition disabled:opacity-60';

/**
 * Desenha a tabela.
 * @param props - funcionários, linha em andamento e ações
 * @returns a tabela (ou mensagem se vazia)
 */
export function EmployeesTable({ employees, pendingUserId, onToggle, onResendInvite }: EmployeesTableProps) {
  if (employees.length === 0) {
    return (
      <div className="rounded-xl bg-white p-10 text-center ring-1 ring-zinc-200">
        <p className="font-medium text-zinc-900">Nenhum funcionário ainda</p>
        <p className="mt-1 text-sm text-zinc-500">Cadastre o primeiro no botão "Novo funcionário".</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-zinc-200">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Funcionário</th>
            <th className="px-4 py-3 font-medium">Telefone</th>
            <th className="px-4 py-3 font-medium">Situação</th>
            <th className="px-4 py-3 font-medium">Cadastro</th>
            <th className="px-4 py-3 text-right font-medium">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {employees.map((employee) => {
            const isPending = pendingUserId === employee.userId;
            const waitingFirstAccess = employee.status === 'FORCE_CHANGE_PASSWORD';
            return (
              <tr key={employee.userId} className="hover:bg-zinc-50/60">
                <td className="px-4 py-3">
                  <p className="font-medium text-zinc-900">{employee.name}</p>
                  <p className="text-zinc-500">{employee.email}</p>
                </td>
                <td className="px-4 py-3 tabular-nums text-zinc-700">{employee.phone ? formatPhone(employee.phone) : '—'}</td>
                <td className="px-4 py-3">
                  <UserStatusBadge enabled={employee.enabled} status={employee.status} />
                </td>
                <td className="px-4 py-3 tabular-nums text-zinc-600">{formatDate(employee.createdAt)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    {/* Reenviar convite: só para quem ainda não fez o 1º acesso. */}
                    {waitingFirstAccess && employee.enabled && (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => onResendInvite(employee)}
                        className={`${smallButton} text-zinc-700 ring-zinc-300 hover:bg-zinc-50`}
                      >
                        Reenviar convite
                      </button>
                    )}
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => onToggle(employee)}
                      className={`${smallButton} ${
                        employee.enabled ? 'text-red-700 ring-red-200 hover:bg-red-50' : 'text-emerald-700 ring-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      {isPending ? '…' : employee.enabled ? 'Bloquear' : 'Liberar'}
                    </button>
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
