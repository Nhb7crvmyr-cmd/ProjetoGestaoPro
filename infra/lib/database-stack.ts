// Stack de banco de dados: tabela única do DynamoDB em modo Provisionado (dentro do Always Free).
//
// CONCEITOS (para estudo):
// - DynamoDB é um banco NoSQL: não há tabelas relacionadas nem JOIN como no SQL.
// - "Tabela única" (single-table design): clientes, produtos, vendas etc. ficam
//   todos na MESMA tabela, diferenciados pelo formato da chave.
// - Chave primária = pk (partition key) + sk (sort key). Exemplos de como vamos usar:
//     pk = "EMPRESA#123"   sk = "PRODUTO#abc"    → um produto da empresa 123
//     pk = "EMPRESA#123"   sk = "CLIENTE#xyz"    → um cliente da empresa 123
//   Como toda chave começa pela empresa, uma consulta por "EMPRESA#123" nunca
//   devolve dados de outra empresa. Essa é a base da regra de segurança do projeto.
// - Capacidade provisionada: quantas leituras/escritas por segundo a tabela aguenta.
//   1 unidade de leitura ≈ 1 leitura de até 4 KB por segundo;
//   1 unidade de escrita ≈ 1 escrita de até 1 KB por segundo.

import { CfnOutput, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import type { Construct } from 'constructs';
import { PROJECT_NAME, TABLE_CAPACITY } from './config';

/** Cria a tabela única do sistema (todas as entidades, separadas por empresaId na chave). */
export class DatabaseStack extends Stack {
  /** Tabela criada, exposta para as Lambdas receberem permissão depois. */
  public readonly table: dynamodb.Table;

  /**
   * Monta a tabela do DynamoDB.
   * @param scope - app CDK que contém a stack
   * @param id - nome da stack
   * @param props - configurações padrão da stack (região etc.)
   */
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.table = new dynamodb.Table(this, 'MainTable', {
      tableName: PROJECT_NAME,

      // Nomes genéricos (pk/sk) porque cada tipo de registro usa a chave de um jeito.
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },

      // Provisionado com capacidade FIXA: fica dentro do Always Free (até 25/25 no total).
      // O On-Demand cobraria por leitura/escrita. Também não usamos auto scaling,
      // porque ele cria alarmes do CloudWatch, que podem gerar custo.
      // Se passar da capacidade, o DynamoDB não cobra: ele recusa ou atrasa a requisição.
      billingMode: dynamodb.BillingMode.PROVISIONED,
      readCapacity: TABLE_CAPACITY.read,
      writeCapacity: TABLE_CAPACITY.write,

      // Backup contínuo (PITR) desligado, porque é cobrado.
      // A criptografia padrão (chave gerenciada pela AWS) continua ativa e é grátis.
      pointInTimeRecoverySpecification: { pointInTimeRecoveryEnabled: false },

      // Projeto de estudo: "cdk destroy" apaga a tabela E os dados.
      removalPolicy: RemovalPolicy.DESTROY,
    });

    new CfnOutput(this, 'TableName', { value: this.table.tableName });
  }
}
