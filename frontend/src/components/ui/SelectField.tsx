// Caixa de seleção (<select>) reutilizável com rótulo e mensagem de erro, no mesmo visual do TextField.

import { useId, type Ref, type SelectHTMLAttributes } from 'react';

/** Propriedades: tudo de um <select> + rótulo, opções e erro. */
interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  /** Lista de opções: value = o que é salvo; label = o que aparece. */
  options: readonly { value: string; label: string }[];
  /** Texto da opção vazia inicial (ex.: "Selecione"). */
  placeholder?: string;
  error?: string;
  ref?: Ref<HTMLSelectElement>;
}

/**
 * Desenha o rótulo, a caixa de seleção e o erro.
 * @param props - propriedades do campo
 * @returns o bloco do campo
 */
export function SelectField({ label, options, placeholder, error, ref, className = '', ...rest }: SelectFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-700">
        {label}
      </label>
      <select
        {...rest}
        ref={ref}
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-xs outline-none transition focus:ring-2
          ${error ? 'border-red-400 focus:border-red-500 focus:ring-red-100' : 'border-zinc-300 focus:border-brand-600 focus:ring-brand-100'}`}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} className="mt-1.5 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
