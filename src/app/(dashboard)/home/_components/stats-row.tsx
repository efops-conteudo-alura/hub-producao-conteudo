"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { BookOpen, FileText, ListChecks, ChevronRight } from "lucide-react"
import type { ClickUpTask } from "@/lib/clickup"

interface Props {
  cursosTasks: ClickUpTask[]
  contratosTasks: ClickUpTask[]
  submissoesPendentes: number
  submissoesRevisadas: number
  loading: boolean
}

export function StatsRow({ cursosTasks, contratosTasks, submissoesPendentes, submissoesRevisadas, loading }: Props) {
  return (
    <div className="grid grid-cols-3 gap-4">
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

      <Link href="/seletor-de-atividades/submissoes">
        <Card className="transition-colors hover:bg-muted/50 cursor-pointer">
          <CardContent className="pt-5 pb-4 flex items-center gap-4">
            <div className="p-2 rounded-md bg-muted shrink-0">
              <ListChecks className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="flex-1 flex gap-4">
              <div>
                {loading ? (
                  <div className="h-7 w-10 rounded bg-muted animate-pulse mb-1" />
                ) : (
                  <p className="text-2xl font-bold">{submissoesRevisadas}</p>
                )}
                <p className="text-xs text-muted-foreground">Revisadas</p>
              </div>
              <div className="w-px bg-border self-stretch" />
              <div>
                {loading ? (
                  <div className="h-7 w-10 rounded bg-muted animate-pulse mb-1" />
                ) : (
                  <p className="text-2xl font-bold">{submissoesPendentes}</p>
                )}
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
