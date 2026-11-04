// Construct reutilizável: uma Lambda da API com sua PRÓPRIA role (menor privilégio) e seu grupo de logs.
//
// CONCEITO "construct": um bloco de montar do CDK. Aqui juntamos 3 recursos que sempre andam
// juntos (Lambda + Role + LogGroup) em uma peça só, para não repetir código em cada módulo.

import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import { PROJECT_NAME } from './config';
import { bundleLambda } from './lambda-bundler';

/** Configuração de uma Lambda da API. */
export interface ApiFunctionProps {
  /** Nome curto (vira "gestao-pro-<name>"). */
  name: string;
  /** Arquivo do handler dentro de backend/ (ex.: 'functions/admin/listUsers.ts'). */
  entry: string;
  /** Variáveis de ambiente (ex.: USER_POOL_ID). Nunca coloque segredos aqui. */
  environment?: Record<string, string>;
}

/** Lambda + Role exclusiva + LogGroup com retenção curta. */
export class ApiFunction extends Construct {
  public readonly function: lambda.Function;
  public readonly role: iam.Role;

  /**
   * Cria os 3 recursos.
   * @param scope - stack onde a Lambda vai morar
   * @param id - id lógico do construct
   * @param props - configuração da Lambda
   */
  constructor(scope: Construct, id: string, props: ApiFunctionProps) {
    super(scope, id);
    const functionName = `${PROJECT_NAME}-${props.name}`;

    // Logs guardados por 1 semana e depois apagados: o CloudWatch cobra pelo armazenamento
    // acima de 5 GB, então não deixamos log acumular para sempre.
    const logGroup = new logs.LogGroup(this, 'Logs', {
      logGroupName: `/aws/lambda/${functionName}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Role = "crachá" de permissões da Lambda. Começa SEM nenhuma permissão;
    // cada módulo adiciona só o que a sua Lambda precisa (menor privilégio).
    this.role = new iam.Role(this, 'Role', {
      roleName: `${functionName}-role`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: `Role exclusiva da Lambda ${functionName}`,
    });
    // Permissão para escrever SÓ no próprio grupo de logs.
    logGroup.grantWrite(this.role);

    this.function = new lambda.Function(this, 'Function', {
      functionName,
      runtime: lambda.Runtime.NODEJS_24_X,
      // ARM (Graviton): mais barato por segundo e igualmente coberto pelo free tier.
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handler',
      code: lambda.Code.fromInline(bundleLambda(props.entry)),
      memorySize: 256,
      timeout: Duration.seconds(10),
      role: this.role,
      logGroup,
      environment: props.environment,
    });
  }
}
