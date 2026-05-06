import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { decrypt } from "@/lib/crypto"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.prompt) {
    return NextResponse.json({ error: "prompt é obrigatório." }, { status: 400 })
  }

  const entry = await prisma.systemConfig
    .findUnique({ where: { key: "revisor_claude_api_key" }, select: { value: true } })
    .catch(() => null)

  const apiKey = entry ? decrypt(entry.value) : ""
  if (!apiKey) {
    return NextResponse.json({ error: "Claude API Key não configurada." }, { status: 503 })
  }

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      temperature: 0.3,
      messages: [{ role: "user", content: body.prompt }],
    }),
  })

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "")
    return NextResponse.json(
      { error: `Claude API HTTP ${resp.status}: ${errText.slice(0, 300)}` },
      { status: 502 }
    )
  }

  const data = await resp.json()
  const outputText = data?.content?.[0]?.text?.trim() ?? ""
  return NextResponse.json({ ok: true, outputText })
}
