"use client"

import { GitFork, Wand2, Clock } from "lucide-react"

const acoes = [
  {
    icon: GitFork,
    titulo: "Fork de Repositório",
    descricao: "Faz o fork de um repositório de curso para a organização alura-cursos via GitHub API.",
  },
  {
    icon: Wand2,
    titulo: "Renomear Seções com IA",
    descricao: "Usa o Claude para sugerir e aplicar novos nomes às seções de um curso, substituindo a integração com AWS Bedrock.",
  },
]

export function AcoesTab() {
  return (
    <div className="space-y-4 max-w-2xl">
      {acoes.map(({ icon: Icon, titulo, descricao }) => (
        <div
          key={titulo}
          className="flex items-start gap-4 border border-sidebar-border rounded-xl p-5 bg-card"
        >
          <div className="shrink-0 mt-0.5">
            <Icon size={18} strokeWidth={1.5} className="text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium mb-1">{titulo}</p>
            <p className="text-sm text-muted-foreground">{descricao}</p>
          </div>
          <div className="shrink-0 flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
            <Clock size={13} strokeWidth={1.5} />
            <span>Em breve</span>
          </div>
        </div>
      ))}
    </div>
  )
}
