// Regras de validação (Zod) do formulário de produto. Os campos ficam como TEXTO no formulário
// (com máscara) e são convertidos para números (centavos, inteiros) só na hora de enviar.

import { z } from 'zod';
import { parseMoneyInput } from '../../../utils/formatters';
import { UNIT_OPTIONS } from '../constants/units';

/** Número inteiro digitado como texto (ex.: estoque). Vazio é aceito quando "optional" for true. */
const integerText = (label: string, optional = false) =>
  z
    .string()
    .trim()
    .refine((value) => (optional && value === '') || /^\d{1,7}$/.test(value), `${label}: use números inteiros.`);

export const productFormSchema = z.object({
  name: z.string().trim().min(2, 'Informe o nome do produto.').max(120, 'No máximo 120 caracteres.'),
  sku: z
    .string()
    .trim()
    .max(40, 'No máximo 40 caracteres.')
    .regex(/^[A-Za-z0-9._-]*$/, 'Use só letras, números, ponto, hífen e sublinhado.'),
  category: z.string().trim().max(60, 'No máximo 60 caracteres.'),
  // z.enum precisa da lista de valores; .map tira só o "value" de cada opção.
  unit: z.enum(UNIT_OPTIONS.map((option) => option.value) as [string, ...string[]], 'Escolha a unidade.'),
  price: z.string().refine((value) => value !== '' && parseMoneyInput(value) >= 0, 'Informe o preço de venda.'),
  cost: z.string(),
  minStock: integerText('Estoque mínimo'),
  initialStock: integerText('Estoque inicial', true),
  active: z.boolean(),
});

export type ProductFormData = z.infer<typeof productFormSchema>;
