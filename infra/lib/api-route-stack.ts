// Stack de UMA rota da API: a Lambda (com role e logs próprios) + a rota na HTTP API.
//
// POR QUE UMA STACK POR LAMBDA? Sem o bucket S3 do bootstrap (que teria custo), o modelo de cada
// stack vai direto para o CloudFormation e não pode passar de 50 KB. O código de cada Lambda
// (com o Zod) ocupa de 2 a 25 KB, então juntar várias na mesma stack estoura o limite.
// Separando, cada stack fica pequena e o projeto pode crescer sem esse problema.

import { Stack, type StackProps } from 'aws-cdk-lib';
import * as apigw from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import type * as iam from 'aws-cdk-lib/aws-iam';
import type { Construct } from 'constructs';
import { ApiFunction } from './api-function';

/** Descrição de uma rota: o que cada módulo informa em lib/routes/<modulo>-routes.ts. */
export interface ApiRouteDefinition {
  /** Parte final do nome da stack (vira "GestaoPro-<stackId>"). */
  stackId: string;
  /** Nome curto da Lambda (vira "gestao-pro-<functionName>"). */
  functionName: string;
  /** Arquivo do handler dentro de backend/. */
  entry: string;
  method: apigw.HttpMethod;
  /** Caminho da rota (ex.: '/empresa'). */
  path: string;
  environment?: Record<string, string>;
  /** Permissões EXTRAS da Lambda (além de escrever nos próprios logs). Menor privilégio! */
  policies: iam.PolicyStatement[];
}

/** Propriedades da stack: a definição da rota + a API e o autorizador. */
export interface ApiRouteStackProps extends StackProps {
  route: ApiRouteDefinition;
  httpApi: apigw.IHttpApi;
  authorizer: apigw.HttpAuthorizer;
}

/** Cria a Lambda, aplica as permissões e liga à rota protegida pelo autorizador JWT. */
export class ApiRouteStack extends Stack {
  /**
   * @param scope - app CDK
   * @param id - nome da stack
   * @param props - rota, API e autorizador
   */
  constructor(scope: Construct, id: string, props: ApiRouteStackProps) {
    super(scope, id, props);
    const { route } = props;

    const fn = new ApiFunction(this, 'Fn', {
      name: route.functionName,
      entry: route.entry,
      environment: route.environment,
    });
    for (const policy of route.policies) fn.role.addToPolicy(policy);

    // O autorizador mora na ApiStack; aqui só "apontamos" para ele pelo id.
    const authorizer = apigw.HttpAuthorizer.fromHttpAuthorizerAttributes(this, 'Authorizer', {
      authorizerId: props.authorizer.authorizerId,
      authorizerType: apigw.HttpAuthorizerType.JWT,
    });

    new apigw.HttpRoute(this, 'Route', {
      httpApi: props.httpApi,
      routeKey: apigw.HttpRouteKey.with(route.path, route.method),
      integration: new HttpLambdaIntegration('Integration', fn.function),
      authorizer,
    });
  }
}
