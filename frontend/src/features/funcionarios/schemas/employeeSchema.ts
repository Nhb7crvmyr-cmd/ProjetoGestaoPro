// Regras de validação (Zod) do formulário de novo funcionário.

import { z } from 'zod';
import { onlyDigits } from '../../../utils/formatters';

export const employeeFormSchema = z.object({
  name: z.string().trim().min(3, 'Informe o nome completo.').max(100, 'No máximo 100 caracteres.'),
  email: z.string().trim().toLowerCase().pipe(z.email('E-mail inválido.')),
  // Telefone é opcional: vazio passa; preenchido precisa ter DDD + número.
  phone: z.string().refine((value) => {
    const digits = onlyDigits(value);
    return digits.length === 0 || digits.length === 10 || digits.length === 11;
  }, 'Telefone: DDD + número.'),
});

export type EmployeeFormData = z.infer<typeof employeeFormSchema>;
