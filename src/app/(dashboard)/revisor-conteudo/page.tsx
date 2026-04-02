import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { RevisorTabs } from "./_components/revisor-tabs"
import { InstallGuideDialog } from "./_components/install-guide-dialog"

export default async function RevisorConteudoPage() {
  const session = await auth()
  if (!session) redirect("/login")

  const isAdmin = session.user.role === "ADMIN"

  return (
    <div className="px-10 pt-10 pb-10">
      <div className="mb-8">
        <h1 className="hub-page-title mb-4">Revisor de Conteúdo</h1>
        <div className="flex items-center gap-6">
          <p className="text-muted-foreground">
            Ferramentas para usar junto com a extensão Revisor de Conteúdo.
          </p>
          <InstallGuideDialog />
        </div>
      </div>
      <RevisorTabs isAdmin={isAdmin} />
    </div>
  )
}
