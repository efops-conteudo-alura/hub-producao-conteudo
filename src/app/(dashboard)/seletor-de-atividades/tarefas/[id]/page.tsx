"use client";

import { Suspense, useState, useEffect, useRef, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { LessonAccordion } from "../../_components/LessonAccordion";
import { StepBar } from "../../_components/StepBar";
import type { Course, Lesson } from "@/types/course";

const STEPS = ["Seleção", "Edição", "Enviar"];

interface TaskDetail {
  id: string;
  courseId: string;
  status: string;
  coordinator: { name: string; email: string };
  originalData: Course;
  submittedData: { courseId: string; lessons: Lesson[] } | Record<string, never>;
  createdAt: string;
}

function TarefaDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const version = searchParams.get("v");
  const { course, setCourse, selectedLessons, toggleExercise, updateComment, updateExercise, updateAlternative, restoreSelections, clearAll } = useApp();

  const [task, setTask] = useState<TaskDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const skipNextSaveRef = useRef(false);

  useEffect(() => {
    document.getElementById("main-scroll")?.scrollTo({ top: 0, behavior: "instant" });
  }, [step]);

  useEffect(() => {
    fetch(`/api/seletor/submissoes/${id}`)
      .then((r) => r.json())
      .then((data: TaskDetail) => {
        setTask(data);
        clearAll();
        setCourse(data.originalData);
        try {
          const draftKey = `seletor-draft-${id}`;
          if (data.status !== "pending") {
            localStorage.removeItem(draftKey);
          } else {
            const saved = localStorage.getItem(draftKey);
            if (saved) {
              skipNextSaveRef.current = true;
              restoreSelections(JSON.parse(saved));
              setHasDraft(true);
            }
          }
        } catch { /* ignora erros de parse */ }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (!task || loading) return;
    if (selectedLessons.length === 0) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }
    try {
      localStorage.setItem(`seletor-draft-${id}`, JSON.stringify(selectedLessons));
    } catch { /* ignora erros de storage */ }
  }, [selectedLessons, id, task, loading]);

  const comments: Record<string, string> = {};
  selectedLessons.forEach((lesson) => {
    lesson.exercises.forEach((ex) => {
      if (ex.comment) comments[ex.id] = ex.comment;
    });
  });

  function handleNextFromSelection() {
    if (!course) return;
    const allLessonsCovered = course.lessons.every((lesson) =>
      selectedLessons.some((sl) => sl.lessonNumber === lesson.lessonNumber)
    );
    if (!allLessonsCovered) {
      setError("Selecione ao menos uma atividade por aula.");
      return;
    }
    setError(null);
    setStep(2);
  }

  async function handleSend() {
    if (!task || !course) return;
    setSending(true);
    setError(null);

    try {
      const submittedData = { courseId: course.courseId, lessons: selectedLessons };

      const res = await fetch(`/api/seletor/submissoes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submittedData }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json.error ?? "Erro ao enviar revisão.");
        return;
      }

      try { localStorage.removeItem(`seletor-draft-${id}`); } catch { /* ignora */ }
      setStep(4);
    } catch {
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <p className="text-muted-foreground text-sm">Carregando...</p>
      </main>
    );
  }

  if (!task || !course) {
    return (
      <main className="flex flex-1 items-center justify-center flex-col gap-4">
        <p className="text-muted-foreground">Tarefa não encontrada.</p>
        <button
          onClick={() => router.push("/seletor-de-atividades/tarefas")}
          className="text-primary text-sm hover:underline"
        >
          Voltar
        </button>
      </main>
    );
  }

  // Tarefa já enviada
  if (task.status === "reviewed" || task.status === "exported") {
    const reviewedLessons = Array.isArray((task.submittedData as { lessons?: Lesson[] }).lessons)
      ? (task.submittedData as { lessons: Lesson[] }).lessons
      : [];
    return (
      <div className="flex flex-col flex-1">
        <header className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-xs">
              Enviado para {task.coordinator.name}
            </p>
            <h1 className="font-heading font-bold text-primary text-lg leading-tight">
              {task.courseId}
              {version && <span className="ml-1.5 text-sm font-normal text-muted-foreground">· v{version}</span>}
            </h1>
            <span className={`text-xs ${task.status === "exported" ? "text-green-600 dark:text-green-400" : "text-yellow-600 dark:text-yellow-400"}`}>
              {task.status === "exported" ? "exportado pelo coordenador" : "revisão enviada"}
            </span>
          </div>
          <button
            onClick={() => router.push("/seletor-de-atividades/tarefas")}
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            ← Voltar
          </button>
        </header>
        <main className="flex flex-col gap-4 px-6 py-6 max-w-3xl mx-auto w-full flex-1">
          <p className="text-muted-foreground text-sm">
            Você selecionou {reviewedLessons.reduce((acc, l) => acc + l.exercises.length, 0)} exercício(s) em {reviewedLessons.length} aula(s).
          </p>
          {reviewedLessons.map((lesson) => (
            <LessonAccordion key={lesson.lessonNumber} lesson={lesson} readOnly defaultOpen={false} />
          ))}
        </main>
      </div>
    );
  }

  // Tela de sucesso (passo 4)
  if (step === 4) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16 max-w-lg mx-auto w-full">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-3xl">
            ✓
          </div>
          <h1 className="font-heading text-3xl font-bold text-primary">
            Revisão enviada!
          </h1>
          <p className="text-muted-foreground">
            {task.coordinator.name} receberá sua revisão.
          </p>
        </div>
        <button
          onClick={() => router.push("/seletor-de-atividades/tarefas")}
          className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold px-8 py-3 rounded-xl transition-colors"
        >
          Ver minhas tarefas
        </button>
      </main>
    );
  }

  const totalSelected = selectedLessons.reduce((acc, l) => acc + l.exercises.length, 0);

  const annotatedLessons = course.lessons.map((lesson) => {
    const selectedLesson = selectedLessons.find(
      (sl) => sl.lessonNumber === lesson.lessonNumber
    );
    return {
      ...lesson,
      exercises: lesson.exercises.map((ex) => ({
        ...ex,
        isSelected: selectedLesson?.exercises.some((se) => se.id === ex.id) ?? false,
      })),
    };
  });

  return (
    <div className="flex flex-col flex-1">
      <header className="sticky top-0 z-10 bg-background border-b border-border px-6 py-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-muted-foreground text-xs">
              Tarefa de {task.coordinator.name}
            </p>
            <h1 className="font-heading font-bold text-primary text-lg leading-tight">
              {task.courseId}
              {version && <span className="ml-1.5 text-sm font-normal text-muted-foreground">· v{version}</span>}
            </h1>
          </div>
          <button
            onClick={() => router.push("/seletor-de-atividades/tarefas")}
            className="text-muted-foreground hover:text-foreground text-sm transition-colors"
          >
            ← Sair
          </button>
        </div>
        <div className="max-w-lg mx-auto w-full">
          <StepBar steps={STEPS} current={step} />
        </div>
      </header>

      {/* Step 1: Seleção */}
      {step === 1 && (
        <>
          <main className="flex flex-col gap-4 px-6 py-6 max-w-3xl mx-auto w-full flex-1">
            {hasDraft && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <p className="text-sm text-foreground/70">Suas seleções anteriores foram restauradas.</p>
                <button
                  onClick={() => {
                    clearAll();
                    setCourse(task!.originalData);
                    localStorage.removeItem(`seletor-draft-${id}`);
                    setHasDraft(false);
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 shrink-0 transition-colors"
                >
                  Começar do zero
                </button>
              </div>
            )}
            <p className="text-muted-foreground text-sm">
              Selecione ao menos uma atividade por aula.{" "}
              <span className="text-muted-foreground/70">Você poderá editá-las no próximo passo.</span>
            </p>
            {annotatedLessons.map((lesson) => (
              <LessonAccordion
                key={lesson.lessonNumber}
                lesson={lesson}
                selectable
                onToggle={toggleExercise}
              />
            ))}
          </main>
          <footer className="sticky bottom-0 bg-card border-t border-border px-6 py-4">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Selecionadas</span>
                <span className="text-primary font-bold">
                  {totalSelected} atividade{totalSelected !== 1 ? "s" : ""}
                </span>
                {error && <span className="text-destructive text-xs mt-1">{error}</span>}
              </div>
              <button
                onClick={handleNextFromSelection}
                className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold px-8 py-3 rounded-xl transition-colors"
              >
                Próximo →
              </button>
            </div>
          </footer>
        </>
      )}

      {/* Step 2: Edição */}
      {step === 2 && (
        <>
          <main className="flex flex-col gap-4 px-6 py-6 max-w-3xl mx-auto w-full flex-1">
            <p className="text-muted-foreground text-sm">
              Edite os exercícios selecionados e adicione comentários se necessário.
            </p>
            {selectedLessons.map((lesson) => (
              <LessonAccordion
                key={lesson.lessonNumber}
                lesson={lesson}
                editable
                comments={comments}
                onCommentChange={updateComment}
                onExerciseChange={updateExercise}
                onAlternativeChange={updateAlternative}
                defaultOpen
              />
            ))}
          </main>
          <footer className="sticky bottom-0 bg-card border-t border-border px-6 py-4">
            <div className="max-w-3xl mx-auto flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="border border-border hover:border-border/80 text-muted-foreground hover:text-foreground font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                ← Voltar para seleção
              </button>
              <button
                onClick={() => setStep(3)}
                className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold px-8 py-3 rounded-xl transition-colors"
              >
                Próximo →
              </button>
            </div>
          </footer>
        </>
      )}

      {/* Step 3: Confirmar e enviar */}
      {step === 3 && (
        <main className="flex flex-col items-center justify-center flex-1 gap-8 px-6 py-16 max-w-lg mx-auto w-full">
          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="font-heading text-2xl font-bold text-primary">
              Pronto para enviar?
            </h2>
            <p className="text-muted-foreground text-sm">
              {totalSelected} exercício{totalSelected !== 1 ? "s" : ""} selecionado{totalSelected !== 1 ? "s" : ""} em {selectedLessons.length} aula{selectedLessons.length !== 1 ? "s" : ""}
            </p>
            <p className="text-muted-foreground text-sm">
              Enviando para <span className="text-foreground">{task.coordinator.name}</span>
            </p>
            <p className="text-xs text-muted-foreground/70 bg-muted/50 rounded-xl px-4 py-3 mt-2 max-w-sm">
              Após o envio, você não poderá editar suas seleções. Se precisar de alguma alteração, o coordenador precisará reenviar as atividades para você.
            </p>
          </div>

          {error && (
            <p className="text-destructive text-sm text-center bg-destructive/10 px-4 py-3 rounded-lg w-full">
              {error}
            </p>
          )}

          <div className="flex gap-3 w-full">
            <button
              onClick={() => setStep(2)}
              className="flex-1 border border-border hover:border-border/80 text-muted-foreground hover:text-foreground font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              ← Voltar
            </button>
            <button
              onClick={handleSend}
              disabled={sending}
              className="flex-1 bg-primary hover:bg-primary/80 disabled:opacity-50 text-primary-foreground font-bold px-8 py-3 rounded-xl transition-colors"
            >
              {sending ? "Enviando..." : `Enviar para ${task.coordinator.name}`}
            </button>
          </div>
        </main>
      )}
    </div>
  );
}

export default function TarefaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense>
      <TarefaDetailContent params={params} />
    </Suspense>
  );
}
