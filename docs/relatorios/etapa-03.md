# Relatório — Etapa 03: React (tela de login e cadastro)

Data: 16/10/2026

## Resumo
- Criado o projeto React + Vite + TypeScript em `frontend/`, com Tailwind CSS.
- Telas: **login**, **cadastro**, **confirmação por código** (e-mail) e uma página temporária **pós-login**
  que mostra os dados do token (nome, e-mail, grupo e ID).
- Layout com **logo** (SVG próprio) e **informações do site** (painel da marca no desktop; no celular, só o logo).
- Login real com o Cognito criado na Etapa 2, usando o Amplify (somente Auth).
- Formulários validados com Zod + React Hook Form, com as **mesmas regras de senha do Cognito**.
- Erros do Cognito traduzidos para português.
- Código com comentários didáticos.

## Pacotes instalados (somente em `frontend/`, aprovados pelo usuário)
| Pacote | Versão |
|---|---|
| react / react-dom | 19.3.1 |
| @types/react / @types/react-dom | 19.3.0 |
| vite / @vitejs/plugin-react | 8.3.4 / 6.1.2 |
| tailwindcss / @tailwindcss/vite | 4.3.3 |
| react-router | 8.4.0 |
| react-hook-form / @hookform/resolvers | 7.90.0 / 5.9.1 |
| zod | 4.6.7 |
| aws-amplify | 6.22.2 |
| typescript | 7.0.2 |

`npm install`: 0 vulnerabilidades. TanStack Query e Recharts ficam para as etapas em que forem usados.

## Arquivos criados/alterados
- `frontend/package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `.gitignore`
- `frontend/.env.example`: modelo das variáveis
- `frontend/.env.local`: IDs do Cognito (não são segredos; arquivo ignorado pelo git)
- `frontend/public/favicon.svg`: ícone da aba
- `frontend/src/main.tsx`: ponto de entrada
- `frontend/src/index.css`: Tailwind e cores da marca
- `frontend/src/vite-env.d.ts`: tipos das variáveis de ambiente
- `frontend/src/app/router.tsx`: rotas
- `frontend/src/app/layouts/AuthLayout.tsx`: layout das telas públicas
- `frontend/src/services/amplifyConfig.ts`: configuração do Amplify
- `frontend/src/types/auth.ts`: tipos do usuário logado e dos grupos
- `frontend/src/components/ui/`: `Logo.tsx`, `Button.tsx`, `TextField.tsx`, `Alert.tsx`
- `frontend/src/features/auth/schemas/authSchemas.ts`: validações (Zod)
- `frontend/src/features/auth/services/authService.ts`: chamadas ao Cognito
- `frontend/src/features/auth/utils/translateAuthError.ts`: erros em português
- `frontend/src/features/auth/components/`: `RequireAuth.tsx` (protege rotas), `SiteHighlights.tsx`
- `frontend/src/features/auth/pages/`: `LoginPage.tsx`, `SignUpPage.tsx`, `ConfirmSignUpPage.tsx`, `WelcomePage.tsx`
- `frontend/README.md`: como rodar

## Recursos AWS criados
Nenhum. O site usa o Cognito da Etapa 2. O servidor local roda no Mac: **US$ 0,00**.

## Comandos executados
- `npm view <pacote> version` (consulta)
- `npm install` (em `frontend/`)
- `npx tsc --noEmit` (sem erros) e `npx vite build` (build OK; pasta `dist/` apagada depois)
- `npm run dev` (servidor local em http://localhost:5173)

## Como testar
1. `cd frontend && npm run dev` e abra http://localhost:5173
2. Clique em **Cadastre-se grátis**, preencha e envie. Use um e-mail real: o código chega por e-mail.
3. Digite o código de 6 números em **Confirme seu e-mail**.
4. Faça login. A página `/inicio` mostra seus dados, com **Grupo: Nenhum (ainda sem empresa)**.
5. Clique em **Sair**. Tentar abrir http://localhost:5173/inicio deve levar ao login.
6. Teste os erros: senha fraca, senhas diferentes, e-mail já cadastrado, código errado.

## Pendências / atenção
- O e-mail do Cognito tem limite de **50 envios por dia** e pode cair no spam.
- O usuário novo fica **sem grupo**. A entrada no grupo "Dono" será feita no onboarding (Etapa 5).
- O SuperAdmin (você) será colocado no grupo na Etapa 4.
- Não há "Esqueci minha senha" (fora do escopo pedido). Pode ser adicionado depois, de graça (por e-mail).
- O build avisa que o arquivo JS tem mais de 500 KB (por causa do Amplify). Isso é só um aviso de desempenho.
  Dá para dividir em partes na etapa de deploy.
