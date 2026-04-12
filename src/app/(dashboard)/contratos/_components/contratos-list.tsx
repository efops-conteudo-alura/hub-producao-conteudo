"use client"

import { ExternalLink, AlertCircle, Clock } from "lucide-react"
import type { ClickUpTask, ClickUpStatus } from "@/lib/clickup"
import { StatusStepper } from "./status-stepper"

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

interface Props {
  tasks: ClickUpTask[]
  statuses: ClickUpStatus[]
  loading: boolean
}

export function ContratosList({ tasks, statuses, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (tasks.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">Nenhum contrato em aberto.</p>
  }

  // Agrupa por status mantendo a ordem do ClickUp
  const groups = new Map<string, ClickUpTask[]>()
  for (const task of tasks) {
    const key = task.status.status
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(task)
  }

  return (
    <div className="space-y-6">
      {Array.from(groups.entries()).map(([statusName, groupTasks]) => {
        const statusMeta = groupTasks[0].status
        return (
          <div key={statusName}>
            <ul className="space-y-2">
              {groupTasks.map((task) => (
                <li
                  key={task.id}
                  className="rounded-md border bg-card px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="min-w-0">
                      <span className="text-sm font-medium leading-snug block">{task.name}</span>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {task.instructor && (
                          <span className="text-xs text-muted-foreground">{task.instructor}</span>
                        )}
                        {task.instructor && task.due_date && (
                          <span className="text-xs text-muted-foreground">·</span>
                        )}
                        {task.due_date && <DueDate dueDateMs={task.due_date} />}
                      </div>
                    </div>
                    <a
                      href={task.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  {statuses.length > 0 && (
                    <StatusStepper statuses={statuses} current={task.status.status} />
                  )}
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </div>
  )
}
