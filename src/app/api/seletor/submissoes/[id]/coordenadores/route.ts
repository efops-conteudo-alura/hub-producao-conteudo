import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = session.user.id;
  const role = session.user.role;

  let submission;
  try {
    submission = await prisma.submission.findUnique({ where: { id } });
  } catch (e) {
    console.error("[POST /api/seletor/submissoes/[id]/coordenadores]", e);
    return NextResponse.json({ error: "Erro ao acessar o banco de dados." }, { status: 500 });
  }

  if (!submission) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  const isOriginalCoordinator =
    (role === "COORDINATOR" && submission.coordinatorId === userId) || role === "ADMIN";

  if (!isOriginalCoordinator) {
    return NextResponse.json({ error: "Apenas o coordenador original pode compartilhar." }, { status: 403 });
  }

  let body: { coordinatorId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const { coordinatorId } = body;
  if (!coordinatorId || typeof coordinatorId !== "string") {
    return NextResponse.json({ error: "coordinatorId inválido." }, { status: 400 });
  }

  if (coordinatorId === submission.coordinatorId) {
    return NextResponse.json({ error: "Este coordenador já é o responsável pela submissão." }, { status: 409 });
  }

  const targetRole = await prisma.appRole.findFirst({
    where: { userId: coordinatorId, app: "hub-producao-conteudo", role: { in: ["COORDINATOR", "ADMIN"] } },
  });

  if (!targetRole) {
    return NextResponse.json({ error: "Usuário não é coordenador neste app." }, { status: 404 });
  }

  try {
    await prisma.submissionCoordinator.create({
      data: { submissionId: id, coordinatorId },
    });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Coordenador já adicionado." }, { status: 409 });
    }
    console.error("[POST /api/seletor/submissoes/[id]/coordenadores]", e);
    return NextResponse.json({ error: "Erro ao salvar." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const userId = session.user.id;
  const role = session.user.role;

  let body: { coordinatorId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const { coordinatorId } = body;
  if (!coordinatorId || typeof coordinatorId !== "string") {
    return NextResponse.json({ error: "coordinatorId inválido." }, { status: 400 });
  }

  let submission;
  try {
    submission = await prisma.submission.findUnique({ where: { id } });
  } catch (e) {
    console.error("[DELETE /api/seletor/submissoes/[id]/coordenadores]", e);
    return NextResponse.json({ error: "Erro ao acessar o banco de dados." }, { status: 500 });
  }

  if (!submission) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });

  const isOriginalCoordinator =
    (role === "COORDINATOR" && submission.coordinatorId === userId) || role === "ADMIN";
  const isRemovingSelf = coordinatorId === userId;

  if (!isOriginalCoordinator && !isRemovingSelf) {
    return NextResponse.json({ error: "Sem permissão para remover este coordenador." }, { status: 403 });
  }

  try {
    await prisma.submissionCoordinator.delete({
      where: { submissionId_coordinatorId: { submissionId: id, coordinatorId } },
    });
  } catch (e) {
    console.error("[DELETE /api/seletor/submissoes/[id]/coordenadores]", e);
    return NextResponse.json({ error: "Erro ao remover coordenador." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
