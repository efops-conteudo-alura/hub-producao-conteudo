"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { GuideModal } from "../_components/GuideModal";

interface Task {
  id: string;
  courseId: string;
  status: string;
  coordinator: { name: string; email: string };
  createdAt: string;
}

function statusLabel(status: string) {
  if (status === "reviewed") return "enviado";
  if (status === "exported") return "exportado";
  return "pendente";
}

function statusClass(status: string) {
  if (status === "exported") return "bg-green-500/10 text-green-600 dark:text-green-400";
  if (status === "reviewed") return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
  return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
}

export default function TarefasPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/seletor/submissoes")
      .then((r) => r.json())
      .then((data) => {
        setTasks(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const pending = tasks.filter((t) => t.status === "pending");
  const done = tasks.filter((t) => t.status !== "pending");

  return (
    <main className="flex flex-1 flex-col px-6 py-10 max-w-3xl mx-auto w-full gap-6">
      <div className="flex items-center gap-3">
        <h1 className="hub-page-title">
          Minhas tarefas
        </h1>
        <GuideModal role="instructor" />
      </div>

      {loading && (
        <p className="text-muted-foreground text-sm">Carregando...</p>
      )}

      {!loading && tasks.length === 0 && (
        <p className="text-muted-foreground text-sm">
          Nenhuma tarefa atribuída a você ainda.
        </p>
      )}

      {!loading && pending.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Para revisar
          </h2>
          {pending.map((t) => (
            <Link
              key={t.id}
              href={`/seletor-de-atividades/tarefas/${t.id}`}
              className="flex items-center justify-between bg-card rounded-xl border border-border px-5 py-4 hover:border-primary/30 transition-colors"
            >
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium text-foreground">{t.courseId}</p>
                <p className="text-xs text-muted-foreground">
                  {t.coordinator.name} · {new Date(t.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusClass(t.status)}`}>
                {statusLabel(t.status)}
              </span>
            </Link>
          ))}
        </section>
      )}

      {!loading && done.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wide">
            Concluídas
          </h2>
          {done.map((t) => (
            <Link
              key={t.id}
              href={`/seletor-de-atividades/tarefas/${t.id}`}
              className="flex items-center justify-between bg-card/60 rounded-xl border border-border px-5 py-4 opacity-70 hover:opacity-100 hover:border-primary/30 transition-all"
            >
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium text-foreground">{t.courseId}</p>
                <p className="text-xs text-muted-foreground">
                  {t.coordinator.name} · {new Date(t.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusClass(t.status)}`}>
                {statusLabel(t.status)}
              </span>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
