import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const role = session.user.role;

  if (!role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const where =
    role === "INSTRUCTOR"
      ? { instructorId: userId }
      : role === "ADMIN"
      ? {}
      : { coordinatorId: userId };

  let submissions;
  try {
    submissions = await prisma.submission.findMany({
      where,
      include: {
        instructor: { select: { id: true, name: true, email: true } },
        coordinator: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (e) {
    console.error("[GET /api/seletor/submissoes]", e);
    return NextResponse.json({ error: "Erro ao acessar o banco de dados." }, { status: 500 });
  }

  return NextResponse.json(
    submissions.map((s) => ({
      id: s.id,
      courseId: s.courseId,
      status: s.status,
      instructor: s.instructor,
      coordinator: s.coordinator,
      createdAt: s.createdAt,
      exportedAt: s.exportedAt,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = session.user.role;
  if (role !== "COORDINATOR" && role !== "ADMIN") {
    return NextResponse.json({ error: "Apenas coordenadores podem criar tarefas." }, { status: 403 });
  }

  let body: { instructorId?: unknown; originalData?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }
  const { instructorId, originalData } = body;

  if (!instructorId || !originalData) {
    return NextResponse.json({ error: "Dados incompletos." }, { status: 400 });
  }

  if (typeof instructorId !== "string") {
    return NextResponse.json({ error: "instructorId inválido." }, { status: 400 });
  }

  const courseId = String((originalData as { courseId?: unknown }).courseId ?? "");

  let instructorRole;
  try {
    instructorRole = await prisma.appRole.findFirst({
      where: { userId: instructorId, app: "hub-producao-conteudo", role: "INSTRUCTOR" },
    });
  } catch (e) {
    console.error("[POST /api/seletor/submissoes] Erro ao buscar instrutor:", e);
    return NextResponse.json({ error: "Erro ao acessar o banco de dados." }, { status: 500 });
  }

  if (!instructorRole) {
    return NextResponse.json({ error: "Instrutor não encontrado." }, { status: 404 });
  }

  let submission;
  try {
    submission = await prisma.submission.create({
      data: {
        instructorId,
        coordinatorId: session.user.id,
        courseId,
        originalData,
        submittedData: {},
        status: "pending",
      },
    });
  } catch (e) {
    console.error("[POST /api/seletor/submissoes] Erro ao criar submissão:", e);
    return NextResponse.json({ error: "Erro ao salvar submissão no banco de dados." }, { status: 500 });
  }

  return NextResponse.json({ id: submission.id }, { status: 201 });
}
