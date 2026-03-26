import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const pesquisa = await prisma.pesquisaMercado.findUnique({ where: { id } })

  if (!pesquisa) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })

  return NextResponse.json(pesquisa)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const pesquisa = await prisma.pesquisaMercado.findUnique({ where: { id } })
  if (!pesquisa) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })

  const isAdmin = session.user.role === "ADMIN"
  const isCreator = pesquisa.autorEmail === session.user.email

  if (!isAdmin && !isCreator) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    await prisma.pesquisaMercado.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code
    if (code === "P2025") return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 })
  }
}
