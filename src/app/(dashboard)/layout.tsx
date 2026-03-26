import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { Sidebar } from "@/components/sidebar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  // Instrutores só têm acesso ao módulo seletor de atividades
  if (session?.user?.selectorRole === "INSTRUCTOR" && !session?.user?.role) {
    redirect("/seletor-de-atividades/tarefas")
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
