"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DropZone } from "../_components/DropZone";
import { StepBar } from "../_components/StepBar";
import type { Course } from "@/types/course";

const STEPS = ["Upload", "Instrutor", "Enviado"];

interface Instructor {
  id: string;
  name: string;
  email: string;
}

type Mode = "existing" | "new";

export default function UploadPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [selectedInstructorId, setSelectedInstructorId] = useState("");

  const [mode, setMode] = useState<Mode>("existing");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch("/api/seletor/instrutores")
      .then((r) => r.json())
      .then((data) => setInstructors(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  function normalizeNewFormat(parsed: Record<string, unknown>): Course {
    type NewAlt = { body?: string; justification?: string; correct?: boolean };
    type NewActivity = {
      id?: string;
      type?: string;
      taskEnum?: string;
      dataTag?: string;
      title?: string;
      body?: string;
      opinion?: string;
      alternatives?: NewAlt[];
    };
    type NewSection = { title?: string; activities?: NewActivity[] };

    const sections = (parsed.sections as NewSection[]) ?? [];
    const lessons = sections
      .map((section, idx) => {
        const activities = (section.activities ?? []).filter(
          (a) => a.taskEnum !== "VIDEO" && a.type !== "VIDEO"
        );
        if (activities.length === 0) return null;
        return {
          lessonNumber: idx + 1,
          title: section.title,
          exercises: activities.map((a) => ({
            id: a.id ?? crypto.randomUUID(),
            title: a.title ?? "",
            text: a.body ?? "",
            kind: a.taskEnum ?? "",
            dataTag: a.dataTag,
            sampleAnswer: a.opinion,
            alternatives: (a.alternatives ?? []).map((alt) => ({
              text: alt.body ?? "",
              correct: alt.correct ?? false,
              opinion: alt.justification ?? "",
            })),
          })),
        };
      })
      .filter((l): l is NonNullable<typeof l> => l !== null);

    return { courseId: (parsed.courseId as string) ?? "", lessons };
  }

  function handleFile(content: string) {
    setError(null);
    try {
      const parsed: Record<string, unknown> = JSON.parse(content);

      if (!parsed.courseId) {
        setError("O arquivo JSON não tem o formato esperado (campo courseId ausente).");
        return;
      }

      let course: Course;

      if (Array.isArray(parsed.sections)) {
        // Formato da plataforma Alura (sections/activities)
        course = normalizeNewFormat(parsed);
        if (course.lessons.length === 0) {
          setError("Nenhuma atividade válida encontrada no arquivo (apenas vídeos ou seções vazias).");
          return;
        }
      } else if (Array.isArray(parsed.lessons)) {
        // Formato antigo (lessons/exercises)
        const raw = parsed as unknown as Course;
        course = {
          ...raw,
          lessons: raw.lessons.map((lesson) => ({
            ...lesson,
            exercises: lesson.exercises.map((ex) => ({
              ...ex,
              id: ex.id ?? crypto.randomUUID(),
            })),
          })),
        };
      } else {
        setError("O arquivo JSON não tem o formato esperado (courseId + lessons ou courseId + sections).");
        return;
      }

      setCourse(course);
      setStep(2);
    } catch {
      setError("Não foi possível ler o arquivo JSON.");
    }
  }

  async function handleSend() {
    if (!course) return;
    setSending(true);
    setError(null);

    try {
      let instructorId = selectedInstructorId;

      if (mode === "new") {
        if (!newName.trim() || !newEmail.trim()) {
          setError("Preencha o nome e o email do novo instrutor.");
          setSending(false);
          return;
        }

        const createRes = await fetch("/api/seletor/instrutores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newName.trim(), email: newEmail.trim() }),
        });

        if (createRes.status === 409) {
          setError("Este email já é um instrutor cadastrado. Use a opção 'Instrutor existente' para selecioná-lo.");
          setSending(false);
          return;
        }

        if (!createRes.ok) {
          const json = await createRes.json();
          setError(json.error ?? "Erro ao cadastrar instrutor.");
          setSending(false);
          return;
        }

        const created = await createRes.json();
        instructorId = created.id;
        setInstructors((prev) => [{ id: created.id, name: created.name, email: created.email }, ...prev]);
      }

      if (!instructorId) {
        setError("Selecione ou cadastre um instrutor.");
        setSending(false);
        return;
      }

      const res = await fetch("/api/seletor/submissoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instructorId, originalData: course }),
      });

      if (!res.ok) {
        let errorMsg = "Erro ao criar submissão.";
        try {
          const json = await res.json();
          errorMsg = json.error ?? errorMsg;
        } catch {
          errorMsg = `Erro no servidor (${res.status}). Tente novamente.`;
        }
        setError(errorMsg);
        setSending(false);
        return;
      }

      setStep(3);
    } catch {
      setError("Erro de conexão. Verifique sua internet e tente novamente.");
      setSending(false);
    }
  }

  const canSend =
    mode === "existing" ? !!selectedInstructorId : !!newName.trim() && !!newEmail.trim();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 px-6 py-16 max-w-lg mx-auto w-full">
      <StepBar steps={STEPS} current={step} />

      {/* Step 1: Upload */}
      {step === 1 && (
        <>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="hub-page-title">
              Upload do arquivo
            </h1>
            <p className="text-muted-foreground">
              Faça upload do arquivo JSON com todas as atividades do curso.
            </p>
          </div>

          <div className="w-full">
            <DropZone onFile={handleFile} onError={setError} />
          </div>

          {error && (
            <p className="text-destructive text-sm text-center bg-destructive/10 px-4 py-3 rounded-lg w-full">
              {error}
            </p>
          )}

          <button
            onClick={() => router.push("/seletor-de-atividades/submissoes")}
            className="text-muted-foreground text-sm hover:text-foreground transition-colors"
          >
            ← Voltar
          </button>
        </>
      )}

      {/* Step 2: Selecionar ou cadastrar instrutor */}
      {step === 2 && course && (
        <>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="hub-page-title">
              Selecionar instrutor
            </h1>
            <p className="text-muted-foreground">
              Curso: <span className="text-foreground">{course.courseId}</span>
            </p>
            <p className="text-muted-foreground text-sm">
              {course.lessons.length} aula{course.lessons.length !== 1 ? "s" : ""} ·{" "}
              {course.lessons.reduce((acc, l) => acc + l.exercises.length, 0)} exercícios
            </p>
          </div>

          <div className="w-full flex rounded-xl overflow-hidden border border-border">
            <button
              onClick={() => { setMode("existing"); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                mode === "existing"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Instrutor existente
            </button>
            <button
              onClick={() => { setMode("new"); setError(null); }}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                mode === "new"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Novo instrutor
            </button>
          </div>

          <div className="w-full flex flex-col gap-3">
            {mode === "existing" && (
              <>
                <label className="text-muted-foreground text-sm">
                  Quem vai revisar este curso?
                </label>
                <select
                  value={selectedInstructorId}
                  onChange={(e) => setSelectedInstructorId(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary/50 transition-colors"
                >
                  <option value="">Selecione um instrutor...</option>
                  {instructors.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} — {inst.email}
                    </option>
                  ))}
                </select>
                {instructors.length === 0 && (
                  <p className="text-muted-foreground text-xs">
                    Nenhum instrutor cadastrado ainda. Use a aba &quot;Novo instrutor&quot; para cadastrar.
                  </p>
                )}
              </>
            )}

            {mode === "new" && (
              <>
                <p className="text-muted-foreground text-xs">
                  O instrutor será cadastrado automaticamente. O login dele será feito apenas via e-mail.
                </p>
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 transition-colors"
                />
              </>
            )}
          </div>

          {error && (
            <p className="text-destructive text-sm text-center bg-destructive/10 px-4 py-3 rounded-lg w-full">
              {error}
            </p>
          )}

          <div className="flex gap-3 w-full">
            <button
              onClick={() => { setStep(1); setError(null); }}
              className="flex-1 border border-border hover:border-border/80 text-muted-foreground hover:text-foreground font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              ← Voltar
            </button>
            <button
              onClick={handleSend}
              disabled={!canSend || sending}
              className="flex-1 bg-primary hover:bg-primary/80 disabled:opacity-50 text-primary-foreground font-bold px-8 py-3 rounded-xl transition-colors"
            >
              {sending ? "Enviando..." : "Enviar submissão"}
            </button>
          </div>
        </>
      )}

      {/* Step 3: Sucesso */}
      {step === 3 && (
        <>
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-3xl">
              ✓
            </div>
            <h1 className="hub-page-title">
              Submissão enviada!
            </h1>
            <p className="text-muted-foreground">
              O instrutor verá a tarefa ao entrar no app.
            </p>
          </div>

          <button
            onClick={() => router.push("/seletor-de-atividades/submissoes")}
            className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold px-8 py-3 rounded-xl transition-colors"
          >
            Ver submissões
          </button>
        </>
      )}
    </main>
  );
}
