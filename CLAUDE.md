# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Hub de Produção de Conteúdo — Alura

Hub para coordenadores de conteúdo da Alura. Centraliza ferramentas de IA para produção de conteúdo: briefing, validação de ementa, plano de estudos, revisão didática e pesquisa de mercado.

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
    (auth)/         → páginas públicas: login
    (dashboard)/    → páginas protegidas pelo middleware
      <ferramenta>/
        page.tsx              → Server Component (busca dados via Prisma direto)
        _components/          → componentes exclusivos da ferramenta
    api/
      <ferramenta>/
        route.ts              → GET, POST
        [id]/route.ts         → GET, PUT, DELETE
  components/       → componentes globais (sidebar, profile, theme)
  components/ui/    → componentes shadcn (nunca editar manualmente)
  lib/              → auth.ts, db.ts, utils.ts, crypto.ts
  types/next-auth.d.ts → extensão dos tipos do NextAuth
  middleware.ts     → proteção de rotas autenticadas
prisma/
  schema.prisma     → cópia do schema (somente leitura aqui — source of truth está no hub-efops)
```

---

## Convenções de código

Seguir as mesmas convenções do hub-efops:

- Server Components por padrão em `page.tsx`
- `"use client"` apenas quando necessário
- Importar prisma de `@/lib/db`: `import { prisma } from "@/lib/db"`
- Autenticação: `import { auth } from "@/lib/auth"` → `const session = await auth()`
- 401 = não autenticado, 403 = autenticado sem permissão
- Nunca usar `any` no TypeScript
- Ícones via lucide-react

---

## Autenticação

- App: `hub-producao-conteudo`
- Roles: `USER` | `ADMIN`
- Middleware protege tudo exceto: `api/auth`, `login`
- `session.user.id` e `session.user.role` disponíveis via JWT

---

## Ferramentas planejadas (issues abertas no hub-efops)

| Ferramenta | Issue | O que faz |
|---|---|---|
| Briefing | #1 | Gera briefing para o marketing a partir da ementa |
| Revisão Didática | #3 | Revisão de plano de aula e outros artefatos |
| Plano de Estudos | #5 | Criação de plano de estudos |
| Pesquisa de Mercado | #7 | Busca intencional na base de cursos com IA |

---

## O que NÃO fazer

- Não rodar `npx prisma migrate` — migrations são do hub-efops
- Não criar componentes em `src/components/ui/` — usar `npx shadcn add <componente>`
- Não usar `any` no TypeScript
- Não passar dados do body do request diretamente para o Prisma sem validação
