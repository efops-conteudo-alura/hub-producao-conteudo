import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/db"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const role = session.user.role
  const userId = session.user.id

  try {
    let coordinatorIds: string[] | null = null

    if (role === "ADMIN") {
      const all = req.nextUrl.searchParams.get("all") === "true"
      if (!all) {
        const emails = (req.nextUrl.searchParams.get("emails") ?? "")
          .split(",")
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean)
        if (emails.length > 0) {
          const users = await prisma.user.findMany({
            where: { email: { in: emails } },
            select: { id: true },
          })
          coordinatorIds = users.map((u) => u.id)
        }
      }
    } else {
      coordinatorIds = [userId]
    }

    const baseWhere = coordinatorIds ? { coordinatorId: { in: coordinatorIds } } : {}

    const [pendentes, revisadas] = await Promise.all([
      prisma.submission.count({ where: { ...baseWhere, status: "pending" } }),
      prisma.submission.count({ where: { ...baseWhere, status: "reviewed" } }),
    ])
    return NextResponse.json({ pendentes, revisadas })
  } catch {
    return NextResponse.json({ pendentes: 0, revisadas: 0 })
  }
}
