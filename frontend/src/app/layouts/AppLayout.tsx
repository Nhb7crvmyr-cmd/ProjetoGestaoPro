// Layout das telas logadas: menu lateral escuro + barra superior (usuário e Sair) + conteúdo da página.
// No celular, o menu vira uma "gaveta" que abre pelo botão ☰.

import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { Logo } from '../../components/ui/Logo';
import { useSession } from '../../features/auth/context/SessionContext';
import { useCompany } from '../../features/empresa/hooks/useCompany';
import { signOutUser } from '../../features/auth/services/authService';
import { ROLE_LABELS } from '../../types/auth';
import { Sidebar } from './Sidebar';

/**
 * Moldura das páginas internas.
 * @returns o menu, a barra superior e a página atual
 */
export function AppLayout() {
  const { user } = useSession();
  const navigate = useNavigate();
  // O Chat ocupa a tela inteira (como o WhatsApp Web): sem margens nem largura máxima.
  const isFullScreen = useLocation().pathname.startsWith('/chat');
  const queryClient = useQueryClient();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const roleLabel = user.groups[0] ? ROLE_LABELS[user.groups[0]] : '';
  // Ferramentas liberadas pelo plano (para os cadeados do menu). O SuperAdmin não tem empresa.
  const isCompanyUser = user.groups.includes('Dono') || user.groups.includes('Funcionario');
  const access = useCompany(isCompanyUser).data?.access;
  const features = access?.features;
  const hasPlan = access ? access.planId !== null : undefined;
  // Linha abaixo do nome: "Cargo · Área" (do Meu perfil); sem cargo, mostra o perfil de acesso.
  const subtitle = [user.jobTitle || roleLabel, user.department].filter(Boolean).join(' · ');

  /** Sai da conta, limpa o cache e volta ao login. */
  async function handleSignOut() {
    setIsSigningOut(true);
    await signOutUser();
    // Apaga os dados guardados em cache, para o próximo usuário não ver dados deste.
    queryClient.clear();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-dvh lg:pl-64">
      {/* Menu fixo à esquerda em telas grandes (lg = 1024px ou mais). */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 lg:block">
        <Sidebar groups={user.groups} features={features} hasPlan={hasPlan} />
      </aside>

      {/* Gaveta do celular: só existe quando aberta. */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-brand-950/50" onClick={() => setMenuOpen(false)} aria-hidden="true" />
          <aside className="relative h-full w-64 max-w-[80%]">
            <Sidebar groups={user.groups} features={features} hasPlan={hasPlan} onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      )}

      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/90 backdrop-blur">
        <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Abrir menu"
            className="rounded-md p-2 text-zinc-600 hover:bg-zinc-100 lg:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5" aria-hidden="true">
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <div className="lg:hidden">
            <Logo showName={false} />
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Nome + cargo: clicar leva para "Meu perfil". */}
            <Link to="/perfil" className="flex items-center gap-3 rounded-lg px-2 py-1 transition hover:bg-zinc-100">
              <span className="hidden text-right sm:block">
                <span className="block text-sm font-medium leading-tight text-zinc-900">{user.name}</span>
                <span className="block text-xs text-zinc-500">{subtitle}</span>
              </span>
              {/* Avatar com a inicial do nome. */}
              <span className="flex size-9 items-center justify-center rounded-full bg-brand-800 text-sm font-semibold text-white" aria-hidden="true">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-600 ring-1 ring-zinc-300 transition hover:bg-zinc-50 disabled:opacity-60"
            >
              {isSigningOut ? 'Saindo…' : 'Sair'}
            </button>
          </div>
        </div>
      </header>

      <main className={isFullScreen ? '' : 'mx-auto max-w-6xl px-4 py-8 sm:px-6'}>
        <Outlet />
      </main>
    </div>
  );
}
