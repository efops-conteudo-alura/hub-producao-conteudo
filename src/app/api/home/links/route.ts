import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

const FALLBACK_LINKS = [
  { id: "1", title: "Produção de Conteúdo", url: "https://app.clickup.com/3148001/v/li/901311315105", description: "Lista de cursos ativos", order: 0 },
  { id: "2", title: "Contratos ClickUp",    url: "https://app.clickup.com/3148001/v/li/901306782159", description: "Lista de contratos em aberto", order: 1 },
  { id: "3", title: "Admin Alura",           url: "https://www.alura.com.br/admin",                   description: "Painel administrativo da Alura", order: 2 },
  { id: "4", title: "Hub EfOps",             url: "https://hub-efops.vercel.app",                      description: "Hub de operações e eficiência", order: 3 },
]

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const links = await prisma.usefulLink
    .findMany({ orderBy: { order: "asc" } })
    .catch(() => FALLBACK_LINKS)

  return NextResponse.json(links)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await req.json() as { title?: string; url?: string; description?: string }
  const { title, url, description } = body

  if (!title?.trim()) return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 })
  if (!url?.trim()) return NextResponse.json({ error: "URL é obrigatória" }, { status: 400 })

  const count = await prisma.usefulLink.count()
  const link = await prisma.usefulLink.create({
    data: { title: title.trim(), url: url.trim(), description: description?.trim() || null, order: count },
  })
  return NextResponse.json(link, { status: 201 })
}
