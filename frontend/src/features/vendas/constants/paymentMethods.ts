// Formas de pagamento (iguais às do backend: backend/shared/sale.ts), com o nome que aparece na tela.

export const PAYMENT_METHODS = [
  { value: 'PIX', label: 'Pix' },
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'CARTAO_CREDITO', label: 'Cartão de crédito' },
  { value: 'CARTAO_DEBITO', label: 'Cartão de débito' },
  { value: 'BOLETO', label: 'Boleto' },
  { value: 'OUTRO', label: 'Outro' },
] as const;

/** 'PIX' | 'DINHEIRO' | ... (gerado a partir da lista acima). */
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]['value'];

/**
 * Nome amigável da forma de pagamento.
 * @param value - código (ex.: 'CARTAO_CREDITO')
 * @returns nome (ex.: 'Cartão de crédito')
 */
export function paymentLabel(value: string): string {
  return PAYMENT_METHODS.find((method) => method.value === value)?.label ?? value;
}
