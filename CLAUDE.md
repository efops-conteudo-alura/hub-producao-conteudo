# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Hub de Produção de Conteúdo — Alura

Hub para coordenadores de conteúdo da Alura. Centraliza ferramentas de IA para produção de conteúdo e o módulo Seletor de Atividades (migrado do select_activity).

> **Este app faz parte de um ecossistema multi-app que compartilha um único banco PostgreSQL (Neon) com o hub-efops.**  
> O **hub-efops é o centralizador de usuários, acessos e migrações**. Leia a seção "Ecossistema de Apps" abaixo antes de qualquer mudança em autenticação, cadastro ou schema.

---

## Stack

- **Framework:** Next.js 16 (App Router) + TypeScript + React 19
- **Banco de dados:** PostgreSQL via Prisma ORM v6 (Neon) — banco compartilhado com hub-efops
- **Autenticação:** NextAuth v5 beta (credentials provider, roles: ADMIN | USER)
- **UI:** shadcn/ui + Tailwind CSS v4 + lucide-react
- **Formulários:** react-hook-form + zod
- **IA:** Anthropic Claude SDK (`@anthropic-ai/sdk`) — streaming

---

## Comandos úteis

```bash
npm run dev          # inicia em desenvolvimento
npm run build        # prisma generate + next build
npx prisma generate  # gera o client (não roda migrations — schema gerenciado pelo hub-efops)
```

> **IMPORTANTE:** Nunca rodar `npx prisma migrate` neste projeto. O schema e as migrations são gerenciados pelo hub-efops. Aqui só se usa `prisma generate` para gerar o client.

---

## Estrutura de pastas

```
src/
  app/
    (auth)/                      → páginas públicas
      login/                     → login
      primeiro-acesso/           → cadastro de coordenadores (seletor)
      criar-senha/               → definir senha de coordenadores (seletor)
    (dashboard)/                 → páginas protegidas pelo middleware
      home/
      biblioteca-de-prompts/
      validacao-ementa/
      pesquisa-mercado/
      revisao-didatica/          → placeholder (não implementado)
      plano-de-estudos/          → placeholder (não implementado)
      seletor-de-atividades/     → módulo Seletor de Atividades
        layout.tsx               → envolve com <AppProvider>
        page.tsx                 → redireciona por role (instrutor→tarefas, outros→submissoes)
        upload/                  → upload de JSON + criação/seleção de instrutor
        instrutores/             → listagem de instrutores cadastrados
        tarefas/                 → visão do instrutor (lista + detalhe em 3 etapas)
        submissoes/              → visão do coordenador (lista + detalhe com diff e export)
        _components/             → DropZone, StepBar, ExerciseCard, LessonAccordion
    api/
      biblioteca-de-prompts/
      validacao-ementa/
      pesquisa-mercado/
      seletor/
        submissoes/              → GET/POST + [id] GET/PATCH/DELETE
        instrutores/             → GET/POST
        coordenadores/           → GET
        auth/
          register/              → cria usuário + AppRoles (hub-producao:USER + select-activity:COORDINATOR)
          set-password/          → define senha de coordenador sem senha
  components/                    → Sidebar (global), componentes de UI compartilhados
  components/ui/                 → componentes shadcn (nunca editar manualmente)
  context/
    AppContext.tsx                → estado global do seletor (curso selecionado, exercícios, edições)
  lib/
    auth.ts / auth.config.ts     → NextAuth (auth.config.ts é Edge-safe, sem Prisma)
    db.ts                        → cliente Prisma
    storage.ts                   → helpers de sessionStorage (seletor)
    export.ts                    → exportSelectedCourse (download JSON)
  types/
    course.ts                    → tipos do seletor: Course, Lesson, Exercise, Alternative
    next-auth.d.ts               → extensão dos tipos do NextAuth
  middleware.ts                  → proteção de rotas + redirect de instrutor
prisma/
  schema.prisma                  → cópia do schema (somente leitura — source of truth no hub-efops)
```

---

## Convenções de código

- Server Components por padrão em `page.tsx`
- `"use client"` apenas quando necessário
- Importar prisma de `@/lib/db`: `import { prisma } from "@/lib/db"`
- Autenticação: `import { auth } from "@/lib/auth"` → `const session = await auth()`
- 401 = não autenticado, 403 = autenticado sem permissão
- Nunca usar `any` no TypeScript
- Ícones via lucide-react
- Scroll ao topo entre etapas: `document.getElementById("main-scroll")?.scrollTo({ top: 0, behavior: "instant" })`

---

## Ecossistema de Apps

Este app é parte de um ecossistema que compartilha o mesmo banco. O **hub-efops** é o centralizador — lá ficam:
- A gestão da `AllowedEmail` (whitelist de quem pode se cadastrar)
- As migrações do schema (nunca rodar `migrate` aqui)
- A interface de admin de usuários e AppRoles

### Apps no ecossistema

| Identificador (app) | Projeto | Roles disponíveis |
|---|---|---|
| `hub-efops` | projeto-hub-efops | `ADMIN`, `USER` |
| `hub-producao-conteudo` | este projeto | `ADMIN`, `USER` |
| `select-activity` | (embutido neste projeto) | `ADMIN`, `COORDINATOR`, `INSTRUCTOR` |
| `revisor-conteudo` | (embutido neste projeto — extensão Chrome) | `USER` |

