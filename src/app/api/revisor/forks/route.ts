import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { owner, repo } = body

  if (!owner?.trim() || !repo?.trim()) {
    return NextResponse.json({ error: "Campos owner e repo são obrigatórios" }, { status: 400 })
  }

  const credential = await prisma.userCredential
    .findUnique({
      where: { userId_service: { userId: session.user.id, service: "github" } },
      select: { value: true },
    })
    .catch(() => null)

  if (!credential?.value) {
    return NextResponse.json(
      { error: "GitHub token não configurado. Adicione-o na aba Credenciais." },
      { status: 422 }
    )
  }

  const pat = credential.value
  const headers = {
    Authorization: `Bearer ${pat}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  }

  const ownerClean = owner.trim()
  const repoClean = repo.trim()

  try {
    // Verifica se já existe fork em alura-cursos com o mesmo nome
    const checkRes = await fetch(
      `https://api.github.com/repos/alura-cursos/${encodeURIComponent(repoClean)}`,
      { headers }
    )

    if (checkRes.status === 200) {
      const existing = await checkRes.json()
      if (existing.fork && existing.parent?.full_name === `${ownerClean}/${repoClean}`) {
        return NextResponse.json({ forkUrl: existing.html_url, created: false })
      }
    }

    // Cria o fork
    const forkRes = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(ownerClean)}/${encodeURIComponent(repoClean)}/forks`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ organization: "alura-cursos" }),
      }
    )

    if (forkRes.status === 202) {
      const data = await forkRes.json()
      return NextResponse.json({ forkUrl: data.html_url, created: true })
    }

    const errData = await forkRes.json().catch(() => ({}))
    return NextResponse.json(
      { error: errData.message || `GitHub retornou HTTP ${forkRes.status}` },
      { status: 422 }
    )
  } catch (e) {
    const message = e instanceof Error ? e.message : "Erro desconhecido"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
