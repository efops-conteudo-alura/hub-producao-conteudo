import type { NextAuthConfig } from "next-auth";

// Config leve: sem Prisma, sem bcryptjs — usada no middleware (Edge runtime)
export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth: session, request }) {
      const pathname = request.nextUrl.pathname;
      // Usuário não autenticado → redireciona para login (padrão NextAuth)
      if (!session) return false;
      const isInstructor = session.user?.role === "INSTRUCTOR";
      if (
        isInstructor &&
        !pathname.startsWith("/seletor-de-atividades") &&
        !pathname.startsWith("/api/")
      ) {
        return Response.redirect(
          new URL("/seletor-de-atividades/tarefas", request.url)
        );
      }
      return true;
    },
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as { role: string }).role;
      }
      if (trigger === "update" && session) {
        if (session.name !== undefined) token.name = session.name;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  providers: [], // providers completos ficam em auth.ts
};
