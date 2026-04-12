"use client"

import Link from "next/link"
import { ExternalLink } from "lucide-react"
import type { ClickUpTask } from "@/lib/clickup"

interface Props {
  tasks: ClickUpTask[]
  loading: boolean
}

export function CursosSection({ tasks, loading }: Props) {
  return (
    <div>
      <h2 className="text-base font-semibold mb-3">Seus cursos</h2>
      <TaskList tasks={tasks} loading={loading} emptyMessage="Nenhum curso ativo no momento." />
    </div>
  )
}

interface ContratosProps {
  tasks: ClickUpTask[]
  loading: boolean
}

export function ContratosSection({ tasks, loading }: ContratosProps) {
  return (
    <div>
      <h2 className="text-base font-semibold mb-3">Contratos</h2>
      <TaskList tasks={tasks} loading={loading} emptyMessage="Nenhum contrato em aberto." />
      {!loading && (
        <div className="mt-3">
          <Link
            href="/contratos"
            className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Ver módulo de contratos →
          </Link>
        </div>
      )}
    </div>
  )
}

function TaskList({
  tasks,
  loading,
  emptyMessage,
}: {
  tasks: ClickUpTask[]
  loading: boolean
  emptyMessage: string
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-12 rounded-md bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  if (tasks.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">{emptyMessage}</p>
  }

  return (
    <ul className="space-y-2">
      {tasks.map((task) => (
        <li key={task.id} className="flex items-start justify-between gap-3 rounded-md border px-3 py-2.5">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="text-sm font-medium truncate">{task.name}</span>
            <div className="flex items-center gap-2">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: task.status.color + "33",
                  color: task.status.color,
                }}
              >
                {task.status.status}
              </span>
              {task.due_date && (
                <span className="text-xs text-muted-foreground">
                  {new Date(Number(task.due_date)).toLocaleDateString("pt-BR")}
                </span>
              )}
            </div>
          </div>
          <a
            href={task.url}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </li>
      ))}
    </ul>
  )
}
