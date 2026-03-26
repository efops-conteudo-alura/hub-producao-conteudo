import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

function getSelectorRole(session: Session | null): string {
  if (!session?.user) return "";
  if (session.user.role === "ADMIN") return "ADMIN";
  return session.user.selectorRole ?? "";
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const selectorRole = getSelectorRole(session);
  if (selectorRole !== "COORDINATOR" && selectorRole !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const appRoles = await prisma.appRole.findMany({
    where: { app: "select-activity", role: "INSTRUCTOR" },
    include: { user: { select: { id: true, name: true, email: true, createdAt: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(appRoles.map((r) => ({
    id: r.user.id,
    name: r.user.name,
    email: r.user.email,
    createdAt: r.user.createdAt,
  })));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const selectorRole = getSelectorRole(session);
  if (selectorRole !== "COORDINATOR" && selectorRole !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const { name, email } = body;

  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json({ error: "Nome e email são obrigatórios." }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (!user) {
      user = await prisma.user.create({
        data: { name: name.trim(), email: normalizedEmail },
      });
    }

    const existing = await prisma.appRole.findUnique({
      where: { userId_app: { userId: user.id, app: "select-activity" } },
    });

    if (existing) {
      return NextResponse.json({ error: "Instrutor já cadastrado." }, { status: 409 });
    }

    await prisma.appRole.create({
      data: { userId: user.id, app: "select-activity", role: "INSTRUCTOR" },
    });

    return NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/seletor/instrutores]", e);
    return NextResponse.json({ error: "Erro ao salvar instrutor." }, { status: 500 });
  }
}
