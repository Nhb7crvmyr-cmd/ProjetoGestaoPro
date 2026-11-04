// Itens do menu lateral do sistema: para onde cada um leva, quem vê e se já está pronto.

import type { PlanFeature } from '../../features/empresa/constants/plans';
import type { UserGroup } from '../../types/auth';

/** Um item do menu. */
export interface NavItem {
  label: string;
  /** Endereço da página. Sem "to" = módulo ainda não construído ("Em breve"). */
  to?: string;
  /** Grupos que veem o item. */
  groups: UserGroup[];
  /** Ícone: o "d" de um <path> SVG (desenhos simples de 24×24). */
  icon: string;
  /** Ferramenta que depende do plano (sem ela no plano, o item aparece com cadeado). */
  feature?: PlanFeature;
  /** true = precisa de QUALQUER plano ativo (sem plano, aparece com cadeado "Básico"). */
  requiresPlan?: boolean;
}

/** Grupos de itens, cada um com um título. */
export const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Geral',
    items: [
      { label: 'Início', to: '/inicio', groups: ['SuperAdmin', 'Dono', 'Funcionario'], icon: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10' },
      { label: 'Meu plano', to: '/plano', groups: ['Dono'], icon: 'M2 18 4 6l5 5 3-7 3 7 5-5 2 12ZM4 21h16' },
      { label: 'Meu perfil', to: '/perfil', groups: ['SuperAdmin', 'Dono', 'Funcionario'], icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0' },
      { label: 'Dashboard', to: '/dashboard', groups: ['Dono', 'Funcionario'], icon: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
    ],
  },
  {
    title: 'Operação',
    items: [
      { label: 'Clientes', to: '/clientes', groups: ['Dono', 'Funcionario'], icon: 'M16 19v-1a4 4 0 0 0-8 0v1M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z' },
      { label: 'Produtos', to: '/produtos', groups: ['Dono', 'Funcionario'], icon: 'M3 7l9-4 9 4-9 4-9-4Zm0 0v10l9 4 9-4V7M12 11v10' },
      { label: 'Estoque', to: '/estoque', groups: ['Dono'], icon: 'M4 4h16v6H4zM4 14h16v6H4zM8 7h.01M8 17h.01' },
      { label: 'Vendas', to: '/vendas', groups: ['Dono', 'Funcionario'], icon: 'M3 4h2l2 12h12l2-8H7M9 20h.01M18 20h.01' },
      { label: 'Funcionários', to: '/funcionarios', requiresPlan: true, groups: ['Dono'], icon: 'M17 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M10 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM21 20v-1a4 4 0 0 0-3-3.9M16 5.1a3 3 0 0 1 0 5.8' },
    ],
  },
  {
    title: 'Crescimento',
    items: [
      { label: 'Chat', to: '/chat', feature: 'chat', groups: ['Dono', 'Funcionario'], icon: 'M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z' },
      { label: 'Automações', feature: 'automations', groups: ['Dono'], icon: 'M13 2 4 14h7l-1 8 9-12h-7l1-8Z' },
      { label: 'Marketing', feature: 'marketing', groups: ['Dono'], icon: 'M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1ZM16 8a5 5 0 0 1 0 8' },
      { label: 'Relatórios', groups: ['Dono'], icon: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6' },
    ],
  },
  {
    title: 'Administração',
    items: [
      { label: 'Usuários', to: '/admin', groups: ['SuperAdmin'], icon: 'M16 19v-1a4 4 0 0 0-8 0v1M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z' },
      { label: 'Empresas', to: '/admin/empresas', groups: ['SuperAdmin'], icon: 'M4 21V5l8-3 8 3v16M9 21v-4h6v4M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01' },
      // Suporte: escolher a empresa e ver/transferir os clientes dela.
      { label: 'Clientes', to: '/admin/clientes', groups: ['SuperAdmin'], icon: 'M16 19v-1a4 4 0 0 0-8 0v1M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM19 8v6M22 11h-6' },
    ],
  },
];
