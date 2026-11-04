// Tipos das variáveis de ambiente do Vite (arquivo .env.local).
// Só variáveis que começam com "VITE_" chegam ao navegador. Por isso, NUNCA coloque segredos aqui.

interface ImportMetaEnv {
  /** ID do User Pool do Cognito (ex.: us-east-1_XXXX). */
  readonly VITE_COGNITO_USER_POOL_ID: string;
  /** ID do app client "gestao-pro-web" do Cognito. */
  readonly VITE_COGNITO_CLIENT_ID: string;
  /** Endereço da HTTP API (saída "ApiUrl" da stack GestaoPro-Api). */
  readonly VITE_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
