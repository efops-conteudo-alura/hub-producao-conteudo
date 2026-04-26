# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Hub de Produção de Conteúdo — Alura

Hub para coordenadores de conteúdo da Alura. Centraliza ferramentas de IA para produção de conteúdo, gestão de contratos e o módulo Seletor de Atividades (migrado do select_activity).

> **⚠️ Este app faz parte de um ecossistema multi-app que compartilha um único banco PostgreSQL (Neon) com o hub-efops.**
> O **hub-efops é o centralizador de usuários, acessos e migrações**. Leia a seção "Ecossistema de Apps" antes de qualquer mudança em autenticação, cadastro ou schema.

---

## Stack

- **Framework:** Next.js 16 (App Router) + TypeScript + React 19
- **Banco de dados:** PostgreSQL via Prisma ORM v6 (Neon) — banco compartilhado com hub-efops
- **Autenticação:** NextAuth v5 beta (credentials provider)
- **UI:** shadcn/ui + Tailwind CSS v4 + lucide-react
- **Formulários:** react-hook-form + zod
- **IA:** Anthropic Claude SDK (`@anthropic-ai/sdk`) — streaming
- **Integrações:** ClickUp API (`src/lib/clickup.ts`)

> **Por que essas escolhas?** Next.js App Router foi escolhido pela separação clara entre Server/Client Components, o que reduz bundle e simplifica autenticação. NextAuth v5 beta foi necessário para suporte ao App Router. Neon foi escolhido por ser serverless-friendly com Prisma. Antes de propor troca de qualquer biblioteca core, consulte o histórico de issues do projeto.

---

## Setup local

```bash
# 1. Instale as dependências
npm install

# 2. Configure as variáveis de ambiente
cp .env.example .env.local
# Preencha os valores — veja a seção "Variáveis de ambiente" abaixo

# 3. Gere o Prisma Client (nunca migrate!)
npx prisma generate

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

### Comandos úteis

```bash
npm run dev          # inicia em desenvolvimento (porta 3000)
npm run build        # prisma generate + next build
npx prisma generate  # regenera o client após mudança no schema (nunca roda migrations)
npx prisma studio    # UI para inspecionar o banco (somente leitura recomendado)
```

> **⚠️ NUNCA rodar `npx prisma migrate`** neste projeto. O schema e as migrations são gerenciados exclusivamente pelo hub-efops.

---

## Variáveis de ambiente

O arquivo `.env.example` na raiz do projeto contém todas as variáveis necessárias. As principais são:

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Connection string do PostgreSQL (Neon) — obter com o responsável pelo hub-efops |
| `NEXTAUTH_SECRET` | Secret para assinar sessões — gerar com `openssl rand -base64 32` |
| `NEXTAUTH_URL` | URL base do app (`http://localhost:3000` em dev) |
| `ANTHROPIC_API_KEY` | API key da Anthropic para os módulos de IA |
| `ENCRYPTION_KEY` | Chave AES-256 para criptografar credenciais do Revisor — gerar com `openssl rand -base64 32` |

> Em produção, todas as variáveis são configuradas na plataforma de deploy (Vercel). Nunca commitar valores reais no repositório.

---

## Estrutura de pastas

