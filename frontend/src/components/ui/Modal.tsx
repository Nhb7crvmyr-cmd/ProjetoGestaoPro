// Janela "popup" (modal) reutilizável: fundo escurecido, fecha com Esc ou no X, e trava a rolagem da página.

import { useEffect, useId, type ReactNode } from 'react';

/** Propriedades do modal. */
interface ModalProps {
  /** Mostra (true) ou esconde (false). */
  open: boolean;
  /** Chamado quando a pessoa pede para fechar (Esc, X ou clique fora). */
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Largura máxima: "md" para conteúdo simples, "2xl" para formulários grandes, "4xl" para tabelas e planos. */
  size?: 'md' | '2xl' | '4xl';
}

/** Classe de largura de cada tamanho. */
const SIZE_CLASSES = { md: 'max-w-md', '2xl': 'max-w-2xl', '4xl': 'max-w-4xl' } as const;

/**
 * Desenha o modal por cima da página.
 * @param props - estado, título, conteúdo e ação de fechar
 * @returns o modal, ou nada quando fechado
 */
export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  const titleId = useId();

  // Enquanto aberto: Esc fecha, e a página de trás não rola.
  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // A função devolvida pelo useEffect é a "limpeza": roda quando o modal fecha.
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-brand-950/50 p-4 backdrop-blur-[2px] sm:items-center">
      {/* Clique no fundo escuro fecha o modal. */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* role="dialog" + aria-modal avisam aos leitores de tela que é uma janela sobreposta. */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`relative my-8 w-full rounded-2xl bg-white shadow-xl ${SIZE_CLASSES[size]}`}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4 sm:px-6">
          <h2 id={titleId} className="text-lg font-semibold text-zinc-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-md p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="size-5" aria-hidden="true">
              <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}
