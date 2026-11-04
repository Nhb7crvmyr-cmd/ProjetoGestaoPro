// Cartões de resumo do painel admin: total de usuários, ativos, bloqueados e donos de empresa.

import type { AdminUser } from '../services/adminService';

/**
 * Calcula os números a partir da lista e desenha 4 cartões.
 * @param props - lista de usuários
 * @returns a linha de cartões
 */
export function AdminStats({ users }: { users: AdminUser[] }) {
  const stats = [
    { label: 'Usuários', value: users.length },
    { label: 'Ativos', value: users.filter((user) => user.enabled).length },
    { label: 'Bloqueados', value: users.filter((user) => !user.enabled).length },
    { label: 'Donos de empresa', value: users.filter((user) => user.groups.includes('Dono')).length },
  ];

  return (
    // 2 colunas no celular, 4 em telas maiores.
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl bg-white p-4 ring-1 ring-zinc-200">
          <p className="text-sm text-zinc-500">{stat.label}</p>
          {/* tabular-nums: números com largura igual, ficam alinhados. */}
          <p className="mt-1 text-2xl font-bold tabular-nums text-zinc-900">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
