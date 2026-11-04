// Rotas do site: qual página aparece em cada endereço (URL).

import { createBrowserRouter, Navigate } from 'react-router';
import { AdminCompaniesPage } from '../features/admin/pages/AdminCompaniesPage';
import { AdminCompanyCustomersPage } from '../features/admin/pages/AdminCompanyCustomersPage';
import { AdminCustomersPage } from '../features/admin/pages/AdminCustomersPage';
import { AdminUsersPage } from '../features/admin/pages/AdminUsersPage';
import { RequireAuth } from '../features/auth/components/RequireAuth';
import { ChatPage } from '../features/chat/pages/ChatPage';
import { CustomersPage } from '../features/clientes/pages/CustomersPage';
import { RequireGroup } from '../features/auth/components/RequireGroup';
import { ConfirmSignUpPage } from '../features/auth/pages/ConfirmSignUpPage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { ProfilePage } from '../features/auth/pages/ProfilePage';
import { SignUpPage } from '../features/auth/pages/SignUpPage';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage';
import { HomePage } from '../features/dashboard/pages/HomePage';
import { RequireCompany } from '../features/empresa/components/RequireCompany';
import { OnboardingPage } from '../features/empresa/pages/OnboardingPage';
import { StockPage } from '../features/estoque/pages/StockPage';
import { EmployeesPage } from '../features/funcionarios/pages/EmployeesPage';
import { PlanPage } from '../features/planos/pages/PlanPage';
import { ProductsPage } from '../features/produtos/pages/ProductsPage';
import { NewSalePage } from '../features/vendas/pages/NewSalePage';
import { SalesPage } from '../features/vendas/pages/SalesPage';
import { AppLayout } from './layouts/AppLayout';
import { AuthLayout } from './layouts/AuthLayout';

/**
 * Árvore de rotas. Rotas "filhas" (children) aparecem dentro do <Outlet /> da rota "mãe".
 *   /login, /cadastro, /confirmar → telas públicas (AuthLayout)
 *   /onboarding                   → logado, ainda sem empresa
 *   /inicio, /perfil              → logado e com empresa (ou SuperAdmin)
 *   /produtos                     → Dono e Funcionario (funcionário só consulta)
 *   /clientes                     → Dono (todos) e Funcionario (só os dele)
 *   /vendas, /vendas/nova         → Dono (todas) e Funcionario (só as dele)
 *   /dashboard                    → Dono (empresa toda) e Funcionario (só os números dele)
 *   /chat                         → Dono e Funcionario, com plano que inclui Chat (PRÉVIA, só no site)
 *   /funcionarios, /estoque, /plano → só Dono
 *   /admin, /admin/empresas       → só SuperAdmin
 *   /admin/empresas/:empresaId/clientes → só SuperAdmin (suporte: transferir atendimento)
 *   /admin/clientes               → só SuperAdmin (escolhe a empresa e vê/transfere os clientes)
 */
export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  {
    // Rota sem "path": só agrupa as páginas que usam o mesmo layout.
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/cadastro', element: <SignUpPage /> },
      { path: '/confirmar', element: <ConfirmSignUpPage /> },
    ],
  },
  {
    // Camadas de "porteiros", de fora para dentro:
    // RequireAuth (está logado?) → RequireCompany (já tem empresa?) → AppLayout → páginas.
    element: <RequireAuth />,
    children: [
      { path: '/onboarding', element: <OnboardingPage /> },
      {
        element: <RequireCompany />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { path: '/inicio', element: <HomePage /> },
              { path: '/perfil', element: <ProfilePage /> },
              {
                element: <RequireGroup allowed={['Dono', 'Funcionario']} />,
                children: [
                  { path: '/produtos', element: <ProductsPage /> },
                  { path: '/clientes', element: <CustomersPage /> },
                  { path: '/vendas', element: <SalesPage /> },
                  { path: '/vendas/nova', element: <NewSalePage /> },
                  { path: '/dashboard', element: <DashboardPage /> },
                  { path: '/chat', element: <ChatPage /> },
                ],
              },
              {
                element: <RequireGroup allowed={['Dono']} />,
                children: [
                  { path: '/funcionarios', element: <EmployeesPage /> },
                  { path: '/estoque', element: <StockPage /> },
                  { path: '/plano', element: <PlanPage /> },
                ],
              },
              {
                element: <RequireGroup allowed={['SuperAdmin']} />,
                children: [
                  { path: '/admin', element: <AdminUsersPage /> },
                  { path: '/admin/empresas', element: <AdminCompaniesPage /> },
                  // ":empresaId" é um parâmetro: qualquer valor nessa posição da URL cai aqui.
                  { path: '/admin/empresas/:empresaId/clientes', element: <AdminCompanyCustomersPage /> },
                  { path: '/admin/clientes', element: <AdminCustomersPage /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/login" replace /> },
]);
