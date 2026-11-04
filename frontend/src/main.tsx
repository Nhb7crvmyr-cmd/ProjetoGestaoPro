// Ponto de entrada do site: configura o Amplify e desenha o React dentro da div #root do index.html.

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { AppProviders } from './app/AppProviders';
import { router } from './app/router';
import './index.css';
import { configureAmplify } from './services/amplifyConfig';

// O Amplify precisa ser configurado ANTES de qualquer tela tentar fazer login.
configureAmplify();

// StrictMode: só no modo de desenvolvimento, o React roda algumas coisas 2 vezes
// de propósito, para ajudar a achar erros. Isso não acontece no site publicado.
// AppProviders: disponibiliza o cache do TanStack Query para todas as páginas.
// RouterProvider: escolhe qual página mostrar de acordo com o endereço (URL).
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  </StrictMode>,
);
