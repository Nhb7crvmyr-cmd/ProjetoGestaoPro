// Caixa de texto de várias linhas (<textarea>) com rótulo e erro, no mesmo visual do TextField.

import { useId, type Ref, type TextareaHTMLAttributes } from 'react';

/** Propriedades: tudo de um <textarea> + rótulo e erro. */
interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  ref?: Ref<HTMLTextAreaElement>;
}

/**
 * Desenha o rótulo, a caixa de texto e o erro.
 * @param props - propriedades do campo
 * @returns o bloco do campo
 */
export function TextAreaField({ label, error, ref, className = '', rows = 3, ...rest }: TextAreaFieldProps) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-700">
        {label}
      </label>
      <textarea
        {...rest}
        ref={ref}
        id={id}
        rows={rows}
        aria-invalid={error ? true : undefined}
        className={`block w-full resize-y rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-xs outline-none transition focus:ring-2
          ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-zinc-300 focus:border-brand-600 focus:ring-brand-100'}`}
      />
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
