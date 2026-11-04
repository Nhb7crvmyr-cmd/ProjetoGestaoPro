// Recursos compartilhados de que as rotas precisam (tabela e User Pool), passados a cada módulo.

import type * as cognito from 'aws-cdk-lib/aws-cognito';
import type * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

/** Dependências comuns das rotas. */
export interface RouteDeps {
  table: dynamodb.ITable;
  userPool: cognito.IUserPool;
}
