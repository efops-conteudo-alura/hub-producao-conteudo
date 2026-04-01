import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { RevisorTabs } from "./_components/revisor-tabs"

export default async function RevisorConteudoPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const isAdmin = session.user.role === "ADMIN"

  return (
    <div className="px-10 pt-10 pb-10">
      <div className="mb-8">
        <h1 className="hub-page-title mb-4">Revisor de Conteúdo</h1>
        <p className="text-muted-foreground">
          Ferramentas de auditoria e gestão da extensão Chrome.
        </p>
      </div>
      <RevisorTabs isAdmin={isAdmin} />
    </div>
  )
}
