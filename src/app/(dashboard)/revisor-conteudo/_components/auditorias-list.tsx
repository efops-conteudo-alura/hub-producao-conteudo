"use client"

import { Clock } from "lucide-react"

interface AuditoriasTabProps {
  isAdmin: boolean
}

export function AuditoriasTab({ isAdmin }: AuditoriasTabProps) {
  return (
    <div className="max-w-2xl">
      {isAdmin && (
        <p className="text-xs text-muted-foreground mb-4 font-mono uppercase">
          Visão de administrador — todas as auditorias
        </p>
      )}
      <div className="flex items-center gap-3 text-muted-foreground py-8">
        <Clock size={18} strokeWidth={1.5} />
        <span className="text-sm">
          As auditorias realizadas pela extensão Chrome aparecerão aqui.
        </span>
      </div>
    </div>
  )
}
