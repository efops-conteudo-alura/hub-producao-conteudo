import { auth } from "@/lib/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-2">Hub de Produção de Conteúdo</h1>
      <p className="text-muted-foreground">Olá, {session?.user?.name ?? "usuário"}.</p>
    </div>
  );
}
