import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { ValidadorForm } from "./_components/validador-form"
import { HistoricoList } from "./_components/historico-list"

export default async function ValidacaoEmentaPage() {
  const session = await auth()

  const analyses = session
    ? (await prisma.ementaAnalise.findMany({
        orderBy: { createdAt: "desc" },
        take: 30,
        select: { id: true, titulo: true, autorNome: true, createdAt: true },
      })).map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }))
    : []

  return (
    <div className="px-10 pt-10 pb-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Validação de Ementa</h1>
        <p className="text-muted-foreground">
          Cole a ementa recebida do instrutor para receber uma avaliação e uma sugestão de ementa.
        </p>
      </div>
      <ValidadorForm />
      {analyses.length > 0 && (
        <div className="dot-pattern h-12 max-w-3xl rounded-xl my-10 opacity-60" />
      )}
      <HistoricoList analyses={analyses} />
    </div>
  )
}
