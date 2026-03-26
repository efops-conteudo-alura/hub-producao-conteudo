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
  const submission = await prisma.submission.findUnique({
    where: { id },
    include: {
      instructor: { select: { id: true, name: true, email: true } },
      coordinator: { select: { id: true, name: true, email: true } },
    },
  });

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
  const submission = await prisma.submission.findUnique({ where: { id } });
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

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (isAssignedInstructor) {
    if (!body.submittedData) {
      return NextResponse.json({ error: "submittedData obrigatório." }, { status: 400 });
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

  const updated = await prisma.submission.update({ where: { id }, data });
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
  const submission = await prisma.submission.findUnique({ where: { id } });
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

  await prisma.submission.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
