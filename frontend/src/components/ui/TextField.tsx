// Campo de texto reutilizável com rótulo e mensagem de erro, pronto para o React Hook Form.

import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from 'react';

/** Propriedades do campo: tudo de um <input> + rótulo, erro e dica. */
interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  /** Mensagem de erro (vem da validação do Zod). Quando existe, o campo fica vermelho. */
  error?: string;
  /** Texto de ajuda abaixo do campo (ex.: regras da senha). */
  hint?: string;
  /** Elemento extra dentro do campo, no canto direito (ex.: botão de mostrar senha). */
  endAddon?: ReactNode;
  /** Conteúdo extra abaixo do campo (ex.: medidor de força da senha). */
  footer?: ReactNode;
  /**
   * O React Hook Form precisa de uma "ref" (referência direta ao <input>) para ler o valor.
   * No React 19, "ref" pode ser recebida como uma propriedade comum.
   */
  ref?: Ref<HTMLInputElement>;
}

/**
 * Desenha o rótulo, o campo e a mensagem de erro/dica.
 * @param props - propriedades do campo (ver TextFieldProps)
 * @returns o bloco do campo
 */
export function TextField({ label, error, hint, endAddon, footer, ref, className = '', ...rest }: TextFieldProps) {
  // useId gera um id único, usado para ligar o <label> ao <input> (acessibilidade:
  // clicar no rótulo foca o campo, e leitores de tela leem o rótulo certo).
  const id = useId();
  const messageId = `${id}-message`;
  const message = error ?? hint;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-700">
        {label}
      </label>
      {/* "relative" permite posicionar o endAddon por cima do campo, no canto direito. */}
      <div className="relative">
        <input
          {...rest}
          ref={ref}
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          className={`block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-xs outline-none transition
            placeholder:text-zinc-400 focus:ring-2 ${endAddon ? 'pr-11' : ''}
            ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-zinc-300 focus:border-brand-600 focus:ring-brand-100'}`}
        />
        {endAddon && <div className="absolute inset-y-0 right-0 flex items-center pr-1.5">{endAddon}</div>}
      </div>
      {footer}
      {message && (
        <p id={messageId} className={`mt-1.5 text-xs ${error ? 'text-red-600' : 'text-zinc-500'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
