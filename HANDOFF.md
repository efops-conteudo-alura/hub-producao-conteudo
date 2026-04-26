# Handoff — Hub de Produção de Conteúdo

> Documento de transição de projeto. Última atualização: abril de 2025.
> Responsável de saída: Vasco
> Responsável de entrada: Rafael

---

## O que é esse projeto

Hub interno da Alura para coordenadores de conteúdo. Concentra ferramentas de IA (validação de ementas, pesquisa de mercado, biblioteca de prompts) e o módulo Seletor de Atividades — onde instrutores selecionam exercícios e coordenadores revisam e exportam as seleções.

O projeto faz parte de um **ecossistema de dois apps** que compartilham o mesmo banco PostgreSQL:

- **hub-producao-conteudo** (este projeto) — ferramentas de produção de conteúdo
- **hub-efops** — centralizador de usuários, permissões e migrações de banco

> ⚠️ Qualquer mudança em usuários, permissões ou schema do banco passa pelo hub-efops, não por aqui.

---

## Acesso e repositórios

| Recurso | Onde |
|---|---|
| Este repositório | [_[link do repo]_](https://github.com/efops-conteudo-alura/hub-producao-conteudo) |
| Repositório hub-efops | [_[link do repo]_](https://github.com/efops-conteudo-alura/hub-efops) |
| Repositório extensão Chrome | [_[link do repo]_](https://github.com/efops-conteudo-alura/alura-revisor-conteudo) |
| Banco de dados (Neon) | [_[link do dashboard Neon]_](https://console.neon.tech/app/projects/delicate-hall-09687820) |
| Deploy (Vercel) | [_[link do projeto Vercel]_](https://vercel.com/aluras-projects-3644c498/hub-producao-conteudo) |

### Variáveis de ambiente

As variáveis de produção estão configuradas no Vercel. Para desenvolvimento local, solicitar ao responsável atual:
- `DATABASE_URL` (connection string Neon)
- `ANTHROPIC_API_KEY`
- `NEXTAUTH_SECRET`
- `ENCRYPTION_KEY`
- `CLICKUP_API_TOKEN` (integração com ClickUp — usada no módulo Contratos)

---

## Estado atual de cada módulo

### ✅ Funcionando em produção

| Módulo | Rota | Observações |
|---|---|---|
| Home / Dashboard | `/home` | Estável. Widgets de contratos, cursos, submissões e links úteis. |
| Biblioteca de Prompts | `/biblioteca-de-prompts` | Estável. Sem pendências. |
| Contratos | `/contratos` | Estável. Status stepper + novidades integradas via ClickUp API. |
| Validação de Ementa | `/validacao-ementa` | Estável. Usa streaming da API Anthropic. |
| Pesquisa de Mercado | `/pesquisa-mercado` | Estável. |
| Seletor de Atividades | `/seletor-de-atividades` | Estável. Migrado do projeto `select_activity`. |

### 🟡 Implementado, mas bloqueado

| Módulo | Rota | Bloqueio |
|---|---|---|
| Revisor de Conteúdo | `/revisor-conteudo` | Aguardando migration no hub-efops (ver seção abaixo) |

### 🔲 Placeholders — não iniciar sem alinhamento

| Módulo | Rota | Status |
|---|---|---|
| Revisão Didática | `/revisao-didatica` | Apenas a pasta existe. Sem spec definida. |
| Plano de Estudos | `/plano-de-estudos` | Apenas a pasta existe. Sem spec definida. |

---

## Bloqueios ativos

### 1. Revisor de Conteúdo — aguardando migration no hub-efops

**O que está feito:**
- UI completa em `/revisor-conteudo`
- API routes em `/api/revisor/` (auditorias, config, forks)
- Criptografia de credenciais implementada (`src/lib/crypto.ts`)

**O que está bloqueado:**
- Os models `RevisorAuditoria` e `UserCredential` estão no `schema.prisma` local, mas a migration ainda não foi aplicada no banco pelo hub-efops
- Até isso acontecer, as rotas retornam `[]` ou `503` graciosamente (não quebram)

**O que precisa ser feito para desbloquear:**
1. No hub-efops: criar e rodar a migration com os models `RevisorAuditoria` e `UserCredential`
2. Neste projeto: rodar `npx prisma generate` após a migration
3. Definir e adicionar o AppRole `revisor-conteudo:USER` ao fluxo de cadastro em `/api/seletor/auth/register`
4. Substituir `EXTENSAO_ID_AQUI` em `public/update.xml` pelo ID real da extensão Chrome

**Referências:** issues `hub-producao-conteudo#13` e `alura-revisor-conteudo#5`

---

## Decisões que precisam ser tomadas

Estas são decisões em aberto que o Rafael precisará tomar (ou alinhar com Vasco) antes de qualquer implementação nova:

| Decisão | Contexto |
|---|---|
| Prioridade do Revisor de Conteúdo | Depende de coordenar a migration com o hub-efops. Quando ativar? |
| Spec dos módulos placeholder | `revisao-didatica` e `plano-de-estudos` não têm spec. Quem define o escopo? |
| Distribuição da extensão Chrome | Como será o processo de publicação/atualização da extensão para os usuários? |
| AppRole do Revisor | Quando e como adicionar `revisor-conteudo:USER` ao fluxo de cadastro? |

---

## O que NÃO tocar sem alinhar antes

- **`prisma/schema.prisma`** — é uma cópia local. Alterações aqui não têm efeito em produção. Toda mudança no schema é feita e migrada pelo hub-efops.
- **`src/components/ui/`** — componentes shadcn. Não editar manualmente. Se precisar de um novo componente, usar `npx shadcn add <componente>`.
- **`src/lib/auth.config.ts`** — roda no Edge runtime do Next.js. Não importar Prisma ou bcrypt.
- **Módulos placeholder** (`revisao-didatica`, `plano-de-estudos`) — não implementar sem spec e alinhamento com produto.

---

## Pessoas de referência

| Quem | Papel | Quando acionar |
|---|---|---|
| Vasco | Responsável pelo hub-efops | Qualquer dúvida sobre schema, usuários, migrations ou AppRoles |
| Vasco e Rafael | Produto / coordenação | Definição de escopo dos módulos novos |
| Rafael | Extensão Chrome | Dúvidas sobre `alura-revisor-conteudo` |

---

## Guia de primeiros passos para o Rafael

Ordem sugerida para entrar no projeto:

1. **Ler o `CLAUDE.md`** na raiz do projeto — é o documento técnico principal
2. **Configurar o ambiente local** seguindo a seção "Setup local" do CLAUDE.md
3. **Explorar os módulos funcionando** — começar pelo `validacao-ementa`, que é o módulo mais completo e bem estruturado. Serve de referência de padrão para novos módulos.
4. **Entender o ecossistema** — conversar com o responsável pelo hub-efops para entender como o banco compartilhado funciona na prática
5. **Não mexer no Revisor** até entender o bloqueio da migration e alinhar a prioridade

---

## Contexto de decisões arquiteturais

Registro das decisões mais importantes para não serem revertidas sem motivo:

- **Next.js App Router (não Pages Router):** escolha deliberada para usar Server Components e simplificar autenticação. Não misturar os dois padrões.
- **Banco compartilhado com hub-efops:** permite SSO entre os apps do ecossistema sem duplicar usuários. O custo é que migrations precisam ser coordenadas.
- **NextAuth v5 beta:** necessário para suporte completo ao App Router. A API é diferente do NextAuth v4 — não usar exemplos da documentação antiga.
- **`auth.config.ts` separado do `auth.ts`:** o `auth.config.ts` roda no Edge (middleware) e não pode importar Node.js. O `auth.ts` roda no servidor e tem acesso ao Prisma. Essa separação é intencional e não deve ser colapsada.
- **Criptografia das credenciais do Revisor:** credenciais de GitHub e AWS são criptografadas com AES-256-GCM antes de salvar no banco (`src/lib/crypto.ts`). Não salvar credenciais em plaintext.
- **Integração ClickUp:** o módulo Contratos consome a ClickUp API via `src/lib/clickup.ts`. O token é lido de variável de ambiente — não hardcodar credenciais e não expor o client no lado do browser.
