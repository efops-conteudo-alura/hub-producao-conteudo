"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Instrutor {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export default function InstrutoresPage() {
  const [instrutores, setInstrutores] = useState<Instrutor[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch("/api/seletor/instrutores")
      .then((r) => r.json())
      .then((data) => setInstrutores(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    const res = await fetch("/api/seletor/instrutores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Erro ao cadastrar instrutor.");
      return;
    }

    setInstrutores((prev) => [
      { id: data.id, name: data.name, email: data.email, createdAt: new Date().toISOString() },
      ...prev,
    ]);
    setName("");
    setEmail("");
    setSuccess(`${data.name} cadastrado. Compartilhe o link do app e peça que ele entre com o email.`);
  }

  return (
    <main className="flex flex-1 flex-col px-6 py-10 max-w-2xl mx-auto w-full gap-8">
      <div className="flex items-center gap-4">
        <Link
          href="/seletor-de-atividades/upload"
          className="text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          ← Voltar
        </Link>
        <h1 className="font-heading text-2xl font-bold text-foreground">
          Instrutores
        </h1>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 flex flex-col gap-4">
        <h2 className="font-semibold text-foreground text-sm uppercase tracking-wide">
          Adicionar instrutor
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary"
          />
          <input
            type="email"
            placeholder="Email do instrutor"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary"
          />
          {error && (
            <p className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
          )}
          {success && (
            <p className="text-primary text-sm bg-primary/10 px-3 py-2 rounded-lg">{success}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-primary/80 disabled:opacity-50 text-primary-foreground font-bold py-2 rounded-xl transition-colors text-sm"
          >
            {loading ? "Cadastrando..." : "Cadastrar instrutor"}
          </button>
        </form>
        <p className="text-muted-foreground text-xs">
          O instrutor entra no app apenas com o email — sem precisar criar senha.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-semibold text-foreground text-sm uppercase tracking-wide">
          {instrutores.length} {instrutores.length === 1 ? "instrutor" : "instrutores"} cadastrados
        </h2>
        {instrutores.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nenhum instrutor cadastrado ainda.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {instrutores.map((i) => (
              <div
                key={i.id}
                className="flex items-center justify-between bg-card rounded-xl border border-border px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{i.name}</p>
                  <p className="text-xs text-muted-foreground">{i.email}</p>
                </div>
                <p className="text-xs text-muted-foreground/50">
                  {new Date(i.createdAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
