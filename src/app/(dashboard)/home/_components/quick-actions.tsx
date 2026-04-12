import Link from "next/link"
import { FileCheck, TrendingUp, ClipboardList, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

const ACTIONS = [
  { label: "Validar ementa", href: "/validacao-ementa", icon: FileCheck },
  { label: "Pesquisar mercado", href: "/pesquisa-mercado", icon: TrendingUp },
  { label: "Seletor de atividades", href: "/seletor-de-atividades", icon: ClipboardList },
  { label: "Biblioteca de prompts", href: "/biblioteca-de-prompts", icon: BookOpen },
]

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {ACTIONS.map(({ label, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(buttonVariants({ variant: "outline" }), "h-auto py-4 flex flex-col gap-2")}
        >
          <Icon className="w-5 h-5" />
          <span className="text-sm font-medium leading-tight text-center">{label}</span>
        </Link>
      ))}
    </div>
  )
}
