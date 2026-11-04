// Regras de validação (Zod) do formulário de cadastro da empresa (onboarding).

import { z } from 'zod';
import { addressFormSchema } from '../../../utils/addressSchema';
import { isValidCnpj, isValidCpf } from '../../../utils/documents';
import { normalizeDocument, onlyDigits } from '../../../utils/formatters';

export const companyFormSchema = z
  .object({
    documentType: z.enum(['CNPJ', 'CPF']),
    // O documento chega COM máscara; a validação de verdade está no superRefine abaixo.
    document: z.string().trim().min(1, 'Informe o documento.'),
    legalName: z.string().trim().min(2, 'Informe o nome.').max(150, 'No máximo 150 caracteres.'),
    tradeName: z.string().trim().max(150, 'No máximo 150 caracteres.'),
    email: z.string().trim().toLowerCase().pipe(z.email('E-mail inválido.')),
    phone: z.string().refine((value) => /^\d{10,11}$/.test(onlyDigits(value)), 'Telefone: DDD + número.'),
    address: addressFormSchema,
  })
  // superRefine: regra que depende de MAIS DE UM campo (o tipo decide como validar o documento).
  .superRefine((data, ctx) => {
    const document = normalizeDocument(data.document);
    const isValid = data.documentType === 'CNPJ' ? isValidCnpj(document) : isValidCpf(document);
    if (!isValid) {
      ctx.addIssue({ code: 'custom', path: ['document'], message: `${data.documentType} inválido. Confira os números.` });
    }
  });

export type CompanyFormData = z.infer<typeof companyFormSchema>;
