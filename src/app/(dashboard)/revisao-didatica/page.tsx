import { Clock } from "lucide-react"

export default function RevisaoDidaticaPage() {
  return (
    <div className="px-10 pt-10 pb-10">
      <div className="mb-8">
        <h1 className="hub-page-title mb-4">Revisão Didática</h1>
        <p className="text-muted-foreground">
          Revisão de plano de aula e outros artefatos de conteúdo.
        </p>
      </div>
      <div className="flex items-center gap-3 text-muted-foreground mt-16">
        <Clock size={20} strokeWidth={1.5} />
        <span className="text-sm">Em breve</span>
      </div>
    </div>
  )
}
