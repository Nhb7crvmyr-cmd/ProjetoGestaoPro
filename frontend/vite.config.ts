// Configuração do Vite: o servidor local (npm run dev) e o empacotador do site (npm run build).

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// "Plugins" ensinam o Vite a lidar com coisas extras:
// - react(): entende arquivos .tsx (JSX) e recarrega a tela ao salvar.
// - tailwindcss(): gera as classes de estilo do Tailwind usadas no código.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // Se a porta 5173 estiver ocupada, dá erro em vez de usar outra porta "escondida".
    strictPort: true,
  },
});
