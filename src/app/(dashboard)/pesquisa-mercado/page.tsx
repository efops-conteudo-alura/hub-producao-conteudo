import { prisma } from "@/lib/db"
import { PesquisaMercadoWrapper } from "./_components/pesquisa-mercado-wrapper"

export default async function PesquisaMercadoPage() {
  const pesquisas = await prisma.pesquisaMercado
    .findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        assunto: true,
        tipoConteudo: true,
        tipoPesquisa: true,
        autorNome: true,
        createdAt: true,
      },
    })
    .then((rows) => rows.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })))
    .catch(() => [])

  return (
    <div className="px-10 pt-10 pb-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Pesquisa de Mercado</h1>
        <p className="text-muted-foreground">
          Gere uma análise de mercado sobre um curso ou carreira com benchmarking de concorrentes e tendências.
        </p>
      </div>
      <PesquisaMercadoWrapper pesquisasIniciais={pesquisas} />
    </div>
  )
}
