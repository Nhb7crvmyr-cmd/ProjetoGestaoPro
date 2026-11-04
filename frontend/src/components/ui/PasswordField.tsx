// Campo de senha com botão de "olho" para mostrar/esconder o que foi digitado.

import { useState, type ComponentProps } from 'react';
import { TextField } from './TextField';

/**
 * Aceita as mesmas propriedades do TextField, menos "type" (quem decide o type é o botão)
 * e "endAddon" (o lugar do botão). "Omit" remove propriedades de um tipo.
 */
type PasswordFieldProps = Omit<ComponentProps<typeof TextField>, 'type' | 'endAddon'>;

/**
 * Desenha o campo de senha com o botão de visualizar.
 * @param props - as mesmas do TextField (label, error, register...)
 * @returns o campo de senha
 */
export function PasswordField(props: PasswordFieldProps) {
  // Estado local: true = mostra a senha em texto; false = mostra bolinhas.
  const [isVisible, setIsVisible] = useState(false);

  const toggleButton = (
    <button
      // type="button" é importante: sem ele, o botão ENVIARIA o formulário.
      type="button"
      onClick={() => setIsVisible((visible) => !visible)}
      aria-label={isVisible ? 'Esconder senha' : 'Mostrar senha'}
      aria-pressed={isVisible}
      className="rounded-md p-2 text-zinc-400 transition hover:text-zinc-700 focus-visible:outline-2 focus-visible:outline-brand-600"
    >
      {isVisible ? (
        // Ícone de olho riscado (senha visível → clique para esconder).
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A9.8 9.8 0 0 1 12 5c5 0 9 4.5 10 7-.4 1-1.3 2.4-2.6 3.7M6.3 6.3C4.3 7.6 2.8 9.6 2 12c1 2.5 5 7 10 7 1.9 0 3.6-.6 5.1-1.5" />
        </svg>
      ) : (
        // Ícone de olho aberto (senha escondida → clique para mostrar).
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="size-5" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7S3 14.5 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );

  return <TextField {...props} type={isVisible ? 'text' : 'password'} endAddon={toggleButton} />;
}
