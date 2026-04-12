import { auth } from "@/lib/auth"
import { ContratosDashboard } from "./_components/contratos-dashboard"

export default async function ContratosPage() {
  const session = await auth()
  return (
    <ContratosDashboard
      userId={session?.user?.id ?? ""}
      userEmail={session?.user?.email ?? ""}
      isAdmin={session?.user?.role === "ADMIN"}
    />
  )
}
