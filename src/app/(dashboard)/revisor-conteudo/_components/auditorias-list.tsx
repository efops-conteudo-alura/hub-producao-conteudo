"use client"

import { Clock } from "lucide-react"

export function AuditoriasSection() {
  return (
    <section>
      <h2 className="text-base font-semibold mb-4">Histórico de Auditorias</h2>
      <div className="flex items-center gap-3 text-muted-foreground py-8">
        <Clock size={18} strokeWidth={1.5} />
        <span className="text-sm">
          As auditorias realizadas pela extensão Chrome aparecerão aqui.
        </span>
      </div>
    </section>
  )
}
