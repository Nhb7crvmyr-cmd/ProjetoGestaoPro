// Regras de validação (Zod) do endereço no formulário. Reutilizado pela empresa e, depois, pelos clientes.

import { z } from 'zod';

/** As 27 unidades federativas (estados + DF), na ordem alfabética das siglas. */
export const UF_LIST = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA',
  'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO',
] as const;

/** Endereço do formulário. O CEP fica com máscara na tela (00000-000). */
export const addressFormSchema = z.object({
  zipCode: z.string().regex(/^\d{5}-\d{3}$/, 'CEP inválido.'),
  street: z.string().trim().min(1, 'Informe a rua.').max(150),
  number: z.string().trim().min(1, 'Informe o número (ou "S/N").').max(20),
  complement: z.string().trim().max(100),
  district: z.string().trim().min(1, 'Informe o bairro.').max(100),
  city: z.string().trim().min(1, 'Informe a cidade.').max(100),
  // z.enum aceita só um dos valores da lista. A mensagem cobre o caso de nada escolhido.
  state: z.enum(UF_LIST, 'Escolha o estado.'),
});

export type AddressFormData = z.infer<typeof addressFormSchema>;

/** Valores iniciais vazios do endereço. "as" diz ao TypeScript que o estado vazio é aceitável no começo. */
export const emptyAddress = {
  zipCode: '',
  street: '',
  number: '',
  complement: '',
  district: '',
  city: '',
  state: '' as AddressFormData['state'],
};
