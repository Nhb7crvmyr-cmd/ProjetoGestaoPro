// Stack de autenticação: Cognito User Pool (plano Lite), cliente do site e os 3 grupos de acesso.
//
// CONCEITOS (para estudo):
// - User Pool: o "banco de usuários" do Cognito. Guarda e-mail e senha (criptografada)
//   e faz login, cadastro, confirmação de e-mail e recuperação de senha.
// - App client: a "porta de entrada" que o site usa para falar com o User Pool.
// - Grupo: uma etiqueta no usuário (SuperAdmin, Dono, Funcionario). Ela aparece dentro
//   do token de login (no campo "cognito:groups"), e é assim que o backend sabe
//   o que cada usuário pode fazer.
// - Token: depois do login, o Cognito devolve um token assinado. O backend confia nele
//   porque o usuário não consegue alterá-lo sem invalidar a assinatura.

import { CfnOutput, Duration, RemovalPolicy, Stack, type StackProps } from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import type { Construct } from 'constructs';
import { PROJECT_NAME, USER_GROUPS } from './config';

/** Cria o User Pool do Cognito, o app client do frontend e os grupos. */
export class AuthStack extends Stack {
  // "public readonly" deixa outras stacks lerem este recurso depois
  // (por exemplo, a API vai precisar do User Pool para validar tokens).

  /** User Pool criado, exposto para outras stacks usarem. */
  public readonly userPool: cognito.UserPool;

  /** Cliente usado pelo frontend (Amplify Auth). */
  public readonly userPoolClient: cognito.UserPoolClient;

  /**
   * Monta os recursos de autenticação.
   * @param scope - app CDK que contém a stack
   * @param id - nome da stack
   * @param props - configurações padrão da stack (região etc.)
   */
  constructor(scope: Construct, id: string, props?: StackProps) {
    // super() chama o construtor da classe Stack (a classe "mãe"). É obrigatório.
    super(scope, id, props);

    // "new cognito.UserPool(this, 'UserPool', {...})" é o padrão de todo construct do CDK:
    //   this        → a stack onde o recurso vai morar
    //   'UserPool'  → id lógico (o CDK usa para gerar o nome interno no CloudFormation)
    //   {...}       → as configurações do recurso
    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `${PROJECT_NAME}-users`,

      // Plano Lite: grátis até 10.000 usuários ativos por mês.
      // O plano Plus é pago e o Essentials tem recursos de que não precisamos.
      featurePlan: cognito.FeaturePlan.LITE,

      // Qualquer pessoa pode se cadastrar pelo site (depois ela faz o onboarding).
      selfSignUpEnabled: true,

      // O login é pelo e-mail (não existe "nome de usuário" separado).
      signInAliases: { email: true },

      // O Cognito manda um código por e-mail para confirmar o cadastro.
      autoVerify: { email: true },

      // Campos obrigatórios no cadastro. "fullname" vira o atributo "name" no Cognito.
      // Atenção: atributos obrigatórios NÃO podem ser mudados depois de criados.
      standardAttributes: {
        email: { required: true, mutable: true },
        fullname: { required: true, mutable: true },
      },

      // Atributo PERSONALIZADO: o id da empresa do usuário. No token ele aparece como
      // "custom:empresaId". Só o backend (Lambda) grava esse valor (ver writeAttributes abaixo),
      // então o usuário não consegue "se colocar" em outra empresa.
      // Atenção: atributos personalizados podem ser ADICIONADOS depois, mas nunca removidos.
      customAttributes: {
        empresaId: new cognito.StringAttribute({ mutable: true, minLen: 36, maxLen: 36 }),
        // Perfil (Etapa 10): cargo e área que a PRÓPRIA pessoa preenche em "Meu perfil"
        // (ex.: "Supervisor" · "Área comercial"). Aparecem no token e na barra do topo.
        jobTitle: new cognito.StringAttribute({ mutable: true, maxLen: 50 }),
        department: new cognito.StringAttribute({ mutable: true, maxLen: 50 }),
      },

      // Regras da senha. O Cognito recusa senhas que não cumpram estas regras.
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
        // Senha temporária do convite de funcionário vale 7 dias (depois, o Dono reenvia).
        tempPasswordValidity: Duration.days(7),
      },

