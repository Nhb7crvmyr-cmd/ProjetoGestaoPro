// Layout das telas públicas (login, cadastro, confirmação): painel da marca à esquerda e formulário à direita.

import { Outlet } from 'react-router';
import { Logo } from '../../components/ui/Logo';
import { SiteHighlights } from '../../features/auth/components/SiteHighlights';

/**
 * Moldura comum das telas de autenticação.
 * O <Outlet /> é o "buraco" onde o React Router coloca a página da rota atual
 * (LoginPage, SignUpPage...). Assim, o painel da marca não é repetido em cada página.
 * @returns a estrutura da tela
 */
export function AuthLayout() {
  return (
    // "lg:" = só em telas grandes (≥ 1024px). No celular, o painel da marca some
    // e fica só o formulário, com o logo em cima.
    <div className="min-h-dvh lg:grid lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-linear-to-br from-brand-800 via-brand-900 to-brand-950 p-12 lg:flex lg:flex-col lg:justify-between">
        {/* Círculos decorativos de fundo (pointer-events-none: não atrapalham cliques). */}
        <div className="pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-brand-400/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 size-80 rounded-full bg-brand-300/10" />

        <div className="relative">
          {/* size="lg": logo maior na página de login (pedido do usuário). */}
          <Logo variant="light" size="lg" />
        </div>

        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-tight text-white">
            A gestão da sua empresa, em um só lugar.
          </h1>
          <p className="mt-4 text-lg text-brand-100/80">
            Clientes, produtos, estoque, vendas e relatórios. Simples para o dono e para a equipe.
          </p>
          <div className="mt-10">
            <SiteHighlights />
          </div>
        </div>

        <p className="relative text-sm text-brand-300/70">© {new Date().getFullYear()} Gestão Pro</p>
      </aside>

      <main className="flex min-h-dvh items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo size="lg" />
          </div>
          <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200 sm:p-8">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
