# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Hub de Produção de Conteúdo — Alura

Hub para coordenadores de conteúdo da Alura. Centraliza ferramentas de IA para produção de conteúdo e o módulo Seletor de Atividades (migrado do select_activity).

**Banco de dados compartilhado com o hub-efops** (mesmo PostgreSQL/Neon). A autenticação usa o mesmo sistema de usuários — acesso controlado pela AppRole `hub-producao-conteudo`.

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
2. Se já tem conta mas sem senha → acessa `/criar-senha`

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

---

## O que NÃO fazer

- Não rodar `npx prisma migrate` — migrations são do hub-efops
- Não criar componentes em `src/components/ui/` — usar `npx shadcn add <componente>`
- Não usar `any` no TypeScript
- Não passar dados do body do request diretamente para o Prisma sem validação
- Não editar `auth.config.ts` para importar Prisma ou bcrypt — esse arquivo roda no Edge runtime
