"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronDown, Check } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type Coordenador = { id: string; name: string | null; email: string | null }

interface Props {
  coordenadores: Coordenador[]
  selectedEmails: string[]
  onSelectionChange: (emails: string[]) => void
  loading: boolean
}

export function CoordenadorSelector({ coordenadores, selectedEmails, onSelectionChange, loading }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  if (loading) {
    return <div className="h-8 w-56 rounded bg-muted animate-pulse" />
  }

  const allEmails = coordenadores.map((c) => c.email ?? "").filter(Boolean)
  const allSelected = allEmails.length > 0 && allEmails.every((e) => selectedEmails.includes(e))

  function toggle(email: string) {
    if (selectedEmails.includes(email)) {
      onSelectionChange(selectedEmails.filter((e) => e !== email))
    } else {
      onSelectionChange([...selectedEmails, email])
    }
  }

  function getLabel() {
    if (selectedEmails.length === 0) return "Nenhum coordenador"
    if (allSelected) return "Todos os coordenadores"
    if (selectedEmails.length === 1) {
      const coord = coordenadores.find((c) => c.email === selectedEmails[0])
      return coord?.name ?? selectedEmails[0]
    }
    return `${selectedEmails.length} coordenadores`
  }

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm shadow-xs transition-colors hover:bg-muted",
          open && "bg-muted"
        )}
      >
        <span className="text-muted-foreground">Visualizando:</span>
        <span className="font-medium">{getLabel()}</span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-56 rounded-md border bg-popover shadow-md">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => onSelectionChange(allEmails)}
            >
              Todos
            </button>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => onSelectionChange([])}
            >
              Nenhum
            </button>
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {coordenadores.map((c) => {
              const email = c.email ?? ""
              const checked = selectedEmails.includes(email)
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => toggle(email)}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm hover:bg-muted transition-colors"
                  >
                    <Checkbox
                      id={`coord-${c.id}`}
                      checked={checked}
                      onCheckedChange={() => toggle(email)}
                      className="pointer-events-none"
                    />
                    <Label htmlFor={`coord-${c.id}`} className="cursor-pointer font-normal flex-1 text-left">
                      {c.name ?? email}
                    </Label>
                    {checked && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
