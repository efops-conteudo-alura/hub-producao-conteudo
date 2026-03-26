---
name: nova-feature
description: Cria a estrutura completa de um novo módulo ou feature no Hub de Produção de Conteúdo, seguindo os padrões do projeto. Use quando o usuário pedir para criar um novo módulo, seção, página ou feature no Hub.
---

# Skill: Nova Feature no Hub de Produção de Conteúdo

Você vai criar a estrutura completa de uma nova feature no Hub de Produção de Conteúdo da Alura. Siga rigorosamente os padrões do projeto descritos no CLAUDE.md.

## Antes de criar qualquer arquivo

Pergunte ao usuário (se não estiver claro):
1. **Nome do módulo** — ex: "briefing", "revisao-didatica", "plano-de-estudos"
2. **O que a ferramenta faz?** — descrição breve do fluxo (entrada do usuário → chamada à IA → resultado)
3. **Precisa salvar histórico no banco?** — se sim, quais campos o model Prisma deve ter
4. **Acesso restrito a admin?** — ou qualquer usuário autenticado (`USER` ou `ADMIN`) acessa

---

## Estrutura a criar

Para um módulo chamado `[modulo]`, crie sempre:

### 1. Página principal (Server Component)
```
src/app/(dashboard)/[modulo]/page.tsx
```
- Busca dados direto com Prisma: `import { prisma } from "@/lib/db"`
- Verifica sessão com `import { auth } from "@/lib/auth"` → `const session = await auth()`
- Passa dados para componentes client via props

### 2. Componentes do módulo
```
src/app/(dashboard)/[modulo]/_components/
```
Padrões comuns para ferramentas de IA:
- `[modulo]-form.tsx` — formulário de entrada + exibição do resultado
- `historico-list.tsx` — listagem dos registros salvos
- `markdown-renderer.tsx` — se a resposta da IA for em markdown (reutilizar o de validacao-ementa se já existir)

### 3. API Routes
```
src/app/api/[modulo]/validar/route.ts      → POST (chama a IA)
src/app/api/[modulo]/registros/route.ts    → GET (lista) + POST (salva no banco)
src/app/api/[modulo]/registros/[id]/route.ts → GET + DELETE
```

### 4. Model Prisma (se necessário)
Adicionar ao `prisma/schema.prisma` — **mas apenas documentar a adição, não rodar migrate**.
Lembrar o usuário que migrations são gerenciadas pelo hub-efops.

Campos padrão:
- `id String @id @default(cuid())`
- `autorId String`
- `autorNome String`
- `createdAt DateTime @default(now())`

---

## Templates de código

### page.tsx (Server Component)
```tsx
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { [Modulo]Form } from "./_components/[modulo]-form"

export default async function [Modulo]Page() {
  const session = await auth()
  if (!session) redirect("/login")

  const registros = await prisma.[modulo].findMany({
    take: 30,
    orderBy: { createdAt: "desc" },
  })

  return <[Modulo]Form registros={registros} />
}
```

### validar/route.ts (chamada à IA)
```ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import Anthropic from "@anthropic-ai/sdk"

export const maxDuration = 60

const client = new Anthropic()

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { entrada, promptCustomizado } = await req.json()

  if (!entrada?.trim()) {
    return NextResponse.json({ error: "Entrada obrigatória." }, { status: 400 })
  }

  const promptFinal = promptCustomizado?.trim() || PROMPT_PADRAO

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `${promptFinal}\n\n${entrada}`,
      },
    ],
  })

  const resultado = (message.content[0] as { type: string; text: string }).text

  return NextResponse.json({ resultado })
}

const PROMPT_PADRAO = `
[Descreva o prompt padrão aqui]
`.trim()
```

### registros/route.ts
```ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const registros = await prisma.[modulo].findMany({
    take: 20,
    orderBy: { createdAt: "desc" },
    select: { id: true, titulo: true, autorNome: true, createdAt: true },
  })
  return NextResponse.json(registros)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  // validar campos obrigatórios antes de passar ao Prisma

  const registro = await prisma.[modulo].create({
    data: {
      ...body,
      autorId: session.user.id,
      autorNome: session.user.name ?? session.user.email ?? "",
    },
  })
  return NextResponse.json({ id: registro.id }, { status: 201 })
}
```

### registros/[id]/route.ts
```ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const registro = await prisma.[modulo].findUnique({ where: { id } })
  if (!registro) return NextResponse.json({ error: "Não encontrado." }, { status: 404 })

  return NextResponse.json(registro)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  await prisma.[modulo].delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
```

---

## Após criar os arquivos

1. Se criou model Prisma, **não rodar migrate aqui**. Lembrar o usuário:
   > "Adicione o model ao schema do hub-efops e rode a migration de lá. Depois rode `npx prisma generate` aqui."

2. Adicionar o módulo na sidebar (`src/components/sidebar.tsx`) com ícone do lucide-react.

3. Se for rota restrita a admin, verificar `session.user.role === "ADMIN"` nas API routes.

4. Sugerir mensagem de commit no formato:
   ```
   feat: [nome do módulo] — [descrição curta em pt-BR]
   ```

---

## O que NÃO fazer

- Não usar `fetch()` no servidor para buscar dados internos — sempre Prisma direto
- Não criar componentes em `src/components/ui/` — usar `npx shadcn add`
- Não usar `any` no TypeScript
- Não passar dados do body do request diretamente para o Prisma sem validação
- Não rodar `npx prisma migrate` — migrations são do hub-efops
- Não importar Prisma ou bcrypt em `auth.config.ts` — esse arquivo roda no Edge runtime
- Não criar estrutura diferente da estabelecida — consistência é o objetivo desta skill
