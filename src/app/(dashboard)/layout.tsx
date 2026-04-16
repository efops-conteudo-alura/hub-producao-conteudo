import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/db"
import { Sidebar } from "@/components/sidebar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session) redirect("/login")

  // Busca dados frescos do DB para refletir atualizações de perfil (imagem não vai pro JWT)
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, image: true, password: true },
  })

  const user = {
    name: dbUser?.name ?? session.user.name,
    email: session.user.email,
    image: dbUser?.image ?? null,
  }

  const hasPassword = !!dbUser?.password

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={user} hasPassword={hasPassword} />
      <main id="main-scroll" className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
