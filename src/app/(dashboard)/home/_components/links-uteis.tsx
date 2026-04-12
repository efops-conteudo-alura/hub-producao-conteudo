"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

type UsefulLink = {
  id: string
  title: string
  url: string
  description?: string | null
  order: number
}

interface Props {
  isAdmin: boolean
}

export function LinksUteis({ isAdmin }: Props) {
  const [links, setLinks] = useState<UsefulLink[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<UsefulLink | null>(null)
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [description, setDescription] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/home/links")
      .then((r) => r.json())
      .then((data) => setLinks(Array.isArray(data) ? data : []))
      .catch(() => setLinks([]))
      .finally(() => setLoading(false))
  }, [])

  function openAdd() {
    setEditing(null)
    setTitle("")
    setUrl("")
    setDescription("")
    setError(null)
    setDialogOpen(true)
  }

  function openEdit(link: UsefulLink) {
    setEditing(link)
    setTitle(link.title)
    setUrl(link.url)
    setDescription(link.description ?? "")
    setError(null)
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!title.trim() || !url.trim()) {
      setError("Título e URL são obrigatórios.")
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (editing) {
        const res = await fetch(`/api/home/links/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, url, description }),
        })
        if (!res.ok) { setError("Erro ao salvar."); return }
        const updated: UsefulLink = await res.json()
        setLinks((prev) => prev.map((l) => (l.id === updated.id ? updated : l)))
      } else {
        const res = await fetch("/api/home/links", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, url, description }),
        })
        if (!res.ok) { setError("Erro ao salvar."); return }
        const novo: UsefulLink = await res.json()
        setLinks((prev) => [...prev, novo])
      }
      setDialogOpen(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este link?")) return
    await fetch(`/api/home/links/${id}`, { method: "DELETE" })
    setLinks((prev) => prev.filter((l) => l.id !== id))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base font-semibold">Links úteis</h2>
        {isAdmin && (
          <Button variant="outline" size="sm" onClick={openAdd}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-md bg-muted animate-pulse" />
          ))}
        </div>
      ) : links.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum link cadastrado.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {links.map((link) => (
            <div key={link.id} className="flex items-center gap-2 rounded-md border px-3 py-2.5 bg-card">
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 flex-1 min-w-0 hover:opacity-80 transition-opacity group"
              >
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{link.title}</p>
                  {link.description && (
                    <p className="text-xs text-muted-foreground truncate">{link.description}</p>
                  )}
                </div>
              </a>
              {isAdmin && (
                <div className="flex gap-0.5 shrink-0">
                  <button
                    onClick={() => openEdit(link)}
                    className="p-1 rounded hover:bg-muted transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-3 h-3 text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleDelete(link.id)}
                    className="p-1 rounded hover:bg-muted transition-colors"
                    title="Remover"
                  >
                    <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar link" : "Novo link"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Título</p>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: ClickUp" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">URL</p>
              <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Descrição (opcional)</p>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Para que serve este link?" />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
