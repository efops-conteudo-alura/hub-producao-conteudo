"use client"

import { useEffect, useState } from "react"
import { ExternalLink } from "lucide-react"
import type { ClickUpTask, ClickUpStatus, ClickUpComment } from "@/lib/clickup"
import { CoordenadorSelector } from "@/app/(dashboard)/home/_components/coordenador-selector"
import { NovidadesSection } from "./novidades-section"
import { ContratosList } from "./contratos-list"

// URL do formulário do ClickUp para nova demanda
const NOVA_DEMANDA_URL = "https://forms.clickup.com/901306782159"

interface Props {
  userId: string
  userEmail: string
  isAdmin: boolean
}

type Coordenador = { id: string; name: string | null; email: string | null }

export function ContratosDashboard({ userId, userEmail, isAdmin }: Props) {
  const [coordenadores, setCoordenadores] = useState<Coordenador[]>([])
  const [selectedEmails, setSelectedEmails] = useState<string[]>([])
  const [loadingCoords, setLoadingCoords] = useState(isAdmin)

  const [tasks, setTasks] = useState<ClickUpTask[]>([])
  const [statuses, setStatuses] = useState<ClickUpStatus[]>([])
  const [loading, setLoading] = useState(false)

  const [novidades, setNovidades] = useState<ClickUpTask[]>([])
  const [novidadesComments, setNovidadesComments] = useState<Record<string, ClickUpComment[]>>({})
  const [lastSeen, setLastSeen] = useState<number>(() => {
    if (typeof window === "undefined") return Date.now() - 30 * 24 * 60 * 60 * 1000
    const stored = localStorage.getItem(`contratos_seen_${userId}`)
    return stored ? parseInt(stored, 10) : Date.now() - 30 * 24 * 60 * 60 * 1000
  })

  // Busca coordenadores para admin
  useEffect(() => {
    if (!isAdmin) {
      setSelectedEmails([userEmail])
      return
    }
    fetch("/api/seletor/coordenadores")
      .then((r) => r.json())
      .then((data: Coordenador[]) => {
        setCoordenadores(data)
        setSelectedEmails(data.map((c) => c.email ?? "").filter(Boolean))
      })
      .catch(() => {})
      .finally(() => setLoadingCoords(false))
  }, [isAdmin, userEmail])

  // Busca tasks e novidades quando emails mudam
  useEffect(() => {
    if (selectedEmails.length === 0) {
      setTasks([])
      setNovidades([])
      setNovidadesComments({})
      return
    }

    const emailsParam = selectedEmails.join(",")
    setLoading(true)

    Promise.all([
      fetch(`/api/contratos?emails=${encodeURIComponent(emailsParam)}`).then((r) => r.json()),
      fetch("/api/contratos/statuses").then((r) => r.json()),
      fetch(`/api/contratos/novidades?emails=${encodeURIComponent(emailsParam)}&since=${lastSeen}`).then((r) => r.json()),
    ])
      .then(([tasksData, statusesData, novidadesData]) => {
        setTasks(Array.isArray(tasksData) ? tasksData : [])
        setStatuses(Array.isArray(statusesData) ? statusesData : [])
        if (novidadesData && Array.isArray(novidadesData.tasks)) {
          setNovidades(novidadesData.tasks)
          setNovidadesComments(novidadesData.comments ?? {})
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedEmails, lastSeen])

  function handleDismiss() {
    const now = Date.now()
    localStorage.setItem(`contratos_seen_${userId}`, String(now))
    setLastSeen(now)
    setNovidades([])
    setNovidadesComments({})
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold">Contratos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Acompanhe o andamento dos contratos de instrutores
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {isAdmin && (
            <CoordenadorSelector
              coordenadores={coordenadores}
              selectedEmails={selectedEmails}
              onSelectionChange={setSelectedEmails}
              loading={loadingCoords}
            />
          )}
          <a
            href={NOVA_DEMANDA_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-xs transition-colors hover:bg-muted"
          >
            Nova demanda
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Novidades */}
      {novidades.length > 0 && (
        <NovidadesSection
          tasks={novidades}
          comments={novidadesComments}
          onDismiss={handleDismiss}
        />
      )}

      {/* Lista completa */}
      <div>
        <h2 className="text-base font-semibold mb-4">Todos os contratos</h2>
        <ContratosList tasks={tasks} statuses={statuses} loading={loading} />
      </div>
    </div>
  )
}
