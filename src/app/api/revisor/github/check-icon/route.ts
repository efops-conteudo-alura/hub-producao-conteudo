import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { decrypt } from "@/lib/crypto"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.courseSlug) {
    return NextResponse.json({ error: "courseSlug é obrigatório." }, { status: 400 })
  }

  const entry = await prisma.systemConfig
    .findUnique({ where: { key: "revisor_github_token" }, select: { value: true } })
    .catch(() => null)

  const pat = entry ? decrypt(entry.value) : ""
  if (!pat) {
    return NextResponse.json({ error: "GitHub token não configurado." }, { status: 503 })
  }

  const url = `https://api.github.com/repos/caelum/gnarus-api-assets/contents/alura/assets/api/cursos/${encodeURIComponent(body.courseSlug)}.svg`

  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${pat}`,
      Accept: "application/vnd.github+json",
    },
  })

  return NextResponse.json({
    exists: resp.status === 200,
    notFound: resp.status === 404,
    noAuth: resp.status === 401,
  })
}
