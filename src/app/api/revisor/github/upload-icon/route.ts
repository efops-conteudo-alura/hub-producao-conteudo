import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { decrypt } from "@/lib/crypto"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.courseSlug || !body?.svgBase64) {
    return NextResponse.json({ error: "courseSlug e svgBase64 são obrigatórios." }, { status: 400 })
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
    method: "PUT",
    headers: {
      Authorization: `Bearer ${pat}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: `Add icon for ${body.courseSlug}`,
      content: body.svgBase64,
      branch: "master",
    }),
  })

  return NextResponse.json({ ok: resp.status === 201 })
}
