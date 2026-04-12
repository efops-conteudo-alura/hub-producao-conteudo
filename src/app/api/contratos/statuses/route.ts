import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { fetchListStatuses, CLICKUP_LIST_CONTRATOS } from "@/lib/clickup"

export async function GET() {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const statuses = await fetchListStatuses(CLICKUP_LIST_CONTRATOS)
  return NextResponse.json(statuses)
}
