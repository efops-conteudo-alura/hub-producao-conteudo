"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Pencil, Check, X, UserPlus, Trash2 } from "lucide-react";
import { LessonAccordion } from "../../_components/LessonAccordion";
import { exportSelectedCourse } from "@/lib/export";
import type { Alternative, Course, Exercise, Lesson } from "@/types/course";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function buildExportSections(lessons: Lesson[]) {
  return lessons.map((lesson) => ({
    id: String(lesson.lessonNumber),
    title: lesson.title ?? "",
    activities: lesson.exercises.map((ex) => ({
      id: ex.id,
      taskEnum: ex.kind,
      dataTag: ex.dataTag,
      title: ex.title,
      body: ex.text,
      ...(ex.sampleAnswer !== undefined ? { opinion: ex.sampleAnswer } : {}),
      ...(ex.enhancedByLuri ? { enhancedByLuri: true } : {}),
      alternatives: ex.alternatives.map(({ text: body, opinion: justification, correct }) => ({
        body,
        justification,
        correct,
      })),
    })),
  }));
}

interface SharedCoordinator {
  coordinatorId: string;
  coordinator: { id: string; name: string; email: string };
  addedAt: string;
}

interface SubmissionDetail {
  id: string;
  courseId: string;
  status: string;
  coordinatorId: string;
  instructor: { id: string; name: string; email: string };
  coordinator: { id: string; name: string; email: string };
  sharedCoordinators: SharedCoordinator[];
  originalData: Course;
  submittedData: { courseId?: string; lessons?: Lesson[] };
  createdAt: string;
}

interface Coordinator {
  id: string;
  name: string;
  email: string;
}

