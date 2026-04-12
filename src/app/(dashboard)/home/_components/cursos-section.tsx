"use client"

import { ExternalLink, AlertCircle, Clock } from "lucide-react"
import type { ClickUpTask } from "@/lib/clickup"

interface Props {
  tasks: ClickUpTask[]
  loading: boolean
}

function DueDate({ dueDateMs }: { dueDateMs: string }) {
  const due = Number(dueDateMs)
  const now = Date.now()
  const sevenDays = 7 * 24 * 60 * 60 * 1000
  const isOverdue = due < now
  const isSoon = !isOverdue && due - now <= sevenDays
  const label = new Date(due).toLocaleDateString("pt-BR")

  if (isOverdue) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
        <AlertCircle className="w-3 h-3" />
        {label}
      </span>
    )
  }
  if (isSoon) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-500">
        <Clock className="w-3 h-3" />
        {label}
      </span>
    )
  }
  return <span className="text-xs text-muted-foreground">{label}</span>
}

function GroupedTaskList({ tasks, emptyMessage, showDate = false }: { tasks: ClickUpTask[]; emptyMessage: string; showDate?: boolean }) {
  if (tasks.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">{emptyMessage}</p>
  }

  const groups = new Map<string, ClickUpTask[]>()
  for (const task of tasks) {
    const key = task.status.status
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(task)
  }

  return (
    <div className="space-y-4">
      {Array.from(groups.entries()).map(([statusName, groupTasks]) => {
        const color = groupTasks[0].status.color
        return (
          <div key={statusName}>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-semibold"
                style={{ backgroundColor: color + "33", color }}
              >
                {statusName}
              </span>
              <span className="text-xs text-muted-foreground">{groupTasks.length}</span>
            </div>
            <ul className="space-y-1.5">
              {groupTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium truncate">{task.name}</span>
                    {showDate && task.due_date && <DueDate dueDateMs={task.due_date} />}
                  </div>
                  <a
                    href={task.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}

export function CursosSection({ tasks, loading }: Props) {
  if (loading) {
    return (
      <div>
        <h2 className="text-base font-semibold mb-3">Seus cursos</h2>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 rounded-md bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-base font-semibold mb-3">Seus cursos</h2>
      <GroupedTaskList tasks={tasks} emptyMessage="Nenhum curso ativo no momento." />
    </div>
  )
}

interface ContratosProps {
  tasks: ClickUpTask[]
  loading: boolean
}

export function ContratosSection({ tasks, loading }: ContratosProps) {
  if (loading) {
    return (
      <div>
        <h2 className="text-base font-semibold mb-3">Contratos</h2>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 rounded-md bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-base font-semibold mb-3">Contratos</h2>
      <GroupedTaskList tasks={tasks} emptyMessage="Nenhum contrato em aberto." showDate />
    </div>
  )
}