### AppRole — como o acesso é controlado

Cada usuário tem zero ou mais `AppRole` no banco. Sem AppRole para um app = sem acesso. A rota `/api/seletor/auth/register` deste hub cria os AppRoles `hub-producao-conteudo:USER` e `select-activity:COORDINATOR` para novos usuários. Se o usuário já existe (cadastrado pelo hub-efops), os AppRoles faltantes são adicionados via upsert.

### Como adicionar um novo app ao ecossistema

1. Definir o identificador do app (ex: `"hub-novo-app"`)
2. Atualizar `/api/seletor/auth/register` neste hub para criar o AppRole do novo app nos cadastros
3. Atualizar `/api/auth/register` no hub-efops igualmente
4. Implementar o `auth.ts` do novo app buscando AppRole pelo identificador escolhido
5. No novo app: usar `npx prisma generate` (nunca `migrate`)
6. Atualizar a tabela "Apps no ecossistema" no CLAUDE.md de ambos os hubs existentes

---

## Autenticação e roles

### Hub de Produção de Conteúdo
- App: `hub-producao-conteudo`
- Roles: `USER` | `ADMIN`
- `session.user.role` — role neste app

### Seletor de Atividades
- App: `select-activity`
- Roles: `INSTRUCTOR` | `COORDINATOR` | `ADMIN`
- `session.user.selectorRole` — role no seletor

### Comportamento por tipo de usuário
| Tipo | `role` | `selectorRole` | Acesso |
|---|---|---|---|
| Admin | `ADMIN` | — | Tudo |
| Coordenador (hub-producao) | `USER` | `COORDINATOR` | Tudo do hub + seletor como coordenador |
| Instrutor | `""` / ausente | `INSTRUCTOR` | Apenas `/seletor-de-atividades/tarefas` |

- Instrutores são redirecionados para `/seletor-de-atividades/tarefas` pelo callback `authorized` em `auth.config.ts` (Edge)
- O helper `getSelectorRole(session)` nas API routes: se `role === "ADMIN"` retorna `"ADMIN"`, senão retorna `selectorRole`
- Sidebar oculta módulos do hub para instrutores (apenas o item do seletor é exibido)

### Acesso ao seletor para coordenadores sem conta
1. Coordenador acessa `/primeiro-acesso` → cria conta → recebe `hub-producao-conteudo:USER` + `select-activity:COORDINATOR`
2. Se já tem conta (cadastrada pelo hub-efops ou outro app) → o cadastro detecta o usuário existente e adiciona os AppRoles faltantes → redireciona para login

---

## Módulos implementados

| Módulo | Rota | Status |
|---|---|---|
| Biblioteca de Prompts | `/biblioteca-de-prompts` | ✅ Implementado |
| Validação de Ementa | `/validacao-ementa` | ✅ Implementado |
| Pesquisa de Mercado | `/pesquisa-mercado` | ✅ Implementado |
| Seletor de Atividades | `/seletor-de-atividades` | ✅ Implementado |
| Revisão Didática | `/revisao-didatica` | 🔲 Placeholder |
| Plano de Estudos | `/plano-de-estudos` | 🔲 Placeholder |
| Revisor de Conteúdo | `/revisor-conteudo` | 🔲 Estrutura criada — aguardando migration |

---

## Revisor de Conteúdo — Integração com extensão Chrome

O módulo `/revisor-conteudo` é o "cérebro" da extensão `alura-revisor-conteudo` (veja issues hub-producao-conteudo#13 e alura-revisor-conteudo#5).

### Distribuição automática da extensão

- `public/update.xml` — Chrome consulta este arquivo para atualizar a extensão silenciosamente
- `public/alura-revisor-conteudo.zip` — pacote da extensão; **deve ser gerado e copiado manualmente** a cada nova versão
- O campo `appid` no `update.xml` deve ser substituído pelo ID real da extensão (visível em `chrome://extensions/` após a primeira instalação)

### API routes

- `GET/POST /api/revisor/auditorias` — a extensão envia auditorias via POST; hub lista via GET
- `GET/PUT /api/revisor/config` — gerenciamento de credenciais por usuário (GitHub, AWS, video-uploader)

### Pendências antes de funcionar em produção

1. **Migration no hub-efops**: os models `RevisorAuditoria` e `UserCredential` estão no `schema.prisma` mas ainda não foram migrados. Até isso acontecer, as rotas retornam `[]` ou `503` graciosamente.
2. **AppRole `revisor-conteudo:USER`**: definir e adicionar ao fluxo de cadastro (`/api/seletor/auth/register`) quando a integração for completa.
3. **Criptografia das credenciais**: o campo `value` em `UserCredential` está armazenando texto plano por enquanto. Implementar criptografia AES-256-GCM (mesmo padrão do `SystemConfig`) antes de ir a produção.
4. **ID da extensão**: substituir `EXTENSAO_ID_AQUI` no `public/update.xml` pelo ID real.

---

## O que NÃO fazer

- Não rodar `npx prisma migrate` — migrations são do hub-efops
- Não criar componentes em `src/components/ui/` — usar `npx shadcn add <componente>`
- Não usar `any` no TypeScript
- Não passar dados do body do request diretamente para o Prisma sem validação
- Não editar `auth.config.ts` para importar Prisma ou bcrypt — esse arquivo roda no Edge runtime