      // E-mail de CONVITE, enviado quando o Dono cadastra um funcionário (AdminCreateUser).
      // O Cognito troca {username} pelo login (o e-mail) e {####} pela senha temporária.
      userInvitation: {
        emailSubject: 'Você foi convidado para o Gestão Pro',
        emailBody:
          '<p>Olá!</p>' +
          '<p>Você foi cadastrado como funcionário no <b>Gestão Pro</b>.</p>' +
          '<p>Login: <b>{username}</b><br/>Senha temporária: <b>{####}</b></p>' +
          '<p>No primeiro acesso, você vai criar a sua própria senha. A senha temporária vale 7 dias.</p>',
      },

      // MFA (segundo fator) desligado: o MFA por SMS é cobrado.
      mfa: cognito.Mfa.OFF,

      // Recuperação de senha somente por e-mail (SMS é cobrado).
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,

      // PROTEÇÃO DO E-MAIL (Etapa 10): se alguém tentar trocar o próprio e-mail por fora do site,
      // o e-mail ANTIGO continua valendo até o novo ser confirmado com um código.
      // A troca oficial é feita só pelo suporte (SuperAdmin), que já grava o e-mail como confirmado.
      keepOriginal: { email: true },

      // O e-mail é enviado pelo próprio Cognito: grátis, com limite de 50 e-mails por dia.
      // Para mais do que isso seria preciso o Amazon SES (fora do escopo).
      email: cognito.UserPoolEmail.withCognito(),

      // Projeto de estudo: permite apagar o User Pool com "cdk destroy".
      // RemovalPolicy.DESTROY = apagar a stack apaga também os usuários.
      deletionProtection: false,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Cliente público (sem segredo): um site roda no navegador, onde não dá para
    // esconder um segredo. Por isso usamos o fluxo SRP, em que a senha nunca
    // trafega pela rede: só uma prova matemática de que você a conhece.
    this.userPoolClient = this.userPool.addClient('WebClient', {
      userPoolClientName: `${PROJECT_NAME}-web`,
      generateSecret: false,
      authFlows: { userSrp: true },

      // VALIDADE DOS TOKENS: 15 minutos (o padrão é 1 hora).
      // A API confere só a assinatura e a validade do token, sem perguntar ao Cognito se o usuário
      // foi bloqueado. Com 15 minutos, quem é bloqueado perde o acesso em no máximo 15 minutos.
      // O site renova o token sozinho (com o "refresh token"), então o usuário não precisa logar de novo.
      // Ao bloquear, o backend revoga o refresh token (AdminUserGlobalSignOut), e a renovação para de funcionar.
      idTokenValidity: Duration.minutes(15),
      accessTokenValidity: Duration.minutes(15),

      // Não revela se um e-mail existe ou não (evita que alguém "descubra" usuários).
      preventUserExistenceErrors: true,

      // O que o SITE pode LER e ESCREVER nos dados do usuário.
      // O site lê o empresaId, mas NÃO pode escrevê-lo: só o backend grava (com permissão de admin).
      // Cargo e área a própria pessoa pode ler e escrever (tela "Meu perfil").
      // O e-mail PRECISA continuar na lista de escrita: o Cognito exige isso para atributos obrigatórios
      // (testado na Etapa 10: a AWS recusou "Invalid write attributes"). Na tela, o e-mail fica travado.
      readAttributes: new cognito.ClientAttributes()
        .withStandardAttributes({ email: true, emailVerified: true, fullname: true })
        .withCustomAttributes('empresaId', 'jobTitle', 'department'),
      writeAttributes: new cognito.ClientAttributes()
        .withStandardAttributes({ email: true, fullname: true })
        .withCustomAttributes('jobTitle', 'department'),
    });

    // Cria um grupo para cada item de USER_GROUPS (em config.ts).
    // Usamos "CfnUserPoolGroup" (um construct de nível 1, que espelha o CloudFormation)
    // porque o CDK não tem uma versão de nível mais alto para grupos.
    for (const group of USER_GROUPS) {
      new cognito.CfnUserPoolGroup(this, `Group${group.name}`, {
        userPoolId: this.userPool.userPoolId,
        groupName: group.name,
        precedence: group.precedence,
        description: group.description,
      });
    }

    // Outputs: valores exibidos no final do "cdk deploy". O frontend vai precisar deles
    // (não são segredos: qualquer site que usa Cognito expõe esses IDs).
    new CfnOutput(this, 'UserPoolId', { value: this.userPool.userPoolId });
    new CfnOutput(this, 'UserPoolClientId', { value: this.userPoolClient.userPoolClientId });
  }
}