export default function SubmissaoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();

  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [reopening, setReopening] = useState(false);

  const [editedLessons, setEditedLessons] = useState<Lesson[]>([]);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [uploadFeedback, setUploadFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [editingCourseId, setEditingCourseId] = useState(false);
  const [draftCourseId, setDraftCourseId] = useState("");
  const [overrideCourseId, setOverrideCourseId] = useState<string | null>(null);
  const courseIdInputRef = useRef<HTMLInputElement>(null);

  // Compartilhamento
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [allCoordinators, setAllCoordinators] = useState<Coordinator[]>([]);
  const [loadingCoordinators, setLoadingCoordinators] = useState(false);
  const [selectedCoordinatorId, setSelectedCoordinatorId] = useState("");
  const [addingCoordinator, setAddingCoordinator] = useState(false);
  const [removingCoordinatorId, setRemovingCoordinatorId] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/seletor/submissoes/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setSubmission(data);
        const lessons: Lesson[] = Array.isArray(data.submittedData?.lessons) ? data.submittedData.lessons : [];
        const originalTitles: Record<number, string | undefined> = {};
        (data.originalData?.lessons ?? []).forEach((l: Lesson) => {
          originalTitles[l.lessonNumber] = l.title;
        });
        const normalized = lessons
          .map((l) => ({ ...l, title: l.title ?? originalTitles[l.lessonNumber] }))
          .sort((a, b) => a.lessonNumber - b.lessonNumber);
        setEditedLessons(normalized);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    window.postMessage({ type: "HUB_PAGE_READY", pageType: "seletor-atividades", courseId: id }, "*");
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.source !== window) return;
      if (e.data?.type !== "EXTENSION_UPLOAD_DONE") return;
      const { success, count, errors, platform } = e.data as {
        success: boolean;
        count?: number;
        errors?: number;
        platform?: string;
      };
      const plat = platform ? ` para ${platform}` : "";
      if (success) {
        setUploadFeedback({ success: true, message: `${count ?? "?"} atividades enviadas${plat}.` });
      } else {
        setUploadFeedback({
          success: false,
          message: `Falha no envio${plat}. ${errors ? `${errors} erro(s).` : ""}`.trim(),
        });
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  async function openShareDialog() {
    setShareError(null);
    setSelectedCoordinatorId("");
    setShowShareDialog(true);
    setLoadingCoordinators(true);
    try {
      const res = await fetch("/api/seletor/coordenadores");
      const data: Coordinator[] = await res.json();
      setAllCoordinators(data);
    } catch {
      setShareError("Erro ao carregar coordenadores.");
    } finally {
      setLoadingCoordinators(false);
    }
  }

  async function handleAddCoordinator() {
    if (!selectedCoordinatorId || !submission) return;
    setAddingCoordinator(true);
    setShareError(null);
    try {
      const res = await fetch(`/api/seletor/submissoes/${id}/coordenadores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coordinatorId: selectedCoordinatorId }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setShareError(json.error ?? "Erro ao adicionar coordenador.");
        return;
      }
      const added = allCoordinators.find((c) => c.id === selectedCoordinatorId);
      if (added) {
        setSubmission((prev) =>
          prev
            ? {
                ...prev,
                sharedCoordinators: [
                  ...prev.sharedCoordinators,
                  { coordinatorId: added.id, coordinator: added, addedAt: new Date().toISOString() },
                ],
              }
            : prev
        );
      }
      setSelectedCoordinatorId("");
    } catch {
      setShareError("Erro de conexão.");
    } finally {
      setAddingCoordinator(false);
    }
  }

  async function handleRemoveCoordinator(coordinatorId: string) {
    setRemovingCoordinatorId(coordinatorId);
    setShareError(null);
    try {
      const res = await fetch(`/api/seletor/submissoes/${id}/coordenadores`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coordinatorId }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setShareError(json.error ?? "Erro ao remover coordenador.");
        return;
      }
      setSubmission((prev) =>
        prev
          ? {
              ...prev,
              sharedCoordinators: prev.sharedCoordinators.filter(
                (sc) => sc.coordinatorId !== coordinatorId
              ),
            }
          : prev
      );
    } catch {
      setShareError("Erro de conexão.");
    } finally {
      setRemovingCoordinatorId(null);
    }
  }

  function handleEditToggle(exerciseId: string) {
    setEditingExerciseId((prev) => (prev === exerciseId ? null : exerciseId));
  }

  function handleRemove(lessonNumber: number, exerciseId: string) {
    setEditingExerciseId((prev) => (prev === exerciseId ? null : prev));
    setEditedLessons((prev) => {
      const updated = prev.map((lesson) => {
        if (lesson.lessonNumber !== lessonNumber) return lesson;
        return {
          ...lesson,
          exercises: lesson.exercises.filter((ex) => ex.id !== exerciseId),
        };
      });
      return updated.filter((l) => l.exercises.length > 0);
    });
  }

  function handleRestore(lessonNumber: number, exercise: Exercise) {
    setEditedLessons((prev) => {
      const lessonIndex = prev.findIndex((l) => l.lessonNumber === lessonNumber);
      if (lessonIndex !== -1) {
        const updated = [...prev];
        updated[lessonIndex] = {
          ...updated[lessonIndex],
          exercises: [...updated[lessonIndex].exercises, exercise],
        };
        return updated;
      }
      const originalLesson = submission?.originalData.lessons.find(
        (l) => l.lessonNumber === lessonNumber
      );
      return [
        ...prev,
        { lessonNumber, title: originalLesson?.title, exercises: [exercise] },
      ].sort((a, b) => a.lessonNumber - b.lessonNumber);
    });
  }

  function handleExerciseChange(lessonNumber: number, exerciseId: string, changes: Partial<Exercise>) {
    setEditedLessons((prev) =>
      prev.map((lesson) => {
        if (lesson.lessonNumber !== lessonNumber) return lesson;
        return {
          ...lesson,
          exercises: lesson.exercises.map((ex) =>
            ex.id === exerciseId ? { ...ex, ...changes } : ex
          ),
        };
      })
    );
  }

  function handleLuriToggle(lessonNumber: number, exerciseId: string) {
    setEditedLessons((prev) =>
      prev.map((lesson) => {
        if (lesson.lessonNumber !== lessonNumber) return lesson;
        return {
          ...lesson,
          exercises: lesson.exercises.map((ex) =>
            ex.id === exerciseId ? { ...ex, enhancedByLuri: !ex.enhancedByLuri } : ex
          ),
        };
      })
    );
  }

  function handleAlternativeChange(
    lessonNumber: number,
    exerciseId: string,
    altIndex: number,
    changes: Partial<Alternative>
  ) {
    setEditedLessons((prev) =>
      prev.map((lesson) => {
        if (lesson.lessonNumber !== lessonNumber) return lesson;
        return {
          ...lesson,
          exercises: lesson.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex;
            const updatedAlternatives = ex.alternatives.map((alt, i) => {
              if (changes.correct === true && ex.kind !== "MULTIPLE_CHOICE" && i !== altIndex) return { ...alt, correct: false };
              if (i === altIndex) return { ...alt, ...changes };
              return alt;
            });
            return { ...ex, alternatives: updatedAlternatives };
          }),
        };
      })
    );
  }

  const effectiveCourseId = overrideCourseId ?? submission?.courseId ?? "";

  function startEditCourseId() {
    setDraftCourseId(effectiveCourseId);
    setEditingCourseId(true);
    setTimeout(() => courseIdInputRef.current?.select(), 0);
  }

  function confirmEditCourseId() {
    const trimmed = draftCourseId.trim();
    if (trimmed) setOverrideCourseId(trimmed);
    setEditingCourseId(false);
  }

  function cancelEditCourseId() {
    setEditingCourseId(false);
  }

  async function markAsExported(): Promise<boolean> {
    if (!submission) return false;
    const res = await fetch(`/api/seletor/submissoes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "exported",
        submittedData: { courseId: effectiveCourseId, lessons: editedLessons },
      }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setExportError(json.error ?? "Erro ao salvar exportação. Tente novamente.");
      return false;
    }
    setSubmission((prev) => (prev ? { ...prev, status: "exported" } : prev));
    return true;
  }

  async function handleDownload() {
    if (!submission) return;
    setExporting(true);
    setExportError(null);
    try {
      const ok = await markAsExported();
      if (!ok) return;
      exportSelectedCourse(
        { courseId: effectiveCourseId, lessons: editedLessons },
        editedLessons
      );
    } catch {
      setExportError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setExporting(false);
    }
  }

  async function handleReopen() {
    if (!submission) return;
    setReopening(true);
    setExportError(null);
    try {
      const res = await fetch("/api/seletor/submissoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instructorId: submission.instructor.id,
          originalData: {
            courseId: effectiveCourseId,
            lessons: editedLessons.map((lesson) => ({
              ...lesson,
              exercises: lesson.exercises.map(({ enhancedByLuri: _luri, ...ex }) => ex),
            })),
          },
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setExportError(json.error ?? "Erro ao criar nova versão.");
        return;
      }
      router.push("/seletor-de-atividades/submissoes");
    } catch {
      setExportError("Erro de conexão. Tente novamente.");
    } finally {
      setReopening(false);
    }
  }

  async function handleUploadToAdmin() {
    if (!submission) return;
    setUploading(true);
    setExportError(null);
    setUploadFeedback(null);
    try {
      const ok = await markAsExported();
      if (!ok) return;
      const sections = buildExportSections(editedLessons);
      window.postMessage(
        { type: "HUB_EXPORT_REQUEST", courseId: effectiveCourseId, sections },
        "*"
      );
    } catch {
      setExportError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground text-sm">Carregando...</p>
      </main>
    );
  }

  if (!submission) {
    return (
      <main className="flex flex-1 items-center justify-center flex-col gap-4">
        <p className="text-muted-foreground">Submissão não encontrada.</p>
        <button
          onClick={() => router.push("/seletor-de-atividades/submissoes")}
          className="text-primary text-sm hover:underline"
        >
          Voltar
        </button>
      </main>
    );
  }

  const currentUserId = session?.user?.id;
  const currentUserRole = session?.user?.role;
  const isOriginalCoordinator =
    currentUserRole === "ADMIN" || submission.coordinatorId === currentUserId;
  const isSharedCoordinator = submission.sharedCoordinators.some(
    (sc) => sc.coordinatorId === currentUserId
  );
  const canShare = isOriginalCoordinator;
  const canSeeShareButton = isOriginalCoordinator || isSharedCoordinator;

  const alreadySharedIds = new Set([
    submission.coordinatorId,
    ...submission.sharedCoordinators.map((sc) => sc.coordinatorId),
  ]);
  const availableToAdd = allCoordinators.filter((c) => !alreadySharedIds.has(c.id));

  const originalLessonsByNumber: Record<number, Lesson> = {};
  submission.originalData.lessons.forEach((lesson) => {
    originalLessonsByNumber[lesson.lessonNumber] = lesson;
  });

  const selectedIds = new Set(editedLessons.flatMap((l) => l.exercises.map((e) => e.id)));

  const hasNonSelected = submission.originalData.lessons.some((l) =>
    l.exercises.some((ex) => !selectedIds.has(ex.id))
  );

  return (
    <div className="flex flex-col flex-1">
      <header className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-xs">
            {submission.status === "pending"
              ? `Aguardando revisão de ${submission.instructor.name}`
              : `Revisado por ${submission.instructor.name}`}{" "}
            · {new Date(submission.createdAt).toLocaleDateString("pt-BR")}
          </p>
          <div className="flex items-center gap-1.5 min-h-[28px]">
            {editingCourseId ? (
              <>
                <input
                  ref={courseIdInputRef}
                  value={draftCourseId}
                  onChange={(e) => setDraftCourseId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmEditCourseId();
                    if (e.key === "Escape") cancelEditCourseId();
                  }}
                  className="font-heading font-bold text-primary text-lg leading-tight bg-transparent border-b border-primary outline-none w-40"
                  autoFocus
                />
                <button onClick={confirmEditCourseId} title="Confirmar" className="text-primary hover:text-primary/70 transition-colors">
                  <Check size={15} />
                </button>
                <button onClick={cancelEditCourseId} title="Cancelar" className="text-muted-foreground hover:text-foreground transition-colors">
                  <X size={15} />
                </button>
              </>
            ) : (
              <>
                <h1 className="font-heading font-bold text-primary text-lg leading-tight">
                  {effectiveCourseId}
                </h1>
                <button
                  onClick={startEditCourseId}
                  title="Editar ID do curso"
                  className="text-primary/50 hover:text-primary transition-colors mt-0.5"
                >
                  <Pencil size={15} />
                </button>
              </>
            )}
          </div>
          {submission.status === "exported" && (
            <span className="text-xs text-green-600 dark:text-green-400">exportado</span>
          )}
          {submission.status === "reviewed" && (
            <span className="text-xs text-yellow-600 dark:text-yellow-400">revisado — pronto para exportar</span>
          )}
          {submission.status === "pending" && (
            <span className="text-xs text-red-600 dark:text-red-400">aguardando revisão do instrutor</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {canSeeShareButton && (
            <button
              onClick={openShareDialog}
              title="Compartilhar com outro coordenador"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              <UserPlus size={16} />
              {submission.sharedCoordinators.length > 0 && (
                <span className="text-xs bg-primary/10 text-primary rounded-full px-1.5 py-0.5 font-medium">
                  {submission.sharedCoordinators.length}
                </span>
              )}
            </button>
          )}
          <button
            onClick={() => router.push("/seletor-de-atividades/submissoes")}
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            ← Voltar
          </button>
        </div>
      </header>

      <main className="flex flex-col gap-6 px-6 py-6 max-w-3xl mx-auto w-full flex-1">
        {submission.status === "pending" && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl px-4 py-3">
            <p className="text-destructive text-sm">
              O instrutor ainda não enviou a revisão. Esta página será atualizada quando ele concluir.
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground bg-muted/40 rounded-xl px-4 py-3">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-destructive/60 inline-block"></span>
            texto riscado = original antes da edição do instrutor
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500/60 inline-block"></span>
            texto verde = alterado pelo instrutor
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-500/60 inline-block"></span>
            alternativa correta alterada
          </span>
          <span>Clique em <strong className="text-foreground/60">Editar</strong> para modificar um exercício antes de exportar. Você também pode excluir atividades selecionadas ou incluir as que foram excluídas.</span>
        </div>

        {editedLessons.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Selecionados pelo instrutor
            </h2>
            {editedLessons.map((lesson) => (
              <LessonAccordion
                key={lesson.lessonNumber}
                lesson={lesson}
                originalLesson={originalLessonsByNumber[lesson.lessonNumber]}
                editingExerciseId={editingExerciseId}
                onEditToggle={handleEditToggle}
                onRemove={handleRemove}
                onExerciseChange={handleExerciseChange}
                onAlternativeChange={handleAlternativeChange}
                onLuriToggle={handleLuriToggle}
                defaultOpen
                copyable
              />
            ))}
          </section>
        )}

        {hasNonSelected && (
          <section className="flex flex-col gap-3">
            <h2 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wide">
              Não selecionados pelo instrutor — clique para incluir
            </h2>
            {submission.originalData.lessons.map((lesson) => {
              const notSelected = {
                ...lesson,
                exercises: lesson.exercises.filter((ex) => !selectedIds.has(ex.id)),
              };
              if (notSelected.exercises.length === 0) return null;
              return (
                <div key={lesson.lessonNumber} className="opacity-60">
                  <LessonAccordion
                    lesson={notSelected}
                    readOnly
                    onRestore={handleRestore}
                    defaultOpen={false}
                  />
                </div>
              );
            })}
          </section>
        )}
      </main>

      <footer className="sticky bottom-0 bg-card border-t border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex flex-col items-end gap-2">
          {exportError && (
            <p className="text-destructive text-sm bg-destructive/10 px-4 py-2 rounded-lg w-full text-center">
              {exportError}
            </p>
          )}
          {uploadFeedback && (
            <p
              className={`text-sm px-4 py-2 rounded-lg w-full text-center ${
                uploadFeedback.success
                  ? "text-green-700 dark:text-green-400 bg-green-500/10"
                  : "text-destructive bg-destructive/10"
              }`}
            >
              {uploadFeedback.success ? "✓ " : "✕ "}
              {uploadFeedback.message}
            </p>
          )}
          <div className="flex gap-3 w-full justify-between items-center">
            <div>
              {(submission.status === "reviewed" || submission.status === "exported") && editedLessons.length > 0 && (
                <div className="relative group">
                  <button
                    onClick={handleReopen}
                    disabled={reopening || exporting || uploading}
                    className="border border-border hover:border-primary/40 text-muted-foreground hover:text-foreground disabled:opacity-50 font-semibold px-5 py-3 rounded-xl transition-colors text-sm"
                  >
                    {reopening ? "Criando..." : "↩ Reabrir para instrutor"}
                  </button>
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-popover border border-border rounded-xl px-3 py-2.5 shadow-lg text-xs text-muted-foreground leading-snug opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    O instrutor receberá a versão atual (com suas edições). Para enviar o curso original, crie uma nova submissão.
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleUploadToAdmin}
                disabled={uploading || exporting || editedLessons.length === 0}
                className="bg-secondary hover:bg-secondary/80 disabled:opacity-50 text-secondary-foreground font-bold px-6 py-3 rounded-xl transition-colors"
              >
                {uploading ? "Enviando..." : "↑ Subir no Admin"}
              </button>
              <button
                onClick={handleDownload}
                disabled={exporting || uploading || editedLessons.length === 0}
                className="bg-primary hover:bg-primary/80 disabled:opacity-50 text-primary-foreground font-bold px-8 py-3 rounded-xl transition-colors"
              >
                {exporting ? "Exportando..." : "⬇ Baixar JSON"}
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Dialog de compartilhamento */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Compartilhar submissão</DialogTitle>
          </DialogHeader>

          <div className="flex flex-col gap-4 pt-1">
            {/* Coordenador original */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Coordenador responsável
              </p>
              <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/40">
                <div>
                  <p className="text-sm font-medium">{submission.coordinator.name}</p>
                  <p className="text-xs text-muted-foreground">{submission.coordinator.email}</p>
                </div>
              </div>
            </div>

            {/* Coordenadores compartilhados */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Também têm acesso
              </p>
              {submission.sharedCoordinators.length === 0 ? (
                <p className="text-sm text-muted-foreground px-3 py-2">Nenhum coordenador adicionado ainda.</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {submission.sharedCoordinators.map((sc) => {
                    const canRemove =
                      isOriginalCoordinator || sc.coordinatorId === currentUserId;
                    return (
                      <div
                        key={sc.coordinatorId}
                        className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/40"
                      >
                        <div>
                          <p className="text-sm font-medium">{sc.coordinator.name}</p>
                          <p className="text-xs text-muted-foreground">{sc.coordinator.email}</p>
                        </div>
                        {canRemove && (
                          <button
                            onClick={() => handleRemoveCoordinator(sc.coordinatorId)}
                            disabled={removingCoordinatorId === sc.coordinatorId}
                            title="Remover"
                            className="text-muted-foreground hover:text-destructive disabled:opacity-40 transition-colors ml-2"
                          >
                            {removingCoordinatorId === sc.coordinatorId ? (
                              <span className="text-xs">...</span>
                            ) : (
                              <Trash2 size={15} />
                            )}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Adicionar coordenador — só para o original ou admin */}
            {canShare && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Adicionar coordenador
                </p>
                {loadingCoordinators ? (
                  <p className="text-sm text-muted-foreground px-3 py-2">Carregando...</p>
                ) : availableToAdd.length === 0 ? (
                  <p className="text-sm text-muted-foreground px-3 py-2">
                    Todos os coordenadores já têm acesso.
                  </p>
                ) : (
                  <div className="flex gap-2">
                    <select
                      value={selectedCoordinatorId}
                      onChange={(e) => setSelectedCoordinatorId(e.target.value)}
                      className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary transition-colors"
                    >
                      <option value="">Selecionar coordenador...</option>
                      {availableToAdd.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAddCoordinator}
                      disabled={!selectedCoordinatorId || addingCoordinator}
                      className="bg-primary hover:bg-primary/80 disabled:opacity-50 text-primary-foreground font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      {addingCoordinator ? "..." : "Adicionar"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {shareError && (
              <p className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">
                {shareError}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
