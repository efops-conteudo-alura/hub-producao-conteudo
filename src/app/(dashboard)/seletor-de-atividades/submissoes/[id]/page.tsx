"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { LessonAccordion } from "../../_components/LessonAccordion";
import { exportSelectedCourse } from "@/lib/export";
import type { Alternative, Course, Exercise, Lesson } from "@/types/course";

interface SubmissionDetail {
  id: string;
  courseId: string;
  status: string;
  instructor: { name: string; email: string };
  originalData: Course;
  submittedData: { courseId: string; lessons: Lesson[] };
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

  const [editedLessons, setEditedLessons] = useState<Lesson[]>([]);
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/seletor/submissoes/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setSubmission(data);
        const lessons = Array.isArray(data.submittedData?.lessons) ? data.submittedData.lessons : [];
        setEditedLessons(lessons);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

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
      return [
        ...prev,
        { lessonNumber, exercises: [exercise] },
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
              if (changes.correct === true && i !== altIndex) return { ...alt, correct: false };
              if (i === altIndex) return { ...alt, ...changes };
              return alt;
            });
            return { ...ex, alternatives: updatedAlternatives };
          }),
        };
      })
    );
  }

  async function handleExport() {
    if (!submission) return;
    setExporting(true);

    const courseToExport: Course = {
      courseId: submission.courseId,
      lessons: editedLessons,
    };

    exportSelectedCourse(courseToExport, editedLessons);

    await fetch(`/api/seletor/submissoes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "exported",
        submittedData: { courseId: submission.courseId, lessons: editedLessons },
      }),
    });

    setSubmission((prev) => (prev ? { ...prev, status: "exported" } : prev));
    setExporting(false);
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
          <h1 className="font-heading font-bold text-primary text-lg leading-tight">
            {submission.courseId}
          </h1>
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
        <div className="max-w-3xl mx-auto flex justify-end">
          <button
            onClick={handleExport}
            disabled={exporting || editedLessons.length === 0}
            className="bg-primary hover:bg-primary/80 disabled:opacity-50 text-primary-foreground font-bold px-8 py-3 rounded-xl transition-colors"
          >
            {exporting ? "Exportando..." : "⬇ Exportar JSON"}
          </button>
        </div>
      </footer>
    </div>
  );
}
