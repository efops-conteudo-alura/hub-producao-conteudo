import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }
  const { email, name, password } = body;

  if (!email || !name || !password) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "A senha deve ter ao menos 8 caracteres." }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  const allowed = await prisma.allowedEmail.findUnique({ where: { email: normalizedEmail } });
  if (!allowed) {
    return NextResponse.json(
      { error: "Email não autorizado. Contacte um administrador do hub." },
      { status: 403 }
    );
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    // Usuário já existe: garante AppRole como COORDINATOR no hub-producao-conteudo
    await prisma.appRole.upsert({
      where: { userId_app: { userId: existing.id, app: "hub-producao-conteudo" } },
      create: { userId: existing.id, app: "hub-producao-conteudo", role: "COORDINATOR" },
      update: { role: "COORDINATOR" },
    });
    return NextResponse.json({ success: true, existing: true });
  }

  const hashed = await bcrypt.hash(password, 12);
  const newUser = await prisma.user.create({
    data: { email: normalizedEmail, name: name.trim(), password: hashed },
  });

  await prisma.appRole.create({
    data: { userId: newUser.id, app: "hub-producao-conteudo", role: "COORDINATOR" },
  });

  return NextResponse.json({ success: true });
}
