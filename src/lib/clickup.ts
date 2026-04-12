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
  orderindex: string
  status: { status: string; color: string; type: string; orderindex: number }
  assignees: ClickUpAssignee[]
}

export async function fetchClickUpList(listId: string): Promise<ClickUpTask[]> {
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
      const tasks = (data.tasks ?? []) as ClickUpTask[]
      allTasks.push(...tasks)
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
