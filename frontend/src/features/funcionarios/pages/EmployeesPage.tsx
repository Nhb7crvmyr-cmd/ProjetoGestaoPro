// Página "Funcionários" (somente Dono): lista, cadastro com convite por e-mail, bloquear/liberar e reenviar convite.

import { useState } from 'react';
import { Link } from 'react-router';
import { Alert } from '../../../components/ui/Alert';
import { Button } from '../../../components/ui/Button';
import { Icon } from '../../../components/ui/Icon';
import { findPlan } from '../../empresa/constants/plans';
import { useCompany } from '../../empresa/hooks/useCompany';
import { EmployeeFormModal } from '../components/EmployeeFormModal';
import { EmployeesTable } from '../components/EmployeesTable';
import { useEmployees, useResendInvite, useSetEmployeeStatus } from '../hooks/useEmployees';
import type { Employee } from '../services/employeeService';

/**
 * Tela de funcionários.
 * @returns a página
 */
export function EmployeesPage() {
  const employeesQuery = useEmployees();
  // Limite do plano: funcionários ATIVOS permitidos (null = ilimitado). Quem barra de verdade é o backend.
  const access = useCompany().data?.access;
  const maxEmployees = access?.maxEmployees ?? null;
  const activeCount = (employeesQuery.data ?? []).filter((employee) => employee.enabled).length;
  const isFull = maxEmployees !== null && activeCount >= maxEmployees;
  const planName = findPlan(access?.planId)?.name ?? 'Sem plano ativo';
  const setStatus = useSetEmployeeStatus();
  const resendInvite = useResendInvite();
  const [formOpen, setFormOpen] = useState(false);
  // Mensagem verde de sucesso no topo (ex.: "Convite enviado para...").
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /**
   * Pede confirmação e bloqueia/libera.
   * @param employee - funcionário da linha
   */
  function handleToggle(employee: Employee) {
    const action = employee.enabled ? 'BLOQUEAR' : 'LIBERAR';
    if (!window.confirm(`Deseja ${action} o acesso de ${employee.name}?`)) return;
    setSuccessMessage(null);
    setStatus.mutate({ userId: employee.userId, enabled: !employee.enabled });
  }

  /**
   * Reenvia o convite e mostra a confirmação.
   * @param employee - funcionário da linha
   */
  function handleResendInvite(employee: Employee) {
    setSuccessMessage(null);
    resendInvite.mutate(employee.userId, { onSuccess: (data) => setSuccessMessage(data.message) });
  }

  // Erro de qualquer uma das ações (a mais recente aparece).
  const actionError = setStatus.error ?? resendInvite.error;
  const pendingUserId = setStatus.isPending
    ? setStatus.variables?.userId
    : resendInvite.isPending
      ? resendInvite.variables
      : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Funcionários</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Funcionários cadastram e atendem os próprios clientes e registram vendas. Eles não alteram o estoque.
          </p>
        </div>
        <Button className="sm:w-auto" onClick={() => setFormOpen(true)} disabled={isFull}>
          <Icon name="plus" className="size-4" strokeWidth={2.5} /> Novo funcionário
        </Button>
      </div>

      {/* Vagas do plano: quantos funcionários ativos há e quantos o plano permite. */}
      {employeesQuery.isSuccess && access && (
        <div
          className={`flex flex-col gap-2 rounded-xl px-4 py-3 text-sm ring-1 sm:flex-row sm:items-center sm:justify-between ${
            isFull ? 'bg-amber-50 text-amber-900 ring-amber-200' : 'bg-white text-zinc-700 ring-zinc-200'
          }`}
        >
          <p className="flex items-center gap-2">
            <Icon name="users" className="size-4" />
            <span>
              {maxEmployees === 0 ? (
                <>Sem plano ativo: não é possível cadastrar nem liberar funcionários.</>
              ) : (
                <>
                  <strong className="tabular-nums">{activeCount}</strong> de {maxEmployees ?? 'ilimitados'} funcionários ativos · {planName}
                  {isFull && ' · limite atingido'}
                </>
              )}
            </span>
          </p>
          {isFull && (
            <Link to="/plano" className="font-semibold text-amber-900 underline">
              {maxEmployees === 0 ? 'Ativar um plano' : 'Ver planos para liberar mais vagas'}
            </Link>
          )}
        </div>
      )}

      {successMessage && <Alert type="success">{successMessage}</Alert>}
      {actionError && <Alert type="error">{actionError.message}</Alert>}

      {employeesQuery.isPending && <p className="text-sm text-zinc-500">Carregando funcionários…</p>}
      {employeesQuery.isError && <Alert type="error">{employeesQuery.error.message}</Alert>}
      {employeesQuery.isSuccess && (
        <EmployeesTable
          employees={employeesQuery.data}
          pendingUserId={pendingUserId}
          onToggle={handleToggle}
          onResendInvite={handleResendInvite}
        />
      )}

      <p className="text-xs text-zinc-500">
        O convite é enviado pelo próprio Cognito (limite de 50 e-mails por dia) e pode cair no spam.
        A senha temporária vale 7 dias.
      </p>

      <EmployeeFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onCreated={(email) => setSuccessMessage(`Funcionário cadastrado! O convite foi enviado para ${email}.`)}
      />
    </div>
  );
}
