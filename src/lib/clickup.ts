export const CLICKUP_LIST_CURSOS = "901311315105"
export const CLICKUP_LIST_CONTRATOS = "901306782159"

export type ClickUpAssignee = {
  id: number
  username: string
  email: string
}

export type ClickUpTask = {
  id: string
  name: string
  url: string
  due_date: string | null
  status: { status: string; color: string }
  assignees: ClickUpAssignee[]
}

export async function fetchClickUpList(listId: string): Promise<ClickUpTask[]> {
  const apiKey = process.env.CLICKUP_API_KEY
  if (!apiKey) return []

  try {
    const res = await fetch(
      `https://api.clickup.com/api/v2/list/${listId}/task?page=0&limit=100`,
      {
        headers: { Authorization: apiKey },
        next: { revalidate: 300 },
      }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.tasks ?? []) as ClickUpTask[]
  } catch {
    return []
  }
}

export function filterByAssignees(tasks: ClickUpTask[], emails: string[]): ClickUpTask[] {
  if (emails.length === 0) return []
  const normalized = emails.map((e) => e.toLowerCase())
  return tasks.filter((t) =>
    t.assignees.some((a) => normalized.includes(a.email.toLowerCase()))
  )
}

export function filterCursos(tasks: ClickUpTask[]): ClickUpTask[] {
  return tasks.filter((t) => t.status.status.toLowerCase() === "ativo")
}

export function filterContratos(tasks: ClickUpTask[]): ClickUpTask[] {
  const closed = ["feito", "fechado", "closed"]
  return tasks.filter((t) => !closed.includes(t.status.status.toLowerCase()))
}
