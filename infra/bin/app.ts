// Ponto de entrada do CDK: cria as stacks do Gestão Pro na região us-east-1.

// COMO O CDK FUNCIONA (resumo para estudo):
// 1. Você descreve a infraestrutura em TypeScript (classes "Stack" com "constructs").
// 2. O comando "cdk synth" transforma esse código em um modelo do CloudFormation (JSON),
//    gravado na pasta cdk.out/.
// 3. O comando "cdk deploy" envia esse modelo ao CloudFormation, que cria os recursos.
// 4. O comando "cdk destroy" apaga a stack e tudo o que ela criou.

import { App, LegacyStackSynthesizer } from 'aws-cdk-lib';
import { ApiRouteStack } from '../lib/api-route-stack';
import { ApiStack } from '../lib/api-stack';
import { AuthStack } from '../lib/auth-stack';
import { AWS_REGION, PROJECT_NAME } from '../lib/config';
import { DatabaseStack } from '../lib/database-stack';
import { adminRoutes } from '../lib/routes/admin-routes';
import { clientesRoutes } from '../lib/routes/clientes-routes';
import { empresaRoutes } from '../lib/routes/empresa-routes';
import { estoqueRoutes } from '../lib/routes/estoque-routes';
import { funcionariosRoutes } from '../lib/routes/funcionarios-routes';
import { produtosRoutes } from '../lib/routes/produtos-routes';
import { vendasRoutes } from '../lib/routes/vendas-routes';

// "App" é a raiz: todas as stacks ficam penduradas nele.
const app = new App();

// O "synthesizer" decide COMO o modelo chega à AWS.
// - O padrão exige "cdk bootstrap", que cria um bucket S3 e algumas roles.
//   Evitamos esse bucket para manter o projeto sem custo de armazenamento.
// - O LegacyStackSynthesizer envia o modelo direto, com as suas credenciais
//   da AWS CLI, sem bucket. Funciona enquanto não houver arquivos enviados ao S3
//   e cada modelo tiver menos de 50 KB. O código das Lambdas vai "inline"
//   (dentro do modelo), por isso cada Lambda tem a sua própria stack pequena.
const stackProps = {
  env: { region: AWS_REGION },
  synthesizer: new LegacyStackSynthesizer(),
};

// Guardamos cada stack em uma constante para passar os recursos dela às outras.
// Quando uma stack usa recurso de outra, o CDK cria um "export/import" do CloudFormation
// e garante a ordem certa no deploy (Auth → API → Admin).
const auth = new AuthStack(app, 'GestaoPro-Auth', {
  ...stackProps,
  description: `${PROJECT_NAME}: Cognito (usuários e grupos)`,
});

const database = new DatabaseStack(app, 'GestaoPro-Database', {
  ...stackProps,
  description: `${PROJECT_NAME}: DynamoDB (tabela única)`,
});

const api = new ApiStack(app, 'GestaoPro-Api', {
  ...stackProps,
  description: `${PROJECT_NAME}: API Gateway HTTP API + autorizador JWT`,
  userPool: auth.userPool,
  userPoolClient: auth.userPoolClient,
});

// ROTAS DA API: cada módulo devolve uma lista de rotas, e cada rota vira uma stack
// "GestaoPro-<stackId>" com a sua Lambda. Para um módulo novo, basta criar lib/routes/<modulo>-routes.ts
// e incluí-lo na lista abaixo.
const deps = { table: database.table, userPool: auth.userPool };
const routes = [
  ...adminRoutes(deps),
  ...empresaRoutes(deps),
  ...funcionariosRoutes(deps),
  ...produtosRoutes(deps),
  ...estoqueRoutes(deps),
  ...clientesRoutes(deps),
  ...vendasRoutes(deps),
];

for (const route of routes) {
  new ApiRouteStack(app, `GestaoPro-${route.stackId}`, {
    ...stackProps,
    description: `${PROJECT_NAME}: rota ${route.method} ${route.path}`,
    route,
    httpApi: api.httpApi,
    authorizer: api.authorizer,
  });
}
