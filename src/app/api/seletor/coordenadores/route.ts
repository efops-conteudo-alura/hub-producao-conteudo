import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const appRoles = await prisma.appRole.findMany({
    where: {
      OR: [
        { app: "hub-producao-conteudo", role: { in: ["COORDINATOR", "ADMIN"] } },
        { app: "select-activity", role: { in: ["COORDINATOR", "ADMIN"] } },
      ],
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { user: { name: "asc" } },
  });

  // Deduplica por userId (usuário pode ter roles nos dois apps durante a migração)
  const seen = new Set<string>();
  const unique = appRoles.filter((r) => {
    if (seen.has(r.user.id)) return false;
    seen.add(r.user.id);
    return true;
  });

  return NextResponse.json(
    unique.map((r) => ({
      id: r.user.id,
      name: r.user.name,
      email: r.user.email,
    }))
  );
}
