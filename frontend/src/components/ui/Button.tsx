// Botão reutilizável com estado de "carregando" (desabilita e mostra um indicador girando).

import type { ButtonHTMLAttributes } from 'react';

/**
 * Propriedades do botão. "extends ButtonHTMLAttributes" significa:
 * aceita TUDO que um <button> normal aceita (onClick, type, disabled...) e mais as nossas.
 */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Quando true, o botão fica desabilitado e mostra "carregando". */
  isLoading?: boolean;
  /**
   * Estilo do botão (use SEMPRE a variante, em vez de passar outra cor por className: duas cores
   * de fundo na mesma classe "brigam", e o resultado pode ser texto branco sobre fundo branco).
   * - primary: azul-marinho (ação principal)  - secondary: discreto, com borda
   * - danger: vermelho (cancelar, excluir)      - inverse: branco, para usar sobre fundo escuro
   */
  variant?: 'primary' | 'secondary' | 'danger' | 'inverse';
}

const variantClasses = {
  primary: 'bg-brand-700 text-white hover:bg-brand-800 focus-visible:outline-brand-700',
  secondary: 'bg-white text-zinc-700 ring-1 ring-zinc-300 hover:bg-zinc-50 focus-visible:outline-zinc-400',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600',
  inverse: 'bg-white text-brand-900 hover:bg-brand-50 focus-visible:outline-white',
};

/**
 * Desenha o botão.
 * @param props - propriedades do botão (ver ButtonProps)
 * @returns o elemento <button>
 */
export function Button({ isLoading = false, variant = 'primary', disabled, children, className = '', ...rest }: ButtonProps) {
  // "...rest" junta todas as outras propriedades (onClick, type...) e repassa ao <button>.
  return (
    <button
      {...rest}
      disabled={disabled || isLoading}
      className={`inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition
        focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60
        ${variantClasses[variant]} ${className}`}
    >
      {isLoading && (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}
