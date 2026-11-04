// Tipos compartilhados de autenticação (usuário logado e grupos do Cognito).

/** Grupos que existem no Cognito (criados na Etapa 2, em infra/lib/config.ts). */
export type UserGroup = 'SuperAdmin' | 'Dono' | 'Funcionario';

/**
 * Nome de cada grupo NA TELA. O grupo técnico "Dono" aparece como "Supervisor"
 * (decisão do usuário na Etapa 10). Mudar aqui muda o sistema inteiro.
 */
export const ROLE_LABELS: Record<UserGroup, string> = {
  SuperAdmin: 'Super Admin',
  Dono: 'Supervisor',
  Funcionario: 'Funcionário',
};

/** Dados do usuário logado, lidos do token do Cognito. */
export interface SessionUser {
  /** Identificador único do usuário no Cognito (campo "sub" do token). */
  userId: string;
  name: string;
  email: string;
  /** Pode vir vazio: um usuário recém-cadastrado ainda não tem grupo. */
  groups: UserGroup[];
  /** Empresa do usuário (atributo "custom:empresaId"). Vazio até o onboarding. */
  empresaId: string;
  /** Cargo que a pessoa preencheu em "Meu perfil" (ex.: "Supervisor"). Pode vir vazio. */
  jobTitle: string;
  /** Área/setor (ex.: "Área comercial"). Pode vir vazio. */
  department: string;
}
