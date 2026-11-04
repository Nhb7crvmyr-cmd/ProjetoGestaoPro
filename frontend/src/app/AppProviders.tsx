// Provedores globais do app: hoje, só o TanStack Query (cache das chamadas à API).

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

/**
 * QueryClient = o "cache" das chamadas à API. Ele guarda as respostas, evita buscar
 * de novo à toa e refaz a busca quando os dados ficam "velhos".
 * Fica fora do componente para ser criado uma única vez.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Dados valem por 30 segundos antes de serem considerados "velhos".
      staleTime: 30_000,
      // Em caso de erro, tenta de novo só 1 vez (o padrão é 3).
      retry: 1,
      // Não busca de novo só porque você trocou de aba e voltou (economiza chamadas).
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Envolve o app com os provedores. "Provider" é um padrão do React que disponibiliza
 * algo (aqui, o cache) para TODOS os componentes de dentro, sem passar de pai para filho.
 * @param props - o app
 * @returns o app envolvido pelos provedores
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
