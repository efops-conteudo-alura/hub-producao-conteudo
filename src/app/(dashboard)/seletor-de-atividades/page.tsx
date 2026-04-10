import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function SeletorRootPage() {
  const session = await auth();
  const isInstructor = session?.user?.role === "INSTRUCTOR";
  if (isInstructor) {
    redirect("/seletor-de-atividades/tarefas");
  }

  // Coordenador/Admin vai para submissões
  redirect("/seletor-de-atividades/submissoes");
}
