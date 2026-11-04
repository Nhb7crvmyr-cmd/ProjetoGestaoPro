// Regras de validação (Zod) dos formulários de login, cadastro e confirmação de e-mail.
//
// CONCEITO: um "schema" do Zod descreve como um dado DEVE ser. O formulário só é enviado
// se os dados passarem nessas regras; senão, as mensagens de erro aparecem embaixo de cada campo.
// Além disso, "z.infer" gera o TIPO TypeScript a partir do schema, sem precisar escrever 2 vezes.
//
// IMPORTANTE: validar no navegador é só para ajudar o usuário. A segurança de verdade
// fica no Cognito e, nas próximas etapas, nas Lambdas (que validam tudo de novo).

import { z } from 'zod';

/** E-mail: tira espaços, deixa minúsculo e confere o formato. */
const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, 'Informe o e-mail.')
  .pipe(z.email('E-mail inválido.'));

/**
 * Senha com AS MESMAS regras do Cognito (infra/lib/auth-stack.ts → passwordPolicy).
 * Se forem diferentes, o usuário passaria aqui e levaria um erro do Cognito depois.
 */
const newPasswordField = z
  .string()
  .min(8, 'A senha precisa ter pelo menos 8 caracteres.')
  .regex(/[a-z]/, 'A senha precisa ter uma letra minúscula.')
  .regex(/[A-Z]/, 'A senha precisa ter uma letra maiúscula.')
  .regex(/[0-9]/, 'A senha precisa ter um número.');

/** Formulário de login. Aqui a senha só não pode estar vazia (as regras valem no cadastro). */
export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, 'Informe a senha.'),
});

/** Formulário de cadastro, com confirmação de senha. */
export const signUpSchema = z
  .object({
    name: z.string().trim().min(3, 'Informe seu nome completo.').max(100, 'Nome muito longo.'),
    email: emailField,
    password: newPasswordField,
    confirmPassword: z.string().min(1, 'Repita a senha.'),
  })
  // "refine" é uma regra que olha VÁRIOS campos juntos.
  // "path" diz em qual campo a mensagem de erro deve aparecer.
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não são iguais.',
  });

/** Formulário de nova senha (1º acesso do funcionário). Mesmas regras do cadastro. */
export const newPasswordSchema = z
  .object({
    password: newPasswordField,
    confirmPassword: z.string().min(1, 'Repita a senha.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não são iguais.',
  });

/** Formulário do código de confirmação enviado por e-mail (6 dígitos). */
export const confirmSignUpSchema = z.object({
  email: emailField,
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'O código tem 6 números.'),
});

// Tipos gerados automaticamente a partir dos schemas.
export type LoginFormData = z.infer<typeof loginSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type ConfirmSignUpFormData = z.infer<typeof confirmSignUpSchema>;
export type NewPasswordFormData = z.infer<typeof newPasswordSchema>;
