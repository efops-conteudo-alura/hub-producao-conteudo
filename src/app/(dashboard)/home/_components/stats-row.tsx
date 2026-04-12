"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, FileText, ChevronRight } from "lucide-react"
import type { ClickUpTask } from "@/lib/clickup"

interface Props {
  cursosTasks: ClickUpTask[]
  contratosTasks: ClickUpTask[]
  loading: boolean
}

export function StatsRow({ cursosTasks, contratosTasks, loading }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <CardContent className="pt-5 pb-4 flex items-center gap-4">
          <div className="p-2 rounded-md bg-muted">
            <BookOpen className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            {loading ? (
              <div className="h-7 w-10 rounded bg-muted animate-pulse mb-1" />
            ) : (
              <p className="text-2xl font-bold">{cursosTasks.length}</p>
            )}
            <p className="text-sm text-muted-foreground">Cursos</p>
          </div>
        </CardContent>
      </Card>

      <Link href="/contratos">
        <Card className="transition-colors hover:bg-muted/50 cursor-pointer">
          <CardContent className="pt-5 pb-4 flex items-center gap-4">
            <div className="p-2 rounded-md bg-muted">
              <FileText className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1">
              {loading ? (
                <div className="h-7 w-10 rounded bg-muted animate-pulse mb-1" />
              ) : (
                <p className="text-2xl font-bold">{contratosTasks.length}</p>
              )}
              <p className="text-sm text-muted-foreground">Contratos</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
