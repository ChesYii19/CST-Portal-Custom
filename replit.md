# CST Portal Interno

Portal interno de gestão para a ONG Casa Santa Teresinha — comunicação, documentos, tarefas e administração de equipe.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — API server (porta 8080, proxy em /api)
- `pnpm --filter @workspace/cst-portal run dev` — Frontend React/Vite (porta 25625, proxy em /)
- `pnpm run typecheck` — typecheck completo em todos os pacotes
- `pnpm run typecheck:libs` — recompila libs (rodar antes de typecheck se mudou o DB schema)
- `pnpm --filter @workspace/api-spec run codegen` — regenera hooks e schemas Zod do OpenAPI spec
- `pnpm --filter @workspace/db run push` — aplica schema no banco (apenas dev)
- Required env: `DATABASE_URL`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + express-session + connect-pg-simple
- DB: PostgreSQL + Drizzle ORM
- Autenticação: session-based (cookie httpOnly, armazenado na tabela `sessions` do Postgres)
- Validação: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (do OpenAPI spec em `lib/api-spec/`)
- Build: esbuild (CJS bundle)
- Frontend: React 19 + Vite + Tailwind CSS + shadcn/ui + Recharts + Wouter

## Where things live

- `lib/db/src/schema/index.ts` — source-of-truth do schema do banco (Drizzle)
- `lib/api-spec/openapi.yaml` — contrato da API (OpenAPI 3.0)
- `lib/api-client-react/src/generated/` — hooks React Query gerados (não editar à mão)
- `lib/api-zod/src/generated/` — schemas Zod gerados (não editar à mão)
- `artifacts/api-server/src/routes/` — rotas Express (auth, users, chat, docs, tasks, etc.)
- `artifacts/cst-portal/src/pages/` — páginas do portal (Home, Login, Dashboard, Chat, etc.)
- `artifacts/cst-portal/src/index.css` — paleta CST e tokens CSS

## Architecture decisions

- **Session via PostgreSQL**: express-session + connect-pg-simple armazena sessões na tabela `sessions`. `req.session.save()` é chamado explicitamente antes de enviar a resposta de login para garantir persistência atrás do proxy reverso.
- **Trust proxy**: `app.set("trust proxy", 1)` é necessário pois o Replit usa proxy reverso HTTPS; sem isso, os cookies podem não funcionar corretamente.
- **Contract-first API**: OpenAPI spec define o contrato; Orval gera os tipos. A fonte da verdade é o spec YAML, não o código gerado.
- **Paleta CST**: 8 cores institucionais definidas como variáveis CSS (`--cst-azul`, `--cst-rosa`, etc.) e aplicadas via Tailwind classes inline.

## Product

Portal interno com:
- **Home pública** — apresentação da ONG com funcionalidades
- **Login seguro** — autenticação por sessão com bloqueio após 3 tentativas
- **Dashboard** — gráficos Recharts (atividade, projetos, distribuição), cards de resumo
- **Chat** — canais por departamento, mensagens em tempo real (polling)
- **Documentos** — listagem, upload, busca e filtro por departamento
- **Tarefas (Kanban)** — colunas Pendente / Em andamento / Concluído, drag-and-drop
- **Admin** — gestão de usuários (apenas role `admin`)
- **Perfil** — edição de dados pessoais e avatar
- **Personalização** — tema em tempo real (cores, modo escuro, fonte, bordas)

## Usuários de teste

| E-mail | Senha | Role |
|---|---|---|
| admin@cst.org.br | Admin@2026 | Administrador |
| gestor@cst.org.br | Gestor@2026 | Gestor de Setor |
| colab@cst.org.br | Colab@2026 | Colaborador |

## Gotchas

- Sempre rodar `pnpm run typecheck:libs` antes de `pnpm --filter @workspace/api-server run typecheck` quando o schema do DB mudar.
- `req.session.save()` deve ser usado no login; sem isso, a sessão pode não persistir no proxy reverso do Replit.
- `app.set("trust proxy", 1)` é obrigatório no Express para o ambiente Replit.
- O codegen (Orval) gera arquivos em `lib/api-client-react/` e `lib/api-zod/`; nunca editar à mão.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
