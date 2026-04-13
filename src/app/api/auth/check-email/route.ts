import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// Verifica o status de um email para exibir a mensagem correta na tela de login.
// Usado para contornar a sanitização de erros do NextAuth v5 beta.
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!email) return NextResponse.json({ status: "invalid" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ status: "invalid" });

  const hubRole = await prisma.appRole.findUnique({
    where: { userId_app: { userId: user.id, app: "hub-producao-conteudo" } },
  });
  if (!hubRole) return NextResponse.json({ status: "no_access" });

  if (!user.password) return NextResponse.json({ status: "needs_password" });

  return NextResponse.json({ status: "invalid" });
}
