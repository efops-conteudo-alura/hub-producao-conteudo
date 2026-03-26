"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PrimeiroAcessoPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirm = formData.get("confirm") as string;

    if (password !== confirm) {
      setError("As senhas não coincidem.");
      return;
    }
    if (password.length < 8) {
      setError("A senha deve ter ao menos 8 caracteres.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/seletor/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Erro ao criar conta.");
      return;
    }

    router.push("/login?msg=conta-criada");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-6">
    <div className="w-full max-w-md bg-card rounded-2xl border border-border p-8 flex flex-col gap-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="font-heading text-2xl font-bold">
          Criar conta
        </h1>
        <p className="text-muted-foreground text-sm">
          Primeiro acesso ao Seletor de Atividades
        </p>
        <p className="text-muted-foreground/60 text-xs mt-1">
          Se você já tem conta no Hub de Produção, use o mesmo email e senha.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="name" className="text-sm text-foreground/70">
            Nome completo
          </label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="Seu nome"
            required
            className="rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm text-foreground/70">
            Email Alura
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="seu@alura.com.br"
            required
            className="rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm text-foreground/70">
            Senha
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Mínimo 8 caracteres"
            required
            className="rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="confirm" className="text-sm text-foreground/70">
            Confirmar senha
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            placeholder="••••••••"
            required
            className="rounded-lg bg-background border border-border px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary"
          />
        </div>

        {error && (
          <p className="text-destructive text-sm bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-primary hover:bg-primary/80 disabled:opacity-50 text-primary-foreground font-bold py-3 rounded-xl transition-colors"
        >
          {loading ? "Criando conta..." : "Criar conta"}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/login" className="underline hover:text-foreground">
            Entrar
          </Link>
        </p>
      </form>
    </div>
    </div>
  );
}
