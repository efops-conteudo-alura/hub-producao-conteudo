import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"
import { PromptsClient } from "./_components/prompts-client"

export default async function BibliotecaDePromptsPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const isAdmin = session.user.role === "ADMIN"
  const userId = session.user.id

  const prompts = await prisma.prompt.findMany({
    orderBy: { createdAt: "desc" },
  })

  const serialized = prompts.map((p) => ({
    id: p.id,
    titulo: p.titulo,
    descricao: p.descricao,
    conteudo: p.conteudo,
    categoria: p.categoria,
    autorNome: p.autorNome,
    autorId: p.autorId,
    createdAt: p.createdAt.toISOString(),
  }))

  return (
    <div className="px-10 pt-10 pb-10">
      <PromptsClient prompts={serialized} userId={userId} isAdmin={isAdmin} />
    </div>
  )
}
