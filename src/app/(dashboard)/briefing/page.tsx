import { Clock } from "lucide-react"

export default function BriefingPage() {
  return (
    <div className="px-10 pt-10 pb-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1">Briefing</h1>
        <p className="text-muted-foreground">
          Gera briefing para o marketing a partir da ementa do curso.
        </p>
      </div>
      <div className="flex items-center gap-3 text-muted-foreground mt-16">
        <Clock size={20} strokeWidth={1.5} />
        <span className="text-sm">Em breve</span>
      </div>
    </div>
  )
}