```
src/
  app/
    (auth)/                      → páginas públicas (sem sidebar)
      login/
      primeiro-acesso/           → cadastro de coordenadores (seletor)
      criar-senha/               → definir senha de coordenadores (seletor)
    (dashboard)/                 → páginas protegidas pelo middleware (com sidebar)
      layout.tsx                 → layout compartilhado (sidebar, navbar)
      home/                      → dashboard principal (widgets de contratos, cursos, submissões, links úteis)
        _components/
      biblioteca-de-prompts/     → prompts salvos com IA
        _components/
      contratos/                 → gestão de contratos com status stepper e novidades
        _components/
      validacao-ementa/          → validação de ementas com IA
        _components/
      pesquisa-mercado/          → pesquisas de mercado com IA
        _components/
      revisao-didatica/          → placeholder (não implementado)
      plano-de-estudos/          → placeholder (não implementado)
      revisor-conteudo/          → UI criada, aguardando migration no hub-efops
        _components/
      seletor-de-atividades/
        layout.tsx               → envolve com <AppProvider>
        page.tsx                 → redireciona por role (instrutor→tarefas, outros→submissoes)
        upload/                  → upload de ZIP + criação/seleção de instrutor
        instrutores/
        tarefas/                 → visão do instrutor (lista de tarefas)
        tarefas/[id]/            → detalhe de tarefa em 3 etapas
        submissoes/              → visão do coordenador (lista)
        submissoes/[id]/         → detalhe com diff e export
        _components/
    api/
      auth/
        [...nextauth]/           → rotas dinâmicas do NextAuth
        check-email/             → GET verifica se email já existe no banco
      profile/                   → GET/POST perfil do usuário
      biblioteca-de-prompts/     → GET/POST + [id] GET/PUT/DELETE
      contratos/                 → GET lista contratos
        statuses/                → GET status disponíveis
        novidades/               → GET novidades/updates de contratos
      home/
        contratos/               → GET dados de contratos para dashboard
        coordenadores/           → GET lista de coordenadores
        cursos/                  → GET cursos para dashboard
        submissoes/              → GET submissões ativas
        links/                   → GET/POST links úteis
        links/[id]/              → DELETE link
      validacao-ementa/
        ementas/                 → GET/POST + [id] GET/DELETE
        validar/                 → POST (validação com IA)
      pesquisa-mercado/          → GET/POST + [id] GET/DELETE
      revisor/
        auditorias/              → GET/POST (extensão Chrome → POST; hub lista via GET)
        config/                  → GET/PUT credenciais por usuário (GitHub, AWS, video-uploader)
        forks/                   → POST cria fork na org alura-cursos via GitHub API
      seletor/
        submissoes/              → GET/POST
        submissoes/[id]/         → GET/PUT
        instrutores/             → GET/POST
        coordenadores/           → GET
        auth/
          register/              → cria usuário + AppRoles
          set-password/          → define senha de coordenador sem senha
    page.tsx                     → redireciona para /home
    providers.tsx                → ThemeProvider e SessionProvider
  components/                    → Sidebar (global), ProfileDialog, componentes de UI compartilhados
  components/ui/                 → componentes shadcn — NUNCA editar manualmente
  context/
    AppContext.tsx               → estado global do seletor (curso selecionado, exercícios, edições)
  lib/
    auth.ts / auth.config.ts    → NextAuth (auth.config.ts é Edge-safe, sem Prisma)
    db.ts                       → cliente Prisma singleton
    clickup.ts                  → integração com a API do ClickUp
    crypto.ts                   → encrypt/decrypt AES-256-GCM (credenciais do revisor)
    storage.ts                  → helpers de sessionStorage (seletor)
    export.ts                   → exportSelectedCourse (download JSON)
    parseZipCourse.ts           → parser de ZIP de cursos
    utils.ts                    → utilitários gerais (cn, etc.)
  types/
    course.ts                   → tipos do seletor: Course, Lesson, Exercise, Alternative
    next-auth.d.ts              → extensão dos tipos do NextAuth
  middleware.ts                 → proteção de rotas + redirect de instrutor
prisma/
  schema.prisma                 → cópia do schema — SOMENTE LEITURA (source of truth no hub-efops)
```

---

## Padrão para novos módulos

Antes de criar qualquer novo módulo, verifique se ele já existe como placeholder (ex: `revisao-didatica`, `plano-de-estudos`). Se for implementar um módulo novo, siga rigorosamente este padrão — baseie-se no módulo `validacao-ementa` como referência:

```
(dashboard)/
  nome-do-modulo/
    page.tsx              → Server Component, busca dados iniciais, renderiza o Client Component principal
    _components/          → Client Components específicos deste módulo
      NomeDoModulo.tsx    → componente principal com "use client"
      OutroComponente.tsx

api/
  nome-do-modulo/
    route.ts              → GET/POST com validação via zod + autenticação via auth()
    [id]/
      route.ts            → GET/PUT/DELETE por ID
```

