import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const auditorias = await prisma.revisorAuditoria
    .findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })
    .catch(() => [])

  return NextResponse.json(auditorias)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { cursoId, cursoTitulo, resultado } = body

  if (!cursoId?.trim() || !cursoTitulo?.trim() || resultado == null) {
    return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 })
  }

  try {
    const auditoria = await prisma.revisorAuditoria.create({
      data: {
        userId: session.user.id,
        cursoId: String(cursoId).trim(),
        cursoTitulo: String(cursoTitulo).trim(),
        resultado,
      },
    })
    return NextResponse.json(auditoria, { status: 201 })
  } catch {
    return NextResponse.json(
      { error: "Serviço temporariamente indisponível" },
      { status: 503 }
    )
  }
}
