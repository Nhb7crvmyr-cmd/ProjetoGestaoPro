// Seletor "CNPJ ou CPF" no formato de dois cartões clicáveis (botões de rádio estilizados).

/** Propriedades do seletor. */
interface DocumentTypeToggleProps {
  value: 'CNPJ' | 'CPF';
  onChange: (value: 'CNPJ' | 'CPF') => void;
}

const OPTIONS = [
  { value: 'CNPJ', title: 'Empresa (CNPJ)', text: 'Tenho uma empresa aberta.' },
  { value: 'CPF', title: 'Pessoa física (CPF)', text: 'Trabalho por conta própria.' },
] as const;

/**
 * Desenha os dois cartões. Por baixo, são <input type="radio">: funciona com teclado (setas)
 * e leitores de tela, e o visual vem do Tailwind (classe "has-checked:" quando marcado).
 * @param props - valor atual e função de troca
 * @returns o seletor
 */
export function DocumentTypeToggle({ value, onChange }: DocumentTypeToggleProps) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-semibold text-zinc-900">Tipo de cadastro</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {OPTIONS.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer gap-3 rounded-xl p-4 ring-1 ring-zinc-300 transition hover:bg-zinc-50
              has-checked:bg-brand-50 has-checked:ring-2 has-checked:ring-brand-600"
          >
            <input
              type="radio"
              name="documentType"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="mt-0.5 size-4 accent-brand-700"
            />
            <span>
              <span className="block text-sm font-semibold text-zinc-900">{option.title}</span>
              <span className="block text-sm text-zinc-500">{option.text}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
