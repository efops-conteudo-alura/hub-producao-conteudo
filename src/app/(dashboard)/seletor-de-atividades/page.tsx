import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function SeletorRootPage() {
  const session = await auth();
  const selectorRole = session?.user?.selectorRole;
  const role = session?.user?.role;

  // Instrutor vai para tarefas
  if (selectorRole === "INSTRUCTOR" && !role) {
    redirect("/seletor-de-atividades/tarefas");
  }

  // Coordenador/Admin vai para submissões
  redirect("/seletor-de-atividades/submissoes");
}
