export const CLICKUP_LISTS_CURSOS = ["901311315105", "901319822968"]
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
  date_updated: string
  orderindex: string
  status: { status: string; color: string; type: string; orderindex: number }
  assignees: ClickUpAssignee[]
  instructor?: string
}

const INSTRUTOR_FIELD_ID = "4d18c8fb-3a23-4107-806e-0c9518cd2263"

export type ClickUpComment = {
  id: string
  comment_text: string
  user: { username: string; email: string }
  date: string
}

export type ClickUpStatus = {
  status: string
  color: string
  type: string
  orderindex: number
}

export async function fetchClickUpList(
  listId: string,
  options?: { includeInstructor?: boolean }
): Promise<ClickUpTask[]> {
  const apiKey = process.env.CLICKUP_API_KEY
  if (!apiKey) return []

  const allTasks: ClickUpTask[] = []
  let page = 0
  const MAX_PAGES = 10 // segurança: máx 1000 tasks
  try {
    while (page < MAX_PAGES) {
      const res = await fetch(
        `https://api.clickup.com/api/v2/list/${listId}/task?page=${page}&limit=100`,
        { headers: { Authorization: apiKey }, cache: "no-store" }
      )
      if (!res.ok) break
      const data = await res.json()
      const rawTasks = (data.tasks ?? []) as Array<ClickUpTask & {
        custom_fields?: Array<{ id: string; value: unknown }>
      }>

      for (const raw of rawTasks) {
        const task: ClickUpTask = { ...raw }
        if (raw.custom_fields) {
          const field = raw.custom_fields.find((f) => f.id === INSTRUTOR_FIELD_ID)
          if (field?.value && typeof field.value === "string") {
            task.instructor = field.value
          }
        }
        allTasks.push(task)
      }

      if (data.last_page) break
      page++
    }
  } catch {
    // retorna o que já foi buscado
  }

  // Usa o orderindex do próprio status (ordem configurada no ClickUp).
  // Dentro do mesmo status, ordena pelo orderindex da tarefa.
  return allTasks.sort((a, b) => {
    const sDiff = a.status.orderindex - b.status.orderindex
    if (sDiff !== 0) return sDiff
    return parseFloat(a.orderindex) - parseFloat(b.orderindex)
  })
}

export function filterByAssignees(tasks: ClickUpTask[], emails: string[]): ClickUpTask[] {
  if (emails.length === 0) return []
  const normalized = emails.map((e) => e.toLowerCase())
  return tasks.filter((t) =>
    t.assignees.some((a) => normalized.includes(a.email.toLowerCase()))
  )
}

// Exclui tipos "done" e "closed" — independente do nome do status em cada lista
export function filterCursos(tasks: ClickUpTask[]): ClickUpTask[] {
  return tasks.filter((t) => t.status.type !== "done" && t.status.type !== "closed")
}

export function filterContratos(tasks: ClickUpTask[]): ClickUpTask[] {
  return tasks.filter((t) => t.status.type !== "done" && t.status.type !== "closed")
}

export async function fetchListStatuses(listId: string): Promise<ClickUpStatus[]> {
  const apiKey = process.env.CLICKUP_API_KEY
  if (!apiKey) return []
  try {
    const res = await fetch(`https://api.clickup.com/api/v2/list/${listId}`, {
      headers: { Authorization: apiKey },
      next: { revalidate: 3600 }, // statuses mudam raramente
    })
    if (!res.ok) return []
    const data = await res.json()
    const statuses = (data.statuses ?? []) as ClickUpStatus[]
    return statuses.sort((a, b) => a.orderindex - b.orderindex)
  } catch {
    return []
  }
}

export async function fetchTaskComments(taskId: string): Promise<ClickUpComment[]> {
  const apiKey = process.env.CLICKUP_API_KEY
  if (!apiKey) return []
  try {
    const res = await fetch(`https://api.clickup.com/api/v2/task/${taskId}/comment`, {
      headers: { Authorization: apiKey },
      cache: "no-store",
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.comments ?? []) as ClickUpComment[]
  } catch {
    return []
  }
}
