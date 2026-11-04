// Configurações fixas da infraestrutura do Gestão Pro (nome do projeto, região e grupos).

/** Prefixo usado no nome de todos os recursos da AWS. */
export const PROJECT_NAME = 'gestao-pro';

/** Região única do projeto (definida no CLAUDE.md). */
export const AWS_REGION = 'us-east-1';

/**
 * Grupos do Cognito. Quanto menor a precedência, maior a prioridade
 * quando um usuário está em mais de um grupo.
 */
export const USER_GROUPS = [
  { name: 'SuperAdmin', precedence: 0, description: 'Administrador da plataforma: vê todas as empresas' },
  { name: 'Dono', precedence: 1, description: 'Dono da empresa: controla tudo da empresa e o estoque' },
  { name: 'Funcionario', precedence: 2, description: 'Funcionário: atende os próprios clientes e registra vendas' },
] as const;

/**
 * Capacidade fixa do DynamoDB (modo Provisionado, sem auto scaling).
 * O Always Free cobre até 25 de leitura e 25 de escrita somando TODAS as tabelas e índices.
 */
export const TABLE_CAPACITY = { read: 5, write: 5 } as const;

/**
 * Endereços do site que podem chamar a API (CORS).
 * O navegador BLOQUEIA chamadas de sites que não estejam nesta lista.
 * Na etapa de deploy, entra aqui o endereço do CloudFront.
 */
export const FRONTEND_ORIGINS = ['http://localhost:5173'];

/**
 * Limite de requisições da API (proteção de custo e contra abuso).
 * rateLimit = média por segundo; burstLimit = pico momentâneo.
 * Acima disso, a API responde 429 ("muitas requisições") e a Lambda nem é chamada.
 */
export const API_THROTTLE = { rateLimit: 10, burstLimit: 20 } as const;
