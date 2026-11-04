// Regras de validação (Zod) de um endereço brasileiro. Usado pela empresa e, depois, pelos clientes.

import * as z from 'zod/mini';

/** Lista das 27 unidades federativas (estados + DF). */
const UF_LIST = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

/**
 * Texto obrigatório: tira espaços das pontas e limita o tamanho.
 * No zod/mini as regras entram em ".check(...)". z.trim() "limpa" o texto antes das outras regras.
 * @param label - nome do campo (para a mensagem de erro)
 * @param max - tamanho máximo
 * @returns o schema do campo
 */
export const requiredText = (label: string, max: number) =>
  // "Campo obrigatório: X" funciona para qualquer campo (evita "Cidade é obrigatório").
  z.string(`Campo obrigatório: ${label}.`).check(
    z.trim(),
    z.minLength(1, `Campo obrigatório: ${label}.`),
    z.maxLength(max, `${label}: no máximo ${max} caracteres.`),
  );

/** Endereço completo. O CEP chega só com números (o site tira o traço). */
export const addressSchema = z.object({
  zipCode: z.string('CEP é obrigatório.').check(z.regex(/^\d{8}$/, 'CEP deve ter 8 números.')),
  street: requiredText('Rua', 150),
  number: requiredText('Número', 20),
  complement: z.optional(z.string().check(z.trim(), z.maxLength(100, 'Complemento: no máximo 100 caracteres.'))),
  district: requiredText('Bairro', 100),
  city: requiredText('Cidade', 100),
  state: z.enum(UF_LIST, 'Estado (UF) inválido.'),
});

/** Tipo TypeScript gerado a partir do schema. */
export type Address = z.infer<typeof addressSchema>;
