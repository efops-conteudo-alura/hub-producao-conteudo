import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

const ALLOWED_SERVICES = ["github", "aws_access_key", "aws_secret_key", "video_uploader"] as const
type Service = (typeof ALLOWED_SERVICES)[number]

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const credentials = await prisma.userCredential
    .findMany({
      where: { userId: session.user.id },
      select: { service: true, updatedAt: true }, // nunca retornar o value
    })
    .catch(() => [])

  const config = Object.fromEntries(
    ALLOWED_SERVICES.map((s) => [
      s,
      { configured: credentials.some((c) => c.service === s) },
    ])
  )

  return NextResponse.json(config)
}

export async function PUT(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { service, value } = body

  if (!ALLOWED_SERVICES.includes(service as Service)) {
    return NextResponse.json({ error: "Serviço inválido" }, { status: 400 })
  }
  if (!value?.trim()) {
    return NextResponse.json({ error: "Valor não pode ser vazio" }, { status: 400 })
  }

  try {
    await prisma.userCredential.upsert({
      where: { userId_service: { userId: session.user.id, service } },
      create: { userId: session.user.id, service, value: value.trim() },
      update: { value: value.trim() },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: "Serviço temporariamente indisponível" },
      { status: 503 }
    )
  }
}
