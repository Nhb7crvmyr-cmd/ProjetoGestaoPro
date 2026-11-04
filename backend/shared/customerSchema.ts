// Regras de validação (Zod) do cadastro/edição de cliente e do id do cliente na URL.

import * as z from 'zod/mini';
import { addressSchema, requiredText } from './addressSchema';
import { isValidCnpj, isValidCpf, normalizeDocument } from './documents';
import { HttpError } from './errors';

/** Campos do cliente. Só nome e telefone são obrigatórios. */
export const customerFieldsSchema = z.object({
  name: requiredText('Nome', 120),
  documentType: z.optional(z.enum(['CPF', 'CNPJ'], 'Tipo de documento inválido.')),
  document: z.optional(z.string()),
  email: z.optional(z.pipe(z.string().check(z.trim(), z.toLowerCase()), z.union([z.literal(''), z.email('E-mail inválido.')]))),
  phone: z.string('Informe o telefone.').check(z.regex(/^\d{10,11}$/, 'Telefone: DDD + número (10 ou 11 números).')),
  birthDate: z.optional(z.string().check(z.regex(/^(\d{4}-\d{2}-\d{2})?$/, 'Data de nascimento inválida.'))),
  notes: z.optional(z.string().check(z.trim(), z.maxLength(500, 'Observações: no máximo 500 caracteres.'))),
  address: z.optional(addressSchema),
});

/** Edição: os campos + ativo/inativo. */
export const updateCustomerSchema = z.extend(customerFieldsSchema, {
  active: z.boolean('Informe se o cliente está ativo.'),
});

/** {customerId} na URL. */
export const customerIdPathSchema = z.object({
  customerId: z.guid('Cliente inválido.'),
});

/**
 * Confere e normaliza o documento e a data de nascimento (regras que o Zod sozinho não cobre).
 * @param data - campos já validados pelo Zod
 * @returns documento normalizado (ou undefined) e data (ou undefined)
 */
export function normalizeCustomerExtras(data: z.infer<typeof customerFieldsSchema>): {
  documentType?: 'CPF' | 'CNPJ';
  document?: string;
  birthDate?: string;
} {
  const document = data.document ? normalizeDocument(data.document) : '';
  let documentType: 'CPF' | 'CNPJ' | undefined;
  if (document) {
    if (!data.documentType) throw new HttpError(400, 'Informe se o documento é CPF ou CNPJ.');
    const isValid = data.documentType === 'CPF' ? isValidCpf(document) : isValidCnpj(document);
    if (!isValid) throw new HttpError(400, `${data.documentType} inválido. Confira os números.`);
    documentType = data.documentType;
  }

  let birthDate: string | undefined;
  if (data.birthDate) {
    // new Date("2026-02-31") "anda" para março; comparar de volta pega datas que não existem.
    const parsed = new Date(`${data.birthDate}T00:00:00Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== data.birthDate) {
      throw new HttpError(400, 'Data de nascimento inválida.');
    }
    if (parsed > new Date() || parsed.getUTCFullYear() < 1900) throw new HttpError(400, 'Data de nascimento fora do intervalo.');
    birthDate = data.birthDate;
  }

  return { documentType, document: document || undefined, birthDate };
}
