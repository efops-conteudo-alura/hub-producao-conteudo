"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contaCriada = searchParams.get("msg") === "conta-criada";
  const senhaCriada = searchParams.get("msg") === "senha-criada";
  const acessoAtivado = searchParams.get("msg") === "acesso-ativado";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const result = await signIn("credentials", { email, password, redirect: false });

    setLoading(false);

    if (result?.error) {
      // NextAuth v5 sanitiza erros customizados — verificamos via endpoint dedicado
      const checkRes = await fetch(`/api/auth/check-email?email=${encodeURIComponent(email)}`);
      const { status } = await checkRes.json();

      if (status === "needs_password") {
        setError("Sua conta ainda não tem senha cadastrada. Crie uma senha para continuar.");
      } else if (status === "no_access") {
        setError("Você não tem acesso a este sistema. Contacte um administrador.");
      } else {
        setError("Email ou senha inválidos.");
      }
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-light">Hub de Produção de Conteúdo</CardTitle>
          <CardDescription>
            Entre com suas credenciais para continuar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
              />
            </div>
            {(contaCriada || senhaCriada || acessoAtivado) && !error && (
              <p className="text-sm text-green-600 bg-green-600/10 px-3 py-2 rounded-lg">
                {senhaCriada
                  ? "Senha criada! Faça login para continuar."
                  : acessoAtivado
                  ? "Acesso ativado! Você já tem uma conta — entre com a senha que você usa normalmente."
                  : "Conta criada com sucesso! Faça login para continuar."}
              </p>
            )}
            {error && (
              <p className="text-sm text-destructive">
                {error}{" "}
                {error.includes("senha cadastrada") && (
                  <Link href="/criar-senha" className="underline font-medium">
                    Criar senha agora
                  </Link>
                )}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Primeiro acesso?{" "}
              <Link href="/primeiro-acesso" className="underline">
                Criar conta
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
