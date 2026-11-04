// Calcula a força de uma senha e quais regras do Cognito ela já cumpre (só para mostrar na tela).

/** Uma regra de senha e se ela foi cumprida. */
export interface PasswordRule {
  label: string;
  passed: boolean;
}

/** Resultado da análise da senha. */
export interface PasswordStrength {
  /** 0 = vazia, 1 = fraca, 2 = média, 3 = boa, 4 = forte. */
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  /** Regras OBRIGATÓRIAS do Cognito (as mesmas de infra/lib/auth-stack.ts). */
  rules: PasswordRule[];
}

const labels = ['', 'Fraca', 'Média', 'Boa', 'Forte'] as const;

/**
 * Avalia a senha com critérios simples: tamanho e variedade de caracteres.
 * Não é uma garantia de segurança, é só um guia visual para o usuário.
 * @param password - a senha digitada
 * @returns a nota (0 a 4), o nome da nota e a lista de regras
 */
export function evaluatePassword(password: string): PasswordStrength {
  // Expressões regulares (regex): /[a-z]/ = "tem pelo menos uma letra de a até z".
  const rules: PasswordRule[] = [
    { label: '8 caracteres ou mais', passed: password.length >= 8 },
    { label: 'Letra minúscula', passed: /[a-z]/.test(password) },
    { label: 'Letra maiúscula', passed: /[A-Z]/.test(password) },
    { label: 'Número', passed: /[0-9]/.test(password) },
  ];

  if (!password) return { score: 0, label: '', rules };

  // Pontos extras (não obrigatórios): símbolo e senha longa deixam a senha mais forte.
  const passedCount = rules.filter((rule) => rule.passed).length;
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);
  const isLong = password.length >= 12;

  let score: PasswordStrength['score'];
  if (passedCount < 4) {
    // Ainda não cumpre o mínimo do Cognito: fraca (ou média, se estiver perto).
    score = passedCount <= 2 ? 1 : 2;
  } else {
    // Cumpre o mínimo: "boa"; com símbolo E tamanho ≥ 12: "forte".
    score = hasSymbol && isLong ? 4 : 3;
  }

  return { score, label: labels[score], rules };
}