**Regras do padrão:**
- `page.tsx` é sempre Server Component — não usar `"use client"` nele
- Lógica de UI vai em `_components/`, nunca direto no `page.tsx`
- Toda API route valida o body com zod antes de tocar no Prisma
- Toda API route verifica a sessão com `const session = await auth()` como primeira linha
- Não criar contextos React globais para novos módulos — usar estado local ou props

---

## Convenções de código

- **Server Components** por padrão em `page.tsx`
- `"use client"` apenas quando necessário (eventos, hooks, estado)
- Importar prisma de `@/lib/db`: `import { prisma } from "@/lib/db"`
- Autenticação: `import { auth } from "@/lib/auth"` → `const session = await auth()`
- HTTP semântico: `401` = não autenticado, `403` = autenticado sem permissão
- Nunca usar `any` no TypeScript — se precisar, use `unknown` com type guard
- Ícones exclusivamente via `lucide-react`
- Nomenclatura: pastas em `kebab-case`, componentes em `PascalCase`, funções em `camelCase`

---

## Como adicionar dependências

Antes de instalar qualquer biblioteca nova:

1. Verifique se a funcionalidade não existe em uma das libs já instaladas (ex: utilitários de array → lodash/nativa; formatação de datas → date-fns)
2. Prefira libs com suporte nativo ao App Router do Next.js
3. Não instalar libs de UI além do shadcn/ui — se precisar de um componente novo, use `npx shadcn add <componente>`
4. Não instalar libs de gerenciamento de estado global (Redux, Zustand, Jotai) — o projeto usa estado local e o AppContext existente
5. Libs de IA: manter apenas `@anthropic-ai/sdk`. Qualquer integração com outro modelo deve ser discutida antes

---

## Ecossistema de Apps

O banco PostgreSQL é compartilhado. O **hub-efops** centraliza:
- Gestão da `AllowedEmail` (whitelist de cadastro)
- Todas as migrations do schema
- Interface de admin de usuários e AppRoles

### Apps no ecossistema

| Identificador (app) | Projeto | Roles disponíveis |
|---|---|---|
| `hub-efops` | projeto-hub-efops | `ADMIN`, `USER` |
| `hub-producao-conteudo` | este projeto | `ADMIN`, `USER`, `COORDINATOR`, `INSTRUCTOR` |
| `revisor-conteudo` | extensão Chrome (embutida neste projeto) | `USER` |

### AppRole — como o acesso é controlado

Cada usuário tem zero ou mais `AppRole` no banco. Sem AppRole para um app = sem acesso. A rota `/api/seletor/auth/register` deste hub cria os AppRoles `hub-producao-conteudo:USER` e `select-activity:COORDINATOR` para novos usuários. Se o usuário já existe, os AppRoles faltantes são adicionados via upsert.

### Como adicionar um novo app ao ecossistema

1. Definir o identificador do app (ex: `"hub-novo-app"`)
2. Atualizar `/api/seletor/auth/register` neste hub para criar o AppRole do novo app
3. Atualizar `/api/auth/register` no hub-efops igualmente
4. Implementar o `auth.ts` do novo app buscando AppRole pelo identificador escolhido
5. No novo app: usar apenas `npx prisma generate` (nunca `migrate`)
6. Atualizar a tabela "Apps no ecossistema" no CLAUDE.md de ambos os projetos

---

## Autenticação e roles

- App identifier: `hub-producao-conteudo`
- `session.user.role` — único campo de role na sessão (não existe mais `selectorRole` nem `getSelectorRole()`)

| Tipo | `role` | Acesso |
|---|---|---|
| Admin | `ADMIN` | Tudo |
| Coordenador | `COORDINATOR` | Tudo do hub + seletor como coordenador |
| Instrutor | `INSTRUCTOR` | Apenas `/seletor-de-atividades/tarefas` |
| Usuário comum | `USER` | Módulos do hub (sem seletor) |

- Instrutores são redirecionados para `/seletor-de-atividades/tarefas` pelo callback `authorized` em `auth.config.ts` (Edge runtime)
- Sidebar oculta módulos do hub para instrutores
- **Nunca** importar Prisma ou bcrypt em `auth.config.ts` — ele roda no Edge runtime

