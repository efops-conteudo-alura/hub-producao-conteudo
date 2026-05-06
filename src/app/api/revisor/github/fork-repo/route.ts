import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { decrypt } from "@/lib/crypto"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.owner || !body?.repo) {
    return NextResponse.json({ error: "owner e repo são obrigatórios." }, { status: 400 })
  }

  const entry = await prisma.systemConfig
    .findUnique({ where: { key: "revisor_github_token" }, select: { value: true } })
    .catch(() => null)

  const pat = entry ? decrypt(entry.value) : ""
  if (!pat) {
    return NextResponse.json({ error: "GitHub token não configurado." }, { status: 503 })
  }

  const { owner, repo } = body
  const headers = {
    Authorization: `Bearer ${pat}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  }

  // Check if fork already exists under alura-cursos
  const checkResp = await fetch(
    `https://api.github.com/repos/alura-cursos/${encodeURIComponent(repo)}`,
    { headers }
  )
  if (checkResp.status === 200) {
    const data = await checkResp.json()
    if (data.fork && data.parent?.full_name === `${owner}/${repo}`) {
      return NextResponse.json({ ok: true, forkUrl: data.html_url })
    }
  }

  const forkResp = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/forks`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ organization: "alura-cursos" }),
    }
  )

  if (forkResp.status === 202) {
    const data = await forkResp.json()
    return NextResponse.json({ ok: true, forkUrl: data.html_url })
  }

  const errData = await forkResp.json().catch(() => ({}))
  return NextResponse.json(
    { ok: false, error: errData.message || `HTTP ${forkResp.status}` },
    { status: 502 }
  )
}
