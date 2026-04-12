import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "COORDINATOR" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const appRoles = await prisma.appRole.findMany({
    where: { app: "hub-producao-conteudo", role: "INSTRUCTOR" },
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

  const role = session.user.role;
  if (role !== "COORDINATOR" && role !== "ADMIN") {
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
      where: { userId_app: { userId: user.id, app: "hub-producao-conteudo" } },
    });

    if (existing?.role === "INSTRUCTOR") {
      return NextResponse.json({ error: "Instrutor já cadastrado." }, { status: 409 });
    }

    await prisma.appRole.create({
      data: { userId: user.id, app: "hub-producao-conteudo", role: "INSTRUCTOR" },
    });

    return NextResponse.json({ id: user.id, name: user.name, email: user.email }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/seletor/instrutores]", e);
    return NextResponse.json({ error: "Erro ao salvar instrutor." }, { status: 500 });
  }
}
