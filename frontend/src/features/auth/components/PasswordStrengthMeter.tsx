// Medidor visual da força da senha: barra de 4 partes + nome da força + (opcional) lista de regras.

import { evaluatePassword } from '../utils/passwordStrength';
import { Icon } from '../../../components/ui/Icon';

/** Propriedades do medidor. */
interface PasswordStrengthMeterProps {
  /** A senha digitada (o formulário repassa a cada tecla). */
  password: string;
  /** Mostra a lista de regras obrigatórias (útil no cadastro). */
  showRules?: boolean;
}

// Cor de cada nota: índice 1 = fraca ... 4 = forte.
const barColors = ['bg-zinc-200', 'bg-red-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-600'];
const textColors = ['text-zinc-500', 'text-red-600', 'text-amber-600', 'text-lime-700', 'text-emerald-700'];

/**
 * Desenha o medidor. Não aparece enquanto o campo estiver vazio.
 * @param props - senha e se mostra as regras
 * @returns o medidor, ou nada se a senha estiver vazia
 */
export function PasswordStrengthMeter({ password, showRules = false }: PasswordStrengthMeterProps) {
  const { score, label, rules } = evaluatePassword(password);
  if (score === 0) return null;

  return (
    // aria-live="polite": o leitor de tela anuncia a mudança de força sem interromper.
    <div className="mt-2" aria-live="polite">
      <div className="flex items-center gap-3">
        <div className="grid flex-1 grid-cols-4 gap-1">
          {/* [1,2,3,4]: cada parte da barra se acende se a nota alcançar aquela posição. */}
          {[1, 2, 3, 4].map((step) => (
            <span key={step} className={`h-1.5 rounded-full transition-colors ${step <= score ? barColors[score] : 'bg-zinc-200'}`} />
          ))}
        </div>
        <span className={`w-12 text-right text-xs font-semibold ${textColors[score]}`}>{label}</span>
      </div>

      {showRules && (
        <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
          {rules.map((rule) => (
            <li key={rule.label} className={`flex items-center gap-1.5 text-xs ${rule.passed ? 'text-emerald-700' : 'text-zinc-500'}`}>
              <Icon name={rule.passed ? 'checkCircle' : 'circle'} className="size-3.5" />
              {rule.label}
              {/* Texto só para leitores de tela (sr-only = invisível na tela). */}
              <span className="sr-only">{rule.passed ? '(cumprida)' : '(pendente)'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
