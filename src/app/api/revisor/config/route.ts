import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { encrypt, decrypt } from "@/lib/crypto"

const SERVICES = ["github", "video_uploader", "claude_api_key"] as const
type Service = (typeof SERVICES)[number]

const SERVICE_KEY: Record<Service, string> = {
  github: "revisor_github_token",
  video_uploader: "revisor_video_uploader_token",
  claude_api_key: "revisor_claude_api_key",
}

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const keys = Object.values(SERVICE_KEY)
  const entries = await prisma.systemConfig
    .findMany({ where: { key: { in: keys } }, select: { key: true, updatedAt: true } })
    .catch(() => [])

  const configured = new Set(entries.map((e) => e.key))
  const config = Object.fromEntries(
    SERVICES.map((s) => [s, { configured: configured.has(SERVICE_KEY[s]) }])
  )

  return NextResponse.json(config)
}

export async function PUT(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: "Body inválido." }, { status: 400 })

  const { service, value } = body

  if (!SERVICES.includes(service as Service)) {
    return NextResponse.json({ error: "Serviço inválido." }, { status: 400 })
  }
  if (!value?.trim()) {
    return NextResponse.json({ error: "Valor não pode ser vazio." }, { status: 400 })
  }

  const key = SERVICE_KEY[service as Service]

  try {
    const encrypted = encrypt(value.trim())
    await prisma.systemConfig.upsert({
      where: { key },
      create: { key, value: encrypted, updatedBy: session.user.email ?? session.user.id },
      update: { value: encrypted, updatedBy: session.user.email ?? session.user.id },
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: "Serviço temporariamente indisponível." }, { status: 503 })
  }
}

/** Usado pela extensão Chrome — retorna valores descriptografados para usuários autenticados */
export async function POST() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const keys = Object.values(SERVICE_KEY)
  const entries = await prisma.systemConfig
    .findMany({ where: { key: { in: keys } }, select: { key: true, value: true } })
    .catch(() => [])

  const result: Record<string, string> = {}
  for (const entry of entries) {
    const service = (Object.entries(SERVICE_KEY).find(([, k]) => k === entry.key)?.[0]) as Service | undefined
    if (service) result[service] = decrypt(entry.value)
  }

  return NextResponse.json(result)
}
