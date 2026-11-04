// Máscaras e formatação de dados brasileiros: CPF, CNPJ, CEP, telefone, dinheiro e data.
// As máscaras só mudam a APARÊNCIA no campo; ao enviar à API mandamos só números (onlyDigits).

/**
 * Remove tudo que não é número.
 * @param value - texto qualquer (ex.: "(11) 98765-4321")
 * @returns só os números (ex.: "11987654321")
 */
export function onlyDigits(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Remove pontuação do documento, mantendo letras (CNPJ alfanumérico) em maiúsculas.
 * @param value - documento digitado
 * @returns só números e letras maiúsculas
 */
export function normalizeDocument(value: string): string {
  return value.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
}

/**
 * Máscara de CPF: 000.000.000-00.
 * @param value - texto digitado
 * @returns CPF formatado (parcial enquanto a pessoa digita)
 */
export function formatCpf(value: string): string {
  return onlyDigits(value)
    .slice(0, 11)
    // Cada .replace encaixa um ponto/traço. "$1" = o que o 1º parêntese capturou.
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

/**
 * Máscara de CNPJ: 00.000.000/0000-00. Aceita letras nas 12 primeiras posições (CNPJ alfanumérico).
 * @param value - texto digitado
 * @returns CNPJ formatado
 */
export function formatCnpj(value: string): string {
  const raw = normalizeDocument(value).slice(0, 14);
  return raw
    .replace(/^(\w{2})(\w)/, '$1.$2')
    .replace(/^(\w{2})\.(\w{3})(\w)/, '$1.$2.$3')
    .replace(/\.(\w{3})(\w)/, '.$1/$2')
    .replace(/(\w{4})(\w{1,2})$/, '$1-$2');
}

/**
 * Máscara de CEP: 00000-000.
 * @param value - texto digitado
 * @returns CEP formatado
 */
export function formatCep(value: string): string {
  return onlyDigits(value).slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');
}

/**
 * Máscara de telefone: (00) 0000-0000 ou (00) 00000-0000.
 * @param value - texto digitado
 * @returns telefone formatado
 */
export function formatPhone(value: string): string {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d{1,4})$/, '$1-$2');
  }
  return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d{4})$/, '$1-$2');
}

/** Formatador de moeda brasileira (R$). Criado uma vez e reutilizado. */
const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

/**
 * Converte centavos em texto de dinheiro.
 * @param cents - valor em centavos (ex.: 4990)
 * @returns texto (ex.: "R$ 49,90")
 */
export function formatCents(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

/**
 * Formata uma data ISO no padrão brasileiro.
 * @param iso - data em ISO (ex.: "2026-10-16T18:00:00.000Z")
 * @returns texto (ex.: "16/10/2026")
 */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' }).format(new Date(iso));
}

/**
 * Formata a data E a hora no padrão brasileiro.
 * @param iso - data em ISO
 * @returns texto (ex.: "16/10/2026 15:42")
 */
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
}

/**
 * Máscara de dinheiro para campos de formulário: o usuário digita só números e
 * a vírgula "anda" sozinha (1 → 0,01; 12 → 0,12; 1250 → 12,50; 125000 → 1.250,00).
 * @param value - texto digitado
 * @returns texto formatado (sem "R$"), ou vazio
 */
export function formatMoneyInput(value: string): string {
  // Tira zeros à esquerda e limita a 11 dígitos (até R$ 999.999.999,99).
  const digits = onlyDigits(value).replace(/^0+/, '').slice(0, 11);
  if (!digits) return '';
  return (Number(digits) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Converte o texto do campo de dinheiro em centavos.
 * @param value - texto do campo (ex.: "1.250,00")
 * @returns centavos (ex.: 125000)
 */
export function parseMoneyInput(value: string): number {
  return Number(onlyDigits(value) || '0');
}

/**
 * Converte centavos no texto do campo de dinheiro (usado para preencher o formulário de edição).
 * @param cents - valor em centavos (ex.: 4990)
 * @returns texto (ex.: "49,90")
 */
export function centsToMoneyInput(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
