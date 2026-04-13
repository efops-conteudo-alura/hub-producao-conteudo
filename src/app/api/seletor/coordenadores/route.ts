import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const appRoles = await prisma.appRole.findMany({
    where: {
      app: "hub-producao-conteudo",
      role: { in: ["COORDINATOR", "ADMIN"] },
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { user: { name: "asc" } },
  });

  return NextResponse.json(
    appRoles.map((r) => ({
      id: r.user.id,
      name: r.user.name,
      email: r.user.email,
    }))
  );
}
