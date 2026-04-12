import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  fetchClickUpList,
  filterByAssignees,
  filterContratos,
  fetchTaskComments,
  CLICKUP_LIST_CONTRATOS,
  type ClickUpTask,
  type ClickUpComment,
} from "@/lib/clickup"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const emails = (req.nextUrl.searchParams.get("emails") ?? "")
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean)

  const sinceParam = req.nextUrl.searchParams.get("since")
  const since = sinceParam ? parseInt(sinceParam, 10) : Date.now() - 30 * 24 * 60 * 60 * 1000

  if (emails.length === 0) return NextResponse.json({ tasks: [], comments: {} })

  if (session.user.role !== "ADMIN") {
    const userEmail = session.user.email?.toLowerCase() ?? ""
    if (!emails.every((e) => e.toLowerCase() === userEmail)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  const allTasks = await fetchClickUpList(CLICKUP_LIST_CONTRATOS)
  const myTasks = filterContratos(filterByAssignees(allTasks, emails))

  // Filtra apenas tasks com date_updated após o since
  const updatedTasks = myTasks.filter(
    (t) => t.date_updated && parseInt(t.date_updated, 10) > since
  )

  // Busca comentários em paralelo (máx 10)
  const tasksToFetch = updatedTasks.slice(0, 10)
  const commentResults = await Promise.all(
    tasksToFetch.map((t) => fetchTaskComments(t.id))
  )

  // Filtra apenas comentários novos (após since)
  const comments: Record<string, ClickUpComment[]> = {}
  tasksToFetch.forEach((task, i) => {
    const newComments = commentResults[i].filter(
      (c) => parseInt(c.date, 10) > since
    )
    if (newComments.length > 0) {
      comments[task.id] = newComments
    }
  })

  // Retorna tasks que tiveram mudança de status ou novos comentários
  const tasksWithActivity: ClickUpTask[] = updatedTasks.filter(
    (t) => t.id in comments || tasksToFetch.includes(t)
  )

  return NextResponse.json({ tasks: tasksWithActivity, comments })
}
