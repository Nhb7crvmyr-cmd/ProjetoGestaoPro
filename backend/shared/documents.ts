// Validação de CPF e CNPJ pelos dígitos verificadores (os 2 últimos números).
//
// COMO FUNCIONA: os dígitos verificadores são calculados a partir dos outros dígitos com pesos
// fixos. Se a conta não bater, o documento foi digitado errado (ou é inventado).
// CNPJ ALFANUMÉRICO: desde julho de 2026, novos CNPJs podem ter LETRAS nas 12 primeiras posições.
// No cálculo, cada caractere vale (código ASCII - 48): '0'..'9' → 0..9, 'A' → 17, 'B' → 18...

/**
 * Remove pontuação e deixa as letras maiúsculas (ex.: "12.abc.345/01de-35" → "12ABC34501DE35").
 * @param value - documento como digitado
 * @returns só números e letras maiúsculas
 */
export function normalizeDocument(value: string): string {
  return value.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
}

/**
 * Valida um CPF (11 números).
 * @param cpf - CPF só com números
 * @returns true se os dígitos verificadores estiverem corretos
 */
export function isValidCpf(cpf: string): boolean {
  // Formato errado ou todos os números iguais (111.111.111-11 passa na conta, mas é inválido).
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;

  /** Calcula um dígito verificador usando os primeiros "length" números. */
  const checkDigit = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(cpf[i]) * (length + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return checkDigit(9) === Number(cpf[9]) && checkDigit(10) === Number(cpf[10]);
}

/**
 * Valida um CNPJ (14 caracteres: 12 números/letras + 2 dígitos verificadores numéricos).
 * @param cnpj - CNPJ normalizado (sem pontuação, letras maiúsculas)
 * @returns true se os dígitos verificadores estiverem corretos
 */
export function isValidCnpj(cnpj: string): boolean {
  if (!/^[0-9A-Z]{12}\d{2}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) return false;

  /** Calcula um dígito verificador usando os primeiros "length" caracteres. */
  const checkDigit = (length: number) => {
    // Pesos oficiais: começam em 5 (ou 6) e "dão a volta" de 2 para 9.
    const weights = length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < length; i++) sum += (cnpj.charCodeAt(i) - 48) * weights[i];
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return checkDigit(12) === Number(cnpj[12]) && checkDigit(13) === Number(cnpj[13]);
}
