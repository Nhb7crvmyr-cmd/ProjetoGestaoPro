// Tabela de empresas do painel admin: documento, dono, cidade, plano e data de cadastro.

import { Link } from 'react-router';
import { formatCnpj, formatCpf, formatDate } from '../../../utils/formatters';
import type { AdminCompany } from '../services/adminService';

/** Nome amigável de cada plano. */
const PLAN_NAMES: Record<string, string> = { basico: 'Básico', profissional: 'Profissional', premium: 'Premium' };

/**
 * Etiqueta do plano: Pendente, Ativo (com nome) ou Vencido.
 * @param props - a empresa
 * @returns a etiqueta colorida
 */
function PlanBadge({ company }: { company: AdminCompany }) {
  const isExpired = company.planStatus === 'ACTIVE' && !!company.planExpiresAt && new Date(company.planExpiresAt) < new Date();
  let label = 'Pendente';
  let classes = 'bg-amber-50 text-amber-700 ring-amber-200';
  if (isExpired) {
    label = 'Vencido';
    classes = 'bg-red-50 text-red-700 ring-red-200';
  } else if (company.planStatus === 'ACTIVE') {
    label = PLAN_NAMES[company.planId ?? ''] ?? 'Ativo';
    classes = 'bg-emerald-50 text-emerald-700 ring-emerald-200';
  }
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${classes}`}>{label}</span>;
}

/**
 * Desenha a tabela.
 * @param props - lista de empresas
 * @returns a tabela (ou mensagem se vazia)
 */
export function CompaniesTable({ companies, onSetPlan }: { companies: AdminCompany[]; onSetPlan: (company: AdminCompany) => void }) {
  if (companies.length === 0) {
    return <p className="rounded-xl bg-white p-8 text-center text-sm text-zinc-500 ring-1 ring-zinc-200">Nenhuma empresa cadastrada ainda.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-zinc-200">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-medium">Empresa</th>
            <th className="px-4 py-3 font-medium">Documento</th>
            <th className="px-4 py-3 font-medium">Supervisor (dono)</th>
            <th className="px-4 py-3 font-medium">Cidade</th>
            <th className="px-4 py-3 font-medium">Plano</th>
            <th className="px-4 py-3 font-medium">Cadastro</th>
            <th className="px-4 py-3 text-right font-medium">Suporte</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {companies.map((company) => (
            <tr key={company.empresaId} className="hover:bg-zinc-50/60">
              <td className="px-4 py-3">
                <p className="font-medium text-zinc-900">{company.tradeName || company.legalName}</p>
                {company.tradeName && <p className="text-zinc-500">{company.legalName}</p>}
              </td>
              <td className="px-4 py-3 tabular-nums text-zinc-700">
                <span className="mr-1 text-xs text-zinc-400">{company.documentType}</span>
                {company.documentType === 'CNPJ' ? formatCnpj(company.document) : formatCpf(company.document)}
              </td>
              <td className="px-4 py-3 text-zinc-700">{company.ownerEmail}</td>
              <td className="px-4 py-3 text-zinc-700">
                {company.city}/{company.state}
              </td>
              <td className="px-4 py-3">
                <PlanBadge company={company} />
              </td>
              <td className="px-4 py-3 tabular-nums text-zinc-600">{formatDate(company.createdAt)}</td>
              <td className="px-4 py-3">
                <div className="flex justify-end gap-2">
                {/* Suporte: definir o plano (cortesia, teste, correção). */}
                <button
                  type="button"
                  onClick={() => onSetPlan(company)}
                  className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 transition hover:bg-brand-50"
                >
                  Plano
                </button>
                {/* Abre os clientes desta empresa para transferir atendimento. */}
                <Link
                  to={`/admin/empresas/${company.empresaId}/clientes`}
                  className="rounded-md px-2.5 py-1.5 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-300 transition hover:bg-zinc-50"
                >
                  Clientes
                </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
