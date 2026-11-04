// Caixa de aviso reutilizável (erro ou sucesso) exibida acima dos formulários.

import type { ReactNode } from 'react';

/** Propriedades do aviso. */
interface AlertProps {
  /** "error" = vermelho; "success" = verde. */
  type: 'error' | 'success';
  children: ReactNode;
}

const typeClasses = {
  error: 'border-red-200 bg-red-50 text-red-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

/**
 * Desenha a caixa de aviso.
 * @param props - tipo e conteúdo do aviso
 * @returns o elemento do aviso
 */
export function Alert({ type, children }: AlertProps) {
  // role="alert" faz o leitor de tela anunciar a mensagem assim que ela aparece.
  return (
    <div role="alert" className={`rounded-lg border px-3 py-2.5 text-sm ${typeClasses[type]}`}>
      {children}
    </div>
  );
}
