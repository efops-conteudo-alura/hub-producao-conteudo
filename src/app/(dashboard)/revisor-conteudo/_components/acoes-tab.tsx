"use client"

import { useState } from "react"
import { GitFork, Wand2, Clock, ExternalLink, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function ForkForm() {
  const [owner, setOwner] = useState("")
  const [repo, setRepo] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ forkUrl: string; created: boolean } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const res = await fetch("/api/revisor/forks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Erro ao fazer fork")
        return
      }
      setResult(data)
    } catch {
      setError("Falha na conexão")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="fork-owner">Organização de origem</Label>
          <Input
            id="fork-owner"
            placeholder="ex: owner-org"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="fork-repo">Repositório</Label>
          <Input
            id="fork-repo"
            placeholder="ex: nome-do-curso"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            required
          />
        </div>
      </div>
      <Button type="submit" size="sm" disabled={loading || !owner.trim() || !repo.trim()}>
        <GitFork size={14} className="mr-1.5" />
        {loading ? "Fazendo fork..." : "Fazer fork para alura-cursos"}
      </Button>

      {error && (
        <div className="flex items-start gap-2 text-sm text-destructive">
          <AlertCircle size={15} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <GitFork size={14} className="shrink-0" />
          <span>{result.created ? "Fork criado:" : "Fork já existe:"}</span>
          <a
            href={result.forkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-2 flex items-center gap-1 hover:opacity-80"
          >
            {result.forkUrl}
            <ExternalLink size={12} />
          </a>
        </div>
      )}
    </form>
  )
}

export function AcoesTab() {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Fork */}
      <div className="border border-sidebar-border rounded-xl p-5 bg-card space-y-1">
        <div className="flex items-center gap-2">
          <GitFork size={16} strokeWidth={1.5} className="text-muted-foreground" />
          <p className="text-sm font-medium">Fork de Repositório</p>
        </div>
        <p className="text-sm text-muted-foreground">
          Faz o fork de um repositório de curso para a organização <code className="text-foreground">alura-cursos</code>. Se o fork já existir, retorna o link existente.
        </p>
        <ForkForm />
      </div>

      {/* Renomear — em breve */}
      <div className="border border-sidebar-border rounded-xl p-5 bg-card">
        <div className="flex items-start gap-4">
          <Wand2 size={16} strokeWidth={1.5} className="text-muted-foreground mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">Renomear Seções com IA</p>
            <p className="text-sm text-muted-foreground">
              Usa o Claude para sugerir novos nomes às seções de um curso a partir das transcrições das aulas.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 mt-0.5">
            <Clock size={13} strokeWidth={1.5} />
            <span>Em breve</span>
          </div>
        </div>
      </div>
    </div>
  )
}
