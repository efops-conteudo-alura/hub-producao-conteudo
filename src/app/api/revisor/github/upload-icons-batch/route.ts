import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.courseSlugList || !body?.svgBase64) {
    return NextResponse.json({ error: "courseSlugList e svgBase64 são obrigatórios." }, { status: 400 })
  }

  const pat = process.env.GITHUB_TOKEN ?? ""
  if (!pat) {
    return NextResponse.json({ error: "GitHub token não configurado." }, { status: 503 })
  }

  const { courseSlugList, svgBase64 } = body
  const repo = "caelum/gnarus-api-assets"
  const branch = "master"
  const basePath = "alura/assets/api/cursos"

  const headers = {
    Authorization: `Bearer ${pat}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
  }

  const refResp = await fetch(`https://api.github.com/repos/${repo}/git/refs/heads/${branch}`, { headers })
  if (!refResp.ok) {
    return NextResponse.json({ ok: false, error: `GitHub ref HTTP ${refResp.status}` }, { status: 502 })
  }
  const refData = await refResp.json()
  const latestCommitSha: string = refData.object.sha

  const commitResp = await fetch(`https://api.github.com/repos/${repo}/git/commits/${latestCommitSha}`, { headers })
  const commitData = await commitResp.json()
  const baseTreeSha: string = commitData.tree.sha

  const blobResp = await fetch(`https://api.github.com/repos/${repo}/git/blobs`, {
    method: "POST",
    headers,
    body: JSON.stringify({ content: svgBase64, encoding: "base64" }),
  })
  const blobData = await blobResp.json()
  const blobSha: string = blobData.sha

  const treeEntries = (courseSlugList as string[]).map((slug) => ({
    path: `${basePath}/${slug}.svg`,
    mode: "100644",
    type: "blob",
    sha: blobSha,
  }))

  const newTreeResp = await fetch(`https://api.github.com/repos/${repo}/git/trees`, {
    method: "POST",
    headers,
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeEntries }),
  })
  const newTreeData = await newTreeResp.json()

  const slugsSummary =
    (courseSlugList as string[]).slice(0, 3).join(", ") +
    (courseSlugList.length > 3 ? "…" : "")
  const newCommitResp = await fetch(`https://api.github.com/repos/${repo}/git/commits`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      message: `Add icons for Caixaverso courses: ${slugsSummary}`,
      tree: newTreeData.sha,
      parents: [latestCommitSha],
    }),
  })
  const newCommitData = await newCommitResp.json()

  const updateRefResp = await fetch(
    `https://api.github.com/repos/${repo}/git/refs/heads/${branch}`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ sha: newCommitData.sha }),
    }
  )

  return NextResponse.json({ ok: updateRefResp.status === 200 })
}