### Acesso ao seletor para coordenadores sem conta

1. Coordenador acessa `/primeiro-acesso` → cria conta → recebe `hub-producao-conteudo:USER` + `select-activity:COORDINATOR`
2. Se já tem conta → o cadastro detecta o usuário existente, adiciona os AppRoles faltantes → redireciona para login

---

## Módulos

| Módulo | Rota | Status |
|---|---|---|
| Home / Dashboard | `/home` | ✅ Funcionando |
| Biblioteca de Prompts | `/biblioteca-de-prompts` | ✅ Funcionando |
| Contratos | `/contratos` | ✅ Funcionando |
| Validação de Ementa | `/validacao-ementa` | ✅ Funcionando |
| Pesquisa de Mercado | `/pesquisa-mercado` | ✅ Funcionando |
| Seletor de Atividades | `/seletor-de-atividades` | ✅ Funcionando |
| Revisor de Conteúdo | `/revisor-conteudo` | 🟡 UI + API prontas — bloqueado por migration no hub-efops |
| Revisão Didática | `/revisao-didatica` | 🔲 Placeholder — não iniciar sem alinhamento |
| Plano de Estudos | `/plano-de-estudos` | 🔲 Placeholder — não iniciar sem alinhamento |

---

## Revisor de Conteúdo — Integração com extensão Chrome

O módulo `/revisor-conteudo` é o backend da extensão `alura-revisor-conteudo`.

**Status:** UI e API estão implementadas, mas as rotas retornam `[]` ou `503` até a migration ser aplicada no hub-efops.

### API routes

| Rota | Método | Descrição |
|---|---|---|
| `/api/revisor/auditorias` | GET / POST | Extensão envia via POST; hub lista via GET |
| `/api/revisor/config` | GET / PUT | Credenciais por usuário (GitHub, AWS, video-uploader) |
| `/api/revisor/forks` | POST | Cria fork na org `alura-cursos` via GitHub API |

### Distribuição da extensão

- `public/update.xml` — consultado pelo Chrome para atualizar a extensão silenciosamente
- `public/alura-revisor-conteudo.zip` — deve ser gerado e copiado manualmente a cada versão
- Substituir `EXTENSAO_ID_AQUI` no `update.xml` pelo ID real (visível em `chrome://extensions/`)

### Pendências para ativar em produção

1. **Migration no hub-efops** — models `RevisorAuditoria` e `UserCredential` no schema, aguardando `migrate`
2. **AppRole `revisor-conteudo:USER`** — definir e adicionar ao fluxo de cadastro quando integração estiver completa
3. **ID da extensão** — substituir `EXTENSAO_ID_AQUI` no `public/update.xml`
4. ~~Criptografia das credenciais~~ — já implementada em `src/lib/crypto.ts` (AES-256-GCM)

---

## O que NÃO fazer

### Banco e schema
- ❌ `npx prisma migrate` — migrations são exclusivamente do hub-efops
- ❌ Editar `prisma/schema.prisma` e esperar que funcione em produção — é só uma cópia local para o `generate`

### Autenticação
- ❌ Importar Prisma ou bcrypt em `auth.config.ts` — roda no Edge runtime
- ❌ Criar novos campos de role na sessão além de `session.user.role`

### UI e componentes
- ❌ Criar ou editar arquivos em `src/components/ui/` manualmente — usar `npx shadcn add <componente>`
- ❌ Instalar bibliotecas de UI além do shadcn/ui

### TypeScript e qualidade
- ❌ Usar `any` no TypeScript — usar `unknown` com type guard
- ❌ Passar body do request direto para o Prisma sem validar com zod

### Arquitetura
- ❌ Criar contextos React globais para novos módulos — usar estado local
- ❌ Adicionar lógica de negócio em `page.tsx` — pertence a `_components/` ou API routes
- ❌ Iniciar implementação dos placeholders (`revisao-didatica`, `plano-de-estudos`) sem alinhamento prévio
