"use client"

import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, FileText } from "lucide-react"
import type { ClickUpTask } from "@/lib/clickup"

interface Props {
  cursosTasks: ClickUpTask[]
  contratosTasks: ClickUpTask[]
  loading: boolean
}

export function StatsRow({ cursosTasks, contratosTasks, loading }: Props) {
  const stats = [
    {
      label: "Cursos ativos",
      value: cursosTasks.length,
      icon: BookOpen,
    },
    {
      label: "Contratos abertos",
      value: contratosTasks.length,
      icon: FileText,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4">
      {stats.map(({ label, value, icon: Icon }) => (
        <Card key={label}>
          <CardContent className="pt-5 pb-4 flex items-center gap-4">
            <div className="p-2 rounded-md bg-muted">
              <Icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              {loading ? (
                <div className="h-7 w-10 rounded bg-muted animate-pulse mb-1" />
              ) : (
                <p className="text-2xl font-bold">{value}</p>
              )}
              <p className="text-sm text-muted-foreground">{label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
