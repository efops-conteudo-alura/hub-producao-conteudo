"use client"

import { useEffect, useState } from "react"
import { Separator } from "@/components/ui/separator"
import { QuickActions } from "./quick-actions"
import { StatsRow } from "./stats-row"
import { CoordenadorSelector } from "./coordenador-selector"
import { CursosSection, ContratosSection } from "./cursos-section"
import { LinksUteis } from "./links-uteis"
import type { ClickUpTask } from "@/lib/clickup"

type Coordenador = { id: string; name: string | null; email: string | null }

interface Props {
  userName: string
  userEmail: string
  isAdmin: boolean
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Bom dia"
  if (hour < 18) return "Boa tarde"
  return "Boa noite"
}

function getFormattedDate(): string {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

function countUpcoming(tasks: ClickUpTask[]): number {
  const now = Date.now()
  const sevenDays = now + 7 * 24 * 60 * 60 * 1000
  return tasks.filter((t) => {
    if (!t.due_date) return false
    const due = Number(t.due_date)
    return due > now && due <= sevenDays
  }).length
}

export function HomeDashboard({ userName, userEmail, isAdmin }: Props) {
  const [coordenadores, setCoordenadores] = useState<Coordenador[]>([])
  const [coordLoading, setCoordLoading] = useState(isAdmin)
  const [selectedEmails, setSelectedEmails] = useState<string[]>(
    isAdmin ? [] : [userEmail]
  )

  const [cursosTasks, setCursosTasks] = useState<ClickUpTask[]>([])
  const [contratosTasks, setContratosTasks] = useState<ClickUpTask[]>([])
  const [tasksLoading, setTasksLoading] = useState(false)

  // Busca coordenadores (admin only)
  useEffect(() => {
    if (!isAdmin) return
    setCoordLoading(true)
    fetch("/api/home/coordenadores")
      .then((r) => r.json())
      .then((data: Coordenador[]) => {
        setCoordenadores(data)
        setSelectedEmails(data.map((c) => c.email ?? "").filter(Boolean))
      })
      .catch(() => setCoordenadores([]))
      .finally(() => setCoordLoading(false))
  }, [isAdmin])

  // Busca tasks quando os emails selecionados mudam
  useEffect(() => {
    if (selectedEmails.length === 0) {
      setCursosTasks([])
      setContratosTasks([])
      return
    }

    const emailParam = selectedEmails.join(",")
    setTasksLoading(true)

    Promise.all([
      fetch(`/api/home/cursos?emails=${encodeURIComponent(emailParam)}`).then((r) => r.json()),
      fetch(`/api/home/contratos?emails=${encodeURIComponent(emailParam)}`).then((r) => r.json()),
    ])
      .then(([cursos, contratos]) => {
        setCursosTasks(Array.isArray(cursos) ? cursos : [])
        setContratosTasks(Array.isArray(contratos) ? contratos : [])
      })
      .catch(() => {
        setCursosTasks([])
        setContratosTasks([])
      })
      .finally(() => setTasksLoading(false))
  }, [selectedEmails])

  const upcomingCount = countUpcoming([...cursosTasks, ...contratosTasks])

  return (
    <div className="px-10 pt-10 pb-10 space-y-8">
      {/* Saudação */}
      <div>
        <h1 className="hub-page-title">
          {getGreeting()}, {userName}.
        </h1>
        <p className="text-muted-foreground mt-1">
          {getFormattedDate()}
          {!tasksLoading && upcomingCount > 0 && (
            <span className="ml-2 text-foreground font-medium">
              · {upcomingCount} {upcomingCount === 1 ? "tarefa" : "tarefas"} com prazo nos próximos 7 dias
            </span>
          )}
        </p>
      </div>

      {/* Seletor de coordenadores (admin) */}
      {isAdmin && (
        <CoordenadorSelector
          coordenadores={coordenadores}
          selectedEmails={selectedEmails}
          onSelectionChange={setSelectedEmails}
          loading={coordLoading}
        />
      )}

      {/* Cards de métricas */}
      <StatsRow
        cursosTasks={cursosTasks}
        contratosTasks={contratosTasks}
        loading={tasksLoading}
      />

      {/* Acesso rápido */}
      <div>
        <h2 className="text-base font-semibold mb-3">Acesso rápido</h2>
        <QuickActions />
      </div>

      <Separator />

      {/* Cursos e contratos lado a lado */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <CursosSection tasks={cursosTasks} loading={tasksLoading} />
        <ContratosSection tasks={contratosTasks} loading={tasksLoading} />
      </div>

      <Separator />

      {/* Links úteis */}
      <LinksUteis isAdmin={isAdmin} />
    </div>
  )
}
