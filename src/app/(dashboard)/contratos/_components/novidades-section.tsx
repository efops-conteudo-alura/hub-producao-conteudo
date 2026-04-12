"use client"

import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ClickUpTask, ClickUpComment } from "@/lib/clickup"

interface Props {
  tasks: ClickUpTask[]
  comments: Record<string, ClickUpComment[]>
  onDismiss: () => void
}

function formatRelativeDate(dateMs: string): string {
  const diff = Date.now() - parseInt(dateMs, 10)
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 60) return `há ${minutes}m`
  if (hours < 24) return `há ${hours}h`
  return `há ${days}d`
}

export function NovidadesSection({ tasks, comments, onDismiss }: Props) {
  if (tasks.length === 0) return null

  const totalCount = tasks.length + Object.values(comments).flat().length

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold">Novidades</h2>
          <span className="text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5 font-medium">
            {totalCount}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={onDismiss} className="text-xs h-7">
          Já vi tudo
        </Button>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => {
          const taskComments = comments[task.id] ?? []
          return (
            <div key={task.id} className="rounded-lg border bg-card px-4 py-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-sm font-medium truncate">{task.name}</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium self-start"
                    style={{
                      backgroundColor: task.status.color + "33",
                      color: task.status.color,
                    }}
                  >
                    {task.status.status}
                  </span>
                </div>
                <a
                  href={task.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors mt-0.5"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              {taskComments.length > 0 && (
                <div className="space-y-2 mt-3 border-t pt-3">
                  {taskComments.map((comment) => (
                    <div key={comment.id} className="flex gap-2">
                      <div className="shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
                        {(comment.user.username || comment.user.email || "?")[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xs font-medium">
                            {comment.user.username || comment.user.email}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {formatRelativeDate(comment.date)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-3">
                          {comment.comment_text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
