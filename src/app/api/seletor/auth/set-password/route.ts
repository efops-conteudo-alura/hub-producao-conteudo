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
  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "A senha deve ter ao menos 8 caracteres." }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!user) {
    return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });
  }

  const appRole = await prisma.appRole.findUnique({
    where: { userId_app: { userId: user.id, app: "select-activity" } },
  });

  if (appRole?.role === "INSTRUCTOR") {
    return NextResponse.json({ error: "Conta não encontrada." }, { status: 404 });
  }

  if (user.password) {
    return NextResponse.json(
      { error: "Esta conta já tem senha. Entre normalmente pelo login." },
      { status: 400 }
    );
  }

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

  return NextResponse.json({ success: true });
}
