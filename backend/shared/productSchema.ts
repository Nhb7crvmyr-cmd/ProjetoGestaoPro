// Regras de validação (Zod) dos dados de um produto (cadastro e edição) e do id do produto na URL.

import * as z from 'zod/mini';
import { requiredText } from './addressSchema';
import { PRODUCT_UNITS } from './product';

/** Dinheiro em centavos: inteiro, de 0 a R$ 1.000.000,00. */
const centsField = (label: string) =>
  z.number(`${label}: informe um valor.`).check(
    z.int(`${label}: valor inválido.`),
    z.minimum(0, `${label} não pode ser negativo.`),
    z.maximum(100_000_000, `${label}: valor muito alto.`),
  );

/** Quantidade inteira de 0 a 1.000.000. */
export const quantityField = (label: string) =>
  z.number(`${label}: informe um número.`).check(
    z.int(`${label}: use números inteiros.`),
    z.minimum(0, `${label} não pode ser negativo.`),
    z.maximum(1_000_000, `${label}: número muito alto.`),
  );

/** Texto opcional: tira espaços e limita o tamanho. Texto vazio vira "não informado". */
const optionalText = (label: string, max: number) =>
  z.optional(z.string().check(z.trim(), z.maxLength(max, `${label}: no máximo ${max} caracteres.`)));

/** Campos editáveis de um produto (o estoque NÃO entra aqui: ele só muda por movimento). */
export const productFieldsSchema = z.object({
  name: requiredText('Nome', 120),
  // SKU: letras, números, hífen, ponto e sublinhado. O código deixa em maiúsculas depois.
  sku: z.optional(
    z.string().check(
      z.trim(),
      z.maxLength(40, 'SKU: no máximo 40 caracteres.'),
      z.regex(/^[A-Za-z0-9._-]*$/, 'SKU: use só letras, números, ponto, hífen e sublinhado.'),
    ),
  ),
  category: optionalText('Categoria', 60),
  unit: z.enum(PRODUCT_UNITS, 'Unidade inválida.'),
  priceCents: centsField('Preço de venda'),
  costCents: z.optional(centsField('Custo')),
  minStock: quantityField('Estoque mínimo'),
});

/** Cadastro: os campos + estoque inicial opcional (vira uma "entrada" no histórico). */
export const createProductSchema = z.extend(productFieldsSchema, {
  initialStock: z.optional(quantityField('Estoque inicial')),
});

/** Edição: os campos + ativo/inativo. */
export const updateProductSchema = z.extend(productFieldsSchema, {
  active: z.boolean('Informe se o produto está ativo.'),
});

/** {productId} na URL: um UUID gerado pelo backend. */
export const productIdPathSchema = z.object({
  productId: z.guid('Produto inválido.'),
});

/**
 * Normaliza o SKU: vazio vira undefined; o resto fica em MAIÚSCULAS ("abc-1" e "ABC-1" são o mesmo código).
 * @param sku - SKU digitado
 * @returns o SKU normalizado ou undefined
 */
export function normalizeSku(sku: string | undefined): string | undefined {
  return sku ? sku.toUpperCase() : undefined;
}
