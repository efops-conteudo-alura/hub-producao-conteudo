"use client"

import { ExternalLink } from "lucide-react"
import type { ClickUpTask, ClickUpStatus } from "@/lib/clickup"
import { StatusStepper } from "./status-stepper"

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
            <div className="flex items-center gap-2 mb-3">
              <span
                className="text-xs px-2.5 py-1 rounded-full font-semibold"
                style={{
                  backgroundColor: statusMeta.color + "33",
                  color: statusMeta.color,
                }}
              >
                {statusName}
              </span>
              <span className="text-xs text-muted-foreground">{groupTasks.length}</span>
            </div>

            <ul className="space-y-2">
              {groupTasks.map((task) => (
                <li
                  key={task.id}
                  className="rounded-md border bg-card px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="text-sm font-medium leading-snug">{task.name}</span>
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
