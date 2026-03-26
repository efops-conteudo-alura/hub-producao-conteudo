import { NextRequest, NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

function getSelectorRole(session: Session | null): string {
  if (!session?.user) return "";
  if (session.user.role === "ADMIN") return "ADMIN";
  return session.user.selectorRole ?? "";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  let submission;
  try {
    submission = await prisma.submission.findUnique({
      where: { id },
      include: {
        instructor: { select: { id: true, name: true, email: true } },
        coordinator: { select: { id: true, name: true, email: true } },
      },
    });
  } catch (e) {
    console.error("[GET /api/seletor/submissoes/[id]]", e);
    return NextResponse.json({ error: "Erro ao acessar o banco de dados." }, { status: 500 });
  }

  if (!submission) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  const userId = session.user.id;
  const selectorRole = getSelectorRole(session);

  const canView =
    selectorRole === "ADMIN" ||
    submission.instructorId === userId ||
    submission.coordinatorId === userId;

  if (!canView) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(submission);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  let submission;
  try {
    submission = await prisma.submission.findUnique({ where: { id } });
  } catch (e) {
    console.error("[PATCH /api/seletor/submissoes/[id]] Erro ao buscar submissão:", e);
    return NextResponse.json({ error: "Erro ao acessar o banco de dados." }, { status: 500 });
  }
  if (!submission) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  const userId = session.user.id;
  const selectorRole = getSelectorRole(session);

  const isCoordinator =
    (selectorRole === "COORDINATOR" && submission.coordinatorId === userId) ||
    selectorRole === "ADMIN";
  const isAssignedInstructor =
    selectorRole === "INSTRUCTOR" && submission.instructorId === userId;

  if (!isCoordinator && !isAssignedInstructor) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (isAssignedInstructor) {
    if (!body.submittedData) {
      return NextResponse.json({ error: "submittedData obrigatório." }, { status: 400 });
    }
    if (submission.status !== "pending") {
      return NextResponse.json(
        { error: "Esta tarefa já foi enviada e não pode ser alterada." },
        { status: 409 }
      );
    }
    data.submittedData = body.submittedData;
    data.status = "reviewed";
  } else {
    if (body.status === "exported") {
      data.status = "exported";
      data.exportedAt = new Date();
    }
    if (body.submittedData) {
      data.submittedData = body.submittedData;
    }
  }

  let updated;
  try {
    updated = await prisma.submission.update({ where: { id }, data });
  } catch (e) {
    console.error("[PATCH /api/seletor/submissoes/[id]] Erro ao atualizar submissão:", e);
    return NextResponse.json({ error: "Erro ao salvar alterações." }, { status: 500 });
  }
  return NextResponse.json({ id: updated.id, status: updated.status });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const selectorRole = getSelectorRole(session);
  if (selectorRole !== "COORDINATOR" && selectorRole !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  let submission;
  try {
    submission = await prisma.submission.findUnique({ where: { id } });
  } catch (e) {
    console.error("[DELETE /api/seletor/submissoes/[id]] Erro ao buscar submissão:", e);
    return NextResponse.json({ error: "Erro ao acessar o banco de dados." }, { status: 500 });
  }
  if (!submission) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  if (selectorRole === "COORDINATOR" && submission.coordinatorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (submission.status !== "pending") {
    return NextResponse.json(
      { error: "Apenas submissões pendentes podem ser excluídas." },
      { status: 409 }
    );
  }

  try {
    await prisma.submission.delete({ where: { id } });
  } catch (e) {
    console.error("[DELETE /api/seletor/submissoes/[id]] Erro ao excluir submissão:", e);
    return NextResponse.json({ error: "Erro ao excluir submissão." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
