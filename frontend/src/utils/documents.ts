// Validação de CPF e CNPJ pelos dígitos verificadores (mesma regra do backend: backend/shared/documents.ts).
// Validar aqui é só para avisar o usuário na hora. O backend valida de novo, porque é ele quem garante.

/**
 * Valida um CPF.
 * @param cpf - CPF só com números (11)
 * @returns true se os dígitos verificadores batem
 */
export function isValidCpf(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;
  const checkDigit = (length: number) => {
    let sum = 0;
    for (let i = 0; i < length; i++) sum += Number(cpf[i]) * (length + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return checkDigit(9) === Number(cpf[9]) && checkDigit(10) === Number(cpf[10]);
}

/**
 * Valida um CNPJ, inclusive o novo CNPJ alfanumérico (letras nas 12 primeiras posições).
 * @param cnpj - CNPJ sem pontuação, letras maiúsculas (14)
 * @returns true se os dígitos verificadores batem
 */
export function isValidCnpj(cnpj: string): boolean {
  if (!/^[0-9A-Z]{12}\d{2}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) return false;
  const checkDigit = (length: number) => {
    const weights = length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    // charCodeAt - 48: '0' vira 0, '9' vira 9, 'A' vira 17... (regra oficial do CNPJ alfanumérico)
    for (let i = 0; i < length; i++) sum += (cnpj.charCodeAt(i) - 48) * weights[i];
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  return checkDigit(12) === Number(cnpj[12]) && checkDigit(13) === Number(cnpj[13]);
}
