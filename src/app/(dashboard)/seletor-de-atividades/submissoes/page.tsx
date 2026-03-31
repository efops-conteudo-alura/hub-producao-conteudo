"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Submission {
  id: string;
  courseId: string;
  status: string;
  instructor: { name: string; email: string };
  coordinator: { name: string; email: string };
  createdAt: string;
  exportedAt: string | null;
}

function statusLabel(status: string) {
  if (status === "exported") return "exportado";
  if (status === "reviewed") return "revisado";
  return "pendente";
}

function statusClass(status: string) {
  if (status === "exported") return "bg-green-500/10 text-green-600 dark:text-green-400";
  if (status === "reviewed") return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
  return "bg-red-500/10 text-red-600 dark:text-red-400";
}

export default function SubmissoesPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/seletor/submissoes")
      .then((r) => r.json())
      .then((data) => {
        setSubmissions(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await fetch(`/api/seletor/submissoes/${id}`, { method: "DELETE" });
    if (res.ok) {
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    }
    setDeletingId(null);
    setConfirmId(null);
  }

  return (
    <main className="flex flex-1 flex-col px-6 py-10 max-w-3xl mx-auto w-full gap-6">
      <div className="flex items-center justify-between">
        <h1 className="hub-page-title">
          Submissões
        </h1>
        <button
          onClick={() => router.push("/seletor-de-atividades/upload")}
          className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
        >
          + Nova submissão
        </button>
      </div>

      {loading && (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      )}

      {!loading && submissions.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Nenhuma tarefa criada ainda.
        </p>
      )}

      {!loading && submissions.length > 0 && (
        <div className="flex flex-col gap-3">
          {submissions.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-3 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors px-5"
            >
              <Link
                href={`/seletor-de-atividades/submissoes/${s.id}`}
                className="flex flex-1 flex-col gap-0.5 py-4"
              >
                <p className="text-sm font-medium text-foreground">{s.courseId}</p>
                <p className="text-xs text-muted-foreground">
                  {s.instructor.name} · {new Date(s.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </Link>

              <span className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${statusClass(s.status)}`}>
                {statusLabel(s.status)}
              </span>

              {confirmId === s.id ? (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={deletingId === s.id}
                    className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors disabled:opacity-50"
                  >
                    {deletingId === s.id ? "..." : "Confirmar"}
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="text-xs px-2 py-1.5 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmId(s.id)}
                  className="w-5 shrink-0 text-center text-muted-foreground/30 hover:text-destructive transition-colors text-lg leading-none"
                  title="Excluir submissão"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
