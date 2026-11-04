// Regras de validação (Zod) do formulário de cliente. Só nome e telefone são obrigatórios;
// documento, e-mail e endereço são validados SÓ quando preenchidos/ativados.

import { z } from 'zod';
import { addressFormSchema } from '../../../utils/addressSchema';
import { isValidCnpj, isValidCpf } from '../../../utils/documents';
import { normalizeDocument, onlyDigits } from '../../../utils/formatters';

export const customerFormSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe o nome do cliente.').max(120, 'No máximo 120 caracteres.'),
    // '' = sem documento.
    documentType: z.enum(['', 'CPF', 'CNPJ']),
    document: z.string().trim(),
    email: z.string().trim().toLowerCase(),
    phone: z.string().refine((value) => /^\d{10,11}$/.test(onlyDigits(value)), 'Informe o telefone com DDD.'),
    // O <input type="date"> entrega "AAAA-MM-DD" (ou vazio).
    birthDate: z.string(),
    notes: z.string().trim().max(500, 'No máximo 500 caracteres.'),
    // Liga/desliga o bloco de endereço. Desligado, o endereço nem é validado.
    hasAddress: z.boolean(),
    // Aqui o endereço é só "texto livre": a validação de verdade está no superRefine (só se hasAddress).
    address: z.object({
      zipCode: z.string(),
      street: z.string(),
      number: z.string(),
      complement: z.string(),
      district: z.string(),
      city: z.string(),
      state: z.string(),
    }),
  })
  .superRefine((data, ctx) => {
    // E-mail: opcional, mas, se digitado, precisa ser válido.
    if (data.email && !z.email().safeParse(data.email).success) {
      ctx.addIssue({ code: 'custom', path: ['email'], message: 'E-mail inválido.' });
    }

    // Documento: opcional, mas, se digitado, precisa do tipo e dos dígitos certos.
    if (data.document) {
      const document = normalizeDocument(data.document);
      if (!data.documentType) {
        ctx.addIssue({ code: 'custom', path: ['documentType'], message: 'Escolha CPF ou CNPJ.' });
      } else if (!(data.documentType === 'CPF' ? isValidCpf(document) : isValidCnpj(document))) {
        ctx.addIssue({ code: 'custom', path: ['document'], message: `${data.documentType} inválido.` });
      }
    }

    // Data de nascimento: não pode ser no futuro.
    if (data.birthDate && new Date(`${data.birthDate}T00:00:00`) > new Date()) {
      ctx.addIssue({ code: 'custom', path: ['birthDate'], message: 'A data não pode ser no futuro.' });
    }

    // Endereço: só valida se o bloco estiver ligado. Os erros vão para os campos certos ("address.city"...).
    if (data.hasAddress) {
      const result = addressFormSchema.safeParse(data.address);
      if (!result.success) {
        for (const issue of result.error.issues) {
          ctx.addIssue({ code: 'custom', path: ['address', ...issue.path], message: issue.message });
        }
      }
    }
  });

export type CustomerFormData = z.infer<typeof customerFormSchema>;
