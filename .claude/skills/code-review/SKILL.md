---
name: code-review
description: Faz uma revisão profunda de qualidade de código em um arquivo ou feature específica do Hub de Produção de Conteúdo. Use quando o usuário pedir para revisar, fazer code review, checar qualidade, ou verificar bugs em um arquivo ou funcionalidade.
---

# Skill: Code Review — Hub de Produção de Conteúdo

Você vai fazer uma revisão de qualidade em um arquivo ou feature específica do Hub de Produção de Conteúdo da Alura. O projeto usa Next.js 16 (App Router), TypeScript, Prisma + PostgreSQL (banco compartilhado com hub-efops), Anthropic Claude SDK para IA, e shadcn/ui com @base-ui/react.

## Antes de começar

Se o usuário não especificou qual arquivo ou feature revisar, pergunte:
- "Qual arquivo ou feature você quer que eu revise?"

Se especificou, leia o(s) arquivo(s) relevante(s) antes de qualquer análise.

---

## O que verificar

### 1. Edge cases não tratados
- O que acontece se o dado vier vazio, null ou undefined?
- E se a requisição falhar no meio?
- E se o usuário fizer a ação duas vezes seguidas (duplo clique, duplo submit)?
- Datas e valores numéricos têm validação de limites?

### 2. Tratamento de erros
- Chamadas ao Prisma estão dentro de try/catch?
- Chamadas à API da Anthropic estão dentro de try/catch?
- Erros de API estão sendo capturados e exibidos ao usuário de forma útil?
- O app quebra silenciosamente ou informa o usuário quando algo dá errado?

### 3. TypeScript
- Há uso de `any` que poderia ser tipado corretamente?
- Type assertions (`as Tipo`) sem verificação real?
- Props de componentes estão tipadas?
- Retornos de função estão tipados?

### 4. Lógica de negócio
- A lógica faz sentido para o contexto de produção de conteúdo da Alura?
- Há condições que nunca serão verdadeiras (dead code)?
- Há condições que sempre serão verdadeiras (lógica desnecessária)?
- Features de IA: o prompt está claro e o parsing da resposta é robusto?

### 5. Consistência com o projeto
- O componente segue os padrões do projeto? (Server Component quando possível, `"use client"` só quando necessário)
- Está usando `prisma` de `@/lib/db` e `auth` de `@/lib/auth`?
- Está usando componentes de `src/components/ui/` em vez de HTML puro?
- API routes retornam 401 para não autenticado e 403 para sem permissão?

### 6. Performance
- Há queries Prisma que buscam dados desnecessários (sem `select` específico em listas grandes)?
- Há `useEffect` ou `useState` que poderiam ser substituídos por Server Components?
- Chamadas à Anthropic têm `maxDuration` configurado para evitar timeout na Vercel?

**Observação**: Se tratamento de erros for o único problema encontrado, dedique metade da revisão a outros critérios.

---

## Formato do relatório

```
# Code Review — [nome do arquivo/feature]

## Resumo
[2-3 linhas sobre a qualidade geral do código]

## Problemas encontrados

### 🔴 Crítico — [título]
**Arquivo:** `caminho/do/arquivo.ts`
**Linha:** XX
**Problema:** descrição clara
**Correção sugerida:**
\`\`\`ts
// código corrigido
\`\`\`

### 🟠 Importante — [título]
[mesma estrutura]

### 🟡 Sugestão — [título]
[mesma estrutura]

## O que está bem feito
[lista de pontos positivos — sempre inclua isso]

## Próximos passos sugeridos
[lista priorizada do que corrigir primeiro]
```

---

## Importante

- Leia o código real antes de comentar — nunca assuma o conteúdo
- Se precisar de contexto de outro arquivo para entender a lógica, leia esse arquivo também
- Separe problemas reais de preferências estilísticas — só reporte o que tem impacto real
- Sempre inclua pontos positivos — o objetivo é melhorar, não só criticar
- Se o código estiver bom, diga isso claramente em vez de inventar problemas
