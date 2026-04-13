import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  fetchClickUpList,
  filterByAssignees,
  filterContratos,
  CLICKUP_LIST_CONTRATOS,
} from "@/lib/clickup"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const all = req.nextUrl.searchParams.get("all") === "true"

  if (all) {
    if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    const tasks = await fetchClickUpList(CLICKUP_LIST_CONTRATOS, { includeInstructor: true })
    return NextResponse.json(filterContratos(tasks))
  }

  const emails = (req.nextUrl.searchParams.get("emails") ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean)

  if (emails.length === 0) return NextResponse.json([])

  if (session.user.role !== "ADMIN") {
    const userEmail = session.user.email?.toLowerCase() ?? ""
    if (!emails.every((e) => e.toLowerCase() === userEmail)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  const tasks = await fetchClickUpList(CLICKUP_LIST_CONTRATOS, { includeInstructor: true })
  return NextResponse.json(filterContratos(filterByAssignees(tasks, emails)))
}
