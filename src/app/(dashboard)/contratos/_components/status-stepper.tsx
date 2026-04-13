"use client"

import type { ClickUpStatus } from "@/lib/clickup"

interface Props {
  statuses: ClickUpStatus[]
  current: string
}

export function StatusStepper({ statuses, current }: Props) {
  // Exclui status do tipo "closed" do stepper visível
  const visible = statuses.filter((s) => s.type !== "closed")
  if (visible.length === 0) return null

  const currentIndex = visible.findIndex(
    (s) => s.status.toLowerCase() === current.toLowerCase()
  )

  return (
    <div className="flex items-center gap-0 w-full">
      {visible.map((s, i) => {
        const isDone = i < currentIndex
        const isActive = i === currentIndex
        const isLast = i === visible.length - 1

        return (
          <div key={s.status} className="flex items-center flex-1 min-w-0">
            {/* Bolinha + label */}
            <div className="shrink-0 flex flex-col items-center gap-1">
              <div
                className="w-3 h-3 rounded-full border-2 transition-colors"
                style={
                  isActive
                    ? { borderColor: s.color, backgroundColor: s.color }
                    : isDone
                    ? { borderColor: s.color, backgroundColor: s.color + "80" }
                    : { borderColor: "var(--muted-foreground)", opacity: 0.3 }
                }
              />
              <span
                className={`text-[9px] leading-tight text-center max-w-[52px] ${
                  isActive ? "font-semibold" : "text-muted-foreground/60"
                }`}
                style={isActive ? { color: s.color } : {}}
              >
                {s.status}
              </span>
            </div>

            {/* Linha conectora */}
            {!isLast && (
              <div
                className="h-0.5 flex-1 mx-0.5 mb-4"
                style={
                  isDone || isActive
                    ? { backgroundColor: s.color, opacity: 0.4 }
                    : { backgroundColor: "var(--muted-foreground)", opacity: 0.2 }
                }
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
