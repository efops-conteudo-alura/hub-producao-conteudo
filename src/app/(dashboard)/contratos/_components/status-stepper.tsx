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
            {/* Bolinha */}
            <div className="shrink-0 relative group">
              <div
                className={`w-3 h-3 rounded-full border-2 transition-colors ${
                  isActive
                    ? "border-current bg-current"
                    : isDone
                    ? "border-current bg-current opacity-50"
                    : "border-muted-foreground/30 bg-background"
                }`}
                style={isActive || isDone ? { borderColor: s.color, backgroundColor: isActive ? s.color : s.color + "80" } : {}}
                title={s.status}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 pointer-events-none">
                <div className="bg-popover border rounded px-2 py-1 text-xs whitespace-nowrap shadow-md">
                  {s.status}
                </div>
              </div>
            </div>

            {/* Linha conectora */}
            {!isLast && (
              <div
                className={`h-0.5 flex-1 mx-0.5 ${
                  isDone || isActive ? "opacity-40" : "bg-muted-foreground/20"
                }`}
                style={isDone || isActive ? { backgroundColor: s.color } : {}}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
