import { auth } from "@/lib/auth"
import { HomeDashboard } from "./_components/home-dashboard"

export default async function HomePage() {
  const session = await auth()
  return (
    <HomeDashboard
      userName={session?.user?.name ?? "usuário"}
      userEmail={session?.user?.email ?? ""}
      isAdmin={session?.user?.role === "ADMIN"}
    />
  )
}
