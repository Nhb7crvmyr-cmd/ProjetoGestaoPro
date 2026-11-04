// Menu lateral escuro (mesmas cores do painel do login): logo, itens por perfil e módulos "Em breve".

import { NavLink } from 'react-router';
import { Icon } from '../../components/ui/Icon';
import { planForFeature, type PlanFeature } from '../../features/empresa/constants/plans';
import { Logo } from '../../components/ui/Logo';
import type { UserGroup } from '../../types/auth';
import { NAV_SECTIONS } from './navigation';

/** Propriedades do menu. */
interface SidebarProps {
  groups: UserGroup[];
  /** Ferramentas liberadas pelo plano da empresa (undefined = ainda carregando ou SuperAdmin). */
  features?: PlanFeature[];
  /** false = empresa sem plano ativo (itens "requiresPlan" ficam com cadeado). undefined = carregando/SuperAdmin. */
  hasPlan?: boolean;
  /** Chamado ao clicar em um link (no celular, fecha o menu). */
  onNavigate?: () => void;
}

/**
 * Desenha o menu, mostrando só os itens que os grupos do usuário podem ver.
 * @param props - grupos do usuário e ação ao navegar
 * @returns o menu lateral
 */
export function Sidebar({ groups, features, hasPlan, onNavigate }: SidebarProps) {
  // Filtra: cada seção fica só com os itens permitidos; seções vazias somem.
  const sections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => item.groups.some((group) => groups.includes(group))),
  })).filter((section) => section.items.length > 0);

  return (
    // Azul-marinho profundo e fosco (brand-950), com uma borda sutil à direita: visual "clean".
    <div className="flex h-full flex-col border-r border-white/5 bg-brand-950">
      <div className="flex h-16 shrink-0 items-center border-b border-white/5 px-5">
        <Logo variant="light" />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Menu principal">
        {sections.map((section) => (
          <div key={section.title}>
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-300/60">{section.title}</p>
            <ul className="mt-2 space-y-0.5">
              {section.items.map((item) => {
                const icon = (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="size-[18px] shrink-0" aria-hidden="true">
                    <path d={item.icon} />
                  </svg>
                );

                // Fora do plano: cadeado + nome do plano que libera (ex.: "Profissional"; "Básico" para Funcionários).
                const lockedByFeature = item.feature !== undefined && features !== undefined && !features.includes(item.feature);
                const lockedByPlan = item.requiresPlan === true && hasPlan === false;
                const lockedPlanName = item.feature ? planForFeature(item.feature)?.name : 'Básico';
                if (lockedByFeature || lockedByPlan) {
                  return (
                    <li key={item.label}>
                      <NavLink
                        to="/plano"
                        onClick={onNavigate}
                        title={`Disponível a partir do plano ${lockedPlanName}`}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-brand-300/50 transition hover:bg-white/[0.04] hover:text-brand-100"
                      >
                        {icon}
                        {item.label}
                        <span className="ml-auto inline-flex items-center gap-1 rounded-full border border-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                          <Icon name="lock" className="size-3" />
                          {lockedPlanName}
                        </span>
                      </NavLink>
                    </li>
                  );
                }

                // Sem "to": módulo ainda não construído. Aparece apagado, com "Em breve".
                if (!item.to) {
                  return (
                    <li key={item.label}>
                      <span className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2 text-sm text-brand-300/40" aria-disabled="true">
                        {icon}
                        {item.label}
                        <span className="ml-auto rounded-full border border-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-300/50">Em breve</span>
                      </span>
                    </li>
                  );
                }

                return (
                  <li key={item.label}>
                    {/* "end": só fica ativo no endereço EXATO. Usado no /admin (senão ficaria ativo em /admin/empresas);
                        nos outros, /vendas continua ativo em /vendas/nova. */}
                    <NavLink
                      to={item.to}
                      end={item.to === '/admin'}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        `relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                          isActive ? 'bg-white/[0.08] text-white' : 'text-brand-100/70 hover:bg-white/[0.05] hover:text-white'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          {/* Item ativo: um traço fino na cor da marca, à esquerda. */}
                          {isActive && <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-brand-300" aria-hidden="true" />}
                          <span className={isActive ? 'text-white' : 'text-brand-300/70'}>{icon}</span>
                          {item.label}
                        </>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );
}
