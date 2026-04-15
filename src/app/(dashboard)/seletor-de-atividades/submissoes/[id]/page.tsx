"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Check, X } from "lucide-react";
import { LessonAccordion } from "../../_components/LessonAccordion";
import { exportSelectedCourse } from "@/lib/export";
import type { Alternative, Course, Exercise, Lesson } from "@/types/course";

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
      alternatives: ex.alternatives.map(({ text: body, opinion: justification, correct }) => ({
        body,
        justification,
        correct,
      })),
    })),
  }));
}

interface SubmissionDetail {
  id: string;
  courseId: string;
  status: string;
  instructor: { id: string; name: string; email: string };
  originalData: Course;
  submittedData: { courseId?: string; lessons?: Lesson[] };
  createdAt: string;
}

export default function SubmissaoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

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

  // Anuncia a página para a extensão ao montar
  useEffect(() => {
    window.postMessage({ type: "HUB_PAGE_READY", pageType: "seletor-atividades", courseId: id }, "*");
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // Ouve o resultado do upload feito pela extensão
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
          originalData: { courseId: effectiveCourseId, lessons: editedLessons },
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
        <button
          onClick={() => router.push("/seletor-de-atividades/submissoes")}
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          ← Voltar
        </button>
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
              {submission.status === "reviewed" && editedLessons.length > 0 && (
                <button
                  onClick={handleReopen}
                  disabled={reopening || exporting || uploading}
                  className="border border-border hover:border-primary/40 text-muted-foreground hover:text-foreground disabled:opacity-50 font-semibold px-5 py-3 rounded-xl transition-colors text-sm"
                >
                  {reopening ? "Criando..." : "↩ Reabrir para instrutor"}
                </button>
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
    </div>
  );
}
