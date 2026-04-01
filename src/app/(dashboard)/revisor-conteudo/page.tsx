import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { AuditoriasSection } from "./_components/auditorias-list"
import { CredenciaisSection } from "./_components/credenciais-form"

export default async function RevisorConteudoPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <div className="px-10 pt-10 pb-10">
      <div className="mb-8">
        <h1 className="hub-page-title mb-4">Revisor de Conteúdo</h1>
        <p className="text-muted-foreground">
          Histórico de auditorias da extensão Chrome e configuração de credenciais.
        </p>
      </div>
      <div className="space-y-12 max-w-3xl">
        <AuditoriasSection />
        <div className="dot-pattern h-12 rounded-xl opacity-60" />
        <CredenciaisSection />
      </div>
    </div>
  )
}
