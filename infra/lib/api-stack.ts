// Stack da API: API Gateway HTTP API com CORS, limite de requisições e autorizador JWT do Cognito.
//
// CONCEITOS (para estudo):
// - HTTP API: a "porta de entrada" pública. Recebe a requisição do site e chama a Lambda certa
//   conforme a rota (ex.: GET /admin/users → Lambda listUsers).
// - Autorizador JWT: confere o token do Cognito em TODA requisição antes de chamar a Lambda.
//   Token inválido/vencido → 401, e a Lambda nem roda (nem gera custo).
// - CORS: regra do navegador que só deixa o site chamar a API se a API autorizar aquele endereço.
// - Stage "$default": a versão publicada da API. "autoDeploy" publica cada mudança automaticamente.
//
// As ROTAS não ficam aqui: cada módulo (admin, produtos...) cria as suas na própria stack.

import { CfnOutput, Duration, Stack, type StackProps } from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2';
import type * as cognito from 'aws-cdk-lib/aws-cognito';
import type { Construct } from 'constructs';
import { API_THROTTLE, FRONTEND_ORIGINS, PROJECT_NAME } from './config';

/** Dados de outras stacks de que a API precisa. */
export interface ApiStackProps extends StackProps {
  userPool: cognito.IUserPool;
  userPoolClient: cognito.IUserPoolClient;
}

/** Cria a HTTP API, o stage com limite de requisições e o autorizador JWT. */
export class ApiStack extends Stack {
  public readonly httpApi: apigw.HttpApi;
  public readonly authorizer: apigw.HttpAuthorizer;

  /**
   * Monta a API.
   * @param scope - app CDK
   * @param id - nome da stack
   * @param props - User Pool e client do Cognito (vindos da AuthStack)
   */
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    this.httpApi = new apigw.HttpApi(this, 'HttpApi', {
      apiName: `${PROJECT_NAME}-api`,
      // Criamos o stage manualmente abaixo, para poder configurar o limite de requisições.
      createDefaultStage: false,
      corsPreflight: {
        allowOrigins: FRONTEND_ORIGINS,
        allowMethods: [
          apigw.CorsHttpMethod.GET,
          apigw.CorsHttpMethod.POST,
          apigw.CorsHttpMethod.PUT,
          apigw.CorsHttpMethod.PATCH,
          apigw.CorsHttpMethod.DELETE,
        ],
        allowHeaders: ['authorization', 'content-type'],
        // O navegador guarda a resposta do CORS por 1 hora (menos requisições "OPTIONS").
        maxAge: Duration.hours(1),
      },
    });

    new apigw.HttpStage(this, 'DefaultStage', {
      httpApi: this.httpApi,
      stageName: '$default',
      autoDeploy: true,
      throttle: API_THROTTLE,
    });

    // O "issuer" (emissor) é o endereço do nosso User Pool; a "audience" é o client do site.
    // Só tokens emitidos por ESTE User Pool para ESTE client são aceitos.
    this.authorizer = new apigw.HttpAuthorizer(this, 'CognitoAuthorizer', {
      httpApi: this.httpApi,
      authorizerName: 'cognito-jwt',
      type: apigw.HttpAuthorizerType.JWT,
      identitySource: ['$request.header.Authorization'],
      jwtIssuer: `https://cognito-idp.${this.region}.amazonaws.com/${props.userPool.userPoolId}`,
      jwtAudience: [props.userPoolClient.userPoolClientId],
    });

    new CfnOutput(this, 'ApiUrl', { value: this.httpApi.apiEndpoint });
  }
}
